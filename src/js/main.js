import '../styles/main.css';

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER: FORMAT EURO ---
    const formatEuro = (val) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    // --- GLOBAL PDF & ROUTING ---
    const btnDownload = document.getElementById('btn-download');
    if(btnDownload) btnDownload.addEventListener('click', () => window.print());

    // Routing: Checkt welke calculator op de pagina staat
    if (document.getElementById('range-amount')) initVerbouwCalculator();
    if (document.getElementById('nieuwbouw-calc')) initNieuwbouwCalculator();
    if (document.getElementById('belasting-calc')) initBelastingCalculator();


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
        const rowVoordeel = document.getElementById('row-voordeel');

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

            // Indicatief tarief voor homepage (2026 regel: 37.56%)
            const taxRate = 0.3756; 
            const firstMonthInterest = amount * monthlyRate; 
            const taxBenefit = checkAftrek.checked ? (firstMonthInterest * taxRate) : 0;
            const netMonthly = grossMonthly - taxBenefit;

            resBruto.textContent = formatEuro(grossMonthly);
            
            if (checkAftrek.checked) {
                if(rowVoordeel) rowVoordeel.style.display = 'flex';
                resVoordeel.textContent = '-' + formatEuro(taxBenefit);
            } else {
                if(rowVoordeel) rowVoordeel.style.display = 'none';
            }
            resNetto.textContent = formatEuro(netMonthly);
        }

        // Klik event voor doorverwijzing naar fiscale check
        if(rowVoordeel) {
            rowVoordeel.addEventListener('click', () => {
                const amt = inputAmount.value;
                const int = inputInterest.value;
                window.location.href = `belasting.html?amount=${amt}&interest=${int}`;
            });
            
            rowVoordeel.addEventListener('mouseenter', () => rowVoordeel.style.backgroundColor = '#ecfdf5');
            rowVoordeel.addEventListener('mouseleave', () => rowVoordeel.style.backgroundColor = 'transparent');
        }

        // Listeners
        rangeAmount.addEventListener('input', (e) => { inputAmount.value = e.target.value; calculate(); });
        inputAmount.addEventListener('input', (e) => { rangeAmount.value = e.target.value; calculate(); });
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        rangeDuration.addEventListener('input', calculate);
        checkAftrek.addEventListener('change', calculate);
        
        if(rangeAmount) calculate();
    }


    // ----------------------------------------------
    // 2. NIEUWBOUW CALCULATOR
    // ----------------------------------------------
    function initNieuwbouwCalculator() {
        const inputLand = document.getElementById('input-land');
        const rangeLand = document.getElementById('range-land');
        const inputConstruction = document.getElementById('input-construction');
        const rangeConstruction = document.getElementById('range-construction');
        const inputInterest = document.getElementById('input-interest');
        const rangeInterest = document.getElementById('range-interest');
        // NIEUW: Discount input
        const inputDiscount = document.getElementById('input-depot-discount');

        const termsContainer = document.getElementById('terms-container');
        const addTermBtn = document.getElementById('add-term-btn');
        const totalPercentEl = document.getElementById('total-percent');
        
        const resTotalLoan = document.getElementById('res-total-loan');
        const resStartMonthly = document.getElementById('res-start-monthly');
        const resMaxMonthly = document.getElementById('res-max-monthly');
        const resLoss = document.getElementById('res-loss');
        
        // NIEUW: Table Elements
        const tableWrapper = document.getElementById('table-wrapper');
        const tableBody = document.getElementById('details-table-body');
        const toggleTableBtn = document.getElementById('toggle-table-btn');

        let costChart = null;

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
            const totalConstruction = parseFloat(inputConstruction.value) || 0;

            terms.forEach((term, index) => {
                totalP += term.percent;
                const euroAmount = Math.round((term.percent / 100) * totalConstruction);
                const row = document.createElement('div');
                row.className = 'term-row';
                row.innerHTML = `
                    <div><input type="number" min="1" max="36" value="${term.month}" data-idx="${index}" class="term-month-input term-trigger-sort"></div>
                    <div><input type="text" value="${term.desc}" data-idx="${index}" class="term-desc-input term-trigger-desc"></div>
                    <div class="input-icon-wrapper input-wrapper-euro"><span class="icon">€</span><input type="number" value="${euroAmount}" data-idx="${index}" class="term-amount-input"></div>
                    <div class="input-icon-wrapper input-wrapper-pct pct"><input type="number" min="0" max="100" step="0.1" value="${parseFloat(term.percent.toFixed(2))}" data-idx="${index}" class="term-percent-input"><span class="icon">%</span></div>
                    <button class="btn-remove" data-idx="${index}">×</button>
                `;
                termsContainer.appendChild(row);
            });
            bindRowEvents();
            
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

        function bindRowEvents() {
            document.querySelectorAll('.term-trigger-sort').forEach(el => {
                el.addEventListener('change', (e) => {
                    const idx = e.target.dataset.idx;
                    terms[idx].month = parseInt(e.target.value) || 1;
                    terms.sort((a, b) => a.month - b.month);
                    renderTerms(); calculate();
                });
            });
            document.querySelectorAll('.term-trigger-desc').forEach(el => el.addEventListener('input', (e) => terms[e.target.dataset.idx].desc = e.target.value));
            document.querySelectorAll('.btn-remove').forEach(el => el.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-remove');
                if(btn) { terms.splice(btn.dataset.idx, 1); renderTerms(); calculate(); }
            }));
            document.querySelectorAll('.term-amount-input').forEach(el => {
                el.addEventListener('input', (e) => {
                    const idx = e.target.dataset.idx;
                    const val = parseFloat(e.target.value) || 0;
                    const total = parseFloat(inputConstruction.value) || 1;
                    const newPercent = (val / total) * 100;
                    terms[idx].percent = newPercent;
                    e.target.closest('.term-row').querySelector('.term-percent-input').value = parseFloat(newPercent.toFixed(2));
                    calculate();
                });
            });
            document.querySelectorAll('.term-percent-input').forEach(el => {
                el.addEventListener('input', (e) => {
                    const idx = e.target.dataset.idx;
                    const val = parseFloat(e.target.value) || 0;
                    const total = parseFloat(inputConstruction.value) || 0;
                    terms[idx].percent = val;
                    e.target.closest('.term-row').querySelector('.term-amount-input').value = Math.round((val / 100) * total);
                    calculate();
                });
            });
        }

        addTermBtn.addEventListener('click', () => {
            const lastMonth = terms.length > 0 ? terms[terms.length-1].month : 0;
            terms.push({ month: lastMonth + 1, percent: 0, desc: "Nieuwe fase" });
            renderTerms();
        });

        // Toggle Table Visibility
        toggleTableBtn.addEventListener('click', () => {
            if(tableWrapper.style.display === 'none') {
                tableWrapper.style.display = 'block';
                toggleTableBtn.textContent = 'Verberg overzicht ▲';
            } else {
                tableWrapper.style.display = 'none';
                toggleTableBtn.textContent = 'Toon gedetailleerd overzicht ▼';
            }
        });

        function calculate() {
            const landPrice = parseFloat(inputLand.value) || 0;
            const constructPrice = parseFloat(inputConstruction.value) || 0;
            const interest = parseFloat(inputInterest.value) || 0;
            const discount = parseFloat(inputDiscount.value) || 0; // NIEUW: Depot korting

            const monthlyRate = (interest / 100) / 12;
            // Rente op depot = (Hypotheekrente - Korting)
            let depotRate = (interest - discount) / 100 / 12;
            if (depotRate < 0) depotRate = 0;

            const totalLoan = landPrice + constructPrice;
            const n = 30 * 12;
            
            let fullAnnuity = 0;
            if(interest !== 0) fullAnnuity = totalLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));

            const maxMonth = terms.length > 0 ? Math.max(...terms.map(t => t.month)) + 2 : 12;
            let currentDepot = constructPrice;
            let totalLoss = 0;
            const chartLabels = []; const dataUserPays = []; const dataDepotPays = [];
            
            // Voor de tabel data
            let tableHTML = '';

            for(let m = 1; m <= maxMonth; m++) {
                const term = terms.find(t => t.month === m);
                let withdrawnAmount = 0;
                if(term) {
                    const amount = (term.percent / 100) * constructPrice;
                    currentDepot -= amount;
                    withdrawnAmount = amount;
                    if(currentDepot < 0) currentDepot = 0;
                }
                
                // Berekening rente
                const interestReceivable = currentDepot * depotRate; // Gebruik de discounted rate
                const grossInterest = totalLoan * monthlyRate; // Bruto te betalen aan bank
                
                // Bij annuïteit betaal je rente + aflossing. Tijdens bouw vaak alleen rente over opgenomen deel?
                // Voor de 'Netto Maandlast' berekening in deze tool gaan we uit van:
                // Volledige annuïteit - Rente vergoeding uit depot.
                // Dit is de "bruto maandlast methodiek" die gangbaar is bij nieuwbouw calculators.
                
                let netPayment = fullAnnuity - interestReceivable;
                if(netPayment < 0) netPayment = 0;
                
                // Rente verlies = Bruto Rente - Rente Vergoeding
                totalLoss += (grossInterest - interestReceivable);

                chartLabels.push(`Mnd ${m}`);
                dataUserPays.push(netPayment);
                dataDepotPays.push(interestReceivable);

                // Tabel Rij Toevoegen
                tableHTML += `
                    <tr>
                        <td>${m}</td>
                        <td class="col-amount">${formatEuro(currentDepot)}</td>
                        <td class="col-amount" style="color:#9ca3af;">${formatEuro(fullAnnuity)}</td>
                        <td class="col-amount" style="color:#4ade80;">-${formatEuro(interestReceivable)}</td>
                        <td class="col-amount netto-column">${formatEuro(netPayment)}</td>
                    </tr>
                `;
            }

            // Update UI
            resTotalLoan.textContent = formatEuro(totalLoan);
            
            const startDepotInterest = constructPrice * depotRate;
            let startMonthly = fullAnnuity - startDepotInterest;
            if(startMonthly < 0) startMonthly = 0;
            resStartMonthly.textContent = formatEuro(startMonthly);
            
            resMaxMonthly.textContent = formatEuro(fullAnnuity);
            resLoss.textContent = formatEuro(totalLoss);
            
            // Update Chart
            updateChart(chartLabels, dataUserPays, dataDepotPays);

            // Update Table
            tableBody.innerHTML = tableHTML;
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
        rangeConstruction.addEventListener('input', (e) => { inputConstruction.value = e.target.value; renderTerms(); calculate(); });
        inputConstruction.addEventListener('input', (e) => { rangeConstruction.value = e.target.value; renderTerms(); calculate(); });
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        
        // NIEUW: Listener voor korting
        inputDiscount.addEventListener('input', calculate);

        renderTerms();
        setTimeout(calculate, 100);
    }


    // ----------------------------------------------
    // 3. BELASTING CALCULATOR (HUIDIGE REGELS 2026)
    // ----------------------------------------------
    function initBelastingCalculator() {
        // Inputs
        const inputIncome = document.getElementById('fiscal-income');
        const inputAmount = document.getElementById('fiscal-amount');
        const inputInterest = document.getElementById('fiscal-interest');
        const inputWoz = document.getElementById('fiscal-woz');
        const alertVillataks = document.getElementById('villataks-alert');

        // Checkboxes Eenmalige Kosten
        const checkAdvice = document.getElementById('cost-advice');
        const checkNotary = document.getElementById('cost-notary');
        const checkValuation = document.getElementById('cost-valuation');
        const checkNhg = document.getElementById('cost-nhg');

        // Outputs
        const outTaxRate = document.getElementById('display-tax-rate');
        const outHillenPct = document.getElementById('display-hillen');
        
        const outBrutoYear = document.getElementById('calc-bruto-year');
        const outEwf = document.getElementById('calc-ewf');
        const outCosts = document.getElementById('calc-costs');
        const rowCosts = document.getElementById('row-costs');

        const outHillen = document.getElementById('calc-hillen');
        const rowHillen = document.getElementById('row-hillen');
        
        const outFiscalYear = document.getElementById('res-fiscal-year');
        const outFiscalMonth = document.getElementById('res-fiscal-month');

        let fiscalChart = null;

        // URL Params checken (voor doorverwijzing vanaf home)
        const params = new URLSearchParams(window.location.search);
        if(params.has('amount')) inputAmount.value = params.get('amount');
        if(params.has('interest')) inputInterest.value = params.get('interest');

        // --- HARDE CONFIGURATIE VOOR 2026 (Bron: PDF) ---
        const RULES_2026 = {
            maxRate: 37.56, 
            ewfRate: 0.0035,     
            villataksLimit: 1350000, 
            villataksRate: 0.0235, 
            hillenFactor: 0.7187 
        };

        function calculateFiscal() {
            const income = parseFloat(inputIncome.value) || 0;
            const amount = parseFloat(inputAmount.value) || 0;
            const interestPct = parseFloat(inputInterest.value) || 0;
            const woz = parseFloat(inputWoz.value) || 0;

            // 1. Eenmalige kosten optellen
            let oneTimeCosts = 0;
            if(checkAdvice.checked) oneTimeCosts += parseFloat(checkAdvice.value);
            if(checkNotary.checked) oneTimeCosts += parseFloat(checkNotary.value);
            if(checkValuation.checked) oneTimeCosts += parseFloat(checkValuation.value);
            if(checkNhg.checked) oneTimeCosts += (amount * 0.006); 

            // 2. Tarief en Weergave
            outTaxRate.textContent = RULES_2026.maxRate.toString().replace('.', ',') + '%';
            if(outHillenPct) outHillenPct.textContent = (RULES_2026.hillenFactor * 100).toFixed(2).replace('.', ',') + '%';

            // 3. Betaalde Rente
            const paidInterest = amount * (interestPct / 100);

            // 4. Eigenwoningforfait (EWF)
            let ewfAmount = 0;
            if (woz > RULES_2026.villataksLimit) {
                 const excess = woz - RULES_2026.villataksLimit;
                 ewfAmount = (RULES_2026.villataksLimit * RULES_2026.ewfRate) + (excess * RULES_2026.villataksRate);
                 alertVillataks.style.display = 'block';
            } else {
                 ewfAmount = woz * RULES_2026.ewfRate;
                 alertVillataks.style.display = 'none';
            }

            // 5. Saldo & Wet Hillen Logic
            const totalDeductibleItems = paidInterest + oneTimeCosts;
            let netDeductible = totalDeductibleItems - ewfAmount;
            let hillenAddition = 0;

            if (netDeductible < 0) {
                const diff = Math.abs(netDeductible);
                const hillenDeduction = diff * RULES_2026.hillenFactor;
                hillenAddition = diff - hillenDeduction; 
                netDeductible = -hillenAddition; 
                
                if(rowHillen) {
                    rowHillen.style.display = 'flex';
                    outHillen.textContent = '-' + formatEuro(hillenAddition);
                }
            } else {
                if(rowHillen) rowHillen.style.display = 'none';
            }

            // 6. Bereken Voordeel
            const taxBenefitYear = netDeductible * (RULES_2026.maxRate / 100);
            const taxBenefitMonth = taxBenefitYear / 12;

            // 7. UI Updaten
            outBrutoYear.textContent = formatEuro(paidInterest);
            outEwf.textContent = '-' + formatEuro(ewfAmount);
            
            if(oneTimeCosts > 0) {
                rowCosts.style.display = 'flex';
                outCosts.textContent = '+ ' + formatEuro(oneTimeCosts);
            } else {
                rowCosts.style.display = 'none';
            }
            
            if (taxBenefitYear >= 0) {
                outFiscalYear.textContent = '+ ' + formatEuro(taxBenefitYear);
                outFiscalYear.style.color = '#16a34a'; 
            } else {
                outFiscalYear.textContent = formatEuro(taxBenefitYear); 
                outFiscalYear.style.color = '#ef4444'; 
            }
            outFiscalMonth.textContent = formatEuro(taxBenefitMonth);

            updateFiscalChart(paidInterest, ewfAmount, oneTimeCosts, taxBenefitYear);
        }

        function updateFiscalChart(interest, ewf, costs, result) {
            if(typeof Chart === 'undefined') return;
            const ctx = document.getElementById('fiscalChart');
            if(!ctx) return;

            const chartData = [interest, -ewf, costs, result];
            const bgColors = ['#e2e8f0', '#ef4444', '#3b82f6', '#16a34a'];

            if(fiscalChart) {
                fiscalChart.data.datasets[0].data = chartData;
                fiscalChart.update();
            } else {
                fiscalChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Rente', 'EWF', '1-malig', 'Teruggave'],
                        datasets: [{
                            label: 'Bedrag',
                            data: chartData,
                            backgroundColor: bgColors,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { 
                            y: { beginAtZero: true, grid: { display: false } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        }

        inputIncome.addEventListener('input', calculateFiscal);
        inputAmount.addEventListener('input', calculateFiscal);
        inputInterest.addEventListener('input', calculateFiscal);
        inputWoz.addEventListener('input', calculateFiscal);
        [checkAdvice, checkNotary, checkValuation, checkNhg].forEach(box => {
            box.addEventListener('change', calculateFiscal);
        });

        calculateFiscal();
    }
});