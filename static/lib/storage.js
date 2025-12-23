/* Storage helpers: profile + times + panel state - SERVER-BASIERT */

// CSRF-Token aus Meta-Tag oder Cookie holen
function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) return meta.content;
  
  // Fallback: Aus verstecktem Input im Formular
  const input = document.querySelector('input[name="csrf_token"]');
  return input ? input.value : '';
}

// Aktueller Monat/Jahr als Key (z.B. "12/2025")
function getCurrentMonthYear() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${month}/${year}`;
}

// ========== SERVER-BASIERTE SPEICHERUNG ==========

async function saveAllFormData() {
  const monthYear = getCurrentMonthYear();
  
  // Sammle alle Formulardaten
  const formData = {};
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.name && el.name !== 'csrf_token' && el.name !== 'action') {
      formData[el.name] = el.value;
    }
  });
  
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
    if (!result.success) {
      console.error('Fehler beim Speichern:', result.message);
    }
  } catch (error) {
    console.error('Speichern fehlgeschlagen:', error);
  }
}

async function loadAllFormData() {
  const monthYear = getCurrentMonthYear();
  
  try {
    const response = await fetch(`/api/timerecords/${monthYear}`);
    const result = await response.json();
    
    if (result.success && result.record) {
      const formData = JSON.parse(result.record.form_data);
      
      // Formulardaten wiederherstellen
      Object.keys(formData).forEach(name => {
        const el = document.querySelector(`[name="${name}"]`);
        if (el) {
          el.value = formData[name];
        }
      });
      
      return true;
    }
  } catch (error) {
    console.error('Laden fehlgeschlagen:', error);
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

