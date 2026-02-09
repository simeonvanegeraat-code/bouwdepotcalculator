import '../styles/main.css';

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER: FORMAT EURO ---
    const formatEuro = (val) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    // --- GLOBAL PDF & ROUTING ---
    const btnDownload = document.getElementById('btn-download');
    if(btnDownload) btnDownload.addEventListener('click', () => window.print());

    // Routing: Check welke elementen bestaan om te bepalen op welke pagina we zijn
    if (document.getElementById('range-amount')) initVerbouwCalculator();
    if (document.getElementById('nieuwbouw-calc')) initNieuwbouwCalculator();


    // ----------------------------------------------
    // 1. VERBOUW CALCULATOR (Homepage)
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

        // Event Listeners (Sync sliders & inputs)
        rangeAmount.addEventListener('input', (e) => { inputAmount.value = e.target.value; calculate(); });
        inputAmount.addEventListener('input', (e) => { rangeAmount.value = e.target.value; calculate(); });
        
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        
        rangeDuration.addEventListener('input', calculate);
        checkAftrek.addEventListener('change', calculate);
        
        // Init
        if(rangeAmount) calculate();
    }


    // ----------------------------------------------
    // 2. NIEUWBOUW CALCULATOR (Met Termijn Editor & Grafiek)
    // ----------------------------------------------
    function initNieuwbouwCalculator() {
        // Inputs & Sliders
        const inputLand = document.getElementById('input-land');
        const rangeLand = document.getElementById('range-land'); // Toegevoegd

        const inputConstruction = document.getElementById('input-construction');
        const rangeConstruction = document.getElementById('range-construction'); // Toegevoegd

        const inputInterest = document.getElementById('input-interest');
        const rangeInterest = document.getElementById('range-interest'); // Toegevoegd

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

        // Standaard schema (Data Model)
        let terms = [
            { month: 1, percent: 15, desc: "Ruwbouw begane grond" },
            { month: 3, percent: 20, desc: "Ruwbouw verdiepingen" },
            { month: 6, percent: 20, desc: "Dak & Gevelsluiting" },
            { month: 9, percent: 25, desc: "Afbouw & Installaties" },
            { month: 12, percent: 20, desc: "Oplevering" }
        ];

        // --- FUNCTIES ---

        function renderTerms() {
            termsContainer.innerHTML = '';
            let totalP = 0;

            terms.forEach((term, index) => {
                totalP += term.percent;
                
                // Hier bouwen we de HTML voor 1 rij in de editor
                const row = document.createElement('div');
                row.className = 'term-row'; // Gebruikt nu de CSS class uit main.css
                row.innerHTML = `
                    <div style="width: 50px;">
                        <input type="number" min="1" max="36" value="${term.month}" data-idx="${index}" class="term-input term-month" style="width:100%; text-align:center;">
                    </div>
                    <div class="input-desc">
                         <input type="text" value="${term.desc}" class="term-input" style="width:100%;">
                    </div>
                    <div class="input-pct relative">
                        <input type="number" min="0" max="100" value="${term.percent}" data-idx="${index}" class="term-input term-percent" style="width:100%;">
                    </div>
                    <button class="btn-remove" data-idx="${index}">×</button>
                `;
                termsContainer.appendChild(row);
            });

            // Update Totaal Percentage indicator
            totalPercentEl.textContent = totalP + '%';
            if(totalP !== 100) {
                totalPercentEl.classList.remove('text-green-600');
                totalPercentEl.style.color = '#dc2626'; // Rood
                totalPercentEl.innerHTML = `${totalP}% <span style="font-size:0.7em; font-weight:400; color:#666">(moet 100% zijn)</span>`;
            } else {
                totalPercentEl.style.color = '#16a34a'; // Groen
            }

            // Listeners toevoegen aan de nieuwe inputs
            document.querySelectorAll('.term-month').forEach(el => el.addEventListener('change', updateTermData));
            document.querySelectorAll('.term-percent').forEach(el => el.addEventListener('change', updateTermData));
            document.querySelectorAll('.btn-remove').forEach(el => el.addEventListener('click', removeTerm));
        }

        function updateTermData(e) {
            const idx = e.target.dataset.idx;
            const field = e.target.classList.contains('term-month') ? 'month' : 'percent';
            terms[idx][field] = parseInt(e.target.value) || 0;
            
            // Sorteer lijst op maand (zodat maand 1 altijd bovenaan staat)
            terms.sort((a, b) => a.month - b.month);
            
            // Herrenderen en herberekenen
            renderTerms(); // Opnieuw renderen om de volgorde visueel te updaten
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
            terms.push({ month: lastMonth + 1, percent: 0, desc: "Nieuwe fase" });
            renderTerms();
        });

        function calculate() {
            // Haal waarden uit inputs
            const landPrice = parseFloat(inputLand.value) || 0;
            const constructPrice = parseFloat(inputConstruction.value) || 0;
            const interest = parseFloat(inputInterest.value) || 0;
            const monthlyRate = (interest / 100) / 12;

            const totalLoan = landPrice + constructPrice;
            const n = 30 * 12; // 30 jaar
            
            // 1. Bereken de MAXIMALE bruto maandlast (als alles klaar is)
            let fullAnnuity = 0;
            if(interest !== 0) {
                fullAnnuity = totalLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));
            }

            // Bepaal de lengte van de bouw voor de grafiek
            const maxMonth = terms.length > 0 ? Math.max(...terms.map(t => t.month)) + 2 : 12;
            
            let currentDepot = constructPrice;
            let totalLoss = 0;
            
            const chartLabels = [];
            const dataUserPays = [];
            const dataDepotPays = [];

            // Loop door de maanden heen voor de grafiek data
            for(let m = 1; m <= maxMonth; m++) {
                // Kijk of er in deze maand een termijn betaald wordt
                const term = terms.find(t => t.month === m);
                if(term) {
                    const amount = (term.percent / 100) * constructPrice;
                    currentDepot -= amount;
                    if(currentDepot < 0) currentDepot = 0;
                }

                // Rente vergoeding (wat nog in depot zit * rente)
                const interestReceivable = currentDepot * monthlyRate;
                
                // Wat betaal jij? (Volledige last - vergoeding)
                // We cappen dit op 0, je krijgt nooit geld toe.
                let netPayment = fullAnnuity - interestReceivable;
                if(netPayment < 0) netPayment = 0;

                // Renteverlies berekening (wat betaal je aan rente vs wat krijg je)
                const interestPayableTotal = totalLoan * monthlyRate; // Rente over totale lening
                const netInterestLoss = interestPayableTotal - interestReceivable;
                totalLoss += netInterestLoss;

                chartLabels.push(`Mnd ${m}`);
                dataUserPays.push(netPayment);       // Blauw
                dataDepotPays.push(interestReceivable); // Groen
            }

            // Update UI Tekst
            resTotalLoan.textContent = formatEuro(totalLoan);
            
            // Start situatie: Rente over Grond
            const startInterest = landPrice * monthlyRate; 
            // Bij annuïteit is het iets complexer, maar voor indicatie startlast:
            // Startlast is (Annuïteit Totaal) - (Rente over volledig depot)
            const startDepotInterest = constructPrice * monthlyRate;
            let startMonthly = fullAnnuity - startDepotInterest;
            if(startMonthly < 0) startMonthly = 0; // Mocht rente heel hoog zijn

            resStartMonthly.textContent = formatEuro(startMonthly);
            resMaxMonthly.textContent = formatEuro(fullAnnuity);
            resLoss.textContent = formatEuro(totalLoss);

            // Update Grafiek
            updateChart(chartLabels, dataUserPays, dataDepotPays);
        }

        function updateChart(labels, dataUser, dataDepot) {
            // Check of Chart.js geladen is via CDN
            if(typeof Chart === 'undefined') return;

            const ctx = document.getElementById('costChart');
            if(!ctx) return;
            
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
                                backgroundColor: '#000066', 
                                borderRadius: 2
                            },
                            {
                                label: 'Rente Vergoeding (Depot)',
                                data: dataDepot,
                                backgroundColor: '#4ade80', 
                                borderRadius: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { stacked: true, grid: { display: false } },
                            y: { stacked: true, beginAtZero: true }
                        },
                        plugins: {
                            tooltip: { mode: 'index', intersect: false },
                            legend: { display: false } 
                        }
                    }
                });
            }
        }

        // --- EVENT LISTENERS VOOR SLIDERS & INPUTS ---
        
        // Land (Grond)
        rangeLand.addEventListener('input', (e) => { inputLand.value = e.target.value; calculate(); });
        inputLand.addEventListener('input', (e) => { rangeLand.value = e.target.value; calculate(); });

        // Construction (Bouw)
        rangeConstruction.addEventListener('input', (e) => { 
            inputConstruction.value = e.target.value; 
            renderTerms(); // Termijn bedragen moeten herberekend worden als totaal wijzigt
            calculate(); 
        });
        inputConstruction.addEventListener('input', (e) => { 
            rangeConstruction.value = e.target.value; 
            renderTerms(); 
            calculate(); 
        });

        // Interest (Rente)
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });

        // Initialisatie
        renderTerms();
        setTimeout(calculate, 100);
    }
});