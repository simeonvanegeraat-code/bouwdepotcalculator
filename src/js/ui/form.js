/**
 * src/js/ui/form.js
 * UPDATE: Met dynamisch maand-grid voor custom invoer.
 */
import { createState } from "../state.js";
import { toNumberLoose, formatEUR, formatPct, formatInt } from "../format.js";
import { resetKPIs, setSummary, updateKPIs } from "./results.js";
import { calculateScenario } from "../calc/model.js";
import { updateChart, updateTable } from "./chart.js";
import { initDownloads, enableDownloadButtons } from "./downloads.js";

function snackbar(msg) {
  const el = document.getElementById("snackbar");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(snackbar._t);
  snackbar._t = window.setTimeout(() => el.classList.remove("show"), 2200);
}

function setError(inputEl, errEl, message) {
  // Voor custom grid is inputEl soms null (omdat het een groep is), dat vangen we op
  if (!errEl) return;
  
  if (message) {
    if (inputEl) inputEl.setAttribute("aria-invalid", "true");
    errEl.textContent = message;
    errEl.style.display = "block";
  } else {
    if (inputEl) inputEl.removeAttribute("aria-invalid");
    errEl.textContent = "";
    errEl.style.display = "none";
  }
}

function validate(state) {
  const errors = {};
  const pos = (v) => v != null && Number.isFinite(v) && v > 0;

  if (!pos(state.grondbedrag)) errors.grondbedrag = "Vul een positief bedrag in.";
  if (!(state.hypotheekrente != null && state.hypotheekrente >= 0 && state.hypotheekrente <= 15))
    errors.hypotheekrente = "Vul een percentage in tussen 0 en 15.";

  if (!pos(state.bouwdepot)) errors.bouwdepot = "Vul een positief bedrag in.";
  if (!(state.depotrente != null && state.depotrente >= 0 && state.depotrente <= 10))
    errors.depotrente = "Vul een percentage in tussen 0 en 10.";

  if (!(state.bouwtijd != null && Number.isInteger(state.bouwtijd) && state.bouwtijd >= 1 && state.bouwtijd <= 60))
    errors.bouwtijd = "Vul een aantal maanden in (1-60).";

  // Validatie voor Custom Schedule
  if (state.withdrawalMode === 'custom') {
    const total = state.customSchedule.reduce((a, b) => a + b, 0);
    // Marge voor afronding (99.9 tot 100.1 is ok)
    if (total < 99 || total > 101) {
      errors.custom = `Totaal is ${Math.round(total * 10) / 10}%. Dit moet 100% zijn.`;
    }
  }

  return errors;
}

