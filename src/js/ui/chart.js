import Chart from 'chart.js/auto';
import { formatEUR } from "../format.js";

let chartInstance = null;

export function initChart() {
  const ctx = document.getElementById('net-chart');
  if (!ctx) return;

  Chart.defaults.font.family = 'ui-sans-serif, system-ui, sans-serif';
  Chart.defaults.color = '#64748b';

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Bruto Maandlast (Rente + Aflossing)',
          data: [],
          borderColor: '#ef4444', // Rood
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5], // Stippellijn want dit is "bruto"
          tension: 0.1,
          pointRadius: 0
        },
        {
          label: 'Netto van rekening',
          data: [],
          borderColor: '#0ea5e9', // Blauw (Brand)
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 3,
          fill: true, // Vul het vlak onder de lijn
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatEUR(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#e2e8f0' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

export function updateChart(result) {
  if (!chartInstance) return;

  const labels = result.rows.map(r => `Mnd ${r.month}`);
  const dataGross = result.rows.map(r => r.gross);
  const dataNet = result.rows.map(r => r.net);

  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = dataGross;
  chartInstance.data.datasets[1].data = dataNet;
  
  chartInstance.update();
}