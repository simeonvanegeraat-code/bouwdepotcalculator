/**
 * De rekenkern van de bouwrente, nagerekend met de hand.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { berekenBouwrente } from '../src/domain/bouwrente.js';

const bijna = (werkelijk, verwacht, marge = 0.005, uitleg = '') =>
    assert.ok(Math.abs(werkelijk - verwacht) <= marge, `${uitleg} verwacht ${verwacht}, kreeg ${werkelijk}`);

test('de standaardinvoer: 100.000 grond, zes maanden, 4%', () => {
    // 100.000 x 4% x 6/12 = 2.000.
    const t = berekenBouwrente();
    bijna(t.totaal, 2000, 1e-9);
    bijna(t.renteGrond, 2000, 1e-9);
    assert.equal(t.renteTermijnen, 0);
    assert.equal(t.btw, 0);
    assert.equal(t.duur, 6);
    assert.equal(t.regels.length, 6);
    bijna(t.regels[0].totaal, 2000 / 6, 1e-9);
    bijna(t.regels[5].totaal, 2000, 1e-9);
});

test('vervallen termijnen lopen korter mee dan de grond', () => {
    // Grond 100.000 over 6 maanden: 2.000. Termijnen 60.000 over 2 maanden: 400.
    const t = berekenBouwrente({ termijnen: 60000, maandenTermijnen: 2 });
    bijna(t.renteTermijnen, 400, 1e-9);
    bijna(t.totaal, 2400, 1e-9);
    // De termijnen beginnen pas in maand 5 mee te tellen.
    assert.equal(t.regels[3].termijnen, 0);
    bijna(t.regels[4].termijnen, 200, 1e-9);
    bijna(t.regels[5].totaal, 2400, 1e-9);
    // Zonder bedrag tellen de maanden van de termijnen niet mee voor de duur.
    assert.equal(berekenBouwrente({ termijnen: 0, maandenTermijnen: 20 }).duur, 6);
    // Termijnen die langer openstaan dan de grond bepalen de duur.
    assert.equal(berekenBouwrente({ termijnen: 1000, maandenTermijnen: 9 }).duur, 9);
});

test('btw over de rente: 21% erbij', () => {
    const t = berekenBouwrente({ metBtw: true });
    bijna(t.rente, 2000, 1e-9);
    bijna(t.btw, 420, 1e-9);
    bijna(t.totaal, 2420, 1e-9);
    bijna(t.regels[5].totaal, 2420, 1e-9);
});

test('de splitsing op het moment van tekenen', () => {
    // Twee van de zes maanden liggen na het tekenen: 100.000 x 4% x 2/12 = 666,67.
    const t = berekenBouwrente();
    bijna(t.naTekenen, 666.6667, 1e-3);
    bijna(t.voorTekenen, 1333.3333, 1e-3);
    assert.equal(t.tekenmaand, 4);
    // Termijnen die pas na het tekenen vervielen, vallen er helemaal in.
    const m = berekenBouwrente({ termijnen: 60000, maandenTermijnen: 1, maandenNaTekenen: 2 });
    bijna(m.naTekenen, 666.6667 + 200, 1e-3);
    // Met btw gaat de btw naar rato mee.
    bijna(berekenBouwrente({ metBtw: true }).naTekenen, 666.6667 * 1.21, 1e-3);
    // Meer maanden na tekenen dan er rente loopt: alles valt erna.
    const alles = berekenBouwrente({ maandenNaTekenen: 12 });
    bijna(alles.naTekenen, 2000, 1e-9);
    assert.equal(alles.voorTekenen, 0);
    assert.equal(alles.tekenmaand, 0);
    // Nul maanden: alles valt ervoor.
    assert.equal(berekenBouwrente({ maandenNaTekenen: 0 }).naTekenen, 0);
});

test('meefinancieren: dertig jaar rente over de bouwrente, niet zes maanden', () => {
    const t = berekenBouwrente({ meefinancieren: true });
    const r = 0.038 / 12;
    const termijn = (2000 * r) / (1 - (1 + r) ** -360);   // 9,32
    bijna(t.extraMaandlast, termijn, 1e-9);
    bijna(t.renteOverLooptijd, termijn * 360 - 2000, 1e-6);
    assert.equal(Math.round(t.renteOverLooptijd), 1355);
    bijna(t.totaalMetFinanciering, termijn * 360, 1e-6);
    // De vorige versie rekende 2.000 x 3,8% x 6/12 = 38 euro.
    assert.ok(t.renteOverLooptijd > 30 * 38);
});

test('zonder meefinancieren is er geen extra maandlast', () => {
    const t = berekenBouwrente();
    assert.equal(t.extraMaandlast, 0);
    assert.equal(t.renteOverLooptijd, 0);
    bijna(t.totaalMetFinanciering, 2000, 1e-9);
});

test('nulgevallen', () => {
    assert.equal(berekenBouwrente({ rentePercent: 0 }).totaal, 0);
    assert.equal(berekenBouwrente({ grond: 0 }).totaal, 0);
    const alleenTermijnen = berekenBouwrente({ grond: 0, termijnen: 30000, maandenTermijnen: 4 });
    bijna(alleenTermijnen.totaal, 400, 1e-9);
    assert.equal(alleenTermijnen.duur, 6);
    // Nul procent hypotheekrente: alleen aflossen.
    const gratis = berekenBouwrente({ meefinancieren: true, hypotheekrentePercent: 0 });
    bijna(gratis.extraMaandlast, 2000 / 360, 1e-9);
    bijna(gratis.renteOverLooptijd, 0, 1e-9);
});

test('de delen tellen op', () => {
    const t = berekenBouwrente({ grond: 135000, maandenGrond: 11, termijnen: 82000, maandenTermijnen: 4, rentePercent: 5.5, metBtw: true, maandenNaTekenen: 3 });
    bijna(t.rente, t.renteGrond + t.renteTermijnen, 1e-9);
    bijna(t.totaal, t.rente + t.btw, 1e-9);
    bijna(t.totaal, t.voorTekenen + t.naTekenen, 1e-9);
    bijna(t.regels.at(-1).totaal, t.totaal, 1e-9);
    for (let i = 1; i < t.regels.length; i++) assert.ok(t.regels[i].totaal > t.regels[i - 1].totaal);
});
