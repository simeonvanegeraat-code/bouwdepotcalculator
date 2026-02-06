/**
 * src/js/ui/chart.js
 * Beheert Chart.js en de HTML tabel.
 */
import Chart from 'chart.js/auto';
import { formatEUR } from "../format.js";

let chartInstance = null;

// Light mode colors
const COL_LINE = '#0ea5e9'; // Sky 500
const COL_FILL = 'rgba(14, 165, 233, 0.1)';
const COL_GRID = '#e2e8f0'; // Slate 200
const COL_TEXT = '#64748b'; // Slate 500

export function initChart() {
  const ctx = document.getElementById('net-chart');
  if (!ctx) return;

  Chart.defaults.font.family = 'ui-sans-serif, system-ui, sans-serif';
  Chart.defaults.color = COL_TEXT;

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Netto maandlast',
        data: [],
        borderColor: COL_LINE,
        backgroundColor: COL_FILL,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx) => ` Netto: ${formatEUR(ctx.parsed.y)}`
          },
          backgroundColor: '#fff',
          titleColor: '#0f172a',
          bodyColor: '#0f172a',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { maxTicksLimit: 6 }
        },
        y: {
          grid: { color: COL_GRID, borderDash: [4, 4], drawBorder: false },
          beginAtZero: true
        }
      }
    }
  });
}

export function updateChart(result) {
  if (!chartInstance) return;

  // Data mappen
  const labels = result.rows.map(r => `Mnd ${r.month}`);
  const data = result.rows.map(r => r.netMonth);

  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = data;
  chartInstance.update();
}

export function updateTable(result) {
  const tbody = document.getElementById("result-tbody");
  if (!tbody) return;

  // Clear
  tbody.innerHTML = "";

  if (!result.rows || result.rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">Geen data.</td></tr>`;
    return;
  }

  // Build rows (max 12 of 24 tonen of alles, hier alles met scroll)
  // Gebruik document fragment voor performance
  const fragment = document.createDocumentFragment();

  result.rows.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.month}</td>
      <td class="muted">${formatEUR(row.depotRemaining)}</td>
      <td class="muted">${formatEUR(row.mortgageInterest)}</td>
      <td style="color:#10b981">+ ${formatEUR(row.depotInterest)}</td>
      <td class="muted">${row.taxBenefit > 0 ? '-' : ''} ${formatEUR(row.taxBenefit)}</td>
      <td style="font-weight:600; color:#0f172a">${formatEUR(row.netMonth)}</td>
    `;
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
}

// Nodig voor export
export function getChartPngDataUrl() {
  if (!chartInstance) return null;
  return chartInstance.toBase64Image();
}