import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
    BEWAARTERMIJN_MS, MAX_TERMIJNEN, STAPPEN, bewaarTekst, controleerSchemaInvoer, controleerTermijnen, leesSchema, naarTermijnen, schemaTotaal, uitTermijnen, controleerStap, eersteOpenStap, leesBewaard, naarAdres, uitAdres,
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

const SCHEMA = [
    { naam: 'Start bouw', maand: 1, percent: 10 },
    { naam: 'Ruwe begane grondvloer', maand: 3, percent: 15 },
    { naam: 'Dak waterdicht', maand: 7, percent: 40 },
    { naam: 'Stuc- en tegelwerk', maand: 10, percent: 25 },
    { naam: 'Oplevering', maand: 12, percent: 10 },
];

test('een termijnschema dat optelt tot 100% mag door', () => {
    assert.equal(controleerTermijnen(SCHEMA, 12), '');
    assert.deepEqual(schemaTotaal(SCHEMA), { totaal: 100, rest: 0 });
    // Maand 0: bij de notaris al vervallen.
    assert.equal(controleerTermijnen([{ naam: '', maand: 0, percent: 30 }, { naam: '', maand: 12, percent: 70 }], 12), '');
});

test('het schema zegt wat er ontbreekt, per termijn en in totaal', () => {
    assert.match(controleerTermijnen([], 12), /minstens één/);
    assert.match(controleerTermijnen([{ naam: '', maand: null, percent: 50 }], 12), /Termijn 1: vul de bouwmaand in/);
    assert.match(controleerTermijnen([{ naam: '', maand: 2.5, percent: 50 }], 12), /Termijn 1/);
    assert.match(controleerTermijnen([SCHEMA[0], { naam: '', maand: 4, percent: null }], 12), /Termijn 2: vul in welk deel/);
    assert.match(controleerTermijnen([SCHEMA[0], { naam: '', maand: 4, percent: 0 }], 12), /Termijn 2/);
    assert.match(controleerTermijnen(SCHEMA.slice(0, 4), 12), /ontbreekt nog 10%/);
    assert.match(controleerTermijnen([...SCHEMA, { naam: '', maand: 12, percent: 5 }], 12), /meer dan het geheel/);
    assert.match(controleerTermijnen(SCHEMA, 10), /maand 12, terwijl de bouw 10 maanden duurt/);
    assert.match(controleerTermijnen(Array.from({ length: MAX_TERMIJNEN + 1 }, () => SCHEMA[0]), 12), /hooguit/);
});

test('het totaal telt lege regels als nul', () => {
    assert.deepEqual(schemaTotaal([SCHEMA[0], { naam: '', maand: null, percent: null }, SCHEMA[2]]), { totaal: 50, rest: 50 });
    assert.deepEqual(schemaTotaal([...SCHEMA, SCHEMA[0]]), { totaal: 110, rest: -10 });
    assert.deepEqual(schemaTotaal([]), { totaal: 0, rest: 100 });
});

