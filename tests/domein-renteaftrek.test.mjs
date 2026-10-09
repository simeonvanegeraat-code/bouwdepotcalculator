/**
 * De rekenkern van de hypotheekrenteaftrek, nagerekend met de hand.
 *
 * De verwachte bedragen zijn uitgeschreven met de regels van 2026:
 *   schijven    35,75% tot 38.883, 37,56% tot 78.426, daarboven 49,50%
 *   aftrek      hooguit 37,56% (tariefsaanpassing 11,94% in de hoogste schijf)
 *   Hillen      71,867%
 *   AOW         eerste schijf 17,85%
 *   korting     algemene heffingskorting 3.115, min 6,398% per euro boven 29.736
 *               (AOW: 1.556 en 3,195%)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { belastingBox1, algemeneHeffingskorting, woningEffect, huishoudEffect, berekenAftrek } from '../src/domain/renteaftrek.js';
import { TAX_RULES_2026 } from '../src/js/fiscal-rules.js';

const bijna = (werkelijk, verwacht, marge = 0.005, uitleg = '') =>
    assert.ok(Math.abs(werkelijk - verwacht) <= marge, `${uitleg} verwacht ${verwacht}, kreeg ${werkelijk}`);

/** De heffingskorting, los van de code uitgeschreven. */
const ahk = (inkomen) => Math.max(0, 3115 - 0.06398 * Math.max(0, inkomen - 29736));

test('de constanten van 2026 zijn die van de Belastingdienst', () => {
    assert.equal(TAX_RULES_2026.firstBracketLimit, 38883);
    assert.equal(TAX_RULES_2026.secondBracketLimit, 78426);
    assert.equal(TAX_RULES_2026.firstRate, 0.3575);
    assert.equal(TAX_RULES_2026.secondRate, 0.3756);
    assert.equal(TAX_RULES_2026.thirdRate, 0.495);
    assert.equal(TAX_RULES_2026.maxMortgageDeductionRate, 0.3756);
    assert.equal(TAX_RULES_2026.aowFirstRate, 0.1785);
    assert.equal(TAX_RULES_2026.hillenDeductionRate, 0.71867);
    assert.equal(TAX_RULES_2026.hillenEndYear, 2041);
    assert.equal(TAX_RULES_2026.generalCreditMax, 3115);
    assert.equal(TAX_RULES_2026.generalCreditStart, 29736);
    assert.equal(TAX_RULES_2026.generalCreditPhaseOut, 0.06398);
});

test('belasting box 1 per schijf', () => {
    bijna(belastingBox1(30000), 30000 * 0.3575);
    bijna(belastingBox1(60000), 38883 * 0.3575 + 21117 * 0.3756);
    bijna(belastingBox1(100000), 38883 * 0.3575 + 39543 * 0.3756 + 21574 * 0.495);
    bijna(belastingBox1(30000, { aow: true }), 30000 * 0.1785);
    assert.equal(belastingBox1(-5), 0);
});

test('de algemene heffingskorting: vol, in afbouw en nul', () => {
    assert.equal(algemeneHeffingskorting(20000), 3115);
    assert.equal(algemeneHeffingskorting(29736), 3115);
    bijna(algemeneHeffingskorting(50000), 3115 - 0.06398 * 20264);
    assert.equal(algemeneHeffingskorting(78426), 0);
    assert.equal(algemeneHeffingskorting(120000), 0);
    assert.equal(algemeneHeffingskorting(20000, { aow: true }), 1556);
    bijna(algemeneHeffingskorting(50000, { aow: true }), 1556 - 0.03195 * 20264);
});

test('middeninkomen: het saldo tegen 37,56%, plus 6,398% extra heffingskorting', () => {
    // 60.000 inkomen, 11.000 rente, 1.400 forfait: het inkomen daalt met 9.600.
    const e = woningEffect({ inkomen: 60000, kosten: 11000, forfait: 1400 });
    bijna(e.extraKorting, 9600 * 0.06398);
    bijna(e.voordeel, 9600 * 0.3756 + 9600 * 0.06398);
    assert.equal(e.tariefsaanpassing, 0);
    assert.equal(e.saldo, 9600);
});

