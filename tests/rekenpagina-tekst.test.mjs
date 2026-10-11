/**
 * De tekst onder de rekentool op bouwdepot-berekenen.html.
 *
 * De antwoorden noemen bedragen uit het standaardvoorbeeld van de tool. Die
 * staan met de hand in de pagina; deze test faalt als de rekenkern iets anders
 * uitrekent, of als de structured data iets anders zegt dan de pagina.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { berekenDepot } from '../src/domain/bouwdepot.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'bouwdepot-berekenen.html'), 'utf8');
const sectie = html.split('id="vragen"')[1].split('</section>')[0];
const kaal = (t) => t.replace(/<[^>]+>/g, '').replace(/&euro;&nbsp;/g, '€ ').replace(/&nbsp;/g, ' ').replace(/&eacute;/g, 'é').replace(/&iuml;/g, 'ï').replace(/\s+/g, ' ').trim();

test('de bedragen in de antwoorden komen uit het standaardvoorbeeld van de rekentool', () => {
    const d = berekenDepot({});
    const euro = (n) => `€ ${Math.round(n).toLocaleString('nl-NL')}`;
    const tekst = kaal(sectie);
    assert.ok(tekst.includes(`Bij ${euro(d.invoer.depot)} en 3,8% rente betaal je ${euro(d.maandlastDaarna)} bruto per maand`), 'maandlast');
    assert.ok(tekst.includes(`In totaal is dat ${euro(d.renteHeleLooptijd)} aan rente`), 'rente over de looptijd');
    assert.ok(tekst.includes(`in de eerste maand van de verbouwing ${euro(d.eerste.totaal)} in plaats van ${euro(d.maandlastDaarna)}`), 'eerste maand');
    assert.ok(tekst.includes(`tot ${euro(d.hoogsteTijdens.totaal)} in de laatste maand`), 'hoogste maand');
    // "De laatste maand" klopt alleen als de hoogste maand ook de laatste van de verbouwing is.
    assert.equal(d.hoogsteTijdens.maand, d.invoer.duurMaanden);
});

test('de structured data zegt woord voor woord wat er op de pagina staat', () => {
    const zichtbaar = [...sectie.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [kaal(m[1]), kaal(m[2])]);
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((j) => j['@type'] === 'FAQPage');
    assert.equal(zichtbaar.length, 4);
    assert.deepEqual(ld.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]), zichtbaar);
});

test('het voorbehoud staat er één keer', () => {
    const tekst = kaal(html.slice(html.indexOf('<main'), html.indexOf('</main>')));
    const keer = (re) => (tekst.match(re) || []).length;
    assert.ok(keer(/geen toezegging/gi) <= 1);
    assert.ok(keer(/geen advies/gi) <= 1);
});
