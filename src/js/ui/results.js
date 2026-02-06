/**
 * src/js/ui/results.js
 * Beheert de tekstuele output (KPI's en samenvatting).
 */
import { formatEUR } from "../format.js";

// DOM elementen cachen we niet globaal om errors bij laden te voorkomen, 
// we zoeken ze 'lazy' of via een init (maar hier simpel via getElementById in functie).

export function updateKPIs(result) {
  const elAvg = document.getElementById("kpi-avg");
  const elTotal = document.getElementById("kpi-total");
  const elDiff = document.getElementById("kpi-diff");

  if (elAvg) elAvg.textContent = formatEUR(result.avgNet);
  if (elTotal) elTotal.textContent = formatEUR(result.totalNet);
  
  if (elDiff) {
    const prefix = result.diff > 0 ? "+ " : ""; // plusje als het duurder wordt
    elDiff.textContent = prefix + formatEUR(result.diff);
    
    // Kleur indicatie (optioneel, via class)
    if (result.diff > 0) elDiff.style.color = "#ef4444"; // Rood (duurder)
    else elDiff.style.color = "#10b981"; // Groen (goedkoper)
  }

  // Update badge boven grafiek
  const elBadge = document.getElementById("chart-badge");
  if (elBadge) {
    elBadge.textContent = `Totaal: ${formatEUR(result.totalNet)}`;
    elBadge.style.opacity = "1";
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
    elBadge.style.opacity = "0.5";
  }
}

export function setSummary(state) {
  const el = document.getElementById("summary-text");
  if (!el) return;

  // Bouw een leesbare zin
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