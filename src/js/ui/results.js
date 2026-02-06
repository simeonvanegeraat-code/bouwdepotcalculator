/**
 * src/js/ui/downloads.js
 * PDF generatie aangepast op nieuwe Cashflow model.
 */
import { jsPDF } from "jspdf";
import { getChartPngDataUrl } from "./chart.js";
import { formatEUR } from "../format.js";

let getLastResult = null;
let getLastState = null;

export function initDownloads(resultGetter, stateGetter, snackbarFn) {
  getLastResult = resultGetter;
  getLastState = stateGetter;

  // Let op: In nieuwe HTML heb ik de PNG knop weggehaald, alleen PDF over.
  // Voor veiligheid checken we of btn-dl-png bestaat.
  const btnPng = document.getElementById("btn-dl-png");
  if (btnPng) {
     btnPng.addEventListener("click", () => {
        const url = getChartPngDataUrl();
        if (url) {
            const a = document.createElement("a");
            a.href = url;
            a.download = "cashflow-grafiek.png";
            a.click();
        }
     });
  }

  const btnPdf = document.getElementById("btn-dl-pdf");
  btnPdf?.addEventListener("click", () => {
    generatePDF(snackbarFn);
  });
}

export function enableDownloadButtons() {
  const btnPdf = document.getElementById("btn-dl-pdf");
  if (btnPdf) btnPdf.disabled = false;
  
  const btnPng = document.getElementById("btn-dl-png");
  if (btnPng) btnPng.disabled = false;
}

function generatePDF(snackbarFn) {
  const result = getLastResult ? getLastResult() : null;
  const state = getLastState ? getLastState() : null;

  if (!result || !state) {
    if (snackbarFn) snackbarFn("Geen data.");
    return;
  }

  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.text("Bouwdepot Cashflow Rapport", 14, y);
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
    `Totale Hypotheek: ${formatEUR(state.loanTotal)}`,
    `Hypotheekrente: ${state.interestRate}%`,
    `Maandelijkse aflossing: ${formatEUR(state.repayment)}`,
    `Bouwdepot deel: ${formatEUR(state.depotTotal)}`,
    `Depotrente vergoeding: ${state.depotRate}%`,
    `Bouwtijd: ${state.duration} maanden`
  ];

  inputs.forEach(line => {
    doc.text("- " + line, 14, y);
    y += 6;
  });

  y += 6;

  // Resultaten
  doc.setFontSize(12);
  doc.text("Resultaten", 14, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.text(`Start maandlast (netto): ${formatEUR(result.startNet)}`, 14, y);
  y += 6;
  doc.text(`Eind maandlast (netto): ${formatEUR(result.endNet)}`, 14, y);
  y += 6;
  doc.text(`Totaal betaalde rente (over hele bouw): ${formatEUR(result.totalNetInterest)}`, 14, y);
  
  y += 15;

  // Grafiek
  const imgData = getChartPngDataUrl();
  if (imgData) {
    doc.addImage(imgData, 'PNG', 14, y, 180, 80);
    y += 85;
  }

  // Tabel
  doc.setFontSize(12);
  doc.text("Maandoverzicht", 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(100);
  // Nieuwe headers: Bruto, Vergoeding, Netto
  const headers = ["Mnd", "Bruto Last", "Vergoeding", "Netto Te Betalen", "Depot Stand"];
  let xArr = [14, 30, 60, 90, 130];
  
  headers.forEach((h, i) => doc.text(h, xArr[i], y));
  y += 6;
  doc.line(14, y-4, 180, y-4);

  doc.setTextColor(0);
  
  // Max 24 rijen voor PDF zodat het op 1 pagina past
  const rows = result.rows.slice(0, 24); 
  
  rows.forEach(r => {
    doc.text(r.month.toString(), xArr[0], y);
    doc.text(formatEUR(r.gross), xArr[1], y);
    doc.text(formatEUR(r.reimbursement), xArr[2], y);
    doc.text(formatEUR(r.net), xArr[3], y);
    doc.text(formatEUR(r.depotStand), xArr[4], y);
    y += 6;
  });

  doc.save("bouwdepot-cashflow.pdf");
  if (snackbarFn) snackbarFn("PDF gegenereerd.");
}