/**
 * De rekenkern van de nieuwbouwpagina, getoetst aan uitkomsten die los van de
 * code zijn uitgerekend.
 *
 * Elk verwacht bedrag hieronder komt uit een handberekening of een gesloten
 * formule die in het commentaar staat, niet uit de functie die getest wordt.
 * Een test die de uitkomst van de code overtikt, bewaakt alleen dat de code
 * niet verandert -- niet dat hij klopt.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { leningschema } from '../src/domain/hypotheek.js';
import {
    STANDAARD, berekenTijdlijn, controleerSchema, gespreideTermijnen, standaardTermijnen, vergelijk,
} from '../src/domain/nieuwbouw.js';

const bijna = (werkelijk, verwacht, wat, marge = 0.01) =>
    assert.ok(Math.abs(werkelijk - verwacht) < marge, `${wat}: ${werkelijk} in plaats van ${verwacht}`);

/* ----------------------------- hypotheek.js ----------------------------- */

test('annuiteit: vaste betaling, rente over de restschuld, na de looptijd op nul', () => {
    // € 500.000, 3,80%, 360 maanden. i = 0,038 / 12.
    //   T = H * i / (1 - (1 + i)^-360) = 2.329,79
    //   maand 1: rente = 500000 * i = 1.583,33; aflossing = 746,46
    const schema = leningschema({ hoofdsom: 500000, maandrente: 0.038 / 12, looptijdMaanden: 360 }, 360);
    bijna(schema[0].betaling, 2329.79, 'betaling');
    bijna(schema[0].rente, 1583.33, 'rente maand 1');
    bijna(schema[0].aflossing, 746.46, 'aflossing maand 1');
    bijna(schema[359].betaling, 2329.79, 'betaling laatste maand');
    bijna(schema[359].restschuld, 0, 'restschuld na de looptijd', 0.001);

    // Gesloten vorm voor de restschuld na k betalingen:
    //   R_k = H(1+i)^k - T((1+i)^k - 1) / i
    const i = 0.038 / 12, g = (1 + i) ** 12;
    bijna(schema[11].restschuld, 500000 * g - schema[0].betaling * (g - 1) / i, 'restschuld na 12 maanden');
});

test('lineair: vaste aflossing, dalende rente', () => {
    // € 360.000, 3,60%, 360 maanden: aflossing 1.000; rente 1.080, dan 1.077.
    const schema = leningschema({ hoofdsom: 360000, maandrente: 0.003, looptijdMaanden: 360, vorm: 'lineair' }, 3);
    bijna(schema[0].aflossing, 1000, 'aflossing');
    bijna(schema[0].rente, 1080, 'rente maand 1');
    bijna(schema[1].rente, 1077, 'rente maand 2');
    bijna(schema[2].restschuld, 357000, 'restschuld na 3 maanden');
});

test('aflossingsvrij: alleen rente, de schuld blijft staan', () => {
    const schema = leningschema({ hoofdsom: 360000, maandrente: 0.003, looptijdMaanden: 360, vorm: 'aflossingsvrij' }, 24);
    for (const r of schema) {
        bijna(r.rente, 1080, 'rente');
        assert.equal(r.aflossing, 0);
        assert.equal(r.restschuld, 360000);
    }
});

test('nul procent rente geeft geen deling door nul', () => {
    const schema = leningschema({ hoofdsom: 360000, maandrente: 0, looptijdMaanden: 360 }, 2);
    bijna(schema[0].betaling, 1000, 'betaling');
    assert.equal(schema[0].rente, 0);
    assert.ok(schema.every((r) => Number.isFinite(r.betaling)));
});

test('een onbekende hypotheekvorm wordt geweigerd in plaats van stil als annuiteit gerekend', () => {
    assert.throws(() => leningschema({ hoofdsom: 1, maandrente: 0, looptijdMaanden: 1, vorm: 'spaar' }, 1));
});

/* ----------------------------- nieuwbouw.js ----------------------------- */

