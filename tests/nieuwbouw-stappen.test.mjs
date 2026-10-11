import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
    BEWAARTERMIJN_MS, STAPPEN, bewaarTekst, controleerStap, eersteOpenStap, leesBewaard, naarAdres, uitAdres,
} from '../src/nieuwbouw/stappenlogica.js';

const GOED = { von: 500000, grond: 150000, meerwerk: 0, eigen: 0, rente: 3.8, vorm: 'annuiteit', maanden: 12, woonlast: 1200, overlap: 2 };

test('een volledig ingevulde invoer komt door alle vijf de stappen', () => {
    assert.deepEqual([...STAPPEN], [1, 2, 3, 4, 5]);
    for (const stap of STAPPEN) assert.equal(controleerStap(stap, GOED), '');
    assert.equal(eersteOpenStap(GOED), 0);
});

test('een leeg veld is een fout, geen nul', () => {
    assert.match(controleerStap(1, { ...GOED, von: null }), /koopsom/);
    assert.match(controleerStap(1, { ...GOED, grond: null }), /grond/);
    assert.match(controleerStap(3, { ...GOED, rente: null }), /rente/);
    assert.match(controleerStap(4, { ...GOED, maanden: null }), /maanden/);
    assert.match(controleerStap(5, { ...GOED, woonlast: null }), /woonlast/);
    assert.equal(eersteOpenStap({ ...GOED, rente: null }), 3);
    assert.equal(controleerStap(2, { ...GOED, rente: null }), '', 'de rente hoort bij stap 3, niet bij stap 2');
});

test('nul mag waar nul iets betekent', () => {
    assert.equal(controleerStap(1, { ...GOED, grond: 0 }), '');
    assert.equal(controleerStap(2, { ...GOED, eigen: 0 }), '');
    assert.equal(controleerStap(3, { ...GOED, rente: 0 }), '');
    assert.equal(controleerStap(5, { ...GOED, woonlast: 0, overlap: 0 }), '');
});

test('de grenzen zijn die van de rekentool', () => {
    assert.notEqual(controleerStap(1, { ...GOED, grond: 500000 }), '', 'grond gelijk aan de koopsom');
    assert.notEqual(controleerStap(1, { ...GOED, von: 5000001 }), '');
    assert.notEqual(controleerStap(2, { ...GOED, eigen: 500001 }), '');
    assert.equal(controleerStap(2, { ...GOED, meerwerk: 40000, eigen: 520000 }), '', 'eigen geld mag tot koopsom plus meerwerk');
    assert.notEqual(controleerStap(2, { ...GOED, meerwerk: -1 }), '');
    assert.notEqual(controleerStap(2, { ...GOED, meerwerk: 1000001 }), '');
    assert.notEqual(controleerStap(2, { ...GOED, meerwerk: null }), '');
    assert.notEqual(controleerStap(3, { ...GOED, rente: 20.1 }), '');
    assert.notEqual(controleerStap(3, { ...GOED, vorm: 'aflossingsvrij' }), '');
    assert.equal(controleerStap(4, { ...GOED, maanden: 36 }), '');
    assert.notEqual(controleerStap(4, { ...GOED, maanden: 37 }), '');
    assert.notEqual(controleerStap(4, { ...GOED, maanden: 12.5 }), '');
    assert.notEqual(controleerStap(5, { ...GOED, overlap: 13 }), '');
    assert.throws(() => controleerStap(6, GOED));
});

test('de link geeft dezelfde invoer terug', () => {
    assert.deepEqual(uitAdres(`?${naarAdres(GOED)}`), GOED);
    const lineair = { ...GOED, vorm: 'lineair', eigen: 40000, rente: 4.15, maanden: 18, meerwerk: 25000 };
    assert.deepEqual(uitAdres(naarAdres(lineair)), lineair);
});

