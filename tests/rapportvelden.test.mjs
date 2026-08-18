/**
 * Bewaakt dat elk veld in een gedownload overzicht een Nederlands label en een
 * passend type heeft.
 *
 * Aanleiding: de bouwrentecalculator stuurde vier resultaatvelden mee die niet
 * in de labelkaart van reporting.js stonden. Die viel dan terug op de sleutelnaam
 * en de rauwe waarde, waardoor er "Average Monthly Cost" met daaronder
 * "333.3333333333333" in de PDF stond. Engelse koppen en een ongeformatteerd
 * getal in een document dat iemand meeneemt naar zijn hypotheekadviseur.
 *
 * Zo'n fout is onzichtbaar tijdens het bouwen: de pagina klopt, alleen de
 * download niet. Deze test leest de sleutels rechtstreeks uit de rapportopbouw
 * in de calculators en legt ze naast de labelkaart.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const rapport = fs.readFileSync(path.join(ROOT, 'src/js/reporting.js'), 'utf8');

const BRONNEN = ['src/js/main.js', 'src/js/bouwrente.js'];

/** De sleutels die in de labelkaart van reporting.js staan. */
const bekend = new Set(
    [...rapport.matchAll(/^\s{8}([a-zA-Z][a-zA-Z0-9]*):\s*\{\s*label:/gm)].map((m) => m[1]),
);

/**
 * De sleutels die de calculators meesturen in inputs: { ... } en results: { ... }.
 * Alleen de eenvoudige vorm "sleutel: waarde" wordt gelezen; dat is precies hoe
 * de rapportobjecten in de calculators zijn geschreven.
 */
function verzamelSleutels(bron) {
    const tekst = fs.readFileSync(path.join(ROOT, bron), 'utf8');
    const sleutels = new Set();

    for (const m of tekst.matchAll(/\b(inputs|results):\s*\{([\s\S]*?)\n(\s*)\},/g)) {
        for (const regel of m[2].split('\n')) {
            const veld = regel.match(/^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:/);
            if (veld) sleutels.add(veld[1]);
        }
    }
    return sleutels;
}

test('elk rapportveld heeft een Nederlands label in reporting.js', () => {
    const ontbreekt = [];

    for (const bron of BRONNEN) {
        for (const sleutel of verzamelSleutels(bron)) {
            if (!bekend.has(sleutel)) ontbreekt.push(`${bron}: ${sleutel}`);
        }
    }

    assert.deepEqual(
        ontbreekt, [],
        `deze velden komen in een overzicht terecht zonder label, waardoor de sleutelnaam en de rauwe waarde worden afgedrukt:\n    ${ontbreekt.join('\n    ')}`,
    );
});

test('de labelkaart bevat geen Engelse labels', () => {
    // De sleutels zijn Engels, de labels horen Nederlands te zijn. Deze woorden
    // verraden een label dat per ongeluk uit de sleutelnaam is overgenomen.
    const verdacht = [];
    for (const m of rapport.matchAll(/label:\s*'([^']+)'/g)) {
        const label = m[1];
        if (/\b(Total|Average|Monthly|Cost|Impact|Amount|Rate|Value|Interest)\b/.test(label)) {
            verdacht.push(label);
        }
    }
    assert.deepEqual(verdacht, [], `Engelse labels gevonden: ${verdacht.join(', ')}`);
});

test('geen enkel overzicht drukt een lege interpretatie af', () => {
    // De sectie hoort weg te vallen als er niets te interpreteren valt, in plaats
    // van een kopje met "Indicatieve interpretatie op basis van uw invoer".
    assert.match(
        rapport, /if \(report\.interpretation\) \{/,
        'de Interpretatie-sectie wordt onvoorwaardelijk afgedrukt',
    );
    assert.match(
        rapport, /rawInterpretation \? normalizeInterpretationText\(rawInterpretation\) : null/,
        'een ontbrekende interpretatie wordt nog met een standaardzin opgevuld',
    );
});
