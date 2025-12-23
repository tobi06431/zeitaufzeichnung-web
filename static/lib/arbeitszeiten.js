/* Arbeitszeiten-Logik: list management, storage key */

let arbeitszeiten = [];
let currentAZStorageKey = "";

function getAZStorageKey() {
  const p = window.getSelectedPfarrei ? window.getSelectedPfarrei() : (document.getElementById('kirchengemeinde_input')?.value || 'UNBEKANNT_PFARREI');
  const mEl = document.getElementById('monatjahr_input');
  const m = (mEl && mEl.value) ? mEl.value.trim() : 'OHNE_MONAT';
  return `za_az_v1|${p}|${m}`;
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
  saveArbeitszeiten();
  updateAZListe();

  az_datum.value = "";
  az_beginn.value = "";
  az_ende.value = "";
}

function removeArbeitszeit(i) {
  arbeitszeiten.splice(i, 1);
  saveArbeitszeiten();
  updateAZListe();
}

function clearArbeitszeiten() {
  if (!confirm("Alle Arbeitszeiten dieser Aufzeichnung löschen?")) return;
  arbeitszeiten = [];
  saveArbeitszeiten(); // Speichert leere Liste (wichtig für Sync!)
  updateAZListe();
}

function handleAZContextChange() {
  const newKey = getAZStorageKey();
  if (newKey === currentAZStorageKey) return;
  if (currentAZStorageKey) saveArbeitszeiten();
  currentAZStorageKey = newKey;
  loadArbeitszeiten();
  updateAZListe();
}

// expose
window.addArbeitszeit = addArbeitszeit;
window.removeArbeitszeit = removeArbeitszeit;
window.clearArbeitszeiten = clearArbeitszeiten;
window.handleAZContextChange = handleAZContextChange;
window.loadArbeitszeiten = loadArbeitszeiten;
window.getArbeitszeiten = () => arbeitszeiten;
window.setCurrentAZStorageKey = (k) => { currentAZStorageKey = k; };
window.getAZStorageKey = getAZStorageKey;
