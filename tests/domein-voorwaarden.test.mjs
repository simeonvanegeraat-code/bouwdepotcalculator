/**
 * De rekenkern van de voorwaardenvergelijking, nagerekend met de hand.
 *
 * Steeds 50.000 euro tegen 3,8% hypotheekrente, gelijkmatig opgenomen. Bij n
 * maanden bouwen staat er in maand m gemiddeld 50.000 x (n - m + 0,5) / n in
 * het depot. Het renteverlies is per maand dat gemiddelde saldo maal het
 * verschil tussen rente en vergoeding, gedeeld door twaalf.
 *
 * De aanbieders hier zijn verzonnen, zodat de test niet breekt als de bankdata
 * verandert. Onderaan één test over alle echte aanbieders.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
    looptijd, bekendEinde, vergoedingsduur, vergoedingsTarief, past, renteverliesBijAanbieder,
} from '../src/domain/voorwaarden.js';
import { BANKEN } from '../src/js/bankdata.generated.js';

const bijna = (werkelijk, verwacht, uitleg = '') =>
    assert.ok(Math.abs(werkelijk - verwacht) <= 0.005, `${uitleg} verwacht ${verwacht}, kreeg ${werkelijk}`);

/** Een aanbieder in de vorm van BANKEN, met alleen wat de rekenkern leest. */
function aanbieder({ basis = 24, verlenging = 12, geen = false, duurOnbekend = false, vm = basis, tarief = 'gelijk-aan-hypotheekrente', model = 'beperkt-in-duur', naVerlengingOnbekend = false }) {
    const max = duurOnbekend ? null : basis + (geen ? 0 : verlenging);
    return {
        looptijd: { verbouw: basis, nieuwbouw: basis },
        verlenging: { verbouw: duurOnbekend ? null : verlenging, nieuwbouw: duurOnbekend ? null : verlenging, duurOnbekend, geen },
        maximaal: { verbouw: max, nieuwbouw: max },
        vergoeding: { model, naVerlengingOnbekend, maanden: { verbouw: vm, nieuwbouw: vm }, tarief: { verbouw: tarief, nieuwbouw: tarief } },
    };
}

const scenario = (maanden) => ({ soort: 'verbouw', depot: 50000, rentePercent: 3.8, maanden, patroon: 'gelijk' });

test('looptijd: verlenging bekend, geen verlenging, en duur onbekend', () => {
    assert.deepEqual(looptijd(aanbieder({ basis: 18, verlenging: 6 }), 'verbouw'), { basis: 18, verlenging: 6, max: 24, open: false, geen: false });
    assert.deepEqual(looptijd(aanbieder({ basis: 24, geen: true }), 'verbouw'), { basis: 24, verlenging: 0, max: 24, open: false, geen: true });
    const open = looptijd(aanbieder({ basis: 24, duurOnbekend: true }), 'verbouw');
    // Onbekend is niet hetzelfde als "geen verlenging": het maximum blijft leeg.
    assert.equal(open.max, null);
    assert.equal(bekendEinde(open), 24);
});

test('vergoedingsduur: het gat is de looptijd min de vergoede maanden', () => {
    assert.deepEqual(vergoedingsduur(aanbieder({ basis: 18, verlenging: 6, vm: 18 }), 'verbouw'), { maanden: 18, gat: 6, stoptInVerlenging: true });
    assert.deepEqual(vergoedingsduur(aanbieder({ basis: 24, verlenging: 12, vm: 36 }), 'verbouw'), { maanden: 36, gat: 0, stoptInVerlenging: false });
    // Niet gepubliceerd of de vergoeding doorloopt: geen gat claimen.
    assert.deepEqual(vergoedingsduur(aanbieder({ vm: 24, naVerlengingOnbekend: true }), 'verbouw'), { maanden: 24, gat: null, stoptInVerlenging: false });
    // Verlengingsduur onbekend, maar de vergoeding stopt er wel.
    assert.deepEqual(vergoedingsduur(aanbieder({ duurOnbekend: true, vm: 24 }), 'verbouw'), { maanden: 24, gat: null, stoptInVerlenging: true });
    // Rente alleen over het opgenomen deel: er valt niets te vergoeden.
    assert.deepEqual(vergoedingsduur(aanbieder({ model: 'rente-alleen-over-opgenomen', tarief: 'geen' }), 'verbouw'), { maanden: null, gat: 0, stoptInVerlenging: false });
});

test('vergoedingstarief volgt de regel van de aanbieder, nooit een gok', () => {
    assert.equal(vergoedingsTarief(aanbieder({}), 3.8), 3.8);
    bijna(vergoedingsTarief(aanbieder({ tarief: 'hypotheekrente-min-1' }), 3.8), 2.8);
    assert.equal(vergoedingsTarief(aanbieder({ tarief: 'hypotheekrente-min-1' }), 0.5), 0);
    assert.equal(vergoedingsTarief(aanbieder({ tarief: 'geen' }), 3.8), 0);
    assert.equal(vergoedingsTarief(aanbieder({ tarief: 'niet-gepubliceerd' }), 3.8), null);
    assert.equal(vergoedingsTarief(aanbieder({ tarief: 'verschilt-per-product' }), 3.8), null);
});

