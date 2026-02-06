/**
 * src/js/ui/form.js
 * Regelt input validatie, events en koppeling met state/model.
 * UPDATE: Nu met ondersteuning voor 'Aangepast' opnameverloop.
 */
import { createState } from "../state.js";
import { toNumberLoose, formatEUR, formatPct, formatInt } from "../format.js";
import { resetKPIs, setSummary, updateKPIs } from "./results.js";
import { calculateScenario } from "../calc/model.js";
import { updateChart, updateTable } from "./chart.js";
import { initDownloads, enableDownloadButtons } from "./downloads.js";

// Snackbar helper
function snackbar(msg) {
  const el = document.getElementById("snackbar");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(snackbar._t);
  snackbar._t = window.setTimeout(() => el.classList.remove("show"), 2200);
}

// Error helper
function setError(inputEl, errEl, message) {
  if (!inputEl || !errEl) return;
  if (message) {
    inputEl.setAttribute("aria-invalid", "true");
    errEl.textContent = message;
    errEl.style.display = "block";
  } else {
    inputEl.removeAttribute("aria-invalid");
    errEl.textContent = "";
    errEl.style.display = "none";
  }
}

// Hulpfunctie: String "10, 20, 50" -> Array [10, 20, 50]
function parseSchedule(str) {
  if (!str) return [];
  return str.split(',')
    .map(s => s.trim())
    .filter(s => s !== "")
    .map(s => parseFloat(s.replace(',', '.'))) // Zorg dat 10,5 ook werkt
    .filter(n => !isNaN(n));
}