test('standaardinvoer: maand 1, de laatste bouwmaand en de piek', () => {
    const t = berekenTijdlijn();
    assert.equal(t.lening, 500000);
    assert.equal(t.oplevermaand, 12);
    assert.equal(t.eindeOverlap, 14);

    // Maand 1: depot 350.000 -> 297.500, gemiddeld 323.750.
    //   vergoeding = 323750 * 0,038 / 12 = 1.025,21
    //   hypotheek  = 2.329,79 - 1.025,21 = 1.304,58; met 1.200 woonlast 2.504,58
    const m1 = t.regels[0];
    assert.equal(m1.depot, 297500);
    bijna(m1.vergoeding, 1025.21, 'vergoeding maand 1');
    bijna(m1.totaal, 2504.58, 'totaal maand 1');

    // Maand 12: depot 70.000 -> 0, gemiddeld 35.000; vergoeding 110,83.
    const m12 = t.regels[11];
    assert.equal(m12.depot, 0);
    bijna(m12.totaal, 2329.79 - 110.83 + 1200, 'totaal maand 12');

    // Maand 13: depot leeg, oude woonlast loopt nog: 2.329,79 + 1.200.
    assert.equal(t.piek.maand, 13);
    assert.equal(t.piek.fase, 'overlap');
    bijna(t.piek.totaal, 3529.79, 'piek');

    // Maand 15: alleen de hypotheek.
    assert.equal(t.regels[14].fase, 'na');
    bijna(t.regels[14].totaal, 2329.79, 'maand na de overlap');
    bijna(t.maandlastDaarna, 2329.79, 'maandlast daarna');
});

test('standaardinvoer: sommen over de bouw', () => {
    const t = berekenTijdlijn();

    // Vergoeding: som van de gemiddelde maandsaldi maal de maandrente.
    //   323.750 + 297.500 + 262.500 + 227.500 + 227.500 + 192.500 + 157.500
    //   + 157.500 + 113.750 + 70.000 + 70.000 + 35.000 = 2.135.000
    //   2.135.000 * 0,038 / 12 = 6.760,83
    bijna(t.sommen.vergoeding, 6760.83, 'totale vergoeding');

    // Rente over twaalf maanden = twaalf betalingen min wat er is afgelost.
    const i = 0.038 / 12, g = (1 + i) ** 12, T = 500000 * i / (1 - (1 + i) ** -360);
    const afgelost = 500000 - (500000 * g - T * (g - 1) / i);
    bijna(t.sommen.renteTijdensBouw, 12 * T - afgelost, 'rente tijdens de bouw');
    bijna(t.sommen.renteNaVergoeding, 12 * T - afgelost - 6760.83, 'rente na vergoeding');

    assert.equal(t.sommen.maandenDubbel, 14);
    assert.equal(t.sommen.woonlastTijdensDubbel, 14 * 1200);
});

test('elke regel sluit: onderdelen tellen op tot het totaal en het depot wordt nooit negatief', () => {
    for (const invoer of [{}, { vorm: 'lineair' }, { vorm: 'aflossingsvrij' }, { bouwduurMaanden: 24, kortingDepotPercent: 0.5 }, { rentePercent: 0 }]) {
        const t = berekenTijdlijn(invoer);
        let depot = t.depotBijStart;
        for (const r of t.regels) {
            bijna(r.rente + r.aflossing, r.betaling, 'rente + aflossing = betaling', 1e-6);
            bijna(Math.max(0, r.betaling - r.vergoeding) + r.woonlast, r.totaal, 'totaal', 1e-6);
            bijna(depot - r.opname, r.depot, 'depotverloop', 1e-6);
            assert.ok(r.depot >= 0 && Number.isFinite(r.totaal));
            depot = r.depot;
        }
        assert.equal(t.restDepotBijOplevering, 0);
    }
});

test('zonder overlap valt de piek in de laatste bouwmaand', () => {
    const t = berekenTijdlijn({ overlapNaOplevering: 0 });
    assert.equal(t.piek.maand, 12);
    bijna(t.piek.totaal, 3418.96, 'piek zonder overlap');
    assert.equal(t.regels[12].fase, 'na');
});

test('zonder huidige woonlast is er geen dubbele last', () => {
    const t = berekenTijdlijn({ huidigeWoonlast: 0 });
    bijna(t.piek.totaal, 2329.79, 'piek');
    assert.equal(t.sommen.woonlastTijdensDubbel, 0);
});

test('een afslag op de depotrente verlaagt de vergoeding en nooit onder nul', () => {
    // Afslag 1%: vergoeding maand 1 = 323750 * 0,028 / 12 = 755,42
    bijna(berekenTijdlijn({ kortingDepotPercent: 1 }).regels[0].vergoeding, 755.42, 'vergoeding met afslag');
    const zonder = berekenTijdlijn({ kortingDepotPercent: 9 });
    assert.ok(zonder.regels.every((r) => r.vergoeding === 0));
    bijna(zonder.regels[0].totaal, 2329.79 + 1200, 'totaal zonder vergoeding');
});

