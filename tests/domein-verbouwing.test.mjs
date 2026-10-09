/**
 * De financieringscheck van de verbouwpagina, getoetst aan uitkomsten die met
 * de hand zijn nagerekend. Zie tests/begroting.test.mjs voor de begroting zelf.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { berekenLeenruimte, maandlastExtraLening } from '../src/domain/verbouwing.js';
import { berekenBegroting } from '../src/js/begrotingrekenen.js';

const bijna = (werkelijk, verwacht, wat, marge = 0.01) =>
    assert.ok(Math.abs(werkelijk - verwacht) < marge, `${wat}: ${werkelijk} in plaats van ${verwacht}`);

test('de praktijkcase: het bedrag past niet helemaal, het eigen geld dekt het precies', () => {
    // Waarde 360.000, hypotheek 300.000: ruimte 60.000.
    // Gewenst 75.000: 60.000 financierbaar, 15.000 gat.
    // Eigen geld nodig: 15.000 + 10.000 buiten depot = 25.000; buffer 25.000 - 25.000 = 0.
    const r = berekenLeenruimte({ bedrag: 75000, hypotheek: 300000, waarde: 360000, eigenGeld: 25000, buitenDepot: 10000 });
    assert.deepEqual(
        { ruimte: r.ruimte, financierbaar: r.financierbaar, gat: r.gat, nodig: r.nodig, buffer: r.buffer, totaleLening: r.totaleLening },
        { ruimte: 60000, financierbaar: 60000, gat: 15000, nodig: 25000, buffer: 0, totaleLening: 360000 },
    );
    assert.equal(r.verhouding, 1);
});

test('past het bedrag binnen de ruimte, dan is er geen gat', () => {
    // Ruimte 100.000, gewenst 40.000: alles financierbaar. Lening 340.000 op 400.000 = 85%.
    const r = berekenLeenruimte({ bedrag: 40000, hypotheek: 300000, waarde: 400000, eigenGeld: 5000, buitenDepot: 8000 });
    assert.equal(r.financierbaar, 40000);
    assert.equal(r.gat, 0);
    assert.equal(r.nodig, 8000);
    assert.equal(r.buffer, -3000);
    assert.equal(r.verhouding, 0.85);
});

test('een hypotheek boven de woningwaarde geeft nul ruimte, geen negatieve', () => {
    const r = berekenLeenruimte({ bedrag: 30000, hypotheek: 320000, waarde: 300000, eigenGeld: 0, buitenDepot: 0 });
    assert.equal(r.ruimte, 0);
    assert.equal(r.financierbaar, 0);
    assert.equal(r.gat, 30000);
    assert.equal(r.buffer, -30000);
});

test('zonder woningwaarde is er geen verhouding in plaats van een deling door nul', () => {
    const r = berekenLeenruimte({ bedrag: 10000, hypotheek: 0, waarde: 0, eigenGeld: 0, buitenDepot: 0 });
    assert.equal(r.verhouding, null);
    assert.ok(Object.values(r).every((w) => w === null || Number.isFinite(w)));
});

test('de extra maandlast is de annuiteit over het financierbare deel', () => {
    // € 60.000, 3,80%, 30 jaar: i = 0,038 / 12
    //   T = 60000 * i / (1 - (1 + i)^-360) = 279,57
    bijna(maandlastExtraLening(60000, 3.8), 279.57, 'maandlast');
    // Nul procent: 60.000 / 360 = 166,67.
    bijna(maandlastExtraLening(60000, 0), 166.67, 'maandlast bij nul procent');
    assert.equal(maandlastExtraLening(0, 3.8), 0);
    assert.equal(maandlastExtraLening(-5, 3.8), 0);
});

test('begroting en financieringscheck sluiten op elkaar aan', () => {
    // De begroting levert wat geleend moet worden (depot met reserve) en wat
    // sowieso uit eigen geld komt. Die twee gaan de waardetoets in.
    const b = berekenBegroting([
        { bedrag: 40000, vast: true, prioriteit: 'noodzakelijk' },
        { bedrag: 6000, vast: false, prioriteit: 'gewenst' },
    ], 10);
    assert.equal(b.depotMetMarge, 44000);
    assert.equal(b.eigen, 6000);
    const r = berekenLeenruimte({ bedrag: b.depotMetMarge, hypotheek: 250000, waarde: 280000, eigenGeld: 25000, buitenDepot: b.eigen });
    // Ruimte 30.000: 14.000 gat, plus 6.000 eigen posten = 20.000 nodig; 5.000 over.
    assert.equal(r.gat, 14000);
    assert.equal(r.nodig, 20000);
    assert.equal(r.buffer, 5000);
    // Alles wat de verbouwing kost is gedekt: lening plus eigen geld.
    assert.equal(r.financierbaar + r.nodig, b.totaal);
});
