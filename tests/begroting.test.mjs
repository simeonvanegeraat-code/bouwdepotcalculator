/**
 * Bewaakt de rekenkern van de verbouwbegroting.
 *
 * Deze pagina had als enige datastroom geen enkele test, terwijl de splitsing
 * tussen depot en eigen geld het hele product is: wie hier een post aan de
 * verkeerde kant zet, denkt dat de bank iets betaalt wat hij zelf moet
 * meebrengen. Dat merk je pas bij de afwijzing.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berekenBegroting } from '../src/js/begrotingrekenen.js';

const posten = [
    { bedrag: 20000, vast: true, prioriteit: 'noodzakelijk' },   // keuken
    { bedrag: 5000, vast: false, prioriteit: 'noodzakelijk' },   // losse apparatuur
    { bedrag: 12000, vast: true, prioriteit: 'gewenst' },        // badkamer
];

test('splitst wat vast aan de woning zit van wat de bezoeker zelf betaalt', () => {
    const r = berekenBegroting(posten, 0);
    assert.equal(r.depot, 32000);
    assert.equal(r.eigen, 5000);
    assert.equal(r.aantal, 3);
});

test('splitst noodzakelijk en gewenst los van de depotvraag', () => {
    const r = berekenBegroting(posten, 0);
    // Dezelfde bedragen, andere as: 20.000 + 5.000 noodzakelijk, 12.000 gewenst.
    assert.equal(r.noodzakelijk, 25000);
    assert.equal(r.gewenst, 12000);
});

test('rekent de reserve over het depotdeel, niet over het geheel', () => {
    const r = berekenBegroting(posten, 10);
    // 10% van 32.000, niet van 37.000: losse apparatuur komt niet uit het depot.
    assert.equal(r.margeBedrag, 3200);
    assert.equal(r.depotMetMarge, 35200);
    assert.equal(r.totaal, 40200);
});

test('de drie delen samen vormen het totaal', () => {
    const r = berekenBegroting(posten, 10);
    assert.equal(r.noodzakelijk + r.gewenst + r.margeBedrag, r.totaal);
});

test('telt lege, nul en negatieve posten niet mee', () => {
    const r = berekenBegroting([
        { bedrag: 0, vast: true, prioriteit: 'noodzakelijk' },
        { bedrag: -5000, vast: true, prioriteit: 'noodzakelijk' },
        { bedrag: null, vast: true, prioriteit: 'noodzakelijk' },
        { bedrag: 10000, vast: true, prioriteit: 'noodzakelijk' },
    ], 0);
    assert.equal(r.aantal, 1);
    assert.equal(r.depot, 10000);
});

test('zonder posten is alles nul', () => {
    const r = berekenBegroting([], 10);
    assert.deepEqual(
        { totaal: r.totaal, depot: r.depot, eigen: r.eigen, margeBedrag: r.margeBedrag, aantal: r.aantal },
        { totaal: 0, depot: 0, eigen: 0, margeBedrag: 0, aantal: 0 },
    );
});

test('een post zonder prioriteit geldt als noodzakelijk', () => {
    // Zo staat de keuzelijst ook standaard; anders zou een ongewijzigde post
    // stilletjes bij "gewenst" belanden en als eerste sneuvelen bij schrappen.
    const r = berekenBegroting([{ bedrag: 8000, vast: true }], 0);
    assert.equal(r.noodzakelijk, 8000);
    assert.equal(r.gewenst, 0);
});
