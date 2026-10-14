import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { naarAdres, uitAdres } from '../src/depot/adres.js';

test('de link geeft dezelfde invoer terug', () => {
    const w = { bedrag: 75000, rente: 3.95, maanden: 9, looptijd: 25, vorm: 'lineair', soort: 'lager', afslag: 0.5, stopt: 6, patroon: 'vroeg', woning: 250000, woonlast: 1100 };
    assert.deepEqual(uitAdres(`?${naarAdres(w)}`), w);
});

test('lege waarden blijven uit de link, en ontbreken daarna ook', () => {
    assert.equal(naarAdres({ bedrag: 25000, rente: 3.8, stopt: null, woning: null, soort: '' }), 'bedrag=25000&rente=3.8');
    assert.deepEqual(uitAdres('?bedrag=25000&rente=3.8'), { bedrag: 25000, rente: 3.8 });
});

test('de oude link van de verbouwbegroting werkt nog', () => {
    assert.deepEqual(uitAdres('?bedrag=37375'), { bedrag: 37375 });
    assert.deepEqual(uitAdres('?amount=20000'), { bedrag: 20000 });
});

test('een link met onzin levert niets op', () => {
    assert.equal(uitAdres(''), null);
    assert.equal(uitAdres('?rente=3.8'), null, 'zonder bedrag');
    assert.equal(uitAdres('?bedrag=0'), null);
    assert.equal(uitAdres('?bedrag=abc'), null);
    assert.equal(uitAdres('?bedrag=25000&maanden=6.5'), null, 'geen hele maanden');
    assert.equal(uitAdres('?bedrag=25000&stopt=40'), null, 'boven de 36 maanden');
    assert.equal(uitAdres('?bedrag=25000&vorm=spaarhypotheek'), null);
    assert.equal(uitAdres('?bedrag=25000&soort=dubbel'), null);
    assert.equal(uitAdres('?bedrag=2000000'), null, 'boven een miljoen');
});

test('de pagina heeft de instelling, het blok met aannames en de knoppen', () => {
    const html = readFileSync(new URL('../bouwdepot-berekenen.html', import.meta.url), 'utf8');
    for (const haak of ['id="input-depot-stopt"', 'for="input-depot-stopt"', 'id="depot-meer"', 'data-dp-punt="rente"', 'data-dp-punt="duur"', 'data-dp-aanpas="input-depot-stopt"', 'id="btn-excel"', 'id="btn-kopieer"', 'id="btn-download"']) {
        assert.ok(html.includes(haak), haak);
    }
    // Title, kop en adres blijven: dit is de pagina voor "bouwdepot berekenen".
    assert.match(html, /<title>Bouwdepot berekenen: je maandlast en totale rente<\/title>/);
    assert.match(html, /<h1[^>]*>Wat kost je bouwdepot per maand\?<\/h1>/);
    assert.ok(html.includes('<link rel="canonical" href="https://www.bouwdepotcalculator.nl/bouwdepot-berekenen.html">'));
});
