import { createState } from "../state.js";
import { toNumberLoose, formatEUR, formatPct, formatInt } from "../format.js";
import { resetKPIs, setSummary, updateKPIs } from "./results.js";
import { calculateScenario } from "../calc/model.js";
import { updateChart, updateTable } from "./chart.js";

function snackbar(msg) {
  const el = document.getElementById("snackbar");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(snackbar._t);
  snackbar._t = window.setTimeout(() => el.classList.remove("show"), 2200);
}

function setError(inputEl, errEl, message) {
  if (!inputEl || !errEl) return;
  if (message) {
    inputEl.setAttribute("aria-invalid", "true");
    errEl.textContent = message;
  } else {
    inputEl.removeAttribute("aria-invalid");
    errEl.textContent = "";
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

  if (!(state.bouwtijd != null && Number.isInteger(state.bouwtijd) && state.bouwtijd >= 1 && state.bouwtijd <= 48))
    errors.bouwtijd = "Vul een aantal maanden in tussen 1 en 48.";

  return errors;
}

export function initForm() {
  const form = document.getElementById("calc-form");
  if (!form) return;

  const state = createState();

  const inputs = {
    grondbedrag: document.getElementById("grondbedrag"),
    hypotheekrente: document.getElementById("hypotheekrente"),
    bouwdepot: document.getElementById("bouwdepot"),
    depotrente: document.getElementById("depotrente"),
    bouwtijd: document.getElementById("bouwtijd"),
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
    bouwtijd: document.getElementById("err-bouwtijd")
  };

  const syncTax = () => {
    state.taxEnabled = !!inputs.taxToggle?.checked;
    if (inputs.taxRate) inputs.taxRate.disabled = !state.taxEnabled;
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
  };

  const applyErrors = (errors) => {
    setError(inputs.grondbedrag, errs.grondbedrag, errors.grondbedrag);
    setError(inputs.hypotheekrente, errs.hypotheekrente, errors.hypotheekrente);
    setError(inputs.bouwdepot, errs.bouwdepot, errors.bouwdepot);
    setError(inputs.depotrente, errs.depotrente, errors.depotrente);
    setError(inputs.bouwtijd, errs.bouwtijd, errors.bouwtijd);

    const ok = Object.keys(errors).length === 0;
    if (inputs.btnCalc) inputs.btnCalc.disabled = !ok;

    if (inputs.status) {
      inputs.status.textContent = ok
        ? "✓ Invoer is geldig. Klik op Bereken."
        : "Vul de ontbrekende velden correct in om door te gaan.";
    }
  };

  const validateAndUpdate = () => {
    read();
    syncTax();
    setSummary(state);
    applyErrors(validate(state));
  };

  // Format on blur (professioneel gevoel)
  const blurFormat = () => {
    read();

    if (inputs.grondbedrag && state.grondbedrag != null) inputs.grondbedrag.value = formatEUR(state.grondbedrag);
    if (inputs.bouwdepot && state.bouwdepot != null) inputs.bouwdepot.value = formatEUR(state.bouwdepot);

    if (inputs.hypotheekrente && state.hypotheekrente != null)
      inputs.hypotheekrente.value = formatPct(state.hypotheekrente);
    if (inputs.depotrente && state.depotrente != null)
      inputs.depotrente.value = formatPct(state.depotrente);

    if (inputs.bouwtijd && state.bouwtijd != null) inputs.bouwtijd.value = formatInt(state.bouwtijd);

    validateAndUpdate();
  };

  // Events
  form.addEventListener("input", validateAndUpdate);
  form.addEventListener("change", validateAndUpdate);

  inputs.taxToggle?.addEventListener("change", () => {
    syncTax();
    validateAndUpdate();
  });
  inputs.taxRate?.addEventListener("change", validateAndUpdate);

  ["grondbedrag", "bouwdepot", "hypotheekrente", "depotrente", "bouwtijd"].forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener("blur", blurFormat);
  });

  // Reset
  form.addEventListener("reset", () => {
    setTimeout(() => {
      Object.assign(state, createState());
      if (inputs.taxRate) inputs.taxRate.value = "0.37";
      if (inputs.taxRate) inputs.taxRate.disabled = true;

      resetKPIs();
      setSummary(state);
      validateAndUpdate();
      snackbar("Formulier gereset.");
    }, 0);
  });

  // Bereken
  inputs.btnCalc?.addEventListener("click", () => {
    validateAndUpdate();
    if (inputs.btnCalc?.disabled) return;

    const result = calculateScenario(state);

    updateKPIs(result);
    updateChart(result);
    updateTable(result);

    snackbar("Dashboard bijgewerkt.");
    document.querySelector(".chart-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Init
  syncTax();
  setSummary(state);
  validateAndUpdate();
}
