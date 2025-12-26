/* Arbeitszeiten-Logik: list management, storage key */

let arbeitszeiten = [];
let currentAZStorageKey = "";

function getAZStorageKey() {
  const p = window.getSelectedPfarrei ? window.getSelectedPfarrei() : (document.getElementById('kirchengemeinde_input')?.value || 'UNBEKANNT_PFARREI');
  const mEl = document.getElementById('monatjahr_input');
  const m = (mEl && mEl.value) ? mEl.value.trim() : 'OHNE_MONAT';
  const tEl = document.getElementById('taetigkeit_input');
  const t = (tEl && tEl.value) ? tEl.value.trim() : 'OHNE_TAETIGKEIT';
  return `za_az_v1|${p}|${m}|${t}`;
}

function saveArbeitszeiten() {
  if (currentAZStorageKey) {
    localStorage.setItem(currentAZStorageKey, JSON.stringify(arbeitszeiten));
    // Trigger Server-Sync
    window.triggerSave && window.triggerSave();
  }
}

function loadArbeitszeiten() {
  try {
    const raw = localStorage.getItem(currentAZStorageKey);
    arbeitszeiten = raw ? JSON.parse(raw) : [];
  } catch { arbeitszeiten = []; }
}

function updateAZListe() {
  window.renderArbeitszeiten && window.renderArbeitszeiten(arbeitszeiten);
  window.updateSummary && window.updateSummary();
}

function addArbeitszeit() {
  const az_datum = document.getElementById('arbeitszeit_datum');
  const az_beginn = document.getElementById('arbeitsbeginn');
  const az_ende = document.getElementById('arbeitsende');

  // enforce rounding if inputs are time text inputs
  window.enforce5MinuteStep && az_beginn && window.enforce5MinuteStep(az_beginn);
  window.enforce5MinuteStep && az_ende && window.enforce5MinuteStep(az_ende);

  if (!window.isDateWithinSelectedMonth) {
    // fallback: basic check
  }

  if (!window.isDateWithinSelectedMonth(az_datum.value)) {
    alert("Bitte wähle ein Datum, das im ausgewählten Monat/Jahr liegt.");
    az_datum.focus();
    return;
  }

  const az = {
    datum: az_datum.value,
    beginn: az_beginn.value,
    ende: az_ende.value
  };

  if (Object.values(az).some(v => !v)) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }

  arbeitszeiten.push(az);
  window.arbeitszeiten = arbeitszeiten; // Array aktualisieren
  saveArbeitszeiten();
  updateAZListe();

  az_datum.value = "";
  az_beginn.value = "";
  az_ende.value = "";
}

function removeArbeitszeit(i) {
  arbeitszeiten.splice(i, 1);
  window.arbeitszeiten = arbeitszeiten; // Array aktualisieren
  saveArbeitszeiten();
  updateAZListe();
}

function clearArbeitszeiten() {
  if (!confirm("Alle Arbeitszeiten dieser Aufzeichnung löschen?")) return;
  arbeitszeiten = [];
  window.arbeitszeiten = arbeitszeiten; // Array aktualisieren
  saveArbeitszeiten(); // Speichert leere Liste (wichtig für Sync!)
  updateAZListe();
}

function handleAZContextChange() {
  const newKey = getAZStorageKey();
  if (newKey === currentAZStorageKey) return;
  if (currentAZStorageKey) saveArbeitszeiten();
  currentAZStorageKey = newKey;
  loadArbeitszeiten();
  window.arbeitszeiten = arbeitszeiten; // Array aktualisieren
  updateAZListe();
}

// expose
window.addArbeitszeit = addArbeitszeit;
window.removeArbeitszeit = removeArbeitszeit;
window.clearArbeitszeiten = clearArbeitszeiten;
window.handleAZContextChange = handleAZContextChange;
window.loadArbeitszeiten = loadArbeitszeiten;
window.getArbeitszeiten = () => arbeitszeiten;
window.arbeitszeiten = arbeitszeiten; // für direkten Zugriff
window.setCurrentAZStorageKey = (k) => { currentAZStorageKey = k; };
window.getAZStorageKey = getAZStorageKey;
