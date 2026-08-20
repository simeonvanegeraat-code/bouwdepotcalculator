/**
 * Bewaakt de rekenkern van het declaratieplan.
 *
 * Hier komen datums uit waar iemand zijn planning op baseert: wanneer moet een
 * factuur uiterlijk ingediend zijn om nog uitbetaald te worden. Een fout van een
 * paar dagen betekent dat het geld op de lening wordt afgelost in plaats van
 * uitbetaald. Dat rechtvaardigt tests op de randen.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { werkdagenTerug, maakPlan } from '../src/js/declaratieplan.js';

const datum = (j, m, d) => new Date(j, m - 1, d);
// Niet toISOString: die rekent naar UTC en levert in onze tijdzone de dag
// ervoor op. Precies de valstrik die op de pagina zelf ook zat.
const alsTekst = (d) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

test('telt werkdagen terug en slaat weekenden over', () => {
    // Donderdag 19 augustus 2027; vijf werkdagen terug is donderdag 12 augustus.
    assert.equal(alsTekst(werkdagenTerug(datum(2027, 8, 19), 5)), '2027-08-12');
    // Maandag terug over een weekend heen: 3 werkdagen voor maandag 16 augustus
    // is woensdag 11 augustus.
    assert.equal(alsTekst(werkdagenTerug(datum(2027, 8, 16), 3)), '2027-08-11');
    // Nul werkdagen betekent: dezelfde dag, zoals bij een bank waar u zelf
    // rechtstreeks uit het depot betaalt.
    assert.equal(alsTekst(werkdagenTerug(datum(2027, 8, 19), 0)), '2027-08-19');
});

test('de uiterste indiendatum ligt voor de einddatum', () => {
    const plan = maakPlan({ einde: datum(2027, 8, 19), werkdagen: 5, saldo: 50000, posten: [] });
    assert.equal(alsTekst(plan.uiterste), '2027-08-12');
});

test('geen doorlooptijd betekent geen datum, geen schatting', () => {
    const plan = maakPlan({ einde: datum(2027, 8, 19), werkdagen: null, saldo: 50000, posten: [] });
    assert.equal(plan.uiterste, null);
});

test('telt de posten op en benoemt wat er niet belegd is', () => {
    const plan = maakPlan({
        einde: datum(2027, 8, 19), werkdagen: 5, saldo: 50000,
        posten: [
            { omschrijving: 'Keuken', bedrag: 18000, maand: '2027-03' },
            { omschrijving: 'Badkamer', bedrag: 12000, maand: '2027-05' },
        ],
    });
    assert.equal(plan.totaalPosten, 30000);
    assert.equal(plan.nietBelegd, 20000);
    assert.equal(plan.tekort, 0);
});

test('meldt een tekort als er meer gepland is dan er in het depot zit', () => {
    const plan = maakPlan({
        einde: datum(2027, 8, 19), werkdagen: 5, saldo: 20000,
        posten: [{ omschrijving: 'Uitbouw', bedrag: 35000, maand: '2027-03' }],
    });
    assert.equal(plan.tekort, 15000);
    assert.equal(plan.nietBelegd, 0);
});

test('markeert een post die na de uiterste indiendatum valt', () => {
    const plan = maakPlan({
        einde: datum(2027, 8, 19), werkdagen: 5, saldo: 50000,
        posten: [
            { omschrijving: 'Op tijd', bedrag: 1000, maand: '2027-06' },
            { omschrijving: 'Te laat', bedrag: 1000, maand: '2027-09' },
        ],
    });
    assert.equal(plan.teLaat, 1);
    assert.equal(plan.regels[0].teLaat, false);
    assert.equal(plan.regels[1].teLaat, true);
});

test('een post in de maand van de uiterste datum telt naar het einde van die maand', () => {
    // Uiterste datum 12 augustus; een post "augustus" loopt tot 31 augustus en
    // is dus te laat. Dat hoort zichtbaar te zijn, niet weggerond.
    const plan = maakPlan({
        einde: datum(2027, 8, 19), werkdagen: 5, saldo: 50000,
        posten: [{ omschrijving: 'Augustus', bedrag: 1000, maand: '2027-08' }],
    });
    assert.equal(plan.regels[0].teLaat, true);
});

test('negeert lege regels en rekent zonder maand gewoon door', () => {
    const plan = maakPlan({
        einde: datum(2027, 8, 19), werkdagen: 5, saldo: 50000,
        posten: [
            { omschrijving: '', bedrag: 0, maand: '' },
            { omschrijving: 'Tuin', bedrag: 8000, maand: '' },
        ],
    });
    assert.equal(plan.regels.length, 1);
    assert.equal(plan.regels[0].verwacht, null);
    assert.equal(plan.regels[0].teLaat, false);
    assert.equal(plan.totaalPosten, 8000);
});
