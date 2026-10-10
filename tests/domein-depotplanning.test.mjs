/**
 * De datums van de depotplanner, tegen de dataset en met de hand nagerekend.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { maandenErbij, maandenTussen, gebeurtenissen } from '../src/domain/depotplanning.js';
import { BANKEN } from '../src/js/bankdata.generated.js';

const bank = (id) => BANKEN.find((b) => b.id === id);
const dag = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const op = (rij, soort) => rij.find((g) => g.soort === soort);

test('maanden optellen houdt de dag vast, en klemt aan het eind van de maand', () => {
    assert.equal(dag(maandenErbij(new Date(2026, 0, 15), 18)), '2027-07-15');
    assert.equal(dag(maandenErbij(new Date(2026, 0, 31), 1)), '2026-02-28');
    assert.equal(dag(maandenErbij(new Date(2028, 0, 31), 1)), '2028-02-29');   // schrikkeljaar
    assert.equal(dag(maandenErbij(new Date(2026, 7, 31), 6)), '2027-02-28');
    assert.equal(dag(maandenErbij(new Date(2026, 9, 10), 0)), '2026-10-10');
});

test('maanden tussen twee datums', () => {
    const van = new Date(2026, 0, 1);
    assert.ok(Math.abs(maandenTussen(van, new Date(2027, 0, 1)) - 12) < 0.05);
    assert.ok(maandenTussen(van, new Date(2025, 11, 1)) < 0);
});

test('ABN AMRO, verbouwing: 18 maanden, vergoeding tot het eind van de standaardtermijn', () => {
    const rij = gebeurtenissen(bank('abn-amro'), new Date(2026, 0, 15), 'verbouw');
    assert.equal(dag(op(rij, 'start').datum), '2026-01-15');
    assert.equal(dag(op(rij, 'einde').datum), '2027-07-15');            // + 18
    assert.equal(dag(op(rij, 'uiterste').datum), '2028-01-15');         // + 18 + 6
    assert.equal(dag(op(rij, 'vergoeding').datum), '2027-07-15');       // 18 maanden
    // De vergoeding stopt eerder dan de 24 maanden die het depot kan lopen.
    assert.equal(op(rij, 'vergoeding').let_op, true);
    // Drie maanden voor het einde een bericht van de bank.
    assert.equal(dag(op(rij, 'verlengen').datum), '2027-04-15');
    assert.equal(op(rij, 'verlengen').naam, 'Bericht over verlengen');
});

test('ABN AMRO, nieuwbouw: de vergoeding loopt door in de verlenging, maar niet tot het eind', () => {
    const rij = gebeurtenissen(bank('abn-amro'), new Date(2026, 0, 15), 'nieuwbouw');
    assert.equal(dag(op(rij, 'einde').datum), '2028-01-15');            // + 24
    assert.equal(dag(op(rij, 'vergoeding').datum), '2028-07-15');       // + 30
    assert.match(op(rij, 'vergoeding').uitleg, /laatste 6 maanden/);
});

test('ING: geen vergoeding en dus geen datum daarvoor, wel een aanvraagvenster', () => {
    const rij = gebeurtenissen(bank('ing'), new Date(2026, 2, 1), 'verbouw');
    assert.equal(op(rij, 'vergoeding'), undefined);
    const vergoeding = rij.find((g) => g.naam === 'Vergoeding');
    assert.ok(vergoeding && !vergoeding.datum && vergoeding.uitleg.includes('ING'));
    assert.equal(op(rij, 'verlengen').naam, 'Verlengen aanvragen kan vanaf');
    assert.equal(dag(op(rij, 'verlengen').datum), '2027-11-01');        // 24 - 4 = 20 maanden
    assert.equal(op(rij, 'verlengen').let_op, true);
});

test('de gebeurtenissen staan op datum, en wat geen datum heeft onderaan', () => {
    for (const b of BANKEN) {
        for (const soort of ['verbouw', 'nieuwbouw']) {
            const rij = gebeurtenissen(b, new Date(2026, 4, 20), soort);
            const metDatum = rij.filter((g) => g.datum);
            for (let i = 1; i < metDatum.length; i++) assert.ok(metDatum[i].datum >= metDatum[i - 1].datum, `${b.id}/${soort}`);
            assert.deepEqual(rij.slice(metDatum.length).filter((g) => g.datum), [], `${b.id}/${soort}: datumloze onderaan`);
            // Nooit beide leeg: een datum, of een uitleg waarom die er niet is.
            for (const g of rij) assert.ok(g.datum || g.uitleg, `${b.id}/${soort}: ${g.naam}`);
            assert.equal(rij[0].soort, 'start');
        }
    }
});

test('elke aanbieder met een standaardlooptijd krijgt een einddatum op start plus looptijd', () => {
    const start = new Date(2026, 5, 10);
    for (const b of BANKEN) {
        for (const soort of ['verbouw', 'nieuwbouw']) {
            if (typeof b.looptijd[soort] !== 'number') continue;
            const einde = op(gebeurtenissen(b, start, soort), 'einde');
            assert.equal(dag(einde.datum), dag(maandenErbij(start, b.looptijd[soort])), `${b.id}/${soort}`);
        }
    }
});

test('wie geen termijn voor verlengen publiceert krijgt geen datum maar een uitleg', () => {
    const zonder = BANKEN.filter((b) => b.verlengingAanvragen.maandenVoorEinde == null);
    assert.ok(zonder.length > 0);
    for (const b of zonder) {
        const rij = gebeurtenissen(b, new Date(2026, 0, 1), 'verbouw');
        const regel = rij.find((g) => g.naam === 'Verlengen regelen');
        assert.ok(regel && !regel.datum && regel.uitleg.length > 20, b.id);
    }
});

test('de aantallen in de tekst van de pagina kloppen met de dataset', () => {
    // De pagina noemt drie aanbieders met een termijn voor verlengen, en zes
    // van de dertien met een langer nieuwbouwdepot.
    assert.equal(BANKEN.length, 13);
    assert.deepEqual(BANKEN.filter((b) => b.verlengingAanvragen.maandenVoorEinde != null).map((b) => b.id).sort(), ['abn-amro', 'asr', 'ing']);
    assert.equal(BANKEN.filter((b) => b.looptijd.nieuwbouw > b.looptijd.verbouw).length, 6);
    assert.equal(bank('nn').vergoeding.maanden.verbouw, 12);
    assert.equal(bank('nn').maximaal.verbouw, 24);
    assert.equal(bank('munt').vergoeding.maanden.verbouw, 12);
    assert.equal(bank('munt').maximaal.verbouw, 42);
});
