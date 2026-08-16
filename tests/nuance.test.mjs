/**
 * Bewaakt dat nuance niet verdwijnt tussen data en pagina.
 *
 * Aanleiding: een gebruiker met een lopend bouwdepot bij Rabobank meldde dat
 * "Max. per declaratie EUR 5.000" niet klopte met zijn praktijk. Het bedrag
 * stond correct in de data, maar de bijbehorende toelichting ("limiet zelf
 * verhoogbaar") stond alleen op de detailpagina. De vergelijkingspagina toonde
 * een kaal getal dat iets anders beweerde dan de bron.
 *
 * Bij het opsporen bleek dat nog zestien keer voor te komen, waaronder bij de
 * depotvergoeding van alle zes aanbieders. Deze test faalt zodra een veld met
 * een toelichting ergens zonder die toelichting wordt getoond.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const HUB = 'bouwdepot-voorwaarden-vergelijken.html';
const lees = (bestand) => fs.readFileSync(path.join(ROOT, bestand), 'utf8');

/** Zoals de generator escapet, zodat de vergelijking klopt. */
const esc = (s) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Velden die op de vergelijkingspagina worden getoond. */
const GETOOND_OP_HUB = ['rentevergoeding', 'maxPerOpname', 'restant'];

/** Alle velden met een mogelijke toelichting, voor de detailpagina's. */
const ALLE_VELDEN = [
    'rentevergoeding', 'maxPerOpname', 'minPerOpname', 'minimumDepot',
    'restant', 'eigenArbeid', 'verlengingMaanden',
];

test('elke toelichting op de vergelijkingspagina komt mee met zijn waarde', () => {
    const hub = lees(HUB);
    const ontbreekt = [];

    for (const a of data.aanbieders) {
        for (const veld of GETOOND_OP_HUB) {
            const detail = a[veld]?.detail;
            if (!detail) continue;
            if (!hub.includes(esc(detail))) ontbreekt.push(`${a.naam} / ${veld}`);
        }
    }

    assert.deepEqual(ontbreekt, [],
        `deze toelichtingen staan wel in de data maar niet op de vergelijkingspagina:\n  ${ontbreekt.join('\n  ')}`);
});

test('elke toelichting staat volledig op de detailpagina van de aanbieder', () => {
    const ontbreekt = [];

    for (const a of data.aanbieders) {
        const html = lees(`bouwdepot-${a.id}.html`);
        for (const veld of ALLE_VELDEN) {
            const detail = a[veld]?.detail;
            if (!detail) continue;
            if (!html.includes(esc(detail))) ontbreekt.push(`${a.naam} / ${veld}`);
        }
    }

    assert.deepEqual(ontbreekt, [],
        `deze toelichtingen ontbreken op de aanbiederpagina:\n  ${ontbreekt.join('\n  ')}`);
});

test('een waarde die "gedurende de looptijd" claimt mag geen beperking in de toelichting hebben', () => {
    // ABN AMRO stond met "Ja, gedurende de looptijd" terwijl de vergoeding bij
    // verlenging de laatste zes maanden stopt en bij nieuwbouw na dertig
    // maanden. De kop sprak de eigen toelichting tegen.
    const strijdig = [];

    for (const a of data.aanbieders) {
        const w = a.rentevergoeding?.waarde || '';
        const d = a.rentevergoeding?.detail || '';
        const claimtOnbeperkt = /gedurende de (hele )?looptijd|de gehele looptijd|onbeperkt/i.test(w);
        const noemtBeperking = /stopt|geen rente|maximaal \d+ maanden|eerste \d+ maanden|laatste \d+ maanden|na \d+ maanden|beperkt/i.test(d);
        if (claimtOnbeperkt && noemtBeperking) strijdig.push(`${a.naam}: "${w}" versus "${d.slice(0, 70)}..."`);
    }

    assert.deepEqual(strijdig, [],
        `de samenvatting spreekt de toelichting tegen:\n  ${strijdig.join('\n  ')}`);
});
