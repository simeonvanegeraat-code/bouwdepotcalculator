/**
 * Bewaakt dat de header op elke pagina dezelfde is en blijft doen waar hij voor is.
 *
 * Hij stond in 26 bestanden plus drie generatoren en was uit elkaar gelopen:
 * zes pagina's hadden zes verschillende navigaties, drie toonden het woord
 * "Uitleg" twee keer met verschillende bestemmingen, en onder 760px werd alles
 * op één link na verborgen zonder vervanging. Een bezoeker op een telefoon kon
 * de rekentools niet bereiken.
 *
 * Deze test faalt zodra iemand een header met de hand aanpast in plaats van in
 * data/navigatie.json.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAV = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/navigatie.json'), 'utf8'));

const paginas = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

function kop(bestand) {
    const html = fs.readFileSync(path.join(ROOT, bestand), 'utf8');
    const start = html.indexOf('<header class="bs-kop');
    const eind = html.indexOf('</header>', start);
    assert.ok(start >= 0 && eind > start, `${bestand} heeft geen header`);
    return html.slice(start, eind).replace(/\r\n/g, '\n');
}

test('elke pagina heeft precies dezelfde header', () => {
    const eerste = kop(paginas[0]);
    for (const p of paginas) {
        assert.equal(kop(p), eerste,
            `${p} heeft een andere header dan ${paginas[0]}; draai npm run build:header`);
    }
});

test('de header linkt naar elke rekenhulp uit de navigatiebron', () => {
    const h = kop(paginas[0]);
    for (const groep of NAV.rekenhulpen.groepen) {
        for (const item of groep.items) {
            assert.ok(h.includes(`href="${item.href}"`),
                `de header mist de link naar ${item.label} (${item.href})`);
        }
    }
});

test('de header bevat geen on-page-ankers', () => {
    // Een anker als #uitleg bestaat maar op één pagina, terwijl de header op
    // alle 26 staat. Zo kreeg hetzelfde woord twee betekenissen.
    const h = kop(paginas[0]);
    const ankers = [...h.matchAll(/href="(#[^"]*)"/g)].map((m) => m[1]);
    assert.deepEqual(ankers, [], `de header verwijst naar ${ankers.join(', ')}`);
});

test('elk label in de header wijst maar naar één bestemming', () => {
    // De oude fout was niet de herhaling zelf: het was dat "Uitleg" twee keer
    // stond met twee verschillende doelen. Hetzelfde label mag dus voorkomen
    // in de kop én in het paneel, zolang het maar hetzelfde bedoelt.
    const h = kop(paginas[0]);
    const perLabel = new Map();
    for (const m of h.matchAll(/href="([^"]+)"[^>]*>\s*(?:<strong>)?([A-Za-z][^<]*?)\s*(?:<\/strong>)?\s*</g)) {
        const [, href, label] = m;
        if (!perLabel.has(label)) perLabel.set(label, new Set());
        perLabel.get(label).add(href);
    }
    for (const [label, hrefs] of perLabel) {
        assert.equal(hrefs.size, 1,
            `"${label}" wijst naar ${[...hrefs].join(' en ')}`);
    }
});

test('het paneel valt terug op een echte link zonder popover-ondersteuning', () => {
    const h = kop(paginas[0]);
    assert.ok(h.includes('popovertarget="rekenhulpen"'), 'de knop opent het paneel niet');
    assert.ok(h.includes(`class="bs-kop__terugval" href="${NAV.rekenhulpen.terugval}"`),
        'de terugvallink ontbreekt; zonder popover is de navigatie dan weg');

    const css = fs.readFileSync(path.join(ROOT, 'src/styles/broadsheet.css'), 'utf8');
    assert.ok(css.includes('@supports selector(:popover-open)'),
        'de CSS schakelt de knop niet in achter een @supports-test');
    assert.match(css, /\.bs-paneel\s*\{[^}]*display:\s*none/,
        'het paneel staat niet standaard dicht; zonder popover zou het permanent openstaan');
});
