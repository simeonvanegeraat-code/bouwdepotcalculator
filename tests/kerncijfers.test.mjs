/**
 * Bewaakt dat de cijfers die met de hand in pagina's staan blijven kloppen met
 * data/bouwdepot-voorwaarden.json.
 *
 * Aanleiding: toen bij twee aanbieders het restant alsnog werd gevonden, zakte
 * het aantal niet-gepubliceerde gegevens van 19 naar 17, terwijl op de homepage
 * nog 19 stond. De gegenereerde pagina's rekenen zulke cijfers zelf uit; de
 * handgeschreven pagina's niet. Deze test vangt dat verschil op.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const lees = (bestand) => fs.readFileSync(path.join(ROOT, bestand), 'utf8');

/** De cijfers zoals ze uit de data volgen. */
const totaal = (basis, extra) =>
    typeof basis === 'number' && typeof extra === 'number' ? basis + extra : null;

const verbouwtermijnen = data.aanbieders
    .map((a) => totaal(a.looptijdVerbouwMaanden, a.verlengingMaanden?.verbouw))
    .filter((n) => n != null);

const zonderVergoeding = data.aanbieders.filter((a) => /^geen/i.test(a.rentevergoeding?.waarde || ''));

const vergoedingStoptEerder = data.aanbieders.filter((a) => {
    if (/^geen/i.test(a.rentevergoeding?.waarde || '')) return false;
    const tekst = `${a.rentevergoeding?.waarde || ''} ${a.rentevergoeding?.detail || ''}`;
    return /beperkt|stopt|geen rente|eerste \d+ maanden|na \d+ maanden|maximaal \d+ maanden|voorbij \d+ jaar/i.test(tekst);
});

const nietGepubliceerd = data.aanbieders.reduce(
    (n, a) => n + ['maxPerOpname', 'minPerOpname', 'restant', 'eigenArbeid']
        .filter((k) => a[k]?.status === 'niet-gepubliceerd').length,
    0
);

test('de kern-cijfers op index.html komen overeen met de data', () => {
    const html = lees('index.html');
    const min = Math.min(...verbouwtermijnen);
    const max = Math.max(...verbouwtermijnen);

    assert.match(html, new RegExp(`${min}&ndash;${max}`),
        `verbouwtermijn zou ${min}-${max} maanden moeten zijn`);

    const metVergoeding = data.aanbieders.length - zonderVergoeding.length;
    assert.match(html, new RegExp(`>${metVergoeding}<span class="kern__van">/${data.aanbieders.length}<`),
        `${metVergoeding} van ${data.aanbieders.length} aanbieders betaalt depotrente`);

    assert.match(html, new RegExp(`kern__cijfer tnum">${nietGepubliceerd}<`),
        `er zijn ${nietGepubliceerd} niet-gepubliceerde gegevens, niet het getal dat op de pagina staat`);
});

test('de kern-cijfers op maandlasten-bouwdepot.html komen overeen met de data', () => {
    const html = lees('maandlasten-bouwdepot.html');
    const metVergoeding = data.aanbieders.length - zonderVergoeding.length;
    assert.match(html, new RegExp(`>${metVergoeding}<span class="kern__van">/${data.aanbieders.length}<`),
        `${metVergoeding} van ${data.aanbieders.length} aanbieders betaalt depotrente`);
});

test('de kern-cijfers op renteverlies-bouwdepot.html komen overeen met de data', () => {
    const html = lees('renteverlies-bouwdepot.html');

    assert.match(html, new RegExp(`>${zonderVergoeding.length}<span class="kern__van">/${data.aanbieders.length}<`),
        `${zonderVergoeding.length} van ${data.aanbieders.length} aanbieders kent geen renteverlies`);

    assert.match(html, new RegExp(`>${vergoedingStoptEerder.length}<span class="kern__van">/${data.aanbieders.length}<`),
        `bij ${vergoedingStoptEerder.length} van ${data.aanbieders.length} aanbieders stopt de vergoeding eerder`);
});

test('de verbouwtermijn wordt overal gelijk genoemd', () => {
    const min = Math.min(...verbouwtermijnen);
    const max = Math.max(...verbouwtermijnen);
    const bereik = new RegExp(`${min}\\s*(?:&ndash;|tot|-)\\s*${max}`);

    for (const bestand of ['index.html', 'nieuwbouw.html', 'kennisbank.html', 'bouwdepot-fouten.html', 'hypotheekrenteaftrek-gids.html']) {
        const html = lees(bestand);
        if (!/24|42/.test(html)) continue;
        assert.match(html, bereik, `${bestand} noemt een ander bereik dan ${min}-${max} maanden`);
    }
});