test('hoog inkomen: rente telt voor 37,56%, het forfait wordt tegen 49,50% belast', () => {
    // 100.000 inkomen, 10.000 rente, 1.400 forfait.
    // Het inkomen daalt met 8.600 in de hoogste schijf: 8.600 x 49,5% = 4.257.
    // Tariefsaanpassing over de hele rente: 10.000 x 11,94% = 1.194.
    // Blijft 3.063: dat is 10.000 x 37,56% min 1.400 x 49,5%.
    // Het inkomen blijft boven 78.426, dus er komt geen heffingskorting bij.
    const e = woningEffect({ inkomen: 100000, kosten: 10000, forfait: 1400 });
    bijna(e.tariefsaanpassing, 1194);
    assert.equal(e.extraKorting, 0);
    bijna(e.voordeel, 3063);
    bijna(e.voordeel, 10000 * 0.3756 - 1400 * 0.495);
});

test('inkomen net boven de schijfgrens: tariefsaanpassing over een deel, en korting erbij', () => {
    // 80.000 inkomen, 10.000 rente, 1.400 forfait. Inkomen met woning: 71.400.
    // Van 80.000 naar 78.426: 1.574 x 49,5% = 779,13. De rest, 7.026 x 37,56% = 2.638,97.
    // In de hoogste schijf valt 80.000 + 1.400 - 78.426 = 2.974 van de kosten:
    // tariefsaanpassing 2.974 x 11,94% = 355,10.
    // Heffingskorting: bij 80.000 nul, bij 71.400 weer 3.115 - 6,398% x 41.664.
    const e = woningEffect({ inkomen: 80000, kosten: 10000, forfait: 1400 });
    bijna(e.tariefsaanpassing, 355.0956, 1e-3);
    bijna(e.extraKorting, 3115 - 0.06398 * 41664, 1e-6);
    bijna(e.voordeel, 779.13 + 2638.9656 - 355.0956 + (3115 - 0.06398 * 41664), 1e-3);
});

test('66.000 en 88.000 liggen niet ver uit elkaar, en dat klopt', () => {
    // Beide krijgen 37,56% over de rente. Wie 66.000 verdient krijgt daarnaast
    // meer heffingskorting terug; wie 88.000 verdient betaalt 49,5% over het
    // forfait en heeft nauwelijks nog korting om terug te krijgen.
    const a = woningEffect({ inkomen: 66000, kosten: 11000, forfait: 1400 });
    const b = woningEffect({ inkomen: 88000, kosten: 11000, forfait: 1400 });
    bijna(a.voordeel, 9600 * (0.3756 + 0.06398));
    // 88.000: inkomen met woning 78.400, net onder de grens.
    // 9.574 x 49,5% + 26 x 37,56% - 11,94% x min(11.000, 10.974) + korting over 26 euro.
    bijna(b.voordeel, 9574 * 0.495 + 26 * 0.3756 - 0.1194 * 10974 + ahk(78400), 1e-3);
    assert.ok(a.voordeel > b.voordeel);
});

test('de aftrek die over de eerste schijfgrens heen gaat', () => {
    // 40.000 inkomen, 2.000 saldo: 1.117 tegen 37,56% en 883 tegen 35,75%.
    const e = woningEffect({ inkomen: 40000, kosten: 3400, forfait: 1400 });
    bijna(e.voordeel, 1117 * 0.3756 + 883 * 0.3575 + 2000 * 0.06398, 1e-3);
});

