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
    // New approach: use select + custom input; keep hidden #taetigkeit_input as form field
    const hidden = document.getElementById('taetigkeit_input');
    const select = document.getElementById('taetigkeit_select');
    const custom = document.getElementById('taetigkeit_custom');

    function setHidden(val){
      if (!hidden) return;
      hidden.value = val || '';
      window.saveProfileField && window.saveProfileField('taetigkeit_input', hidden.value);
    }

    if (select && hidden) {
      // initialize: load saved value and reflect in select/custom
      const saved = window.loadProfileField ? window.loadProfileField('taetigkeit_input') : '';
      if (saved) {
        const opt = Array.from(select.options).find(o => o.value === saved);
        if (opt) {
          select.value = saved;
          custom.style.display = 'none';
        } else {
          select.value = '__OTHER__';
          custom.style.display = '';
          custom.value = saved;
        }
        hidden.value = saved;
      }

      select.addEventListener('change', () => {
        if (select.value === '__OTHER__') {
          custom.style.display = '';
          custom.focus();
          setHidden(custom.value || '');
        } else {
          custom.style.display = 'none';
          custom.value = '';
          setHidden(select.value);
        }
      });
    }

    if (custom && hidden) {
      custom.addEventListener('input', () => setHidden(custom.value));
      custom.addEventListener('blur', () => {
        if (custom.value) {
          // keep select on Other
          select.value = '__OTHER__';
          setHidden(custom.value);
        }
      });
    }
  })();
    // populate on init
    ensureOptions();
  })();

  // button to show taetigkeit suggestions (clears value temporarily to show full list)
  const taetShowBtn = document.getElementById('taetigkeit_show_btn');
  if (taetShowBtn) {
    taetShowBtn.addEventListener('click', (e) => {
      const taet = document.getElementById('taetigkeit_input');
      if (!taet) return;
      const prev = taet.value;
      taet.value = '';
      taet.focus();

      // If user leaves the field without changing, restore previous value
      const onBlur = () => {
        if (!taet.value) taet.value = prev;
        taet.removeEventListener('blur', onBlur);
      };

      taet.addEventListener('blur', onBlur);
    });
  }

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
