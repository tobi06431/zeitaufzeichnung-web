/* Arbeitszeiten-Logik: list management (SERVER-BASIERT) */

// Direkt im window-Objekt speichern (keine LocalStorage-Keys mehr!)
if (!window.arbeitszeiten) window.arbeitszeiten = [];

function saveArbeitszeiten() {
  // Direkt zum Server - keine LocalStorage-Zwischenspeicherung
  window.triggerSave && window.triggerSave();
}

function updateAZListe() {
  window.renderArbeitszeiten && window.renderArbeitszeiten(window.arbeitszeiten);
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

  window.arbeitszeiten.push(az);
  saveArbeitszeiten();
  updateAZListe();

  az_datum.value = "";
  az_beginn.value = "";
  az_ende.value = "";
}

function removeArbeitszeit(i) {
  window.arbeitszeiten.splice(i, 1);
  saveArbeitszeiten();
  updateAZListe();
}

function clearArbeitszeiten() {
  if (!confirm("Alle Arbeitszeiten dieser Aufzeichnung löschen?")) return;
  window.arbeitszeiten = [];
  saveArbeitszeiten();
  updateAZListe();
}

// expose
window.addArbeitszeit = addArbeitszeit;
window.removeArbeitszeit = removeArbeitszeit;
window.clearArbeitszeiten = clearArbeitszeiten;
window.updateAZListe = updateAZListe;
