import Chart from "chart.js/auto";
import { formatEUR } from "../format.js";

let chart = null;

function formatEUR0(n) {
  return formatEUR(n); // in format.js is maxFractionDigits 0
}

export function initChart() {
  const canvas = document.getElementById("net-chart");
  if (!canvas) return;

  // init lege chart
  chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Netto maandlast",
          data: [],
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${formatEUR0(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 8 }
        },
        y: {
          ticks: {
            callback: (value) => formatEUR0(value)
          }
        }
      }
    }
  });
}

export function updateChart(result) {
  if (!chart || !result) return;

  const labels = result.rows.map((r) => `M${r.month}`);
  const data = result.rows.map((r) => Math.round(r.netMonth));

  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();

  // Badge (gemiddelde)
  const badge = document.getElementById("chart-badge");
  if (badge) badge.textContent = `Gemiddeld: ${formatEUR0(result.avgNet)}`;
}

export function updateTable(result) {
  const tbody = document.getElementById("result-tbody");
  if (!tbody) return;

  if (!result?.rows?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">Geen resultaat.</td></tr>`;
    return;
  }

  const rowsHtml = result.rows
    .map((r) => {
      const depotStand = Math.max(0, r.depotRemaining);
      return `
        <tr>
          <td>${r.month}</td>
          <td>${formatEUR0(depotStand)}</td>
          <td>${formatEUR0(r.mortgageInterest)}</td>
          <td>${formatEUR0(r.depotInterest)}</td>
          <td>${formatEUR0(r.taxBenefit)}</td>
          <td><strong>${formatEUR0(r.netMonth)}</strong></td>
        </tr>
      `;
    })
    .join("");

  tbody.innerHTML = rowsHtml;
}