test('een termijn verplaatsen verandert depot, vergoeding en totaal in dezelfde maanden', () => {
    const basis = berekenTijdlijn();
    const termijnen = standaardTermijnen(12).map((t) => (t.maand === 3 ? { ...t, maand: 5 } : t));
    const later = berekenTijdlijn({ termijnen });
    // Maand 3 en 4 houden nu 297.500 in depot in plaats van 227.500.
    assert.equal(later.regels[2].depot, 297500);
    assert.equal(later.regels[3].depot, 297500);
    assert.equal(later.regels[4].depot, 227500);
    // Maand 4: 70.000 meer in depot, dus 70000 * 0,038 / 12 = 221,67 meer vergoeding.
    bijna(basis.regels[3].totaal - later.regels[3].totaal, 221.67, 'verschil maand 4');
    // Vanaf maand 6 is alles weer gelijk.
    for (let m = 5; m < basis.regels.length; m++) bijna(later.regels[m].totaal, basis.regels[m].totaal, `maand ${m + 1}`, 1e-6);
});

test('het standaardschema schaalt mee met de bouwduur en blijft 100%', () => {
    for (const duur of [1, 2, 6, 12, 18, 24, 36]) {
        for (const schema of [standaardTermijnen(duur), gespreideTermijnen(duur)]) {
            const { totaal, klachten } = controleerSchema(schema, duur);
            assert.equal(totaal, 100, `bouwduur ${duur}`);
            assert.deepEqual(klachten, [], `bouwduur ${duur}`);
            assert.equal(berekenTijdlijn({ bouwduurMaanden: duur, termijnen: schema }).restDepotBijOplevering, 0);
        }
    }
});

test('een schema dat niet sluit wordt benoemd', () => {
    const tekort = controleerSchema([{ maand: 1, percent: 40, naam: 'a' }, { maand: 6, percent: 50, naam: 'b' }], 12);
    assert.equal(tekort.totaal, 90);
    assert.match(tekort.klachten[0], /ontbreekt nog 10%/);

    const teveel = controleerSchema([{ maand: 1, percent: 60, naam: 'a' }, { maand: 6, percent: 50, naam: 'b' }], 12);
    assert.match(teveel.klachten[0], /meer dan het geheel/);

    const teLaat = controleerSchema([{ maand: 1, percent: 50, naam: 'a' }, { maand: 14, percent: 50, naam: 'b' }], 12);
    assert.match(teLaat.klachten[0], /maand 14/);

    assert.equal(controleerSchema([], 12).klachten.length, 1);
});

/* ------------------------------ vertraging ------------------------------ */

test('drie maanden later opgeleverd: de laatste termijn schuift, de rest blijft staan', () => {
    const t = berekenTijdlijn({ vertragingMaanden: 3 });
    assert.equal(t.oplevermaand, 15);
    assert.equal(t.eindeOverlap, 17);
    // Het restant van 70.000 blijft in depot tot maand 15.
    for (const m of [12, 13, 14]) {
        assert.equal(t.regels[m - 1].depot, 70000, `depot maand ${m}`);
        bijna(t.regels[m - 1].vergoeding, 221.67, `vergoeding maand ${m}`);
    }
    assert.equal(t.regels[14].depot, 0);
    assert.equal(t.regels[14].termijn, 'Oplevering');
    // De piek is even hoog, maar drie maanden later.
    assert.equal(t.piek.maand, 16);
    bijna(t.piek.totaal, 3529.79, 'piek');
});

test('vertraging kost niet "maanden maal huur": de vergoeding over het restdepot gaat eraf', () => {
    const v = vergelijk({}, { vertragingMaanden: 3 });
    assert.equal(v.horizon, 18);
    assert.equal(v.basis.regels.length, v.scenario.regels.length);

    // Drie maanden langer de oude woonlast: 3 * 1.200 = 3.600.
    assert.equal(v.verschil.woonlast, 3600);
    // Extra vergoeding over het restdepot van 70.000 (221,67 per volle maand):
    //   maand 12: 221,67 in plaats van 110,83   -> + 110,83
    //   maand 13 en 14: 221,67 in plaats van 0  -> + 443,33
    //   maand 15: 110,83 in plaats van 0        -> + 110,83
    //   samen 665,00
    bijna(v.verschil.vergoeding, 665, 'extra vergoeding');
    bijna(v.verschil.cumulatief, 3600 - 665, 'verschil over dezelfde 18 maanden');
    assert.equal(v.verschil.maandenDubbel, 3);
    assert.equal(v.verschil.piekmaand, 3);
    bijna(v.verschil.piek, 0, 'verschil in piek');
});

