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

function getSelectedPfarrei() {
  return (document.getElementById("kirchengemeinde_input").value || "").trim();
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

/* ================= MONAT / JAHR (festes Dropdown) ================= */

function populateMonatJahrSelect() {
  const select = document.getElementById("monatjahr_input");
  if (!select) return;

  select.innerHTML = "";

  const today = new Date();
  const startYear = today.getFullYear();
  const startMonth = today.getMonth(); // 0-basiert

  // z.B. 36 Monate voraus
  for (let i = 0; i < 36; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const value = `${month}/${year}`;

    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;

    select.appendChild(opt);
  }
}

/* ================= ZEIT-RUNDUNG (5 Minuten) ================= */

function roundTimeTo5Minutes(t) {
  if (!t) return "";
  let [h, m] = t.split(":").map(Number);
  m = Math.round(m / 5) * 5;
  if (m === 60) {
    h = (h + 1) % 24;
    m = 0;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function enforce5MinuteStep(el) {
  const r = roundTimeTo5Minutes(el.value);
  if (r && r !== el.value) el.value = r;
}

/* ================= GOTTESDIENSTE-SPEICHER ================= */

let gottesdienste = [];
let currentStorageKey = "";

function normalizeKeyPart(s) {
  return (s || "").trim().replace(/\s+/g, " ").replace(/[|]/g, "");
}

function getStorageKey() {
  const p =
    normalizeKeyPart(document.getElementById("kirchengemeinde_input").value) ||
    "UNBEKANNT_PFARREI";
  const m =
    normalizeKeyPart(document.getElementById("monatjahr_input").value) ||
    "OHNE_MONAT";
  return `za_gd_v2|${p}|${m}`;
}

function saveGottesdienste() {
  if (!currentStorageKey) return;
  localStorage.setItem(currentStorageKey, JSON.stringify(gottesdienste));
}

function loadGottesdienste() {
  try {
    const raw = localStorage.getItem(currentStorageKey);
    gottesdienste = raw ? JSON.parse(raw) : [];
  } catch {
    gottesdienste = [];
  }
}

/* ================= CRUD ================= */

function updateListe() {
  const tbody = document.getElementById("gd_liste");
  tbody.innerHTML = "";

  gottesdienste.forEach((gd, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${gd.kirchort}</td>
      <td>${gd.datum}</td>
      <td>${gd.satz}</td>
      <td>${gd.beginn}</td>
      <td>${gd.ende}</td>
      <td>
        <button type="button" onclick="removeGottesdienst(${i})">X</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("gottesdienste_json").value =
    JSON.stringify(gottesdienste);
}

function addGottesdienst() {
  enforce5MinuteStep(gd_beginn);
  enforce5MinuteStep(gd_ende);

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
  if (currentStorageKey) localStorage.removeItem(currentStorageKey);
  updateListe();
}

/* ================= CONTEXT / INIT ================= */

function setKirchengemeindeFromSelect() {
  kirchengemeinde_input.value = kirchengemeinde_select.value;
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
  populateMonatJahrSelect();     // <<< NEU
  updateOrtSuggestions();

  currentStorageKey = getStorageKey();
  loadGottesdienste();
  updateListe();

  ["gd_beginn", "gd_ende"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("blur", () => enforce5MinuteStep(el));
    }
  });

  ["vorname_input", "nachname_input", "geburtsdatum_input"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = loadProfileField(id);
    el.addEventListener("input", () => saveProfileField(id, el.value));
  });

  kirchengemeinde_input.addEventListener("input", handleContextChange);
  monatjahr_input.addEventListener("change", handleContextChange);
}

document.addEventListener("DOMContentLoaded", init);

/* ===== global (für HTML onclick) ===== */
window.addGottesdienst = addGottesdienst;
window.removeGottesdienst = removeGottesdienst;
window.clearGottesdienste = clearGottesdienste;
window.setKirchengemeindeFromSelect = setKirchengemeindeFromSelect;