test('past: grenzen van standaardlooptijd en maximum', () => {
    const a = aanbieder({ basis: 12, verlenging: 12 });
    assert.equal(past(a, 'verbouw', 12), 'past');
    assert.equal(past(a, 'verbouw', 13), 'verlengen');
    assert.equal(past(a, 'verbouw', 24), 'verlengen');
    assert.equal(past(a, 'verbouw', 25), 'past-niet');
    assert.equal(past(aanbieder({ basis: 24, duurOnbekend: true }), 'verbouw', 30), 'verlengen-onbekend');
});

test('een procentpunt lager over 12 maanden: 1% over gemiddeld 25.000 = 250', () => {
    const r = renteverliesBijAanbieder(aanbieder({ basis: 12, verlenging: 12, vm: 12, tarief: 'hypotheekrente-min-1' }), scenario(12));
    bijna(r.van, 250);
    bijna(r.tot, 250);
});

test('vergoeding stopt na 12 van 15 maanden: 3,8% over maand 13 tot en met 15', () => {
    // Gemiddeld saldo in maand 13, 14 en 15: 50.000 x (2,5 + 1,5 + 0,5) / 15 = 15.000.
    // 15.000 x 3,8% / 12 = 47,50.
    const r = renteverliesBijAanbieder(aanbieder({ basis: 24, verlenging: 18, vm: 12 }), scenario(15));
    bijna(r.tot, 47.5);
});

test('lager tarief én gestopte vergoeding tellen op', () => {
    // Maand 1-12: 1% over 50.000 x (14,5 + ... + 3,5) / 15 = 360.000 -> 300,00.
    // Maand 13-15: 3,8% over 15.000 -> 47,50. Samen 347,50.
    const r = renteverliesBijAanbieder(aanbieder({ basis: 12, verlenging: 12, vm: 12, tarief: 'hypotheekrente-min-1' }), scenario(15));
    bijna(r.tot, 347.5);
    assert.equal(r.status, 'verlengen');
});

test('twintig maanden, vergoeding stopt na twaalf', () => {
    // 50.000 / 20 x (7,5 + 6,5 + ... + 0,5) = 2.500 x 32 = 80.000 -> x 3,8% / 12 = 253,33.
    bijna(renteverliesBijAanbieder(aanbieder({ basis: 24, verlenging: 18, vm: 12 }), scenario(20)).tot, 253.33);
});

test('vergoeding in de verlenging niet gepubliceerd: een bandbreedte', () => {
    const r = renteverliesBijAanbieder(aanbieder({ basis: 12, verlenging: 6, vm: 12, naVerlengingOnbekend: true }), scenario(15));
    bijna(r.van, 0, 'loopt de vergoeding door:');
    bijna(r.tot, 47.5, 'stopt de vergoeding:');
});

test('verlengingsduur onbekend: rekenen alsof verlenging wordt toegekend', () => {
    // 50.000 / 30 x (5,5 + ... + 0,5) = 1.666,67 x 18 = 30.000 -> x 3,8% / 12 = 95,00.
    const r = renteverliesBijAanbieder(aanbieder({ basis: 24, duurOnbekend: true, vm: 24 }), scenario(30));
    assert.equal(r.status, 'verlengen-onbekend');
    bijna(r.tot, 95);
});

test('niet uit te rekenen: depot dicht, of hoogte niet gepubliceerd', () => {
    const dicht = renteverliesBijAanbieder(aanbieder({ basis: 12, verlenging: 6 }), scenario(20));
    assert.equal(dicht.status, 'past-niet');
    assert.equal(dicht.reden, 'Het depot sluit na 18 maanden');
    assert.equal(dicht.van, undefined);
    assert.match(renteverliesBijAanbieder(aanbieder({ tarief: 'niet-gepubliceerd' }), scenario(12)).reden, /niet gepubliceerd/);
    assert.match(renteverliesBijAanbieder(aanbieder({ tarief: 'verschilt-per-product' }), scenario(12)).reden, /verschilt per product/);
});

test('rente alleen over het opgenomen deel: stilstaand geld kost niets', () => {
    const r = renteverliesBijAanbieder(aanbieder({ model: 'rente-alleen-over-opgenomen', tarief: 'geen', vm: 0 }), scenario(15));
    assert.equal(r.tot, 0);
});

test('voor elke echte aanbieder en elke duur: een bedrag of een reden, nooit NaN', () => {
    for (const bank of BANKEN) {
        for (const soort of ['verbouw', 'nieuwbouw']) {
            const vd = vergoedingsduur(bank, soort);
            assert.ok(vd.gat === null || vd.gat >= 0, `${bank.naam}: negatief gat`);
            for (let maanden = 1; maanden <= 48; maanden++) {
                const r = renteverliesBijAanbieder(bank, { soort, depot: 50000, rentePercent: 3.8, maanden });
                if (r.reden) continue;
                assert.ok(Number.isFinite(r.van) && Number.isFinite(r.tot) && r.van <= r.tot + 1e-9 && r.van >= -1e-9,
                    `${bank.naam} ${soort} ${maanden} mnd: ${JSON.stringify(r)}`);
            }
        }
    }
});
