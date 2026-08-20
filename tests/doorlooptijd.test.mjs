/**
 * Bewaakt dat het rekenbare aantal werkdagen klopt met de brontekst.
 *
 * De depotplanner leidt hier de uiterste declaratiedatum uit af: dien je later
 * in dan de einddatum min deze doorlooptijd, dan is het geld niet op tijd
 * uitbetaald. Dat is een datum waar iemand zijn planning op baseert, dus mag het
 * getal niet los komen te staan van de zin waar het uit komt.
 *
 * Het getal is geen schatting: het staat letterlijk in de tekst die al met bron
 * en datum is verantwoord. Deze test faalt zodra iemand de tekst wijzigt zonder
 * het getal, of andersom.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const TELWOORDEN = {
    nul: 0, een: 1, één: 1, twee: 2, drie: 3, vier: 4, vijf: 5,
    zes: 6, zeven: 7, acht: 8, negen: 9, tien: 10,
};

/** Haalt het aantal werkdagen uit een zin, als cijfer of als telwoord. */
const werkdagenUitTekst = (tekst) => {
    if (!tekst) return null;
    const cijfer = tekst.match(/(\d+)\s*werkdag/i);
    if (cijfer) return Number(cijfer[1]);
    const woord = tekst.match(/\b([a-zéë]+)\s*werkdag/i);
    if (woord && TELWOORDEN[woord[1].toLowerCase()] != null) return TELWOORDEN[woord[1].toLowerCase()];
    return null;
};

test('elke aanbieder heeft een uitspraak over de doorlooptijd', () => {
    for (const a of data.aanbieders) {
        const d = a.doorlooptijdUitbetaling;
        assert.ok(d, `${a.naam} mist doorlooptijdUitbetaling`);
        assert.ok('werkdagenDigitaal' in d, `${a.naam} mist werkdagenDigitaal`);
        assert.ok(['gepubliceerd', 'niet-gepubliceerd'].includes(d.status), `${a.naam} heeft geen geldige status`);
    }
});

test('het getal komt overeen met de brontekst', () => {
    const fouten = [];
    for (const a of data.aanbieders) {
        const d = a.doorlooptijdUitbetaling;
        if (d.werkdagenDigitaal == null) continue;

        const uitTekst = werkdagenUitTekst(d.digitaal);
        // Nul betekent: direct, zonder wachttijd. Dan staat er geen aantal
        // werkdagen in de tekst maar hoort er wel "direct" te staan.
        if (d.werkdagenDigitaal === 0) {
            if (!/direct/i.test(d.digitaal || '')) {
                fouten.push(`${a.naam}: 0 werkdagen, maar de tekst noemt geen "direct": "${d.digitaal}"`);
            }
            continue;
        }
        if (uitTekst == null) {
            fouten.push(`${a.naam}: ${d.werkdagenDigitaal} werkdagen vastgelegd, maar de tekst noemt er geen: "${d.digitaal}"`);
        } else if (uitTekst !== d.werkdagenDigitaal) {
            fouten.push(`${a.naam}: tekst zegt ${uitTekst} werkdagen, data zegt ${d.werkdagenDigitaal}`);
        }
    }
    assert.deepEqual(fouten, [], `doorlooptijd wijkt af van de bron:\n    ${fouten.join('\n    ')}`);
});

test('wie niets publiceert krijgt geen getal', () => {
    for (const a of data.aanbieders) {
        const d = a.doorlooptijdUitbetaling;
        if (d.status !== 'niet-gepubliceerd') continue;
        assert.equal(d.werkdagenDigitaal, null, `${a.naam} staat op niet-gepubliceerd maar heeft wel een getal`);
        assert.equal(d.digitaal, null, `${a.naam} staat op niet-gepubliceerd maar heeft wel een tekst`);
    }
});
