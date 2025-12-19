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
  return (s || "").trim().replace(/\s+/g, " ").replace(/[|]/g, "");
}

function getSelectedPfarrei() {
  return normalizeKeyPart(document.getElementById("kirchengemeinde_input").value);
}

function setOrteDatalist(options) {
  const dl = document.getElementById("orte_datalist");
  dl.innerHTML = "";
  options.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o;
    dl.appendChild(opt);
  });
}

function updateOrtSuggestions() {
  if (getSelectedPfarrei() === "Heilige Katharina Kaspar Limburger Land") {
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

    if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
      opt.selected = true;
    }

    select.appendChild(opt);
  }
}

/* ================= DATUM-RESTRIKTION (nur ausgewählter Monat) ================= */

function parseMonatJahr(value) {
  const m = (value || "").trim().match(/^(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const year = Number(m[2]);
  if (!month || month < 1 || month > 12) return null;
  return { month, year };
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthBoundsFromSelect() {
  const sel = document.getElementById("monatjahr_input");
  if (!sel) return null;

  const parsed = parseMonatJahr(sel.value);
  if (!parsed) return null;

  const { month, year } = parsed;

  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);

  return {
    min: toISODate(first),
    max: toISODate(last)
  };
}

function applyDateRestrictionSilently() {
  const bounds = getMonthBoundsFromSelect();
  const dateInput = document.getElementById("gd_datum");
  if (!dateInput || !bounds) return;

  dateInput.min = bounds.min;
  dateInput.max = bounds.max;

  // Wichtig: NICHT alerten – nur still bereinigen, sonst wirkt es "abgewürgt"
  if (dateInput.value && (dateInput.value < bounds.min || dateInput.value > bounds.max)) {
    dateInput.value = "";
  }
}

function ensureDateStartsInSelectedMonth() {
  // Wenn Nutzer ins Datumsfeld klickt und es ist leer:
  // setze den 1. des ausgewählten Monats, damit der Datepicker sofort richtig "startet".
  const bounds = getMonthBoundsFromSelect();
  const dateInput = document.getElementById("gd_datum");
  if (!dateInput || !bounds) return;

  applyDateRestrictionSilently();

  if (!dateInput.value) {
    dateInput.value = bounds.min; // z.B. 2025-10-01
  }
}

function isDateWithinSelectedMonth(dateStr) {
  const bounds = getMonthBoundsFromSelect();
  if (!bounds) return true;
  if (!dateStr) return false;
  return dateStr >= bounds.min && dateStr <= bounds.max;
}

/* ================= ZEIT-RUNDUNG (5 Minuten) ================= */

function roundTimeTo5Minutes(t) {
  if (!t) return "";
  let [h, m] = t.split(":").map(Number);
  m = Math.round(m / 5) * 5;
  if (m === 60) { h = (h + 1) % 24; m = 0; }
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
  const kirchort = gd_kirchort.value.trim();
  const datum = gd_datum.value;
  const key = buildTimesKey(kirchort, datum);
  if (!key) return;

  const map = loadTimesMap();
  const saved = map[key];
  if (!saved) return;

  // Zeiten wie bisher, nur setzen wenn Feld leer
  if (!gd_beginn.value && saved.beginn) gd_beginn.value = saved.beginn;
  if (!gd_ende.value && saved.ende) gd_ende.value = saved.ende;
  // Neuer: auch Besoldungssatz automatisch einsetzen, falls vorhanden
  if (!gd_satz.value && saved.satz) gd_satz.value = saved.satz;
}

function saveTimesForEntry(kirchort, datum, beginn, ende, satz) {
  const key = buildTimesKey(kirchort, datum);
  if (!key) return;

  const map = loadTimesMap();
  // speichere beginn/ende und optional den besoldungssatz
  map[key] = { beginn, ende, satz };
  saveTimesMap(map);
}

/* ================= GOTTESDIENSTE ================= */

let gottesdienste = [];
let currentStorageKey = "";

function getStorageKey() {
  const p = getSelectedPfarrei() || "UNBEKANNT_PFARREI";
  const m = normalizeKeyPart(monatjahr_input.value) || "OHNE_MONAT";
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
    gottesdienste = raw ? JSON.parse(raw) : [];
  } catch {
    gottesdienste = [];
  }
}

function updateListe() {
  const tbody = document.getElementById("gd_liste");
  tbody.innerHTML = "";
  // Liste sortieren: zuerst nach Datum (aufsteigend), dann nach Beginn (aufsteigend)
  gottesdienste.sort((a, b) => {
    const ad = a.datum || "";
    const bd = b.datum || "";
    if (ad && bd) {
      if (ad !== bd) return ad < bd ? -1 : 1;
    } else if (ad) {
      return -1;
    } else if (bd) {
      return 1;
    }

    const ab = a.beginn || "";
    const bb = b.beginn || "";
    if (ab && bb) {
      if (ab !== bb) return ab < bb ? -1 : 1;
    } else if (ab) {
      return -1;
    } else if (bb) {
      return 1;
    }

    return 0;
  });

  gottesdienste.forEach((gd, i) => {
    const row = document.createElement("tr");

    // Wochenend-Highlight
    try {
      const dt = new Date((gd.datum || "") + "T00:00:00");
      const day = dt.getDay(); // 0=So,6=Sa
      if (day === 0 || day === 6) row.classList.add("weekend");
    } catch (e) {}

    // Badge für Besoldungssatz
    const satzNum = parseFloat((gd.satz || "").toString().replace(',', '.'));
    let badgeClass = "badge--none";
    if (!isNaN(satzNum)) {
      if (satzNum <= 1.5) badgeClass = "badge--low";
      else if (satzNum <= 3) badgeClass = "badge--mid";
      else badgeClass = "badge--high";
    }

    const satzHtml = `<span class="badge ${badgeClass}">${gd.satz || "–"}</span>`;

    row.innerHTML = `
      <td>${gd.kirchort}</td>
      <td>${gd.datum}</td>
      <td>${satzHtml}</td>
      <td>${gd.beginn}</td>
      <td>${gd.ende}</td>
      <td><button type="button" onclick="removeGottesdienst(${i})">X</button></td>
    `;
    tbody.appendChild(row);
  });

  // Hidden field mit der sortierten Liste füllen
  gottesdienste_json.value = JSON.stringify(gottesdienste);
}

function addGottesdienst() {
  enforce5MinuteStep(gd_beginn);
  enforce5MinuteStep(gd_ende);

  if (!isDateWithinSelectedMonth(gd_datum.value)) {
    alert("Bitte wähle ein Datum, das im ausgewählten Monat/Jahr liegt.");
    gd_datum.focus();
    return;
  }

  const gd = {
    kirchort: gd_kirchort.value.trim(),
    datum: gd_datum.value,
    satz: gd_satz.value,
    beginn: gd_beginn.value,
    ende: gd_ende.value
  };

  if (Object.values(gd).some(v => !v)) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }

  gottesdienste.push(gd);
  saveTimesForEntry(gd.kirchort, gd.datum, gd.beginn, gd.ende, gd.satz);
  saveGottesdienste();
  updateListe();

  gd_kirchort.value = "";
  gd_datum.value = "";
  gd_satz.value = "";
  gd_beginn.value = "";
  gd_ende.value = "";
}

