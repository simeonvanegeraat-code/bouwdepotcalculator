/**
 * Leenruimte: de inkomenstoets en de waardetoets uit de Trhk 2026.
 *
 * De verwachte bedragen zijn los van de rekenkern uitgerekend: het percentage
 * zelf opgezocht in bijlage 1 van de wettekst (wetten.overheid.nl/BWBR0032503,
 * versie 1-1-2026), de maandlast = inkomen x percentage / 12, en het bedrag als
 * contante waarde van een annuiteit over 360 maanden:
 *
 *     H = M x (1 - (1 + i)^-360) / i,   i = rente / 12
 *
 * Voorbeeld A met de hand: factor bij 5% is 186,2813; 1.230 x 186,2813 = 229.126.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
    berekenLeenruimte, financieringslastPercentage, toetsrente, bruteringsfactor, hoofdsomBijMaandlast, energieRuimte,
} from '../src/domain/leenruimte.js';
import { TABEL_1, TABEL_2, TOETSRENTE_KOLOMMEN } from '../src/domain/trhk-2026.js';

const bijna = (a, b, marge = 0.01, wat = '') => assert.ok(Math.abs(a - b) <= marge, `${wat} ${a} is niet ${b}`);

test('de tabellen hebben de opbouw van de wet en lopen op', () => {
    assert.equal(TABEL_1.length, 97);     // "–", dan 30.000 tot en met 125.000 per 1.000
    assert.equal(TABEL_2.length, 83);     // "–", dan 29.000 tot en met 110.000
    assert.equal(TABEL_1.at(-1)[0], 125000);
    assert.equal(TABEL_2.at(-1)[0], 110000);
    for (const tabel of [TABEL_1, TABEL_2]) {
        for (const rij of tabel) assert.equal(rij.length, 1 + TOETSRENTE_KOLOMMEN.length);
        for (let r = 1; r < tabel.length; r++) {
            for (let k = 1; k < tabel[r].length; k++) assert.ok(tabel[r][k] >= tabel[r - 1][k], `rij ${tabel[r][0]} kolom ${k}`);
        }
    }
});

test('steekproeven uit bijlage 1, met de hand overgenomen uit de wettekst', () => {
    // Tabel 1, rij 60.000, kolom 4,501-5,000%: 24,6%.
    assert.equal(financieringslastPercentage(60000, 5.0), 0.246);
    // Tabel 1, rij 100.000, kolom 3,501-4,000%: 26,1%.
    assert.equal(financieringslastPercentage(100000, 3.9), 0.261);
    // Tabel 1, rij 125.000, kolom >= 6,501%: 32,2%.
    assert.equal(financieringslastPercentage(125000, 7), 0.322);
    // Tabel 2, rij 40.000, kolom 4,501-5,000%: 28,2%.
    assert.equal(financieringslastPercentage(40000, 5.0, true), 0.282);
    // Tabel 1, rij "–", kolom <= 1,500%: 15,5%.
    assert.equal(financieringslastPercentage(20000, 1.2), 0.155);
});

test('rij en kolom: grenzen', () => {
    assert.equal(financieringslastPercentage(29999, 5), financieringslastPercentage(0, 5), 'onder 30.000 de rij "–"');
    assert.equal(financieringslastPercentage(60999, 5), financieringslastPercentage(60000, 5), 'de rij geldt tot de volgende');
    assert.equal(financieringslastPercentage(400000, 5), financieringslastPercentage(125000, 5), 'boven de tabel de laatste rij');
    assert.equal(financieringslastPercentage(60000, 5.0), 0.246, '5,000% valt in 4,501-5,000');
    assert.equal(financieringslastPercentage(60000, 5.001), 0.255, '5,001% valt in 5,001-5,500');
    assert.equal(financieringslastPercentage(60000, 1.5), 0.177, '1,500% valt in de eerste kolom');
});

test('toetsrente: minimaal 5% bij korter dan 10 jaar vast, anders de eigen rente', () => {
    assert.equal(toetsrente(3.9, false), 5);
    assert.equal(toetsrente(3.9, true), 3.9);
    assert.equal(toetsrente(5.6, false), 5.6);
    assert.equal(bruteringsfactor(5.0), 1.30);
    assert.equal(bruteringsfactor(3.9), 1.20);
    assert.equal(bruteringsfactor(2.0), 1.05);
    assert.equal(bruteringsfactor(7), 1.40);
});

test('hoofdsom bij een maandlast, nul en nulrente', () => {
    bijna(hoofdsomBijMaandlast(1230, 5), 229126.39, 0.01, 'A');
    assert.equal(hoofdsomBijMaandlast(0, 5), 0);
    assert.equal(hoofdsomBijMaandlast(-10, 5), 0);
    assert.equal(hoofdsomBijMaandlast(100, 0), 36000);
});

test('A: samen 60.000, korter vast, label C: de inkomenstoets bepaalt', () => {
    const u = berekenLeenruimte({
        inkomen: 45000, inkomenPartner: 15000, rentePercent: 4.2, tienJaarVast: false,
        hypotheek: 200000, waarde: 300000, verbouwing: 50000, energiebesparend: 0, label: 'CD',
    });
    assert.equal(u.toetsinkomen, 60000);
    assert.equal(u.toetsrente, 5);
    assert.equal(u.percentage, 0.246);
    bijna(u.toegestaneLast, 1230);
    bijna(u.uitLast, 229126.39);
    assert.deepEqual(u.erbij, { label: 5000, energiebesparend: 0, alleenstaand: 0, totaal: 5000 });
    bijna(u.maxInkomen, 234126.39);
    assert.equal(u.maxWaarde, 300000);
    assert.equal(u.grens, 'inkomen');
    bijna(u.extra, 34126.39);
    bijna(u.voorVerbouwing, 34126.39);
    bijna(u.eigenGeld, 15873.61);
    bijna(u.extraMaandlast, 166.88);                  // tegen de eigen rente van 4,2%, niet de toetsrente
    bijna(u.extraZonderErbij, 29126.39);
});

test('B: samen 100.000, 10 jaar vast: de waardetoets bepaalt', () => {
    const u = berekenLeenruimte({
        inkomen: 80000, inkomenPartner: 20000, rentePercent: 3.9, tienJaarVast: true,
        hypotheek: 250000, waarde: 320000, verbouwing: 90000, label: 'AB',
    });
    assert.equal(u.toetsrente, 3.9);
    bijna(u.toegestaneLast, 2175);
    bijna(u.uitLast, 461129.24);
    bijna(u.maxInkomen, 471129.24);                    // + 10.000 bij label A of B
    assert.equal(u.maxWaarde, 320000);
    assert.equal(u.grens, 'waarde');
    assert.equal(u.extra, 70000);
    assert.equal(u.voorVerbouwing, 70000);
    assert.equal(u.eigenGeld, 20000);
});

test('C: energiebesparend: tot 106% van de waarde en extra ruimte bij het label', () => {
    const u = berekenLeenruimte({
        inkomen: 80000, inkomenPartner: 20000, rentePercent: 3.9, tienJaarVast: true,
        hypotheek: 230000, waarde: 250000, verbouwing: 60000, energiebesparend: 30000, label: 'EFG',
    });
    assert.equal(u.erbij.label, 0);
    assert.equal(u.erbij.energiebesparend, 20000);     // label E-G: maximaal 20.000
    assert.equal(u.waarde.energiebesparend, 15000);    // 6% van 250.000
    assert.equal(u.maxWaarde, 265000);
    assert.equal(u.extra, 35000);
    // Zonder label: maximaal 10.000 buiten de last.
    assert.deepEqual(energieRuimte('geen', 30000), { labelBedrag: 0, besparend: 10000, maxBesparend: 10000 });
    // Meer energiebesparend dan de hele verbouwing kan niet.
    const raar = berekenLeenruimte({ inkomen: 100000, rentePercent: 4, hypotheek: 0, waarde: 200000, verbouwing: 5000, energiebesparend: 50000, label: 'EFG' });
    assert.equal(raar.waarde.energiebesparend, 5000);
});

test('D: alleenstaand 40.000 met studieschuld: 17.000 erbij, termijn gebruteerd', () => {
    const u = berekenLeenruimte({
        inkomen: 40000, rentePercent: 5.5, tienJaarVast: false, studieschuldMaand: 100,
        hypotheek: 100000, waarde: 300000, verbouwing: 40000, label: 'EFG',
    });
    assert.equal(u.toetsrente, 5.5);
    assert.equal(u.percentage, 0.255);
    assert.equal(u.studieschuld.factor, 1.30);
    bijna(u.studieschuld.gebruteerd, 130);
    bijna(u.toegestaneLast, 720);
    bijna(u.uitLast, 126807.67);
    assert.equal(u.erbij.alleenstaand, 17000);
    bijna(u.maxInkomen, 143807.67);
    bijna(u.extra, 40000 + 3807.67);
    assert.equal(u.voorVerbouwing, 40000);              // nooit meer dan de verbouwing kost
});

test('E: AOW-leeftijd bereikt: tabel 2, grens alleenstaand 29.000', () => {
    const u = berekenLeenruimte({ inkomen: 40000, aowBereikt: true, rentePercent: 4, hypotheek: 50000, waarde: 400000, verbouwing: 30000, label: 'EFG' });
    assert.equal(u.percentage, 0.282);
    bijna(u.uitLast, 175104.72);
    assert.equal(u.erbij.alleenstaand, 17000);
    const net = berekenLeenruimte({ inkomen: 29000, aowBereikt: true, rentePercent: 4, hypotheek: 0, waarde: 400000, verbouwing: 0 });
    assert.equal(net.erbij.alleenstaand, 0, 'precies 29.000 is niet hoger dan 29.000');
});

test('nulgevallen en een hypotheek boven de grens', () => {
    const niets = berekenLeenruimte({ inkomen: 0, rentePercent: 4, hypotheek: 0, waarde: 300000, verbouwing: 50000 });
    assert.equal(niets.uitLast, 0);
    assert.equal(niets.extra, 0);
    assert.equal(niets.eigenGeld, 50000);
    assert.equal(niets.extraMaandlast, 0);
    const vol = berekenLeenruimte({ inkomen: 50000, inkomenPartner: 10000, rentePercent: 4, hypotheek: 400000, waarde: 300000, verbouwing: 50000 });
    assert.equal(vol.extra, 0, 'nooit negatief');
    assert.equal(vol.voorVerbouwing, 0);
    const geenStudie = berekenLeenruimte({ inkomen: 40000, inkomenPartner: 1, rentePercent: 4, studieschuldMaand: 5000, hypotheek: 0, waarde: 300000, verbouwing: 0 });
    assert.equal(geenStudie.toegestaneLast, 0, 'een studieschuld groter dan de ruimte maakt de last nul, niet negatief');
});

test('ruimtebalk: de vakken liggen op volgorde en de grenzen op hun plek', async () => {
    const { ruimtebalk, KNIK } = await import('../src/leenruimte/ruimtebalk.js');
    const VOORBEELD = { inkomen: 48000, inkomenPartner: 24000, rentePercent: 3.9, tienJaarVast: true, hypotheek: 280000, waarde: 420000, verbouwing: 60000, label: 'CD' };
    const u = berekenLeenruimte(VOORBEELD);
    const r = ruimtebalk(u, 60000);
    assert.equal(r.huidig.left, 0);
    assert.equal(r.huidig.width, KNIK);
    bijna(r.lenen.left, KNIK, 1e-9);
    bijna(r.zelf.left, r.lenen.left + r.lenen.width, 1e-9);
    assert.equal(r.over.width, 0, 'de verbouwing past niet helemaal, dus geen extra ruimte');
    // De schaal loopt tot de hoogste grens, hier de woningwaarde: 420.000.
    bijna(r.grensWaarde, 99.6, 1e-9);
    // De grens op het inkomen valt precies aan het eind van het vak "te lenen".
    bijna(r.grensInkomen, r.lenen.left + r.lenen.width, 1e-9);

    // Alles past: het vak "zelf" is leeg en er is nog ruimte over.
    const ruim = ruimtebalk(berekenLeenruimte({ ...VOORBEELD, inkomen: 120000, verbouwing: 20000 }), 20000);
    assert.equal(ruim.zelf.width, 0);
    assert.ok(ruim.over.width > 0);
    assert.ok(ruim.overBedrag > 0);

    // Geen hypotheek: geen knik, een gewone schaal vanaf nul.
    const leeg = ruimtebalk(berekenLeenruimte({ ...VOORBEELD, hypotheek: 0 }), 60000);
    assert.equal(leeg.geknikt, false);
    assert.equal(leeg.huidig.width, 0);

    // Hypotheek boven de grenzen: niets te lenen, de grenzen vallen in het blok.
    const vol = ruimtebalk(berekenLeenruimte({ ...VOORBEELD, hypotheek: 500000 }), 60000);
    assert.equal(vol.lenen.width, 0);
    assert.ok(vol.grensInkomen < KNIK && vol.grensWaarde < KNIK);
    for (const x of [r, ruim, leeg, vol]) {
        for (const deel of ['huidig', 'lenen', 'zelf', 'over']) assert.ok(x[deel].left + x[deel].width <= 100 + 1e-9, deel);
    }
});
