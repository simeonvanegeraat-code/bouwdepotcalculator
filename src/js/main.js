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
    // 1. VERBOUW CALCULATOR (De oude code voor index.html)
    // ----------------------------------------------
    function initVerbouwCalculator() {
        // (Plak hier de oude verbouw code uit je vorige versie terug als je wilt, 
        // voor de volledigheid laat ik hem hier even kort om de focus op nieuwbouw te houden).
        // Zie vorige antwoord voor de volledige verbouw-functie.
        const rangeAmount = document.getElementById('range-amount');
        const inputAmount = document.getElementById('input-amount');
        // ... rest van initialisatie ...
        // Voor nu even placeholder zodat index.html niet crasht:
        if(rangeAmount) {
             // ... voer hier je oude logica in ...
             console.log("Verbouw calc actief");
        }
    }


    // ----------------------------------------------
    // 2. NIEUWBOUW CALCULATOR (MET TERMIJNEN)
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

        // --- DATA MODEL ---
        // Standaard schema: (Voorbeeld Woningborg)
        let terms = [
            { month: 1, percent: 15, desc: "Ruwbouw begane grond" },
            { month: 3, percent: 20, desc: "Ruwbouw verdiepingen" },
            { month: 6, percent: 20, desc: "Dak & Gevelsluiting" },
            { month: 9, percent: 25, desc: "Afbouw & Installaties" },
            { month: 12, percent: 20, desc: "Oplevering" }
        ];

        // --- RENDER DE RIJEN ---
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

            // Update Totaal check
            totalPercentEl.textContent = totalP + '%';
            if(totalP !== 100) {
                totalPercentEl.classList.remove('text-green-600');
                totalPercentEl.classList.add('text-red-600');
            } else {
                totalPercentEl.classList.remove('text-red-600');
                totalPercentEl.classList.add('text-green-600');
            }

            // Bind events aan nieuwe inputs
            document.querySelectorAll('.term-month').forEach(el => el.addEventListener('change', updateTermData));
            document.querySelectorAll('.term-percent').forEach(el => el.addEventListener('change', updateTermData));
            document.querySelectorAll('.remove-term').forEach(el => el.addEventListener('click', removeTerm));
        }

        function updateTermData(e) {
            const idx = e.target.dataset.idx;
            const field = e.target.classList.contains('term-month') ? 'month' : 'percent';
            terms[idx][field] = parseInt(e.target.value) || 0;
            // Sorteer op maand zodat de grafiek klopt
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

        // --- DE BEREKENING ---
        function calculate() {
            const landPrice = parseFloat(inputLand.value) || 0;
            const constructPrice = parseFloat(inputConstruction.value) || 0;
            const interest = parseFloat(inputInterest.value) || 0;
            const monthlyRate = (interest / 100) / 12;

            // Totale lening
            const totalLoan = landPrice + constructPrice;
            
            // Maximale annuïteit (als alles klaar is) - o.b.v. 30 jaar
            const n = 30 * 12;
            let fullAnnuity = 0;
            if(interest !== 0) {
                fullAnnuity = totalLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));
            }

            // Simulatie per maand
            // We zoeken de laatste bouwmaand om de loop te bepalen
            const maxMonth = terms.length > 0 ? Math.max(...terms.map(t => t.month)) : 12;
            
            let currentDepot = constructPrice;
            let totalLoss = 0;
            
            const chartLabels = [];
            const chartData = [];

            // Loop van maand 1 tot oplevering
            for(let m = 1; m <= maxMonth; m++) {
                // Is er een termijn in deze maand?
                const term = terms.find(t => t.month === m);
                if(term) {
                    const amount = (term.percent / 100) * constructPrice;
                    currentDepot -= amount;
                    if(currentDepot < 0) currentDepot = 0;
                }

                // Rente berekening van deze maand
                // Je betaalt rente over (Totale Lening - Wat nog in depot zit)
                // Of anders gezegd: Je betaalt alles, maar krijgt rente terug over depot.
                
                const interestPayable = totalLoan * monthlyRate;
                const interestReceivable = currentDepot * monthlyRate;
                
                // Netto rente lasten (dit is het "renteverlies")
                const netInterest = interestPayable - interestReceivable;
                
                // Totale maandlast (incl aflossing op het reeds opgenomen deel is complex, 
                // we houden het hier op: Volledige Annuïteit min RenteVergoeding)
                const currentMonthlyPayment = fullAnnuity - interestReceivable;

                totalLoss += netInterest;

                chartLabels.push(`Mnd ${m}`);
                chartData.push(currentMonthlyPayment);
            }

            // Update UI
            resTotalLoan.textContent = formatEuro(totalLoan);
            
            // Start maandlast (Maand 0/1: alleen grond is betaald, depot is nog vol)
            const startDepot = constructPrice;
            const startInterestReceivable = startDepot * monthlyRate;
            resStartMonthly.textContent = formatEuro(fullAnnuity - startInterestReceivable);
            
            resMaxMonthly.textContent = formatEuro(fullAnnuity);
            resLoss.textContent = formatEuro(totalLoss);

            updateChart(chartLabels, chartData);
        }

        // --- CHARTJS ---
        function updateChart(labels, data) {
            const ctx = document.getElementById('costChart');
            
            if(costChart) {
                costChart.data.labels = labels;
                costChart.data.datasets[0].data = data;
                costChart.update();
            } else {
                costChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Netto Maandlasten',
                            data: data,
                            backgroundColor: '#FF6200', // Rabo oranje
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: { beginAtZero: true }
                        },
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        }

        // Events
        inputLand.addEventListener('input', calculate);
        inputConstruction.addEventListener('input', () => {
             renderTerms(); // Percentages herberekenen naar bedragen
             calculate(); 
        });
        inputInterest.addEventListener('input', calculate);

        // Init
        renderTerms(); // Bouwt de eerste DOM elementen
        setTimeout(calculate, 100); // Wacht even tot DOM klaar is voor Chart
    }
});