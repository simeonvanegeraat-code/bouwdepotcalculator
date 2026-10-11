/**
 * De verdieping op de aanbiederpagina's (scripts/aanbieder-verdieping.mjs),
 * met de hand nagerekend tegen de dataset.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { stilstaandGeld, openVragen, VOORBEELD } from '../scripts/aanbieder-verdieping.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));
const van = (id) => data.aanbieders.find((a) => a.id === id);

test('het rekenvoorbeeld: 10.000 euro tegen 4 procent is 33 euro per maand', () => {
    // 10.000 x 4% = 400 per jaar, / 12 = 33,33. Eén procentpunt: 100 / 12 = 8,33.
    assert.deepEqual(VOORBEELD, { rentePercent: 4, bedrag: 10000 });
    const nn = stilstaandGeld(van('nn'), 'verbouw');
    assert.deepEqual(nn.perioden.map((p) => [p.van, p.tot, p.bedrag]), [[1, 12, 8], [13, 24, 33]]);
});

test('Nationale-Nederlanden: bij nieuwbouw is de vergoeding gelijk aan de rente, tot ze stopt', () => {
    const nn = stilstaandGeld(van('nn'), 'nieuwbouw');
    assert.deepEqual(nn.perioden.map((p) => [p.van, p.tot, p.bedrag]), [[1, 24, 0], [25, 36, 33]]);
});

test('ING: geen rente over wat nog in depot staat, dus geen perioden', () => {
    assert.deepEqual(stilstaandGeld(van('ing'), 'verbouw'), { geenRente: true });
});

test('ABN AMRO: de hoogte is niet gepubliceerd, dus niet uit te rekenen zolang de vergoeding loopt', () => {
    const abn = stilstaandGeld(van('abn-amro'), 'verbouw');
    assert.deepEqual(abn.perioden.map((p) => [p.van, p.tot, p.bedrag]), [[1, 18, null], [19, 24, 33]]);
    assert.equal(abn.perioden[0].bovengrens, 33);
    // Bij nieuwbouw loopt de vergoeding 30 maanden, voorbij de standaard van 24.
    assert.deepEqual(stilstaandGeld(van('abn-amro'), 'nieuwbouw').perioden.map((p) => [p.van, p.tot, p.bedrag]), [[1, 30, null], [31, 36, 33]]);
});

test('SNS: de vergoeding loopt de hele periode door, er is geen dure staart', () => {
    assert.deepEqual(stilstaandGeld(van('sns'), 'verbouw').perioden.map((p) => [p.van, p.tot, p.bedrag]), [[1, 36, 0]]);
});

test('Rabobank: verlenging mogelijk maar duur onbekend, het overzicht stopt bij de standaardlooptijd', () => {
    const rabo = stilstaandGeld(van('rabobank'), 'verbouw');
    assert.equal(rabo.duurOnbekend, true);
    assert.deepEqual(rabo.perioden.map((p) => [p.van, p.tot, p.bedrag]), [[1, 24, 0]]);
});

test('geen enkele periode loopt voorbij wat het depot kan duren, en de perioden sluiten aan', () => {
    for (const a of data.aanbieders) {
        for (const soort of ['verbouw', 'nieuwbouw']) {
            const s = stilstaandGeld(a, soort);
            if (s.geenRente) continue;
            const looptijd = soort === 'verbouw' ? a.looptijdVerbouwMaanden : a.looptijdNieuwbouwMaanden;
            const extra = a.verlengingMaanden?.[soort];
            const max = looptijd + (typeof extra === 'number' ? extra : 0);
            let volgende = 1;
            for (const p of s.perioden) {
                assert.equal(p.van, volgende, `${a.id}/${soort}`);
                assert.ok(p.tot <= max && p.tot >= p.van, `${a.id}/${soort}`);
                volgende = p.tot + 1;
            }
            if (s.perioden.length) assert.equal(volgende - 1, max, `${a.id}/${soort}: sluit niet op het einde`);
        }
    }
});

test('de vragen volgen uit wat ontbreekt, en spreken elkaar niet tegen', () => {
    // ING publiceert de termijn voor verlengen en de uitbetaaltijd, maar geen bedragen per declaratie.
    const ing = openVragen(van('ing'));
    assert.ok(ing.some((v) => /maximumbedrag/.test(v)));
    assert.ok(!ing.some((v) => /Hoeveel maanden voor de einddatum/.test(v)));
    assert.ok(!ing.some((v) => /depotvergoeding/.test(v)), 'ING vergoedt niets; daar valt niets over te vragen');

    // Rabobank: zelf betalen, dus geen vraag over declaraties.
    const rabo = openVragen(van('rabobank'));
    assert.ok(rabo.some((v) => /per overboeking/.test(v)) && !rabo.some((v) => /minimumbedrag per declaratie/.test(v)));

    // Zonder gepubliceerde verlenging geen vraag over wanneer je die moet regelen.
    for (const a of data.aanbieders) {
        const vragen = openVragen(a);
        const stopt = vragen.some((v) => /stopt het depot op de einddatum/.test(v));
        const wanneer = vragen.some((v) => /Hoeveel maanden voor de einddatum/.test(v));
        assert.ok(!(stopt && wanneer), a.id);
        assert.equal(new Set(vragen).size, vragen.length, a.id);
    }
});

test('elke aanbiederpagina heeft de tijdlijn en het rekenvoorbeeld, en de ouderdomseis komt uit de data', () => {
    for (const a of data.aanbieders) {
        const html = fs.readFileSync(path.join(ROOT, `bouwdepot-${a.id}.html`), 'utf8');
        assert.ok(html.includes('id="maand-voor-maand"') && html.includes('id="stilstaand-geld"'), a.id);
        const eisen = a.declaratieEisen || [];
        assert.equal(html.includes('id="declareren"'), eisen.length > 0, a.id);
        assert.equal((html.split('id="declareren"')[1] || '').split('</section>')[0].split('<dt>').length - 1, eisen.length, a.id);
    }
    // Stond overal op "niet gepubliceerd" doordat de rij een eis zocht die niet bestaat.
    const nn = fs.readFileSync(path.join(ROOT, 'bouwdepot-nn.html'), 'utf8');
    assert.match(nn, /<dt>Ouderdom van de factuur<\/dt>\s*<dd>Maximaal 6 maanden oud/);
});