test('een eigen schema blijft bewaard, een onbruikbaar schema niet', () => {
    const nu = Date.UTC(2026, 9, 11);
    assert.deepEqual(leesBewaard(bewaarTekst(GOED, nu, SCHEMA), nu), { ...GOED, schema: SCHEMA });
    assert.deepEqual(leesBewaard(bewaarTekst(GOED, nu), nu), GOED, 'zonder schema komt er geen schema terug');
    // Past niet meer bij de bouwduur, of telt niet op: dan rekent het overzicht met het voorbeeld.
    assert.deepEqual(leesBewaard(bewaarTekst({ ...GOED, maanden: 10 }, nu, SCHEMA), nu), { ...GOED, maanden: 10 });
    assert.deepEqual(leesBewaard(bewaarTekst(GOED, nu, SCHEMA.slice(1)), nu), GOED);
    assert.equal(leesSchema('schema'), null);
    assert.equal(leesSchema([{ maand: 'drie', percent: 10 }]), null);
    assert.equal(leesSchema([{ maand: 3, percent: 140 }]), null);
    assert.deepEqual(leesSchema([{ maand: 3, percent: 100, naam: 7, extra: 'x' }]), [{ maand: 3, percent: 100, naam: '' }]);
    // De link bevat het schema niet.
    assert.ok(!bewaarTekst(GOED, nu, SCHEMA).match(/adres":"[^"]*schema/));
});

// Aanneemsom € 300.000 volgens de overeenkomst, € 60.000 meerwerk erbij: samen € 360.000.
const MET_MEERWERK = { rijen: SCHEMA, basis: 300000, meerwerk: 60000 };
const euroVan = (t, geheel) => Math.round((t.percent / 100) * geheel);

test('percentages gaan over de aanneemsom zonder meerwerk', () => {
    // Meerwerk met de termijnen mee: 15% van € 300.000 plus 15% van € 60.000 is 15% van € 360.000.
    const mee = naarTermijnen({ ...MET_MEERWERK, apart: false, meerwerkRijen: [] });
    assert.deepEqual(mee.map((t) => t.percent), [10, 15, 40, 25, 10]);
    assert.equal(euroVan(mee[1], 360000), 54000);
    assert.ok(mee.every((t) => !t.soort));

    // Meerwerk apart: de tweede termijn is 15% van € 300.000 = € 45.000, en het meerwerk komt er los bij.
    const apart = naarTermijnen({ ...MET_MEERWERK, apart: true, meerwerkRijen: [{ naam: 'Keuken', maand: 9, bedrag: 15000 }, { naam: '', maand: 12, bedrag: 45000 }] });
    assert.deepEqual(apart.map((t) => euroVan(t, 360000)), [30000, 45000, 120000, 75000, 30000, 15000, 45000]);
    assert.ok(Math.abs(apart.reduce((s, t) => s + t.percent, 0) - 100) < 1e-9, 'samen het geheel');
    assert.deepEqual(apart.slice(5).map((t) => [t.naam, t.soort, t.maand]), [['Keuken', 'meerwerk', 9], ['Meerwerk', 'meerwerk', 12]]);
    assert.equal(controleerTermijnen(apart, 12), '', 'de rekentool neemt dit schema aan');

    // Zonder meerwerk doet de keuze er niet toe.
    assert.deepEqual(naarTermijnen({ rijen: SCHEMA, basis: 300000, meerwerk: 0, apart: true, meerwerkRijen: [] }).map((t) => t.percent), [10, 15, 40, 25, 10]);
});

test('het schema komt terug zoals het is ingevuld', () => {
    const invoer = { ...MET_MEERWERK, apart: true, meerwerkRijen: [{ naam: 'Keuken', maand: 9, bedrag: 15000 }, { naam: '', maand: 12, bedrag: 45000 }] };
    const terug = uitTermijnen(naarTermijnen(invoer), 300000, 60000);
    assert.equal(terug.apart, true);
    assert.deepEqual(terug.rijen.map((r) => [r.naam, r.maand, Math.round(r.percent * 1e6) / 1e6]), SCHEMA.map((r) => [r.naam, r.maand, r.percent]));
    assert.deepEqual(terug.meerwerkRijen, invoer.meerwerkRijen);
    // Zonder losse meerwerkregels: percentages onveranderd, meerwerk loopt mee.
    assert.deepEqual(uitTermijnen(SCHEMA, 300000, 60000), { apart: false, meerwerkRijen: [], rijen: SCHEMA });
    // Is het meerwerk sindsdien geschrapt, dan vervallen de losse regels en blijft het schema 100%.
    const zonder = uitTermijnen(naarTermijnen(invoer), 300000, 0);
    assert.equal(zonder.apart, false);
    assert.deepEqual(zonder.meerwerkRijen, []);
    assert.ok(Math.abs(zonder.rijen.reduce((s, r) => s + r.percent, 0) - 100) < 1e-9);
});

test('apart betaald meerwerk moet optellen tot het meerwerk', () => {
    const basis = { ...MET_MEERWERK, apart: true };
    assert.equal(controleerSchemaInvoer({ ...basis, meerwerkRijen: [{ naam: '', maand: 12, bedrag: 60000 }] }, 12), '');
    assert.match(controleerSchemaInvoer({ ...basis, meerwerkRijen: [] }, 12), /wanneer je het meerwerk betaalt/);
    assert.match(controleerSchemaInvoer({ ...basis, meerwerkRijen: [{ naam: '', maand: null, bedrag: 60000 }] }, 12), /Meerwerk 1: vul de bouwmaand in/);
    assert.match(controleerSchemaInvoer({ ...basis, meerwerkRijen: [{ naam: '', maand: 13, bedrag: 60000 }] }, 12), /Meerwerk 1/);
    assert.match(controleerSchemaInvoer({ ...basis, meerwerkRijen: [{ naam: '', maand: 6, bedrag: null }] }, 12), /Meerwerk 1: vul het bedrag in/);
    assert.match(controleerSchemaInvoer({ ...basis, meerwerkRijen: [{ naam: '', maand: 6, bedrag: 50000 }] }, 12), /€ 50\.000, terwijl je € 60\.000/);
    // De termijnen zelf gaan voor, en "mee" vraagt niets extra's.
    assert.match(controleerSchemaInvoer({ ...basis, rijen: SCHEMA.slice(1), meerwerkRijen: [] }, 12), /ontbreekt nog 10%/);
    assert.equal(controleerSchemaInvoer({ ...MET_MEERWERK, apart: false, meerwerkRijen: [] }, 12), '');
    // Het merkteken van een meerwerkregel overleeft de opslag.
    assert.equal(leesSchema([{ maand: 12, percent: 100, naam: 'Meerwerk', soort: 'meerwerk' }])[0].soort, 'meerwerk');
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
    for (const haak of ['data-nb-samen', 'data-nb-depot', 'data-nb-schema', 'data-nb-aanpas="depot"', 'data-nb-schemaknop', 'data-scherm="schema"', 'data-sc-lijst', 'data-sc-totaal', 'data-sc-meerwerklijst', 'data-sc-stapel', 'id="meer-instellingen"', 'id="termijnschema"']) {
        assert.ok(html.includes(haak), haak);
    }
    // Elk scherm van de logica staat in de pagina, met een streepje in de voortgang.
    for (const stap of STAPPEN) assert.ok(html.includes(`data-scherm="${stap}"`) && html.includes(`Stap ${stap} van ${STAPPEN.length}`), `stap ${stap}`);
    assert.equal((html.match(/<ol class="nb-voortgang"[^>]*>(.*?)<\/ol>/)[1].match(/<li>/g) ?? []).length, STAPPEN.length);
});
