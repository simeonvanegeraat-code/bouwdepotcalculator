/**
 * De bedragentabel op bouwdepot-berekenen.html, met de hand nagerekend en
 * vergeleken met wat er in de pagina staat.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { bedragentabel, TABELBEDRAGEN, UITGELICHT, STANDAARD, RENTEGRENZEN } from '../src/domain/bedragentabel.js';
import { berekenDepot } from '../src/domain/bouwdepot.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'bouwdepot-berekenen.html'), 'utf8');

/** De annuïteit, hier los uitgeschreven zodat de test niet op de rekenkern leunt. */
const annuiteit = (bedrag, rentePercent, jaren = 30) => {
    const r = rentePercent / 100 / 12, n = jaren * 12;
    return r === 0 ? bedrag / n : (bedrag * r) / (1 - (1 + r) ** -n);
};

test('de maandlast is de annuïteit over het hele bedrag', () => {
    // 100.000 tegen 3,8% over 360 maanden: 465,96 per maand, 67.744 rente in totaal.
    const [rij] = bedragentabel({ rentePercent: 3.8, bedragen: [100000] });
    assert.ok(Math.abs(rij.maandlast - 465.96) < 0.01, String(rij.maandlast));
    assert.ok(Math.abs(rij.renteLooptijd - (465.9574 * 360 - 100000)) < 1, String(rij.renteLooptijd));

    for (const rente of [1, 3.5, 4, 4.5, 8]) {
        for (const rij of bedragentabel({ rentePercent: rente })) {
            assert.ok(Math.abs(rij.maandlast - annuiteit(rij.bedrag, rente)) < 1e-6, `${rij.bedrag} bij ${rente}%`);
            assert.ok(Math.abs(rij.renteLooptijd - (annuiteit(rij.bedrag, rente) * 360 - rij.bedrag)) < 1e-4, `${rij.bedrag} bij ${rente}%`);
        }
    }
});

test('de last groeit recht evenredig met het bedrag en stijgt met de rente', () => {
    const t = bedragentabel({ rentePercent: 4 });
    const per1000 = t[0].maandlast / t[0].bedrag;
    for (const rij of t) assert.ok(Math.abs(rij.maandlast / rij.bedrag - per1000) < 1e-12);
    const laag = bedragentabel({ rentePercent: 3.5, bedragen: [50000] })[0].maandlast;
    const hoog = bedragentabel({ rentePercent: 4.5, bedragen: [50000] })[0].maandlast;
    assert.ok(hoog > laag);
});

test('tijdens de verbouwing betaal je minder dan daarna, en de eerste maand het minst', () => {
    // 25.000 tegen 3,8%, zes maanden, elke maand evenveel opnemen, vergoeding gelijk
    // aan de rente. Maand 1: rente 79,17 plus aflossing 37,32 is 116,49; het depot
    // gaat die maand van 25.000 naar 20.833, gemiddeld 22.917, vergoeding 72,57.
    // Zelf te betalen: 116,49 − 72,57 = 43,92.
    const [rij] = bedragentabel({ rentePercent: 3.8, bedragen: [25000] });
    assert.ok(Math.abs(rij.eersteTijdens - 43.92) < 0.02, String(rij.eersteTijdens));
    for (const r of bedragentabel({ rentePercent: 3.8 })) {
        assert.ok(r.eersteTijdens < r.hoogsteTijdens && r.hoogsteTijdens < r.maandlast, String(r.bedrag));
    }
});

test('elke rij is dezelfde som als de rekentool erboven', () => {
    for (const rij of bedragentabel({ rentePercent: 3.8 })) {
        const d = berekenDepot({ depot: rij.bedrag, rentePercent: 3.8 });
        assert.equal(rij.maandlast, d.maandlastDaarna);
        assert.equal(rij.eersteTijdens, d.eerste.totaal);
    }
});

