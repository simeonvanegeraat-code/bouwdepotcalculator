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
    // 2. NIEUWBOUW CALCULATOR (Met Two-Way Binding: € <-> %)
    // ----------------------------------------------
    function initNieuwbouwCalculator() {
        // Inputs & Sliders
        const inputLand = document.getElementById('input-land');
        const rangeLand = document.getElementById('range-land');
        const inputConstruction = document.getElementById('input-construction');
        const rangeConstruction = document.getElementById('range-construction');
        const inputInterest = document.getElementById('input-interest');
        const rangeInterest = document.getElementById('range-interest');

        // Container & Output elements
        const termsContainer = document.getElementById('terms-container');
        const addTermBtn = document.getElementById('add-term-btn');
        const totalPercentEl = document.getElementById('total-percent');

        // Results Sidebar
        const resTotalLoan = document.getElementById('res-total-loan');
        const resStartMonthly = document.getElementById('res-start-monthly');
        const resMaxMonthly = document.getElementById('res-max-monthly');
        const resLoss = document.getElementById('res-loss');

        // Chart instance
        let costChart = null;

        // Data Model
        let terms = [
            { month: 1, percent: 15, desc: "Ruwbouw begane grond" },
            { month: 3, percent: 20, desc: "Ruwbouw verdiepingen" },
            { month: 6, percent: 20, desc: "Dak & Gevelsluiting" },
            { month: 9, percent: 25, desc: "Afbouw & Installaties" },
            { month: 12, percent: 20, desc: "Oplevering" }
        ];

        // --- CORE FUNCTIONS ---

        function renderTerms() {
            termsContainer.innerHTML = '';
            let totalP = 0;
            const totalConstruction = parseFloat(inputConstruction.value) || 0;

            terms.forEach((term, index) => {
                totalP += term.percent;
                
                // Bereken het Euro bedrag voor weergave
                const euroAmount = Math.round((term.percent / 100) * totalConstruction);

                const row = document.createElement('div');
                row.className = 'term-row';
                
                // Nieuwe HTML structuur: Maand | Omschrijving | € Input | % Input | Delete
                row.innerHTML = `
                    <div>
                        <input type="number" min="1" max="36" value="${term.month}" data-idx="${index}" class="term-month-input term-trigger-sort">
                    </div>

                    <div>
                        <input type="text" value="${term.desc}" data-idx="${index}" class="term-desc-input term-trigger-desc">
                    </div>

                    <div class="input-icon-wrapper input-wrapper-euro">
                        <span class="icon">€</span>
                        <input type="number" value="${euroAmount}" data-idx="${index}" class="term-amount-input">
                    </div>

                    <div class="input-icon-wrapper input-wrapper-pct pct">
                        <input type="number" min="0" max="100" step="0.1" value="${parseFloat(term.percent.toFixed(2))}" data-idx="${index}" class="term-percent-input">
                        <span class="icon">%</span>
                    </div>

                    <button class="btn-remove" data-idx="${index}">×</button>
                `;
                termsContainer.appendChild(row);
            });

            // Update Totalen Indicator
            // Afronden op 1 decimaal om floating point errors (99.999%) te voorkomen
            const displayTotal = Math.round(totalP * 10) / 10;
            totalPercentEl.textContent = displayTotal + '%';
            
            if(Math.abs(displayTotal - 100) > 0.1) {
                totalPercentEl.style.color = '#dc2626'; // Rood
                totalPercentEl.innerHTML = `${displayTotal}% <span style="font-size:0.7em; font-weight:400; color:#666">(moet 100% zijn)</span>`;
            } else {
                totalPercentEl.style.color = '#16a34a'; // Groen
                totalPercentEl.innerHTML = `100% <span style="font-size:0.7em; font-weight:400; color:#666">toegewezen</span>`;
            }

            // Event Listeners koppelen
            bindRowEvents();
        }

        function bindRowEvents() {
            // Maand update (sorteren)
            document.querySelectorAll('.term-trigger-sort').forEach(el => {
                el.addEventListener('change', (e) => {
                    const idx = e.target.dataset.idx;
                    terms[idx].month = parseInt(e.target.value) || 1;
                    terms.sort((a, b) => a.month - b.month);
                    renderTerms();
                    calculate();
                });
            });

            // Omschrijving update (geen re-render nodig)
            document.querySelectorAll('.term-trigger-desc').forEach(el => {
                el.addEventListener('input', (e) => {
                    terms[e.target.dataset.idx].desc = e.target.value;
                });
            });

            // Verwijder knop
            document.querySelectorAll('.btn-remove').forEach(el => {
                el.addEventListener('click', (e) => {
                    // Zoek de knop, soms klik je op het icoon
                    const btn = e.target.closest('.btn-remove');
                    if(btn) {
                        terms.splice(btn.dataset.idx, 1);
                        renderTerms();
                        calculate();
                    }
                });
            });

            // --- DE MAGIE: EURO & PROCENT BEREKENING ---
            
            // 1. Gebruiker typt EURO
            document.querySelectorAll('.term-amount-input').forEach(el => {
                el.addEventListener('input', (e) => {
                    const idx = e.target.dataset.idx;
                    const val = parseFloat(e.target.value) || 0;
                    const total = parseFloat(inputConstruction.value) || 1; // Vermijd delen door 0

                    // Bereken percentage: (Bedrag / Totaal) * 100
                    const newPercent = (val / total) * 100;
                    
                    // Update data model
                    terms[idx].percent = newPercent;

                    // Update DIRECT het veld ernaast (Percentage)
                    // We zoeken de % input in dezelfde rij
                    const row = e.target.closest('.term-row');
                    const pctInput = row.querySelector('.term-percent-input');
                    pctInput.value = parseFloat(newPercent.toFixed(2)); // Max 2 decimalen zichtbaar

                    updateTotalsOnly(); // Update de tekst onderaan zonder harde re-render
                    calculate(); // Update grafiek
                });
            });

            // 2. Gebruiker typt PERCENTAGE
            document.querySelectorAll('.term-percent-input').forEach(el => {
                el.addEventListener('input', (e) => {
                    const idx = e.target.dataset.idx;
                    const val = parseFloat(e.target.value) || 0;
                    const total = parseFloat(inputConstruction.value) || 0;

                    // Update data model
                    terms[idx].percent = val;

                    // Bereken euro: (Percentage / 100) * Totaal
                    const newAmount = Math.round((val / 100) * total);

                    // Update DIRECT het veld ernaast (Euro)
                    const row = e.target.closest('.term-row');
                    const amtInput = row.querySelector('.term-amount-input');
                    amtInput.value = newAmount;

                    updateTotalsOnly();
                    calculate();
                });
            });
        }

        // Helper: Update alleen de "100% toegewezen" tekst (voor performance tijdens typen)
        function updateTotalsOnly() {
            let totalP = terms.reduce((sum, t) => sum + t.percent, 0);
            const displayTotal = Math.round(totalP * 10) / 10;
            
            totalPercentEl.textContent = displayTotal + '%';
            if(Math.abs(displayTotal - 100) > 0.1) {
                totalPercentEl.style.color = '#dc2626';
                totalPercentEl.innerHTML = `${displayTotal}% <span style="font-size:0.7em; font-weight:400; color:#666">(moet 100% zijn)</span>`;
            } else {
                totalPercentEl.style.color = '#16a34a';
                totalPercentEl.innerHTML = `100% <span style="font-size:0.7em; font-weight:400; color:#666">toegewezen</span>`;
            }
        }

        addTermBtn.addEventListener('click', () => {
            const lastMonth = terms.length > 0 ? terms[terms.length-1].month : 0;
            // Voeg lege termijn toe
            terms.push({ month: lastMonth + 1, percent: 0, desc: "Nieuwe fase" });
            renderTerms();
        });

        // --- BEREKENING & GRAFIEK (Dezelfde logica als voorheen) ---
        function calculate() {
            const landPrice = parseFloat(inputLand.value) || 0;
            const constructPrice = parseFloat(inputConstruction.value) || 0;
            const interest = parseFloat(inputInterest.value) || 0;
            const monthlyRate = (interest / 100) / 12;

            const totalLoan = landPrice + constructPrice;
            const n = 30 * 12; // 30 jaar
            
            let fullAnnuity = 0;
            if(interest !== 0) {
                fullAnnuity = totalLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));
            }

            const maxMonth = terms.length > 0 ? Math.max(...terms.map(t => t.month)) + 2 : 12;
            let currentDepot = constructPrice;
            let totalLoss = 0;
            
            const chartLabels = [];
            const dataUserPays = [];
            const dataDepotPays = [];

            for(let m = 1; m <= maxMonth; m++) {
                const term = terms.find(t => t.month === m);
                if(term) {
                    const amount = (term.percent / 100) * constructPrice;
                    currentDepot -= amount;
                    if(currentDepot < 0) currentDepot = 0;
                }

                const interestReceivable = currentDepot * monthlyRate;
                let netPayment = fullAnnuity - interestReceivable;
                if(netPayment < 0) netPayment = 0;

                const interestPayableTotal = totalLoan * monthlyRate;
                const netInterestLoss = interestPayableTotal - interestReceivable;
                totalLoss += netInterestLoss;

                chartLabels.push(`Mnd ${m}`);
                dataUserPays.push(netPayment);
                dataDepotPays.push(interestReceivable);
            }

            resTotalLoan.textContent = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalLoan);
            
            const startDepotInterest = constructPrice * monthlyRate;
            let startMonthly = fullAnnuity - startDepotInterest;
            if(startMonthly < 0) startMonthly = 0;

            resStartMonthly.textContent = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(startMonthly);
            resMaxMonthly.textContent = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(fullAnnuity);
            resLoss.textContent = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalLoss);

            updateChart(chartLabels, dataUserPays, dataDepotPays);
        }

        function updateChart(labels, dataUser, dataDepot) {
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
                            { label: 'Uw Netto Maandlast', data: dataUser, backgroundColor: '#000066', borderRadius: 2 },
                            { label: 'Rente Vergoeding (Depot)', data: dataDepot, backgroundColor: '#4ade80', borderRadius: 2 }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } },
                        plugins: { tooltip: { mode: 'index', intersect: false }, legend: { display: false } }
                    }
                });
            }
        }

        // Global Listeners
        rangeLand.addEventListener('input', (e) => { inputLand.value = e.target.value; calculate(); });
        inputLand.addEventListener('input', (e) => { rangeLand.value = e.target.value; calculate(); });

        rangeConstruction.addEventListener('input', (e) => { 
            inputConstruction.value = e.target.value; 
            renderTerms(); // Belangrijk: bedragen in de lijst updaten als totaal verandert!
            calculate(); 
        });
        inputConstruction.addEventListener('input', (e) => { 
            rangeConstruction.value = e.target.value; 
            renderTerms(); 
            calculate(); 
        });

        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });

        renderTerms();
        setTimeout(calculate, 100);
    }
});