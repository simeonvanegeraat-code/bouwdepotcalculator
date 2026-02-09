import '../styles/main.css';

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER: FORMAT EURO ---
    const formatEuro = (val) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    // --- GLOBAL PDF & ROUTING ---
    const btnDownload = document.getElementById('btn-download');
    if(btnDownload) btnDownload.addEventListener('click', () => window.print());

    if (document.getElementById('range-amount')) initVerbouwCalculator();
    if (document.getElementById('nieuwbouw-calc')) initNieuwbouwCalculator();


    // ----------------------------------------------
    // 1. VERBOUW CALCULATOR
    // ----------------------------------------------
    function initVerbouwCalculator() {
        const rangeAmount = document.getElementById('range-amount');
        const inputAmount = document.getElementById('input-amount');
        const rangeInterest = document.getElementById('range-interest');
        const inputInterest = document.getElementById('input-interest');
        const rangeDuration = document.getElementById('range-duration');
        const checkAftrek = document.getElementById('check-aftrek');

        const valDuration = document.getElementById('val-duration');
        const resBruto = document.getElementById('res-bruto');
        const resVoordeel = document.getElementById('res-voordeel');
        const resNetto = document.getElementById('res-netto');

        function calculate() {
            const amount = parseFloat(inputAmount.value);
            const interest = parseFloat(inputInterest.value);
            const years = parseInt(rangeDuration.value);
            
            valDuration.textContent = `${years} Jaar`;

            const monthlyRate = (interest / 100) / 12;
            const totalMonths = years * 12;
            
            let grossMonthly = 0;
            if (interest === 0 || isNaN(interest)) {
                grossMonthly = amount / totalMonths;
            } else {
                grossMonthly = amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));
            }

            const taxRate = 0.3697;
            const firstMonthInterest = amount * monthlyRate; 
            const taxBenefit = checkAftrek.checked ? (firstMonthInterest * taxRate) : 0;
            const netMonthly = grossMonthly - taxBenefit;

            resBruto.textContent = formatEuro(grossMonthly);
            
            if (checkAftrek.checked) {
                resVoordeel.parentElement.style.display = 'flex';
                resVoordeel.textContent = '-' + formatEuro(taxBenefit);
            } else {
                resVoordeel.parentElement.style.display = 'none';
            }
            resNetto.textContent = formatEuro(netMonthly);
        }

        rangeAmount.addEventListener('input', (e) => { inputAmount.value = e.target.value; calculate(); });
        inputAmount.addEventListener('input', (e) => { rangeAmount.value = e.target.value; calculate(); });
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        rangeDuration.addEventListener('input', calculate);
        checkAftrek.addEventListener('change', calculate);
        
        if(rangeAmount) calculate();
    }


    // ----------------------------------------------
    // 2. NIEUWBOUW CALCULATOR (MET GESTAPELDE GRAFIEK)
    // ----------------------------------------------
    function initNieuwbouwCalculator() {
        // Inputs
        const inputLand = document.getElementById('input-land');
        const inputConstruction = document.getElementById('input-construction');
        const inputInterest = document.getElementById('input-interest');
        const termsContainer = document.getElementById('terms-container');
        const addTermBtn = document.getElementById('add-term-btn');
        const totalPercentEl = document.getElementById('total-percent');

        // Results
        const resTotalLoan = document.getElementById('res-total-loan');
        const resStartMonthly = document.getElementById('res-start-monthly');
        const resMaxMonthly = document.getElementById('res-max-monthly');
        const resLoss = document.getElementById('res-loss');

        // Chart
        let costChart = null;

        // Standaard schema
        let terms = [
            { month: 1, percent: 15, desc: "Ruwbouw begane grond" },
            { month: 3, percent: 20, desc: "Ruwbouw verdiepingen" },
            { month: 6, percent: 20, desc: "Dak & Gevelsluiting" },
            { month: 9, percent: 25, desc: "Afbouw & Installaties" },
            { month: 12, percent: 20, desc: "Oplevering" }
        ];

        function renderTerms() {
            termsContainer.innerHTML = '';
            let totalP = 0;

            terms.forEach((term, index) => {
                totalP += term.percent;
                const row = document.createElement('div');
                row.className = 'flex gap-2 items-center';
                row.innerHTML = `
                    <div class="w-16">
                        <label class="text-[10px] uppercase font-bold text-gray-400 block">Maand</label>
                        <input type="number" min="1" max="36" value="${term.month}" data-idx="${index}" class="term-month w-full border rounded p-1 text-sm font-bold text-center">
                    </div>
                    <div class="flex-1">
                         <label class="text-[10px] uppercase font-bold text-gray-400 block">Omschrijving</label>
                         <input type="text" value="${term.desc}" class="w-full border rounded p-1 text-sm bg-transparent">
                    </div>
                    <div class="w-20 relative">
                        <label class="text-[10px] uppercase font-bold text-gray-400 block">Percentage</label>
                        <input type="number" min="0" max="100" value="${term.percent}" data-idx="${index}" class="term-percent w-full border rounded p-1 text-sm font-bold pr-6">
                        <span class="absolute right-2 top-6 text-gray-400 text-sm">%</span>
                    </div>
                    <button class="remove-term text-red-400 hover:text-red-600 mt-4" data-idx="${index}">×</button>
                `;
                termsContainer.appendChild(row);
            });

            totalPercentEl.textContent = totalP + '%';
            if(totalP !== 100) {
                totalPercentEl.classList.remove('text-green-600');
                totalPercentEl.classList.add('text-red-600');
            } else {
                totalPercentEl.classList.remove('text-red-600');
                totalPercentEl.classList.add('text-green-600');
            }

            document.querySelectorAll('.term-month').forEach(el => el.addEventListener('change', updateTermData));
            document.querySelectorAll('.term-percent').forEach(el => el.addEventListener('change', updateTermData));
            document.querySelectorAll('.remove-term').forEach(el => el.addEventListener('click', removeTerm));
        }

        function updateTermData(e) {
            const idx = e.target.dataset.idx;
            const field = e.target.classList.contains('term-month') ? 'month' : 'percent';
            terms[idx][field] = parseInt(e.target.value) || 0;
            terms.sort((a, b) => a.month - b.month);
            calculate();
        }

        function removeTerm(e) {
            const idx = e.target.dataset.idx;
            terms.splice(idx, 1);
            renderTerms();
            calculate();
        }

        addTermBtn.addEventListener('click', () => {
            const lastMonth = terms.length > 0 ? terms[terms.length-1].month : 0;
            terms.push({ month: lastMonth + 2, percent: 0, desc: "Nieuwe termijn" });
            renderTerms();
        });

        function calculate() {
            const landPrice = parseFloat(inputLand.value) || 0;
            const constructPrice = parseFloat(inputConstruction.value) || 0;
            const interest = parseFloat(inputInterest.value) || 0;
            const monthlyRate = (interest / 100) / 12;

            const totalLoan = landPrice + constructPrice;
            const n = 30 * 12;
            
            // 1. De VOLLEDIGE Annuïteit (constante bruto maandlast als alles af is)
            let fullAnnuity = 0;
            if(interest !== 0) {
                fullAnnuity = totalLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));
            }

            const maxMonth = terms.length > 0 ? Math.max(...terms.map(t => t.month)) : 12;
            
            let currentDepot = constructPrice;
            let totalLoss = 0;
            
            const chartLabels = [];
            const dataUserPays = [];
            const dataDepotPays = [];

            for(let m = 1; m <= maxMonth; m++) {
                // Termijn afboeken
                const term = terms.find(t => t.month === m);
                if(term) {
                    const amount = (term.percent / 100) * constructPrice;
                    currentDepot -= amount;
                    if(currentDepot < 0) currentDepot = 0;
                }

                // Rente vergoeding van de bank (Het "Cadeautje")
                // = Saldo in depot * maandrente
                const interestReceivable = currentDepot * monthlyRate;
                
                // Wat jij zelf moet betalen (Netto maandlast)
                // = Volledige Annuïteit - Rente Vergoeding
                // Let op: Bij lineaire bouwrente berekeningen betaal je rente over het opgenomen deel. 
                // Maar bij annuïteiten betaal je bruto het hele bedrag en krijg je depotrente terug.
                // Dit komt op hetzelfde neer, maar visualiseert mooier in een stacked chart.
                
                const netPayment = fullAnnuity - interestReceivable;

                // Renteverlies teller (alleen het rente-deel, niet aflossing)
                const interestPayableTotal = totalLoan * monthlyRate;
                const netInterestLoss = interestPayableTotal - interestReceivable;
                totalLoss += netInterestLoss;

                chartLabels.push(`Mnd ${m}`);
                dataUserPays.push(netPayment);      // Blauw
                dataDepotPays.push(interestReceivable); // Groen
            }

            resTotalLoan.textContent = formatEuro(totalLoan);
            
            // Start situatie (Alleen grond betaald)
            const startDepot = constructPrice;
            const startInterestReceivable = startDepot * monthlyRate;
            resStartMonthly.textContent = formatEuro(fullAnnuity - startInterestReceivable);
            
            resMaxMonthly.textContent = formatEuro(fullAnnuity);
            resLoss.textContent = formatEuro(totalLoss);

            updateChart(chartLabels, dataUserPays, dataDepotPays);
        }

        function updateChart(labels, dataUser, dataDepot) {
            const ctx = document.getElementById('costChart');
            
            if(costChart) {
                costChart.data.labels = labels;
                costChart.data.datasets[0].data = dataUser;
                costChart.data.datasets[1].data = dataDepot;
                costChart.update();
            } else {
                costChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Uw Netto Maandlast',
                                data: dataUser,
                                backgroundColor: '#000066', // Blauw (Onderop)
                                borderRadius: 2
                            },
                            {
                                label: 'Rente Vergoeding (Depot)',
                                data: dataDepot,
                                backgroundColor: '#4ade80', // Groen (Bovenop)
                                borderRadius: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { stacked: true }, // DIT ZORGT VOOR HET STAPELEN
                            y: { 
                                stacked: true,    // DIT OOK
                                beginAtZero: true 
                            }
                        },
                        plugins: {
                            tooltip: {
                                mode: 'index',
                                intersect: false
                            },
                            legend: { display: false } // We hebben onze eigen legenda gemaakt
                        }
                    }
                });
            }
        }

        inputLand.addEventListener('input', calculate);
        inputConstruction.addEventListener('input', () => { renderTerms(); calculate(); });
        inputInterest.addEventListener('input', calculate);

        renderTerms();
        setTimeout(calculate, 100);
    }
});