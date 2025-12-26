/* UI helpers: rendering, suggestions, date/time helpers, panels */

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

function normalizeKeyPart(s) {
  return (s || "").trim().replace(/\s+/g, " ").replace(/[|]/g, "");
}

function getSelectedPfarrei() {
  const el = document.getElementById("kirchengemeinde_input");
  return normalizeKeyPart(el ? el.value : "");
}

function setOrteDatalist(options) {
  const dl = document.getElementById("orte_datalist");
  if (!dl) return;
  dl.innerHTML = "";
  options.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o;
    dl.appendChild(opt);
  });
}

function updateOrtSuggestions() {
  const p = getSelectedPfarrei();
  if (p === "Heilige Katharina Kaspar Limburger Land") {
    setOrteDatalist(ORTE_HKK);
  } else if (p === "St. Peter und Paul Bad Camberg") {
    setOrteDatalist(["St. Petrus Eisenbach", "St. Christophorus Niederselters"]);
  } else if (p.includes("Heilig Geist") || p === "Heilig Geist Niederbrechen" || p === "Heilig Geist Goldener Grund") {
    setOrteDatalist(["St. Maximin Niederbrechen", "St. Peter und Paul Villmar"]);
  } else {
    setOrteDatalist([]);
  }
}

function populateMonatJahrSelect() {
  const select = document.getElementById("monatjahr_input");
  if (!select) return;
  select.innerHTML = "";

  const today = new Date();
  const PAST_MONTHS = 12;
  const FUTURE_MONTHS = 24;

  for (let offset = -PAST_MONTHS; offset <= FUTURE_MONTHS; offset++) {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const value = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;

    if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
      opt.selected = true;
    }

    select.appendChild(opt);
  }
}

