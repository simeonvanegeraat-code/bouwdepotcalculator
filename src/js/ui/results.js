/**
 * src/js/ui/results.js
 * UPDATE: Inclusief initResults export
 */
import { formatEUR } from "../format.js";

export function initResults() {
  resetKPIs();
  // Eventuele andere startup logica voor results
}

export function updateKPIs(result) {
  const elAvg = document.getElementById("kpi-avg");
  const elTotal = document.getElementById("kpi-total");
  const elDiff = document.getElementById("kpi-diff");

  if (elAvg) elAvg.textContent = formatEUR(result.avgNet);
  if (elTotal) elTotal.textContent = formatEUR(result.totalNet);
  
  if (elDiff) {
    const prefix = result.diff > 0 ? "+ " : ""; 
    elDiff.textContent = prefix + formatEUR(result.diff);
    
    // Kleur: Rood/Groen of neutraal (afhankelijk van CSS classes of inline style)
    // Bij light mode: Rood = #ef4444, Groen = #10b981
    if (result.diff > 0) elDiff.style.color = "#ef4444"; 
    else elDiff.style.color = "#10b981"; 
  }

  const elBadge = document.getElementById("chart-badge");
  if (elBadge) {
    elBadge.textContent = `Totaal: ${formatEUR(result.totalNet)}`;
    elBadge.style.opacity = "1";
    elBadge.style.background = "#e0f2fe"; // lichte blauwe tint
    elBadge.style.borderColor = "#bae6fd";
    elBadge.style.color = "#0284c7";
  }
}

export function resetKPIs() {
  ["kpi-avg", "kpi-total", "kpi-diff"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = "€ —";
      el.style.color = "";
    }
  });

  const elBadge = document.getElementById("chart-badge");
  if (elBadge) {
    elBadge.textContent = "—";
    elBadge.style.opacity = "0.6";
    elBadge.style.background = "";
    elBadge.style.borderColor = "";
    elBadge.style.color = "";
  }
}

export function setSummary(state) {
  const el = document.getElementById("summary-text");
  if (!el) return;

  const parts = [];
  
  if (state.grondbedrag) parts.push(`Grond: <strong>${formatEUR(state.grondbedrag)}</strong>`);
  if (state.bouwdepot) parts.push(`Depot: <strong>${formatEUR(state.bouwdepot)}</strong>`);
  if (state.bouwtijd) parts.push(`Tijd: <strong>${state.bouwtijd} mnd</strong>`);
  
  if (parts.length === 0) {
    el.innerHTML = "Vul links je gegevens in.";
    return;
  }

  let html = parts.join(" • ");
  
  if (state.taxEnabled) {
    html += `<br><small class="muted">Incl. belastingvoordeel (${state.taxRate * 100}%)</small>`;
  } else {
    html += `<br><small class="muted">Excl. belastingteruggave</small>`;
  }

  el.innerHTML = html;
}