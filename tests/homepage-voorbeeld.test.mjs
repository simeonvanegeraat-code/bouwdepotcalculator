/**
 * Bewaakt dat de bedragen op de homepage uit het rekenmodel komen.
 *
 * De homepage toont een voorbeeldscenario op drie manieren: als tekst, als
 * kolommen en als tabel. De tekst en de tabel staan in index.html zelf, zodat
 * ze er ook zonder JavaScript zijn en een zoekmachine ze leest. Dat betekent
 * dat ze met de hand zijn ingevuld, en dus stil kunnen gaan afwijken van wat
 * src/homepage/voorbeeld.js uitrekent zodra iemand een aanname of een formule
 * aanpast. Deze test faalt dan op het bedrag dat niet meer klopt.
 *
 * De verwachte uitkomsten staan hier bovendien los uitgeschreven, nagerekend
 * met de hand: een model dat zichzelf controleert, controleert niets.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { voorbeeldTijdlijn, AANNAMES, euro } from '../src/homepage/voorbeeld.js';
import { berekenTijdlijn } from '../src/domain/nieuwbouw.js';
import { annuiteitTermijn } from '../src/js/annuiteit.js';
import { RENTE, JAREN } from '../src/homepage/woningen-aannames.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Maakt "&euro; 3.419" en "€ 3.419" (met harde spatie) vergelijkbaar.
const plat = (s) => s
    .replace(/<[^>]+>/g, '')
    .replace(/&euro;/g, '€').replace(/&ndash;/g, '–').replace(/&nbsp;| /g, ' ')
    .replace(/\s+/g, ' ').trim();
const bedrag = (n) => plat(euro.format(n));

const tijdlijn = voorbeeldTijdlijn();

test('het model geeft de met de hand nagerekende uitkomsten', () => {
    // Annuiteit over € 500.000, 3,80%, 360 maanden:
    //   i = 0,038 / 12; T = 500000 * i / (1 - (1 + i)^-360) = € 2.329,79
    assert.equal(tijdlijn.lening, 500000);
    assert.ok(Math.abs(tijdlijn.annuiteit - 2329.79) < 0.01, `annuiteit is ${tijdlijn.annuiteit}`);

    // Bouwmaand 1: depot van 350.000 naar 297.500, gemiddeld 323.750.
    //   vergoeding = 323750 * 0,038 / 12 = 1.025,21; last = 2.329,79 - 1.025,21 + 1.200
    const m1 = tijdlijn.regels.find((r) => r.bouwmaand === 1);
    assert.ok(Math.abs(m1.totaal - 2504.58) < 0.01, `bouwmaand 1 is ${m1.totaal}`);

    // Bouwmaand 12: depot van 70.000 naar 0, gemiddeld 35.000.
    //   vergoeding = 35000 * 0,038 / 12 = 110,83; last = 2.329,79 - 110,83 + 1.200
    const m12 = tijdlijn.regels.find((r) => r.bouwmaand === 12);
    assert.ok(Math.abs(m12.totaal - 3418.96) < 0.01, `bouwmaand 12 is ${m12.totaal}`);

    // De eerste maand na oplevering: het depot is leeg en de huidige woonlast
    // loopt nog door. 2.329,79 + 1.200 = 3.529,79, de hoogste maand.
    assert.equal(tijdlijn.piek.label, '1 mnd na oplevering');
    assert.ok(Math.abs(tijdlijn.piek.totaal - 3529.79) < 0.01, `de piek is ${tijdlijn.piek.totaal}`);
});

test('de homepage rekent met de standaardinvoer van de nieuwbouwpagina', () => {
    // Wie doorklikt naar nieuwbouw.html moet daar dezelfde zwaarste maand zien.
    const pagina = berekenTijdlijn();
    assert.equal(tijdlijn.piek.totaal, pagina.piek.totaal);
    assert.equal(tijdlijn.annuiteit, pagina.maandlastDaarna);
    const bouw = tijdlijn.regels.filter((r) => r.fase === 'bouw');
    assert.deepEqual(bouw.map((r) => r.totaal), pagina.regels.filter((r) => r.fase === 'bouw').map((r) => r.totaal));
});

test('het depot loopt van de aanneemsom naar nul', () => {
    const bouw = tijdlijn.regels.filter((r) => r.fase === 'bouw');
    assert.equal(bouw.at(-1).depot, 0);
    for (const r of bouw) assert.ok(r.vergoeding >= 0 && r.hypotheek <= tijdlijn.annuiteit + 1e-9);
});

test('de losse bedragen in de tekst komen uit het model', () => {
    const verwacht = {
        voor: tijdlijn.regels[0].totaal,
        start: tijdlijn.regels.find((r) => r.fase === 'bouw').totaal,
        eind: tijdlijn.regels.filter((r) => r.fase === 'bouw').at(-1).totaal,
        piek: tijdlijn.piek.totaal,
        na: tijdlijn.annuiteit,
        aanbouw: annuiteitTermijn(60000, RENTE / 100 / 12, JAREN * 12),
        snel: annuiteitTermijn(25000, RENTE / 100 / 12, JAREN * 12),
    };
    const gevonden = [...html.matchAll(/data-vast="([a-z]+)"[^>]*>([^<]*)</g)];
    assert.ok(gevonden.length >= 8, `verwacht minstens acht gemarkeerde bedragen, gevonden ${gevonden.length}`);
    for (const [, naam, tekst] of gevonden) {
        assert.ok(naam in verwacht, `onbekend bedrag "${naam}" op de homepage`);
        assert.equal(plat(tekst), bedrag(verwacht[naam]), `het bedrag "${naam}" op de homepage`);
    }
    for (const naam of Object.keys(verwacht)) {
        assert.ok(gevonden.some(([, n]) => n === naam), `het bedrag "${naam}" staat niet meer op de homepage`);
    }
});

test('de tabel op de homepage is regel voor regel het model', () => {
    const body = html.match(/<tbody data-tabel>([\s\S]*?)<\/tbody>/);
    assert.ok(body, 'de tabel ontbreekt');
    const rijen = [...body[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
        .map((m) => [...m[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => plat(c[1])));

    const verwacht = tijdlijn.regels.map((r) => [
        r.label + (r === tijdlijn.piek ? ' (hoogste)' : ''),
        r.depot === null ? 'n.v.t.' : bedrag(r.depot),
        r.hypotheek ? bedrag(r.hypotheek) : '–',
        r.woonlast ? bedrag(r.woonlast) : '–',
        bedrag(r.totaal),
    ]);
    assert.deepEqual(rijen, verwacht);
});

test('de aannames onder de tabel zijn de aannames van het model', () => {
    const noot = plat(html.match(/<p class="hp-tabel__noot">([\s\S]*?)<\/p>/)[1]);
    assert.ok(noot.includes(`Grond ${bedrag(AANNAMES.grond)}`), 'grondprijs');
    assert.ok(noot.includes(`aanneemsom ${bedrag(AANNAMES.aanneemsom)}`), 'aanneemsom');
    assert.ok(noot.includes(`${AANNAMES.rentePercent.toFixed(2).replace('.', ',')}% rente`), 'rente');
    assert.ok(noot.includes(`${AANNAMES.looptijdJaren} jaar`), 'looptijd');
    assert.ok(noot.includes('Bruto'), 'de vermelding dat het bruto is');
    assert.equal(AANNAMES.overlapNaOplevering, 2);
    assert.ok(noot.includes('nog twee maanden doorloopt na oplevering'), 'de overlap na oplevering');
});
