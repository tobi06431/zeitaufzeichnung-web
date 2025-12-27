/* Storage helpers: profile + times + panel state - SERVER-BASIERT */

// CSRF-Token aus Meta-Tag oder Cookie holen
function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) return meta.content;
  
  // Fallback: Aus verstecktem Input im Formular
  const input = document.querySelector('input[name="csrf_token"]');
  return input ? input.value : '';
}

// Aktueller Monat/Jahr als Key (z.B. "12-2025")
function getCurrentMonthYear() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${month}-${year}`;
}

// Monat/Jahr aus dem Formular (z.B. "12-2025") - VERWENDET FÜR SPEICHERUNG
function getSelectedMonthYear() {
  const monatjahrEl = document.getElementById('monatjahr_input');
  if (monatjahrEl && monatjahrEl.value) {
    // Konvertiere "12/2025" zu "12-2025"
    return monatjahrEl.value.replace('/', '-');
  }
  // Fallback auf aktuellen Monat
  return getCurrentMonthYear();
}

// ========== SERVER-BASIERTE SPEICHERUNG (OHNE LocalStorage für Daten) ==========

async function saveAllFormData() {
  const monthYear = getSelectedMonthYear();
  
  // Sammle alle Formulardaten
  const formData = {};
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.name && el.name !== 'csrf_token' && el.name !== 'action') {
      formData[el.name] = el.value;
    }
  });
  
  // Listen direkt aus window-Objekten holen (nicht aus LocalStorage!)
  if (window.gottesdienste && window.gottesdienste.length > 0) {
    formData['_gottesdienste_list'] = JSON.stringify(window.gottesdienste);
    console.log('📦 Gottesdienste zum Speichern:', window.gottesdienste.length);
  }
  
  if (window.arbeitszeiten && window.arbeitszeiten.length > 0) {
    formData['_arbeitszeiten_list'] = JSON.stringify(window.arbeitszeiten);
    console.log('📦 Arbeitszeiten zum Speichern:', window.arbeitszeiten.length);
  }
  
  console.log('💾 Speichere Daten:', { monthYear, fieldCount: Object.keys(formData).length });
  
  try {
    const response = await fetch(`/api/timerecords/${monthYear}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        form_data: JSON.stringify(formData)
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // Speichere Server-Timestamp im LocalStorage
      const timestampKey = `za_timestamp_${monthYear}`;
      localStorage.setItem(timestampKey, result.updated_at || new Date().toISOString());
      console.log('✅ Daten gespeichert, Timestamp:', result.updated_at);
    } else {
      console.error('❌ Fehler beim Speichern:', result.message);
    }
  } catch (error) {
    console.error('❌ Speichern fehlgeschlagen:', error);
  }
}