test('de instellingen van het overzicht reizen mee als ze afwijken', () => {
    const lager = { ...GOED, depot: 'lager', afslag: 0.5, mee: 'mee' };
    assert.deepEqual(uitAdres(naarAdres(lager)), lager);
    assert.deepEqual(uitAdres(naarAdres({ ...GOED, depot: 'geen' })), { ...GOED, depot: 'geen' });
    assert.equal(uitAdres(`${naarAdres(GOED)}&depot=dubbel`), null);
    assert.equal(uitAdres(`${naarAdres(GOED)}&depot=lager`), null, 'lager zonder afslag');
    assert.equal(uitAdres(`${naarAdres(GOED)}&depot=lager&afslag=25`), null);
});

test('een link met onzin levert geen invoer op', () => {
    assert.equal(uitAdres(''), null);
    assert.equal(uitAdres('?grond=150000'), null, 'zonder koopsom');
    assert.equal(uitAdres('?von=abc&grond=1&rente=3'), null);
    assert.equal(uitAdres('?von=500000&grond=600000&rente=3.8'), null, 'grond boven de koopsom');
    assert.equal(uitAdres('?von=500000&grond=150000'), null, 'zonder rente');
    assert.equal(uitAdres('?von=500000&grond=150000&rente=3.8&meerwerk=-5'), null);
    assert.equal(uitAdres('?von=500000&grond=150000&rente=3.8&maanden=99'), null);
});

test('wat ontbreekt in een link krijgt de standaard, niet het voorbeeld', () => {
    const w = uitAdres('?von=400000&grond=100000&rente=4');
    assert.deepEqual(w, { von: 400000, grond: 100000, meerwerk: 0, eigen: 0, rente: 4, vorm: 'annuiteit', maanden: 12, woonlast: 0, overlap: 2 });
});

test('bewaarde invoer verloopt na negentig dagen', () => {
    const nu = Date.UTC(2026, 9, 11);
    const tekst = bewaarTekst(GOED, nu);
    assert.deepEqual(leesBewaard(tekst, nu + 1000), GOED);
    assert.deepEqual(leesBewaard(tekst, nu + BEWAARTERMIJN_MS), GOED);
    assert.equal(leesBewaard(tekst, nu + BEWAARTERMIJN_MS + 1), null);
    assert.equal(leesBewaard(null, nu), null);
    assert.equal(leesBewaard('1', nu), null);
    assert.equal(leesBewaard('{"adres":"von=1","op":"gisteren"}', nu), null);
});

test('de pagina heeft de stappen, en werkt ook zonder', () => {
    const html = readFileSync(new URL('../nieuwbouw.html', import.meta.url), 'utf8');
    assert.ok(!html.includes('localStorage.getItem'), 'alleen een bewaarde link slaat het startscherm over');
    for (const id of ['st-von', 'st-grond', 'st-meerwerk', 'st-eigen', 'st-rente', 'st-maanden', 'st-woonlast', 'st-overlap']) {
        assert.ok(html.includes(`id="${id}"`) && html.includes(`for="${id}"`), `${id} heeft een label`);
    }
    // De rekentool zelf staat er nog: de stappen zijn een laag eroverheen.
    for (const id of ['input-von', 'input-land', 'input-interest', 'input-build-months', 'input-current-housing', 'maandtabel', 'btn-download']) {
        assert.ok(html.includes(`id="${id}"`), id);
    }
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    assert.match(html, /<details class="wr-uitklap" open>/, 'de maandtabel staat open');
    // Op het overzicht: geen voorbeeldknoppen die je eigen cijfers vervangen, wel
    // de twee aannames waar de stappen niet naar vragen.
    assert.ok(!html.includes('data-voorbeeld '), 'geen voorbeeldknoppen in het formulier');
    for (const haak of ['data-nb-samen', 'data-nb-depot', 'data-nb-schema', 'data-nb-aanpas="depot"', 'data-nb-aanpas="schema"', 'id="meer-instellingen"', 'id="termijnschema"']) {
        assert.ok(html.includes(haak), haak);
    }
    // Elk scherm van de logica staat in de pagina, met een streepje in de voortgang.
    for (const stap of STAPPEN) assert.ok(html.includes(`data-scherm="${stap}"`) && html.includes(`Stap ${stap} van ${STAPPEN.length}`), `stap ${stap}`);
    assert.equal((html.match(/<ol class="nb-voortgang"[^>]*>(.*?)<\/ol>/)[1].match(/<li>/g) ?? []).length, STAPPEN.length);
});
