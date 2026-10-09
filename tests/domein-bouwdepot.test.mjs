/**
 * De rekenkern van bouwdepot-berekenen.html, nagerekend met de hand.
 *
 * De verwachte bedragen hieronder komen niet uit de code die getest wordt: ze
 * zijn uitgeschreven met de annuïteitenformule en met het saldo per maand. Zo
 * faalt de test ook als de rekenkern en de pagina het samen eens zijn over een
 * fout antwoord.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { berekenDepot, opnameTermijnen, STANDAARD_DEPOT, MAANDEN_NA } from '../src/domain/bouwdepot.js';
import { maandlastExtraLening } from '../src/domain/verbouwing.js';

const bijna = (werkelijk, verwacht, marge = 0.005, uitleg = '') =>
    assert.ok(Math.abs(werkelijk - verwacht) <= marge, `${uitleg} verwacht ${verwacht}, kreeg ${werkelijk}`);

const R = 0.038 / 12;
/** De annuïteit, los van de code uitgeschreven. */
const annuiteit = (hoofdsom, r, n) => (hoofdsom * r) / (1 - (1 + r) ** -n);

test('de standaardinvoer: € 25.000 tegen 3,80% over 30 jaar is € 116 per maand', () => {
    const t = berekenDepot();
    bijna(t.maandlastDaarna, annuiteit(25000, R, 360));
    assert.equal(Math.round(t.maandlastDaarna), 116);
    assert.equal(t.lening, 25000);
    assert.equal(t.regels.length, STANDAARD_DEPOT.duurMaanden + MAANDEN_NA);
});

test('de maandlast na de verbouwing is dezelfde als op de homepage en de verbouwpagina', () => {
    for (const [bedrag, rente, jaren] of [[25000, 3.8, 30], [60000, 4.1, 20], [100000, 3.2, 10]]) {
        const t = berekenDepot({ depot: bedrag, rentePercent: rente, looptijdJaren: jaren });
        bijna(t.maandlastDaarna, maandlastExtraLening(bedrag, rente, jaren), 1e-6);
    }
});

test('gelijkmatig opnemen: de vergoeding is die over precies het halve depot', () => {
    // Zes maanden, depot van 25.000 naar 0 in gelijke stappen. Het gemiddelde
    // saldo is de helft: 12.500 x 3,8% / 12 x 6 maanden = 237,50.
    const t = berekenDepot();
    bijna(t.sommen.vergoeding, 237.5, 1e-6);
    bijna(t.gemiddeldInDepot, 0.5, 1e-9);
    // Maand 1: het saldo gaat van 25.000 naar 20.833,33; gemiddeld 22.916,67.
    bijna(t.eerste.vergoeding, 22916.6667 * R, 1e-3);
    bijna(t.eerste.hypotheek, annuiteit(25000, R, 360) - 22916.6667 * R, 1e-3);
    assert.equal(Math.round(t.eerste.hypotheek), 44);
});

test('een opname verlaagt het depot en niet de schuld', () => {
    const t = berekenDepot();
    assert.equal(t.regels[5].depot, 0, 'na zes maanden is het depot leeg');
    // De schuld daalt alleen met de aflossing uit het betaalschema.
    const afgelost = t.regels.slice(0, 6).reduce((s, r) => s + r.aflossing, 0);
    bijna(t.regels[5].restschuld, 25000 - afgelost, 1e-6);
    assert.ok(t.regels[5].restschuld > 24700, 'de schuld is niet met de opnames gedaald');
});

test('vooral aan het begin of aan het eind: het saldo per maand klopt', () => {
    // Drie maanden, gewichten 3-2-1: opnames 12.500, 8.333,33 en 4.166,67.
    const vroeg = berekenDepot({ duurMaanden: 3, patroon: 'vroeg' });
    bijna(vroeg.regels[0].depot, 12500, 1e-6);
    bijna(vroeg.regels[1].depot, 4166.6667, 1e-3);
    assert.equal(vroeg.regels[2].depot, 0);
    // Gemiddeld saldo per maand: 18.750, 8.333,33 en 2.083,33.
    bijna(vroeg.sommen.vergoeding, 29166.6667 * R, 1e-3);
    bijna(vroeg.gemiddeldInDepot, 29166.6667 / 3 / 25000, 1e-6);

    // Het spiegelbeeld: 4.166,67, 8.333,33 en 12.500.
    const laat = berekenDepot({ duurMaanden: 3, patroon: 'laat' });
    bijna(laat.regels[0].depot, 20833.3333, 1e-3);
    bijna(laat.regels[1].depot, 12500, 1e-6);
    bijna(laat.sommen.vergoeding, 45833.3333 * R, 1e-3);
    assert.ok(laat.sommen.vergoeding > vroeg.sommen.vergoeding, 'later opnemen geeft meer vergoeding');
});

test('elk opnamepatroon telt op tot 100% en beslaat elke maand', () => {
    for (const patroon of ['gelijk', 'vroeg', 'laat']) {
        for (const n of [1, 2, 6, 12, 36]) {
            const termijnen = opnameTermijnen(patroon, n);
            assert.equal(termijnen.length, n);
            bijna(termijnen.reduce((s, t) => s + t.percent, 0), 100, 1e-9, `${patroon}/${n}`);
            assert.ok(termijnen.every((t) => t.percent > 0), `${patroon}/${n}: elke maand een opname`);
            assert.equal(berekenDepot({ patroon, duurMaanden: n }).regels[n - 1].depot, 0, `${patroon}/${n}: depot leeg`);
        }
    }
    assert.throws(() => opnameTermijnen('onzin', 6));
});

