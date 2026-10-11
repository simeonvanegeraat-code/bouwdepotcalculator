/**
 * Het overzicht dat de bezoeker print of als PDF bewaart (src/js/afdrukdocument.js).
 *
 * Aanleiding: bij het omzetten naar de nieuwe vormgeving bleef dit document de
 * klassen van de oude stylesheet gebruiken. De pagina's laadden die niet meer,
 * dus stond het overzicht onopgemaakt onderaan de pagina, zichtbaar op het
 * scherm, en ging bij het printen de hele pagina mee. Geen test die het zag.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { bouwAfdrukdocument } from '../src/js/afdrukdocument.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'src/styles/next/werkruimte.css'), 'utf8');
const bron = fs.readFileSync(path.join(ROOT, 'src/js/afdrukdocument.js'), 'utf8');

const rapport = {
    toolTitle: 'Bouwdepot berekenen',
    generatedAt: '2026-10-11T10:00:00Z',
    url: 'bouwdepotcalculator.nl/bouwdepot-berekenen.html',
    inputs: [{ label: 'Depotbedrag', value: '€ 25.000' }],
    results: [{ label: 'Bruto per maand', value: '€ 116' }],
    tables: [{ title: 'Maandverloop', columns: [{ label: 'Maand' }, { label: 'Last', align: 'right' }], rows: [['1', '€ 116']] }],
    conclusion: 'Een <b>conclusie</b>.',
    assumptions: 'Annuïtair, 30 jaar.',
};

test('elke klasse in het document heeft een stijl in werkruimte.css', () => {
    const html = bouwAfdrukdocument(rapport);
    const klassen = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)));
    assert.ok(klassen.size >= 5);
    for (const k of klassen) assert.ok(css.includes(`.${k}`), `.${k} staat niet in werkruimte.css`);
});

test('het vlak is op het scherm verborgen en tijdens het printen het enige wat zichtbaar is', () => {
    const vlak = bron.match(/vlak\.className = '([^']+)'/)[1].split(' ');
    assert.ok(vlak.includes('wr-alleen-print'));
    assert.match(css, /\.wr-alleen-print\s*\{\s*display:\s*none/);
    const bodyKlasse = bron.match(/classList\.add\('([^']+)'\)/)[1];
    assert.ok(css.includes(`body.${bodyKlasse} > :not(#afdrukdocument) { display: none !important; }`),
        'de pagina zelf wordt tijdens het printen niet verborgen');
});

test('het document bevat invoer, uitkomst, tabellen en het voorbehoud, en laat geen HTML uit invoer door', () => {
    const html = bouwAfdrukdocument(rapport);
    for (const stuk of ['Bouwdepot berekenen', 'Je invoer', 'Depotbedrag', 'Uitkomst', '€ 116', 'Maandverloop', 'Aannames', 'geen toezegging', 'bouwdepotcalculator.nl/bouwdepot-berekenen.html']) {
        assert.ok(html.includes(stuk), stuk);
    }
    assert.ok(html.includes('&lt;b&gt;conclusie&lt;/b&gt;') && !html.includes('<b>conclusie'));
    assert.ok(!bouwAfdrukdocument({ ...rapport, url: '' }).includes('zelf narekenen'));
});