test('geen vertraging is geen verschil', () => {
    const v = vergelijk({}, { vertragingMaanden: 0 });
    bijna(v.verschil.cumulatief, 0, 'cumulatief', 1e-9);
    assert.equal(v.verschil.maandenDubbel, 0);
});

test('de standaardwaarden zijn die van de pagina', () => {
    assert.deepEqual({ ...STANDAARD }, {
        grond: 150000, aanneemsom: 350000, eigenGeld: 0, rentePercent: 3.8, kortingDepotPercent: 0, looptijdJaren: 30,
        vorm: 'annuiteit', bouwduurMaanden: 12, huidigeWoonlast: 1200, overlapNaOplevering: 2,
        renteMeefinancieren: false,
    });
});

test('zonder woonlast en zonder overlap ligt de hoogste maand na de oplevering', () => {
    // In de laatste bouwmaand komt er nog vergoeding binnen; de maand erna niet meer.
    const t = berekenTijdlijn({ huidigeWoonlast: 0, overlapNaOplevering: 0 });
    assert.equal(t.piek.maand, 13);
    assert.equal(t.piek.fase, 'na');
    bijna(t.piek.totaal, 2329.79, 'piek');
});

/* ------------------------------ eigen geld ------------------------------ */

test('eigen geld kleiner dan de grond: een lagere lening, hetzelfde depot', () => {
    // € 50.000 eigen geld: lening 450.000, depot blijft 350.000.
    //   annuiteit = 0,9 * 2.329,79 = 2.096,81
    //   maand 1: vergoeding ongewijzigd 1.025,21 -> 1.071,60; met woonlast 2.271,60
    const t = berekenTijdlijn({ eigenGeld: 50000 });
    assert.equal(t.lening, 450000);
    assert.equal(t.depotBijStart, 350000);
    bijna(t.regels[0].betaling, 2096.81, 'annuiteit');
    bijna(t.regels[0].totaal, 2271.60, 'totaal maand 1');
    assert.equal(t.regels[0].uitEigenGeld, 0);
    assert.equal(t.restDepotBijOplevering, 0);
});

test('eigen geld groter dan de grond: de rest betaalt de eerste termijnen, het depot is kleiner', () => {
    // € 200.000 eigen geld: 150.000 naar de grond, 50.000 voor de bouw.
    //   lening 300.000, depot 300.000.
    //   termijn 1 is 52.500: 50.000 uit eigen geld, 2.500 uit depot -> 297.500.
    //   vergoeding = (300000 + 297500) / 2 * 0,038 / 12 = 946,04
    //   annuiteit over 300.000 = 0,6 * 2.329,79 = 1.397,87
    const t = berekenTijdlijn({ eigenGeld: 200000 });
    assert.equal(t.lening, 300000);
    assert.equal(t.depotBijStart, 300000);
    const m1 = t.regels[0];
    assert.equal(m1.termijnbedrag, 52500);
    assert.equal(m1.uitEigenGeld, 50000);
    assert.equal(m1.opname, 2500);
    assert.equal(m1.depot, 297500);
    bijna(m1.vergoeding, 946.04, 'vergoeding maand 1');
    bijna(m1.betaling, 1397.87, 'annuiteit');
    // Daarna is het eigen geld op en komt alles uit het depot.
    assert.equal(t.regels[2].uitEigenGeld, 0);
    assert.equal(t.restDepotBijOplevering, 0);
    // Elke termijn is volledig betaald: eigen geld plus depot.
    for (const r of t.regels) bijna(r.uitEigenGeld + r.opname, r.termijnbedrag, `termijn maand ${r.maand}`, 1e-6);
});

test('alles uit eigen geld: geen lening, geen depot, geen hypotheeklast', () => {
    const t = berekenTijdlijn({ eigenGeld: 500000 });
    assert.equal(t.lening, 0);
    assert.equal(t.depotBijStart, 0);
    assert.ok(t.regels.every((r) => r.hypotheek === 0 && r.vergoeding === 0 && Number.isFinite(r.totaal)));
    assert.equal(t.piek.totaal, 1200);
});

/* ---------------------- rente tijdens de bouw meefinancieren ---------------------- */

