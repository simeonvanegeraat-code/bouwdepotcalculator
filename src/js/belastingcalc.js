import { bindReportButton, startRekenpagina } from './rekenpagina.js';
import { leesGetal, leesPercentage, euro } from './getallen.js';
import { tekenStaafgrafiek } from './staafgrafiek.js';
import { annuiteitTermijn } from './annuiteit.js';
import { setMemoryLockById } from './shared-form-memory';
import {
    TAX_RULES_2026,
    calculateEffectiveDeductionRate,
    calculateEigenwoningforfait,
    calculateHomeDeductionBalance,
    calculateHomeTaxEffect,
    calculateNhgFee
} from './fiscal-rules.js';

/* 3. BELASTING CALCULATOR PRO (30 Jaar & Netto) */
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
        const annuityPayment = annuiteitTermijn(amount, monthlyRate, totalMonths);

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
                    <td class="bs-kolom-bedrag">${euro.format(yearGrossPayment / 12)}</td>
                    <td class="bs-kolom-bedrag bs-kolom-vergoeding">${euro.format(taxBenefit / 12)}</td>
                    <td class="bs-kolom-bedrag bs-kolom-netto">${euro.format(yearNetto / 12)}</td>
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

        outBrutoMonth.textContent = euro.format(firstYearBruto);
        outBenefitMonth.textContent = euro.format(-firstYearBenefit);
        
        outNettoMonth.textContent = euro.format(firstYearNetto);
        if (outNettoYear) outNettoYear.textContent = euro.format(firstYearNetto * 12);
        if (txtTrend) txtTrend.textContent = `Stijgt naar ${euro.format(lastYearNetto)} in jaar 30`;

        const benefitShare = firstYearBruto > 0 ? firstYearBenefit / firstYearBruto : 0;
        let interpretationLabel = 'beperkt';
        if (benefitShare >= 0.25) interpretationLabel = 'relevant';
        else if (benefitShare >= 0.12) interpretationLabel = 'merkbaar';

        const driver = firstYearDeductionBalance <= 0
            ? 'het eigenwoningforfait en de afbouw van de Hillen-aftrek'
            : (interestPct >= 4 ? 'de hypotheekrente' : 'de combinatie van inkomen, rente en WOZ');
        const taxDirection = firstYearBenefit >= 0 ? 'verlaging' : 'verhoging';
        const conclusion = `Bij deze invoer komt uw indicatieve netto maandlast in jaar 1 uit op ${euro.format(firstYearNetto)} per maand, inclusief een geschatte fiscale ${taxDirection} van ${euro.format(Math.abs(firstYearBenefit))}.`;
        const interpretation = `Het fiscale effect is ${interpretationLabel}; in dit scenario is ${driver} de belangrijkste aanjager van het bruto-netto verschil.`;
        const meaning = 'Gebruik dit als fiscale oriëntatie: heffingskortingen, fiscaal partnerschap, AOW-leeftijd, depotregels en uw volledige aangifte worden niet berekend.';
        const assumptions = 'De grafiek houdt de 2026-regels, het inkomen en de WOZ-waarde alle 30 jaren constant. Dit is een vergelijkingsscenario, geen voorspelling van toekomstige wetgeving of een persoonlijke aangifte-uitkomst.';

        if (outConclusion) outConclusion.textContent = conclusion;
        if (outInterpretation) outInterpretation.textContent = interpretation;
        if (outMeaning) outMeaning.textContent = meaning;
        if (outMethod) outMethod.textContent = assumptions;

        if (sumType) sumType.textContent = typeLabels[type] || type;
        if (sumIncome) sumIncome.textContent = euro.format(income);
        if (sumAmount) sumAmount.textContent = euro.format(amount);
        if (sumInterest) sumInterest.textContent = formatPercentage(interestPct);
        if (sumWoz) sumWoz.textContent = euro.format(woz);
        if (sumCosts) sumCosts.textContent = oneTimeCosts > 0 ? euro.format(oneTimeCosts) : 'Geen';

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
            outCostsBenefit.textContent = euro.format(oneTimeBenefit);
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
                + `${euro.format(eersteJaar.netto)} in jaar 1 naar ${euro.format(laatsteJaar.netto)} in jaar ${jaarregels.length}; `
                + `het belastingvoordeel gaat van ${euro.format(eersteJaar.voordeel)} naar ${euro.format(laatsteJaar.voordeel)} per maand.`,
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

startRekenpagina(initBelastingCalculator);
