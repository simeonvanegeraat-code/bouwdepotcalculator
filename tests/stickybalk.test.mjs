/**
 * Bewaakt de twee regels waarmee de zwevende balk beslist wat hij toont.
 *
 * Aanleiding: de balk stond alleen op de homepage en was daar altijd zichtbaar.
 * Bij het uitrollen naar alle rekenpagina's bleek de depotplanner te openen met
 * "Kies uw geldverstrekker" en een streepje als bedrag. Een pil met een streepje
 * erin is ruis: hij dekt 66px van het scherm af en vertelt niets.
 *
 * De zichtbaarheid zelf hangt aan een IntersectionObserver en is in een
 * browserpaneel niet te toetsen; deze twee functies wel, en zij bepalen wat er
 * in de balk staat.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heeftUitkomst, kortLabel } from '../src/js/stickybalk.js';

test('een balk zonder uitkomst blijft weg', () => {
    for (const leeg of ['', '   ', '—', '-', '€ 0', '€0', '0', '0,00', '€ 0,00', '-0']) {
        assert.equal(heeftUitkomst(leeg), false, `"${leeg}" hoort geen uitkomst te zijn`);
    }
});

test('een echt bedrag laat de balk wel toe', () => {
    for (const bedrag of ['€ 116', '€ 1.204', '€ 66.000', '€ 0,50', '3,80%', '€ -250']) {
        assert.equal(heeftUitkomst(bedrag), true, `"${bedrag}" hoort een uitkomst te zijn`);
    }
});

test('het label wordt ingekort tot de naam voor de komma', () => {
    assert.equal(kortLabel('Bruto maandlast, eerste maand'), 'Bruto maandlast');
    assert.equal(kortLabel('Netto maandlast na renteaftrek, eerste maand'), 'Netto maandlast na renteaftrek');
    assert.equal(kortLabel('Maandlast na depotvergoeding'), 'Maandlast na depotvergoeding');
    assert.equal(kortLabel('  Totale verbouwkosten  '), 'Totale verbouwkosten');
    assert.equal(kortLabel(null), '');
});
