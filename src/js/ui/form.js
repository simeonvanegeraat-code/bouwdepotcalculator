/**
 * src/js/ui/form.js
 * Wizard Controller & Logic
 */
import { createState } from "../state.js";
import { toNumberLoose, formatEUR } from "../format.js";
import { updateKPIs } from "./results.js"; 
import { calculateScenario } from "../calc/model.js";
import { updateChart } from "./chart.js";
import { initDownloads, enableDownloadButtons } from "./downloads.js";

function snackbar(msg) {
  const el = document.getElementById("snackbar");
  if (el) {
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 3000);
  }
}

// Navigatie Helpers
function showStep(stepId) {
  // Verberg alles
  document.querySelectorAll('.step-section').forEach(el => el.classList.remove('active'));
  // Toon gewenste step
  document.getElementById(stepId)?.classList.add('active');
  
  // Update indicator (alleen zichtbaar in stap 1 en 2)
  const indicator = document.getElementById("step-indicator");
  if (stepId === 'step-1') {
      indicator.style.display = 'block';
      document.getElementById("current-step-num").textContent = "1";
  } else if (stepId === 'step-2') {
      indicator.style.display = 'block';
      document.getElementById("current-step-num").textContent = "2";
  } else {
      indicator.style.display = 'none';
  }
}

export function initForm() {
  const state = createState();
  let lastResult = null;
  let lastState = null;

  initDownloads(() => lastResult, () => lastState, snackbar);

  // --- Elementen ---
  const inputs = {
    loanTotal: document.getElementById("grondbedrag"),
    interestRate: document.getElementById("hypotheekrente"),
    aflossingContainer: document.getElementById("field-aflossing"),
    aflossingInput: document.getElementById("aflossing"),
    
    depotTotal: document.getElementById("bouwdepot"),
    depotRate: document.getElementById("depotrente"),
    duration: document.getElementById("bouwtijd"),
  };

  const buttons = {
    start: document.getElementById("btn-start"),
    backToStart: document.getElementById("btn-back-0"),
    toStep2: document.getElementById("btn-to-2"),
    backTo1: document.getElementById("btn-back-1"),
    calc: document.getElementById("btn-calc"),
    restart: document.getElementById("btn-restart")
  };

  // --- Logic ---

  // Stap 0 -> 1
  buttons.start?.addEventListener("click", () => showStep("step-1"));
  buttons.backToStart?.addEventListener("click", () => showStep("step-start"));

  // Toggle Aflossing veld op basis van radio
  document.querySelectorAll('input[name="hypotheekvorm"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
        if (e.target.value === "annuiteit") {
            inputs.aflossingContainer.style.display = "block";
            // Auto focus
            inputs.aflossingInput.focus();
        } else {
            inputs.aflossingContainer.style.display = "none";
            inputs.aflossingInput.value = ""; // Reset aflossing bij aflossingsvrij
        }
    });
  });

  // Stap 1 -> 2 (Validatie)
  buttons.toStep2?.addEventListener("click", () => {
    const loan = toNumberLoose(inputs.loanTotal.value);
    const rate = toNumberLoose(inputs.interestRate.value);
    
    const err = document.getElementById("err-step-1");
    if (!loan || loan <= 0) { err.textContent = "Vul een geldig hypotheekbedrag in."; return; }
    if (rate === null || rate < 0) { err.textContent = "Vul een geldig rentepercentage in."; return; }
    
    err.textContent = "";
    
    // Save state
    state.loanTotal = loan;
    state.interestRate = rate;
    state.repayment = toNumberLoose(inputs.aflossingInput.value) || 0;
    
    showStep("step-2");
  });

  buttons.backTo1?.addEventListener("click", () => showStep("step-1"));

  // Stap 2 -> Dashboard (Berekening)
  buttons.calc?.addEventListener("click", () => {
    const depot = toNumberLoose(inputs.depotTotal.value);
    const dRate = toNumberLoose(inputs.depotRate.value);
    const time = toNumberLoose(inputs.duration.value);

    const err = document.getElementById("err-step-2");
    if (!depot || depot < 0) { err.textContent = "Vul een depotbedrag in."; return; }
    if (!time || time < 1) { err.textContent = "Vul een bouwtijd in."; return; }
    
    err.textContent = "";

    // Save state
    state.depotTotal = depot;
    state.depotRate = (dRate !== null) ? dRate : state.interestRate; // Fallback naar hypotheekrente
    state.duration = Math.round(time);
    state.withdrawalMode = 'linear'; // Simpel houden voor de wizard
    
    // Calculate
    const result = calculateScenario(state);
    
    // Update Dashboard UI
    document.getElementById("kpi-gross").textContent = formatEUR(result.rows[0].gross);
    
    // Gemiddeld voordeel
    const avgBenefit = result.rows.reduce((sum, r) => sum + r.reimbursement, 0) / result.rows.length;
    document.getElementById("kpi-benefit").textContent = formatEUR(avgBenefit);
    
    // Gemiddeld netto
    const avgNet = result.rows.reduce((sum, r) => sum + r.net, 0) / result.rows.length;
    document.getElementById("kpi-net").textContent = formatEUR(avgNet);

    updateChart(result);
    
    lastResult = result;
    lastState = state;
    enableDownloadButtons();

    showStep("step-dashboard");
  });

  buttons.restart?.addEventListener("click", () => {
    // Reset alles
    document.querySelectorAll("input").forEach(i => i.value = "");
    showStep("step-start");
  });
}