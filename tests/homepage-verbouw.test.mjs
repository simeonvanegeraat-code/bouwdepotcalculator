/**
 * Bewaakt de kleine rekensom voor verbouwen op de homepage.
 *
 * De bedragen staan in index.html zelf, zodat ze er ook zonder JavaScript zijn.
 * Ze zijn dus een keer ingevuld en kunnen stil gaan afwijken van de rekenkern.
 * Deze test legt ze ernaast, en rekent het voorbeeld los van de code na.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { verbouwsom, VERBOUWVOORBEELD } from '../src/homepage/verbouw.js';
import { berekenDepot } from '../src/domain/bouwdepot.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const blok = html.slice(html.indexOf('data-verbouw'), html.indexOf('id="gereedschap"'));
const opPagina = (naam) => [...blok.matchAll(new RegExp(`data-vb="${naam}">([^<]+)<`, 'g'))].map((m) => m[1].replace('&euro;', '€'));
const bedrag = (n) => `€ ${n.toLocaleString('nl-NL')}`;

test('het voorbeeld, met de hand nagerekend', () => {
    // € 20.000 tegen 3,80% over 360 maanden.
    const r = 0.038 / 12;
    const termijn = (20000 * r) / (1 - (1 + r) ** -360);   // 93,19
    const s = verbouwsom();
    assert.equal(s.maand, Math.round(termijn));
    assert.equal(s.maand, 93);
    assert.equal(s.rente, 63);          // 20.000 x 3,8% / 12 = 63,33
    assert.equal(s.aflossing, 30);      // samen de 93
    // Alles wat je betaalt min wat je leende is rente.
    assert.equal(s.totaalRente, Math.round(termijn * 360 - 20000));
    assert.equal(s.totaalRente, 13549);
    assert.equal(s.totaal, 33549);
    // Het laatste jaar, los uitgeschreven: de schuld die er dan nog staat.
    let schuld = 20000, renteLaatsteJaar = 0;
    for (let m = 1; m <= 360; m++) {
        const deel = schuld * r;
        if (m > 348) renteLaatsteJaar += deel;
        schuld -= termijn - deel;
    }
    assert.equal(s.renteLaat, Math.round(renteLaatsteJaar / 12));
    assert.equal(s.renteLaat + s.aflossingLaat, s.maand);
    assert.ok(Math.abs(schuld) < 1e-6, 'na dertig jaar is de lening afgelost');
});

test('de som is die van bouwdepot-berekenen.html', () => {
    const s = verbouwsom();
    const t = berekenDepot({ depot: VERBOUWVOORBEELD.bedrag, rentePercent: VERBOUWVOORBEELD.rentePercent });
    assert.equal(s.maand, Math.round(t.maandlastDaarna));
    assert.equal(s.totaalRente, Math.round(t.renteHeleLooptijd));
});

test('het rentedeel daalt elk jaar en de delen tellen op', () => {
    const s = verbouwsom();
    assert.equal(s.jaren.length, 30);
    for (let i = 1; i < 30; i++) assert.ok(s.jaren[i].renteDeel < s.jaren[i - 1].renteDeel, `jaar ${i + 1}`);
    for (const j of s.jaren) assert.ok(Math.abs(j.rente + j.aflossing - s.maandExact * 12) < 1e-6, `jaar ${j.jaar}`);
    const afgelost = s.jaren.reduce((som, j) => som + j.aflossing, 0);
    assert.ok(Math.abs(afgelost - 20000) < 1e-4);
});

test('de bedragen in index.html zijn die van de rekenkern', () => {
    const s = verbouwsom();
    assert.ok(blok.length > 500, 'het blok met de rekensom staat op de homepage');
    for (const naam of ['maand', 'rente', 'aflossing', 'renteLaat', 'totaalRente', 'totaal']) {
        const gevonden = opPagina(naam);
        assert.ok(gevonden.length > 0, `het bedrag "${naam}" staat op de pagina`);
        for (const tekst of gevonden) assert.equal(tekst, bedrag(s[naam]), `"${naam}" op de pagina`);
    }
    assert.deepEqual(opPagina('bedrag'), [bedrag(VERBOUWVOORBEELD.bedrag)]);
    assert.match(blok, /value="20\.000"/);
    assert.match(blok, /value="3,80"/);
});

test('de staven in index.html hebben de hoogte uit de rekenkern', () => {
    const s = verbouwsom();
    const hoogtes = [...blok.matchAll(/--rente:([\d.]+)/g)].map((m) => Number(m[1]));
    assert.equal(hoogtes.length, 30);
    hoogtes.forEach((h, i) => assert.ok(Math.abs(h - s.jaren[i].renteDeel * 100) < 0.06, `staaf ${i + 1}`));
});

test('een ander bedrag en een andere rente', () => {
    const s = verbouwsom({ bedrag: 40000, rentePercent: 4.5 });
    const r = 0.045 / 12;
    assert.equal(s.maand, Math.round((40000 * r) / (1 - (1 + r) ** -360)));
    assert.equal(s.rente, 150);
    assert.equal(s.rente + s.aflossing, s.maand);
    // Nul procent: alleen aflossing.
    const nul = verbouwsom({ rentePercent: 0 });
    assert.equal(nul.rente, 0);
    assert.equal(nul.totaalRente, 0);
    assert.equal(nul.maand, Math.round(20000 / 360));
});
