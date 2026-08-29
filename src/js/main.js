// Dit bestand bedient zes rekenpagina's. De vorm komt volledig uit
// src/styles/, dat elke pagina zelf linkt; hier wordt geen stylesheet
// geimporteerd.
import { initSharedFormMemory, setMemoryLockById } from './shared-form-memory';
import { huidigeBank, opBankwissel, vergoedingsTarief } from './bankkeuze.js';
import { tekenStaafgrafiek } from './staafgrafiek.js';
import { leesGetal, toonGetal, leesPercentage } from './getallen.js';
import {
    TAX_RULES_2026,
    calculateEffectiveDeductionRate,
    calculateEigenwoningforfait,
    calculateHomeDeductionBalance,
    calculateHomeTaxEffect,
    calculateNhgFee
} from './fiscal-rules.js';

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

        // De verbouwbegroting linkt hierheen met het depotbedrag in de URL, zodat
        // de reeks begroting -> maandlast doorloopt. Zonder deze afhandeling was
        // die link een loze belofte: het bedrag kwam niet mee.
        const urlParams = new URLSearchParams(window.location.search);
        const bedragUitUrl = urlParams.get('bedrag') || urlParams.get('amount');
        if (bedragUitUrl && Number(bedragUitUrl) > 0) {
            inputAmount.value = bedragUitUrl;
            if (rangeAmount) {
                const min = Number(rangeAmount.min) || 0;
                const max = Number(rangeAmount.max) || Number(bedragUitUrl);
                rangeAmount.value = Math.min(Math.max(Number(bedragUitUrl), min), max);
            }
            // Voorkomt dat de onthouden invoer het meegegeven bedrag overschrijft.
            setMemoryLockById('input-amount');
            setMemoryLockById('range-amount');
        }

        const valDuration = document.getElementById('val-duration');
        const resBruto = document.getElementById('res-bruto');
        const rowBruto = document.getElementById('row-bruto');
        const resVoordeel = document.getElementById('res-voordeel');
        const resNetto = document.getElementById('res-netto');
        const uitkomstLabel = document.getElementById('uitkomst-label');
        const resRentedeel = document.getElementById('res-rentedeel');
        const resAflossingdeel = document.getElementById('res-aflossingdeel');
        const resTotaalrente = document.getElementById('res-totaalrente');
        const balkRente = document.getElementById('balk-rente');
        const balkAflossing = document.getElementById('balk-aflossing');
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
                // Zonder eigen toolId leidt reporting.js hem af uit het pad, en dat
                // is op de homepage leeg. Het bestand heette daardoor
                // "calculator-overzicht.pdf": de minst zeggende naam van alle zeven.
                toolId: 'bouwdepot-maandlast',
                toolTitle: 'Bouwdepot maandlast berekening',
                generatedAt: data.generatedAt,
                inputs: {
                    amount: data.amount,
                    mortgageType: data.mortgageType,
                    interestRate: data.interestRate,
                    durationYears: data.durationYears,
                    taxIndicationEnabled: data.taxIndicationEnabled,
                    geldverstrekker: data.geldverstrekker
                },
                // Staat de renteaftrek uit, dan is netto gelijk aan bruto en is het
                // voordeel nul. Drie regels die hetzelfde zeggen maken het overzicht
                // niet vollediger; ze suggereren alleen dat er iets is afgetrokken.
                results: data.taxIndicationEnabled
                    ? {
                        netMonthly: data.netMonthly,
                        grossMonthly: data.grossMonthly,
                        indicativeTaxBenefit: data.taxBenefit
                    }
                    : { grossMonthly: data.grossMonthly },
                // Zonder renteaftrek is er niets afgetrokken; "netto" zou dan hetzelfde
                // bedrag een onterecht gunstige naam geven.
                conclusion: data.taxIndicationEnabled
                    ? `Bij deze invoer geeft het bouwdepot een indicatieve netto maandlast van ${formatEuro(data.netMonthly)} per maand, na renteaftrek.`
                    : `Bij deze invoer geeft het bouwdepot een indicatieve bruto maandlast van ${formatEuro(data.netMonthly)} per maand.`,
                interpretation: data.verloopZin,
                assumptions: 'Maandlast op basis van bedrag, rente, hypotheekvorm en looptijd. De renteaftrekindicatie gebruikt maximaal 37,56%, vóór eigenwoningforfait en zonder persoonlijke aangiftegegevens. Voor waarderuimte en eigen geld staat een aparte berekening op leenruimte.html.'
            };
        }

        // Invoer die nergens op slaat mag niet stilzwijgend doorgerekend worden.
        // Met alleen `parseFloat(...) || 0` gaf een bedrag van -50.000 een
        // maandlast van "EUR -233" en een totale rente van "EUR -33.872": een
        // getal dat er precies zo uitziet als een echte uitkomst. Liever geen
        // antwoord met uitleg dan een onmogelijk antwoord zonder.
        // Elk veld heeft zijn eigen lezer, want de punt betekent er iets anders.
        // In een bedrag is hij duizendscheiding ("40.000" is veertigduizend); in
        // een rentepercentage is hij een decimaalteken ("3.80" is 3,8 procent).
        // Deze velden stonden op type="number", en daarin las de browser
        // "40.000" als veertig euro: een compleet en geloofwaardig antwoord op
        // een bedrag dat de bezoeker nooit heeft ingevuld, zonder melding.
        const GRENZEN = {
            'input-amount': {
                lezer: leesGetal,
                min: 0, max: 1000000, exclusiefNul: true,
                leeg: 'Vul het bedrag van uw bouwdepot in.',
                teLaag: 'Vul een bedrag boven de nul in.',
                teHoog: 'Boven een miljoen euro is geen bouwdepot meer; controleer het bedrag.',
            },
            'input-interest': {
                lezer: leesPercentage,
                min: 0, max: 20, exclusiefNul: false,
                leeg: 'Vul uw hypotheekrente in.',
                teLaag: 'Een rente onder de nul procent bestaat niet; vul een positief percentage in.',
                teHoog: 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.',
            },
        };

        /** Geeft de waarde terug, of null als het veld ongeldig is. */
        function leesVeld(veld) {
            const regels = GRENZEN[veld.id];
            const melding = document.getElementById(`fout-${veld.id.replace('input-', '')}`);
            const waarde = regels.lezer(veld.value);

            let fout = '';
            if (veld.value.trim() === '' || waarde === null) fout = regels.leeg;
            else if (waarde < regels.min || (regels.exclusiefNul && waarde === 0)) fout = regels.teLaag;
            else if (waarde > regels.max) fout = regels.teHoog;

            if (melding) melding.textContent = fout;
            veld.setAttribute('aria-invalid', fout ? 'true' : 'false');
            return fout ? null : waarde;
        }

        /** Zet de uitkomst terug op nul zolang de invoer niet klopt. */
        function toonGeenUitkomst() {
            const nul = formatEuro(0);
            [resNetto, resBruto, resRentedeel, resAflossingdeel, resTotaalrente].forEach((el) => {
                if (el) el.textContent = nul;
            });
            if (resConclusion) resConclusion.textContent = 'Pas uw invoer aan voor een indicatie.';
            if (btnDownload) delete btnDownload.dataset.report;
        }

        function calculate() {
            const type = inputType ? inputType.value : 'annuity';
            const years = parseInt(rangeDuration.value, 10) || 30;

            valDuration.textContent = `${years} Jaar`;

            const amount = leesVeld(inputAmount);
            const interest = leesVeld(inputInterest);
            if (amount === null || interest === null) {
                toonGeenUitkomst();
                return;
            }

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
            const taxRate = TAX_RULES_2026.maxMortgageDeductionRate; 
            const firstMonthInterest = amount * monthlyRate; 
            const taxBenefit = checkAftrek.checked ? (firstMonthInterest * taxRate) : 0;
            const netMonthly = grossMonthly - taxBenefit;

            // Waar de eerste maandlast uit bestaat, en wat de rente over de hele
            // looptijd kost. Bij lineair daalt de last elke maand, dus is de som
            // van de rente over het gemiddelde saldo.
            const aflossingsdeel = Math.max(0, grossMonthly - firstMonthInterest);
            const totaleRente = type === 'linear'
                ? monthlyRate * amount * (totalMonths + 1) / 2
                : grossMonthly * totalMonths - amount;

            // Wat het bedrag zelf niet zegt: hoe de last zich over de looptijd
            // ontwikkelt. Deze zin stond alleen op het scherm, terwijl hij juist
            // hoort bij een overzicht dat mee gaat naar een adviseur.
            // De zin moet bij het getal passen dat er staat, en dat is met de
            // renteaftrek aan een ander getal. Bruto blijft bij annuïteiten
            // gelijk; netto niet, want het rentedeel daalt en dus daalt de
            // aftrek mee. Wie hier "blijft gelijk" leest terwijl zijn netto last
            // over de looptijd stijgt, krijgt het omgekeerde van wat er gebeurt.
            const verloopZin = type === 'linear'
                ? 'Bij lineair is dit uw hoogste maand. De aflossing blijft gelijk, het rentedeel daalt, dus uw last wordt elke maand iets lager.'
                : checkAftrek?.checked
                    ? 'Bruto blijft dit bedrag de hele looptijd gelijk, maar netto niet: het rentedeel daalt, dus uw aftrek daalt mee en uw netto last loopt langzaam op.'
                    : 'Bij annuïteiten blijft dit bedrag de hele looptijd gelijk. Alleen de verhouding schuift: het rentedeel daalt, de aflossing stijgt.';

            const now = new Date();
            const reportData = buildHomepageReport({
                verloopZin,
                amount,
                mortgageType: mortgageTypeLabels[type] || type,
                interestRate: interest,
                durationYears: years,
                taxIndicationEnabled: checkAftrek.checked,
                geldverstrekker: huidigeBank()?.naam || 'Niet opgegeven',
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

            // --- Result highlight pulse ---
            resNetto.classList.remove('updating');
            void resNetto.offsetWidth;
            resNetto.classList.add('updating');
            setTimeout(() => resNetto.classList.remove('updating'), 500);

            if (summaryAmount) summaryAmount.textContent = formatEuro(reportData.inputs.amount);
            if (summaryType) summaryType.textContent = reportData.inputs.mortgageType;
            if (summaryInterest) summaryInterest.textContent = formatPercentage(reportData.inputs.interestRate);
            if (summaryDuration) summaryDuration.textContent = `${reportData.inputs.durationYears} jaar`;
            if (summaryTax) summaryTax.textContent = reportData.inputs.taxIndicationEnabled ? 'Max. 37,56% vóór EWF' : 'Uit';

            // Het label volgt de renteaftrek: staat die uit, dan is er niets
            // afgetrokken en is "netto" misleidend.
            if (uitkomstLabel) {
                uitkomstLabel.textContent = checkAftrek.checked
                    ? 'Netto maandlast na renteaftrek, eerste maand'
                    : 'Bruto maandlast, eerste maand';
            }
            // Zonder aftrek is de brutoregel gelijk aan het bedrag erboven.
            if (rowBruto) rowBruto.style.display = checkAftrek.checked ? '' : 'none';

            if (resRentedeel) resRentedeel.textContent = formatEuro(firstMonthInterest);
            if (resAflossingdeel) resAflossingdeel.textContent = formatEuro(aflossingsdeel);
            if (resTotaalrente) resTotaalrente.textContent = formatEuro(totaleRente);
            if (balkRente && balkAflossing && grossMonthly > 0) {
                const deel = (firstMonthInterest / grossMonthly) * 100;
                balkRente.style.width = deel.toFixed(1) + '%';
                balkAflossing.style.width = (100 - deel).toFixed(1) + '%';
            }

            // Dezelfde zin als in het gedownloade overzicht; hij stond hier
            // eerder apart, wat betekende dat scherm en document uit elkaar
            // konden lopen.
            if (resConclusion) resConclusion.textContent = verloopZin;
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
            // Hover staat in de stylesheet: een inline kleur volgt de donkere modus niet.
            rowVoordeel.classList.add('is-klikbaar');
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

        // De selectiestand staat in aria-pressed en niet in een eigen klasse.
        // Een eigen klasse betekent een eigen stukje CSS dat kan verdwijnen -- en
        // dat gebeurde ook: de styling voor .selected stond in main.css, die geen
        // pagina meer laadde, waardoor selecteren onzichtbaar werd. Het
        // ontwerpsysteem kent .ds-chip[aria-pressed="true"] al, en
        // schermlezers lezen de stand nu mee.
        const isGekozen = (btn) => btn.getAttribute('aria-pressed') === 'true';
        const zetGekozen = (btn, aan) => btn.setAttribute('aria-pressed', aan ? 'true' : 'false');

        function updateFromButtons() {
            let totalAddon = 0;
            let activeCount = 0;

            costBtns.forEach(btn => {
                if(isGekozen(btn)) {
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
                zetGekozen(btn, !isGekozen(btn));
                updateFromButtons();
            });
        });

        if(btnResetCosts) {
            btnResetCosts.addEventListener('click', () => {
                costBtns.forEach(b => zetGekozen(b, false));
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
                        costBtns.forEach((costBtn) => zetGekozen(costBtn, false));
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

        // De bankkeuze verandert de maandlast niet, maar hoort wel op het overzicht
        // dat de bezoeker meeneemt naar zijn adviseur.
        opBankwissel(() => { if (rangeAmount) calculate(); });

        // De haalbaarheidscheck zat hier als uitklapblok en woont nu op een eigen
        // pagina. Oude links met ?plan=haalbaarheid mogen niet stilletjes op een
        // pagina uitkomen waar dat blok niet meer bestaat.
        //
        // In productie vangt vercel.json dit al af met een 308, zodat Google er
        // geen crawlbeurt aan verspilt. Dit blijft staan voor de ontwikkelserver,
        // waar vercel.json niet geldt.
        if (new URLSearchParams(window.location.search).get('plan') === 'haalbaarheid') {
            const bedrag = Math.round(leesGetal(inputAmount.value) || 0);
            window.location.replace(bedrag > 0 ? `leenruimte.html?bedrag=${bedrag}` : 'leenruimte.html');
            return;
        }

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
                toolTitle: 'Maandlasten tijdens het bouwdepot',
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
            const mortgage = leesGetal(inputMortgage.value) || 0;
            const depot = leesGetal(inputDepot.value) || 0;
            const mortgageRate = leesPercentage(inputRate.value) || 0;
            const depotRate = leesPercentage(inputDepotRate.value) || 0;
            const months = parseInt(inputMonths.value, 10) || 1;
            const extraHousing = leesGetal(inputHousing.value) || 0;
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

            // De labels uit patternNames zijn werkwoordgroepen ("Gelijkmatig
            // opnemen"), en die kwamen als bijvoeglijk naamwoord vóór
            // "opnamepatroon" te staan: "Een gelijkmatig opnemen opnamepatroon".
            // In het overzicht dat iemand meeneemt naar zijn adviseur hoort dat
            // gewoon te lopen.
            const patroonZin = {
                even: 'U neemt gelijkmatig op',
                slow: 'U begint rustig en neemt later meer op',
                fast: 'U neemt in de eerste maanden snel op',
            }[pattern] || 'Bij het gekozen opnamepatroon';
            const interpretation = `De maandimpact is ${impactLabel}. ${patroonZin} over ${months} maanden; dat bepaalt hoe lang de maanddruk aanhoudt en hoeveel vergoeding u ontvangt.`;
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

        // Twee aanbieders publiceren de vergoeding als "gelijk aan je
        // hypotheekrente" en een derde als "1% lager"; bij ING is er geen. Die
        // niveaus kunnen wij invullen. Publiceert de aanbieder het niveau niet,
        // dan blijft staan wat de bezoeker zelf invulde: een schatting van ons
        // zou niet van een geverifieerd cijfer te onderscheiden zijn.
        const depotRateNote = document.getElementById('depot-rate-note');
        const depotRateNoteBasis = depotRateNote?.innerHTML;

        opBankwissel((bank) => {
            if (bank && inputDepotRate) {
                const tarief = vergoedingsTarief(bank, leesPercentage(inputRate?.value) || 0);
                if (tarief != null) inputDepotRate.value = tarief.toFixed(2);

                // Anders staat er een percentage dat van de vorige bank kwam en dat
                // net zo betrouwbaar lijkt als een cijfer dat we wel kunnen hard maken.
                if (depotRateNote) {
                    depotRateNote.innerHTML = tarief == null
                        ? `<strong>${bank.naam} publiceert niet hoe hoog de vergoeding is</strong>, alleen dat u die ontvangt. Vul hier het percentage uit uw eigen offerte in; wij vullen liever niets in dan een schatting.`
                        : depotRateNoteBasis;
                }
            }
            calculate();
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
                toolTitle: 'Dubbele lasten tijdens de nieuwbouw',
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
            const newBruto = leesGetal(inputNewBruto?.value) || 0;
            const newNetto = leesGetal(inputNewNetto?.value) || 0;
            const current = leesGetal(inputCurrent?.value) || 0;
            const extra = leesGetal(inputExtra?.value) || 0;
            const renteverlies = leesGetal(inputRenteverlies?.value) || 0;
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
        const inputModel = document.getElementById('input-renteverlies-model');
        const modelNote = document.getElementById('renteverlies-model-note');
        const inputPayoutMonths = document.getElementById('input-renteverlies-vergoedingsduur');
        const payoutNote = document.getElementById('renteverlies-duur-note');
        const veldPayout = document.getElementById('veld-vergoedingsduur');

        const resMortgage = document.getElementById('res-renteverlies-hypotheek');
        const resCompensation = document.getElementById('res-renteverlies-vergoeding');
        const resNet = document.getElementById('res-renteverlies-netto');
        const resMonth = document.getElementById('res-renteverlies-maand');
        const resConclusion = document.getElementById('res-renteverlies-conclusie');
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
        const sumPayout = document.getElementById('sum-renteverlies-payout');

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
                toolTitle: 'Renteverlies op het bouwdepot',
                generatedAt: data.generatedAt,
                inputs: {
                    depotAmount: data.depotAmount,
                    rekenmodel: data.rekenmodel,
                    mortgageRate: data.mortgageRate,
                    depotCompensationRate: data.depotCompensationRate,
                    months: data.months,
                    opnamePattern: data.opnamePattern
                },
                results: {
                    totalIndicativeRenteverlies: data.totalIndicativeRenteverlies,
                    averageMonthlyEffect: data.averageMonthlyEffect,
                    totalMortgageInterest: data.totalMortgageInterest,
                    totalCompensation: data.totalCompensation
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
            const depot = leesGetal(inputDepot.value) || 0;
            const mortgageRate = leesPercentage(inputMortgageRate.value) || 0;
            const depotRate = leesPercentage(inputDepotRate.value) || 0;
            const months = Math.min(36, Math.max(1, parseInt(inputMonths.value || '1', 10)));
            const pattern = inputPattern.value || 'even';

            inputMonths.value = months;
            if (rangeMonths) rangeMonths.value = months;

            // Twee rekenmodellen. Bij 'vergoeding' betaalt u hypotheekrente over het hele
            // depot en ontvangt u een vergoeding over het restsaldo; het verschil is het
            // renteverlies. Bij 'opname' betaalt u alleen rente over wat al is opgenomen,
            // waardoor stilstaand depotgeld niets kost en er dus geen renteverlies ontstaat.
            const model = inputModel && inputModel.value === 'opname' ? 'opname' : 'vergoeding';
            const monthlyMortgageRate = (mortgageRate / 100) / 12;
            const monthlyDepotRate = model === 'opname' ? 0 : (depotRate / 100) / 12;

            // De meeste vergeleken aanbieders stoppen de vergoeding voordat het
            // depot afloopt. Wie daarna nog geld in het depot heeft staan, betaalt wel
            // rente maar ontvangt niets meer terug. Dat is precies de periode waarin
            // het renteverlies oploopt, dus die mag niet buiten de berekening blijven.
            const payoutMonths = inputPayoutMonths
                ? Math.min(months, Math.max(0, parseInt(inputPayoutMonths.value || '0', 10)))
                : months;

            const weights = getWeights(months, pattern);
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;

            let remaining = depot;
            let withdrawn = 0;
            let totalCompensation = 0;
            let interestOnWithdrawn = 0;

            for (let i = 0; i < months; i += 1) {
                const monthlyWithdrawal = (depot * weights[i]) / totalWeight;
                const endBalance = Math.max(0, remaining - monthlyWithdrawal);
                const averageBalance = (remaining + endBalance) / 2;

                if (i < payoutMonths) totalCompensation += averageBalance * monthlyDepotRate;

                const endWithdrawn = Math.min(depot, withdrawn + monthlyWithdrawal);
                interestOnWithdrawn += ((withdrawn + endWithdrawn) / 2) * monthlyMortgageRate;

                remaining = endBalance;
                withdrawn = endWithdrawn;
            }

            const totalMortgageInterest = model === 'opname'
                ? interestOnWithdrawn
                : depot * monthlyMortgageRate * months;

            // Renteverlies is per definitie het nadeel van niet-opgenomen depotgeld.
            // In het opnamemodel bestaat dat nadeel niet, ongeacht de rentestand.
            const netDifference = model === 'opname' ? 0 : totalMortgageInterest - totalCompensation;
            const perMonth = netDifference / months;

            let conclusion;
            if (model === 'opname') {
                conclusion = `Bij dit rekenmodel betaalt u geen hypotheekrente over het deel dat nog in het depot staat. Daardoor ontstaat er geen renteverlies door stilstaand depotgeld: het verschil is € 0. De getoonde hypotheekrente van ${formatEuro(totalMortgageInterest)} is de rente over het bedrag dat u volgens dit opnamepatroon al had opgenomen, en die betaalt u hoe dan ook.`;
            } else if (netDifference < 0) {
                conclusion = `Bij dit scenario is de depotvergoeding hoger dan de hypotheekrente. Het verschil komt indicatief uit op ${formatEuro(netDifference)} over ${months} maanden.`;
            } else {
                conclusion = `Bij dit scenario is de depotvergoeding lager dan de hypotheekrente. Daardoor ontstaat een renteverschil van ongeveer ${formatEuro(netDifference)} over ${months} maanden.`;
            }

            // De maanden zonder vergoeding zijn het duurst: volle rente, niets terug.
            // Wie dat niet apart benoemd ziet, denkt dat het verschil gelijkmatig
            // over de hele bouwperiode ontstaat.
            const maandenZonder = months - payoutMonths;
            if (model !== 'opname' && maandenZonder > 0) {
                conclusion += ` Over de laatste ${maandenZonder} ${maandenZonder === 1 ? 'maand' : 'maanden'} betaalt u wel rente maar ontvangt u geen vergoeding meer; juist daar loopt het verschil op.`;
            }

            if (inputDepotRate) {
                inputDepotRate.disabled = model === 'opname';
                // .ds-veld is de wikkel in het nieuwe ontwerp; .input-group nog in de oude.
                const wrapper = inputDepotRate.closest('.ds-veld, .input-group');
                if (wrapper) wrapper.classList.toggle('input-group--uitgeschakeld', model === 'opname');
            }

            if (modelNote) {
                modelNote.textContent = model === 'opname'
                    ? 'In dit model betaalt u alleen rente over het opgenomen deel en ontvangt u geen depotvergoeding. Er is dan geen renteverlies. Wel blijft de depottermijn belangrijk: loopt die af, dan wordt het restant meestal op uw hypotheek afgelost.'
                    : 'In dit model betaalt u hypotheekrente over het volledige depot en ontvangt u een vergoeding over het deel dat nog niet is opgenomen. Het verschil daartussen is het renteverlies.';
                modelNote.classList.toggle('renteverlies-model-note--opname', model === 'opname');
            }

            const assumptions = model === 'opname'
                ? 'Indicatieve maandbenadering waarbij alleen rente wordt gerekend over het reeds opgenomen bedrag; werkelijke bankboekingen en opnamedata kunnen afwijken.'
                : `Indicatieve maandbenadering op basis van gekozen opnamepatroon, met vergoeding over de eerste ${payoutMonths} van de ${months} maanden; werkelijke bankboekingen en opnamedata kunnen afwijken.`;
            const now = new Date();

            if (veldPayout) veldPayout.hidden = model === 'opname';
            if (payoutNote) {
                payoutNote.textContent = model === 'opname'
                    ? 'In dit rekenmodel bestaat er geen depotvergoeding, dus ook geen vergoedingsduur.'
                    : maandenZonder > 0
                        ? `Vanaf maand ${payoutMonths + 1} ontvangt u geen vergoeding meer over wat er nog staat. Dat is ${maandenZonder} van uw ${months} maanden.`
                        : 'De vergoeding loopt in dit scenario door tot het einde van uw bouwperiode.';
            }

            if (patternNote) patternNote.textContent = patternDescriptions[pattern] || patternDescriptions.even;
            if (resMortgage) resMortgage.textContent = formatEuro(totalMortgageInterest);
            if (resCompensation) resCompensation.textContent = formatEuro(totalCompensation);
            if (resNet) resNet.textContent = formatEuro(netDifference);
            if (resMonth) resMonth.textContent = formatEuro(perMonth);
            if (resPeriodPattern) resPeriodPattern.textContent = `Over ${months} maanden, bij ${String(patternLabels[pattern] || pattern).toLowerCase()}.`;
            if (resConclusion) resConclusion.textContent = conclusion;
            if (resMethod) resMethod.textContent = assumptions;
            if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;

            if (sumDepot) sumDepot.textContent = formatEuro(depot);
            if (sumMortgageRate) sumMortgageRate.textContent = formatPercentage(mortgageRate);
            if (sumDepotRate) sumDepotRate.textContent = model === 'opname' ? 'Niet van toepassing' : formatPercentage(depotRate);
            if (sumMonths) sumMonths.textContent = `${months} maanden`;
            if (sumPattern) sumPattern.textContent = patternLabels[pattern] || pattern;
            if (sumPayout) sumPayout.textContent = model === 'opname' ? 'Niet van toepassing' : `${payoutMonths} maanden`;

            const report = buildRenteverliesReport({
                depotAmount: depot,
                mortgageRate,
                depotCompensationRate: model === 'opname' ? 0 : depotRate,
                rekenmodel: model === 'opname'
                    ? 'Alleen rente over het opgenomen deel, geen depotvergoeding'
                    : 'Rente over het hele depot, met vergoeding over het restsaldo',
                months,
                opnamePattern: patternLabels[pattern] || pattern,
                totalIndicativeRenteverlies: netDifference,
                averageMonthlyEffect: perMonth,
                totalMortgageInterest,
                totalCompensation,
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

        [inputDepot, inputMortgageRate, inputDepotRate, inputMonths, inputPayoutMonths].forEach((el) => {
            if (el) el.addEventListener('input', calculate);
        });

        if (inputPattern) inputPattern.addEventListener('change', calculate);
        if (inputModel) inputModel.addEventListener('change', calculate);

        // Wie zijn bank kiest, hoeft het rekenmodel en de vergoedingsduur niet zelf
        // op te zoeken; dat zijn juist de twee dingen die niemand uit zijn hoofd
        // weet en die de uitkomst het sterkst bepalen. Beide blijven daarna met de
        // hand aan te passen: de bezoeker kent zijn eigen offerte beter dan wij.
        opBankwissel((bank) => {
            if (!bank) return;
            if (inputModel) {
                inputModel.value = bank.vergoeding.model === 'rente-alleen-over-opgenomen' ? 'opname' : 'vergoeding';
            }
            const duur = bank.vergoeding.maanden.verbouw;
            if (inputPayoutMonths && typeof duur === 'number') inputPayoutMonths.value = duur;
            // Publiceert de aanbieder het vergoedingsniveau, dan vullen we het in;
            // anders blijft het percentage van de bezoeker staan.
            if (inputDepotRate) {
                const tarief = vergoedingsTarief(bank, leesPercentage(inputMortgageRate?.value) || 0);
                if (tarief != null) inputDepotRate.value = tarief.toFixed(2);
            }
            calculate();
        });

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


        /**
         * Het standaard termijnschema, meeschalend met de bouwduur.
         *
         * Deze vijf fasen stonden vast op maand 1, 3, 6, 9 en 12: een bouw van
         * een jaar. Zette je de bouwduur op 24 maanden, dan bleven de termijnen
         * staan en was het depot na twaalf maanden leeg. De helft van de bouw
         * werd dan doorgerekend met de volle annuiteit en nul depotvergoeding,
         * wat de piek fors overdreef -- juist in het scenario "lange bouwduur"
         * dat we zelf als voorbeeldknop aanbieden.
         *
         * Een aannemer factureert naar bouwvoortgang, dus schuiven de fasen mee
         * met de looptijd. De verdeling in procenten blijft gelijk; alleen het
         * moment verschuift.
         */
        const STANDAARD_FASEN = [
            { deelVanDeBouw: 1 / 12, percent: 15, desc: 'Ruwbouw begane grond' },
            { deelVanDeBouw: 3 / 12, percent: 20, desc: 'Ruwbouw verdiepingen' },
            { deelVanDeBouw: 6 / 12, percent: 20, desc: 'Dak & Gevelsluiting' },
            { deelVanDeBouw: 9 / 12, percent: 25, desc: 'Afbouw & Installaties' },
            { deelVanDeBouw: 12 / 12, percent: 20, desc: 'Oplevering' },
        ];

        const standaardTermijnen = (bouwduur) => STANDAARD_FASEN.map((fase) => ({
            month: Math.min(bouwduur, Math.max(1, Math.round(fase.deelVanDeBouw * bouwduur))),
            percent: fase.percent,
            desc: fase.desc,
        }));

        // Zodra de bezoeker het schema zelf aanpast, laten we het met rust. Zijn
        // eigen termijnen overschrijven omdat hij de bouwduur bijstelt is erger
        // dan een schema dat niet meer bij die duur past.
        let termijnenZelfIngesteld = false;

        const volgBouwduur = () => {
            if (termijnenZelfIngesteld) return;
            terms = standaardTermijnen(parseInt(inputBuildMonths?.value, 10) || 12);
            renderTerms();
        };

        let terms = standaardTermijnen(parseInt(inputBuildMonths?.value, 10) || 12);
        const formatPercentage = (value) => `${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

        function buildNieuwbouwReport(data) {
            return {
                toolTitle: 'Nieuwbouwplanning en piekmaand',
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
                // Het maandverloop stond alleen op het scherm, terwijl juist dat
                // het stuk is dat iemand meeneemt naar zijn adviseur of naast de
                // aannemingsovereenkomst legt.
                tables: [{
                    title: 'Maand voor maand',
                    columns: [
                        { key: 'maand', label: 'Mnd', type: 'text' },
                        { key: 'restantDepot', label: 'Restant depot', type: 'currency' },
                        { key: 'brutoLast', label: 'Bruto last', type: 'currency' },
                        { key: 'depotvergoeding', label: 'Depotvergoeding', type: 'currency' },
                        { key: 'naVergoeding', label: 'Na vergoeding', type: 'currency' },
                        { key: 'totaalMetWoonlast', label: 'Incl. woonlast', type: 'currency' },
                    ],
                    rows: data.maandregels || [],
                }],
                assumptions: 'Indicatieve nieuwbouwplanning op basis van vaste rente, bouwduur en ingevoerde termijnen. Werkelijke timing, declaraties en bankvoorwaarden kunnen afwijken.'
            };
        }

        function renderTerms() {
            termsContainer.innerHTML = '';
            let totalP = 0;
            const totalConstruction = leesGetal(inputConstruction.value) || 0;

            terms.forEach((term, index) => {
                totalP += term.percent;
                const euroAmount = Math.round((term.percent / 100) * totalConstruction);
                const row = document.createElement('div');
                row.className = 'term-row';
                // Elk veld krijgt een eigen naam met het rijnummer erin. De
                // kolomkoppen erboven vertellen het oog wat een kolom betekent,
                // maar een schermlezer springt van veld naar veld en hoorde
                // eerder alleen "invoerveld, 1".
                const nr = index + 1;
                row.innerHTML = `
                    <div><span class="term-veldnaam" aria-hidden="true">Maand</span><input type="number" min="1" max="36" value="${term.month}" data-idx="${index}" class="term-month-input term-trigger-sort" aria-label="Termijn ${nr}: in welke bouwmaand"></div>
                    <div><input type="text" value="${term.desc}" data-idx="${index}" class="term-desc-input term-trigger-desc" aria-label="Termijn ${nr}: omschrijving"></div>
                    <div class="input-icon-wrapper input-wrapper-euro"><span class="icon" aria-hidden="true">€</span><input type="text" inputmode="decimal" value="${toonGetal(euroAmount)}" data-idx="${index}" class="term-amount-input" aria-label="Termijn ${nr}: bedrag in euro"></div>
                    <div class="input-icon-wrapper input-wrapper-pct pct"><input type="text" inputmode="decimal" value="${toonGetal(parseFloat(term.percent.toFixed(2)), term.percent % 1 === 0 ? 0 : 1)}" data-idx="${index}" class="term-percent-input" aria-label="Termijn ${nr}: deel van de aanneemsom in procent"><span class="icon" aria-hidden="true">%</span></div>
                    <button type="button" class="btn-remove" data-idx="${index}" aria-label="Termijn ${nr} verwijderen" title="Termijn ${nr} verwijderen">×</button>
                `;
                termsContainer.appendChild(row);
            });
            bindRowEvents();
            werkTotaalBij();
        }

        /** Telt de percentages op en meldt wat er niet klopt aan het schema. */
        function werkTotaalBij() {
            // Status via een attribuut in plaats van een inline kleur: zo volgt de
            // opmaak het ontwerpsysteem en klopt hij ook in donkere modus.
            const totaal = Math.round(terms.reduce((som, t) => som + t.percent, 0) * 10) / 10;
            const wijktAf = Math.abs(totaal - 100) > 0.1;
            totalPercentEl.dataset.status = wijktAf ? 'afwijkend' : 'goed';
            totalPercentEl.textContent = wijktAf
                ? `${toonGetal(totaal, totaal % 1 === 0 ? 0 : 1)}% (moet 100% zijn)`
                : '100% toegewezen';
            return { totaal, wijktAf };
        }

        /**
         * Wat er mis is met het schema, in woorden voor de bezoeker.
         *
         * Zonder dit rekende de pagina gewoon door: bij 90% toegewezen stond er
         * nog steeds een piekbedrag, en een termijn ná het einde van de bouw gaf
         * helemaal geen signaal. Een half ingevuld schema hoort geen antwoord op
         * te leveren dat er hetzelfde uitziet als een goed antwoord.
         */
        function schemaKlachten() {
            const klachten = [];
            const { totaal, wijktAf } = werkTotaalBij();
            const alsPercentage = (waarde) => `${toonGetal(waarde, waarde % 1 === 0 ? 0 : 1)}%`;
            if (wijktAf) {
                const ontbreekt = Math.round((100 - totaal) * 10) / 10;
                klachten.push(totaal < 100
                    ? `De termijnen tellen op tot ${alsPercentage(totaal)} van de aanneemsom. Er ontbreekt nog ${alsPercentage(ontbreekt)}.`
                    : `De termijnen tellen op tot ${alsPercentage(totaal)} van de aanneemsom, dat is meer dan het geheel.`);
            }

            const bouwduur = parseInt(inputBuildMonths?.value, 10) || 12;
            const teLaat = terms.filter((t) => t.month > bouwduur);
            if (teLaat.length) {
                klachten.push(teLaat.length === 1
                    ? `Er staat een termijn in maand ${teLaat[0].month}, terwijl de bouw ${bouwduur} maanden duurt.`
                    : `Er staan ${teLaat.length} termijnen na maand ${bouwduur}, terwijl de bouw zo lang duurt.`);
            }
            return klachten;
        }

        function bindRowEvents() {
            document.querySelectorAll('.term-trigger-sort').forEach(el => {
                el.addEventListener('change', (e) => {
                    const idx = e.target.dataset.idx;
                    termijnenZelfIngesteld = true;
                    terms[idx].month = parseInt(e.target.value) || 1;
                    terms.sort((a, b) => a.month - b.month);
                    renderTerms(); calculate();
                });
            });
            document.querySelectorAll('.term-trigger-desc').forEach(el => el.addEventListener('input', (e) => terms[e.target.dataset.idx].desc = e.target.value));
            document.querySelectorAll('.btn-remove').forEach(el => el.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-remove');
                if(btn) { termijnenZelfIngesteld = true; terms.splice(btn.dataset.idx, 1); renderTerms(); calculate(); }
            }));
            // Bedrag en percentage zijn twee vensters op dezelfde waarde. Tijdens
            // het typen werken we alleen het model, het andere venster en de
            // totaalteller bij -- niet de hele lijst. Opnieuw tekenen zou de
            // opgemaakte waarde terugschrijven in het veld waarin iemand nog
            // bezig is, en dan springt de cursor weg bij elke toetsaanslag.
            // Pas als het veld de aandacht verliest, maken we het netjes op.
            const koppelVeld = (klasse, naarPercent) => {
                document.querySelectorAll(klasse).forEach((el) => {
                    el.addEventListener('input', (e) => {
                        termijnenZelfIngesteld = true;
                        const idx = e.target.dataset.idx;
                        // leesGetal in plaats van parseFloat: "87.500" is hier
                        // 87.500 euro en niet 87 euro 50.
                        terms[idx].percent = naarPercent(leesGetal(e.target.value) ?? 0);
                        werkTegenhangerBij(e.target, idx);
                        werkTotaalBij();
                        calculate();
                    });
                    el.addEventListener('change', () => renderTerms());
                });
            };

            const aanneemsom = () => leesGetal(inputConstruction.value) || 1;
            koppelVeld('.term-amount-input', (bedrag) => (bedrag / aanneemsom()) * 100);
            koppelVeld('.term-percent-input', (percent) => percent);
        }

        /** Werkt het veld bij dat dezelfde waarde anders uitdrukt. */
        function werkTegenhangerBij(bron, idx) {
            const rij = bron.closest('.term-row');
            if (!rij) return;
            const percent = terms[idx].percent;
            const totaal = leesGetal(inputConstruction.value) || 0;

            if (bron.classList.contains('term-amount-input')) {
                const veld = rij.querySelector('.term-percent-input');
                if (veld) veld.value = toonGetal(Math.round(percent * 10) / 10, percent % 1 === 0 ? 0 : 1);
            } else {
                const veld = rij.querySelector('.term-amount-input');
                if (veld) veld.value = toonGetal(Math.round((percent / 100) * totaal));
            }
        }

        addTermBtn.addEventListener('click', () => {
            termijnenZelfIngesteld = true;
            const lastMonth = terms.length > 0 ? terms[terms.length-1].month : 0;
            terms.push({ month: lastMonth + 1, percent: 0, desc: "Nieuwe fase" });
            renderTerms();
        });

        if (autoSpreadBtn) {
            autoSpreadBtn.addEventListener('click', () => {
                termijnenZelfIngesteld = true;
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
                    toggleTableBtn.textContent = 'Verberg maand-tot-maand overzicht';
                } else {
                    tableWrapper.style.display = 'none';
                    toggleTableBtn.textContent = 'Toon maand-tot-maand overzicht';
                }
            });
        }

        /** Zet de uitkomst op nul en zegt wat er aan het schema mankeert. */
        function toonGeenUitkomst(klachten) {
            const nul = formatEuro(0);
            [resPeakTotal, resAverageMonthly, resOverlapTotal, resExtraNow, resLoss].forEach((el) => {
                if (el) el.textContent = nul;
            });
            if (resPeakMonth) resPeakMonth.textContent = 'Nog geen piekmaand te bepalen';
            if (resConclusion) {
                resConclusion.dataset.status = 'afwijkend';
                resConclusion.textContent = klachten.join(' ') + ' Pas het termijnschema aan voor een uitkomst.';
            }
            if (btnDownload) delete btnDownload.dataset.report;
            const grafiek = document.getElementById('verloop-grafiek');
            if (grafiek) grafiek.innerHTML = '';
            if (tableBody) tableBody.innerHTML = '';
        }

        function calculate() {
            // Een schema dat niet klopt levert geen getal op. Eerder rekende de
            // pagina bij 90% toegewezen gewoon door, en dan staat er een
            // piekbedrag dat nergens op slaat.
            const klachten = schemaKlachten();
            if (klachten.length) {
                toonGeenUitkomst(klachten);
                return;
            }
            if (resConclusion) delete resConclusion.dataset.status;

            // Let op: hier staat bewust parseFloat en niet leesGetal. Dit zijn
            // `type="number"`-velden, en die geven hun waarde altijd canoniek
            // terug met een punt als decimaalteken -- "3.80" is hier 3,8 procent.
            // leesGetal leest een punt als duizendscheiding en maakte daar 380
            // procent van. Die parser hoort alleen op de vrije tekstvelden van
            // het termijnschema, waar de bezoeker zelf de notatie kiest.
            const landPrice = leesGetal(inputLand.value) || 0;
            const constructPrice = leesGetal(inputConstruction.value) || 0;
            const interest = leesPercentage(inputInterest.value) || 0;
            const discount = leesPercentage(inputDiscount.value) || 0;
            const buildMonths = parseInt(inputBuildMonths?.value, 10) || 12;
            const currentHousingCost = leesGetal(inputCurrentHousing?.value) || 0;

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
            let tableHTML = '';
            // Dezelfde regels als in de tabel op het scherm, maar als ruwe
            // getallen, zodat het overzicht ze kan meenemen naar de PDF.
            const maandregels = [];
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

                // Kleuren via klassen, niet inline: anders volgen ze de donkere modus niet.
                tableHTML += `<tr><td>${m}</td><td class="col-amount">${formatEuro(currentDepot)}</td><td class="col-amount col-gedempt">${formatEuro(fullAnnuity)}</td><td class="col-amount col-vergoeding">-${formatEuro(interestReceivable)}</td><td class="col-amount netto-column">${formatEuro(netPayment)}</td></tr>`;
                maandregels.push({
                    maand: m,
                    restantDepot: currentDepot,
                    brutoLast: fullAnnuity,
                    depotvergoeding: interestReceivable,
                    naVergoeding: netPayment,
                    totaalMetWoonlast: totalMonthlyWithCurrent,
                });
            }

            resTotalLoan.textContent = formatEuro(totalLoan);
            const startDepotInterest = constructPrice * depotRate;
            let startMonthly = fullAnnuity - startDepotInterest;
            if(startMonthly < 0) startMonthly = 0;
            resStartMonthly.textContent = formatEuro(startMonthly);
            resMaxMonthly.textContent = formatEuro(fullAnnuity);
            resLoss.textContent = formatEuro(totalLoss);
            if (resExtraNow) resExtraNow.textContent = formatEuro(Math.max(0, startMonthly));
            if (resPeakMonth) resPeakMonth.textContent = `Zwaarste maand: maand ${peakMonth} van de bouw`;
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
            // Stond eerder als "Uw nieuwbouwscenario voelt zwaar". Hoe een
            // scenario voelt is aan de bezoeker; deze site beschrijft wat er
            // rekenkundig gebeurt en velt geen oordeel over iemands situatie.
            const interpretation = `De piekdruk in dit scenario is ${pressureLabel}. Die wordt vooral bepaald door de combinatie van overlaplasten en het tempo waarin de bouwtermijnen vervallen.`;
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
                maandregels,
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
            
            // De staaf is elke maand even hoog -- dat is de volledige maandtermijn.
            // Wat schuift is de verhouding: het deel dat u zelf betaalt groeit
            // naarmate het depot leegloopt en de vergoeding verdwijnt.
            const eersteMaand = maandregels[0];
            const laatsteMaand = maandregels[maandregels.length - 1];
            tekenStaafgrafiek('verloop-grafiek', {
                regels: maandregels.map((r) => ({ onder: r.naVergoeding, boven: r.depotvergoeding })),
                eersteLabel: 'Mnd 1',
                laatsteLabel: `Mnd ${maandregels.length}`,
                piek: { index: peakMonth - 1, tekst: 'Zwaarste maand' },
                omschrijving: `Maandverloop over ${maandregels.length} maanden. Uw eigen last gaat van `
                    + `${formatEuro(eersteMaand.naVergoeding)} in maand 1 naar ${formatEuro(laatsteMaand.naVergoeding)} `
                    + `in maand ${maandregels.length}; de depotvergoeding daalt in dezelfde periode van `
                    + `${formatEuro(eersteMaand.depotvergoeding)} naar ${formatEuro(laatsteMaand.depotvergoeding)}.`,
            });
            if(tableBody) tableBody.innerHTML = tableHTML;
        }

        rangeLand.addEventListener('input', (e) => { inputLand.value = e.target.value; calculate(); });
        inputLand.addEventListener('input', (e) => { rangeLand.value = e.target.value; calculate(); });
        rangeConstruction.addEventListener('input', (e) => { inputConstruction.value = e.target.value; renderTerms(); calculate(); });
        inputConstruction.addEventListener('input', (e) => { rangeConstruction.value = e.target.value; renderTerms(); calculate(); });
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        inputDiscount.addEventListener('input', calculate);
        if(rangeBuildMonths) rangeBuildMonths.addEventListener('input', (e) => { inputBuildMonths.value = e.target.value; volgBouwduur(); calculate(); });
        if(inputBuildMonths) inputBuildMonths.addEventListener('input', (e) => { rangeBuildMonths.value = e.target.value; volgBouwduur(); calculate(); });
        if(inputCurrentHousing) inputCurrentHousing.addEventListener('input', calculate);
        document.querySelectorAll('.nieuwbouw-scenario-chip').forEach((button) => {
            button.addEventListener('click', () => {
                if (button.dataset.land) inputLand.value = button.dataset.land;
                if (button.dataset.construction) inputConstruction.value = button.dataset.construction;
                if (button.dataset.interest) inputInterest.value = button.dataset.interest;
                if (button.dataset.months) inputBuildMonths.value = button.dataset.months;
                if (button.dataset.housing) inputCurrentHousing.value = button.dataset.housing;
                if (button.dataset.discount) inputDiscount.value = button.dataset.discount;
                if (rangeLand) rangeLand.value = inputLand.value;
                if (rangeConstruction) rangeConstruction.value = inputConstruction.value;
                if (rangeInterest) rangeInterest.value = inputInterest.value;
                if (rangeBuildMonths) rangeBuildMonths.value = inputBuildMonths.value;
                volgBouwduur();
                calculate();
            });
        });

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

        const typeLabels = {
            annuity: 'Annuïteiten',
            linear: 'Lineair'
        };
        const formatPercentage = (value) => `${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

        function buildFiscalReport(data) {
            return {
                toolTitle: 'Belastingvoordeel en netto maandlast',
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
            const income = leesGetal(inputIncome.value) || 0;
            const amount = leesGetal(inputAmount.value) || 0;
            const interestPct = leesPercentage(inputInterest.value) || 0;
            const woz = leesGetal(inputWoz.value) || 0;
            
            let oneTimeCosts = 0;
            if(checkAdvice.checked) oneTimeCosts += parseFloat(checkAdvice.value);
            if(checkNotary.checked) oneTimeCosts += parseFloat(checkNotary.value);
            if(checkValuation.checked) oneTimeCosts += parseFloat(checkValuation.value);
            if(checkNhg.checked) oneTimeCosts += calculateNhgFee(amount); 

            const ewfYear = calculateEigenwoningforfait(woz);
            alertVillataks.style.display = woz > TAX_RULES_2026.highValueThreshold ? 'block' : 'none';

            const monthlyRate = (interestPct / 100) / 12;
            const totalMonths = 30 * 12;
            let currentDebt = amount;
            const linearRedemption = amount / totalMonths;
            const annuityPayment = (interestPct === 0) ? (amount/totalMonths) : (amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths))));

            // Dezelfde regels als in de tabel op het scherm, als ruwe getallen,
            // zodat de grafiek en het overzicht uit dezelfde bron putten.
            const jaarregels = [];
            
            let firstYearNetto = 0;
            let firstYearBruto = 0;
            let firstYearBenefit = 0;
            let lastYearNetto = 0;
            let firstYearDeductionBalance = 0;
            
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
                        currentDebt = Math.max(0, currentDebt - (annuityPayment - interestAmount));
                    } else {
                        monthlyPayment = interestAmount + linearRedemption;
                        currentDebt = Math.max(0, currentDebt - linearRedemption);
                    }
                    yearGrossPayment += monthlyPayment;
                }

                const homeDeductionBalance = calculateHomeDeductionBalance(yearInterest, ewfYear);
                const taxBenefit = calculateHomeTaxEffect(income, homeDeductionBalance);
                const yearNetto = yearGrossPayment - taxBenefit;

                jaarregels.push({
                    jaar: year,
                    bruto: yearGrossPayment / 12,
                    netto: yearNetto / 12,
                    voordeel: taxBenefit / 12,
                });
                
                tableHTML += `
                    <tr>
                        <td>${year}</td>
                        <td class="col-amount">${formatEuro(yearGrossPayment / 12)}</td>
                        <td class="col-amount col-vergoeding">${formatEuro(taxBenefit / 12)}</td>
                        <td class="col-amount netto-column">${formatEuro(yearNetto / 12)}</td>
                    </tr>
                `;

                if (year === 1) {
                    firstYearBruto = yearGrossPayment / 12;
                    firstYearNetto = yearNetto / 12;
                    firstYearBenefit = taxBenefit / 12;
                    firstYearDeductionBalance = homeDeductionBalance;
                }
                if (year === 30) lastYearNetto = yearNetto / 12;
            }

            const oneTimeBenefit = calculateHomeTaxEffect(income, oneTimeCosts);
            const effectiveRate = calculateEffectiveDeductionRate(income, Math.max(0, firstYearDeductionBalance));

            outTaxRate.textContent = effectiveRate > 0
                ? (effectiveRate * 100).toFixed(2).replace('.', ',') + '%'
                : 'n.v.t.';
            if(outHillenPct) outHillenPct.textContent = (TAX_RULES_2026.hillenDeductionRate * 100).toFixed(3).replace('.', ',') + '%';

            outBrutoMonth.textContent = formatEuro(firstYearBruto);
            outBenefitMonth.textContent = formatEuro(-firstYearBenefit);
            
            outNettoMonth.textContent = formatEuro(firstYearNetto);
            if (outNettoYear) outNettoYear.textContent = formatEuro(firstYearNetto * 12);
            if (txtTrend) txtTrend.textContent = `Stijgt naar ${formatEuro(lastYearNetto)} in jaar 30`;

            const benefitShare = firstYearBruto > 0 ? firstYearBenefit / firstYearBruto : 0;
            let interpretationLabel = 'beperkt';
            if (benefitShare >= 0.25) interpretationLabel = 'relevant';
            else if (benefitShare >= 0.12) interpretationLabel = 'merkbaar';

            const driver = firstYearDeductionBalance <= 0
                ? 'het eigenwoningforfait en de afbouw van de Hillen-aftrek'
                : (interestPct >= 4 ? 'de hypotheekrente' : 'de combinatie van inkomen, rente en WOZ');
            const taxDirection = firstYearBenefit >= 0 ? 'verlaging' : 'verhoging';
            const conclusion = `Bij deze invoer komt uw indicatieve netto maandlast in jaar 1 uit op ${formatEuro(firstYearNetto)} per maand, inclusief een geschatte fiscale ${taxDirection} van ${formatEuro(Math.abs(firstYearBenefit))}.`;
            const interpretation = `Het fiscale effect is ${interpretationLabel}; in dit scenario is ${driver} de belangrijkste aanjager van het bruto-netto verschil.`;
            const meaning = 'Gebruik dit als fiscale oriëntatie: heffingskortingen, fiscaal partnerschap, AOW-leeftijd, depotregels en uw volledige aangifte worden niet berekend.';
            const assumptions = 'De grafiek houdt de 2026-regels, het inkomen en de WOZ-waarde alle 30 jaren constant. Dit is een vergelijkingsscenario, geen voorspelling van toekomstige wetgeving of een persoonlijke aangifte-uitkomst.';

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

            // Netto onderop, het voordeel als lichter deel daarboven: samen de
            // bruto last. Het voordeel kan negatief zijn -- bij een hoge WOZ en een
            // klein leenbedrag is het eigenwoningforfait groter dan de aftrek, en
            // betaalt u per saldo meer dan bruto. Dan is er niets te stapelen en
            // toont de staaf gewoon het nettobedrag, dat dan hoger uitvalt.
            const eersteJaar = jaarregels[0];
            const laatsteJaar = jaarregels[jaarregels.length - 1];
            tekenStaafgrafiek('verloop-grafiek', {
                regels: jaarregels.map((r) => ({ onder: r.netto, boven: Math.max(0, r.voordeel) })),
                eersteLabel: 'Jaar 1',
                laatsteLabel: `Jaar ${jaarregels.length}`,
                omschrijving: `Verloop over ${jaarregels.length} jaar. Uw netto maandlast gaat van `
                    + `${formatEuro(eersteJaar.netto)} in jaar 1 naar ${formatEuro(laatsteJaar.netto)} in jaar ${jaarregels.length}; `
                    + `het belastingvoordeel gaat van ${formatEuro(eersteJaar.voordeel)} naar ${formatEuro(laatsteJaar.voordeel)} per maand.`,
            });
            if(tableBody) tableBody.innerHTML = tableHTML;
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
