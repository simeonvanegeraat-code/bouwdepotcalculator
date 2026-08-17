/**
 * Bewaakt de afgeleide vergoedingsduur per aanbieder.
 *
 * De velden rentevergoeding.model en rentevergoeding.vergoedingMaanden zijn niet
 * letterlijk overgenomen van de aanbieder maar afgeleid uit de detailtekst.
 * Zoiets is precies het soort gegeven dat stilletjes uit de pas kan gaan lopen
 * met de bron zodra de detailtekst wordt bijgewerkt. Deze test controleert de
 * afleiding tegen de tekst waar hij uit komt, en tegen de looptijden.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const MODELLEN = ['beperkt-in-duur', 'rente-alleen-over-opgenomen'];
const TARIEVEN = ['gelijk-aan-hypotheekrente', 'hypotheekrente-min-1', 'geen', 'niet-gepubliceerd'];

const maxLooptijd = (a, soort) => {
    const basis = soort === 'verbouw' ? a.looptijdVerbouwMaanden : a.looptijdNieuwbouwMaanden;
    const extra = a.verlengingMaanden?.[soort];
    if (typeof basis !== 'number') return null;
    return typeof extra === 'number' ? basis + extra : basis;
};

test('elke aanbieder heeft een model en een vergoedingsduur', () => {
    for (const a of data.aanbieders) {
        const v = a.rentevergoeding;
        assert.ok(MODELLEN.includes(v?.model), `${a.id}: model ontbreekt of is onbekend (${v?.model})`);
        for (const soort of ['verbouw', 'nieuwbouw']) {
            assert.equal(
                typeof v?.vergoedingMaanden?.[soort], 'number',
                `${a.id}: vergoedingMaanden.${soort} is geen getal`,
            );
        }
    }
});

test('elk tarief is een bekende waarde en spreekt het model niet tegen', () => {
    for (const a of data.aanbieders) {
        const v = a.rentevergoeding;
        for (const soort of ['verbouw', 'nieuwbouw']) {
            const tarief = v?.tarief?.[soort];
            assert.ok(TARIEVEN.includes(tarief), `${a.id}: onbekend tarief bij ${soort} (${tarief})`);

            // Een aanbieder die niets vergoedt kan geen niveau hebben, en een
            // aanbieder die wel vergoedt kan niet op 'geen' staan.
            const geenVergoeding = v.vergoedingMaanden[soort] === 0;
            assert.equal(
                tarief === 'geen', geenVergoeding,
                `${a.id}: tarief "${tarief}" bij ${soort} past niet bij ${v.vergoedingMaanden[soort]} maanden vergoeding`,
            );
        }
    }
});

test('een berekenbaar tarief is onderbouwd met de detailtekst', () => {
    // Alleen 'gelijk-aan-hypotheekrente' en 'hypotheekrente-min-1' vullen wij in
    // de calculators daadwerkelijk in. Die claim moet dus terug te vinden zijn in
    // wat de aanbieder zelf publiceert, anders rekenen wij met een verzinsel.
    for (const a of data.aanbieders) {
        const v = a.rentevergoeding;
        const tekst = `${v.waarde || ''} ${v.detail || ''}`.toLowerCase();
        for (const soort of ['verbouw', 'nieuwbouw']) {
            const tarief = v.tarief[soort];
            if (tarief === 'gelijk-aan-hypotheekrente') {
                assert.match(
                    tekst, /gelijk aan (je|uw|de gemiddelde) hypotheekrente|gelijk aan de gemiddelde rente/,
                    `${a.id}: tarief bij ${soort} claimt gelijk aan de hypotheekrente, maar de tekst zegt dat niet`,
                );
            }
            if (tarief === 'hypotheekrente-min-1') {
                assert.match(
                    tekst, /1% lager/,
                    `${a.id}: tarief bij ${soort} claimt 1% lager, maar de tekst zegt dat niet`,
                );
            }
        }
    }
});

test('de vergoedingsduur past binnen de maximale looptijd', () => {
    for (const a of data.aanbieders) {
        for (const soort of ['verbouw', 'nieuwbouw']) {
            const grens = maxLooptijd(a, soort);
            if (grens == null) continue;
            const duur = a.rentevergoeding.vergoedingMaanden[soort];
            assert.ok(
                duur <= grens,
                `${a.id}: vergoeding zou ${duur} maanden ${soort} lopen, terwijl het depot hoogstens ${grens} maanden bestaat`,
            );
        }
    }
});

test('nul maanden vergoeding hoort bij een samenvatting die dat ook zegt', () => {
    for (const a of data.aanbieders) {
        const v = a.rentevergoeding;
        const nul = v.vergoedingMaanden.verbouw === 0 && v.vergoedingMaanden.nieuwbouw === 0;
        const zegtGeen = /^geen/i.test(v.waarde || '');
        assert.equal(
            nul, zegtGeen,
            `${a.id}: samenvatting zegt "${v.waarde}" maar de duur is ${v.vergoedingMaanden.verbouw}/${v.vergoedingMaanden.nieuwbouw} maanden`,
        );
    }
});

test('elk genoemd maandental komt terug in de detailtekst of in de looptijden', () => {
    // Waar de detailtekst een aantal maanden noemt, moet de afgeleide duur een
    // van die getallen zijn. Noemt de tekst geen maanden, dan hoort de duur
    // gelijk te zijn aan de standaardlooptijd: vergoeding over de hele termijn.
    for (const a of data.aanbieders) {
        const v = a.rentevergoeding;
        if (v.model === 'rente-alleen-over-opgenomen') continue;

        const tekst = `${v.waarde || ''} ${v.detail || ''}`;
        const genoemd = new Set();
        for (const m of tekst.matchAll(/(\d+)\s*maanden/gi)) genoemd.add(Number(m[1]));
        for (const m of tekst.matchAll(/(\d+)\s*jaar/gi)) genoemd.add(Number(m[1]) * 12);

        for (const soort of ['verbouw', 'nieuwbouw']) {
            const duur = v.vergoedingMaanden[soort];
            const standaard = soort === 'verbouw' ? a.looptijdVerbouwMaanden : a.looptijdNieuwbouwMaanden;
            const toegestaan = genoemd.size ? [...genoemd, standaard] : [standaard];
            assert.ok(
                toegestaan.includes(duur),
                `${a.id}: ${duur} maanden vergoeding bij ${soort} staat niet in het detail (${[...genoemd].join(', ') || 'geen getallen'}) en is niet de standaardlooptijd (${standaard})`,
            );
        }
    }
});

test('een verlengingsclaim is onderbouwd of expliciet afwezig', () => {
    // Bij Rabobank stond dat verlenging mogelijk was met een niet-gepubliceerde
    // duur, terwijl de bron zegt dat het depot na 2 jaar automatisch stopt. Dat
    // is precies de soort aanname die deze dataset niet mag bevatten: onbekend
    // blijft onbekend, en "mogelijk" is een bewering die een bron nodig heeft.
    for (const a of data.aanbieders) {
        const v = a.verlengingMaanden || {};
        const heeftGetal = typeof v.verbouw === 'number' || typeof v.nieuwbouw === 'number';
        const beweertMogelijk = v.mogelijkMaarDuurOnbekend === true;
        const beweertGeen = v.geenVerlengingGepubliceerd === true;

        // Precies één van de drie toestanden, nooit twee tegelijk.
        const aantal = [heeftGetal, beweertMogelijk, beweertGeen].filter(Boolean).length;
        assert.equal(
            aantal, 1,
            `${a.id}: verlenging moet precies één toestand hebben (getal / duur onbekend / geen), nu ${aantal}`,
        );

        // Een claim zonder getal moet uitgelegd worden, want hij is niet uit de
        // cijfers af te lezen.
        if (beweertMogelijk || beweertGeen) {
            assert.ok(
                typeof v.detail === 'string' && v.detail.length > 40,
                `${a.id}: een verlenging zonder getal heeft een toelichting nodig die zegt waar dat op berust`,
            );
        }
    }
});