test('meefinancieren: tijdens de bouw betaal je alleen de aflossing, daarna meer', () => {
    const zelf = berekenTijdlijn();
    const mee = berekenTijdlijn({ renteMeefinancieren: true });
    const R = mee.meegefinancierd;

    // De lening en het depot zijn R hoger; het potje is bij oplevering leeg.
    bijna(mee.lening, 500000 + R, 'lening', 1e-6);
    bijna(mee.depotBijStart, 350000 + R, 'depot bij start', 1e-6);
    bijna(mee.sommen.renteUitDepot, R, 'uit het potje gehaald', 0.01);
    bijna(mee.restDepotBijOplevering, 0, 'depot bij oplevering', 0.01);

    // Maand 1, onafhankelijk van R: rente over (500.000 + R), vergoeding over
    // gemiddeld (323.750 + R). Het verschil is 176.250 * 0,038 / 12 = 558,13.
    bijna(mee.regels[0].renteUitDepot, 558.13, 'rente uit depot in maand 1');

    // Uit eigen zak tijdens de bouw: alleen de aflossing, plus de woonlast.
    for (const r of mee.regels.filter((x) => x.fase === 'bouw')) {
        bijna(r.hypotheek, r.aflossing, `eigen betaling maand ${r.maand}`, 0.01);
        bijna(r.totaal, r.aflossing + 1200, `totaal maand ${r.maand}`, 0.01);
    }

    // R is iets meer dan de rente min vergoeding zonder meefinancieren (12.081):
    // over R zelf loopt ook rente, waar vergoeding tegenover staat zolang het
    // nog in depot zit.
    assert.ok(R > zelf.sommen.renteNaVergoeding && R < zelf.sommen.renteNaVergoeding * 1.03, `R is ${R}`);

    // Daarna betaal je over een hogere lening: annuiteit over (500.000 + R).
    const i = 0.038 / 12;
    bijna(mee.maandlastDaarna, (500000 + R) * i / (1 - (1 + i) ** -360), 'maandlast daarna');
    assert.ok(mee.maandlastDaarna > zelf.maandlastDaarna);
    // De piek ligt nu na de oplevering en is hoger dan zonder meefinancieren.
    assert.equal(mee.piek.maand, 13);
    assert.ok(mee.piek.totaal > zelf.piek.totaal);
});

test('meefinancieren bij een aflossingsvrije lening: tijdens de bouw alleen de woonlast', () => {
    const t = berekenTijdlijn({ renteMeefinancieren: true, vorm: 'aflossingsvrij' });
    for (const r of t.regels.filter((x) => x.fase === 'bouw')) bijna(r.totaal, 1200, `maand ${r.maand}`, 0.01);
    bijna(t.restDepotBijOplevering, 0, 'depot bij oplevering', 0.01);
});

test('meefinancieren en vertraging: het potje is op, de rest betaal je zelf', () => {
    const v = vergelijk({ renteMeefinancieren: true }, { vertragingMaanden: 3 });
    assert.equal(v.scenario.meegefinancierd, v.basis.meegefinancierd);
    // In de maanden van uitstel is er geen potje meer: rente min vergoeding uit eigen zak.
    const m14 = v.scenario.regels[13];
    assert.equal(m14.fase, 'bouw');
    bijna(m14.renteUitDepot, 0, 'rente uit depot in maand 14', 0.01);
    bijna(m14.hypotheek, m14.betaling - m14.vergoeding, 'eigen betaling maand 14', 0.01);
    assert.ok(v.verschil.cumulatief > 0);
});

/* ------------------------- al vervallen bij de notaris ------------------------- */

test('een termijn in maand 0 is bij de notaris betaald en komt niet in het depot', () => {
    const termijnen = standaardTermijnen(12).map((t) => (t.maand === 1 ? { ...t, maand: 0 } : t));
    const t = berekenTijdlijn({ termijnen });
    assert.equal(t.vervallenBijNotaris, 52500);
    assert.equal(t.depotBijStart, 297500);
    assert.equal(t.lening, 500000);
    // Maand 1: het depot blijft 297.500; vergoeding 297500 * 0,038 / 12 = 942,08.
    assert.equal(t.regels[0].depot, 297500);
    bijna(t.regels[0].vergoeding, 942.08, 'vergoeding maand 1');
    assert.equal(t.restDepotBijOplevering, 0);
    assert.deepEqual(controleerSchema(termijnen, 12).klachten, []);
    assert.equal(controleerSchema([{ maand: -1, percent: 100, naam: 'x' }], 12).klachten.length, 1);
});
