/**
 * De rekenkern: de annuïteitenformule en de depotvergoeding.
 *
 * Aanleiding: bij de keuring van 7 oktober bleek dat `annuiteitTermijn` door
 * drie rekentools wordt gebruikt en door geen enkele test werd geraakt. Dat is
 * de formule waar de maandlast van de bezoeker uit komt. Een fout daarin ziet
 * er precies zo uit als een goede uitkomst -- je ziet een plausibel bedrag en
 * er is niets wat je waarschuwt.
 *
 * Bij diezelfde keuring bleek ook dat drie tools de depotvergoeding verschillend
 * berekenden. De test onderaan legt vast dat ze hetzelfde antwoord geven.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { annuiteitTermijn } from '../src/js/annuiteit.js';
import { vergoedingOverMaand, GELIJKMATIG_GEMIDDELDE } from '../src/js/depotvergoeding.js';

/** Twee bedragen zijn gelijk tot op de cent. */
const gelijk = (werkelijk, verwacht, bericht) =>
    assert.ok(Math.abs(werkelijk - verwacht) < 0.005,
        `${bericht}: ${werkelijk.toFixed(4)} verwacht ${verwacht}`);

test('de annuïteitenformule geeft de bekende maandtermijnen', () => {
    // Met de hand nagerekend via T = H x i / (1 - (1+i)^-n).
    gelijk(annuiteitTermijn(25000, 0.038 / 12, 360), 116.4893, '25.000 bij 3,80% over 30 jaar');
    gelijk(annuiteitTermijn(100000, 0.05 / 12, 240), 659.9557, '100.000 bij 5% over 20 jaar');
});

test('de termijn schaalt recht evenredig met de hoofdsom', () => {
    // Een onafhankelijke controle op de formule die geen handberekening nodig
    // heeft: twintig keer zoveel lenen is twintig keer zoveel betalen, want het
    // bedrag staat buiten de breuk.
    const klein = annuiteitTermijn(25000, 0.038 / 12, 360);
    const groot = annuiteitTermijn(500000, 0.038 / 12, 360);
    gelijk(groot, klein * 20, '500.000 tegenover twintig keer 25.000');
});

test('bij nul procent rente is de termijn het bedrag gedeeld door de maanden', () => {
    // Zonder deze uitzondering deelt de formule door nul.
    gelijk(annuiteitTermijn(36000, 0, 360), 100, 'renteloos');
    assert.equal(annuiteitTermijn(36000, 0, 0), 0, 'nul maanden geeft nul');
});

test('één maand looptijd is het bedrag plus één maand rente', () => {
    gelijk(annuiteitTermijn(1000, 0.01, 1), 1010, 'één termijn');
});

test('de hele lening is na de laatste termijn precies afgelost', () => {
    // De sluitende controle op de formule: los de lening maand voor maand af met
    // de berekende termijn en kijk of er op het eind niets overblijft.
    const bedrag = 250000;
    const maandrente = 0.041 / 12;
    const maanden = 360;
    const termijn = annuiteitTermijn(bedrag, maandrente, maanden);

    let saldo = bedrag;
    for (let m = 0; m < maanden; m += 1) {
        saldo = saldo + saldo * maandrente - termijn;
    }
    gelijk(saldo, 0, 'restschuld na de laatste termijn');
});

test('de depotvergoeding loopt over het gemiddelde saldo binnen de maand', () => {
    // 60.000 dat in een maand naar 55.000 zakt, bij 3% per jaar: over 57.500.
    gelijk(vergoedingOverMaand(60000, 55000, 0.03 / 12), 143.75, 'halve maand opname');
    assert.equal(vergoedingOverMaand(0, 0, 0.0025), 0, 'leeg depot vergoedt niets');
    assert.equal(vergoedingOverMaand(-100, -50, 0.0025), 0, 'een negatief saldo telt als nul');
});

/**
 * De invariant die bij de keuring van 7 oktober werd geschonden.
 *
 * De nieuwbouwtool rekende over het saldo ná de termijnbetaling en kwam daardoor
 * 8,3% lager uit dan de renteverliestool en de maandlastentool -- precies een
 * halve maand vergoeding. Deze test legt vast dat de maandsgewijze som en de
 * gesloten vorm hetzelfde antwoord geven, zodat dat verschil niet opnieuw kan
 * ontstaan zonder dat er iets faalt.
 */
test('maand voor maand optellen geeft hetzelfde als de factor voor gelijkmatige opname', () => {
    const depot = 60000;
    const maanden = 12;
    const maandrente = 0.03 / 12;

    let saldo = depot;
    let somPerMaand = 0;
    for (let m = 0; m < maanden; m += 1) {
        const eind = Math.max(0, saldo - depot / maanden);
        somPerMaand += vergoedingOverMaand(saldo, eind, maandrente);
        saldo = eind;
    }

    const viaDeFactor = depot * GELIJKMATIG_GEMIDDELDE * maandrente * maanden;

    gelijk(somPerMaand, viaDeFactor, 'som per maand tegenover de factor');
    gelijk(somPerMaand, 900, 'en beide tegen de narekening met de hand');
});
