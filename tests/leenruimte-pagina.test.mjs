/**
 * leenruimte.html: de bedragen in de tekst komen uit de rekenkern, de
 * standaardinvoer is het voorbeeld uit die tekst, en het adres is aangesloten.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { berekenLeenruimte } from '../src/domain/leenruimte.js';

const html = readFileSync(new URL('../leenruimte.html', import.meta.url), 'utf8');
const bedrag = (n) => `&euro;&nbsp;${Math.round(n).toLocaleString("nl-NL")}`;
const standaard = (id) => html.match(new RegExp(`id="${id}"[^>]*value="([^"]*)"`))[1];

// Het voorbeeld uit de tekst, gelijk aan de standaardinvoer van de tool.
const VOORBEELD = { inkomen: 48000, inkomenPartner: 24000, rentePercent: 3.9, tienJaarVast: true, hypotheek: 280000, waarde: 420000, verbouwing: 60000, energiebesparend: 0, label: 'CD' };

test('de standaardinvoer is het voorbeeld uit de tekst', () => {
    assert.equal(standaard('lr-inkomen'), '48.000');
    assert.equal(standaard('lr-partner'), '24.000');
    assert.equal(standaard('lr-hypotheek'), '280.000');
    assert.equal(standaard('lr-waarde'), '420.000');
    assert.equal(standaard('lr-rente'), '3,90');
    assert.equal(standaard('lr-verbouwing'), '60.000');
    assert.equal(standaard('lr-besparend'), '0');
    assert.match(html, /<option value="lang" selected>/);
    assert.match(html, /<option value="CD" selected>/);
});

test('de bedragen in de antwoorden komen uit de rekenkern', () => {
    const basis = berekenLeenruimte(VOORBEELD);
    const verduurzaamd = berekenLeenruimte({ ...VOORBEELD, energiebesparend: 20000, label: 'EFG' });
    const kort = berekenLeenruimte({ ...VOORBEELD, tienJaarVast: false });
    const antwoord = (naam) => html.match(new RegExp(`data-lr-antwoord="${naam}">([\\s\\S]*?)</p>`))[1];

    assert.equal(basis.grens, 'inkomen');
    assert.ok(antwoord('hoeveel').includes(bedrag(basis.extra)), `extra ${bedrag(basis.extra)}`);
    assert.ok(antwoord('hoeveel').includes(bedrag(basis.maximaal)), `maximaal ${bedrag(basis.maximaal)}`);
    assert.ok(antwoord('verduurzamen').includes(bedrag(verduurzaamd.extra)), `verduurzaamd ${bedrag(verduurzaamd.extra)}`);
    assert.ok(antwoord('rentevast').includes(bedrag(kort.extra)), `kort vast ${bedrag(kort.extra)}`);
    // In het voorbeeld past alles binnen de verbouwing, dus het extra bedrag is het bouwdepot.
    for (const u of [basis, verduurzaamd, kort]) assert.ok(u.extra <= VOORBEELD.verbouwing);
});

test('de vragen op de pagina en in de gestructureerde data zeggen hetzelfde', () => {
    const faq = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((j) => j['@type'] === 'FAQPage');
    const zichtbaar = [...html.matchAll(/<article>\s*<h3>([^<]+)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g)]
        .map((m) => [m[1], m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&euro;/g, '€')]);
    assert.equal(faq.mainEntity.length, zichtbaar.length);
    faq.mainEntity.forEach((v, i) => {
        assert.equal(v.name, zichtbaar[i][0]);
        assert.equal(v.acceptedAnswer.text, zichtbaar[i][1]);
    });
});

test('adres, kop en aansluiting', () => {
    assert.match(html, /<title>Hoeveel bouwdepot kan ik krijgen\? Reken je leenruimte uit<\/title>/);
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    assert.match(html, /<h1 id="reken-titel">Hoeveel bouwdepot kun je krijgen\?<\/h1>/);
    assert.ok(html.includes('<link rel="canonical" href="https://www.bouwdepotcalculator.nl/leenruimte.html">'));

    const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
    assert.ok(!vercel.redirects.some((r) => r.source === '/leenruimte.html'), 'de pagina zelf wordt niet meer doorgestuurd');
    for (const bron of ['/maximale-bouwdepot.html', '/eigen-geld-bouwdepot.html']) {
        assert.equal(vercel.redirects.find((r) => r.source === bron)?.destination, '/leenruimte.html', bron);
    }
    const nav = JSON.parse(readFileSync(new URL('../data/navigatie.json', import.meta.url), 'utf8'));
    assert.ok(JSON.stringify(nav).includes('"href":"leenruimte.html"'), 'het menu wijst naar de pagina');
});
