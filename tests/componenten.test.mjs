/**
 * Bewaakt dat [context/componenten.md](../context/componenten.md) de
 * stylesheets bijhoudt.
 *
 * Er zijn 109 componenten over vier stylesheets en ruim 1.800 regels CSS. Zonder
 * overzicht wordt er opnieuw gemaakt wat er al is: `.alleen-print` is een keer
 * dubbel gebouwd, en `.vervolgstap` kwam er bijna bij zonder dat `.melding` was
 * opgemerkt.
 *
 * Een lijst helpt alleen als hij klopt. De vier plandocumenten in de repo laten
 * zien wat er anders gebeurt: die lopen achter op de code, en roadmap.md
 * waarschuwt inmiddels om er niets uit over te nemen zonder zelf te meten. Deze
 * test houdt dit bestand wél gelijk met de werkelijkheid.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const STYLESHEETS = ['design-system.css', 'pagina.css', 'calculator.css', 'stappenplan.css', 'broadsheet.css'];

const lijst = fs.readFileSync(path.join(ROOT, 'context/componenten.md'), 'utf8');

/**
 * De hoofdcomponenten uit een stylesheet: klassen die aan het begin van een
 * regel een blok openen. Varianten met `__` of `--` horen bij hun hoofdcomponent
 * en hoeven geen eigen regel in de lijst.
 */
const componentenIn = (bestand) => {
    const css = fs.readFileSync(path.join(ROOT, 'src/styles', bestand), 'utf8');
    const gevonden = new Set();
    for (const m of css.matchAll(/^\.([a-z][a-z0-9-]*)\s*[,{]/gm)) {
        if (!/__|--/.test(m[1])) gevonden.add(m[1]);
    }
    return gevonden;
};

const alleComponenten = () => {
    const alles = new Map();
    for (const bestand of STYLESHEETS) {
        for (const klasse of componentenIn(bestand)) {
            if (!alles.has(klasse)) alles.set(klasse, []);
            alles.get(klasse).push(bestand);
        }
    }
    return alles;
};

test('elke component in de CSS staat in de lijst', () => {
    const ontbreekt = [];
    for (const [klasse, bestanden] of alleComponenten()) {
        // Een backtick-notatie in de tabel, dus `.naam` met woordgrens erachter.
        const patroon = new RegExp('`\\.' + klasse.replace(/-/g, '\\-') + '[`/ ]');
        if (!patroon.test(lijst)) ontbreekt.push(`.${klasse} (${bestanden.join(', ')})`);
    }
    assert.deepEqual(
        ontbreekt, [],
        `deze componenten staan in de CSS maar niet in context/componenten.md:\n    ${ontbreekt.join('\n    ')}`,
    );
});

test('de lijst noemt geen componenten die niet meer bestaan', () => {
    const bestaat = alleComponenten();
    const verdwenen = [];

    // Alleen de klassen die als eerste kolom in een tabelrij staan; verwijzingen
    // in lopende tekst blijven buiten schot.
    for (const m of lijst.matchAll(/^\| `\.([a-z][a-z0-9-]*)`/gm)) {
        if (!bestaat.has(m[1])) verdwenen.push(`.${m[1]}`);
    }
    assert.deepEqual(
        verdwenen, [],
        `deze componenten staan in de lijst maar niet meer in de CSS:\n    ${verdwenen.join('\n    ')}`,
    );
});

/**
 * De vijf bekende naambotsingen staan in §6 beschreven. Komt er een zesde bij,
 * dan hoort die er ook in: twee stylesheets die dezelfde klasse definiëren
 * werken alleen zolang de volgorde van de link-regels toevallig goed staat.
 */
test('nieuwe naambotsingen zijn beschreven', () => {
    const botsingen = [...alleComponenten()]
        .filter(([, bestanden]) => bestanden.length > 1)
        .map(([klasse]) => klasse);

    const onbeschreven = botsingen.filter((k) => {
        const na = lijst.slice(lijst.indexOf('## 6. Naambotsingen'));
        return !na.includes(`\`.${k}\``);
    });

    assert.deepEqual(
        onbeschreven, [],
        `deze klassen staan in twee stylesheets en horen in §6 van de lijst:\n    ${onbeschreven.join('\n    ')}`,
    );
});
