/* Gottesdienst-Logik: list management (SERVER-BASIERT) */

// Direkt im window-Objekt speichern (keine LocalStorage-Keys mehr!)
if (!window.gottesdienste) window.gottesdienste = [];

function saveGottesdienste() {
  // Direkt zum Server - keine LocalStorage-Zwischenspeicherung
  window.triggerSave && window.triggerSave();
}

function updateListe() {
  window.renderGottesdienste && window.renderGottesdienste(window.gottesdienste);
  window.updateSummary && window.updateSummary();
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

  window.gottesdienste.push(gd);
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
  window.gottesdienste.splice(i, 1);
  saveGottesdienste();
  updateListe();
}

function clearGottesdienste() {
  if (!confirm("Alle Gottesdienste dieser Aufzeichnung löschen?")) return;
  window.gottesdienste = [];
  saveGottesdienste();
  updateListe();
}

// expose
window.addGottesdienst = addGottesdienst;
window.removeGottesdienst = removeGottesdienst;
window.clearGottesdienste = clearGottesdienste;
window.updateListe = updateListe;
