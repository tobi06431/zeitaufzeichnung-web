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

// app.js is now a thin stub. Functionality moved to modules in static/lib/ and app.init.js
// Legacy global exports are provided by those modules.

window.removeGottesdienst = removeGottesdienst;
window.clearGottesdienste = clearGottesdienste;
window.setKirchengemeindeFromSelect = setKirchengemeindeFromSelect;