test('de tabel in de pagina klopt met de rekenkern', () => {
    const sectie = html.split('id="bedragen"')[1].split('</section>')[0];
    const euro = (n) => `&euro;&nbsp;${Math.round(n).toLocaleString('nl-NL')}`;
    const rijen = [...sectie.matchAll(/<tr>\s*<th scope="row"><a href="bouwdepot-berekenen\.html\?bedrag=(\d+)"[^>]*>([^<]*)<\/a><\/th>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>/g)];
    assert.equal(rijen.length, TABELBEDRAGEN.length);
    const verwacht = bedragentabel({ rentePercent: STANDAARD.rentePercent });
    rijen.forEach((m, i) => {
        const v = verwacht[i];
        assert.equal(Number(m[1]), v.bedrag);
        assert.deepEqual(m.slice(2, 7), [euro(v.bedrag), euro(v.maandlast), euro(v.renteLooptijd), euro(v.eersteTijdens), euro(v.hoogsteTijdens)], String(v.bedrag));
    });
    for (const bedrag of UITGELICHT) {
        const v = verwacht.find((r) => r.bedrag === bedrag);
        assert.ok(sectie.includes(`<strong>${euro(bedrag)}</strong> kost bij 3,80% rente <strong>${euro(v.maandlast)} bruto per maand</strong>`), String(bedrag));
    }
});

test('de schuif en het veld in de pagina beginnen op de rente van de tabel', () => {
    assert.match(html, new RegExp(`id="bt-schuif" min="${RENTEGRENZEN.min}" max="${RENTEGRENZEN.max}" step="${RENTEGRENZEN.stap}" value="${STANDAARD.rentePercent}"`));
    assert.match(html, /id="bt-rente" value="3,80"/);
    // De homepage noemt 116 euro voor 25.000; de tabel moet hetzelfde zeggen.
    assert.equal(Math.round(bedragentabel({ rentePercent: 3.8, bedragen: [25000] })[0].maandlast), 116);
});

test('lineair: vaste aflossing, de eerste maand het hoogst, minder rente in totaal', () => {
    // 100.000 tegen 3,8% over 360 maanden. Aflossing 100.000 / 360 = 277,78 per maand.
    // Na zes maanden verbouwen staat er nog 98.333,33 open: rente 311,39, samen 589,17.
    // Halverwege (maand 181) staat er 50.000 open: rente 158,33, samen 436,11.
    // Alle rente: 0,038/12 x 100.000 x (360 + 1) / 2 = 57.158,33.
    const [rij] = bedragentabel({ rentePercent: 3.8, vorm: 'lineair', bedragen: [100000] });
    assert.ok(Math.abs(rij.maandlast - 589.17) < 0.01, String(rij.maandlast));
    assert.ok(Math.abs(rij.naVijftienJaar - 436.11) < 0.01, String(rij.naVijftienJaar));
    assert.ok(Math.abs(rij.renteLooptijd - 57158.33) < 0.01, String(rij.renteLooptijd));

    const [annu] = bedragentabel({ rentePercent: 3.8, vorm: 'annuiteit', bedragen: [100000] });
    assert.ok(rij.maandlast > annu.maandlast, 'lineair begint hoger');
    assert.ok(rij.naVijftienJaar < annu.maandlast, 'en zit halverwege lager');
    assert.ok(rij.renteLooptijd < annu.renteLooptijd, 'en kost in totaal minder rente');
    assert.equal(annu.naVijftienJaar.toFixed(6), annu.maandlast.toFixed(6), 'een annuïteit blijft gelijk');
});

test('de tabel kent alleen annuïtair en lineair, en de pagina biedt precies die twee', () => {
    assert.throws(() => bedragentabel({ rentePercent: 3.8, vorm: 'aflossingsvrij' }), /onbekende vorm/);
    const opties = [...html.split('id="bt-vorm"')[1].split('</select>')[0].matchAll(/<option value="([^"]+)"( selected)?/g)];
    assert.deepEqual(opties.map((m) => m[1]), ['annuiteit', 'lineair']);
    assert.equal(opties.find((m) => m[2])[1], STANDAARD.vorm);
});
