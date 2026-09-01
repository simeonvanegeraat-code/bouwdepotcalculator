import { bindReportButton, startRekenpagina } from './rekenpagina.js';
import { opBankwissel, vergoedingsTarief } from './bankkeuze.js';
import { leesGetal, leesPercentage, euro } from './getallen.js';

/* 1B. MAANDLASTEN BOUWDEPOT CALCULATOR */
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
            conclusion: `Bij deze invoer komt uw bouwdepotfase indicatief uit op ${euro.format(data.netMonthly)} netto per maand over ${data.durationMonths} maanden.`,
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

        resGross.textContent = euro.format(grossMonthly);
        resComp.textContent = '-' + euro.format(monthlyCompensation);
        resNet.textContent = euro.format(netMonthly);
        resPeriod.textContent = euro.format(periodTotal);
        assumptionText.textContent = patternLabels[pattern];
        if (resConclusion) resConclusion.textContent = report.conclusion;
        if (resInterpretation) resInterpretation.textContent = report.interpretation;
        if (resMethod) resMethod.textContent = report.assumptions;
        if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;

        if (summaryMortgage) summaryMortgage.textContent = euro.format(report.inputs.totalMortgage);
        if (summaryDepot) summaryDepot.textContent = euro.format(report.inputs.depotAmount);
        if (summaryRate) summaryRate.textContent = formatPercentage(report.inputs.mortgageRate);
        if (summaryDepotRate) summaryDepotRate.textContent = formatPercentage(report.inputs.depotCompensationRate);
        if (summaryDuration) summaryDuration.textContent = `${report.inputs.durationMonths} maanden`;
        if (summaryPattern) summaryPattern.textContent = report.inputs.opnamePattern;
        if (summaryExtra) summaryExtra.textContent = report.inputs.extraHousingCost > 0 ? euro.format(report.inputs.extraHousingCost) : 'Niet ingevuld';

        if (extraHousing > 0) {
            if (resDoubleRow) resDoubleRow.style.display = 'flex';
            resDouble.textContent = euro.format(doubleBurden);
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

startRekenpagina(initMaandlastenBouwdepotCalculator);
