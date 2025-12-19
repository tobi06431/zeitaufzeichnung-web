/* Bootstrap: init wiring */

function init() {
  window.populateMonatJahrSelect && window.populateMonatJahrSelect();
  window.updateOrtSuggestions && window.updateOrtSuggestions();

  // set up gottesdienste context
  const currentKey = window.getStorageKey ? window.getStorageKey() : '';
  window.setCurrentStorageKey && window.setCurrentStorageKey(currentKey);
  window.loadGottesdienste && window.loadGottesdienste();
  window.updateListe && window.updateListe(); // if present

  window.applyDateRestrictionSilently && window.applyDateRestrictionSilently();

  // time selects population (if selects are used)
  ["gd_beginn", "gd_ende"].forEach(id => window.populateTimeSelect && window.populateTimeSelect(id));

  // profile fields load
  ["vorname_input", "nachname_input", "geburtsdatum_input", "taetigkeit_input"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = window.loadProfileField ? window.loadProfileField(id) : el.value;
    const ev = (el.tagName && el.tagName.toLowerCase() === 'select') ? 'change' : 'input';
    el.addEventListener(ev, () => window.saveProfileField && window.saveProfileField(id, el.value));
  });

  // kirchengemeinde load + listener
  const kirchEl = document.getElementById('kirchengemeinde_input');
  if (kirchEl) {
    kirchEl.value = window.loadProfileField ? window.loadProfileField('kirchengemeinde_input') : kirchEl.value;
    const kev = (kirchEl.tagName && kirchEl.tagName.toLowerCase() === 'select') ? 'change' : 'input';
    kirchEl.addEventListener(kev, () => {
      window.saveProfileField && window.saveProfileField('kirchengemeinde_input', kirchEl.value);
      window.handleContextChange && window.handleContextChange();
    });
    if (kirchEl.value) {
      window.updateOrtSuggestions && window.updateOrtSuggestions();
      window.handleContextChange && window.handleContextChange();
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
    window.handleContextChange && window.handleContextChange();
  });

  window.initPanels && window.initPanels();
}

document.addEventListener('DOMContentLoaded', init);
