import '../styles/main.css';

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER: FORMAT EURO ---
    const formatEuro = (val) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    // --- GLOBAL PDF & ROUTING ---
    const btnDownload = document.getElementById('btn-download');
    if(btnDownload) btnDownload.addEventListener('click', () => window.print());

    // Routing
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

        if(rowVoordeel) {
            rowVoordeel.addEventListener('click', () => {
                const amt = inputAmount.value;
                const int = inputInterest.value;
                window.location.href = `belasting.html?amount=${amt}&interest=${int}`;
            });
            rowVoordeel.addEventListener('mouseenter', () => rowVoordeel.style.backgroundColor = '#ecfdf5');
            rowVoordeel.addEventListener('mouseleave', () => rowVoordeel.style.backgroundColor = 'transparent');
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
    // 2. NIEUWBOUW CALCULATOR
    // ----------------------------------------------
    function initNieuwbouwCalculator() {
        const inputLand = document.getElementById('input-land');
        const rangeLand = document.getElementById('range-land');
        const inputConstruction = document.getElementById('input-construction');
        const rangeConstruction = document.getElementById('range-construction');
        const inputInterest = document.getElementById('input-interest');
        const rangeInterest = document.getElementById('range-interest');
        const inputDiscount = document.getElementById('input-depot-discount');

        const termsContainer = document.getElementById('terms-container');
        const addTermBtn = document.getElementById('add-term-btn');
        const totalPercentEl = document.getElementById('total-percent');
        
        const resTotalLoan = document.getElementById('res-total-loan');
        const resStartMonthly = document.getElementById('res-start-monthly');
        const resMaxMonthly = document.getElementById('res-max-monthly');
        const resLoss = document.getElementById('res-loss');
        
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
                totalPercentEl.innerHTML = `${displayTotal}% (moet 100% zijn)`;
            } else {
                totalPercentEl.style.color = '#16a34a';
                totalPercentEl.innerHTML = `100% toegewezen`;
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
                    terms[idx].percent = (val / total) * 100;
                    renderTerms(); calculate();
                });
            });
            document.querySelectorAll('.term-percent-input').forEach(el => {
                el.addEventListener('input', (e) => {
                    const idx = e.target.dataset.idx;
                    const val = parseFloat(e.target.value) || 0;
                    terms[idx].percent = val;
                    renderTerms(); calculate();
                });
            });
        }

        addTermBtn.addEventListener('click', () => {
            const lastMonth = terms.length > 0 ? terms[terms.length-1].month : 0;
            terms.push({ month: lastMonth + 1, percent: 0, desc: "Nieuwe fase" });
            renderTerms();
        });

        if(toggleTableBtn) {
            toggleTableBtn.addEventListener('click', () => {
                if(tableWrapper.style.display === 'none') {
                    tableWrapper.style.display = 'block';
                    toggleTableBtn.textContent = 'Verberg overzicht ▲';
                } else {
                    tableWrapper.style.display = 'none';
                    toggleTableBtn.textContent = 'Toon gedetailleerd overzicht ▼';
                }
            });
        }

        function calculate() {
            const landPrice = parseFloat(inputLand.value) || 0;
            const constructPrice = parseFloat(inputConstruction.value) || 0;
            const interest = parseFloat(inputInterest.value) || 0;
            const discount = parseFloat(inputDiscount.value) || 0;

            const monthlyRate = (interest / 100) / 12;
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
            let tableHTML = '';

            for(let m = 1; m <= maxMonth; m++) {
                const term = terms.find(t => t.month === m);
                if(term) {
                    const amount = (term.percent / 100) * constructPrice;
                    currentDepot -= amount;
                    if(currentDepot < 0) currentDepot = 0;
                }
                const interestReceivable = currentDepot * depotRate;
                const grossInterest = totalLoan * monthlyRate;
                let netPayment = fullAnnuity - interestReceivable;
                if(netPayment < 0) netPayment = 0;
                
                totalLoss += (grossInterest - interestReceivable);

                chartLabels.push(`Mnd ${m}`);
                dataUserPays.push(netPayment);
                dataDepotPays.push(interestReceivable);

                tableHTML += `<tr><td>${m}</td><td class="col-amount">${formatEuro(currentDepot)}</td><td class="col-amount" style="color:#9ca3af;">${formatEuro(fullAnnuity)}</td><td class="col-amount" style="color:#4ade80;">-${formatEuro(interestReceivable)}</td><td class="col-amount netto-column">${formatEuro(netPayment)}</td></tr>`;
            }

            resTotalLoan.textContent = formatEuro(totalLoan);
            const startDepotInterest = constructPrice * depotRate;
            let startMonthly = fullAnnuity - startDepotInterest;
            if(startMonthly < 0) startMonthly = 0;
            resStartMonthly.textContent = formatEuro(startMonthly);
            resMaxMonthly.textContent = formatEuro(fullAnnuity);
            resLoss.textContent = formatEuro(totalLoss);
            
            updateChart(chartLabels, dataUserPays, dataDepotPays);
            if(tableBody) tableBody.innerHTML = tableHTML;
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

        rangeLand.addEventListener('input', (e) => { inputLand.value = e.target.value; calculate(); });
        inputLand.addEventListener('input', (e) => { rangeLand.value = e.target.value; calculate(); });
        rangeConstruction.addEventListener('input', (e) => { inputConstruction.value = e.target.value; renderTerms(); calculate(); });
        inputConstruction.addEventListener('input', (e) => { rangeConstruction.value = e.target.value; renderTerms(); calculate(); });
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        inputDiscount.addEventListener('input', calculate);

        renderTerms();
        setTimeout(calculate, 100);
    }


    // ----------------------------------------------
    // 3. BELASTING CALCULATOR PRO (30 Jaar & Netto)
    // ----------------------------------------------
    function initBelastingCalculator() {
        const inputType = document.getElementById('fiscal-type');
        const inputIncome = document.getElementById('fiscal-income');
        const inputAmount = document.getElementById('fiscal-amount');
        const inputInterest = document.getElementById('fiscal-interest');
        const rangeInterest = document.getElementById('range-fiscal-interest');
        const inputWoz = document.getElementById('fiscal-woz');
        const alertVillataks = document.getElementById('villataks-alert');

        const checkAdvice = document.getElementById('cost-advice');
        const checkNotary = document.getElementById('cost-notary');
        const checkValuation = document.getElementById('cost-valuation');
        const checkNhg = document.getElementById('cost-nhg');

        const outTaxRate = document.getElementById('display-tax-rate');
        const outHillenPct = document.getElementById('display-hillen');
        
        const outBrutoMonth = document.getElementById('res-bruto-month');
        const outBenefitMonth = document.getElementById('res-benefit-month');
        const outCostsBenefit = document.getElementById('res-costs-benefit');
        const rowCostsMonth = document.getElementById('row-costs-month');
        const outNettoMonth = document.getElementById('res-netto-month');
        const txtTrend = document.getElementById('netto-trend-text');
        
        // NIEUW: Tabel elementen
        const tableWrapper = document.getElementById('table-wrapper');
        const tableBody = document.getElementById('details-table-body');
        const toggleTableBtn = document.getElementById('toggle-table-btn');

        let fiscalChart = null;

        const params = new URLSearchParams(window.location.search);
        if(params.has('amount')) inputAmount.value = params.get('amount');
        if(params.has('interest')) {
             inputInterest.value = params.get('interest');
             rangeInterest.value = params.get('interest');
        }

        const RULES_2026 = {
            maxRate: 37.56, 
            ewfRate: 0.0035,     
            villataksLimit: 1350000, 
            villataksRate: 0.0235, 
            hillenFactor: 0.7187 
        };
        
        // Tabel Toggle Logic
        if(toggleTableBtn) {
            toggleTableBtn.addEventListener('click', () => {
                if(tableWrapper.style.display === 'none') {
                    tableWrapper.style.display = 'block';
                    toggleTableBtn.textContent = 'Verberg details per jaar ▲';
                } else {
                    tableWrapper.style.display = 'none';
                    toggleTableBtn.textContent = 'Toon details per jaar ▼';
                }
            });
        }

        function calculateFiscalPro() {
            const type = inputType.value; 
            const amount = parseFloat(inputAmount.value) || 0;
            const interestPct = parseFloat(inputInterest.value) || 0;
            const woz = parseFloat(inputWoz.value) || 0;
            
            let oneTimeCosts = 0;
            if(checkAdvice.checked) oneTimeCosts += parseFloat(checkAdvice.value);
            if(checkNotary.checked) oneTimeCosts += parseFloat(checkNotary.value);
            if(checkValuation.checked) oneTimeCosts += parseFloat(checkValuation.value);
            if(checkNhg.checked) oneTimeCosts += (amount * 0.006); 

            let ewfYear = 0;
            if (woz > RULES_2026.villataksLimit) {
                 const excess = woz - RULES_2026.villataksLimit;
                 ewfYear = (RULES_2026.villataksLimit * RULES_2026.ewfRate) + (excess * RULES_2026.villataksRate);
                 alertVillataks.style.display = 'block';
            } else {
                 ewfYear = woz * RULES_2026.ewfRate;
                 alertVillataks.style.display = 'none';
            }

            const monthlyRate = (interestPct / 100) / 12;
            const totalMonths = 30 * 12;
            let currentDebt = amount;
            const linearRedemption = amount / totalMonths;
            const annuityPayment = (interestPct === 0) ? (amount/totalMonths) : (amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths))));

            const labels = [];
            const dataBruto = [];
            const dataNetto = [];
            
            let firstYearNetto = 0;
            let firstYearBruto = 0;
            let firstYearBenefit = 0;
            let lastYearNetto = 0;
            
            let tableHTML = '';

            for (let year = 1; year <= 30; year++) {
                let yearInterest = 0;
                let yearGrossPayment = 0;

                for (let m = 1; m <= 12; m++) {
                    const interestAmount = currentDebt * monthlyRate;
                    yearInterest += interestAmount;

                    let monthlyPayment = 0;
                    if (type === 'annuity') {
                        monthlyPayment = annuityPayment;
                        currentDebt -= (annuityPayment - interestAmount);
                    } else {
                        monthlyPayment = interestAmount + linearRedemption;
                        currentDebt -= linearRedemption;
                    }
                    yearGrossPayment += monthlyPayment;
                }

                let deductible = yearInterest - ewfYear;
                if (deductible < 0) {
                    const diff = Math.abs(deductible);
                    const hillenDeduction = diff * RULES_2026.hillenFactor;
                    deductible = -(diff - hillenDeduction); 
                }

                const taxBenefit = deductible * (RULES_2026.maxRate / 100);
                const yearNetto = yearGrossPayment - taxBenefit;

                labels.push(`Jaar ${year}`);
                dataBruto.push(yearGrossPayment / 12);
                dataNetto.push(yearNetto / 12);
                
                // Vullen van de tabel
                tableHTML += `
                    <tr>
                        <td>${year}</td>
                        <td class="col-amount">${formatEuro(yearGrossPayment / 12)}</td>
                        <td class="col-amount" style="color:#16a34a;">${formatEuro(taxBenefit / 12)}</td>
                        <td class="col-amount netto-column">${formatEuro(yearNetto / 12)}</td>
                    </tr>
                `;

                if (year === 1) {
                    firstYearBruto = yearGrossPayment / 12;
                    firstYearNetto = yearNetto / 12;
                    firstYearBenefit = taxBenefit / 12;
                }
                if (year === 30) lastYearNetto = yearNetto / 12;
            }

            const oneTimeBenefit = oneTimeCosts * (RULES_2026.maxRate / 100);

            outTaxRate.textContent = RULES_2026.maxRate.toString().replace('.', ',') + '%';
            if(outHillenPct) outHillenPct.textContent = (RULES_2026.hillenFactor * 100).toFixed(2).replace('.', ',') + '%';

            outBrutoMonth.textContent = formatEuro(firstYearBruto);
            outBenefitMonth.textContent = '-' + formatEuro(firstYearBenefit);
            
            outNettoMonth.textContent = formatEuro(firstYearNetto);
            txtTrend.textContent = `Stijgt naar ${formatEuro(lastYearNetto)} in jaar 30`;

            if(oneTimeCosts > 0) {
                rowCostsMonth.style.display = 'flex';
                outCostsBenefit.textContent = formatEuro(oneTimeBenefit);
            } else {
                rowCostsMonth.style.display = 'none';
            }

            updateFiscalProChart(labels, dataBruto, dataNetto);
            if(tableBody) tableBody.innerHTML = tableHTML;
        }

        function updateFiscalProChart(labels, dataBruto, dataNetto) {
            if(typeof Chart === 'undefined') return;
            const ctx = document.getElementById('fiscalChart');
            if(!ctx) return;

            if(fiscalChart) {
                fiscalChart.data.labels = labels;
                fiscalChart.data.datasets[0].data = dataBruto;
                fiscalChart.data.datasets[1].data = dataNetto;
                fiscalChart.update();
            } else {
                fiscalChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { 
                                label: 'Bruto Maandlast', 
                                data: dataBruto, 
                                borderColor: '#ef4444', 
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                tension: 0.3,
                                fill: false 
                            },
                            { 
                                label: 'Netto Maandlast', 
                                data: dataNetto, 
                                borderColor: '#16a34a', 
                                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                                tension: 0.3,
                                fill: true 
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                        scales: { 
                            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                            x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }
                        },
                        interaction: { mode: 'nearest', axis: 'x', intersect: false }
                    }
                });
            }
        }

        inputType.addEventListener('change', calculateFiscalPro);
        inputIncome.addEventListener('input', calculateFiscalPro);
        inputAmount.addEventListener('input', calculateFiscalPro);
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculateFiscalPro(); });
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculateFiscalPro(); });
        inputWoz.addEventListener('input', calculateFiscalPro);
        [checkAdvice, checkNotary, checkValuation, checkNhg].forEach(box => {
            box.addEventListener('change', calculateFiscalPro);
        });

        calculateFiscalPro();
    }
});