test('Hillen: weinig rente, dus een bijtelling van 28,133% van het verschil', () => {
    // Het voorbeeld van de Belastingdienst: forfait 1.200, kosten 1.000.
    // Aftrek 200 x 71,867% = 143,73; bijtelling 56,27.
    const e = woningEffect({ inkomen: 60000, kosten: 1000, forfait: 1200 });
    bijna(e.hillenAftrek, 143.734, 1e-3);
    bijna(e.bijtelling, 56.266, 1e-3);
    // De bijtelling kost belasting én heffingskorting.
    bijna(e.voordeel, -56.266 * (0.3756 + 0.06398), 1e-3);
    assert.ok(e.voordeel < 0, 'per saldo betaal je belasting over de woning');
});

test('geen hypotheek: alleen het forfait na Hillen', () => {
    const e = woningEffect({ inkomen: 100000, kosten: 0, forfait: 1400 });
    bijna(e.bijtelling, 1400 * (1 - 0.71867), 1e-6);
    bijna(e.voordeel, -1400 * (1 - 0.71867) * 0.495, 1e-6);
    assert.equal(e.tariefsaanpassing, 0);
});

test('AOW-leeftijd: in de eerste schijf komt 17,85% terug', () => {
    // 30.000 inkomen, saldo 3.600: het inkomen zakt naar 26.400, onder de
    // afbouwgrens. Aan korting komt terug wat boven 29.736 was afgebouwd: 264 euro.
    const jong = woningEffect({ inkomen: 30000, kosten: 5000, forfait: 1400 });
    const aow = woningEffect({ inkomen: 30000, kosten: 5000, forfait: 1400, aow: true });
    bijna(jong.voordeel, 3600 * 0.3575 + 264 * 0.06398);
    bijna(aow.voordeel, 3600 * 0.1785 + 264 * 0.03195);
});

test('de korting kan niet groter worden dan de belasting', () => {
    // 5.000 inkomen: belasting 1.787,50, korting 3.115. Er valt niets terug te krijgen.
    const e = woningEffect({ inkomen: 5000, kosten: 4000, forfait: 1400 });
    assert.equal(e.voordeel, 0);
});

test('fiscale partner: het hoogste inkomen is niet vanzelf het gunstigst', () => {
    // 88.000 en 40.000, 11.000 rente, 1.400 forfait.
    const basis = { kosten: 11000, forfait: 1400, inkomen: 88000, partner: true, inkomenPartner: 40000 };
    const ik = huishoudEffect({ ...basis, verdeling: 'ik' });
    const partner = huishoudEffect({ ...basis, verdeling: 'partner' });
    const half = huishoudEffect({ ...basis, verdeling: 'half' });
    const beste = huishoudEffect({ ...basis, verdeling: 'beste' });

    bijna(ik.voordeel, woningEffect({ inkomen: 88000, kosten: 11000, forfait: 1400 }).voordeel, 1e-9);
    // Bij de partner met 40.000: 1.117 tegen 37,56%, 8.483 tegen 35,75%, plus korting.
    bijna(partner.voordeel, 1117 * 0.3756 + 8483 * 0.3575 + (ahk(30400) - ahk(40000)), 1e-3);
    assert.ok(partner.voordeel > ik.voordeel, 'bij het lagere inkomen levert het hier meer op');
    bijna(half.voordeel, woningEffect({ inkomen: 88000, kosten: 5500, forfait: 700 }).voordeel
        + woningEffect({ inkomen: 40000, kosten: 5500, forfait: 700 }).voordeel, 1e-9);
    assert.equal(half.deelBijJou, 0.5);
    // De gunstigste is minstens zo goed als elk van de drie.
    for (const v of [ik, partner, half]) assert.ok(beste.voordeel >= v.voordeel - 0.005);
    assert.match(beste.bij, /jou|partner/);
});

