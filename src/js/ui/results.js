import { formatEUR } from "../format.js";

let els = null;

export function initResults() {
  els = {
    avg: document.getElementById("kpi-avg"),
    total: document.getElementById("kpi-total"),
    diff: document.getElementById("kpi-diff"),
    summary: document.getElementById("summary-text")
  };
}

export function updateKPIs(result) {
  if (!result || !els) return;

  els.avg.textContent = formatEUR(result.avgNet);
  els.total.textContent = formatEUR(result.totalNet);
  els.diff.textContent = formatEUR(result.diff);
}

export function resetKPIs() {
  if (!els) return;
  els.avg.textContent = "€ —";
  els.total.textContent = "€ —";
  els.diff.textContent = "€ —";
}

export function setSummary(state) {
  if (!els?.summary) return;

  const parts = [];

  if (state.grondbedrag)
    parts.push(`Grond: €${Math.round(state.grondbedrag).toLocaleString("nl-NL")}`);
  if (state.hypotheekrente)
    parts.push(`Rente: ${state.hypotheekrente}%`);
  if (state.bouwdepot)
    parts.push(`Depot: €${Math.round(state.bouwdepot).toLocaleString("nl-NL")}`);
  if (state.bouwtijd)
    parts.push(`Bouwtijd: ${state.bouwtijd} mnd`);

  els.summary.innerHTML = parts.join(" · ") || "Vul gegevens in.";
}
