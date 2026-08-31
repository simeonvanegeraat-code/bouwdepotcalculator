/**
 * Bewaakt dat de lettergewichten beperkt blijven tot drie waarden.
 *
 * Op 22 augustus 2026 stonden er twaalf in de stylesheets, waarvan acht tussen
 * 520 en 700: 520, 540, 560, 570, 580, 600, 620, 640, 650, 660, 680, 690. Elk
 * verschil apart is onzichtbaar; bij elkaar leest het als ruis, en dat is
 * precies wat een site "in elkaar gezet" laat ogen in plaats van ontworpen.
 *
 * Diezelfde dag gemeten bij anderen, op 1440px:
 *
 *   Rabobank      2 gewichten (400 en 700, niets ertussen)
 *   Independer    3 (400, 600, 700)
 *   Wise          4 (400, 500, 600, 900)
 *   NerdWallet    7, maar gespreid van 300 tot 900
 *
 * De regel is dus niet "licht" maar "weinig en ver uit elkaar". Een vierde
 * waarde erbij is bijna altijd een vergissing: iemand wil nadruk en pakt 620
 * omdat 600 net niet genoeg voelt. Deze test dwingt dan de vraag af of die
 * nadruk niet uit grootte of ruimte hoort te komen.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

/**
 * Drie gewichten per richting, en twee richtingen zolang de migratie loopt.
 *
 * De oude richting doet 400 lopende tekst, 600 koppen en nadruk, 700 alleen de
 * grote getallen. De broadsheet uit ONTWERPPLAN.md §3 doet 400 lopende tekst,
 * 500 koppen en getallen, 600 de kapitaaltjes -- daar komt de hiërarchie uit
 * grootte en niet uit vet, en dat 500-in-plaats-van-700 is precies wat die
 * richting zijn ingehouden toon geeft.
 *
 * Die twee kunnen niet samengevoegd worden zonder er één te beschadigen, dus
 * ze worden apart bewaakt. Elke stylesheet houdt zich aan drie waarden; een
 * vierde binnen één richting is nog steeds een vergissing.
 *
 * Als alle pagina's over zijn: broadsheet.css verhuist naar design-system.css,
 * de andere drie verdwijnen, en er blijft één set van {400, 500, 600} over.
 */
const RICHTINGEN = [
    { toegestaan: new Set([400, 600, 700]), bestanden: ['design-system.css', 'pagina.css', 'calculator.css', 'stappenplan.css'] },
    { toegestaan: new Set([400, 500, 600]), bestanden: ['broadsheet.css'] },
];

const STYLESHEETS = RICHTINGEN.flatMap((r) => r.bestanden);

const gewichtenIn = (bestand) => {
    const css = fs.readFileSync(path.join(ROOT, 'src/styles', bestand), 'utf8');
    const gevonden = [];
    for (const m of css.matchAll(/font-weight:\s*(\d+)/g)) {
        gevonden.push({ waarde: Number(m[1]), regel: css.slice(0, m.index).split('\n').length });
    }
    return gevonden;
};

test('er zijn niet meer dan drie lettergewichten per richting in gebruik', () => {
    const afwijkend = [];
    for (const { toegestaan, bestanden } of RICHTINGEN) {
        const namen = [...toegestaan].join(', ');
        for (const bestand of bestanden) {
            for (const { waarde, regel } of gewichtenIn(bestand)) {
                if (!toegestaan.has(waarde)) afwijkend.push(`${bestand}:${regel} font-weight: ${waarde} (hier mag ${namen})`);
            }
        }
    }
    assert.deepEqual(
        afwijkend, [],
        'Meer nadruk nodig? Kies dan grootte of ruimte, niet een vierde gewicht:\n    '
        + afwijkend.join('\n    '),
    );
});

/**
 * De lettergrootte hoort uit de tokens te komen. Losse waarden in rem of px
 * laten de schaal weer uitdijen -- op de homepage stonden 15 en 17px naast
 * elkaar, een verschil dat alleen ruis is.
 *
 * De printblokken zijn uitgezonderd: papier heeft zijn eigen maatvoering in
 * punten en deelt de schermschaal niet.
 */
test('lettergroottes op het scherm komen uit de tokens', () => {
    const los = [];
    for (const bestand of STYLESHEETS) {
        const css = fs.readFileSync(path.join(ROOT, 'src/styles', bestand), 'utf8');
        // Knip de @media print-blokken eruit voordat we kijken.
        const zonderPrint = css.replace(/@media\s+print\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
        for (const m of zonderPrint.matchAll(/font-size:\s*([0-9.]+(?:rem|px))\s*;/g)) {
            const regel = zonderPrint.slice(0, m.index).split('\n').length;
            los.push(`${bestand}:${regel} font-size: ${m[1]}`);
        }
    }
    assert.deepEqual(
        los, [],
        `gebruik een --ds-t-token in plaats van een losse maat:\n    ${los.join('\n    ')}`,
    );
});
