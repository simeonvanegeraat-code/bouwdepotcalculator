/**
 * Bewaakt de kaart die verschijnt als iemand een link deelt in WhatsApp,
 * LinkedIn of Slack.
 *
 * Die kaart leest `og:title`, `og:description` en `og:url` in plaats van de
 * gewone titel en omschrijving. Dat betekent dat dezelfde tekst op twee plekken
 * in de kop staat, en dat is precies het soort verdubbeling dat stilletjes uit
 * elkaar loopt: iemand kort de titel in en vergeet de og-variant, waarna de
 * gedeelde link een maand later nog de oude belofte toont.
 *
 * Deze test maakt die verdubbeling veilig door hard te falen zodra de twee niet
 * meer gelijk zijn. Zonder de test zou de tweede set beter niet kunnen bestaan.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const paginas = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

const haal = (html, patroon) => (html.match(patroon) || [])[1] ?? null;

const velden = (html) => ({
    titel: haal(html, /<title>([^<]*)<\/title>/),
    omschrijving: haal(html, /<meta name="description" content="([^"]*)">/),
    canoniek: haal(html, /<link rel="canonical" href="([^"]*)">/),
    ogTitel: haal(html, /<meta property="og:title" content="([^"]*)">/),
    ogOmschrijving: haal(html, /<meta property="og:description" content="([^"]*)">/),
    ogUrl: haal(html, /<meta property="og:url" content="([^"]*)">/),
    twTitel: haal(html, /<meta name="twitter:title" content="([^"]*)">/),
    twOmschrijving: haal(html, /<meta name="twitter:description" content="([^"]*)">/),
});

test('elke pagina heeft een deelkaart', () => {
    const ontbreekt = [];
    for (const bestand of paginas) {
        const v = velden(fs.readFileSync(path.join(ROOT, bestand), 'utf8'));
        for (const [naam, waarde] of Object.entries(v)) {
            if (!waarde) ontbreekt.push(`${bestand}: ${naam}`);
        }
    }
    assert.deepEqual(ontbreekt, [], `deze velden ontbreken:\n    ${ontbreekt.join('\n    ')}`);
});

test('de deelkaart zegt hetzelfde als de pagina zelf', () => {
    const afwijkend = [];
    for (const bestand of paginas) {
        const v = velden(fs.readFileSync(path.join(ROOT, bestand), 'utf8'));
        if (v.ogTitel !== v.titel) afwijkend.push(`${bestand}: og:title wijkt af van <title>`);
        if (v.twTitel !== v.titel) afwijkend.push(`${bestand}: twitter:title wijkt af van <title>`);
        if (v.ogOmschrijving !== v.omschrijving) afwijkend.push(`${bestand}: og:description wijkt af van de metabeschrijving`);
        if (v.twOmschrijving !== v.omschrijving) afwijkend.push(`${bestand}: twitter:description wijkt af van de metabeschrijving`);
        if (v.ogUrl !== v.canoniek) afwijkend.push(`${bestand}: og:url wijkt af van de canonieke URL`);
    }
    assert.deepEqual(afwijkend, [], `de kop spreekt zichzelf tegen:\n    ${afwijkend.join('\n    ')}`);
});

/**
 * Google kapt af op pixelbreedte, ongeveer 600px op desktop en 480px op mobiel.
 * In de praktijk komt dat neer op 50 tot 60 tekens voor een titel en 150 tot 160
 * voor een omschrijving. Eenentwintig titels stonden daarboven; deze test houdt
 * ze binnen de grens.
 */
test('titels en omschrijvingen passen in wat Google toont', () => {
    const teLang = [];
    for (const bestand of paginas) {
        const v = velden(fs.readFileSync(path.join(ROOT, bestand), 'utf8'));
        if (v.titel.length > 60) teLang.push(`${bestand}: titel ${v.titel.length} tekens`);
        if (v.omschrijving.length > 160) teLang.push(`${bestand}: omschrijving ${v.omschrijving.length} tekens`);
    }
    assert.deepEqual(teLang, [], `wordt afgekapt in de zoekresultaten:\n    ${teLang.join('\n    ')}`);
});

test('geen twee pagina\'s delen een titel of omschrijving', () => {
    const titels = new Map();
    const omschrijvingen = new Map();
    const botsingen = [];

    for (const bestand of paginas) {
        const v = velden(fs.readFileSync(path.join(ROOT, bestand), 'utf8'));
        if (titels.has(v.titel)) botsingen.push(`titel gedeeld door ${titels.get(v.titel)} en ${bestand}`);
        else titels.set(v.titel, bestand);
        if (omschrijvingen.has(v.omschrijving)) botsingen.push(`omschrijving gedeeld door ${omschrijvingen.get(v.omschrijving)} en ${bestand}`);
        else omschrijvingen.set(v.omschrijving, bestand);
    }
    assert.deepEqual(botsingen, [], `Google ziet deze pagina's als dubbel:\n    ${botsingen.join('\n    ')}`);
});
