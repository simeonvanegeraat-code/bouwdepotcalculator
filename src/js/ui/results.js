import { formatEuro } from '../format.js';

// We houden een referentie naar de chart bij om deze te kunnen updaten
let myChart = null;

export function updateKPIs(results) {
    document.getElementById('kpi-net').textContent = formatEuro(results.avgNet);
    document.getElementById('kpi-ground-interest').textContent = formatEuro(results.rows[0].mortgageInterest);
    document.getElementById('kpi-total-cost').textContent = formatEuro(results.totalNet);
}

export function updateChart(results) {
    const ctx = document.getElementById('net-chart').getContext('2d');
    
    const labels = results.rows.map(r => `Mnd ${r.month}`);
    const dataNet = results.rows.map(r => r.netMonth.toFixed(2));

    // Als de chart al bestaat, vernietig hem dan voor een schone update
    if (myChart) {
        myChart.destroy();
    }

    // Gebruik Chart.js (zorg dat je de library in index.html hebt of via npm)
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Netto Maandlast (€)',
                data: dataNet,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { callback: (val) => '€' + val }
                }
            }
        }
    });
}