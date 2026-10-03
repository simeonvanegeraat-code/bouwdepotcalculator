/**
 * Bouwrentecalculator.
 *
 * Stond eerder als inline module in bouwrente-nieuwbouw.html. De rekenlogica is
 * ongewijzigd overgenomen; alleen de plek is veranderd, zodat de pagina geen
 * scriptblok meer bevat en de code testbaar is.
 */

// Telt vier mijlpalen, zonder ingevulde waarden. Zie meting.js.
import './meting.js';

import { leesGetal, leesPercentage, euro, koppelBedragvelden, koppelPercentagevelden, maakVeldlezer } from './getallen.js';


const amountInput = document.getElementById('input-amount');
const rateInput = document.getElementById('input-rate');
const monthsInput = document.getElementById('input-months');
const monthsRange = document.getElementById('range-months');
const financedInput = document.getElementById('input-financed');
const mortgageInput = document.getElementById('input-mortgage-rate');
const mortgageWrapper = document.getElementById('mortgage-wrapper');

// Pagina zonder deze calculator: niets te doen.
if (amountInput && rateInput && monthsInput && financedInput) {
    const resBase = document.getElementById('res-base');
    const resMonthly = document.getElementById('res-monthly');
    const resFinancing = document.getElementById('res-financing');
    const resTotal = document.getElementById('res-total');
    const resPeriodMonths = document.getElementById('res-period-months');
    const resultExplain = document.getElementById('result-explain');
    const resConclusion = document.getElementById('res-bouwrente-conclusion');
    const resInterpretation = document.getElementById('res-bouwrente-interpretation');
    const resCostMeaning = document.getElementById('res-bouwrente-cost-meaning');
    const reportGeneratedAt = document.getElementById('report-bouwrente-generated-at');
    const sumAmount = document.getElementById('sum-bouwrente-amount');
    const sumRate = document.getElementById('sum-bouwrente-rate');
    const sumMonths = document.getElementById('sum-bouwrente-months');
    const sumFinanced = document.getElementById('sum-bouwrente-financed');
    const sumMortgageRate = document.getElementById('sum-bouwrente-mortgage-rate');
    const btnDownload = document.getElementById('btn-download-bouwrente');

    const reportToolkit = window.BouwdepotReporting || null;
    if (btnDownload && reportToolkit?.registerReportButton) {
        reportToolkit.registerReportButton(btnDownload);
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const formatPercentage = (value) => `${Number(value).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

    function buildBouwrenteReport(data) {
        return {
            toolTitle: 'Bouwrente bij nieuwbouw',
            generatedAt: data.generatedAt,
            inputs: {
                amount: data.amount,
                rate: data.rate,
                months: data.months,
                financed: data.financed,
                mortgageRate: data.mortgageRate
            },
            results: {
                totalIndicativeBouwrente: data.base,
                averageMonthlyCost: data.monthly,
                financingImpact: data.financingImpact,
                totalIncludingFinancingImpact: data.total,
                interpretationLabel: data.interpretationLabel
            },
            conclusion: data.conclusion,
            // De volle zin staat al op het scherm; het rapport kreeg alleen het
            // kale label mee en maakte daar "De effectinschatting is beperkt" van.
            interpretation: data.interpretation,
            assumptions: data.assumptions
        };
    }

    function sync(input, range, min, max) {
        input.addEventListener('input', () => {
            const value = clamp(Number(input.value) || min, min, max);
            range.value = value;
            calculate();
        });
        range.addEventListener('input', () => {
            input.value = range.value;
            calculate();
        });
    }

    const GRENZEN = {
        'input-amount': {
            lezer: leesGetal, min: 0, max: 5000000, exclusiefNul: true,
            leeg: 'Vul de grondslag voor de bouwrente in.',
            teLaag: 'Vul een bedrag boven de nul in.',
            teHoog: 'Boven vijf miljoen euro rekent deze tool niet; controleer het bedrag.',
        },
        'input-rate': {
            lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
            leeg: 'Vul het bouwrentepercentage in.',
            teLaag: 'Een percentage onder de nul bestaat niet.',
            teHoog: 'Boven de 20 procent rekent geen enkele aanbieder bouwrente; controleer het percentage.',
        },
        'input-months': {
            lezer: leesGetal, min: 1, max: 36, exclusiefNul: true,
            leeg: 'Vul in over hoeveel maanden u bouwrente betaalt.',
            teLaag: 'Een periode begint bij één maand.',
            teHoog: 'Deze rekentool rekent met periodes tot 36 maanden.',
        },
        'input-mortgage-rate': {
            lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
            leeg: 'Vul uw hypotheekrente in.',
            teLaag: 'Een rente onder de nul procent bestaat niet; vul een positief percentage in.',
            teHoog: 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.',
        },
    };

    const leesVeld = maakVeldlezer(GRENZEN);

    /** Zet de uitkomst op nul zolang de invoer niet klopt. */
    function toonGeenUitkomst() {
        const nul = euro.format(0);
        [resBase, resMonthly, resFinancing, resTotal].forEach((el) => {
            if (el) el.textContent = nul;
        });
        if (resConclusion) resConclusion.textContent = 'Pas uw invoer aan voor een indicatie.';
        if (btnDownload) delete btnDownload.dataset.report;
    }

    function calculate() {
        const amount = leesVeld(amountInput);
        const rate = leesVeld(rateInput);
        const months = leesVeld(monthsInput);
        if ([amount, rate, months].some((v) => v === null)) {
            toonGeenUitkomst();
            return;
        }

        const base = amount * (rate / 100) * (months / 12);
        const monthly = base / months;

        let financingImpact = 0;
        const isFinanced = financedInput.value === 'ja';

        mortgageWrapper.style.display = isFinanced ? 'block' : 'none';

        if (isFinanced) {
            // Pas valideren als het veld ook zichtbaar is: wie niet meefinanciert
            // hoeft geen hypotheekrente in te vullen en mag er geen melding over
            // krijgen.
            const mortgageRate = leesVeld(mortgageInput);
            if (mortgageRate === null) {
                toonGeenUitkomst();
                return;
            }
            financingImpact = base * (mortgageRate / 100) * (months / 12);
            resultExplain.textContent = 'Basisbouwrente en financieringseffect zijn gescheiden weergegeven. Financieringseffect is indicatief berekend over dezelfde gekozen periode.';
        } else {
            resultExplain.textContent = 'Deze uitkomst is een indicatie op basis van een lineair jaarrentemodel over de gekozen maanden.';
        }

        const total = base + financingImpact;
        const amountDriven = amount >= 150000;
        const durationDriven = months >= 9;
        const mainDriver = durationDriven && !amountDriven ? 'de duur' : (amountDriven && !durationDriven ? 'het bedrag' : 'bedrag en duur');

        let interpretationLabel = 'beperkt';
        if (base >= 8000) interpretationLabel = 'fors';
        else if (base >= 3000) interpretationLabel = 'merkbaar';

        const conclusion = `Bij deze invoer komt de indicatieve bouwrente uit op ${euro.format(base)} over ${months} maanden.`;
        const interpretation = `De bouwrente-impact is ${interpretationLabel}; in dit scenario zijn ${mainDriver} de belangrijkste kostenaanjagers.`;
        const costMeaning = months >= 9
            ? 'Door de langere periode telt deze kostenpost stevig mee in uw nieuwbouwbudget, ook als de maandlast op zichzelf meevalt.'
            : 'Dit is vooral een tijdelijke projectkost; neem het expliciet mee in uw reservering zodat het geen verrassing wordt.';
        const assumptions = isFinanced
            ? 'Indicatieve lineaire berekening van bouwrente plus extra rentelast bij meefinancieren over dezelfde periode.'
            : 'Indicatieve lineaire berekening van bouwrente over bedrag, percentage en gekozen periode.';
        const now = new Date();

        resBase.textContent = euro.format(base);
        resMonthly.textContent = euro.format(monthly);
        resFinancing.textContent = isFinanced ? euro.format(financingImpact) : '€ 0';
        resTotal.textContent = euro.format(total);
        if (resPeriodMonths) resPeriodMonths.textContent = `${months} maanden`;
        if (resConclusion) resConclusion.textContent = conclusion;
        if (resInterpretation) resInterpretation.textContent = interpretation;
        if (resCostMeaning) resCostMeaning.textContent = costMeaning;
        if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(now)}.`;
        if (sumAmount) sumAmount.textContent = euro.format(amount);
        if (sumRate) sumRate.textContent = formatPercentage(rate);
        if (sumMonths) sumMonths.textContent = `${months} maanden`;
        if (sumFinanced) sumFinanced.textContent = isFinanced ? 'Ja' : 'Nee';
        if (sumMortgageRate) sumMortgageRate.textContent = isFinanced ? formatPercentage(mortgageInput.value || 0) : 'Niet gebruikt';

        const report = buildBouwrenteReport({
            amount,
            rate,
            months,
            financed: isFinanced,
            mortgageRate: isFinanced ? (Math.max(0, leesPercentage(mortgageInput.value) || 0)) : null,
            base,
            monthly,
            // Wie niet meefinanciert heeft geen financieringseffect, en dan is
            // "Effect van meefinancieren € 0" geen ontbrekend gegeven maar een
            // antwoord op een vraag die niet speelde. Het totaal is dan gelijk
            // aan de basis, dus die regel zegt hetzelfde nog een keer.
            financingImpact: isFinanced ? financingImpact : null,
            total: isFinanced ? total : null,
            interpretationLabel,
            interpretation,
            conclusion,
            assumptions,
            generatedAt: now.toISOString()
        });
        if (btnDownload) btnDownload.dataset.report = JSON.stringify(report);
    }

    // Bedrag en rente hebben geen schuif meer: je typt ze. calculate() klemt
    // de waarde zelf al, dus er gaat geen controle verloren.
    amountInput.addEventListener('input', calculate);
    rateInput.addEventListener('input', calculate);
    sync(monthsInput, monthsRange, 1, 36);

    financedInput.addEventListener('change', calculate);
    mortgageInput.addEventListener('input', calculate);
    document.querySelectorAll('.bouwrente-preset').forEach((btn) => {
        btn.addEventListener('click', () => {
            const presetAmount = Number(btn.dataset.amount);
            const presetMonths = Number(btn.dataset.months);

            amountInput.value = presetAmount;
            monthsInput.value = presetMonths;
            monthsRange.value = clamp(presetMonths, Number(monthsRange.min), Number(monthsRange.max));
            calculate();
        });
    });

    calculate();
}

// Bedragvelden in Nederlandse notatie. Staat helemaal onderaan omdat de module
// hierboven zijn velden vult met onthouden waarden; pas daarna is er iets op te
// maken.
koppelBedragvelden();
koppelPercentagevelden();
