/**
 * src/js/ui/downloads.js
 * Regelt PDF en PNG downloads.
 */
import { jsPDF } from "jspdf";
import { getChartPngDataUrl } from "./chart.js";
import { formatEUR } from "../format.js";

// References to state/results (worden doorgegeven via init)
let getLastResult = null;
let getLastState = null;

export function initDownloads(resultGetter, stateGetter, snackbarFn) {
  getLastResult = resultGetter;
  getLastState = stateGetter;

  const btnPng = document.getElementById("btn-dl-png");
  const btnPdf = document.getElementById("btn-dl-pdf");

  btnPng?.addEventListener("click", () => {
    const url = getChartPngDataUrl();
    if (!url) {
      if (snackbarFn) snackbarFn("Geen grafiek beschikbaar.");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = "bouwdepot-grafiek.png";
    a.click();
    if (snackbarFn) snackbarFn("Grafiek gedownload als PNG.");
  });

  btnPdf?.addEventListener("click", () => {
    generatePDF(snackbarFn);
  });
}

export function enableDownloadButtons() {
  const btnPng = document.getElementById("btn-dl-png");
  const btnPdf = document.getElementById("btn-dl-pdf");
  if (btnPng) btnPng.disabled = false;
  if (btnPdf) btnPdf.disabled = false;
}

function generatePDF(snackbarFn) {
  const result = getLastResult ? getLastResult() : null;
  const state = getLastState ? getLastState() : null;

  if (!result || !state) {
    if (snackbarFn) snackbarFn("Geen data om te exporteren.");
    return;
  }

  const doc = new jsPDF();
  const lineHeight = 7;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.text("Bouwdepotcalculator.nl - Rapport", 14, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, 14, y);
  y += 10;

  // Invoer
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Invoergegevens", 14, y);
  y += 8;
  
  doc.setFontSize(10);
  const inputs = [
    `Grondbedrag: ${formatEUR(state.grondbedrag)}`,
    `Hypotheekrente: ${state.hypotheekrente}%`,
    `Bouwdepot: ${formatEUR(state.bouwdepot)}`,
    `Depotrente: ${state.depotrente}%`,
    `Bouwtijd: ${state.bouwtijd} maanden`
  ];

  inputs.forEach(line => {
    doc.text("- " + line, 14, y);
    y += 6;
  });

  y += 6;

  // Resultaten Samenvatting
  doc.setFontSize(12);
  doc.text("Resultaten", 14, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.text(`Gemiddelde netto maandlast: ${formatEUR(result.avgNet)}`, 14, y);
  y += 6;
  doc.text(`Totale kosten bouwperiode: ${formatEUR(result.totalNet)}`, 14, y);
  
  y += 15;

  // Grafiek toevoegen
  const imgData = getChartPngDataUrl();
  if (imgData) {
    doc.addImage(imgData, 'PNG', 14, y, 180, 80);
    y += 85;
  }

  // Tabel (eerste 12 maanden)
  doc.setFontSize(12);
  doc.text("Maandoverzicht (eerste 12 maanden)", 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(100);
  const headers = ["Mnd", "Depot rest", "Rente (uit)", "Rente (in)", "Netto"];
  let xArr = [14, 30, 65, 100, 135];
  
  headers.forEach((h, i) => doc.text(h, xArr[i], y));
  y += 6;
  doc.line(14, y-4, 180, y-4); // lijntje

  doc.setTextColor(0);
  const rows = result.rows.slice(0, 18); // Max 18 rijen op 1 pagina voor simplicity
  
  rows.forEach(r => {
    doc.text(r.month.toString(), xArr[0], y);
    doc.text(formatEUR(r.depotRemaining), xArr[1], y);
    doc.text(formatEUR(r.mortgageInterest), xArr[2], y);
    doc.text(formatEUR(r.depotInterest), xArr[3], y);
    doc.text(formatEUR(r.netMonth), xArr[4], y);
    y += 6;
  });

  if (result.rows.length > 18) {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("... (volledige tabel zie website)", 14, y + 2);
  }

  // Footer / Disclaimer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Indicatief overzicht. Aan deze berekening kunnen geen rechten worden ontleend.", 14, pageHeight - 10);

  doc.save("bouwdepot-overzicht.pdf");
  if (snackbarFn) snackbarFn("PDF rapport gegenereerd.");
}