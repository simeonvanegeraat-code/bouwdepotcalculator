import { bindReportButton, startRekenpagina } from './rekenpagina.js';
import { opBankwissel, vergoedingsTarief } from './bankkeuze.js';
import { leesGetal, leesPercentage, euro } from './getallen.js';

/* 1D. RENTEVERLIES BOUWDEPOT CALCULATOR */
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
            conclusion = `Bij dit rekenmodel betaalt u geen hypotheekrente over het deel dat nog in het depot staat. Daardoor ontstaat er geen renteverlies door stilstaand depotgeld: het verschil is € 0. De getoonde hypotheekrente van ${euro.format(totalMortgageInterest)} is de rente over het bedrag dat u volgens dit opnamepatroon al had opgenomen, en die betaalt u hoe dan ook.`;
        } else if (netDifference < 0) {
            conclusion = `Bij dit scenario is de depotvergoeding hoger dan de hypotheekrente. Het verschil komt indicatief uit op ${euro.format(netDifference)} over ${months} maanden.`;
        } else {
            conclusion = `Bij dit scenario is de depotvergoeding lager dan de hypotheekrente. Daardoor ontstaat een renteverschil van ongeveer ${euro.format(netDifference)} over ${months} maanden.`;
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
            // Het veld zelf en niet zijn wikkel: die wikkel had een klasse
            // in het oude ontwerp en heeft er in dit ontwerp geen meer.
            inputDepotRate.classList.toggle('bs-uit', model === 'opname');
            const omhulsel = inputDepotRate.closest('.bs-omhulsel');
            if (omhulsel) omhulsel.classList.toggle('bs-uit', model === 'opname');
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
        if (resMortgage) resMortgage.textContent = euro.format(totalMortgageInterest);
        if (resCompensation) resCompensation.textContent = euro.format(totalCompensation);
        if (resNet) resNet.textContent = euro.format(netDifference);
        if (resMonth) resMonth.textContent = euro.format(perMonth);
        if (resPeriodPattern) resPeriodPattern.textContent = `Over ${months} maanden, bij ${String(patternLabels[pattern] || pattern).toLowerCase()}.`;
        if (resConclusion) resConclusion.textContent = conclusion;
        if (resMethod) resMethod.textContent = assumptions;
        if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;

        if (sumDepot) sumDepot.textContent = euro.format(depot);
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

startRekenpagina(initRenteverliesCalculator);
