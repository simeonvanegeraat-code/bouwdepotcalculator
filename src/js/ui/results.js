/**
 * src/js/ui/results.js
 * Updates de KPI blokken met de Cashflow data.
 */
import { formatEUR } from "../format.js";

// Init functie (wordt aangeroepen door main.js)
export function initResults() {
  resetKPIs();
}

// Update de getallen op het scherm
export function updateKPIs(result) {
  const elStart = document.getElementById("kpi-start");
  const elEnd = document.getElementById("kpi-end");
  const elTotal = document.getElementById("kpi-total-interest");

  if (elStart) elStart.textContent = formatEUR(result.startNet);
  if (elEnd) elEnd.textContent = formatEUR(result.endNet);
  if (elTotal) elTotal.textContent = formatEUR(result.totalNetInterest);
}

// Reset de getallen naar streepjes
// DEZE FUNCTIE VEROORZAAKTE DE ERROR OMDAT 'export' MOGELIJK ONTBRAK
export function resetKPIs() {
  ["kpi-start", "kpi-end", "kpi-total-interest"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "€ —";
  });
}