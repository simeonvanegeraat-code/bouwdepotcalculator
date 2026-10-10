/**
 * De rekenkern van de dubbele lasten, nagerekend met de hand.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { berekenOverlap, MAANDEN_NA_OVERLAP } from '../src/domain/dubbelelasten.js';

test('de standaardinvoer: 1.100 huur, 1.550 nieuw, 100 extra, zes maanden', () => {
    const t = berekenOverlap();
    assert.equal(t.perMaand, 2750);          // 1.100 + 100 + 1.550
    assert.equal(t.bovenop, 1650);           // 1.550 + 100
    assert.equal(t.totaal, 16500);           // 2.750 x 6
    assert.equal(t.totaalBovenop, 9900);     // 1.650 x 6
    assert.equal(t.daarna, 1550);
    assert.equal(t.duur, 6);
    assert.equal(t.regels.length, 6 + MAANDEN_NA_OVERLAP);
});

test('de depotvergoeding gaat van de nieuwe last af, en vervalt na de overlap', () => {
    const t = berekenOverlap({ vergoeding: 400 });
    assert.equal(t.nieuwNaVergoeding, 1150);
    assert.equal(t.perMaand, 2350);          // 1.100 + 100 + 1.150
    assert.equal(t.bovenop, 1250);
    assert.equal(t.regels[0].nieuw, 1150);
    // Na de overlap is het depot leeg: de volle last.
    assert.equal(t.regels[6].nieuw, 1550);
    assert.equal(t.daarna, 1550);
    // Een vergoeding boven de last maakt de last nul, niet negatief.
    const veel = berekenOverlap({ vergoeding: 2000 });
    assert.equal(veel.nieuwNaVergoeding, 0);
    assert.equal(veel.perMaand, 1200);
});

test('de maandregels: tijdens de overlap alles, daarna alleen de nieuwe last', () => {
    const t = berekenOverlap();
    for (const r of t.regels.slice(0, 6)) {
        assert.equal(r.fase, 'overlap');
        assert.equal(r.totaal, 2750);
        assert.equal(r.huidig + r.extra + r.nieuw, r.totaal);
    }
    for (const r of t.regels.slice(6)) {
        assert.equal(r.fase, 'na');
        assert.equal(r.huidig, 0);
        assert.equal(r.extra, 0);
        assert.equal(r.totaal, 1550);
    }
    assert.equal(t.regels.slice(0, 6).reduce((s, r) => s + r.totaal, 0), t.totaal);
});

test('uitloop: de oude woning loopt langer door', () => {
    const t = berekenOverlap({ langer: 3 });
    assert.equal(t.duur, 9);
    assert.equal(t.totaal, 2750 * 9);
    // Drie maanden langer huur en extra lasten: 3 x 1.200.
    assert.equal(t.uitloopKost, 3600);
    assert.equal(t.regels[5].fase, 'overlap');
    assert.equal(t.regels[6].fase, 'uitloop');
    assert.equal(t.regels[8].fase, 'uitloop');
    assert.equal(t.regels[9].fase, 'na');
    // Het verschil met de basis over dezelfde maanden is precies de uitloopkost.
    const basis = berekenOverlap();
    const over9 = basis.totaal + 3 * basis.daarna;
    assert.equal(t.totaal - over9, t.uitloopKost);
});

test('nulgevallen', () => {
    // Geen huidige woonlast: er is geen dubbele last, alleen de nieuwe.
    const geen = berekenOverlap({ huidig: 0, extra: 0 });
    assert.equal(geen.perMaand, 1550);
    assert.equal(geen.bovenop, 1550);
    // Een maand overlap.
    const kort = berekenOverlap({ maanden: 1 });
    assert.equal(kort.totaal, 2750);
    assert.equal(kort.regels.length, 1 + MAANDEN_NA_OVERLAP);
    // Geen uitloop: geen uitloopkost.
    assert.equal(berekenOverlap().uitloopKost, 0);
});