async function loadAllFormData() {
  const monthYear = getSelectedMonthYear();
  
  console.log('📥 Lade Daten für:', monthYear);
  
  try {
    const response = await fetch(`/api/timerecords/${monthYear}`);
    const result = await response.json();
    
    if (!result.success || !result.record) {
      console.log('ℹ️ Keine gespeicherten Daten gefunden');
      return false;
    }
    
    console.log('✅ Server-Daten gefunden');
    const formData = JSON.parse(result.record.form_data);
    
    console.log('✅ Daten geladen:', { 
      fieldCount: Object.keys(formData).length,
      hasGottesdienste: '_gottesdienste_list' in formData,
      hasArbeitszeiten: '_arbeitszeiten_list' in formData
    });
    
    // Formulardaten wiederherstellen
    Object.keys(formData).forEach(name => {
      // Listen-Daten
      if (name === '_gottesdienste_list') {
        try {
          window.gottesdienste = JSON.parse(formData[name]);
          console.log('✅ Gottesdienste geladen:', window.gottesdienste.length);
          // Rendern
          window.updateListe && window.updateListe();
        } catch (e) {
          console.error('❌ Fehler beim Laden der Gottesdienste:', e);
          window.gottesdienste = [];
        }
        return;
      }
      
      if (name === '_arbeitszeiten_list') {
        try {
          window.arbeitszeiten = JSON.parse(formData[name]);
          console.log('✅ Arbeitszeiten geladen:', window.arbeitszeiten.length);
          // Rendern
          window.updateAZListe && window.updateAZListe();
        } catch (e) {
          console.error('❌ Fehler beim Laden der Arbeitszeiten:', e);
          window.arbeitszeiten = [];
        }
        return;
      }
      
      // Normale Formularfelder
      const el = document.getElementById(name) || document.querySelector(`[name="${name}"]`);
      if (el) {
        el.value = formData[name];
        // Trigger Events um abhängige Logik zu aktualisieren
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    // Zusammenfassung aktualisieren
    window.updateSummary && window.updateSummary();
    
    // Timestamp speichern
    const timestampKey = `za_timestamp_${monthYear}`;
    localStorage.setItem(timestampKey, result.record.updated_at);
    
    console.log('✅ Alle Daten vom Server geladen');
    return true;
      
  } catch (error) {
    console.error('❌ Fehler beim Laden:', error);
    return false;
  }
}

// Auto-Save alle 45 Sekunden (Kompromiss: Performance + Datensicherheit)
let autoSaveInterval;
function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  
  autoSaveInterval = setInterval(() => {
    saveAllFormData();
  }, 45000); // 45 Sekunden
}

// Bei Änderungen speichern (debounced - Kompromiss: Performance + Datensicherheit)
let saveTimeout;
function triggerSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveAllFormData();
  }, 3000); // 3 Sekunden nach letzter Änderung
}

// ========== LEGACY: Profil-Felder (weiterhin LocalStorage für schnelle UI) ==========

const STORAGE_KEY_PROFILE = "za_profile_v1";

function saveProfileField(id, value) {
  const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
  const obj = raw ? JSON.parse(raw) : {};
  obj[id] = value;
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(obj));
  
  // Trigger server save
  triggerSave();
}

function loadProfileField(id) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    const obj = raw ? JSON.parse(raw) : {};
    return obj[id] || "";
  } catch {
    return "";
  }
}

function getWeekdayKey(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()];
}

function getTimesStorageKey() {
  const pEl = document.getElementById("kirchengemeinde_input");
  const p = (pEl && pEl.value) ? pEl.value.trim() : "";
  const pref = p || "UNBEKANNT_PFARREI";
  return `za_times_v1|${pref}`;
}

function loadTimesMap() {
  try {
    const raw = localStorage.getItem(getTimesStorageKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTimesMap(map) {
  localStorage.setItem(getTimesStorageKey(), JSON.stringify(map));
  triggerSave();
}

function buildTimesKey(kirchort, datum) {
  const k = (kirchort || "").trim().replace(/\s+/g, " ").replace(/[|]/g, "");
  const w = getWeekdayKey(datum);
  return k && w ? `${k}|${w}` : "";
}

function saveTimesForEntry(kirchort, datum, beginn, ende, satz) {
  const key = buildTimesKey(kirchort, datum);
  if (!key) return;

  const map = loadTimesMap();
  map[key] = { beginn, ende, satz };
  saveTimesMap(map);
}

// Export to global scope
window.getCsrfToken = getCsrfToken;
window.getCurrentMonthYear = getCurrentMonthYear;
window.getSelectedMonthYear = getSelectedMonthYear;
window.saveAllFormData = saveAllFormData;
window.loadAllFormData = loadAllFormData;
window.startAutoSave = startAutoSave;
window.triggerSave = triggerSave;
window.saveProfileField = saveProfileField;
window.loadProfileField = loadProfileField;
window.getWeekdayKey = getWeekdayKey;
window.getTimesStorageKey = getTimesStorageKey;
window.loadTimesMap = loadTimesMap;
window.saveTimesMap = saveTimesMap;
window.buildTimesKey = buildTimesKey;
window.saveTimesForEntry = saveTimesForEntry;

