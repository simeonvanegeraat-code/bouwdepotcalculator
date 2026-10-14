/**
 * Rekenen de tools hetzelfde als ze over hetzelfde gaan?
 *
 * Elke rekenpagina heeft een eigen rekenkern met eigen tests. Die bewaken of
 * een pagina juist rekent, niet of twee pagina's elkaar tegenspreken. Op
 * 14 oktober 2026 is één situatie door alle kernen gehaald; deze test legt de
 * plekken vast waar ze hetzelfde moeten zeggen, met een handberekening ernaast.
 *
 * Waar ze bewust verschillen, staat dat erbij (zie de laatste test).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { berekenDepot } from '../src/domain/bouwdepot.js';
import { berekenTijdlijn, standaardTermijnen, STANDAARD } from '../src/domain/nieuwbouw.js';
import { bedragentabel } from '../src/domain/bedragentabel.js';
import { maandlastExtraLening } from '../src/domain/verbouwing.js';
import { berekenRenteverlies } from '../src/domain/renteverlies.js';
import { berekenOverlap } from '../src/domain/dubbelelasten.js';

const cent = (a, b, uitleg) => assert.ok(Math.abs(a - b) < 0.005, `${uitleg}: ${a} tegenover ${b}`);
const r = 0.038 / 12;

test('de maandlast van een lening is op elke pagina dezelfde', () => {
    // Met de hand: annuïteit over € 100.000, 3,8% per jaar, 360 maanden = € 465,96.
    const hand = (100000 * r) / (1 - (1 + r) ** -360);
    assert.equal(Math.round(hand * 100) / 100, 465.96);
    cent(berekenDepot({ depot: 100000, duurMaanden: 6 }).maandlastDaarna, hand, 'bouwdepot berekenen');
    cent(bedragentabel({ rentePercent: 3.8, bedragen: [100000] })[0].maandlast, hand, 'bedragentabel');
    cent(maandlastExtraLening(100000, 3.8, 30), hand, 'verbouwroute');
    const nb = berekenTijdlijn({ ...STANDAARD, grond: 0, aanneemsom: 100000, huidigeWoonlast: 0, overlapNaOplevering: 0, termijnen: standaardTermijnen(12) });
    cent(nb.maandlastDaarna, hand, 'nieuwbouwroute');
});

test('wat een lagere depotvergoeding kost, is op beide pagina\'s hetzelfde', () => {
    // € 100.000 depot, 12 maanden gelijk opnemen. Met de hand: het gemiddelde
    // saldo is € 600.000 aan maandsaldi; 1 procentpunt daarover is € 500.
    let saldi = 0;
    for (let i = 1; i <= 12; i++) saldi += 100000 * (12 - i + 0.5) / 12;
    const hand = saldi * 0.01 / 12;
    assert.equal(Math.round(hand), 500);
    const gelijk = berekenDepot({ depot: 100000, duurMaanden: 12, kortingDepotPercent: 0 });
    const lager = berekenDepot({ depot: 100000, duurMaanden: 12, kortingDepotPercent: 1 });
    cent(lager.sommen.renteNaVergoeding - gelijk.sommen.renteNaVergoeding, hand, 'bouwdepot berekenen');
    cent(berekenRenteverlies({ depot: 100000, rentePercent: 3.8, vergoedingPercent: 2.8, maanden: 12, vergoedingMaanden: 12, patroon: 'gelijk' }).renteverlies, hand, 'renteverlies');
    // En bij een vergoeding gelijk aan de rente kost stilstaand geld niets.
    assert.equal(berekenRenteverlies({ depot: 100000, rentePercent: 3.8, vergoedingPercent: 3.8, maanden: 12, vergoedingMaanden: 12 }).renteverlies, 0);
});

test('de dubbele lasten tellen op tot hetzelfde als de nieuwbouwroute, met dezelfde invoer', () => {
    const t = berekenTijdlijn({ ...STANDAARD, termijnen: standaardTermijnen(STANDAARD.bouwduurMaanden) });
    const maanden = t.sommen.maandenDubbel;
    const vergoeding = t.regels.slice(0, maanden).reduce((s, x) => s + x.vergoeding, 0) / maanden;
    const o = berekenOverlap({ huidig: STANDAARD.huidigeWoonlast, nieuw: t.maandlastDaarna, vergoeding, extra: 0, maanden, langer: 0 });
    cent(o.totaalBovenop, t.sommen.hypotheekTijdensDubbel, 'hypotheek tijdens de dubbele maanden');
    cent(o.totaal, t.sommen.totaalTijdensDubbel, 'alles tijdens de dubbele maanden');
    // Bewust verschillend: de pagina dubbele lasten geeft een gemiddelde per
    // maand, de nieuwbouwroute de zwaarste maand. Hetzelfde totaal, een ander getal.
    assert.ok(o.perMaand < t.piek.totaal);
});

test('waar de tools bewust anders rekenen', () => {
    // Renteverlies rekent de rente over het volle depot, zonder aflossing; bouwdepot
    // berekenen lost vanaf maand 1 af. De rente verschilt daardoor iets, het
    // renteverlies (rente min vergoeding over het stilstaande deel) niet.
    const d = berekenDepot({ depot: 100000, duurMaanden: 12 });
    const v = berekenRenteverlies({ depot: 100000, rentePercent: 3.8, vergoedingPercent: 3.8, maanden: 12, vergoedingMaanden: 12 });
    cent(v.rente, 100000 * r * 12, 'renteverlies: rente zonder aflossing');
    assert.ok(d.sommen.rente < v.rente, 'bouwdepot berekenen: minder rente door aflossing');
    cent(d.sommen.vergoeding, v.vergoeding, 'de vergoeding zelf is gelijk');
});

test('een vergoeding die eerder stopt, kost op beide pagina\'s hetzelfde', () => {
    // € 100.000 depot, 12 maanden gelijk opnemen, vergoeding gelijk aan de rente
    // maar alleen de eerste 6 maanden. Met de hand: in maand 7 tot en met 12
    // staat gemiddeld 5,5 + 4,5 + 3,5 + 2,5 + 1,5 + 0,5 = 18 twaalfde van het
    // depot, dus € 150.000 aan maandsaldi; 3,8% daarover is € 475.
    const hand = 150000 * r;
    assert.equal(Math.round(hand), 475);
    const doorlopend = berekenDepot({ depot: 100000, duurMaanden: 12 });
    const gestopt = berekenDepot({ depot: 100000, duurMaanden: 12, vergoedingMaanden: 6 });
    cent(gestopt.sommen.renteNaVergoeding - doorlopend.sommen.renteNaVergoeding, hand, 'bouwdepot berekenen');
    const v = berekenRenteverlies({ depot: 100000, rentePercent: 3.8, vergoedingPercent: 3.8, maanden: 12, vergoedingMaanden: 6 });
    cent(v.doorGestopteVergoeding, hand, 'renteverlies');
    // De eerste zes maanden zijn gelijk, daarna is er geen vergoeding meer.
    for (let i = 0; i < 6; i++) cent(gestopt.regels[i].vergoeding, doorlopend.regels[i].vergoeding, `maand ${i + 1}`);
    for (let i = 6; i < 12; i++) assert.equal(gestopt.regels[i].vergoeding, 0, `maand ${i + 1}`);
    // Stopt de vergoeding pas na de verbouwing, dan verandert er niets.
    cent(berekenDepot({ depot: 100000, duurMaanden: 12, vergoedingMaanden: 24 }).sommen.renteNaVergoeding, doorlopend.sommen.renteNaVergoeding, 'na de verbouwing');
    // En zonder instelling rekent de nieuwbouwroute zoals altijd.
    const t = berekenTijdlijn({ ...STANDAARD, termijnen: standaardTermijnen(12) });
    cent(t.piek.totaal, 3529.79, 'de hoogste maand van het nieuwbouwvoorbeeld');
});
