import { bindReportButton, startRekenpagina } from './rekenpagina.js';
import { huidigeBank, opBankwissel } from './bankkeuze.js';
import { leesGetal, leesPercentage, euro } from './getallen.js';
import { annuiteitTermijn } from './annuiteit.js';
import { setMemoryLockById } from './shared-form-memory';
import {
    TAX_RULES_2026
} from './fiscal-rules.js';

/* 1. VERBOUW CALCULATOR (Homepage) */
function initVerbouwCalculator() {
    // De knop waar reporting.js het overzicht aan hangt. Stond in main.js in de
    // bovenste scope; hier hoort hij bij de pagina die hem heeft.
    const btnDownload = document.getElementById('btn-download');
    bindReportButton(btnDownload);

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
                ? `Bij deze invoer geeft het bouwdepot een indicatieve netto maandlast van ${euro.format(data.netMonthly)} per maand, na renteaftrek.`
                : `Bij deze invoer geeft het bouwdepot een indicatieve bruto maandlast van ${euro.format(data.netMonthly)} per maand.`,
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
        const nul = euro.format(0);
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
                grossMonthly = annuiteitTermijn(amount, monthlyRate, totalMonths);
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

        resBruto.textContent = euro.format(grossMonthly);
        
        if (checkAftrek.checked) {
            if(rowVoordeel) rowVoordeel.style.display = 'flex';
            resVoordeel.textContent = '-' + euro.format(taxBenefit);
        } else {
            if(rowVoordeel) rowVoordeel.style.display = 'none';
        }
        resNetto.textContent = euro.format(netMonthly);

        // --- Result highlight pulse ---
        resNetto.classList.remove('updating');
        void resNetto.offsetWidth;
        resNetto.classList.add('updating');
        setTimeout(() => resNetto.classList.remove('updating'), 500);

        if (summaryAmount) summaryAmount.textContent = euro.format(reportData.inputs.amount);
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

        if (resRentedeel) resRentedeel.textContent = euro.format(firstMonthInterest);
        if (resAflossingdeel) resAflossingdeel.textContent = euro.format(aflossingsdeel);
        if (resTotaalrente) resTotaalrente.textContent = euro.format(totaleRente);
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
        rowVoordeel.classList.add('bs-klikbaar');
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

startRekenpagina(initVerbouwCalculator);
