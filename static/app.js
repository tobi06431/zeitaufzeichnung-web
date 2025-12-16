/* ================= ORTSVORSCHLÄGE pro Pfarrei ================= */

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

function getSelectedPfarrei() {
  return (document.getElementById("kirchengemeinde_input").value || "").trim();
}

function setOrteDatalist(options) {
  const dl = document.getElementById("orte_datalist");
  dl.innerHTML = "";
  (options || []).forEach(o => {
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

/* ================= 5-MINUTEN-ERZWINGUNG ================= */

function roundTimeTo5Minutes(t) {
  if (!t) return "";
  let [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;

  m = Math.round(m / 5) * 5;
  if (m === 60) { h = (h + 1) % 24; m = 0; }

  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function enforce5MinuteStep(el) {
  if (!el) return;
  const r = roundTimeTo5Minutes(el.value);
  if (r && r !== el.value) el.value = r;
}

function setupTimeEnforce() {
  ["gd_beginn", "gd_ende"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => enforce5MinuteStep(el));
    el.addEventListener("blur", () => enforce5MinuteStep(el));
  });
}

/* ================= Browser-Speicher: getrennt nach Pfarrei + Monat ================= */

let gottesdienste = [];
let currentStorageKey = "";

function normalizeKeyPart(s) {
  return (s || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[|]/g, "");
}

function getStorageKey() {
  const pfarrei = normalizeKeyPart(document.getElementById("kirchengemeinde_input").value);
  const monat = normalizeKeyPart(document.getElementById("monatjahr_input").value);

  const p = pfarrei || "UNBEKANNT_PFARREI";
  const m = monat || "OHNE_MONAT";

  return `za_gd_v2|${p}|${m}`;
}

function saveGottesdiensteToStorage() {
  if (!currentStorageKey) currentStorageKey = getStorageKey();
  localStorage.setItem(currentStorageKey, JSON.stringify(gottesdienste));
}

function loadGottesdiensteFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function handleContextChange() {
  const newKey = getStorageKey();

  if (newKey === currentStorageKey) return;

  if (currentStorageKey) {
    localStorage.setItem(currentStorageKey, JSON.stringify(gottesdienste));
  }

  currentStorageKey = newKey;
  gottesdienste = loadGottesdiensteFromStorage(currentStorageKey);
  updateListe();
}

/* ================= Gottesdienste CRUD ================= */

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
  enforce5MinuteStep(document.getElementById("gd_beginn"));
  enforce5MinuteStep(document.getElementById("gd_ende"));

  const kirchort = document.getElementById("gd_kirchort").value.trim();
  const datum = document.getElementById("gd_datum").value;
  const satz = document.getElementById("gd_satz").value;
  const beginn = document.getElementById("gd_beginn").value;
  const ende = document.getElementById("gd_ende").value;

  if (!kirchort || !datum || !satz || !beginn || !ende) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }

  gottesdienste.push({ kirchort, datum, satz, beginn, ende });

  document.getElementById("gd_kirchort").value = "";
  document.getElementById("gd_datum").value = "";
  document.getElementById("gd_satz").value = "";
  document.getElementById("gd_beginn").value = "";
  document.getElementById("gd_ende").value = "";

  updateListe();
  saveGottesdiensteToStorage();
}

function removeGottesdienst(i) {
  gottesdienste.splice(i, 1);
  updateListe();
  saveGottesdiensteToStorage();
}

function clearGottesdienste() {
  if (!confirm("Willst du wirklich alle Gottesdienste dieser Aufzeichnung löschen?")) return;
  gottesdienste = [];
  updateListe();
  if (currentStorageKey) localStorage.removeItem(currentStorageKey);
}

/* ================= INIT ================= */

function setKirchengemeindeFromSelect() {
  const sel = document.getElementById("kirchengemeinde_select");
  if (sel.value) {
    document.getElementById("kirchengemeinde_input").value = sel.value;
  }
  updateOrtSuggestions();
  handleContextChange();
}

function init() {
  // Ortsvorschläge + Kontextwechsel
  const pfarreiInput = document.getElementById("kirchengemeinde_input");
  const monatInput = document.getElementById("monatjahr_input");

  pfarreiInput.addEventListener("input", () => {
    updateOrtSuggestions();
    handleContextChange();
  });

  monatInput.addEventListener("input", handleContextChange);

  updateOrtSuggestions();
  setupTimeEnforce();

  // Initialer Kontext
  currentStorageKey = getStorageKey();
  gottesdienste = loadGottesdiensteFromStorage(currentStorageKey);
  updateListe();

  // Beim Submit JSON sicher setzen
  document.querySelector("form").addEventListener("submit", () => {
    document.getElementById("gottesdienste_json").value =
      JSON.stringify(gottesdienste);
  });
}

document.addEventListener("DOMContentLoaded", init);

/* ================= GLOBAL EXPORT (für onclick="...") ================= */
window.addGottesdienst = addGottesdienst;
window.removeGottesdienst = removeGottesdienst;
window.clearGottesdienste = clearGottesdienste;
window.setKirchengemeindeFromSelect = setKirchengemeindeFromSelect;
