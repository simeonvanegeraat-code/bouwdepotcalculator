import '../styles/main.css';

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER: FORMAT EURO ---
    const formatEuro = (val) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    // --- GLOBAL PDF & ROUTING ---
    const btnDownload = document.getElementById('btn-download');
    if(btnDownload) btnDownload.addEventListener('click', () => window.print());

    // Routing
    if (document.getElementById('range-amount')) initVerbouwCalculator();
    if (document.getElementById('maandlasten-calc')) initMaandlastenBouwdepotCalculator();
    if (document.getElementById('nieuwbouw-calc')) initNieuwbouwCalculator();
    if (document.getElementById('renteverlies-calc')) initRenteverliesCalculator();
    if (document.getElementById('dubbele-lasten-calc')) initDubbeleLastenCalculator();
    if (document.getElementById('belasting-calc')) initBelastingCalculator();


    // ----------------------------------------------
    // 1. VERBOUW CALCULATOR (Homepage)
    // ----------------------------------------------
    function initVerbouwCalculator() {
        const inputType = document.getElementById('input-type'); 
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

        // --- NIEUW: Snelkeuze & Accordion Variabelen ---
        const costBtns = document.querySelectorAll('.cost-btn');
        const costToggleBtn = document.getElementById('cost-toggle-btn');
        const costContent = document.getElementById('cost-content');
        const costArrow = document.getElementById('cost-arrow');
        const btnResetCosts = document.getElementById('btn-reset-costs');
        const presetButtons = document.querySelectorAll('.preset-btn');

        function calculate() {
            const type = inputType ? inputType.value : 'annuity';
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
                if (type === 'linear') {
                    // Lineair: (Bedrag / Looptijd) + (Bedrag * Maandrente)
                    const redemption = amount / totalMonths;
                    const interestPart = amount * monthlyRate;
                    grossMonthly = redemption + interestPart;
                } else {
                    // Annuïteit: Standaard formule
                    grossMonthly = amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));
                }
            }

            // Fiscaal (Maand 1 is voor Lineair en Annuïteit rente-technisch gelijk)
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

        // --- NIEUW: Logic voor Accordion Toggle ---
        if(costToggleBtn && costContent) {
            costToggleBtn.addEventListener('click', () => {
                const isClosed = costContent.style.display === 'none';
                costContent.style.display = isClosed ? 'block' : 'none';
                // Roteer pijltje
                costArrow.style.transform = isClosed ? 'rotate(180deg)' : 'rotate(0deg)';
                
                // Scroll een klein stukje zodat het netjes in beeld komt
                if(isClosed) {
                    setTimeout(() => {
                        costToggleBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            });
        }

        // --- NIEUW: Logic voor Multiselect Knoppen ---
        function updateFromButtons() {
            let totalAddon = 0;
            let activeCount = 0;

            costBtns.forEach(btn => {
                if(btn.classList.contains('selected')) {
                    totalAddon += parseFloat(btn.getAttribute('data-amount'));
                    activeCount++;
                }
            });

            // Als er knoppen zijn geselecteerd, update de input
            if(activeCount > 0) {
                if(inputAmount) inputAmount.value = totalAddon;
                if(rangeAmount) rangeAmount.value = totalAddon;
                if(btnResetCosts) btnResetCosts.style.display = 'block';
                calculate(); 
            } else {
                if(btnResetCosts) btnResetCosts.style.display = 'none';
            }
        }

        costBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected'); // Toggle status
                updateFromButtons();
            });
        });

        if(btnResetCosts) {
            btnResetCosts.addEventListener('click', () => {
                costBtns.forEach(b => b.classList.remove('selected'));
                updateFromButtons();
                // We resetten de input niet naar 0, maar laten de laatste waarde staan, of je kunt hier inputAmount.value = 25000 zetten.
            });
        }

        if (presetButtons.length) {
            presetButtons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    const presetAmount = parseFloat(btn.dataset.presetAmount);
                    if (Number.isNaN(presetAmount)) return;

                    if (inputAmount) inputAmount.value = presetAmount;
                    if (rangeAmount) rangeAmount.value = presetAmount;

                    if (costBtns.length) {
                        costBtns.forEach((costBtn) => costBtn.classList.remove('selected'));
                        if (btnResetCosts) btnResetCosts.style.display = 'none';
                    }

                    calculate();
                });
            });
        }

        // Event Listeners Inputs
        if(inputType) inputType.addEventListener('change', calculate);
        rangeAmount.addEventListener('input', (e) => { inputAmount.value = e.target.value; calculate(); });
        inputAmount.addEventListener('input', (e) => { rangeAmount.value = e.target.value; calculate(); });
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        rangeDuration.addEventListener('input', calculate);
        checkAftrek.addEventListener('change', calculate);
        
        if(rangeAmount) calculate();
    }


    // ----------------------------------------------
    // 1B. MAANDLASTEN BOUWDEPOT CALCULATOR
    // ----------------------------------------------
    function initMaandlastenBouwdepotCalculator() {
        const inputMortgage = document.getElementById('input-total-mortgage');
        const inputDepot = document.getElementById('input-depot-amount');
        const inputRate = document.getElementById('input-mortgage-rate');
        const inputDepotRate = document.getElementById('input-depot-rate');
        const inputMonths = document.getElementById('input-depot-months');
        const rangeMonths = document.getElementById('range-depot-months');
        const inputHousing = document.getElementById('input-extra-housing');
        const opnamePattern = document.getElementById('input-opnamepattern');

        const resGross = document.getElementById('res-month-gross');
        const resComp = document.getElementById('res-month-compensation');
        const resNet = document.getElementById('res-month-net');
        const resPeriod = document.getElementById('res-period-total');
        const resDouble = document.getElementById('res-double-burden');
        const resDoubleRow = document.getElementById('row-double-burden');
        const assumptionText = document.getElementById('assumption-pattern-text');

        const scenarioButtons = document.querySelectorAll('.scenario-btn');

        const patternFactors = {
            even: 0.5,
            slow: 0.65,
            fast: 0.35
        };

        const patternLabels = {
            even: 'Gemiddeld 50% van het depot staat nog uit tijdens de bouwperiode.',
            slow: 'Bij een rustige start rekenen wij indicatief met gemiddeld 65% niet-opgenomen depot.',
            fast: 'Bij snelle opname rekenen wij indicatief met gemiddeld 35% niet-opgenomen depot.'
        };

        function calculate() {
            const mortgage = parseFloat(inputMortgage.value) || 0;
            const depot = parseFloat(inputDepot.value) || 0;
            const mortgageRate = parseFloat(inputRate.value) || 0;
            const depotRate = parseFloat(inputDepotRate.value) || 0;
            const months = parseInt(inputMonths.value, 10) || 1;
            const extraHousing = parseFloat(inputHousing.value) || 0;
            const pattern = opnamePattern.value || 'even';
            const factor = patternFactors[pattern] || 0.5;

            const grossMonthly = mortgage * ((mortgageRate / 100) / 12);
            const monthlyCompensation = depot * factor * ((depotRate / 100) / 12);
            const netMonthly = Math.max(0, grossMonthly - monthlyCompensation);
            const periodTotal = netMonthly * months;
            const doubleBurden = netMonthly + extraHousing;

            resGross.textContent = formatEuro(grossMonthly);
            resComp.textContent = '-' + formatEuro(monthlyCompensation);
            resNet.textContent = formatEuro(netMonthly);
            resPeriod.textContent = formatEuro(periodTotal);
            assumptionText.textContent = patternLabels[pattern];

            if (extraHousing > 0) {
                if (resDoubleRow) resDoubleRow.style.display = 'flex';
                resDouble.textContent = formatEuro(doubleBurden);
            } else if (resDoubleRow) {
                resDoubleRow.style.display = 'none';
            }
        }

        if (rangeMonths) {
            rangeMonths.addEventListener('input', (e) => {
                inputMonths.value = e.target.value;
                calculate();
            });
        }

        if (inputMonths) {
            inputMonths.addEventListener('input', (e) => {
                const months = Math.min(36, Math.max(1, parseInt(e.target.value || '1', 10)));
                inputMonths.value = months;
                if (rangeMonths) rangeMonths.value = months;
                calculate();
            });
        }

        [inputMortgage, inputDepot, inputRate, inputDepotRate, inputHousing, opnamePattern].forEach((el) => {
            if (el) el.addEventListener('input', calculate);
            if (el && el.tagName === 'SELECT') el.addEventListener('change', calculate);
        });

        scenarioButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                if (btn.dataset.mortgage) inputMortgage.value = btn.dataset.mortgage;
                if (btn.dataset.depot) inputDepot.value = btn.dataset.depot;
                if (btn.dataset.rate) inputRate.value = btn.dataset.rate;
                if (btn.dataset.depotRate) inputDepotRate.value = btn.dataset.depotRate;
                if (btn.dataset.months) {
                    inputMonths.value = btn.dataset.months;
                    if (rangeMonths) rangeMonths.value = btn.dataset.months;
                }
                if (btn.dataset.housing) inputHousing.value = btn.dataset.housing;
                if (btn.dataset.pattern) opnamePattern.value = btn.dataset.pattern;
                calculate();
            });
        });

        calculate();
    }


    // ----------------------------------------------
    // 1C. RENTEVERLIES BOUWDEPOT CALCULATOR
    // ----------------------------------------------
    function initRenteverliesCalculator() {
        const inputDepot = document.getElementById('input-renteverlies-depot');
        const inputMortgageRate = document.getElementById('input-renteverlies-hypotheek');
        const inputDepotRate = document.getElementById('input-renteverlies-vergoeding');
        const inputMonths = document.getElementById('input-renteverlies-maanden');
        const rangeMonths = document.getElementById('range-renteverlies-maanden');
        const inputPattern = document.getElementById('input-renteverlies-pattern');

        const resMortgage = document.getElementById('res-renteverlies-hypotheek');
        const resCompensation = document.getElementById('res-renteverlies-vergoeding');
        const resNet = document.getElementById('res-renteverlies-netto');
        const resMonth = document.getElementById('res-renteverlies-maand');
        const resConclusion = document.getElementById('res-renteverlies-conclusie');
        const patternNote = document.getElementById('renteverlies-pattern-note');

        const scenarioButtons = document.querySelectorAll('.renteverlies-scenario');

        const patternDescriptions = {
            even: 'Bij gelijkmatig opnemen daalt het resterende depot in gelijke stappen.',
            fast: 'Bij snelle opname in het begin daalt het niet-opgenomen depot eerder, waardoor de vergoeding sneller afneemt.',
            slow: 'Bij latere opname blijft het niet-opgenomen depot langer hoog, waardoor timing meer invloed krijgt op de uitkomst.'
        };

        function getWeights(months, pattern) {
            const weights = [];
            for (let month = 1; month <= months; month += 1) {
                let weight = 1;
                if (pattern === 'fast') {
                    weight = 1.6 - ((month - 1) / Math.max(1, months - 1)) * 1.2;
                } else if (pattern === 'slow') {
                    weight = 0.4 + ((month - 1) / Math.max(1, months - 1)) * 1.2;
                }
                weights.push(Math.max(0.1, weight));
            }
            return weights;
        }

        function calculate() {
            const depot = parseFloat(inputDepot.value) || 0;
            const mortgageRate = parseFloat(inputMortgageRate.value) || 0;
            const depotRate = parseFloat(inputDepotRate.value) || 0;
            const months = Math.min(36, Math.max(1, parseInt(inputMonths.value || '1', 10)));
            const pattern = inputPattern.value || 'even';

            inputMonths.value = months;
            if (rangeMonths) rangeMonths.value = months;

            const monthlyMortgageRate = (mortgageRate / 100) / 12;
            const monthlyDepotRate = (depotRate / 100) / 12;

            const totalMortgageInterest = depot * monthlyMortgageRate * months;

            const weights = getWeights(months, pattern);
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;

            let remaining = depot;
            let totalCompensation = 0;

            for (let i = 0; i < months; i += 1) {
                const monthlyWithdrawal = (depot * weights[i]) / totalWeight;
                const endBalance = Math.max(0, remaining - monthlyWithdrawal);
                const averageBalance = (remaining + endBalance) / 2;

                totalCompensation += averageBalance * monthlyDepotRate;
                remaining = endBalance;
            }

            const netDifference = totalMortgageInterest - totalCompensation;
            const perMonth = netDifference / months;
            const impactRatio = depot > 0 ? netDifference / depot : 0;

            let conclusion = 'Op basis van uw invoer lijkt het renteverlies beperkt. Toch blijft vergelijken nuttig, zeker bij afwijkende bankvoorwaarden.';
            if (impactRatio > 0.04) {
                conclusion = 'Uw uitkomst wijst op een relatief hoog renteverlies. Vooral de combinatie van langere looptijd en lager vergoedingspercentage drukt het resultaat.';
            } else if (impactRatio > 0.02) {
                conclusion = "Uw uitkomst laat een merkbaar renteverlies zien. Het kan lonen om scenario's met kortere looptijd of ander opnameverloop te vergelijken.";
            } else if (netDifference < 0) {
                conclusion = 'In dit scenario is de vergoeding hoger dan de berekende rentelast op het bouwdepotdeel. Controleer wel of uw geldverstrekker dit ook zo verwerkt.';
            }

            if (patternNote) patternNote.textContent = patternDescriptions[pattern] || patternDescriptions.even;
            if (resMortgage) resMortgage.textContent = formatEuro(totalMortgageInterest);
            if (resCompensation) resCompensation.textContent = '-' + formatEuro(totalCompensation);
            if (resNet) resNet.textContent = formatEuro(netDifference);
            if (resMonth) resMonth.textContent = formatEuro(perMonth);
            if (resConclusion) resConclusion.textContent = `${conclusion} Uitkomst is indicatief en geen lender-specifieke berekening.`;
        }

        if (rangeMonths) {
            rangeMonths.addEventListener('input', (e) => {
                inputMonths.value = e.target.value;
                calculate();
            });
        }

        [inputDepot, inputMortgageRate, inputDepotRate, inputMonths].forEach((el) => {
            if (el) el.addEventListener('input', calculate);
        });

        if (inputPattern) inputPattern.addEventListener('change', calculate);

        scenarioButtons.forEach((button) => {
            button.addEventListener('click', () => {
                if (button.dataset.depot) inputDepot.value = button.dataset.depot;
                if (button.dataset.mortgageRate) inputMortgageRate.value = button.dataset.mortgageRate;
                if (button.dataset.depotRate) inputDepotRate.value = button.dataset.depotRate;
                if (button.dataset.months) {
                    inputMonths.value = button.dataset.months;
                    if (rangeMonths) rangeMonths.value = button.dataset.months;
                }
                if (button.dataset.pattern) inputPattern.value = button.dataset.pattern;
                calculate();
            });
        });

        calculate();
    }


    // ----------------------------------------------
    // 1D. DUBBELE LASTEN NIEUWBOUW CALCULATOR
    // ----------------------------------------------
    function initDubbeleLastenCalculator() {
        const inputType = document.getElementById('input-dubbel-type');
        const typeNote = document.getElementById('dubbel-type-note');
        const inputNewBruto = document.getElementById('input-dubbel-new-bruto');
        const inputNewNetto = document.getElementById('input-dubbel-new-netto');
        const inputCurrent = document.getElementById('input-dubbel-current');
        const inputExtra = document.getElementById('input-dubbel-extra');
        const inputRenteverlies = document.getElementById('input-dubbel-renteverlies');
        const inputMonths = document.getElementById('input-dubbel-months');
        const rangeMonths = document.getElementById('range-dubbel-months');

        const resNewBruto = document.getElementById('res-dubbel-new-bruto');
        const rowNewNetto = document.getElementById('row-dubbel-new-netto');
        const resNewNetto = document.getElementById('res-dubbel-new-netto');
        const resCurrent = document.getElementById('res-dubbel-current');
        const resExtra = document.getElementById('res-dubbel-extra');
        const rowRenteverlies = document.getElementById('row-dubbel-renteverlies');
        const resRenteverlies = document.getElementById('res-dubbel-renteverlies');
        const resMonthly = document.getElementById('res-dubbel-monthly');
        const resTotal = document.getElementById('res-dubbel-total');
        const resPeak = document.getElementById('res-dubbel-peak');
        const resConclusion = document.getElementById('res-dubbel-conclusion');

        const scenarioButtons = document.querySelectorAll('.dubbel-scenario');

        const typeNotes = {
            huur: 'U combineert tijdelijke huur met de maandlast van uw nieuwe woning.',
            koop: 'U combineert tijdelijke lasten van uw huidige koopwoning met de nieuwe hypotheeklast.'
        };

        function calculate() {
            const type = inputType.value || 'huur';
            const newBruto = parseFloat(inputNewBruto.value) || 0;
            const newNetto = parseFloat(inputNewNetto.value) || 0;
            const current = parseFloat(inputCurrent.value) || 0;
            const extra = parseFloat(inputExtra.value) || 0;
            const renteverlies = parseFloat(inputRenteverlies.value) || 0;
            const months = Math.min(36, Math.max(1, parseInt(inputMonths.value || '1', 10)));

            const monthlyTotal = newBruto + current + extra + renteverlies;
            const monthlyTotalNettoView = (newNetto > 0 ? newNetto : newBruto) + current + extra + renteverlies;
            const totalPeriodCost = monthlyTotal * months;

            inputMonths.value = months;
            if (rangeMonths) rangeMonths.value = months;

            if (typeNote) typeNote.textContent = typeNotes[type] || typeNotes.huur;

            if (resNewBruto) resNewBruto.textContent = formatEuro(newBruto);
            if (resCurrent) resCurrent.textContent = formatEuro(current);
            if (resExtra) resExtra.textContent = formatEuro(extra);

            if (newNetto > 0) {
                if (rowNewNetto) rowNewNetto.style.display = 'flex';
                if (resNewNetto) resNewNetto.textContent = formatEuro(newNetto);
            } else if (rowNewNetto) {
                rowNewNetto.style.display = 'none';
            }

            if (renteverlies > 0) {
                if (rowRenteverlies) rowRenteverlies.style.display = 'flex';
                if (resRenteverlies) resRenteverlies.textContent = formatEuro(renteverlies);
            } else if (rowRenteverlies) {
                rowRenteverlies.style.display = 'none';
            }

            if (resMonthly) resMonthly.textContent = formatEuro(monthlyTotal);
            if (resTotal) resTotal.textContent = formatEuro(totalPeriodCost);
            if (resPeak) resPeak.textContent = formatEuro(monthlyTotal);

            let pressureText = 'Deze overlap lijkt in de lichte tot beheersbare categorie te vallen, mits uw buffer en overige uitgaven dit toelaten.';
            if (monthlyTotal >= 3000) {
                pressureText = 'De maanddruk is hoog. Plan extra buffer en toets tijdig of de overlapduur korter kan.';
            } else if (monthlyTotal >= 2200) {
                pressureText = 'De maanddruk is merkbaar. Houd weinig marge voor onverwachte kosten en plan extra ruimte in.';
            }

            const nettoHint = newNetto > 0
                ? ` Met uw ingevoerde netto hypotheeklast komt de gecombineerde maanddruk indicatief uit op ${formatEuro(monthlyTotalNettoView)}.`
                : ' U rekent nu volledig met bruto maandlast voor de nieuwe hypotheek.';

            if (resConclusion) {
                resConclusion.textContent = `${pressureText} Totale overlap over ${months} maanden: ${formatEuro(totalPeriodCost)}.${nettoHint}`;
            }
        }

        if (rangeMonths) {
            rangeMonths.addEventListener('input', (event) => {
                inputMonths.value = event.target.value;
                calculate();
            });
        }

        [inputType, inputNewBruto, inputNewNetto, inputCurrent, inputExtra, inputRenteverlies, inputMonths].forEach((el) => {
            if (!el) return;
            el.addEventListener('input', calculate);
            if (el.tagName === 'SELECT') el.addEventListener('change', calculate);
        });

        scenarioButtons.forEach((button) => {
            button.addEventListener('click', () => {
                if (button.dataset.type) inputType.value = button.dataset.type;
                if (button.dataset.newBruto) inputNewBruto.value = button.dataset.newBruto;
                if (button.dataset.newNetto) inputNewNetto.value = button.dataset.newNetto;
                if (button.dataset.current) inputCurrent.value = button.dataset.current;
                if (button.dataset.extra) inputExtra.value = button.dataset.extra;
                if (button.dataset.renteverlies) inputRenteverlies.value = button.dataset.renteverlies;
                if (button.dataset.months) {
                    inputMonths.value = button.dataset.months;
                    if (rangeMonths) rangeMonths.value = button.dataset.months;
                }
                calculate();
            });
        });

        calculate();
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
        const inputBuildMonths = document.getElementById('input-build-months');
        const rangeBuildMonths = document.getElementById('range-build-months');
        const inputCurrentHousing = document.getElementById('input-current-housing');

        const termsContainer = document.getElementById('terms-container');
        const addTermBtn = document.getElementById('add-term-btn');
        const autoSpreadBtn = document.getElementById('auto-spread-btn');
        const totalPercentEl = document.getElementById('total-percent');
        
        const resTotalLoan = document.getElementById('res-total-loan');
        const resStartMonthly = document.getElementById('res-start-monthly');
        const resMaxMonthly = document.getElementById('res-max-monthly');
        const resLoss = document.getElementById('res-loss');
        const resExtraNow = document.getElementById('res-extra-now');
        const resPeakMonth = document.getElementById('res-peak-month');
        const resPeakTotal = document.getElementById('res-peak-total');
        
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

        if (autoSpreadBtn) {
            autoSpreadBtn.addEventListener('click', () => {
                const duration = parseInt(inputBuildMonths?.value, 10) || 12;
                const phaseCount = Math.min(Math.max(Math.round(duration / 3), 3), 8);
                const step = Math.max(1, Math.floor(duration / phaseCount));
                const basePercent = Math.floor((100 / phaseCount) * 10) / 10;
                let remaining = 100;

                terms = Array.from({ length: phaseCount }, (_, index) => {
                    const pct = index === phaseCount - 1 ? Math.round(remaining * 10) / 10 : basePercent;
                    remaining -= pct;
                    return {
                        month: Math.min(duration, 1 + (index * step)),
                        percent: pct,
                        desc: `Bouwfase ${index + 1}`
                    };
                });

                renderTerms();
                calculate();
            });
        }

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
            const buildMonths = parseInt(inputBuildMonths?.value, 10) || 12;
            const currentHousingCost = parseFloat(inputCurrentHousing?.value) || 0;

            const monthlyRate = (interest / 100) / 12;
            let depotRate = (interest - discount) / 100 / 12;
            if (depotRate < 0) depotRate = 0;

            const totalLoan = landPrice + constructPrice;
            const n = 30 * 12;
            
            let fullAnnuity = 0;
            if(interest !== 0) fullAnnuity = totalLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));

            const maxMonth = Math.max(
                buildMonths,
                terms.length > 0 ? Math.max(...terms.map(t => t.month)) + 2 : 12
            );
            let currentDepot = constructPrice;
            let totalLoss = 0;
            const chartLabels = []; const dataUserPays = []; const dataDepotPays = [];
            let tableHTML = '';
            let peakMonth = 1;
            let peakTotalMonthly = 0;

            for(let m = 1; m <= maxMonth; m++) {
                
                // Gebruik filter om ALLE betalingen in deze maand te vinden
                const monthlyTerms = terms.filter(t => t.month === m);
                
                monthlyTerms.forEach(term => {
                      const amount = (term.percent / 100) * constructPrice;
                      currentDepot -= amount;
                });
                
                if(currentDepot < 0) currentDepot = 0;

                const interestReceivable = currentDepot * depotRate;
                const grossInterest = totalLoan * monthlyRate;
                let netPayment = fullAnnuity - interestReceivable;
                if(netPayment < 0) netPayment = 0;
                const totalMonthlyWithCurrent = netPayment + currentHousingCost;
                if (totalMonthlyWithCurrent > peakTotalMonthly) {
                    peakTotalMonthly = totalMonthlyWithCurrent;
                    peakMonth = m;
                }
                
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
            if (resExtraNow) resExtraNow.textContent = formatEuro(Math.max(0, startMonthly));
            if (resPeakMonth) resPeakMonth.textContent = `Maand ${peakMonth}`;
            if (resPeakTotal) resPeakTotal.textContent = formatEuro(peakTotalMonthly);
            
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
        if(rangeBuildMonths) rangeBuildMonths.addEventListener('input', (e) => { inputBuildMonths.value = e.target.value; calculate(); });
        if(inputBuildMonths) inputBuildMonths.addEventListener('input', (e) => { rangeBuildMonths.value = e.target.value; calculate(); });
        if(inputCurrentHousing) inputCurrentHousing.addEventListener('input', calculate);

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
