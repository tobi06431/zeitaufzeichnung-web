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
    el.addEventListener("input", () => window.saveProfileField && window.saveProfileField(id, el.value));
  });

  // Ensure `taetigkeit_datalist` suggestions exist and keep `taetigkeit_input` editable
  (function(){
    const taet = document.getElementById('taetigkeit_input');
    const dl = document.getElementById('taetigkeit_datalist');
    const OPTIONS = ['Organist','Chorleiter','Küster'];

    function ensureOptions(){
      if (!dl) return;
      if (dl.children.length === 0) {
        OPTIONS.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v;
          dl.appendChild(opt);
        });
      }
    }

    if (taet) {
      if (taet.removeAttribute) { taet.removeAttribute('readonly'); taet.removeAttribute('disabled'); }
      taet.addEventListener('change', () => { window.saveProfileField && window.saveProfileField('taetigkeit_input', taet.value); });
      taet.addEventListener('focus', ensureOptions);
    }

    // populate on init
    ensureOptions();
  })();

  // kirchengemeinde load + listener
  const kirchEl = document.getElementById('kirchengemeinde_input');
  if (kirchEl) {
    kirchEl.value = window.loadProfileField ? window.loadProfileField('kirchengemeinde_input') : kirchEl.value;
    kirchEl.addEventListener('input', () => {
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

  const kirchengemeinde_select = document.getElementById('kirchengemeinde_select');
  if (kirchengemeinde_select) kirchengemeinde_select.addEventListener('change', () => {
    const kir = document.getElementById('kirchengemeinde_input');
    if (kir) {
      kir.value = kirchengemeinde_select.value;
      window.saveProfileField && window.saveProfileField('kirchengemeinde_input', kir.value);
      window.handleContextChange && window.handleContextChange();
    }
  });

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
