/* ================= ORTSVORSCHLÄGE ================= */

const ORTE_HKK = [
  "St. Georg Dom",
  "St. Antonius Eschhofen",
  "St. Hildegard Limburg",
  "St. Jakobus Lindenholzhausen",
  "St. Johannes d.T. Elz",
  "St. Josef Staffel",
  "St. Lubentius Dietkirchen",
  "St. Marien Limburg",
  "St. Nikolaus Dehrn",
  "St. Servatius Offheim"
];

/* ================= PROFIL (dauerhaft speichern) ================= */

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

/* ================= HILFSFUNKTIONEN ================= */

function normalizeKeyPart(s) {
  return (s || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[|]/g, "");
}

function getSelectedPfarrei() {
  const el = document.getElementById("kirchengemeinde_input");
  return normalizeKeyPart(el ? el.value : "");
}

function setOrteDatalist(options) {
  const dl = document.getElementById("orte_datalist");
  if (!dl) return;

  dl.innerHTML = "";
  (options || []).forEach((o) => {
    const opt = document.createElement("option");
    opt.value = o;
    dl.appendChild(opt);
  });
}

function updateOrtSuggestions() {
  // Vergleich auf normalisiertem String (robuster)
  if (getSelectedPfarrei() === normalizeKeyPart("Heilige Katharina Kaspar Limburger Land")) {
    setOrteDatalist(ORTE_HKK);
  } else {
    setOrteDatalist([]);
  }
}

/* ================= MONAT / JAHR ================= */

function populateMonatJahrSelect() {
  const select = document.getElementById("monatjahr_input");
  if (!select) return;

  select.innerHTML = "";

  const today = new Date();
  const PAST_MONTHS = 12;
  const FUTURE_MONTHS = 24;

  for (let offset = -PAST_MONTHS; offset <= FUTURE_MONTHS; offset++) {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const value = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;

    if (
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      opt.selected = true;
    }

    select.appendChild(opt);
  }
}

/* ================= ZEIT-RUNDUNG (5 Minuten) ================= */

