/**
 * Bewaakt het antwoord bovenaan en de drie doorgerekende voorbeelden op
 * dubbele-lasten-nieuwbouw.html.
 *
 * De voorbeeldknoppen bij de rekentool (data-voorbeeld) zijn de bron. De tabel
 * zet hun uitkomsten naast elkaar; die bedragen staan met de hand in de HTML,
 * zodat ze er ook zonder JavaScript zijn. Deze test faalt zodra knoppen, tabel,
 * tekst en rekenkern uit elkaar lopen.
 *
 * De verwachte uitkomsten staan hier ook los uitgerekend, zonder het model.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { berekenOverlap, STANDAARD_OVERLAP as S } from '../src/domain/dubbelelasten.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'dubbele-lasten-nieuwbouw.html'), 'utf8');
const sectie = html.match(/<section[^>]*id="voorbeelden"[\s\S]*?<\/section>/)?.[0] ?? '';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const plat = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&euro;/g, '€').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ').trim();
const bedrag = (n) => plat(euro.format(n));
const getal = (s) => Number(s.replace(/\./g, '').replace(',', '.'));

// De voorbeeldknoppen, met hun invoer en hun opschrift.
const knoppen = [...html.matchAll(/<button[^>]*data-voorbeeld([^>]*)>([^<]*)<\/button>/g)].map(([, attrs, label]) => {
    const d = Object.fromEntries([...attrs.matchAll(/data-(\w+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
    return {
        label: label.trim(), soort: d.soort,
        invoer: { huidig: Number(d.huidig), nieuw: Number(d.nieuw), vergoeding: Number(d.vergoeding), extra: Number(d.extra), maanden: Number(d.maanden) },
    };
});

test('het model geeft de met de hand nagerekende uitkomsten', () => {
    // Per maand: huidig + extra + (nieuw - vergoeding); bovenop: (nieuw - vergoeding) + extra.
    const huur = berekenOverlap({ huidig: 1100, nieuw: 1550, vergoeding: 0, extra: 100, maanden: 6 });
    assert.equal(huur.perMaand, 1100 + 100 + 1550);       // 2.750
    assert.equal(huur.totaalBovenop, (1550 + 100) * 6);   // 9.900
    const koop = berekenOverlap({ huidig: 1450, nieuw: 1850, vergoeding: 300, extra: 150, maanden: 12 });
    assert.equal(koop.perMaand, 1450 + 150 + 1550);       // 3.150
    assert.equal(koop.totaalBovenop, (1550 + 150) * 12);  // 20.400
    const zwaar = berekenOverlap({ huidig: 1600, nieuw: 2100, vergoeding: 0, extra: 300, maanden: 9 });
    assert.equal(zwaar.perMaand, 1600 + 300 + 2100);      // 4.000
    assert.equal(zwaar.totaalBovenop, (2100 + 300) * 9);  // 21.600
});

test('de tabel is per voorbeeldknop de uitkomst van de rekenkern', () => {
    assert.ok(sectie, 'de sectie met id="voorbeelden" ontbreekt');
    assert.equal(knoppen.length, 3, 'verwacht drie voorbeeldknoppen');
    const rijen = [...sectie.match(/<tbody data-vb-tabel>([\s\S]*?)<\/tbody>/)[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
        .map((m) => [...m[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => plat(c[1])));
    assert.equal(rijen.length, knoppen.length);

    knoppen.forEach(({ label, soort, invoer }, i) => {
        const o = berekenOverlap(invoer);
        const [wat, perMaand, bovenop, kost] = rijen[i];
        assert.ok(wat.startsWith(label.split(',')[0]), `rij ${i + 1} hoort bij de knop "${label}"`);
        assert.ok(wat.includes(`${invoer.maanden} maanden`), `rij ${i + 1}: duur`);
        assert.ok(wat.includes(`${bedrag(invoer.huidig)} ${soort === 'huur' ? 'huur' : 'oude hypotheek'}`), `rij ${i + 1}: huidige woonlast`);
        assert.ok(wat.includes(`${bedrag(invoer.nieuw)} nieuwe hypotheek`), `rij ${i + 1}: nieuwe hypotheek`);
        assert.equal(wat.includes('depotvergoeding'), invoer.vergoeding > 0, `rij ${i + 1}: depotvergoeding alleen als die er is`);
        if (invoer.vergoeding > 0) assert.ok(wat.includes(`min ${bedrag(invoer.vergoeding)} depotvergoeding`), `rij ${i + 1}: vergoeding`);
        assert.ok(wat.includes(`${bedrag(invoer.extra)} extra`), `rij ${i + 1}: extra lasten`);
        assert.equal(perMaand, bedrag(o.perMaand), `rij ${i + 1}: per maand`);
        assert.equal(bovenop, bedrag(o.bovenop), `rij ${i + 1}: bovenop`);
        assert.equal(kost, bedrag(o.totaalBovenop), `rij ${i + 1}: wat de overlap kost`);
    });
});

test('de conclusie onder de tabel klopt met de voorbeelden', () => {
    const [huur, koop] = knoppen.map((k) => ({ ...k, o: berekenOverlap(k.invoer) }));
    const verschil = koop.o.bovenop - huur.o.bovenop;
    const conclusie = plat(sectie.match(/<p class="wr-hulp" data-vb-conclusie>([\s\S]*?)<\/p>/)[1]);
    assert.ok(conclusie.includes(`maar ${bedrag(verschil)} meer`), 'het verschil per maand');
    assert.ok(koop.invoer.vergoeding > 0 && koop.o.bovenop + koop.invoer.vergoeding - huur.o.bovenop > verschil, '"dankzij de depotvergoeding"');
    assert.equal(koop.invoer.maanden / huur.invoer.maanden, 2, '"twee keer zo lang"');
    const factor = koop.o.totaalBovenop / huur.o.totaalBovenop;
    assert.ok(factor > 2 && factor < 2.5, `"ruim twee keer zoveel", maar het is ${factor.toFixed(2)} keer`);
});

test('het antwoord bovenaan is de standaardinvoer en het eerste voorbeeld', () => {
    const o = berekenOverlap();
    const verwacht = { huidig: S.huidig, nieuw: S.nieuw, extra: S.extra, permaand: o.perMaand, kost: o.totaalBovenop };
    const lead = html.match(/<p class="wr-lead">([\s\S]*?)<\/p>/)[1];
    const gevonden = [...lead.matchAll(/data-vb="([a-z]+)"[^>]*>([^<]*)</g)];
    assert.deepEqual(gevonden.map(([, n]) => n).sort(), Object.keys(verwacht).sort());
    for (const [, naam, tekst] of gevonden) assert.equal(plat(tekst), bedrag(verwacht[naam]), `het bedrag "${naam}"`);
    assert.equal(S.maanden, 6, 'de tekst zegt "zes maanden"');
    assert.equal(S.vergoeding, 0, 'de tekst noemt geen depotvergoeding');
    assert.deepEqual(knoppen[0].invoer, { huidig: S.huidig, nieuw: S.nieuw, vergoeding: S.vergoeding, extra: S.extra, maanden: S.maanden });

    // En de rekentool begint met dezelfde invoer.
    const waarde = (id) => getal(html.match(new RegExp(`id="${id}"[^>]*value="([^"]*)"`))[1]);
    assert.equal(waarde('input-dubbel-current'), S.huidig);
    assert.equal(waarde('input-dubbel-new-bruto'), S.nieuw);
    assert.equal(waarde('input-dubbel-months'), S.maanden);
    assert.equal(waarde('input-dubbel-extra'), S.extra);
    assert.equal(waarde('input-dubbel-vergoeding'), S.vergoeding);
});
