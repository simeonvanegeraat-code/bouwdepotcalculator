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
const STYLESHEETS = ['design-system.css', 'pagina.css', 'calculator.css', 'stappenplan.css'];

/** 400 lopende tekst, 600 koppen en nadruk, 700 alleen de grote getallen. */
const TOEGESTAAN = new Set([400, 600, 700]);

const gewichtenIn = (bestand) => {
    const css = fs.readFileSync(path.join(ROOT, 'src/styles', bestand), 'utf8');
    const gevonden = [];
    for (const m of css.matchAll(/font-weight:\s*(\d+)/g)) {
        gevonden.push({ waarde: Number(m[1]), regel: css.slice(0, m.index).split('\n').length });
    }
    return gevonden;
};

test('er zijn niet meer dan drie lettergewichten in gebruik', () => {
    const afwijkend = [];
    for (const bestand of STYLESHEETS) {
        for (const { waarde, regel } of gewichtenIn(bestand)) {
            if (!TOEGESTAAN.has(waarde)) afwijkend.push(`${bestand}:${regel} font-weight: ${waarde}`);
        }
    }
    assert.deepEqual(
        afwijkend, [],
        'gebruik 400, 600 of 700. Meer nadruk nodig? Kies dan grootte of ruimte, niet een vierde gewicht:\n    '
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
