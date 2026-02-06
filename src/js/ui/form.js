/**
 * src/js/ui/form.js
 * Regelt input, validatie, het dynamische grid en de koppeling naar het model.
 */
import { createState } from "../state.js";
import { toNumberLoose, formatEUR, formatPct, formatInt } from "../format.js";
import { resetKPIs, updateKPIs } from "./results.js"; // setSummary is niet meer nodig in nieuwe opzet of optioneel
import { calculateScenario } from "../calc/model.js";
import { updateChart } from "./chart.js"; // updateTable evt ook als je die nog gebruikt
import { initDownloads, enableDownloadButtons } from "./downloads.js";

// --- HELPERS ---

function snackbar(msg) {
  const el = document.getElementById("snackbar");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(snackbar._t);
  snackbar._t = window.setTimeout(() => el.classList.remove("show"), 2200);
}

function setError(inputEl, errEl, message) {
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

// --- VALIDATIE ---

function validate(state) {
  const errors = {};
  const pos = (v) => v != null && Number.isFinite(v) && v > 0;
  const zeroOrPos = (v) => v != null && Number.isFinite(v) && v >= 0;

  // loanTotal (was grondbedrag in HTML ID)
  if (!pos(state.loanTotal)) errors.loanTotal = "Vul een positief totaalbedrag in.";
  
  // Rente
  if (!zeroOrPos(state.interestRate) || state.interestRate > 15) 
    errors.interestRate = "Vul een percentage in (0-15).";

  // Aflossing (mag 0 zijn)
  if (!zeroOrPos(state.repayment)) errors.repayment = "Ongeldig bedrag.";

  // Depot
  if (!zeroOrPos(state.depotTotal)) errors.depotTotal = "Vul een bedrag in.";
  if (state.depotTotal > state.loanTotal) errors.depotTotal = "Depot kan niet hoger zijn dan de hypotheek.";

  // Depot rente
  if (!zeroOrPos(state.depotRate) || state.depotRate > 15)
    errors.depotRate = "Vul een percentage in.";

  // Bouwtijd
  if (!pos(state.duration) || !Number.isInteger(state.duration) || state.duration > 60)
    errors.duration = "Vul een aantal maanden in (1-60).";

  // Custom Schedule Validatie
  if (state.withdrawalMode === 'custom') {
    const total = state.customSchedule.reduce((a, b) => a + b, 0);
    // Marge voor afronding (99.9 tot 100.1 is ok)
    if (total < 99 || total > 101) {
      errors.custom = `Totaal is ${Math.round(total * 10) / 10}%. Dit moet 100% zijn.`;
    }
  }

  return errors;
}

// --- INIT FORM ---

export function initForm() {
  const form = document.getElementById("calc-form");
  if (!form) return;

  const state = createState();
  
  // Opslag voor export functies
  let lastResult = null;
  let lastState = null;

  initDownloads(() => lastResult, () => lastState, snackbar);

  // Input Referenties (HTML IDs mappen)
  const inputs = {
    // HTML ID 'grondbedrag' -> State 'loanTotal'
    loanTotal: document.getElementById("grondbedrag"),
    interestRate: document.getElementById("hypotheekrente"),
    repayment: document.getElementById("aflossing"),
    
    // HTML ID 'bouwdepot' -> State 'depotTotal'
    depotTotal: document.getElementById("bouwdepot"), 
    depotRate: document.getElementById("depotrente"),
    duration: document.getElementById("bouwtijd"),
    
    // Radio & Custom logic
    radios: document.getElementsByName("withdrawal-mode"),
    customContainer: document.getElementById("field-custom-schedule"),
    customGrid: document.getElementById("custom-month-grid"),
    scheduleTotal: document.getElementById("schedule-total"),

    // Knoppen
    btnCalc: document.getElementById("btn-calc"),
    status: document.getElementById("form-status")
  };

  // Error Elementen Referenties
  // Let op: In je nieuwe HTML heb je de <div class="error"> misschien niet overal meer een ID gegeven?
  // Voor zekerheid selecteren we ze via sibling selectie of specifieke IDs als ze bestaan.
  // Ik ga er hier vanuit dat de IDs uit de vorige iteratie er nog zijn of dat we ze via nextElementSibling vinden.
  const getErrEl = (inputEl) => inputEl?.parentNode?.querySelector(".error");

  const errs = {
    loanTotal: getErrEl(inputs.loanTotal),
    interestRate: getErrEl(inputs.interestRate),
    repayment: getErrEl(inputs.repayment),
    depotTotal: getErrEl(inputs.depotTotal),
    depotRate: getErrEl(inputs.depotRate),
    duration: getErrEl(inputs.duration),
    custom: document.getElementById("err-custom") // Die heeft wel een ID in de nieuwe HTML
  };

  // --- GRID LOGICA (Render & Read) ---

  const renderMonthGrid = (months) => {
    if (!inputs.customGrid) return;
    
    // Alleen opnieuw renderen als aantal maanden verandert
    if (inputs.customGrid.children.length === months) return;

    inputs.customGrid.innerHTML = "";

    for (let i = 1; i <= months; i++) {
      const wrap = document.createElement("div");
      wrap.className = "month-input-wrap";

      const label = document.createElement("label");
      label.className = "month-label";
      label.textContent = `Mnd ${i}`;
      
      const input = document.createElement("input");
      input.className = "month-input";
      input.type = "text"; 
      input.inputMode = "decimal";
      input.placeholder = "0";
      input.dataset.idx = i - 1;

      // Event listener voor live update van het totaal-percentage
      input.addEventListener("input", () => validateAndUpdate());

      wrap.appendChild(label);
      wrap.appendChild(input);
      inputs.customGrid.appendChild(wrap);
    }
  };

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

  // --- SYNC & READ ---

  const syncUI = () => {
    const isCustom = state.withdrawalMode === 'custom';
    
    if (inputs.customContainer) {
        inputs.customContainer.style.display = isCustom ? 'grid' : 'none';
        
        if (isCustom) {
           let months = state.duration || 12;
           if (months < 1) months = 1;
           if (months > 60) months = 60;
           renderMonthGrid(months);
        }
    }

    // Update Totaal Label (Huidig: X%)
    if (isCustom && inputs.scheduleTotal) {
        const total = state.customSchedule.reduce((a, b) => a + b, 0);
        const rounded = Math.round(total * 10) / 10;
        inputs.scheduleTotal.textContent = `${rounded}%`;
        
        // Kleur feedback
        if (rounded >= 99 && rounded <= 101) {
            inputs.scheduleTotal.style.color = "var(--brand2)"; // Groen
        } else {
            inputs.scheduleTotal.style.color = "#ef4444"; // Rood
        }
    }
  };

  const read = () => {
    // Mapping HTML -> State
    state.loanTotal = toNumberLoose(inputs.loanTotal?.value);
    state.interestRate = toNumberLoose(inputs.interestRate?.value);
    state.repayment = toNumberLoose(inputs.repayment?.value);
    
    state.depotTotal = toNumberLoose(inputs.depotTotal?.value);
    state.depotRate = toNumberLoose(inputs.depotRate?.value);
    
    const d = toNumberLoose(inputs.duration?.value);
    state.duration = d == null ? null : Math.round(d);

    // Radio
    inputs.radios.forEach(r => {
        if (r.checked) state.withdrawalMode = r.value;
    });

    // Custom Schedule
    if (state.withdrawalMode === 'custom' && state.duration) {
       state.customSchedule = readMonthGrid(state.duration);
    } else {
       state.customSchedule = [];
    }
  };

  const applyErrors = (errors) => {
    setError(inputs.loanTotal, errs.loanTotal, errors.loanTotal);
    setError(inputs.interestRate, errs.interestRate, errors.interestRate);
    setError(inputs.repayment, errs.repayment, errors.repayment);
    setError(inputs.depotTotal, errs.depotTotal, errors.depotTotal);
    setError(inputs.depotRate, errs.depotRate, errors.depotRate);
    setError(inputs.duration, errs.duration, errors.duration);
    setError(null, errs.custom, errors.custom); // Custom error op container

    const ok = Object.keys(errors).length === 0;
    if (inputs.btnCalc) inputs.btnCalc.disabled = !ok;

    if (inputs.status) {
      inputs.status.textContent = ok
        ? "✓ Gereed voor berekening"
        : "Vul alle velden correct in.";
      inputs.status.style.color = ok ? "var(--brand2)" : "var(--muted)";
    }
  };

  const validateAndUpdate = () => {
    read();
    syncUI();
    const errors = validate(state);
    applyErrors(errors);
  };

  const blurFormat = () => {
    read();
    if (inputs.loanTotal && state.loanTotal != null) inputs.loanTotal.value = formatEUR(state.loanTotal);
    if (inputs.repayment && state.repayment != null) inputs.repayment.value = formatEUR(state.repayment);
    if (inputs.depotTotal && state.depotTotal != null) inputs.depotTotal.value = formatEUR(state.depotTotal);
    
    if (inputs.interestRate && state.interestRate != null) inputs.interestRate.value = formatPct(state.interestRate);
    if (inputs.depotRate && state.depotRate != null) inputs.depotRate.value = formatPct(state.depotRate);
    
    if (inputs.duration && state.duration != null) inputs.duration.value = formatInt(state.duration);
    
    validateAndUpdate();
  };

  // --- EVENT LISTENERS ---

  form.addEventListener("input", (e) => {
      // Voorkom dat typen in grid de focus reset
      if (!e.target.classList.contains("month-input")) {
         validateAndUpdate();
      }
  });
  
  form.addEventListener("change", validateAndUpdate);

  inputs.radios.forEach(r => r.addEventListener("change", validateAndUpdate));

  // Blur events voor formatting
  [inputs.loanTotal, inputs.interestRate, inputs.repayment, inputs.depotTotal, inputs.depotRate, inputs.duration]
    .forEach(el => el?.addEventListener("blur", blurFormat));

  // Reset
  form.addEventListener("reset", () => {
    setTimeout(() => {
      Object.assign(state, createState());
      
      const radioLinear = document.querySelector('input[name="withdrawal-mode"][value="linear"]');
      if (radioLinear) radioLinear.checked = true;

      if (inputs.customGrid) inputs.customGrid.innerHTML = "";
      
      lastResult = null;
      lastState = null;
      resetKPIs();
      validateAndUpdate();
      snackbar("Formulier gereset.");
    }, 0);
  });

  // Calculate
  inputs.btnCalc?.addEventListener("click", () => {
    validateAndUpdate();
    if (inputs.btnCalc?.disabled) return;

    const result = calculateScenario(state);

    updateKPIs(result);
    updateChart(result);
    // updateTable(result); // Aanzetten als je de tabel weer toevoegt

    lastResult = result;
    lastState = { ...state, customSchedule: [...(state.customSchedule || [])] };

    enableDownloadButtons();
    snackbar("Berekening voltooid.");
    
    // Scrollen naar resultaten
    document.querySelector(".kpi-grid")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Start
  validateAndUpdate();
}