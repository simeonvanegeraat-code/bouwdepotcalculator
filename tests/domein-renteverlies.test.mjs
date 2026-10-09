/**
 * De rekenkern van het renteverlies, nagerekend met de hand.
 *
 * Het rekenvoorbeeld is steeds 50.000 euro tegen 4% hypotheekrente over twaalf
 * maanden, gelijkmatig opgenomen. Het saldo loopt dan van 50.000 naar 0 en is
 * gemiddeld 25.000: de helft van de rente (1.000 van de 2.000) gaat over geld
 * dat nog stilstaat.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { berekenRenteverlies } from '../src/domain/renteverlies.js';

const bijna = (werkelijk, verwacht, marge = 0.005, uitleg = '') =>
    assert.ok(Math.abs(werkelijk - verwacht) <= marge, `${uitleg} verwacht ${verwacht}, kreeg ${werkelijk}`);

const basis = { depot: 50000, rentePercent: 4, vergoedingPercent: 3, maanden: 12, vergoedingMaanden: 12, patroon: 'gelijk', model: 'vergoeding' };

test('de rente valt uiteen in opgenomen en stilstaand geld', () => {
    const t = berekenRenteverlies(basis);
    bijna(t.rente, 2000, 1e-6);            // 50.000 x 4%
    bijna(t.renteStilstaand, 1000, 1e-6);  // over gemiddeld 25.000
    bijna(t.renteOpgenomen, 1000, 1e-6);
    bijna(t.gemiddeldInDepot, 0.5, 1e-9);
    assert.equal(t.regels.length, 12);
    assert.equal(t.regels.at(-1).saldo, 0);
});

test('een procentpunt lagere vergoeding: 1% over gemiddeld 25.000', () => {
    const t = berekenRenteverlies(basis);
    bijna(t.vergoeding, 750, 1e-6);        // 25.000 x 3%
    bijna(t.renteverlies, 250, 1e-6);      // 25.000 x (4% - 3%)
    bijna(t.perMaand, 250 / 12, 1e-6);
    bijna(t.doorLagerTarief, 250, 1e-6);
    assert.equal(t.doorGestopteVergoeding, 0);
    assert.equal(t.maandenZonderVergoeding, 0);
    // Wat je per saldo betaalt is rente min vergoeding.
    bijna(t.perSaldo, 2000 - 750, 1e-6);
});

test('vergoeding gelijk aan de hypotheekrente: stilstaand geld kost niets', () => {
    const t = berekenRenteverlies({ ...basis, vergoedingPercent: 4 });
    bijna(t.renteverlies, 0, 1e-9);
    // Je betaalt per saldo alleen de rente over wat je hebt opgenomen.
    bijna(t.perSaldo, 1000, 1e-6);
});

test('de vergoeding stopt na zes maanden: de tweede helft kost de volle rente', () => {
    const t = berekenRenteverlies({ ...basis, vergoedingMaanden: 6 });
    // Maand 1-6: saldo van 50.000 naar 25.000, gemiddeld 37.500.
    bijna(t.vergoeding, 37500 * 0.03 / 2, 1e-6);          // 562,50
    bijna(t.doorLagerTarief, 37500 * 0.01 / 2, 1e-6);     // 187,50
    // Maand 7-12: saldo van 25.000 naar 0, gemiddeld 12.500, niets terug.
    bijna(t.doorGestopteVergoeding, 12500 * 0.04 / 2, 1e-6);  // 250
    bijna(t.renteverlies, 437.5, 1e-6);
    assert.equal(t.maandenZonderVergoeding, 6);
    assert.ok(t.regels[5].vergoedingLoopt && !t.regels[6].vergoedingLoopt);
});

test('geen vergoeding: de hele rente over het stilstaande saldo is verlies', () => {
    bijna(berekenRenteverlies({ ...basis, vergoedingPercent: 0 }).renteverlies, 1000, 1e-6);
    bijna(berekenRenteverlies({ ...basis, vergoedingMaanden: 0 }).renteverlies, 1000, 1e-6);
});

test('het opnamemodel: geen rente over het saldo, dus geen renteverlies', () => {
    const t = berekenRenteverlies({ ...basis, model: 'opname' });
    assert.equal(t.renteverlies, 0);
    assert.equal(t.vergoeding, 0);
    assert.equal(t.renteStilstaand, 0);
    bijna(t.rente, 1000, 1e-6);       // alleen over wat is opgenomen
    bijna(t.perSaldo, 1000, 1e-6);
    assert.equal(t.maandenZonderVergoeding, 0);
    // Per saldo hetzelfde als een vergoeding gelijk aan de rente.
    bijna(t.perSaldo, berekenRenteverlies({ ...basis, vergoedingPercent: 4 }).perSaldo, 1e-9);
    assert.throws(() => berekenRenteverlies({ ...basis, model: 'onzin' }));
});

test('het opnamepatroon: later opnemen laat meer geld langer stilstaan', () => {
    // Drie maanden, gewichten 3-2-1: gemiddeld saldo 37.500, 16.666,67 en 4.166,67.
    const vroeg = berekenRenteverlies({ ...basis, maanden: 3, vergoedingMaanden: 3, patroon: 'vroeg' });
    bijna(vroeg.renteverlies, 58333.3333 * 0.01 / 12, 1e-3);
    // Het spiegelbeeld: 45.833,33, 33.333,33 en 12.500.
    const laat = berekenRenteverlies({ ...basis, maanden: 3, vergoedingMaanden: 3, patroon: 'laat' });
    bijna(laat.renteverlies, 91666.6667 * 0.01 / 12, 1e-3);
    assert.ok(laat.renteverlies > vroeg.renteverlies);
    // In het opnamemodel is het omgekeerd: vroeg opnemen kost meer rente.
    const o = (patroon) => berekenRenteverlies({ ...basis, model: 'opname', patroon }).rente;
    assert.ok(o('vroeg') > o('gelijk') && o('gelijk') > o('laat'));
});

test('een vergoeding boven de hypotheekrente geeft een negatief verlies', () => {
    const t = berekenRenteverlies({ ...basis, vergoedingPercent: 5 });
    bijna(t.renteverlies, -250, 1e-6);
});

test('een vergoedingsduur langer dan de bouw telt niet verder dan de bouw', () => {
    const t = berekenRenteverlies({ ...basis, vergoedingMaanden: 36 });
    assert.equal(t.invoer.vergoedingMaanden, 12);
    bijna(t.renteverlies, 250, 1e-6);
});

test('elke maandregel telt op', () => {
    const t = berekenRenteverlies({ ...basis, maanden: 18, vergoedingMaanden: 12, patroon: 'laat' });
    for (const x of t.regels) {
        bijna(x.rente, 50000 * 0.04 / 12, 1e-9, `maand ${x.maand}: de rente over het hele depot`);
        bijna(x.verlies, x.renteStilstaand - x.vergoeding, 1e-9);
        bijna(x.perSaldo, x.rente - x.vergoeding, 1e-9);
    }
    bijna(t.renteverlies, t.doorLagerTarief + t.doorGestopteVergoeding, 1e-9);
    bijna(t.rente, t.renteOpgenomen + t.renteStilstaand, 1e-9);
});

test('één maand en nul procent rente', () => {
    const kort = berekenRenteverlies({ ...basis, maanden: 1, vergoedingMaanden: 1 });
    bijna(kort.renteverlies, 25000 * 0.01 / 12, 1e-9);
    const nul = berekenRenteverlies({ ...basis, rentePercent: 0, vergoedingPercent: 0 });
    assert.equal(nul.renteverlies, 0);
    assert.equal(nul.rente, 0);
});
