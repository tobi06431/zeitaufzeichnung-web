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

// ========== SERVER-BASIERTE SPEICHERUNG ==========

async function saveAllFormData() {
  const monthYear = getSelectedMonthYear();
  
  // Sammle alle Formulardaten
  const formData = {};
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.name && el.name !== 'csrf_token' && el.name !== 'action') {
      formData[el.name] = el.value;
    }
  });
  
  // WICHTIG: Auch die gespeicherten Listen (Gottesdienste & Arbeitszeiten) übertragen
  const storageKey = window.getStorageKey ? window.getStorageKey() : '';
  if (storageKey) {
    const gottesdiensteData = localStorage.getItem(storageKey);
    if (gottesdiensteData) {
      formData['_gottesdienste_list'] = gottesdiensteData;
    }
  }
  
  const azKey = window.getAZStorageKey ? window.getAZStorageKey() : '';
  if (azKey) {
    const arbeitszeitenData = localStorage.getItem(azKey);
    if (arbeitszeitenData) {
      formData['_arbeitszeiten_list'] = arbeitszeitenData;
    }
  }
  
  // Times-Map auch speichern
  const timesKey = getTimesStorageKey();
  if (timesKey) {
    const timesData = localStorage.getItem(timesKey);
    if (timesData) {
      formData['_times_map'] = timesData;
    }
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
    
    if (result.success && result.record) {
      const serverTimestamp = result.record.updated_at;
      const timestampKey = `za_timestamp_${monthYear}`;
      const localTimestamp = localStorage.getItem(timestampKey);
      
      // Vergleiche Timestamps
      const serverDate = serverTimestamp ? new Date(serverTimestamp) : new Date(0);
      const localDate = localTimestamp ? new Date(localTimestamp) : new Date(0);
      
      // Nur überspringen wenn lokaler Timestamp SEHR frisch ist (< 5 Sekunden alt)
      // Das bedeutet: User arbeitet gerade aktiv an diesem Gerät
      const now = new Date();
      const localAge = now - localDate; // Millisekunden
      
      if (localDate > serverDate && localAge < 5000) {
        console.log('⚠️ Lokale Daten sind sehr frisch (< 5 Sek) - überspringe Laden');
        console.log(`   Lokal: ${localTimestamp}, Server: ${serverTimestamp}, Alter: ${Math.round(localAge/1000)}s`);
        // Trigger Save um lokale Daten zum Server zu pushen
        setTimeout(() => saveAllFormData(), 1000);
        return false;
      }
      
      console.log('✅ Lade Daten vom Server (Server neuer oder lokale Daten veraltet)');
      console.log(`   Server: ${serverTimestamp}, Lokal: ${localTimestamp || 'keine'}, Lokal-Alter: ${Math.round(localAge/1000)}s`);
      
      const formData = JSON.parse(result.record.form_data);
      
      console.log('✅ Daten geladen:', { fieldCount: Object.keys(formData).length });
      
      // WICHTIG: Erst normale Felder befüllen (Pfarrei, Tätigkeit, Monat)
      // DANN Listen, weil Storage-Keys von diesen Feldern abhängen!
      const normalFields = [];
      const listFields = [];
      
      Object.keys(formData).forEach(name => {
        if (name.startsWith('_')) {
          listFields.push(name);
        } else {
          normalFields.push(name);
        }
      });
      
      // PHASE 1: Normale Formularfelder befüllen
      normalFields.forEach(name => {
        const el = document.getElementById(name);
        if (el) {
          el.value = formData[name];
          // Trigger change event für abhängige Logik
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      console.log('✅ Normale Felder befüllt, Storage-Keys sollten jetzt korrekt sein');
      
      // PHASE 2: Listen-Daten verarbeiten (jetzt mit korrekten Keys!)
      listFields.forEach(name => {
        if (name === '_gottesdienste_list') {
          const storageKey = window.getStorageKey ? window.getStorageKey() : '';
          console.log('🔑 Gottesdienste Storage-Key:', storageKey);
          if (storageKey) {
            localStorage.setItem(storageKey, formData[name]);
            console.log('✅ Gottesdienste wiederhergestellt');
            // Listen neu laden (lädt aus LocalStorage in internen Array)
            window.loadGottesdienste && window.loadGottesdienste();
            // Aktualisiere auch window.gottesdienste für Zusammenfassung
            try {
              window.gottesdienste = JSON.parse(formData[name]);
            } catch (e) {
              window.gottesdienste = [];
            }
            // Rendern
            window.updateListe && window.updateListe();
          }
          return;
        }
        
        if (name === '_arbeitszeiten_list') {
          const azKey = window.getAZStorageKey ? window.getAZStorageKey() : '';
          console.log('🔑 Arbeitszeiten Storage-Key:', azKey);
          if (azKey) {
            localStorage.setItem(azKey, formData[name]);
            console.log('✅ Arbeitszeiten wiederhergestellt');
            // Listen neu laden (lädt aus LocalStorage in internen Array)
            window.loadArbeitszeiten && window.loadArbeitszeiten();
            // Aktualisiere auch window.arbeitszeiten für Zusammenfassung
            try {
              window.arbeitszeiten = JSON.parse(formData[name]);
            } catch (e) {
              window.arbeitszeiten = [];
            }
            // Rendern
            window.updateAZListe && window.updateAZListe();
          }
          return;
        }
        
        if (name === '_times_map') {
          const timesKey = getTimesStorageKey();
          if (timesKey) {
            localStorage.setItem(timesKey, formData[name]);
            console.log('✅ Times-Map wiederhergestellt');
          }
          return;
        }
      });
      
      // Speichere Server-Timestamp
      localStorage.setItem(timestampKey, serverTimestamp);
      
      console.log('✅ Alle Daten wiederhergestellt, Zusammenfassung aktualisieren');
      window.updateSummary && window.updateSummary();
      
      return true;
    } else {
      console.log('ℹ️ Keine gespeicherten Daten gefunden');
    }
  } catch (error) {
    console.error('❌ Laden fehlgeschlagen:', error);
  }
  
  return false;
}

// Auto-Save alle 30 Sekunden
let autoSaveInterval;
function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  
  autoSaveInterval = setInterval(() => {
    saveAllFormData();
  }, 30000); // 30 Sekunden
}

// Bei Änderungen speichern (debounced)
let saveTimeout;
function triggerSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveAllFormData();
  }, 2000); // 2 Sekunden nach letzter Änderung
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

