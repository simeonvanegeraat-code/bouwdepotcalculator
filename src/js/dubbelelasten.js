import { bindReportButton, startRekenpagina } from './rekenpagina.js';
import { leesGetal, euro, maakVeldlezer } from './getallen.js';

/* 1C. DUBBELE LASTEN NIEUWBOUW CALCULATOR */
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

    // Vier van de zes velden mogen nul zijn: wie geen netto last weet laat dat
    // veld op nul staan, en niet iedereen heeft extra kosten of renteverlies.
    // Leeglaten mag niet, want dan is onduidelijk of er nul bedoeld is of dat
    // het veld nog ingevuld moet worden -- daar is de melding voor.
    const BEDRAG = (leeg, wat) => ({
        lezer: leesGetal, min: 0, max: 100000, exclusiefNul: false,
        leeg, teLaag: `Een ${wat} onder de nul bestaat niet.`,
        teHoog: 'Boven de honderdduizend euro per maand rekent deze tool niet.',
    });

    const GRENZEN = {
        'input-dubbel-new-bruto': {
            ...BEDRAG('Vul de bruto maandlast van uw nieuwe woning in.', 'maandlast'),
            exclusiefNul: true,
            teLaag: 'Vul een maandlast boven de nul in.',
        },
        'input-dubbel-new-netto': BEDRAG('Vul uw netto maandlast in, of nul als u die nog niet weet.', 'maandlast'),
        'input-dubbel-current': BEDRAG('Vul uw huidige woonlast in, of nul als u die niet heeft.', 'woonlast'),
        'input-dubbel-extra': BEDRAG('Vul uw extra kosten in, of nul als u die niet heeft.', 'kostenpost'),
        'input-dubbel-renteverlies': BEDRAG('Vul uw renteverlies in, of nul als u dat niet heeft.', 'renteverlies'),
        'input-dubbel-months': {
            lezer: leesGetal, min: 1, max: 36, exclusiefNul: true,
            leeg: 'Vul in hoeveel maanden de overlap duurt.',
            teLaag: 'Een overlapperiode begint bij één maand.',
            teHoog: 'Deze rekentool rekent met overlapperiodes tot 36 maanden.',
        },
    };

    const leesVeld = maakVeldlezer(GRENZEN);

    /** Zet de uitkomst op nul zolang de invoer niet klopt. */
    function toonGeenUitkomst() {
        const nul = euro.format(0);
        [resMonthly, resTotal, resPeak].forEach((el) => {
            if (el) el.textContent = nul;
        });
        if (resConclusion) resConclusion.textContent = 'Pas uw invoer aan voor een indicatie.';
        if (btnDownloadDubbel) delete btnDownloadDubbel.dataset.report;
    }

    function calculate() {
        const type = inputType?.value || 'huur';
        const newBruto = leesVeld(inputNewBruto);
        const newNetto = leesVeld(inputNewNetto);
        const current = leesVeld(inputCurrent);
        const extra = leesVeld(inputExtra);
        const renteverlies = leesVeld(inputRenteverlies);
        const months = leesVeld(inputMonths);
        if ([newBruto, newNetto, current, extra, renteverlies, months].some((v) => v === null)) {
            toonGeenUitkomst();
            return;
        }

        // De schuif volgt het veld, niet andersom.
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
        const conclusion = `Bij deze invoer komt uw tijdelijke dubbele maandlast indicatief uit op ${euro.format(totalMonthly)} per maand gedurende ${months} maanden.`;

        resNewBruto.textContent = euro.format(newBruto);
        resCurrent.textContent = euro.format(current);
        resExtra.textContent = euro.format(extra);
        resMonthly.textContent = euro.format(totalMonthly);
        resTotal.textContent = euro.format(totalPeriod);
        resPeak.textContent = euro.format(peakMonthly);
        if (resConclusion) resConclusion.textContent = conclusion;
        if (resInterpretation) resInterpretation.textContent = interpretation;
        if (resBudgetMeaning) resBudgetMeaning.textContent = budgetMeaning;
        if (resMethod) resMethod.textContent = 'Indicatieve overlapberekening met vaste maandbedragen; werkelijke bedragen kunnen per maand afwijken.';
        if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;

        if (newNetto > 0) {
            if (rowNewNetto) rowNewNetto.style.display = 'flex';
            resNewNetto.textContent = euro.format(newNetto);
        } else if (rowNewNetto) {
            rowNewNetto.style.display = 'none';
        }

        if (renteverlies > 0) {
            if (rowRenteverlies) rowRenteverlies.style.display = 'flex';
            resRenteverlies.textContent = euro.format(renteverlies);
        } else if (rowRenteverlies) {
            rowRenteverlies.style.display = 'none';
        }

        if (typeNote) {
            typeNote.textContent = type === 'koop'
                ? 'U combineert tijdelijk twee hypotheekachtige woonlasten.'
                : 'U combineert tijdelijke huur met de maandlast van uw nieuwe woning.';
        }

        if (sumType) sumType.textContent = typeLabels[type] || type;
        if (sumNewUsed) sumNewUsed.textContent = euro.format(usedNewMonthly);
        if (sumCurrent) sumCurrent.textContent = euro.format(current);
        if (sumExtra) sumExtra.textContent = euro.format(extra);
        if (sumRenteverlies) sumRenteverlies.textContent = renteverlies > 0 ? euro.format(renteverlies) : 'Niet ingevuld';
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

startRekenpagina(initDubbeleLastenNieuwbouwCalculator);
