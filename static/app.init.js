/* Bootstrap: init wiring */

async function init() {
  // ===== ERST: Normale Initialisierung (Storage-Keys setzen) =====
  window.populateMonatJahrSelect && window.populateMonatJahrSelect();
  window.updateOrtSuggestions && window.updateOrtSuggestions();

  // set up gottesdienste context
  const currentKey = window.getStorageKey ? window.getStorageKey() : '';
  window.setCurrentStorageKey && window.setCurrentStorageKey(currentKey);
  window.loadGottesdienste && window.loadGottesdienste();
  window.updateListe && window.updateListe(); // if present

  // set up arbeitszeiten context
  const currentAZKey = window.getAZStorageKey ? window.getAZStorageKey() : '';
  window.setCurrentAZStorageKey && window.setCurrentAZStorageKey(currentAZKey);
  window.loadArbeitszeiten && window.loadArbeitszeiten();
  window.updateAZListe && window.updateAZListe();

  window.applyDateRestrictionSilently && window.applyDateRestrictionSilently();

  // time selects population (if selects are used)
  ["gd_beginn", "gd_ende"].forEach(id => window.populateTimeSelect && window.populateTimeSelect(id));

  // profile fields load
  ["vorname_input", "nachname_input", "geburtsdatum_input", "taetigkeit_input"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = window.loadProfileField ? window.loadProfileField(id) : el.value;
    const ev = (el.tagName && el.tagName.toLowerCase() === 'select') ? 'change' : 'input';
    el.addEventListener(ev, () => {
      window.saveProfileField && window.saveProfileField(id, el.value);
      if (id === 'taetigkeit_input') {
        window.updateGottesdiensteVisibility && window.updateGottesdiensteVisibility();
        // Bei Tätigkeitswechsel Listen neu laden (da Storage-Key sich ändert)
        window.handleContextChange && window.handleContextChange();
        window.handleAZContextChange && window.handleAZContextChange();
      }
      window.updateSummary && window.updateSummary();
    });
  });
  
  // Initial visibility check for Gottesdienste
  window.updateGottesdiensteVisibility && window.updateGottesdiensteVisibility();

  // kirchengemeinde load + listener
  const kirchEl = document.getElementById('kirchengemeinde_input');
  if (kirchEl) {
    kirchEl.value = window.loadProfileField ? window.loadProfileField('kirchengemeinde_input') : kirchEl.value;
    const kev = (kirchEl.tagName && kirchEl.tagName.toLowerCase() === 'select') ? 'change' : 'input';
    kirchEl.addEventListener(kev, () => {
      window.saveProfileField && window.saveProfileField('kirchengemeinde_input', kirchEl.value);
      window.updateOrtSuggestions && window.updateOrtSuggestions();
      window.handleContextChange && window.handleContextChange();
      window.handleAZContextChange && window.handleAZContextChange();
      window.updateSummary && window.updateSummary();
    });
    if (kirchEl.value) {
      window.updateOrtSuggestions && window.updateOrtSuggestions();
      window.handleContextChange && window.handleContextChange();
      window.handleAZContextChange && window.handleAZContextChange();
    }
  }

  // date field behaviour
  const gd_datum = document.getElementById('gd_datum');
  if (gd_datum) {
    gd_datum.addEventListener('focus', () => window.ensureDateStartsInSelectedMonth && window.ensureDateStartsInSelectedMonth());
    gd_datum.addEventListener('click', () => window.ensureDateStartsInSelectedMonth && window.ensureDateStartsInSelectedMonth());
    gd_datum.addEventListener('change', () => { window.applyDateRestrictionSilently && window.applyDateRestrictionSilently(); window.applySavedTimesIfAvailable && window.applySavedTimesIfAvailable(); });
  }

  const gd_kirchort = document.getElementById('gd_kirchort');
  if (gd_kirchort) gd_kirchort.addEventListener('change', () => window.applySavedTimesIfAvailable && window.applySavedTimesIfAvailable());

  // (legacy secondary select removed) No extra listener required here.

  const monatjahr_input = document.getElementById('monatjahr_input');
  if (monatjahr_input) monatjahr_input.addEventListener('change', () => {
    window.applyDateRestrictionSilently && window.applyDateRestrictionSilently();
    const gd_datum = document.getElementById('gd_datum');
    if (gd_datum) gd_datum.value = '';
    const az_datum = document.getElementById('arbeitszeit_datum');
    if (az_datum) az_datum.value = '';
    window.handleContextChange && window.handleContextChange();
    window.handleAZContextChange && window.handleAZContextChange();
    window.updateSummary && window.updateSummary();
  });

  window.initPanels && window.initPanels();
  
  // ===== JETZT: Daten vom Server laden (nachdem alles initialisiert ist) =====
  const dataLoaded = await window.loadAllFormData();
  if (dataLoaded) {
    console.log('✅ Formulardaten vom Server geladen - Listen aktualisiert');
  }
  
  // Initiale Zusammenfassung aktualisieren
  window.updateSummary && window.updateSummary();
  
  // Auto-Save aktivieren (alle 30 Sekunden)
  window.startAutoSave && window.startAutoSave();
  
  // Event-Listener für alle Formularfelder (Auto-Save bei Änderungen)
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.name && el.name !== 'csrf_token' && el.name !== 'action') {
      el.addEventListener('change', () => window.triggerSave && window.triggerSave());
      if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
        el.addEventListener('input', () => window.triggerSave && window.triggerSave());
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
