/**
 * Bewaakt dat elke pagina ook echt wordt gebouwd en gevonden.
 *
 * Aanleiding: bij het uitbreiden van acht naar twaalf geldverstrekkers werden
 * vier aanbiederpagina's wel gegenereerd, maar niet toegevoegd aan
 * vite.config.js en public/sitemap.xml. Ze stonden dus in de repo, kwamen niet
 * in de build en waren voor Google onvindbaar — zonder dat iets faalde.
 *
 * De routine stond in CLAUDE.md maar werd door niets afgedwongen. Nu wel.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const paginas = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const vite = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8');
const sitemap = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf8');

test('elke pagina heeft een ingang in vite.config.js', () => {
    const ontbreekt = paginas.filter((p) => !vite.includes(`'${p}'`));
    assert.deepEqual(ontbreekt, [],
        `deze pagina's komen niet in de build: ${ontbreekt.join(', ')}`);
});

test('elke pagina staat in de sitemap', () => {
    // De homepage staat als "/" in de sitemap, niet als index.html.
    const ontbreekt = paginas
        .filter((p) => p !== 'index.html')
        .filter((p) => !sitemap.includes(`/${p}</loc>`));
    assert.deepEqual(ontbreekt, [],
        `deze pagina's staan niet in de sitemap: ${ontbreekt.join(', ')}`);
});

test('de sitemap verwijst niet naar pagina\'s die niet meer bestaan', () => {
    const bestaat = new Set(paginas);
    const dood = [...sitemap.matchAll(/<loc>https:\/\/www\.bouwdepotcalculator\.nl\/([a-z0-9-]+\.html)<\/loc>/g)]
        .map((m) => m[1])
        .filter((p) => !bestaat.has(p));
    assert.deepEqual(dood, [],
        `de sitemap noemt verdwenen pagina's: ${dood.join(', ')}`);
});

test('elke aanbieder uit de data heeft een eigen pagina', () => {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));
    const ontbreekt = data.aanbieders
        .map((a) => `bouwdepot-${a.id}.html`)
        .filter((p) => !paginas.includes(p));
    assert.deepEqual(ontbreekt, [],
        `draai npm run build:voorwaarden; deze pagina's ontbreken: ${ontbreekt.join(', ')}`);
});