test('fiscale partner: de woorden bij de verdeling', () => {
    const basis = { kosten: 11000, forfait: 1400, inkomen: 60000, partner: true, inkomenPartner: 60000 };
    assert.equal(huishoudEffect({ ...basis, verdeling: 'ik' }).bij, 'jou');
    assert.equal(huishoudEffect({ ...basis, verdeling: 'partner' }).bij, 'je partner');
    assert.equal(huishoudEffect({ ...basis, verdeling: 'half' }).bij, 'jou voor 50% en je partner voor 50%');
    // Twee gelijke inkomens in dezelfde schijf: elke verdeling geeft hetzelfde,
    // en dan kiest "gunstigste" de eenvoudigste.
    assert.equal(huishoudEffect({ ...basis, verdeling: 'beste' }).bij, 'jou');
    // Zonder partner telt het partnerinkomen niet mee.
    assert.equal(huishoudEffect({ kosten: 11000, forfait: 1400, inkomen: 30000, inkomenPartner: 60000 }).bij, 'jou');
});

test('de standaardinvoer, jaar 1, onafhankelijk nagerekend', () => {
    // 300.000 tegen 3,80% annuïtair over 30 jaar; WOZ 400.000; inkomen 60.000.
    const r = 0.038 / 12;
    const termijn = (300000 * r) / (1 - (1 + r) ** -360);
    let schuld = 300000, rente = 0;
    for (let m = 0; m < 12; m++) { const deel = schuld * r; rente += deel; schuld -= termijn - deel; }
    const voordeel = (rente - 1400) * (0.3756 + 0.06398);

    const t = berekenAftrek();
    bijna(t.eerste.rente, rente, 1e-6);
    bijna(t.eerste.bruto, termijn * 12, 1e-6);
    assert.equal(t.forfait, 1400);
    bijna(t.eerste.voordeel, voordeel, 1e-6);
    bijna(t.eerste.netto, termijn * 12 - voordeel, 1e-6);
    bijna(t.effectiefTarief, voordeel / rente, 1e-9);
    assert.equal(t.jaren.length, 30);
    bijna(t.laatste.restschuld, 0, 1e-4);
});

test('het voordeel wordt elk jaar kleiner en slaat aan het eind om', () => {
    const t = berekenAftrek();
    for (let i = 1; i < t.jaren.length; i++) {
        assert.ok(t.jaren[i].voordeel < t.jaren[i - 1].voordeel, `jaar ${i + 1}`);
        bijna(t.jaren[i].netto, t.jaren[i].bruto - t.jaren[i].voordeel, 1e-9);
    }
    // In het laatste jaar is de rente lager dan het forfait van 1.400.
    assert.ok(t.laatste.rente < 1400 && t.laatste.voordeel < 0);
    bijna(t.totaalVoordeel, t.jaren.reduce((s, r) => s + r.voordeel, 0), 1e-9);
});

test('lineair en een kortere looptijd', () => {
    const t = berekenAftrek({ vorm: 'lineair', looptijdJaren: 20, hypotheek: 240000 });
    assert.equal(t.jaren.length, 20);
    // Aflossing 1.000 per maand; rente jaar 1 = som over 12 maanden van (240.000 - 1.000k) x r.
    const r = 0.038 / 12;
    bijna(t.eerste.aflossing, 12000, 1e-6);
    bijna(t.eerste.rente, (240000 * 12 - 1000 * 66) * r, 1e-6);
});

test('eenmalige financieringskosten: wat ze in het eerste jaar extra opleveren', () => {
    const t = berekenAftrek({ eenmaligeKosten: 4000 });
    bijna(t.eenmaligVoordeel, 4000 * (0.3756 + 0.06398), 1e-6);
    assert.equal(berekenAftrek().eenmaligVoordeel, 0);
    // Bij een hoog inkomen 37,56%, zonder extra korting.
    bijna(berekenAftrek({ inkomen: 150000, eenmaligeKosten: 4000 }).eenmaligVoordeel, 4000 * 0.3756, 1e-6);
});

test('villataks en nul procent rente', () => {
    const villa = berekenAftrek({ woz: 1400000 });
    assert.equal(villa.forfait, 5900);
    const nul = berekenAftrek({ rentePercent: 0 });
    assert.equal(nul.eerste.rente, 0);
    assert.equal(nul.effectiefTarief, 0);
    bijna(nul.eerste.voordeel, -1400 * (1 - 0.71867) * (0.3756 + 0.06398), 1e-6);
});
