/**
 * Bewaakt dat invoervelden getallen lezen zoals Nederlanders ze schrijven.
 *
 * Aanleiding: het bedragveld van het termijnschema was een `input type="number"`.
 * Van de vijf manieren waarop iemand "87.500 euro" intypt werkte er precies een.
 * De andere vier maakten de regel stilzwijgend nul, waarna het totaal op 75%
 * stond en de piekmaandlast van EUR 3.530 naar EUR 3.253 zakte -- een fout
 * antwoord, met dezelfde stelligheid gepresenteerd als een goed antwoord.
 *
 * Deze test faalt zodra een van die schrijfwijzen weer verkeerd gelezen wordt.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {leesGetal, toonGetal, leesPercentage } from '../src/js/getallen.js';

test('leest de schrijfwijzen waarmee mensen bedragen intypen', () => {
    const verwacht = 87500;
    for (const invoer of ['87500', '87.500', '87 500', '€ 87.500', '€87500', ' 87.500 ']) {
        assert.equal(leesGetal(invoer), verwacht, `"${invoer}" hoort ${verwacht} te zijn`);
    }
});

test('de komma is het decimaalteken, de punt de duizendscheiding', () => {
    assert.equal(leesGetal('87500,50'), 87500.5);
    assert.equal(leesGetal('1.250,75'), 1250.75);
    // Bewuste keuze: in een veld voor bouwtermijnen is een punt duizendtallen.
    assert.equal(leesGetal('87.5'), 875);
});

test('geeft null terug als er geen getal in staat', () => {
    for (const invoer of ['', '   ', 'abc', '€', null, undefined, '-']) {
        assert.equal(leesGetal(invoer), null, `"${invoer}" hoort null te zijn`);
    }
});

test('laat getallen door die al een getal zijn', () => {
    assert.equal(leesGetal(87500), 87500);
    assert.equal(leesGetal(0), 0);
    assert.equal(leesGetal(NaN), null);
});

test('toont bedragen met de Nederlandse duizendscheiding', () => {
    assert.equal(toonGetal(87500), '87.500');
    assert.equal(toonGetal(1250.75, 2), '1.250,75');
    assert.equal(toonGetal(0), '0');
});

/**
 * leesPercentage bestaat naast leesGetal omdat de punt in de twee soorten
 * velden iets anders betekent. In een bedrag van tienduizenden euro's is een
 * punt duizendscheiding; in een rentepercentage tussen nul en twintig kan hij
 * niets anders zijn dan een decimaalteken.
 *
 * Dat onderscheid is geen theorie: bij een eerdere ronde is leesGetal op de
 * rentevelden losgelaten, waarna "3.80" als 380 procent werd gelezen en de
 * piekmaandlast op de nieuwbouwpagina naar 159.533 euro schoot.
 */
test('leesPercentage leest komma en punt allebei als decimaalteken', () => {
    assert.equal(leesPercentage('3,8'), 3.8);
    assert.equal(leesPercentage('3.8'), 3.8);
    assert.equal(leesPercentage('3.80'), 3.8);
    assert.equal(leesPercentage('0,5'), 0.5);
    assert.equal(leesPercentage('4'), 4);
});

test('leesPercentage negeert het procentteken en spaties', () => {
    assert.equal(leesPercentage('3,8 %'), 3.8);
    assert.equal(leesPercentage(' 4 '), 4);
});

test('leesPercentage geeft null bij niets bruikbaars', () => {
    assert.equal(leesPercentage(''), null);
    assert.equal(leesPercentage('abc'), null);
    assert.equal(leesPercentage(null), null);
    assert.equal(leesPercentage(undefined), null);
});

test('de twee lezers verschillen juist waar het misgaat', () => {
    // Dit is de hele reden dat er twee zijn.
    assert.equal(leesGetal('3.80'), 380);
    assert.equal(leesPercentage('3.80'), 3.8);
});
