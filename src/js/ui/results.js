import { formatEUR, formatPct } from "../format.js";

let els = null;

export function initResults() {
  els = {
    avg: document.getElementById("kpi-avg"),
    total: document.getElementById("kpi-total"),
    diff: document.getElementById("kpi-diff"),
    summary: document.getElementById("summary-text")
  };
}

export function setSummary(state) {
  if (!els?.summary) return;

  const parts = [];

  if (state.grondbedrag != null) parts.push(`Grond: <strong>${formatEUR(state.grondbedrag)}</strong>`);
  if (state.hypotheekrente != null) parts.push(`Hypotheekrente: <strong>${formatPct(state.hypotheekrente)}</strong>`);
  if (state.bouwdepot != null) parts.push(`Bouwdepot: <strong>${formatEUR(state.bouwdepot)}</strong>`);
  if (state.depotrente != null) parts.push(`Depot rente: <strong>${formatPct(state.depotrente)}</strong>`);
  if (state.bouwtijd != null) parts.push(`Bouwtijd: <strong>${state.bouwtijd} mnd</strong>`);

  parts.push(
    state.taxEnabled
      ? `Belasting: <strong>aan</strong> (${Math.round(state.taxRate * 1000) / 10}%)`
      : `Belasting: <strong>uit</strong>`
  );

  els.summary.innerHTML = parts.length ? parts.join(" · ") : "Vul links je gegevens in.";
}

export function resetKPIs() {
  if (els?.avg) els.avg.textContent = "€ —";
  if (els?.total) els.total.textContent = "€ —";
  if (els?.diff) els.diff.textContent = "€ —";
}
