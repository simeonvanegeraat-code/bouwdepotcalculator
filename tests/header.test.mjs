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

/** De header zonder de markering van de huidige pagina; die verschilt per pagina. */
const zonderMarkering = (h) => h.replaceAll(' aria-current="page"', '');

test('elke pagina heeft precies dezelfde header', () => {
    const eerste = zonderMarkering(kop(paginas[0]));
    for (const p of paginas) {
        assert.equal(zonderMarkering(kop(p)), eerste,
            `${p} heeft een andere header dan ${paginas[0]}; draai npm run build:header`);
    }
});

test('de header markeert de pagina waar je bent, en alleen die', () => {
    const inMenu = new Set([
        ...NAV.hoofd.map((i) => i.href),
        ...NAV.rekenhulpen.groepen.flatMap((g) => g.items.map((i) => i.href)),
    ]);
    for (const p of paginas) {
        const gemarkeerd = [...kop(p).matchAll(/href="([^"]+)" aria-current="page"/g)].map((m) => m[1]);
        // Een hoofditem staat in de kop en nog een keer in het paneel voor de telefoon.
        const verwacht = inMenu.has(p) ? [p] : [];
        assert.deepEqual([...new Set(gemarkeerd)], verwacht, `${p} markeert ${gemarkeerd.join(', ') || 'niets'}`);
    }
});

test('het menu noemt geen aantallen die uit de data komen', () => {
    // "De acht redenen" stond er nog toen de declaratiegids er zeven telde.
    for (const g of NAV.rekenhulpen.groepen) {
        for (const i of g.items) {
            assert.doesNotMatch(i.uitleg || '', /\b(twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf|dertien|\d+)\b/i, i.label);
        }
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

    const css = fs.readFileSync(path.join(ROOT, 'src/styles/next/kop.css'), 'utf8');
    assert.ok(css.includes('@supports selector(:popover-open)'),
        'de CSS schakelt de knop niet in achter een @supports-test');
    assert.match(css, /\.bs-paneel\s*\{[^}]*display:\s*none/,
        'het paneel staat niet standaard dicht; zonder popover zou het permanent openstaan');
});

test('elke link in het menu wijst naar een pagina en een anker die bestaan', () => {
    // Een pagina die wordt hernoemd of verwijderd, of een kop die zijn id
    // verliest, laat anders een dode link achter op alle pagina's tegelijk.
    const links = [
        { label: NAV.rekenhulpen.label, href: NAV.rekenhulpen.terugval },
        ...NAV.hoofd,
        ...NAV.rekenhulpen.groepen.flatMap((g) => g.items),
    ];
    for (const { label, href } of links) {
        const [pad, anker] = href.split('#');
        const bestand = pad === '/' || pad === '' ? 'index.html' : pad.replace(/^\//, '');
        assert.ok(fs.existsSync(path.join(ROOT, bestand)), `"${label}" wijst naar ${bestand}, dat niet bestaat`);
        if (anker) {
            const html = fs.readFileSync(path.join(ROOT, bestand), 'utf8');
            assert.ok(html.includes(`id="${anker}"`), `"${label}" wijst naar #${anker}, dat niet op ${bestand} staat`);
        }
    }
});

test('elke rekenpagina staat in het menu', () => {
    // Een nieuwe rekentool die niet in data/navigatie.json komt, is alleen te
    // vinden voor wie het adres al kent.
    const inMenu = new Set(NAV.rekenhulpen.groepen.flatMap((g) => g.items.map((i) => i.href.split('#')[0])));
    for (const p of paginas) {
        const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
        if (!/class="[^"]*\bwr-invoer\b/.test(html)) continue;
        assert.ok(inMenu.has(p), `${p} heeft een rekenformulier maar staat niet in het menu`);
    }
});

/** De voettekst van een pagina, met links vanaf de root gelijkgetrokken (de 404-pagina). */
function voet(bestand) {
    const html = fs.readFileSync(path.join(ROOT, bestand), 'utf8');
    const start = html.indexOf('<footer class="ui-voet');
    const eind = html.indexOf('</footer>', start);
    assert.ok(start >= 0 && eind > start, `${bestand} heeft geen voettekst`);
    return html.slice(start, eind).replace(/\r\n/g, '\n').replaceAll('href="/', 'href="');
}

test('elke pagina heeft dezelfde voettekst, met de gebruiksvoorwaarden erin', () => {
    // Hij stond met de hand in elke pagina en was in drie varianten uit elkaar
    // gelopen; 26 van de 32 pagina's misten de link naar de voorwaarden.
    const eerste = voet(paginas[0]);
    for (const p of paginas) {
        assert.equal(voet(p), eerste, `${p} heeft een andere voettekst dan ${paginas[0]}; draai npm run build:header`);
    }
    for (const { href } of NAV.voet.links) {
        assert.ok(eerste.includes(`href="${href}"`), `de voettekst mist ${href}`);
        assert.ok(fs.existsSync(path.join(ROOT, href)), `de voettekst wijst naar ${href}, dat niet bestaat`);
    }
    assert.ok(NAV.voet.links.some((i) => i.href === 'voorwaarden.html'), 'de gebruiksvoorwaarden staan niet in de voettekst');
});
