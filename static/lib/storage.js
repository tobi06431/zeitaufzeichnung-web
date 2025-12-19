/* Storage helpers: profile + times + panel state */

const STORAGE_KEY_PROFILE = "za_profile_v1";

function saveProfileField(id, value) {
  const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
  const obj = raw ? JSON.parse(raw) : {};
  obj[id] = value;
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(obj));
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
window.saveProfileField = saveProfileField;
window.loadProfileField = loadProfileField;
window.getWeekdayKey = getWeekdayKey;
window.getTimesStorageKey = getTimesStorageKey;
window.loadTimesMap = loadTimesMap;
window.saveTimesMap = saveTimesMap;
window.buildTimesKey = buildTimesKey;
window.saveTimesForEntry = saveTimesForEntry;

