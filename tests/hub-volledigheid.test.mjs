/**
 * Bewaakt dat de vergelijkingspagina toont wat er in de data zit.
 *
 * Aanleiding: de hub liet vier feiten per aanbieder zien terwijl de dataset er
 * dertien bevatte. Zes velden waren opgezocht, geverifieerd en getest, maar
 * stonden alleen op de losse aanbiederpagina's. Dat is precies het verkeerde
 * gat: de pagina die "vergelijken" heet toonde het minst.
 *
 * Deze test faalt zodra een veld uit de data niet meer op de hub belandt.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));
const hub = fs.readFileSync(path.join(ROOT, 'bouwdepot-voorwaarden-vergelijken.html'), 'utf8');

/** De labels waaronder elk datagegeven op de hub hoort te staan. */
const VERWACHTE_LABELS = [
    'Vergoeding over depot',
    'Hoogte van die vergoeding',
    'Vergoeding loopt',
    'Wat mag eruit betaald worden',
    'Bewijsstuk bij declareren',
    'Manier van opnemen',
    'Uitbetaling',
    'Zelf voorschieten',
    'Verlengen regelen',
    'Grens per opname',
    'Minimum per opname',
    'Eigen arbeid declarabel',
    'Restant bij beëindiging',
];

test('elk feit staat voor elke aanbieder op de vergelijkingspagina', () => {
    for (const label of VERWACHTE_LABELS) {
        const aantal = hub.split(`<dt>${label}</dt>`).length - 1;
        assert.equal(
            aantal, data.aanbieders.length,
            `"${label}" staat ${aantal} keer op de hub, verwacht ${data.aanbieders.length} keer`,
        );
    }
});

test('de hub toont evenveel feiten als de aanbiederpagina', () => {
    // De hub mag samenvatten, maar niet minder gegevens tonen dan de detailpagina;
    // dan is de vergelijking geen vergelijking meer.
    const detail = fs.readFileSync(path.join(ROOT, `bouwdepot-${data.aanbieders[0].id}.html`), 'utf8');
    const tel = (html) => (html.match(/<dt>/g) || []).length;
    const BALKEN = 3;   // looptijd verbouw, looptijd nieuwbouw en verlenging staan als balk
    const perAanbiederOpHub = tel(hub) / data.aanbieders.length + BALKEN;
    assert.ok(
        perAanbiederOpHub >= tel(detail),
        `de hub toont ${perAanbiederOpHub} feiten per aanbieder tegenover ${tel(detail)} op de detailpagina`,
    );
});

test('wat geen enkele aanbieder publiceert wordt als bevinding benoemd', () => {
    // Een kolom die bij iedereen leeg is, is zelf informatie. Zes streepjes zonder
    // uitleg maken de pagina schraler; de bevinding maakt hem rijker.
    const overalLeeg = ['minPerOpname', 'eigenArbeid'].filter((k) =>
        data.aanbieders.every((a) => a[k]?.status === 'niet-gepubliceerd' || a[k]?.waarde == null),
    );
    if (!overalLeeg.length) return;

    assert.match(
        hub, /Wat geen enkele aanbieder publiceert/,
        'er zijn velden die bij alle aanbieders ontbreken, maar de pagina benoemt dat niet',
    );
    assert.match(
        hub, /schriftelijk navragen/,
        'de bevinding hoort te zeggen wat de bezoeker dan moet doen',
    );
});

test('de pagina legt uit waarom er geen rentepercentages staan', () => {
    // Zonder die uitleg leest het ontbreken van rentes als een gat in plaats van
    // als een keuze, terwijl het juist de reden is dat de cijfers niet verouderen.
    assert.match(hub, /Wij publiceren geen hypotheekrentes/);

    const berekenbaar = data.aanbieders.filter((a) =>
        ['gelijk-aan-hypotheekrente', 'hypotheekrente-min-1'].includes(a.rentevergoeding?.tarief?.verbouw),
    ).length;
    assert.match(
        hub, new RegExp(`Bij ${berekenbaar} van de ${data.aanbieders.length} aanbieders`),
        `de tekst hoort te zeggen dat het bij ${berekenbaar} aanbieders uit te rekenen is`,
    );
});
