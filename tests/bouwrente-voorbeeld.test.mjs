/**
 * Bewaakt de bedragen in de tekst van bouwrente-nieuwbouw.html.
 *
 * Het antwoord bovenaan en het bedrag bij "Meefinancieren kost extra" staan met
 * de hand in de HTML, zodat ze er ook zonder JavaScript zijn. Ze horen bij de
 * standaardinvoer van de rekentool: wie binnenkomt ziet in de uitkomst dezelfde
 * bedragen. Deze test faalt zodra tekst, invoervelden en rekenkern uit elkaar
 * lopen.
 *
 * De verwachte uitkomsten staan hier los uitgerekend, zonder het model.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { berekenBouwrente, STANDAARD_BOUWRENTE as S } from '../src/domain/bouwrente.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'bouwrente-nieuwbouw.html'), 'utf8');

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const plat = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&euro;/g, '€').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ').trim();
const bedrag = (n) => plat(euro.format(n));
const getal = (s) => Number(s.replace(/\./g, '').replace(',', '.'));

const b = berekenBouwrente();
const mee = berekenBouwrente({ meefinancieren: true });

test('het model geeft de met de hand nagerekende uitkomsten', () => {
    // € 100.000 x 4% / 12 = € 333,33 per maand; zes maanden = € 2.000.
    const perMaand = 100000 * 0.04 / 12;
    assert.ok(Math.abs(perMaand * 6 - 2000) < 1e-9);
    assert.ok(Math.abs(b.totaal - 2000) < 1e-6, `bouwrente is ${b.totaal}`);

    // € 2.000 annuïtair over 360 maanden tegen 3,8%:
    //   i = 0,038 / 12; T = 2000 * i / (1 - (1 + i)^-360) = € 9,32; rente = 360 T - 2000 = € 1.354,89
    const i = 0.038 / 12;
    const T = 2000 * i / (1 - (1 + i) ** -360);
    assert.ok(Math.abs(mee.extraMaandlast - T) < 1e-6, `extra maandlast is ${mee.extraMaandlast}`);
    assert.ok(Math.abs(mee.renteOverLooptijd - (360 * T - 2000)) < 1e-6, `rente over de looptijd is ${mee.renteOverLooptijd}`);
    assert.ok(Math.abs(mee.renteOverLooptijd - 1354.89) < 0.01);
});

test('de bedragen in de tekst komen uit de rekenkern', () => {
    const verwacht = {
        grond: S.grond,
        permaand: S.grond * S.rentePercent / 100 / 12,
        totaal: b.totaal,
        mee: mee.totaal,
        meemaand: mee.extraMaandlast,
        meerente: mee.renteOverLooptijd,
    };
    const gevonden = [...html.matchAll(/data-vb="([a-z]+)"[^>]*>([^<]*)</g)];
    for (const [, naam, tekst] of gevonden) {
        assert.ok(naam in verwacht, `onbekend bedrag "${naam}"`);
        assert.equal(plat(tekst), bedrag(verwacht[naam]), `het bedrag "${naam}"`);
    }
    for (const naam of Object.keys(verwacht)) {
        assert.ok(gevonden.some(([, n]) => n === naam), `het bedrag "${naam}" staat niet meer op de pagina`);
    }
});

test('de woorden in de tekst passen bij de standaardinvoer', () => {
    const lead = plat(html.match(/<p class="wr-lead">([\s\S]*?)<\/p>/)[1]);
    assert.ok(lead.includes(`bij ${S.rentePercent}% bouwrente`), 'rente');
    assert.equal(S.maandenGrond, 6, 'de tekst zegt "na zes maanden"');
    assert.equal(S.termijnen, 0, 'de tekst noemt alleen de grond');
    assert.equal(S.metBtw, false, 'de tekst rekent zonder btw');

    const meeTekst = plat(html.match(/<h3>Meefinancieren kost extra<\/h3>\s*<p>([\s\S]*?)<\/p>/)[1]);
    assert.equal(S.looptijdJaren, 30, 'de tekst zegt "dertig jaar"');
    assert.ok(meeTekst.includes(`tegen ${String(S.hypotheekrentePercent).replace('.', ',')}%`), 'hypotheekrente');
});

test('de rekentool begint met dezelfde invoer als de tekst', () => {
    const waarde = (id) => getal(html.match(new RegExp(`id="${id}"[^>]*value="([^"]*)"`))[1]);
    assert.equal(waarde('input-rate'), S.rentePercent);
    assert.equal(waarde('input-grond'), S.grond);
    assert.equal(waarde('input-months'), S.maandenGrond);
    assert.equal(waarde('input-termijnen'), S.termijnen);
    assert.equal(waarde('input-mortgage-rate'), S.hypotheekrentePercent);
});