function roundTimeTo5Minutes(t) {
  if (!t) return "";
  let [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;

  m = Math.round(m / 5) * 5;
  if (m === 60) {
    h = (h + 1) % 24;
    m = 0;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function enforce5MinuteStep(el) {
  if (!el) return;
  const r = roundTimeTo5Minutes(el.value);
  if (r && r !== el.value) el.value = r;
}

/* ================= ZEITEN PRO (KIRCHORT + WOCHENTAG) ================= */

function getWeekdayKey(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()];
}

function getTimesStorageKey() {
  const p = getSelectedPfarrei() || "UNBEKANNT_PFARREI";
  return `za_times_v1|${p}`;
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
  const k = normalizeKeyPart(kirchort);
  const w = getWeekdayKey(datum);
  return k && w ? `${k}|${w}` : "";
}

function applySavedTimesIfAvailable() {
  // Global IDs aus dem HTML sind in Browsern meist als Variablen verfügbar,
  // aber wir holen sie sicherheitshalber über document.getElementById:
  const kirchortEl = document.getElementById("gd_kirchort");
  const datumEl = document.getElementById("gd_datum");
  const beginnEl = document.getElementById("gd_beginn");
  const endeEl = document.getElementById("gd_ende");

  if (!kirchortEl || !datumEl || !beginnEl || !endeEl) return;

  const kirchort = kirchortEl.value.trim();
  const datum = datumEl.value;

  const key = buildTimesKey(kirchort, datum);
  if (!key) return;

  const map = loadTimesMap();
  const saved = map[key];
  if (!saved) return;

  // Nur vorbelegen, wenn Feld leer ist (User kann trotzdem überschreiben)
  if (!beginnEl.value) beginnEl.value = saved.beginn;
  if (!endeEl.value) endeEl.value = saved.ende;
}

function saveTimesForEntry(kirchort, datum, beginn, ende) {
  const key = buildTimesKey(kirchort, datum);
  if (!key) return;

  const map = loadTimesMap();
  map[key] = { beginn, ende };
  saveTimesMap(map);
}

/* ================= GOTTESDIENSTE ================= */

let gottesdienste = [];
let currentStorageKey = "";

function getStorageKey() {
  const p = getSelectedPfarrei() || "UNBEKANNT_PFARREI";
  const monatEl = document.getElementById("monatjahr_input");
  const m = normalizeKeyPart(monatEl ? monatEl.value : "") || "OHNE_MONAT";
  return `za_gd_v2|${p}|${m}`;
}

function saveGottesdienste() {
  if (currentStorageKey) {
    localStorage.setItem(currentStorageKey, JSON.stringify(gottesdienste));
  }
}

function loadGottesdienste() {
  try {
    const raw = localStorage.getItem(currentStorageKey);
    const arr = raw ? JSON.parse(raw) : [];
    gottesdienste = Array.isArray(arr) ? arr : [];
  } catch {
    gottesdienste = [];
  }
}

function updateListe() {
  const tbody = document.getElementById("gd_liste");
  if (!tbody) return;

  tbody.innerHTML = "";

  gottesdienste.forEach((gd, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${gd.kirchort}</td>
      <td>${gd.datum}</td>
      <td>${gd.satz}</td>
      <td>${gd.beginn}</td>
      <td>${gd.ende}</td>
      <td><button type="button" onclick="removeGottesdienst(${i})">X</button></td>
    `;
    tbody.appendChild(row);
  });

  const hidden = document.getElementById("gottesdienste_json");
  if (hidden) hidden.value = JSON.stringify(gottesdienste);
}

function addGottesdienst() {
  const kirchortEl = document.getElementById("gd_kirchort");
  const datumEl = document.getElementById("gd_datum");
  const satzEl = document.getElementById("gd_satz");
  const beginnEl = document.getElementById("gd_beginn");
  const endeEl = document.getElementById("gd_ende");

  if (!kirchortEl || !datumEl || !satzEl || !beginnEl || !endeEl) return;

  enforce5MinuteStep(beginnEl);
  enforce5MinuteStep(endeEl);

  const gd = {
    kirchort: kirchortEl.value.trim(),
    datum: datumEl.value,
    satz: satzEl.value,
    beginn: beginnEl.value,
    ende: endeEl.value
  };

  if (Object.values(gd).some((v) => !v)) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }

  gottesdienste.push(gd);

  // Zeiten pro (Kirchort + Wochentag) merken
  saveTimesForEntry(gd.kirchort, gd.datum, gd.beginn, gd.ende);

  saveGottesdienste();
  updateListe();

  kirchortEl.value = "";
  datumEl.value = "";
  satzEl.value = "";
  beginnEl.value = "";
  endeEl.value = "";
}

function removeGottesdienst(i) {
  gottesdienste.splice(i, 1);
  saveGottesdienste();
  updateListe();
}

function clearGottesdienste() {
  if (!confirm("Alle Gottesdienste dieser Aufzeichnung löschen?")) return;
  gottesdienste = [];
  if (currentStorageKey) localStorage.removeItem(currentStorageKey);
  updateListe();
}

/* ================= CONTEXT / INIT ================= */

function setKirchengemeindeFromSelect() {
  const input = document.getElementById("kirchengemeinde_input");
  const select = document.getElementById("kirchengemeinde_select");
  if (input && select) input.value = select.value;

  updateOrtSuggestions();
  handleContextChange();
}

function handleContextChange() {
  const newKey = getStorageKey();
  if (newKey === currentStorageKey) return;

  if (currentStorageKey) saveGottesdienste();
  currentStorageKey = newKey;

  loadGottesdienste();
  updateListe();
}

function init() {
  populateMonatJahrSelect();
  updateOrtSuggestions();

  // Nach dem Populate (aktueller Monat wird gesetzt): Key sauber initialisieren
  currentStorageKey = getStorageKey();
  loadGottesdienste();
  updateListe();

  // 5-Minuten-Check bei blur
  ["gd_beginn", "gd_ende"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("blur", (e) => enforce5MinuteStep(e.target));
  });

  // Profilfelder speichern
  ["vorname_input", "nachname_input", "geburtsdatum_input"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = loadProfileField(id);
    el.addEventListener("input", () => saveProfileField(id, el.value));
  });

  // Zeiten automatisch vorbelegen
  const kirchortEl = document.getElementById("gd_kirchort");
  const datumEl = document.getElementById("gd_datum");
  if (kirchortEl) kirchortEl.addEventListener("change", applySavedTimesIfAvailable);
  if (datumEl) datumEl.addEventListener("change", applySavedTimesIfAvailable);

  // Kontext wechseln (Pfarrei/Monat)
  const pfarreiInput = document.getElementById("kirchengemeinde_input");
  const monatSelect = document.getElementById("monatjahr_input");

  if (pfarreiInput) pfarreiInput.addEventListener("input", handleContextChange);
  if (monatSelect) monatSelect.addEventListener("change", handleContextChange);
}

document.addEventListener("DOMContentLoaded", init);

/* ===== global ===== */
window.addGottesdienst = addGottesdienst;
window.removeGottesdienst = removeGottesdienst;
window.clearGottesdienste = clearGottesdienste;
window.setKirchengemeindeFromSelect = setKirchengemeindeFromSelect;