test('een lagere of geen depotvergoeding', () => {
    // Eén procentpunt lager: 2,8% over hetzelfde halve depot.
    const lager = berekenDepot({ kortingDepotPercent: 1 });
    bijna(lager.sommen.vergoeding, 12500 * (0.028 / 12) * 6, 1e-6);
    // Geen vergoeding: je betaalt elke maand de volle termijn.
    const geen = berekenDepot({ kortingDepotPercent: 3.8 });
    assert.equal(geen.sommen.vergoeding, 0);
    bijna(geen.eerste.hypotheek, annuiteit(25000, R, 360), 1e-9);
    bijna(geen.sommen.renteNaVergoeding, geen.sommen.rente, 1e-9);
});

test('rente min vergoeding tijdens de verbouwing', () => {
    const t = berekenDepot();
    bijna(t.sommen.renteNaVergoeding, t.sommen.rente - 237.5, 1e-6);
    // De rente over zes maanden is iets minder dan 6 x 79,17, omdat er wordt afgelost.
    assert.ok(t.sommen.rente < 6 * 25000 * R && t.sommen.rente > 6 * 25000 * R - 2);
    bijna(t.sommen.zelfBetaald, 6 * annuiteit(25000, R, 360) - 237.5, 1e-6);
    bijna(t.gemiddeldTijdens, annuiteit(25000, R, 360) - 237.5 / 6, 1e-6);
});

test('lineair: de eerste maand na de verbouwing, en de rente over de looptijd', () => {
    const t = berekenDepot({ vorm: 'lineair' });
    const aflossing = 25000 / 360;
    // Maand 7: er is zes keer afgelost.
    bijna(t.daarna.aflossing, aflossing, 1e-9);
    bijna(t.daarna.rente, (25000 - 6 * aflossing) * R, 1e-9);
    // Som van de rente bij lineair: r x P x (n + 1) / 2.
    bijna(t.renteHeleLooptijd, R * 25000 * 361 / 2, 1e-6);
});

test('annuïteiten en aflossingsvrij: de rente over de hele looptijd', () => {
    bijna(berekenDepot().renteHeleLooptijd, annuiteit(25000, R, 360) * 360 - 25000, 1e-6);
    const vrij = berekenDepot({ vorm: 'aflossingsvrij', looptijdJaren: 20 });
    bijna(vrij.renteHeleLooptijd, 25000 * R * 240, 1e-6);
    bijna(vrij.maandlastDaarna, 25000 * R, 1e-9);
});

test('met de hypotheek voor de woning erbij loopt de rente over de hele lening', () => {
    const t = berekenDepot({ woning: 375000, depot: 25000 });
    assert.equal(t.lening, 400000);
    bijna(t.eerste.rente, 400000 * R, 1e-9);
    bijna(t.maandlastDaarna, annuiteit(400000, R, 360), 1e-6);
    // Alleen het depot staat in depot: de vergoeding verandert niet.
    bijna(t.sommen.vergoeding, 237.5, 1e-6);
    assert.equal(t.regels[0].depot + t.regels[0].opname, 25000);
});

test('een doorlopende woonlast telt mee tijdens de verbouwing en stopt daarna', () => {
    const t = berekenDepot({ woonlast: 1350 });
    assert.ok(t.regels.slice(0, 6).every((r) => r.woonlast === 1350));
    assert.ok(t.regels.slice(6).every((r) => r.woonlast === 0));
    bijna(t.eerste.totaal, t.eerste.hypotheek + 1350, 1e-9);
    assert.equal(t.sommen.woonlast, 6 * 1350);
    // De hoogste maand is dan de laatste van de verbouwing.
    assert.equal(t.hoogsteTijdens.maand, 6);
    assert.equal(t.piek.maand, 6);
    // De maandlast daarna is zonder woonlast.
    bijna(t.maandlastDaarna, annuiteit(25000, R, 360));
});

test('nul procent rente en een verbouwing van één maand', () => {
    const nul = berekenDepot({ rentePercent: 0 });
    bijna(nul.maandlastDaarna, 25000 / 360, 1e-9);
    assert.equal(nul.sommen.vergoeding, 0);
    assert.equal(nul.renteHeleLooptijd, 0);

    const kort = berekenDepot({ duurMaanden: 1 });
    assert.equal(kort.regels[0].depot, 0);
    // Eén maand: het saldo gaat van 25.000 naar 0, gemiddeld de helft.
    bijna(kort.sommen.vergoeding, 12500 * R, 1e-9);
    assert.equal(kort.regels.length, 1 + MAANDEN_NA);
});

test('elke maandregel telt op: rente + aflossing - vergoeding + woonlast = totaal', () => {
    const t = berekenDepot({ woning: 300000, depot: 80000, kortingDepotPercent: 1, duurMaanden: 9, patroon: 'laat', woonlast: 900, vorm: 'lineair' });
    for (const r of t.regels) {
        bijna(r.totaal, r.rente + r.aflossing - r.vergoeding + r.woonlast, 1e-9, `maand ${r.maand}`);
    }
});
