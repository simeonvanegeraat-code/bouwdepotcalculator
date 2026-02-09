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

            // Indicatief tarief voor homepage (snelle check)
            const taxRate = 0.3697;
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
        const termsContainer = document.getElementById('terms-container');
        const addTermBtn = document.getElementById('add-term-btn');
        const totalPercentEl = document.getElementById('total-percent');
        const resTotalLoan = document.getElementById('res-total-loan');
        const resStartMonthly = document.getElementById('res-start-monthly');
        const resMaxMonthly = document.getElementById('res-max-monthly');
        const resLoss = document.getElementById('res-loss');
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

        function calculate() {
            const landPrice = parseFloat(inputLand.value) || 0;
            const constructPrice = parseFloat(inputConstruction.value) || 0;
            const interest = parseFloat(inputInterest.value) || 0;
            const monthlyRate = (interest / 100) / 12;
            const totalLoan = landPrice + constructPrice;
            const n = 30 * 12;
            
            let fullAnnuity = 0;
            if(interest !== 0) fullAnnuity = totalLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));

            const maxMonth = terms.length > 0 ? Math.max(...terms.map(t => t.month)) + 2 : 12;
            let currentDepot = constructPrice;
            let totalLoss = 0;
            const chartLabels = []; const dataUserPays = []; const dataDepotPays = [];

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
                totalLoss += (totalLoan * monthlyRate) - interestReceivable;
                chartLabels.push(`Mnd ${m}`);
                dataUserPays.push(netPayment);
                dataDepotPays.push(interestReceivable);
            }

            resTotalLoan.textContent = formatEuro(totalLoan);
            const startDepotInterest = constructPrice * monthlyRate;
            let startMonthly = fullAnnuity - startDepotInterest;
            if(startMonthly < 0) startMonthly = 0;
            resStartMonthly.textContent = formatEuro(startMonthly);
            resMaxMonthly.textContent = formatEuro(fullAnnuity);
            resLoss.textContent = formatEuro(totalLoss);
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
        rangeConstruction.addEventListener('input', (e) => { inputConstruction.value = e.target.value; renderTerms(); calculate(); });
        inputConstruction.addEventListener('input', (e) => { rangeConstruction.value = e.target.value; renderTerms(); calculate(); });
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });

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

        // Outputs
        const outTaxRate = document.getElementById('display-tax-rate');
        const outHillenPct = document.getElementById('display-hillen');
        
        const outBrutoYear = document.getElementById('calc-bruto-year');
        const outEwf = document.getElementById('calc-ewf');
        const outHillen = document.getElementById('calc-hillen');
        const rowHillen = document.getElementById('row-hillen');
        
        const outFiscalYear = document.getElementById('res-fiscal-year');
        const outFiscalMonth = document.getElementById('res-fiscal-month');

        // URL Params checken (voor doorverwijzing vanaf home)
        const params = new URLSearchParams(window.location.search);
        if(params.has('amount')) inputAmount.value = params.get('amount');
        if(params.has('interest')) inputInterest.value = params.get('interest');

        // --- HARDE CONFIGURATIE VOOR 2026 ---
        const RULES_2026 = {
            // Aftrekpercentage is gelijk aan basistarief in schijf 1
            rateBracket1: 36.93, // Geschatte indexatie 2026 (was 36.97 in 2025)
            rateLimit: 38000,    // Schijfgrens (indicatief)
            ewfRate: 0.0035,     // 0.35% Standaard EWF
            villataksLimit: 1350000, // Villataks grens (geïndexeerd voor 2026)
            hillenFactor: 0.7333 // Wet Hillen aftrek in 2026 is nog maar 73.33% (afbouw)
        };

        function calculateFiscal() {
            const income = parseFloat(inputIncome.value) || 0;
            const amount = parseFloat(inputAmount.value) || 0;
            const interestPct = parseFloat(inputInterest.value) || 0;
            const woz = parseFloat(inputWoz.value) || 0;

            // 1. Bepaal Aftrektarief
            // In 2026 is de aftrek voor IEDEREEN beperkt tot het tarief van de 1e schijf.
            // Zelfs als je in de hoogste schijf zit (49.5%), krijg je maar ~37% terug.
            const applicableRate = RULES_2026.rateBracket1;

            outTaxRate.textContent = applicableRate.toFixed(2).replace('.', ',') + '%';
            if(outHillenPct) outHillenPct.textContent = (RULES_2026.hillenFactor * 100).toFixed(2).replace('.', ',') + '%';

            // 2. Betaalde Rente
            const paidInterest = amount * (interestPct / 100);

            // 3. Eigenwoningforfait (EWF)
            let ewfAmount = 0;
            if (woz > RULES_2026.villataksLimit) {
                 // Villataks: 0.35% over het deel tot de grens + 2.35% over het meerdere
                 const excess = woz - RULES_2026.villataksLimit;
                 ewfAmount = (RULES_2026.villataksLimit * RULES_2026.ewfRate) + (excess * 0.0235);
            } else {
                 ewfAmount = woz * RULES_2026.ewfRate;
            }

            // 4. Saldo & Wet Hillen (Afbouw)
            let deductible = paidInterest - ewfAmount;
            let hillenAddition = 0;

            if (deductible < 0) {
                // Je hebt een "negatief saldo" (EWF is hoger dan rente).
                // Vroeger was dit 0. Nu moet je een deel bijtellen.
                const diff = Math.abs(deductible);
                
                // Hillen aftrek 2026 = 73.33% van het verschil
                const hillenDeduction = diff * RULES_2026.hillenFactor;
                
                // Wat je netto moet bijtellen bij je inkomen
                hillenAddition = diff - hillenDeduction; 
                
                // Voor de berekening van voordeel is dit dus negatief (je betaalt belasting)
                deductible = -hillenAddition; 
                
                if(rowHillen) {
                    rowHillen.style.display = 'flex';
                    outHillen.textContent = '-' + formatEuro(hillenAddition);
                }
            } else {
                if(rowHillen) rowHillen.style.display = 'none';
            }

            // 5. Fiscaal Voordeel Berekenen
            const taxBenefitYear = deductible * (applicableRate / 100);
            const taxBenefitMonth = taxBenefitYear / 12;

            // 6. UI Updaten
            outBrutoYear.textContent = formatEuro(paidInterest);
            outEwf.textContent = '-' + formatEuro(ewfAmount);
            
            if (taxBenefitYear >= 0) {
                outFiscalYear.textContent = '+ ' + formatEuro(taxBenefitYear);
                outFiscalYear.style.color = '#16a34a'; // Groen
            } else {
                outFiscalYear.textContent = formatEuro(taxBenefitYear); // Minteken zit al in formatEuro
                outFiscalYear.style.color = '#ef4444'; // Rood
            }
            outFiscalMonth.textContent = formatEuro(taxBenefitMonth);
        }

        // Listeners
        inputIncome.addEventListener('input', calculateFiscal);
        inputAmount.addEventListener('input', calculateFiscal);
        inputInterest.addEventListener('input', calculateFiscal);
        inputWoz.addEventListener('input', calculateFiscal);

        // Init
        calculateFiscal();
    }
});