import '../styles/main.css';
import { initSharedFormMemory, setMemoryLockById } from './shared-form-memory';

document.addEventListener('DOMContentLoaded', () => {
    initSharedFormMemory();

    // --- HELPER: FORMAT EURO ---
    const formatEuro = (val) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    // --- GLOBAL REPORT PIPELINE & ROUTING ---
    const btnDownload = document.getElementById('btn-download');
    const reportToolkit = window.BouwdepotReporting || null;
    const bindReportButton = (button, options = {}) => {
        if (!button) return;
        if (reportToolkit?.registerReportButton) {
            reportToolkit.registerReportButton(button, options);
            return;
        }
        button.addEventListener('click', () => window.print());
    };

    // Routing
    if (document.getElementById('range-amount')) initVerbouwCalculator();
    if (document.getElementById('maandlasten-calc')) initMaandlastenBouwdepotCalculator();
    if (document.getElementById('dubbele-lasten-calc')) initDubbeleLastenNieuwbouwCalculator();
    if (document.getElementById('nieuwbouw-calc')) initNieuwbouwCalculator();
    if (document.getElementById('renteverlies-calc')) initRenteverliesCalculator();
    if (document.getElementById('belasting-calc')) initBelastingCalculator();

    bindReportButton(btnDownload);


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
        const resConclusion = document.getElementById('res-conclusion');
        const resMethod = document.getElementById('res-method');
        const reportGeneratedAt = document.getElementById('report-generated-at');
        const summaryAmount = document.getElementById('sum-amount');
        const summaryType = document.getElementById('sum-type');
        const summaryInterest = document.getElementById('sum-interest');
        const summaryDuration = document.getElementById('sum-duration');
        const summaryTax = document.getElementById('sum-tax');

        // --- NIEUW: Snelkeuze & Accordion Variabelen ---
        const costBtns = document.querySelectorAll('.cost-btn');
        const costToggleBtn = document.getElementById('cost-toggle-btn');
        const costContent = document.getElementById('cost-content');
        const costArrow = document.getElementById('cost-arrow');
        const btnResetCosts = document.getElementById('btn-reset-costs');
        const presetButtons = document.querySelectorAll('.preset-btn');
        const mortgageTypeLabels = {
            annuity: 'Annuïteiten',
            linear: 'Lineair'
        };

        const formatPercentage = (value) => `${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

        function buildHomepageReport(data) {
            return {
                toolTitle: 'Algemene bouwdepot calculator',
                generatedAt: data.generatedAt,
                inputs: {
                    amount: data.amount,
                    mortgageType: data.mortgageType,
                    interestRate: data.interestRate,
                    durationYears: data.durationYears,
                    taxIndicationEnabled: data.taxIndicationEnabled
                },
                results: {
                    netMonthly: data.netMonthly,
                    grossMonthly: data.grossMonthly,
                    indicativeTaxBenefit: data.taxBenefit
                },
                conclusion: `Bij deze invoer geeft het bouwdepot een indicatieve netto maandlast van ${formatEuro(data.netMonthly)} per maand.`,
                assumptions: 'Indicatieve snelle berekening op basis van standaard aannames; laat exacte persoonlijke cijfers controleren door uw geldverstrekker of adviseur.'
            };
        }

        function calculate() {
            const type = inputType ? inputType.value : 'annuity';
            const amount = parseFloat(inputAmount.value) || 0;
            const interest = parseFloat(inputInterest.value) || 0;
            const years = parseInt(rangeDuration.value, 10) || 30;
            
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
            const now = new Date();
            const reportData = buildHomepageReport({
                amount,
                mortgageType: mortgageTypeLabels[type] || type,
                interestRate: interest,
                durationYears: years,
                taxIndicationEnabled: checkAftrek.checked,
                netMonthly,
                grossMonthly,
                taxBenefit,
                generatedAt: now.toISOString()
            });

            resBruto.textContent = formatEuro(grossMonthly);
            
            if (checkAftrek.checked) {
                if(rowVoordeel) rowVoordeel.style.display = 'flex';
                resVoordeel.textContent = '-' + formatEuro(taxBenefit);
            } else {
                if(rowVoordeel) rowVoordeel.style.display = 'none';
            }
            resNetto.textContent = formatEuro(netMonthly);

            if (summaryAmount) summaryAmount.textContent = formatEuro(reportData.inputs.amount);
            if (summaryType) summaryType.textContent = reportData.inputs.mortgageType;
            if (summaryInterest) summaryInterest.textContent = formatPercentage(reportData.inputs.interestRate);
            if (summaryDuration) summaryDuration.textContent = `${reportData.inputs.durationYears} jaar`;
            if (summaryTax) summaryTax.textContent = reportData.inputs.taxIndicationEnabled ? 'Aan' : 'Uit';
            if (resConclusion) resConclusion.textContent = reportData.conclusion;
            if (resMethod) resMethod.textContent = reportData.assumptions;
            if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;

            if (btnDownload) {
                btnDownload.dataset.report = JSON.stringify(reportData);
            }
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
        const resConclusion = document.getElementById('res-month-conclusion');
        const resInterpretation = document.getElementById('res-month-interpretation');
        const resMethod = document.getElementById('res-month-method');
        const reportGeneratedAt = document.getElementById('report-month-generated-at');
        const summaryMortgage = document.getElementById('sum-month-mortgage');
        const summaryDepot = document.getElementById('sum-month-depot');
        const summaryRate = document.getElementById('sum-month-rate');
        const summaryDepotRate = document.getElementById('sum-month-depot-rate');
        const summaryDuration = document.getElementById('sum-month-duration');
        const summaryPattern = document.getElementById('sum-month-pattern');
        const summaryExtra = document.getElementById('sum-month-extra');
        const btnDownloadMaandlasten = document.getElementById('btn-download-maandlasten');
        bindReportButton(btnDownloadMaandlasten);

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
        const patternNames = {
            even: 'Gelijkmatig opnemen',
            slow: 'Rustige start, later meer opname',
            fast: 'Snelle opname in eerste maanden'
        };
        const formatPercentage = (value) => `${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

        function buildMaandlastenReport(data) {
            return {
                toolTitle: 'Maandlasten bouwdepot calculator',
                generatedAt: data.generatedAt,
                inputs: {
                    totalMortgage: data.totalMortgage,
                    depotAmount: data.depotAmount,
                    mortgageRate: data.mortgageRate,
                    depotCompensationRate: data.depotCompensationRate,
                    durationMonths: data.durationMonths,
                    opnamePattern: data.opnamePattern,
                    extraHousingCost: data.extraHousingCost
                },
                results: {
                    netMonthly: data.netMonthly,
                    grossMonthlyInterest: data.grossMonthlyInterest,
                    monthlyCompensation: data.monthlyCompensation,
                    periodTotal: data.periodTotal,
                    doubleBurdenMonthly: data.doubleBurdenMonthly
                },
                conclusion: `Bij deze invoer komt uw bouwdepotfase indicatief uit op ${formatEuro(data.netMonthly)} netto per maand over ${data.durationMonths} maanden.`,
                interpretation: data.interpretation,
                assumptions: 'Indicatieve berekening met aannames over opnamepatroon en gemiddelde niet-opgenomen depotstand; persoonlijke bankvoorwaarden en werkelijke opnames bepalen de exacte uitkomst.'
            };
        }

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
            const ratioToMortgage = mortgage > 0 ? netMonthly / mortgage : 0;

            let impactLabel = 'beperkt';
            if (ratioToMortgage >= 0.003) impactLabel = 'substantieel';
            else if (ratioToMortgage >= 0.0015) impactLabel = 'merkbaar';

            const interpretation = `De maandimpact is ${impactLabel}. Een ${patternNames[pattern]?.toLowerCase() || 'gekozen'} opnamepatroon en een duur van ${months} maanden bepalen hoe lang de netto maanddruk aanhoudt en hoeveel vergoeding u ontvangt.`;
            const now = new Date();
            const report = buildMaandlastenReport({
                totalMortgage: mortgage,
                depotAmount: depot,
                mortgageRate,
                depotCompensationRate: depotRate,
                durationMonths: months,
                opnamePattern: patternNames[pattern] || pattern,
                extraHousingCost: extraHousing,
                netMonthly,
                grossMonthlyInterest: grossMonthly,
                monthlyCompensation,
                periodTotal,
                doubleBurdenMonthly: extraHousing > 0 ? doubleBurden : null,
                interpretation,
                generatedAt: now.toISOString()
            });

            resGross.textContent = formatEuro(grossMonthly);
            resComp.textContent = '-' + formatEuro(monthlyCompensation);
            resNet.textContent = formatEuro(netMonthly);
            resPeriod.textContent = formatEuro(periodTotal);
            assumptionText.textContent = patternLabels[pattern];
            if (resConclusion) resConclusion.textContent = report.conclusion;
            if (resInterpretation) resInterpretation.textContent = report.interpretation;
            if (resMethod) resMethod.textContent = report.assumptions;
            if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;

            if (summaryMortgage) summaryMortgage.textContent = formatEuro(report.inputs.totalMortgage);
            if (summaryDepot) summaryDepot.textContent = formatEuro(report.inputs.depotAmount);
            if (summaryRate) summaryRate.textContent = formatPercentage(report.inputs.mortgageRate);
            if (summaryDepotRate) summaryDepotRate.textContent = formatPercentage(report.inputs.depotCompensationRate);
            if (summaryDuration) summaryDuration.textContent = `${report.inputs.durationMonths} maanden`;
            if (summaryPattern) summaryPattern.textContent = report.inputs.opnamePattern;
            if (summaryExtra) summaryExtra.textContent = report.inputs.extraHousingCost > 0 ? formatEuro(report.inputs.extraHousingCost) : 'Niet ingevuld';

            if (extraHousing > 0) {
                if (resDoubleRow) resDoubleRow.style.display = 'flex';
                resDouble.textContent = formatEuro(doubleBurden);
            } else if (resDoubleRow) {
                resDoubleRow.style.display = 'none';
            }

            if (btnDownloadMaandlasten) btnDownloadMaandlasten.dataset.report = JSON.stringify(report);
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
    // 1C. DUBBELE LASTEN NIEUWBOUW CALCULATOR
    // ----------------------------------------------
    function initDubbeleLastenNieuwbouwCalculator() {
        const inputType = document.getElementById('input-dubbel-type');
        const typeNote = document.getElementById('dubbel-type-note');
        const inputNewBruto = document.getElementById('input-dubbel-new-bruto');
        const inputNewNetto = document.getElementById('input-dubbel-new-netto');
        const inputCurrent = document.getElementById('input-dubbel-current');
        const inputExtra = document.getElementById('input-dubbel-extra');
        const inputRenteverlies = document.getElementById('input-dubbel-renteverlies');
        const inputMonths = document.getElementById('input-dubbel-months');
        const rangeMonths = document.getElementById('range-dubbel-months');
        const scenarioButtons = document.querySelectorAll('.dubbel-scenario');
        const btnDownloadDubbel = document.getElementById('btn-download-dubbel');
        bindReportButton(btnDownloadDubbel);

        const resNewBruto = document.getElementById('res-dubbel-new-bruto');
        const resNewNetto = document.getElementById('res-dubbel-new-netto');
        const rowNewNetto = document.getElementById('row-dubbel-new-netto');
        const resCurrent = document.getElementById('res-dubbel-current');
        const resExtra = document.getElementById('res-dubbel-extra');
        const resRenteverlies = document.getElementById('res-dubbel-renteverlies');
        const rowRenteverlies = document.getElementById('row-dubbel-renteverlies');
        const resMonthly = document.getElementById('res-dubbel-monthly');
        const resTotal = document.getElementById('res-dubbel-total');
        const resPeak = document.getElementById('res-dubbel-peak');
        const resConclusion = document.getElementById('res-dubbel-conclusion');
        const resInterpretation = document.getElementById('res-dubbel-interpretation');
        const resBudgetMeaning = document.getElementById('res-dubbel-budget-meaning');
        const resMethod = document.getElementById('res-dubbel-method');
        const reportGeneratedAt = document.getElementById('report-dubbel-generated-at');

        const sumType = document.getElementById('sum-dubbel-type');
        const sumNewUsed = document.getElementById('sum-dubbel-new-used');
        const sumCurrent = document.getElementById('sum-dubbel-current');
        const sumExtra = document.getElementById('sum-dubbel-extra');
        const sumRenteverlies = document.getElementById('sum-dubbel-renteverlies');
        const sumMonths = document.getElementById('sum-dubbel-months');

        const typeLabels = {
            huur: 'Huurwoning + nieuwbouw',
            koop: 'Koopwoning + nieuwbouw'
        };
        const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

        function buildDubbeleLastenReport(data) {
            return {
                toolTitle: 'Dubbele lasten nieuwbouw calculator',
                generatedAt: data.generatedAt,
                inputs: {
                    situationType: data.situationType,
                    newHousingMonthlyUsed: data.newHousingMonthlyUsed,
                    currentHousingMonthly: data.currentHousingMonthly,
                    extraOverlapMonthly: data.extraOverlapMonthly,
                    renteverliesMonthly: data.renteverliesMonthly,
                    overlapMonths: data.overlapMonths
                },
                results: {
                    totalDoubleMonthlyBurden: data.totalDoubleMonthlyBurden,
                    totalOverlapCost: data.totalOverlapCost,
                    dominantComponent: data.dominantComponent,
                    overlapInterpretation: data.overlapInterpretation
                },
                conclusion: data.conclusion,
                assumptions: 'Indicatieve overlap-check met vaste maandbedragen. Werkelijke maandlasten kunnen variëren door oplevering, verhuisdatum en productvoorwaarden.'
            };
        }

        function calculate() {
            const type = inputType?.value || 'huur';
            const newBruto = parseFloat(inputNewBruto?.value) || 0;
            const newNetto = parseFloat(inputNewNetto?.value) || 0;
            const current = parseFloat(inputCurrent?.value) || 0;
            const extra = parseFloat(inputExtra?.value) || 0;
            const renteverlies = parseFloat(inputRenteverlies?.value) || 0;
            const months = Math.min(36, Math.max(1, parseInt(inputMonths?.value || '1', 10)));
            if (inputMonths) inputMonths.value = months;
            if (rangeMonths) rangeMonths.value = months;

            const usedNewMonthly = newNetto > 0 ? newNetto : newBruto;
            const totalMonthly = usedNewMonthly + current + extra + renteverlies;
            const totalPeriod = totalMonthly * months;
            const peakMonthly = totalMonthly;
            const now = new Date();

            const components = [
                { label: 'Nieuwe maandlast', value: usedNewMonthly },
                { label: 'Huidige woonlast', value: current },
                { label: 'Extra overlapkosten', value: extra + renteverlies }
            ];
            components.sort((a, b) => b.value - a.value);
            const dominantComponent = components[0].label;

            let pressure = 'beperkt';
            if (totalMonthly >= 3500) pressure = 'zwaar';
            else if (totalMonthly >= 2500) pressure = 'merkbaar';

            const interpretation = `De overlapdruk is ${pressure}. ${dominantComponent} is in dit scenario de grootste kostencomponent per maand.`;
            const budgetMeaning = months >= 10
                ? 'De overlapperiode is relatief lang: het totaalbedrag loopt hierdoor snel op, ook als de maanddruk nog beheersbaar lijkt.'
                : 'De overlapperiode is relatief kort: de maanddruk is vooral tijdelijk, maar vraagt wel directe buffer in de zwaarste maanden.';
            const conclusion = `Bij deze invoer komt uw tijdelijke dubbele maandlast indicatief uit op ${formatEuro(totalMonthly)} per maand gedurende ${months} maanden.`;

            resNewBruto.textContent = formatEuro(newBruto);
            resCurrent.textContent = formatEuro(current);
            resExtra.textContent = formatEuro(extra);
            resMonthly.textContent = formatEuro(totalMonthly);
            resTotal.textContent = formatEuro(totalPeriod);
            resPeak.textContent = formatEuro(peakMonthly);
            if (resConclusion) resConclusion.textContent = conclusion;
            if (resInterpretation) resInterpretation.textContent = interpretation;
            if (resBudgetMeaning) resBudgetMeaning.textContent = budgetMeaning;
            if (resMethod) resMethod.textContent = 'Indicatieve overlapberekening met vaste maandbedragen; werkelijke bedragen kunnen per maand afwijken.';
            if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;

            if (newNetto > 0) {
                if (rowNewNetto) rowNewNetto.style.display = 'flex';
                resNewNetto.textContent = formatEuro(newNetto);
            } else if (rowNewNetto) {
                rowNewNetto.style.display = 'none';
            }

            if (renteverlies > 0) {
                if (rowRenteverlies) rowRenteverlies.style.display = 'flex';
                resRenteverlies.textContent = formatEuro(renteverlies);
            } else if (rowRenteverlies) {
                rowRenteverlies.style.display = 'none';
            }

            if (typeNote) {
                typeNote.textContent = type === 'koop'
                    ? 'U combineert tijdelijk twee hypotheekachtige woonlasten.'
                    : 'U combineert tijdelijke huur met de maandlast van uw nieuwe woning.';
            }

            if (sumType) sumType.textContent = typeLabels[type] || type;
            if (sumNewUsed) sumNewUsed.textContent = formatEuro(usedNewMonthly);
            if (sumCurrent) sumCurrent.textContent = formatEuro(current);
            if (sumExtra) sumExtra.textContent = formatEuro(extra);
            if (sumRenteverlies) sumRenteverlies.textContent = renteverlies > 0 ? formatEuro(renteverlies) : 'Niet ingevuld';
            if (sumMonths) sumMonths.textContent = `${months} maanden`;

            const report = buildDubbeleLastenReport({
                situationType: typeLabels[type] || type,
                newHousingMonthlyUsed: usedNewMonthly,
                currentHousingMonthly: current,
                extraOverlapMonthly: extra,
                renteverliesMonthly: renteverlies,
                overlapMonths: months,
                totalDoubleMonthlyBurden: totalMonthly,
                totalOverlapCost: totalPeriod,
                dominantComponent,
                overlapInterpretation: interpretation,
                conclusion,
                generatedAt: now.toISOString()
            });

            if (btnDownloadDubbel) btnDownloadDubbel.dataset.report = JSON.stringify(report);
        }

        [inputType, inputNewBruto, inputNewNetto, inputCurrent, inputExtra, inputRenteverlies, inputMonths].forEach((el) => {
            if (!el) return;
            el.addEventListener('input', calculate);
            if (el.tagName === 'SELECT') el.addEventListener('change', calculate);
        });

        if (rangeMonths) {
            rangeMonths.addEventListener('input', (e) => {
                if (inputMonths) inputMonths.value = e.target.value;
                calculate();
            });
        }

        scenarioButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                if (inputType && btn.dataset.type) inputType.value = btn.dataset.type;
                if (inputNewBruto && btn.dataset.newBruto) inputNewBruto.value = btn.dataset.newBruto;
                if (inputNewNetto && btn.dataset.newNetto) inputNewNetto.value = btn.dataset.newNetto;
                if (inputCurrent && btn.dataset.current) inputCurrent.value = btn.dataset.current;
                if (inputExtra && btn.dataset.extra) inputExtra.value = btn.dataset.extra;
                if (inputRenteverlies && btn.dataset.renteverlies) inputRenteverlies.value = btn.dataset.renteverlies;
                if (inputMonths && btn.dataset.months) inputMonths.value = btn.dataset.months;
                if (rangeMonths && btn.dataset.months) rangeMonths.value = btn.dataset.months;
                calculate();
            });
        });


        calculate();
    }


    // ----------------------------------------------
    // 1D. RENTEVERLIES BOUWDEPOT CALCULATOR
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
        const resInterpretation = document.getElementById('res-renteverlies-interpretation');
        const resMeaning = document.getElementById('res-renteverlies-meaning');
        const resMethod = document.getElementById('res-renteverlies-method');
        const resPeriodPattern = document.getElementById('res-renteverlies-period-pattern');
        const reportGeneratedAt = document.getElementById('report-renteverlies-generated-at');
        const patternNote = document.getElementById('renteverlies-pattern-note');
        const btnDownloadRenteverlies = document.getElementById('btn-download-renteverlies');
        bindReportButton(btnDownloadRenteverlies);

        const sumDepot = document.getElementById('sum-renteverlies-depot');
        const sumMortgageRate = document.getElementById('sum-renteverlies-mortgage-rate');
        const sumDepotRate = document.getElementById('sum-renteverlies-depot-rate');
        const sumMonths = document.getElementById('sum-renteverlies-months');
        const sumPattern = document.getElementById('sum-renteverlies-pattern');

        const scenarioButtons = document.querySelectorAll('.renteverlies-scenario');

        const patternDescriptions = {
            even: 'Bij gelijkmatig opnemen daalt het resterende depot in gelijke stappen.',
            fast: 'Bij snelle opname in het begin daalt het niet-opgenomen depot eerder, waardoor de vergoeding sneller afneemt.',
            slow: 'Bij latere opname blijft het niet-opgenomen depot langer hoog, waardoor timing meer invloed krijgt op de uitkomst.'
        };
        const patternLabels = {
            even: 'Gelijkmatig opgenomen',
            fast: 'Snelle opname in het begin',
            slow: 'Vooral later opgenomen'
        };
        const formatPercentage = (value) => `${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

        function buildRenteverliesReport(data) {
            return {
                toolTitle: 'Renteverlies bouwdepot calculator',
                generatedAt: data.generatedAt,
                inputs: {
                    depotAmount: data.depotAmount,
                    mortgageRate: data.mortgageRate,
                    depotCompensationRate: data.depotCompensationRate,
                    months: data.months,
                    opnamePattern: data.opnamePattern
                },
                results: {
                    totalIndicativeRenteverlies: data.totalIndicativeRenteverlies,
                    averageMonthlyEffect: data.averageMonthlyEffect,
                    totalMortgageInterest: data.totalMortgageInterest,
                    totalCompensation: data.totalCompensation,
                    interpretationLabel: data.interpretationLabel
                },
                conclusion: data.conclusion,
                assumptions: data.assumptions
            };
        }

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
            const rateSpread = Math.max(0, mortgageRate - depotRate);

            let interpretationLabel = 'beperkt';
            if (impactRatio > 0.04) interpretationLabel = 'fors';
            else if (impactRatio > 0.02) interpretationLabel = 'merkbaar';
            else if (netDifference < 0) interpretationLabel = 'negatief renteverlies';

            const driverScores = [
                { key: 'renteverschil', value: rateSpread * depot },
                { key: 'looptijd', value: months * Math.max(0.01, rateSpread) * depot / 12 },
                { key: 'opnamepatroon', value: pattern === 'even' ? 1 : 1.2 }
            ];
            driverScores.sort((a, b) => b.value - a.value);
            const mainDriver = driverScores[0].key;

            let conclusion = `Bij deze invoer komt het indicatieve renteverlies uit op ${formatEuro(netDifference)} over ${months} maanden.`;
            if (netDifference < 0) {
                conclusion = `Bij deze invoer is de vergoeding hoger dan de betaalde rente over ${months} maanden; het indicatieve verschil is ${formatEuro(netDifference)}.`;
            }

            const interpretation = netDifference < 0
                ? 'In dit scenario is het renteverschil gunstig. Controleer wel of uw geldverstrekker dezelfde systematiek gebruikt.'
                : `Het renteverlies is ${interpretationLabel}; de belangrijkste aanjager is ${mainDriver}. Een groter verschil tussen hypotheekrente en depotvergoeding verhoogt het effect direct.`;
            const meaning = pattern === 'slow'
                ? 'Bij langzamere opname blijft een hoger restdepot langer staan. Dat kan het cumulatieve renteverschil in de bouwdepotfase vergroten.'
                : 'Ook als het maandverschil beperkt lijkt, kan het totaal over meerdere maanden relevant zijn voor uw bouwdepotbudget.';
            const assumptions = 'Indicatieve maandbenadering op basis van gekozen opnamepatroon; werkelijke bankboekingen en opnamedata kunnen afwijken.';
            const now = new Date();

            if (patternNote) patternNote.textContent = patternDescriptions[pattern] || patternDescriptions.even;
            if (resMortgage) resMortgage.textContent = formatEuro(totalMortgageInterest);
            if (resCompensation) resCompensation.textContent = '-' + formatEuro(totalCompensation);
            if (resNet) resNet.textContent = formatEuro(netDifference);
            if (resMonth) resMonth.textContent = formatEuro(perMonth);
            if (resPeriodPattern) resPeriodPattern.textContent = `${months} maanden · ${patternLabels[pattern] || pattern}`;
            if (resConclusion) resConclusion.textContent = conclusion;
            if (resInterpretation) resInterpretation.textContent = interpretation;
            if (resMeaning) resMeaning.textContent = meaning;
            if (resMethod) resMethod.textContent = assumptions;
            if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;

            if (sumDepot) sumDepot.textContent = formatEuro(depot);
            if (sumMortgageRate) sumMortgageRate.textContent = formatPercentage(mortgageRate);
            if (sumDepotRate) sumDepotRate.textContent = formatPercentage(depotRate);
            if (sumMonths) sumMonths.textContent = `${months} maanden`;
            if (sumPattern) sumPattern.textContent = patternLabels[pattern] || pattern;

            const report = buildRenteverliesReport({
                depotAmount: depot,
                mortgageRate,
                depotCompensationRate: depotRate,
                months,
                opnamePattern: patternLabels[pattern] || pattern,
                totalIndicativeRenteverlies: netDifference,
                averageMonthlyEffect: perMonth,
                totalMortgageInterest,
                totalCompensation,
                interpretationLabel,
                conclusion,
                assumptions,
                generatedAt: now.toISOString()
            });

            if (btnDownloadRenteverlies) btnDownloadRenteverlies.dataset.report = JSON.stringify(report);
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
        const resAverageMonthly = document.getElementById('res-average-monthly');
        const resOverlapTotal = document.getElementById('res-overlap-total');
        const resConclusion = document.getElementById('res-nieuwbouw-conclusion');
        const resInterpretation = document.getElementById('res-nieuwbouw-interpretation');
        const resTimeline = document.getElementById('res-nieuwbouw-timeline');
        const resMethod = document.getElementById('res-nieuwbouw-method');
        const reportGeneratedAt = document.getElementById('report-nieuwbouw-generated-at');
        const sumLand = document.getElementById('sum-nieuwbouw-land');
        const sumConstruction = document.getElementById('sum-nieuwbouw-construction');
        const sumInterest = document.getElementById('sum-nieuwbouw-interest');
        const sumDiscount = document.getElementById('sum-nieuwbouw-discount');
        const sumDuration = document.getElementById('sum-nieuwbouw-duration');
        const sumHousing = document.getElementById('sum-nieuwbouw-housing');
        const sumTerms = document.getElementById('sum-nieuwbouw-terms');
        
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
        const formatPercentage = (value) => `${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

        function buildNieuwbouwReport(data) {
            return {
                toolTitle: 'Nieuwbouw calculator',
                generatedAt: data.generatedAt,
                inputs: {
                    landCost: data.landCost,
                    constructionCost: data.constructionCost,
                    mortgageRate: data.mortgageRate,
                    depotRateDiscount: data.depotRateDiscount,
                    buildMonths: data.buildMonths,
                    currentHousingCost: data.currentHousingCost,
                    termsCount: data.termsCount
                },
                results: {
                    planningMainOutcome: data.planningMainOutcome,
                    peakMonth: data.peakMonth,
                    peakTotalMonthly: data.peakTotalMonthly,
                    averageNetMonthly: data.averageNetMonthly,
                    periodNetTotal: data.periodNetTotal,
                    overlapTotal: data.overlapTotal,
                    totalInterestLoss: data.totalInterestLoss
                },
                conclusion: data.conclusion,
                interpretation: data.interpretation,
                timelineMeaning: data.timelineMeaning,
                assumptions: 'Indicatieve nieuwbouwplanning op basis van vaste rente, bouwduur en ingevoerde termijnen. Werkelijke timing, declaraties en bankvoorwaarden kunnen afwijken.'
            };
        }

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
            let totalNetPayments = 0;

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
                totalNetPayments += netPayment;

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
            const averageNetMonthly = maxMonth > 0 ? totalNetPayments / maxMonth : 0;
            const overlapTotal = currentHousingCost * buildMonths;
            if (resAverageMonthly) resAverageMonthly.textContent = formatEuro(averageNetMonthly);
            if (resOverlapTotal) resOverlapTotal.textContent = formatEuro(overlapTotal);

            const pressureRatio = currentHousingCost > 0 ? peakTotalMonthly / currentHousingCost : 1;
            let pressureLabel = 'beheersbaar';
            if (pressureRatio >= 2.2) pressureLabel = 'zwaar';
            else if (pressureRatio >= 1.6) pressureLabel = 'merkbaar';

            const latePhaseTerms = terms.filter((t) => t.month >= Math.max(1, buildMonths - 2));
            const latePhasePercent = latePhaseTerms.reduce((sum, term) => sum + term.percent, 0);
            const timelineLine = latePhasePercent >= 35
                ? `De druk bouwt vooral richting oplevering op: circa ${Math.round(latePhasePercent)}% van de aanneemsom valt in de laatste bouwmaanden.`
                : 'De termijnverdeling is redelijk gespreid; de maanddruk loopt daardoor gelijkmatiger op.';

            const conclusion = `Bij deze invoer ligt de hoogste maanddruk indicatief in maand ${peakMonth} op ${formatEuro(peakTotalMonthly)} totaal per maand.`;
            const interpretation = `Uw nieuwbouwscenario voelt ${pressureLabel}: de combinatie van overlaplasten en opnametempo bepaalt de piekdruk het meest.`;
            if (resConclusion) resConclusion.textContent = conclusion;
            if (resInterpretation) resInterpretation.textContent = interpretation;
            if (resTimeline) resTimeline.textContent = timelineLine;
            if (resMethod) resMethod.textContent = 'Indicatieve planning op basis van uw rente, bouwduur en termijnschema; werkelijke planning en bankvoorwaarden kunnen afwijken.';

            if (sumLand) sumLand.textContent = formatEuro(landPrice);
            if (sumConstruction) sumConstruction.textContent = formatEuro(constructPrice);
            if (sumInterest) sumInterest.textContent = formatPercentage(interest);
            if (sumDiscount) sumDiscount.textContent = formatPercentage(discount);
            if (sumDuration) sumDuration.textContent = `${buildMonths} maanden`;
            if (sumHousing) sumHousing.textContent = currentHousingCost > 0 ? formatEuro(currentHousingCost) : 'Niet ingevuld';
            if (sumTerms) sumTerms.textContent = `${terms.length} termijnen`;

            const report = buildNieuwbouwReport({
                landCost: landPrice,
                constructionCost: constructPrice,
                mortgageRate: interest,
                depotRateDiscount: discount,
                buildMonths,
                currentHousingCost,
                termsCount: terms.length,
                planningMainOutcome: 'Piekmaand totaal maandlast',
                peakMonth,
                peakTotalMonthly,
                averageNetMonthly,
                periodNetTotal: totalNetPayments,
                overlapTotal,
                totalInterestLoss: totalLoss,
                conclusion,
                interpretation,
                timelineMeaning: timelineLine,
                generatedAt: new Date().toISOString()
            });

            if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(new Date(report.generatedAt))}.`;
            if (btnDownload) btnDownload.dataset.report = JSON.stringify(report);
            
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
        const outNettoYear = document.getElementById('res-netto-year');
        const txtTrend = document.getElementById('netto-trend-text');
        const outConclusion = document.getElementById('res-fiscal-conclusion');
        const outInterpretation = document.getElementById('res-fiscal-interpretation');
        const outMeaning = document.getElementById('res-fiscal-meaning');
        const outMethod = document.getElementById('res-fiscal-method');
        const reportGeneratedAt = document.getElementById('report-fiscal-generated-at');
        const btnDownloadFiscal = document.getElementById('btn-download-fiscal');
        bindReportButton(btnDownloadFiscal);
        const sumType = document.getElementById('sum-fiscal-type');
        const sumIncome = document.getElementById('sum-fiscal-income');
        const sumAmount = document.getElementById('sum-fiscal-amount');
        const sumInterest = document.getElementById('sum-fiscal-interest');
        const sumWoz = document.getElementById('sum-fiscal-woz');
        const sumCosts = document.getElementById('sum-fiscal-costs');
        
        const tableWrapper = document.getElementById('table-wrapper');
        const tableBody = document.getElementById('details-table-body');
        const toggleTableBtn = document.getElementById('toggle-table-btn');

        let fiscalChart = null;

        const params = new URLSearchParams(window.location.search);
        if(params.has('amount')) {
            inputAmount.value = params.get('amount');
            setMemoryLockById('fiscal-amount');
        }
        if(params.has('interest')) {
             inputInterest.value = params.get('interest');
             rangeInterest.value = params.get('interest');
             setMemoryLockById('fiscal-interest');
             setMemoryLockById('range-fiscal-interest');
        }

        const RULES_2026 = {
            maxRate: 37.56, 
            ewfRate: 0.0035,       
            villataksLimit: 1350000, 
            villataksRate: 0.0235, 
            hillenFactor: 0.7187 
        };
        const typeLabels = {
            annuity: 'Annuïteiten',
            linear: 'Lineair'
        };
        const formatPercentage = (value) => `${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

        function buildFiscalReport(data) {
            return {
                toolTitle: 'Belastingvoordeel / netto maandlast calculator',
                generatedAt: data.generatedAt,
                inputs: {
                    mortgageType: data.mortgageType,
                    grossIncome: data.grossIncome,
                    mortgageAmount: data.mortgageAmount,
                    mortgageRate: data.mortgageRate,
                    wozValue: data.wozValue,
                    oneTimeDeductibleCosts: data.oneTimeDeductibleCosts
                },
                results: {
                    grossMonthly: data.grossMonthly,
                    taxBenefitMonthly: data.taxBenefitMonthly,
                    netMonthly: data.netMonthly,
                    netYearly: data.netYearly,
                    interpretationLabel: data.interpretationLabel
                },
                conclusion: data.conclusion,
                assumptions: data.assumptions
            };
        }
        
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
            const income = parseFloat(inputIncome.value) || 0;
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
            if (outNettoYear) outNettoYear.textContent = formatEuro(firstYearNetto * 12);
            if (txtTrend) txtTrend.textContent = `Stijgt naar ${formatEuro(lastYearNetto)} in jaar 30`;

            const benefitShare = firstYearBruto > 0 ? firstYearBenefit / firstYearBruto : 0;
            let interpretationLabel = 'beperkt';
            if (benefitShare >= 0.25) interpretationLabel = 'relevant';
            else if (benefitShare >= 0.12) interpretationLabel = 'merkbaar';

            const driver = interestPct >= 4 ? 'hypotheekrente' : (income >= 90000 ? 'inkomens- en schijfwerking' : 'combinatie van rente en WOZ');
            const conclusion = `Bij deze invoer komt uw indicatieve netto maandlast uit op ${formatEuro(firstYearNetto)} per maand, na een geschat belastingeffect van ${formatEuro(firstYearBenefit)}.`;
            const interpretation = `Het fiscale effect is ${interpretationLabel}; in dit scenario is ${driver} de belangrijkste aanjager van het bruto-netto verschil.`;
            const meaning = 'Gebruik dit als fiscale oriëntatie: persoonlijke aangifte, aftrekruimte en definitieve regels kunnen de werkelijke netto-uitkomst veranderen.';
            const assumptions = 'Indicatieve projectie op basis van 2026-regels en constante aannames; geen persoonlijke aangifte-uitkomst.';

            if (outConclusion) outConclusion.textContent = conclusion;
            if (outInterpretation) outInterpretation.textContent = interpretation;
            if (outMeaning) outMeaning.textContent = meaning;
            if (outMethod) outMethod.textContent = assumptions;

            if (sumType) sumType.textContent = typeLabels[type] || type;
            if (sumIncome) sumIncome.textContent = formatEuro(income);
            if (sumAmount) sumAmount.textContent = formatEuro(amount);
            if (sumInterest) sumInterest.textContent = formatPercentage(interestPct);
            if (sumWoz) sumWoz.textContent = formatEuro(woz);
            if (sumCosts) sumCosts.textContent = oneTimeCosts > 0 ? formatEuro(oneTimeCosts) : 'Geen';

            const now = new Date();
            if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;

            const report = buildFiscalReport({
                mortgageType: typeLabels[type] || type,
                grossIncome: income,
                mortgageAmount: amount,
                mortgageRate: interestPct,
                wozValue: woz,
                oneTimeDeductibleCosts: oneTimeCosts,
                grossMonthly: firstYearBruto,
                taxBenefitMonthly: firstYearBenefit,
                netMonthly: firstYearNetto,
                netYearly: firstYearNetto * 12,
                interpretationLabel,
                conclusion,
                assumptions,
                generatedAt: now.toISOString()
            });
            if (btnDownloadFiscal) btnDownloadFiscal.dataset.report = JSON.stringify(report);

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