function removeGottesdienst(i) {
  gottesdienste.splice(i, 1);
  saveGottesdienste();
  updateListe();
}

function clearGottesdienste() {
  if (!confirm("Alle Gottesdienste dieser Aufzeichnung löschen?")) return;
  gottesdienste = [];
  localStorage.removeItem(currentStorageKey);
  updateListe();
}

/* ================= CONTEXT / INIT ================= */

function setKirchengemeindeFromSelect() {
  kirchengemeinde_input.value = kirchengemeinde_select.value;
  updateOrtSuggestions();
  // Auswahl aus Select sofort speichern und Kontext aktualisieren
  saveProfileField("kirchengemeinde_input", kirchengemeinde_input.value);
  handleContextChange();
}

function handleContextChange() {
  const newKey = getStorageKey();
  if (newKey === currentStorageKey) return;

  if (currentStorageKey) saveGottesdienste();
  currentStorageKey = newKey;
  loadGottesdienste();
  updateListe();

  applyDateRestrictionSilently();
}

function init() {
  populateMonatJahrSelect();
  updateOrtSuggestions();

  currentStorageKey = getStorageKey();
  loadGottesdienste();
  updateListe();

  applyDateRestrictionSilently();

  ["gd_beginn", "gd_ende"].forEach(id => {
    document.getElementById(id)?.addEventListener("blur", e => enforce5MinuteStep(e.target));
  });

  ["vorname_input", "nachname_input", "geburtsdatum_input", "taetigkeit_input"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = loadProfileField(id);
    el.addEventListener("input", () => saveProfileField(id, el.value));
  });

  // Kath. Kirchengemeinde ebenfalls dauerhaft speichern (letzte Auswahl)
  {
    const id = "kirchengemeinde_input";
    const el = document.getElementById(id);
    if (el) {
      el.value = loadProfileField(id);
      el.addEventListener("input", () => saveProfileField(id, el.value));
      // wenn beim Start bereits ein Wert vorhanden ist, kontext anpassen
      if (el.value) {
        updateOrtSuggestions();
        handleContextChange();
      }
    }
  }

  // <<<< DAS ist der wichtigste UX-Teil: beim Klick/Fokus Datum automatisch in den richtigen Monat setzen
  gd_datum.addEventListener("focus", ensureDateStartsInSelectedMonth);
  gd_datum.addEventListener("click", ensureDateStartsInSelectedMonth);

  // wenn Datum geändert wird: Restriktion bleibt + Zeiten anwenden
  gd_datum.addEventListener("change", () => {
    applyDateRestrictionSilently();
    applySavedTimesIfAvailable();
  });

  gd_kirchort.addEventListener("change", applySavedTimesIfAvailable);

  kirchengemeinde_input.addEventListener("input", handleContextChange);

  // Monat/Jahr Wechsel: Restriktion neu setzen, Datum ggf. leeren, Kontext wechseln
  monatjahr_input.addEventListener("change", () => {
    applyDateRestrictionSilently();
    // Optional: Datum zurücksetzen, damit es nicht in falschem Monat bleibt
    gd_datum.value = "";
    handleContextChange();
  });
}

document.addEventListener("DOMContentLoaded", init);

/* ===== global ===== */
window.addGottesdienst = addGottesdienst;
window.removeGottesdienst = removeGottesdienst;
window.clearGottesdienste = clearGottesdienste;
window.setKirchengemeindeFromSelect = setKirchengemeindeFromSelect;
