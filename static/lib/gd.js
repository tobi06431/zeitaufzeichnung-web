/* Gottesdienst-Logik: list management, storage key */

let gottesdienste = [];
let currentStorageKey = "";

function getStorageKey() {
  const p = window.getSelectedPfarrei ? window.getSelectedPfarrei() : (document.getElementById('kirchengemeinde_input')?.value || 'UNBEKANNT_PFARREI');
  const mEl = document.getElementById('monatjahr_input');
  const m = (mEl && mEl.value) ? mEl.value.trim() : 'OHNE_MONAT';
  return `za_gd_v2|${p}|${m}`;
}

function saveGottesdienste() {
  if (currentStorageKey) {
    localStorage.setItem(currentStorageKey, JSON.stringify(gottesdienste));
    // Trigger Server-Sync
    window.triggerSave && window.triggerSave();
  }
}

function loadGottesdienste() {
  try {
    const raw = localStorage.getItem(currentStorageKey);
    gottesdienste = raw ? JSON.parse(raw) : [];
  } catch { gottesdienste = []; }
}

function updateListe() {
  window.renderGottesdienste && window.renderGottesdienste(gottesdienste);
}

function addGottesdienst() {
  // enforce rounding if inputs are time text inputs
  const gd_beginn = document.getElementById('gd_beginn');
  const gd_ende = document.getElementById('gd_ende');
  window.enforce5MinuteStep && gd_beginn && window.enforce5MinuteStep(gd_beginn);
  window.enforce5MinuteStep && gd_ende && window.enforce5MinuteStep(gd_ende);

  const gd_kirchort = document.getElementById('gd_kirchort');
  const gd_datum = document.getElementById('gd_datum');
  const gd_satz = document.getElementById('gd_satz');

  if (!window.isDateWithinSelectedMonth) {
    // fallback: basic check
  }

  if (!window.isDateWithinSelectedMonth(gd_datum.value)) {
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
  window.saveTimesForEntry && window.saveTimesForEntry(gd.kirchort, gd.datum, gd.beginn, gd.ende, gd.satz);
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

function handleContextChange() {
  const newKey = getStorageKey();
  if (newKey === currentStorageKey) return;
  if (currentStorageKey) saveGottesdienste();
  currentStorageKey = newKey;
  loadGottesdienste();
  updateListe();
  window.applyDateRestrictionSilently && window.applyDateRestrictionSilently();
}

// expose
window.addGottesdienst = addGottesdienst;
window.removeGottesdienst = removeGottesdienst;
window.clearGottesdienste = clearGottesdienste;
window.handleContextChange = handleContextChange;
window.loadGottesdienste = loadGottesdienste;
window.getGottesdienste = () => gottesdienste;
window.setCurrentStorageKey = (k) => { currentStorageKey = k; };
window.getStorageKey = getStorageKey;