function parseMonatJahr(value) {
  const m = (value || "").trim().match(/^(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const year = Number(m[2]);
  if (!month || month < 1 || month > 12) return null;
  return { month, year };
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthBoundsFromSelect() {
  const sel = document.getElementById("monatjahr_input");
  if (!sel) return null;

  const parsed = parseMonatJahr(sel.value);
  if (!parsed) return null;

  const { month, year } = parsed;

  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);

  return {
    min: toISODate(first),
    max: toISODate(last)
  };
}

function applyDateRestrictionSilently() {
  const bounds = getMonthBoundsFromSelect();
  const dateInput = document.getElementById("gd_datum");
  if (!dateInput || !bounds) return;

  dateInput.min = bounds.min;
  dateInput.max = bounds.max;

  if (dateInput.value && (dateInput.value < bounds.min || dateInput.value > bounds.max)) {
    dateInput.value = "";
  }
}

function ensureDateStartsInSelectedMonth() {
  const bounds = getMonthBoundsFromSelect();
  const dateInput = document.getElementById("gd_datum");
  if (!dateInput || !bounds) return;

  applyDateRestrictionSilently();

  if (!dateInput.value) {
    dateInput.value = bounds.min;
  }
}

function isDateWithinSelectedMonth(dateStr) {
  const bounds = getMonthBoundsFromSelect();
  if (!bounds) return true;
  if (!dateStr) return false;
  return dateStr >= bounds.min && dateStr <= bounds.max;
}

window.isDateWithinSelectedMonth = isDateWithinSelectedMonth;

function roundTimeTo5Minutes(t) {
  if (!t) return "";
  let [h, m] = t.split(":").map(Number);
  m = Math.round(m / 5) * 5;
  if (m === 60) { h = (h + 1) % 24; m = 0; }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function enforce5MinuteStep(el) {
  if (!el) return;
  const r = roundTimeTo5Minutes(el.value);
  if (r && r !== el.value) el.value = r;
}

function formatTime(h, m) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function populateTimeSelect(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "—";
  el.appendChild(placeholder);
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const opt = document.createElement("option");
      opt.value = formatTime(h, m);
      opt.textContent = opt.value;
      el.appendChild(opt);
    }
  }
}

function applySavedTimesIfAvailable() {
  const gd_kirchort = document.getElementById("gd_kirchort");
  const gd_datum = document.getElementById("gd_datum");
  const gd_beginn = document.getElementById("gd_beginn");
  const gd_ende = document.getElementById("gd_ende");
  const gd_satz = document.getElementById("gd_satz");
  if (!gd_kirchort || !gd_datum) return;

  const kirchort = gd_kirchort.value.trim();
  const datum = gd_datum.value;
  const key = window.buildTimesKey(kirchort, datum);
  if (!key) return;

  const map = window.loadTimesMap();
  const saved = map[key];
  if (!saved) return;

  if (gd_beginn && !gd_beginn.value && saved.beginn) gd_beginn.value = saved.beginn;
  if (gd_ende && !gd_ende.value && saved.ende) gd_ende.value = saved.ende;
  if (gd_satz && !gd_satz.value && saved.satz) gd_satz.value = saved.satz;
}

function renderGottesdienste(list) {
  const tbody = document.getElementById("gd_liste");
  if (!tbody) return;
  tbody.innerHTML = "";

  // sort
  list.sort((a, b) => {
    const ad = a.datum || "";
    const bd = b.datum || "";
    if (ad && bd) {
      if (ad !== bd) return ad < bd ? -1 : 1;
    } else if (ad) return -1;
    else if (bd) return 1;

    const ab = a.beginn || "";
    const bb = b.beginn || "";
    if (ab && bb) {
      if (ab !== bb) return ab < bb ? -1 : 1;
    } else if (ab) return -1;
    else if (bb) return 1;

    return 0;
  });

  list.forEach((gd, i) => {
    const row = document.createElement("tr");

    try {
      const dt = new Date((gd.datum || "") + "T00:00:00");
      const day = dt.getDay();
      if (day === 0 || day === 6) row.classList.add("weekend");
    } catch (e) {}

    const satzNum = parseFloat((gd.satz || "").toString().replace(',', '.'));
    let badgeClass = "badge--none";
    if (!isNaN(satzNum)) {
      if (satzNum <= 1.5) badgeClass = "badge--low";
      else if (satzNum <= 3) badgeClass = "badge--mid";
      else badgeClass = "badge--high";
    }
    const satzHtml = `<span class="badge ${badgeClass}">${gd.satz || "–"}</span>`;

    row.innerHTML = `
      <td>${gd.kirchort}</td>
      <td>${gd.datum}</td>
      <td>${satzHtml}</td>
      <td>${gd.beginn}</td>
      <td>${gd.ende}</td>
      <td><button type="button" onclick="removeGottesdienst(${i})">X</button></td>
    `;
    tbody.appendChild(row);
  });

  const hidden = document.getElementById('gottesdienste_json');
  if (hidden) hidden.value = JSON.stringify(list);
}

/* Panel state */
function loadPanelState() {
  try {
    const raw = localStorage.getItem("za_panels_v1");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function savePanelState(state) {
  try { localStorage.setItem("za_panels_v1", JSON.stringify(state)); } catch {}
}

function initPanels() {
  const state = loadPanelState();
  document.querySelectorAll('.panel').forEach(panel => {
    const id = panel.dataset.panelId || '';
    const btn = panel.querySelector('.panel__toggle');
    if (!btn) return;

    // Ensure button doesn't submit form
    if (btn.tagName === 'BUTTON' && !btn.hasAttribute('type')) {
      btn.setAttribute('type', 'button');
    }

    const collapsed = !!state[id];
    if (collapsed) {
      panel.classList.add('collapsed');
      btn.textContent = '►';
      btn.setAttribute('aria-expanded', 'false');
    } else {
      btn.textContent = '▼';
      btn.setAttribute('aria-expanded', 'true');
    }

    function toggle(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      panel.classList.toggle('collapsed');
      const nowCollapsed = panel.classList.contains('collapsed');
      btn.textContent = nowCollapsed ? '►' : '▼';
      btn.setAttribute('aria-expanded', (!nowCollapsed).toString());
      state[id] = nowCollapsed;
      savePanelState(state);
    }

    btn.addEventListener('click', toggle);
    const header = panel.querySelector('.panel__header');
    if (header) {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.panel__toggle')) return;
        toggle(e);
      });
    }
  });
}

/* Render Arbeitszeiten list */
function renderArbeitszeiten(list) {
  const tbody = document.getElementById('az_liste');
  if (!tbody) return;
  tbody.innerHTML = "";

  // sort by date and time
  list.sort((a, b) => {
    const ad = a.datum || "";
    const bd = b.datum || "";
    if (ad && bd) {
      if (ad !== bd) return ad < bd ? -1 : 1;
    } else if (ad) return -1;
    else if (bd) return 1;

    const ab = a.beginn || "";
    const bb = b.beginn || "";
    if (ab && bb) {
      if (ab !== bb) return ab < bb ? -1 : 1;
    } else if (ab) return -1;
    else if (bb) return 1;

    return 0;
  });

  list.forEach((az, i) => {
    const row = document.createElement("tr");

    try {
      const dt = new Date((az.datum || "") + "T00:00:00");
      const day = dt.getDay();
      if (day === 0 || day === 6) row.classList.add("weekend");
    } catch (e) {}

    row.innerHTML = `
      <td>${az.datum}</td>
      <td>${az.beginn}</td>
      <td>${az.ende}</td>
      <td><button type="button" onclick="removeArbeitszeit(${i})">X</button></td>
    `;
    tbody.appendChild(row);
  });

  const hidden = document.getElementById('arbeitszeiten_json');
  if (hidden) hidden.value = JSON.stringify(list);
}

/* Gottesdienste and Arbeitszeiten visibility based on Tätigkeit */
function updateGottesdiensteVisibility() {
  const taetigkeitEl = document.getElementById('taetigkeit_input');
  const gottesdienstePanel = document.querySelector('[data-panel-id="gottesdienste"]');
  const gottesdiensteTable = document.getElementById('gottesdienste-table');
  const arbeitszeitenPanel = document.querySelector('[data-panel-id="arbeitszeiten"]');
  const arbeitszeitenTable = document.getElementById('arbeitszeiten-table');
  
  if (!taetigkeitEl) return;
  
  const isOrganist = taetigkeitEl.value === 'Organist';
  
  // Gottesdienste nur für Organisten
  if (gottesdienstePanel) {
    if (isOrganist) {
      gottesdienstePanel.style.display = '';
      if (gottesdiensteTable) gottesdiensteTable.style.display = '';
    } else {
      gottesdienstePanel.style.display = 'none';
      if (gottesdiensteTable) gottesdiensteTable.style.display = 'none';
    }
  }
  
  // Arbeitszeiten für alle außer Organisten
  if (arbeitszeitenPanel) {
    if (isOrganist) {
      arbeitszeitenPanel.style.display = 'none';
      if (arbeitszeitenTable) arbeitszeitenTable.style.display = 'none';
    } else {
      arbeitszeitenPanel.style.display = '';
      if (arbeitszeitenTable) arbeitszeitenTable.style.display = '';
    }
  }
}

/* Zusammenfassung aktualisieren */
function updateSummary() {
  // Pfarrei
  const pfarreiEl = document.getElementById('kirchengemeinde_input');
  const summaryPfarrei = document.getElementById('summary-pfarrei');
  if (pfarreiEl && summaryPfarrei) {
    const pfarreiValue = pfarreiEl.value;
    const valueSpan = summaryPfarrei.querySelector('.summary-item__value');
    const icon = summaryPfarrei.querySelector('.summary-item__icon');
    if (pfarreiValue) {
      valueSpan.textContent = pfarreiValue;
      icon.textContent = '✓';
      summaryPfarrei.classList.add('completed');
    } else {
      valueSpan.textContent = 'Nicht ausgewählt';
      icon.textContent = '⚪';
      summaryPfarrei.classList.remove('completed');
    }
  }
  
  // Tätigkeit
  const taetigkeitEl = document.getElementById('taetigkeit_input');
  const summaryTaetigkeit = document.getElementById('summary-taetigkeit');
  if (taetigkeitEl && summaryTaetigkeit) {
    const taetigkeitValue = taetigkeitEl.value;
    const valueSpan = summaryTaetigkeit.querySelector('.summary-item__value');
    const icon = summaryTaetigkeit.querySelector('.summary-item__icon');
    if (taetigkeitValue) {
      valueSpan.textContent = taetigkeitValue;
      icon.textContent = '✓';
      summaryTaetigkeit.classList.add('completed');
    } else {
      valueSpan.textContent = 'Nicht ausgewählt';
      icon.textContent = '⚪';
      summaryTaetigkeit.classList.remove('completed');
    }
  }
  
  // Monat/Jahr
  const monatEl = document.getElementById('monatjahr_input');
  const summaryMonat = document.getElementById('summary-monat');
  if (monatEl && summaryMonat) {
    const monatValue = monatEl.value;
    const valueSpan = summaryMonat.querySelector('.summary-item__value');
    const icon = summaryMonat.querySelector('.summary-item__icon');
    if (monatValue) {
      valueSpan.textContent = monatValue;
      icon.textContent = '✓';
      summaryMonat.classList.add('completed');
    } else {
      valueSpan.textContent = 'Nicht ausgewählt';
      icon.textContent = '⚪';
      summaryMonat.classList.remove('completed');
    }
  }
  
  // Arbeitszeiten zählen
  const summaryArbeitszeiten = document.getElementById('summary-arbeitszeiten');
  if (summaryArbeitszeiten && window.arbeitszeiten) {
    const count = window.arbeitszeiten.length;
    const valueSpan = summaryArbeitszeiten.querySelector('.summary-item__value');
    valueSpan.textContent = `${count} erfasst`;
    if (count > 0) {
      summaryArbeitszeiten.classList.add('has-data');
    } else {
      summaryArbeitszeiten.classList.remove('has-data');
    }
  }
  
  // Gottesdienste zählen
  const summaryGottesdienste = document.getElementById('summary-gottesdienste');
  if (summaryGottesdienste && window.gottesdienste) {
    const count = window.gottesdienste.length;
    const valueSpan = summaryGottesdienste.querySelector('.summary-item__value');
    valueSpan.textContent = `${count} erfasst`;
    if (count > 0) {
      summaryGottesdienste.classList.add('has-data');
    } else {
      summaryGottesdienste.classList.remove('has-data');
    }
  }
}

// Export UI helpers
window.updateOrtSuggestions = updateOrtSuggestions;
window.populateMonatJahrSelect = populateMonatJahrSelect;
window.applyDateRestrictionSilently = applyDateRestrictionSilently;
window.ensureDateStartsInSelectedMonth = ensureDateStartsInSelectedMonth;
window.applySavedTimesIfAvailable = applySavedTimesIfAvailable;
window.populateTimeSelect = populateTimeSelect;
window.enforce5MinuteStep = enforce5MinuteStep;
window.renderGottesdienste = renderGottesdienste;
window.renderArbeitszeiten = renderArbeitszeiten;
window.initPanels = initPanels;
window.updateGottesdiensteVisibility = updateGottesdiensteVisibility;
window.updateSummary = updateSummary;
