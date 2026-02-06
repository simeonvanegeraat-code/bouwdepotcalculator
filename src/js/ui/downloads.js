import { jsPDF } from "jspdf";
import { formatEUR, formatPct } from "../format.js";
import { getChartPngDataUrl } from "./chart.js";

function safeFilenamePart(s) {
  return String(s).replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function downloadBlobUrl(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function enableDownloadButtons() {
  const btnPng = document.getElementById("btn-dl-png");
  const btnPdf = document.getElementById("btn-dl-pdf");
  if (btnPng) btnPng.disabled = false;
  if (btnPdf) btnPdf.disabled = false;
}

export function initDownloads(getLastResult, getLastState, snackbar) {
  const btnPng = document.getElementById("btn-dl-png");
  const btnPdf = document.getElementById("btn-dl-pdf");

  if (btnPng) {
    btnPng.addEventListener("click", () => {
      const dataUrl = getChartPngDataUrl();
      if (!dataUrl) {
        snackbar?.("Geen grafiek beschikbaar.");
        return;
      }

      // Convert dataURL to blob
      fetch(dataUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const filename = `bouwdepotcalculator-grafiek-${Date.now()}.png`;
          downloadBlobUrl(url, filename);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          snackbar?.("PNG gedownload.");
        })
        .catch(() => snackbar?.("Download mislukt."));
    });
  }

  if (btnPdf) {
    btnPdf.addEventListener("click", () => {
      const result = getLastResult?.();
      const state = getLastState?.();

      if (!result || !state) {
        snackbar?.("Geen resultaten beschikbaar.");
        return;
      }

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const margin = 42;
      let y = 52;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Nieuwbouw kosten overzicht", margin, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(120);
      doc.text("Bouwdepotcalculator.nl (indicatief)", margin, y);
      doc.setTextColor(0);
      y += 22;

      // KPI row
      const kpi = [
        ["Gem. netto maandlast", formatEUR(result.avgNet)],
        ["Totale netto kosten", formatEUR(result.totalNet)],
        ["Renteverschil", formatEUR(result.diff)]
      ];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);

      const colW = (W - margin * 2) / 3;
      const boxH = 44;

      kpi.forEach((item, i) => {
        const x = margin + i * colW;
        doc.setDrawColor(220);
        doc.roundedRect(x, y, colW - 8, boxH, 8, 8);

        doc.text(item[0], x + 10, y + 16);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(item[1], x + 10, y + 34);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
      });

      y += boxH + 18;

      // Inputs
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Invoer", margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const inputs = [
        ["Grondbedrag", formatEUR(state.grondbedrag)],
        ["Hypotheekrente", formatPct(state.hypotheekrente)],
        ["Bouwdepot", formatEUR(state.bouwdepot)],
        ["Depot rente", formatPct(state.depotrente)],
        ["Bouwtijd", `${state.bouwtijd} maanden`],
        [
          "Belasting (indicatief)",
          state.taxEnabled ? `aan (${Math.round(state.taxRate * 1000) / 10}%)` : "uit"
        ]
      ];

      inputs.forEach(([k, v]) => {
        doc.setTextColor(80);
        doc.text(`${k}:`, margin, y);
        doc.setTextColor(0);
        doc.text(String(v ?? "—"), margin + 160, y);
        y += 14;
      });

      y += 10;

      // Chart image (if available)
      const chartDataUrl = getChartPngDataUrl();
      if (chartDataUrl) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Grafiek (netto maandlast)", margin, y);
        y += 10;

        // image sizing
        const imgW = W - margin * 2;
        const imgH = 180;

        doc.addImage(chartDataUrl, "PNG", margin, y, imgW, imgH);
        y += imgH + 14;
      }

      // Table (first 12 rows, so it stays 1 page)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Maandoverzicht (eerste 12 maanden)", margin, y);
      y += 12;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0);

      const headers = ["M", "Depot", "Hypo rente", "Depot rente", "Bel.", "Netto"];
      const widths = [24, 82, 82, 82, 60, 82];

      let x = margin;
      headers.forEach((h, i) => {
        doc.setFont("helvetica", "bold");
        doc.text(h, x, y);
        x += widths[i];
      });
      y += 12;

      doc.setFont("helvetica", "normal");

      const rows = result.rows.slice(0, 12);
      rows.forEach((r) => {
        const cells = [
          String(r.month),
          formatEUR(r.depotRemaining),
          formatEUR(r.mortgageInterest),
          formatEUR(r.depotInterest),
          formatEUR(r.taxBenefit),
          formatEUR(r.netMonth)
        ];

        let cx = margin;
        cells.forEach((c, i) => {
          doc.text(String(c), cx, y);
          cx += widths[i];
        });
        y += 12;
      });

      y += 10;
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        "Disclaimer: indicatieve berekening. Controleer voorwaarden bij bank/hypotheekverstrekker en Belastingdienst.",
        margin,
        y,
        { maxWidth: W - margin * 2 }
      );

      const filename = `nieuwbouw-overzicht-${safeFilenamePart(state.bouwtijd)}m-${Date.now()}.pdf`;
      doc.save(filename);
      snackbar?.("PDF gedownload.");
    });
  }
}