export function initForm() {
  const form = document.getElementById("calc-form");
  if (!form) return;

  const state = createState();
  let lastResult = null;
  let lastState = null;

  initDownloads(() => lastResult, () => lastState, snackbar);

  const inputs = {
    grondbedrag: document.getElementById("grondbedrag"),
    hypotheekrente: document.getElementById("hypotheekrente"),
    bouwdepot: document.getElementById("bouwdepot"),
    depotrente: document.getElementById("depotrente"),
    bouwtijd: document.getElementById("bouwtijd"),
    
    radios: document.getElementsByName("withdrawal-mode"),
    customContainer: document.getElementById("field-custom-schedule"),
    customGrid: document.getElementById("custom-month-grid"), // De container voor de inputs
    scheduleTotal: document.getElementById("schedule-total"),

    taxToggle: document.getElementById("tax-toggle"),
    taxRate: document.getElementById("tax-rate"),
    btnCalc: document.getElementById("btn-calc"),
    status: document.getElementById("form-status")
  };

  const errs = {
    grondbedrag: document.getElementById("err-grondbedrag"),
    hypotheekrente: document.getElementById("err-hypotheekrente"),
    bouwdepot: document.getElementById("err-bouwdepot"),
    depotrente: document.getElementById("err-depotrente"),
    bouwtijd: document.getElementById("err-bouwtijd"),
    custom: document.getElementById("err-custom")
  };

  // --- LOGICA VOOR HET GRID ---

  // 1. Render de inputs op basis van aantal maanden
  const renderMonthGrid = (months) => {
    if (!inputs.customGrid) return;
    
    // Check of we moeten updaten (om te voorkomen dat we invoer wissen als je typt)
    // We updaten alleen als het AANTAL maanden verandert.
    const currentCount = inputs.customGrid.children.length;
    if (currentCount === months) return;

    inputs.customGrid.innerHTML = ""; // Clear

    for (let i = 1; i <= months; i++) {
      const wrap = document.createElement("div");
      wrap.className = "month-input-wrap";

      const label = document.createElement("label");
      label.className = "month-label";
      label.textContent = `Mnd ${i}`;
      label.setAttribute("for", `m-${i}`);

      const input = document.createElement("input");
      input.type = "text"; // inputmode decimal
      input.id = `m-${i}`;
      input.className = "month-input";
      input.inputMode = "decimal";
      input.placeholder = "0";
      input.dataset.idx = i - 1; // 0-based index voor array
      
      // Event listener per input voor live totaal berekening
      input.addEventListener("input", () => {
         validateAndUpdate();
      });

      wrap.appendChild(label);
      wrap.appendChild(input);
      inputs.customGrid.appendChild(wrap);
    }
  };

  // 2. Lees alle inputs uit het grid naar een array
  const readMonthGrid = (months) => {
    if (!inputs.customGrid) return [];
    
    const arr = new Array(months).fill(0);
    const fields = inputs.customGrid.querySelectorAll("input");
    
    fields.forEach(field => {
      const idx = parseInt(field.dataset.idx, 10);
      const val = toNumberLoose(field.value);
      if (val != null && !isNaN(val)) {
        arr[idx] = val;
      }
    });
    return arr;
  };

  // --- EINDE GRID LOGICA ---

  const syncUI = () => {
    state.taxEnabled = !!inputs.taxToggle?.checked;
    if (inputs.taxRate) inputs.taxRate.disabled = !state.taxEnabled;

    const isCustom = state.withdrawalMode === 'custom';
    
    if (inputs.customContainer) {
        inputs.customContainer.style.display = isCustom ? 'grid' : 'none';
        
        // Als custom aan staat, render het grid op basis van HUIDIGE bouwtijd input
        if (isCustom) {
           let months = toNumberLoose(inputs.bouwtijd.value);
           if (!months || months < 1) months = 12; // Fallback voor render
           if (months > 60) months = 60; // Max cap voor performance UI
           renderMonthGrid(months);
        }
    }

    if (isCustom && inputs.scheduleTotal) {
        const total = state.customSchedule.reduce((a, b) => a + b, 0);
        const rounded = Math.round(total * 10) / 10;
        inputs.scheduleTotal.textContent = `Huidig: ${rounded}%`;
        
        if (rounded >= 99 && rounded <= 101) {
            inputs.scheduleTotal.style.color = "var(--brand2)";
        } else {
            inputs.scheduleTotal.style.color = "var(--danger)";
        }
    }

    setSummary(state);
  };

  const read = () => {
    state.grondbedrag = toNumberLoose(inputs.grondbedrag?.value);
    state.hypotheekrente = toNumberLoose(inputs.hypotheekrente?.value);
    state.bouwdepot = toNumberLoose(inputs.bouwdepot?.value);
    state.depotrente = toNumberLoose(inputs.depotrente?.value);

    const bt = toNumberLoose(inputs.bouwtijd?.value);
    state.bouwtijd = bt == null ? null : Math.round(bt);

    state.taxRate = Number(inputs.taxRate?.value ?? "0.37");

    inputs.radios.forEach(r => {
        if (r.checked) state.withdrawalMode = r.value;
    });

    // Custom schedule uitlezen als mode actief is
    if (state.withdrawalMode === 'custom' && state.bouwtijd) {
       // Gebruik bouwtijd uit state (of fallback 12)
       state.customSchedule = readMonthGrid(state.bouwtijd || 12);
    } else {
       state.customSchedule = [];
    }
  };

  const applyErrors = (errors) => {
    setError(inputs.grondbedrag, errs.grondbedrag, errors.grondbedrag);
    setError(inputs.hypotheekrente, errs.hypotheekrente, errors.hypotheekrente);
    setError(inputs.bouwdepot, errs.bouwdepot, errors.bouwdepot);
    setError(inputs.depotrente, errs.depotrente, errors.depotrente);
    setError(inputs.bouwtijd, errs.bouwtijd, errors.bouwtijd);
    
    // Error container voor custom
    setError(null, errs.custom, errors.custom);

    const ok = Object.keys(errors).length === 0;
    if (inputs.btnCalc) inputs.btnCalc.disabled = !ok;

    if (inputs.status) {
      inputs.status.textContent = ok
        ? "✓ Invoer is geldig. Klik op Bereken."
        : "Vul alle velden correct in.";
      inputs.status.style.color = ok ? "var(--brand2)" : "var(--muted)";
    }
  };

  const validateAndUpdate = () => {
    read();
    syncUI(); // Hier wordt grid gerenderd/geupdate indien nodig
    const errors = validate(state);
    applyErrors(errors);
  };

  const blurFormat = () => {
    read();
    if (inputs.grondbedrag && state.grondbedrag != null) inputs.grondbedrag.value = formatEUR(state.grondbedrag);
    if (inputs.bouwdepot && state.bouwdepot != null) inputs.bouwdepot.value = formatEUR(state.bouwdepot);
    if (inputs.hypotheekrente && state.hypotheekrente != null) inputs.hypotheekrente.value = formatPct(state.hypotheekrente);
    if (inputs.depotrente && state.depotrente != null) inputs.depotrente.value = formatPct(state.depotrente);
    if (inputs.bouwtijd && state.bouwtijd != null) inputs.bouwtijd.value = formatInt(state.bouwtijd);
    
    validateAndUpdate();
  };

  form.addEventListener("input", (e) => {
      // Als we in het grid typen, hoeven we niet het hele grid opnieuw te renderen (verlies focus)
      // De 'renderMonthGrid' checkt count, dus dat zit goed.
      if (!e.target.classList.contains("month-input")) {
         validateAndUpdate();
      }
  });
  
  form.addEventListener("change", validateAndUpdate);

  inputs.taxToggle?.addEventListener("change", () => { syncUI(); validateAndUpdate(); });
  inputs.taxRate?.addEventListener("change", validateAndUpdate);
  
  inputs.radios.forEach(r => {
      r.addEventListener("change", validateAndUpdate);
  });

  ["grondbedrag", "bouwdepot", "hypotheekrente", "depotrente", "bouwtijd"].forEach((id) => {
    document.getElementById(id)?.addEventListener("blur", blurFormat);
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      Object.assign(state, createState());
      if (inputs.taxRate) { inputs.taxRate.value = "0.37"; inputs.taxRate.disabled = true; }
      
      const radioLinear = document.querySelector('input[name="withdrawal-mode"][value="linear"]');
      if (radioLinear) radioLinear.checked = true;

      // Grid leegmaken
      if (inputs.customGrid) inputs.customGrid.innerHTML = "";
      
      lastResult = null;
      lastState = null;
      resetKPIs();
      setSummary(state);
      validateAndUpdate();
      snackbar("Formulier gereset.");
    }, 0);
  });

  inputs.btnCalc?.addEventListener("click", () => {
    validateAndUpdate();
    if (inputs.btnCalc?.disabled) return;

    const result = calculateScenario(state);

    updateKPIs(result);
    updateChart(result);
    updateTable(result);

    lastResult = result;
    // Clone customSchedule om referentie problemen te voorkomen
    lastState = { ...state, customSchedule: [...(state.customSchedule || [])] };

    enableDownloadButtons();
    snackbar("Dashboard bijgewerkt.");
    document.querySelector(".chart-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  syncUI();
  setSummary(state);
  validateAndUpdate();
}