// Validatie regels
function validate(state) {
  const errors = {};
  const pos = (v) => v != null && Number.isFinite(v) && v > 0;

  if (!pos(state.grondbedrag)) errors.grondbedrag = "Vul een positief bedrag in.";
  if (!(state.hypotheekrente != null && state.hypotheekrente >= 0 && state.hypotheekrente <= 15))
    errors.hypotheekrente = "Vul een percentage in tussen 0 en 15.";

  if (!pos(state.bouwdepot)) errors.bouwdepot = "Vul een positief bedrag in.";
  if (!(state.depotrente != null && state.depotrente >= 0 && state.depotrente <= 10))
    errors.depotrente = "Vul een percentage in tussen 0 en 10.";

  if (!(state.bouwtijd != null && Number.isInteger(state.bouwtijd) && state.bouwtijd >= 1 && state.bouwtijd <= 48))
    errors.bouwtijd = "Vul een aantal maanden in tussen 1 en 48.";

  // NIEUW: Validatie voor custom schedule
  if (state.withdrawalMode === 'custom') {
    const total = state.customSchedule.reduce((a, b) => a + b, 0);
    // Marge voor afronding (99.9 tot 100.1 is ok)
    if (total < 99 || total > 101) {
      errors.custom = `Totaal is ${Math.round(total * 10) / 10}%. Dit moet 100% zijn.`;
    }
    
    // Check of aantal percentages niet groter is dan aantal maanden
    if (state.customSchedule.length > state.bouwtijd) {
        errors.custom = `Je hebt meer percentages (${state.customSchedule.length}) dan bouwmaanden (${state.bouwtijd}).`;
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

  // Referenties naar DOM elementen
  const inputs = {
    grondbedrag: document.getElementById("grondbedrag"),
    hypotheekrente: document.getElementById("hypotheekrente"),
    bouwdepot: document.getElementById("bouwdepot"),
    depotrente: document.getElementById("depotrente"),
    bouwtijd: document.getElementById("bouwtijd"),
    
    // Nieuwe inputs voor custom schedule
    radios: document.getElementsByName("withdrawal-mode"),
    customContainer: document.getElementById("field-custom-schedule"),
    customInput: document.getElementById("custom-input"),
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

  // UI synchroniseren met State
  const syncUI = () => {
    state.taxEnabled = !!inputs.taxToggle?.checked;
    if (inputs.taxRate) inputs.taxRate.disabled = !state.taxEnabled;

    // Toggle custom input zichtbaarheid
    const isCustom = state.withdrawalMode === 'custom';
    if (inputs.customContainer) {
        inputs.customContainer.style.display = isCustom ? 'grid' : 'none';
    }

    // Update het "Huidig: X%" label
    if (isCustom && inputs.scheduleTotal) {
        const total = state.customSchedule.reduce((a, b) => a + b, 0);
        const rounded = Math.round(total * 10) / 10;
        inputs.scheduleTotal.textContent = `Huidig: ${rounded}%`;
        
        // Kleur feedback
        if (rounded >= 99 && rounded <= 101) {
            inputs.scheduleTotal.style.color = "var(--brand2)"; // Groen
        } else {
            inputs.scheduleTotal.style.color = "var(--danger)"; // Rood
        }
    }

    setSummary(state);
  };

  // Input uitlezen naar State
  const read = () => {
    state.grondbedrag = toNumberLoose(inputs.grondbedrag?.value);
    state.hypotheekrente = toNumberLoose(inputs.hypotheekrente?.value);
    state.bouwdepot = toNumberLoose(inputs.bouwdepot?.value);
    state.depotrente = toNumberLoose(inputs.depotrente?.value);

    const bt = toNumberLoose(inputs.bouwtijd?.value);
    state.bouwtijd = bt == null ? null : Math.round(bt);

    state.taxRate = Number(inputs.taxRate?.value ?? "0.37");

    // Radio buttons uitlezen
    inputs.radios.forEach(r => {
        if (r.checked) state.withdrawalMode = r.value;
    });

    // Custom input uitlezen
    state.customSchedule = parseSchedule(inputs.customInput?.value);
  };

  // Errors tonen/verbergen
  const applyErrors = (errors) => {
    setError(inputs.grondbedrag, errs.grondbedrag, errors.grondbedrag);
    setError(inputs.hypotheekrente, errs.hypotheekrente, errors.hypotheekrente);
    setError(inputs.bouwdepot, errs.bouwdepot, errors.bouwdepot);
    setError(inputs.depotrente, errs.depotrente, errors.depotrente);
    setError(inputs.bouwtijd, errs.bouwtijd, errors.bouwtijd);
    
    // Custom error ook tonen
    setError(inputs.customInput, errs.custom, errors.custom);

    const ok = Object.keys(errors).length === 0;
    if (inputs.btnCalc) inputs.btnCalc.disabled = !ok;

    if (inputs.status) {
      inputs.status.textContent = ok
        ? "✓ Invoer is geldig. Klik op Bereken."
        : "Vul alle velden correct in.";
      
      // Visuele feedback op status tekst
      inputs.status.style.color = ok ? "var(--brand2)" : "var(--muted)";
    }
  };

  // Hoofd update loop
  const validateAndUpdate = () => {
    read();
    syncUI(); // Update visibility en labels
    
    // Voer validatie uit
    const errors = validate(state);
    applyErrors(errors);
  };

  // Formatteren bij blur (het veld verlaten)
  const blurFormat = () => {
    read();
    if (inputs.grondbedrag && state.grondbedrag != null) inputs.grondbedrag.value = formatEUR(state.grondbedrag);
    if (inputs.bouwdepot && state.bouwdepot != null) inputs.bouwdepot.value = formatEUR(state.bouwdepot);
    if (inputs.hypotheekrente && state.hypotheekrente != null) inputs.hypotheekrente.value = formatPct(state.hypotheekrente);
    if (inputs.depotrente && state.depotrente != null) inputs.depotrente.value = formatPct(state.depotrente);
    if (inputs.bouwtijd && state.bouwtijd != null) inputs.bouwtijd.value = formatInt(state.bouwtijd);
    
    validateAndUpdate();
  };

  // Event Listeners
  form.addEventListener("input", validateAndUpdate);
  form.addEventListener("change", validateAndUpdate);

  inputs.taxToggle?.addEventListener("change", () => { syncUI(); validateAndUpdate(); });
  inputs.taxRate?.addEventListener("change", validateAndUpdate);
  
  // Listeners voor radio buttons
  inputs.radios.forEach(r => {
      r.addEventListener("change", validateAndUpdate);
  });

  ["grondbedrag", "bouwdepot", "hypotheekrente", "depotrente", "bouwtijd"].forEach((id) => {
    document.getElementById(id)?.addEventListener("blur", blurFormat);
  });

  // Reset knop
  form.addEventListener("reset", () => {
    setTimeout(() => {
      Object.assign(state, createState());
      if (inputs.taxRate) { inputs.taxRate.value = "0.37"; inputs.taxRate.disabled = true; }
      
      // Reset radio naar linear
      const radioLinear = document.querySelector('input[name="withdrawal-mode"][value="linear"]');
      if (radioLinear) radioLinear.checked = true;

      // Reset custom input
      if (inputs.customInput) inputs.customInput.value = "";
      
      lastResult = null;
      lastState = null;
      
      resetKPIs();
      setSummary(state);
      validateAndUpdate();
      snackbar("Formulier gereset.");
    }, 0);
  });

  // Bereken knop
  inputs.btnCalc?.addEventListener("click", () => {
    validateAndUpdate();
    if (inputs.btnCalc?.disabled) return;

    // Berekening uitvoeren
    const result = calculateScenario(state);

    // UI updaten
    updateKPIs(result);
    updateChart(result);
    updateTable(result);

    // Opslaan voor export
    lastResult = result;
    lastState = { ...state, customSchedule: [...state.customSchedule] };

    enableDownloadButtons();
    snackbar("Dashboard bijgewerkt.");
    
    // Scroll naar grafiek
    document.querySelector(".chart-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Init
  syncUI();
  setSummary(state);
  validateAndUpdate();
}