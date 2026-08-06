document.addEventListener('DOMContentLoaded', () => {
    // 1. Calculator Logic & Chart
    const amountInput = document.getElementById('depotAmount');
    const amountSlider = document.getElementById('depotSlider');
    const hypoRenteInput = document.getElementById('hypoRente');
    const depotRenteInput = document.getElementById('depotRente');
    const looptijdSlider = document.getElementById('looptijdSlider');
    const looptijdVal = document.getElementById('looptijdVal');

    const resultNetto = document.getElementById('resultNetto');
    const resultBruto = document.getElementById('resultBruto');
    const resultOntvangen = document.getElementById('resultOntvangen');
    const resultFiscaal = document.getElementById('resultFiscaal');

    let depotChart;

    function initChart() {
        const ctx = document.getElementById('depotChart').getContext('2d');
        depotChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Depot Saldo (€)',
                        data: [],
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function calculate() {
        const amount = parseFloat(amountInput.value) || 0;
        const hypoRente = parseFloat(hypoRenteInput.value) || 0;
        const depotRente = parseFloat(depotRenteInput.value) || 0;
        const months = parseInt(looptijdSlider.value) || 12;

        looptijdVal.textContent = months;

        // Simplify linear depletion of depot for visualization
        const monthlyDepletion = amount / months;
        let currentSaldo = amount;
        
        let totalHypoRentePaid = 0;
        let totalDepotRenteReceived = 0;
        
        const labels = [];
        const saldoData = [];

        for (let i = 1; i <= months; i++) {
            labels.push(`Mnd ${i}`);
            saldoData.push(currentSaldo);

            // Rente = (Saldo * RentePercentage / 100) / 12
            totalHypoRentePaid += (amount * (hypoRente / 100)) / 12;
            totalDepotRenteReceived += (currentSaldo * (depotRente / 100)) / 12;

            currentSaldo -= monthlyDepletion;
            if(currentSaldo < 0) currentSaldo = 0;
        }

        const avgBrutoMonth = totalHypoRentePaid / months;
        const avgOntvangenMonth = totalDepotRenteReceived / months;
        const brutoCost = avgBrutoMonth - avgOntvangenMonth;
        
        // Rough tax deduction assumption (37% marginal rate on paid interest)
        const taxBenefit = (avgBrutoMonth * 0.37);
        const nettoCost = brutoCost - taxBenefit;

        // Format to UI
        const formatEur = (val) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);
        
        resultNetto.textContent = formatEur(nettoCost > 0 ? nettoCost : 0);
        resultBruto.textContent = formatEur(totalHypoRentePaid);
        resultOntvangen.textContent = '+ ' + formatEur(totalDepotRenteReceived);
        resultFiscaal.textContent = '+ ' + formatEur(taxBenefit * months);

        // Update Chart
        depotChart.data.labels = labels;
        depotChart.data.datasets[0].data = saldoData;
        depotChart.update();
    }

    // Event Listeners for Calculator
    [amountInput, amountSlider, hypoRenteInput, depotRenteInput, looptijdSlider].forEach(el => {
        el.addEventListener('input', (e) => {
            if(e.target === amountSlider) amountInput.value = amountSlider.value;
            if(e.target === amountInput) amountSlider.value = amountInput.value;
            calculate();
        });
    });

    initChart();
    calculate();


    // 2. Checklist Search Logic
    const searchInput = document.getElementById('checkSearch');
    const items = document.querySelectorAll('.checklist-item');

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? 'flex' : 'none';
            });
        });
    }

    // 3. PDF Export Logic
    const btnExport = document.getElementById('btnExportPdf');
    if(btnExport) {
        btnExport.addEventListener('click', () => {
            const element = document.getElementById('reportCard');
            // Hide the button during PDF generation
            btnExport.style.display = 'none';
            
            html2pdf().from(element).set({
                margin: 1,
                filename: 'Bouwdepot_Rapport_2026.pdf',
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            }).save().then(() => {
                btnExport.style.display = 'flex';
            });
        });
    }
});
