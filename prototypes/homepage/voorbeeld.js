/**
 * Het voorbeeldscenario achter de drie homepageconcepten.
 *
 * Eén scenario, één keer uitgerekend, zodat de concepten onderling dezelfde
 * bedragen laten zien en geen van de drie een getal verzint. De invoer is de
 * standaardinvoer van nieuwbouw.html; wie doorklikt ziet daar dus dezelfde
 * uitkomst terug.
 *
 * Model (gelijk aan src/js/nieuwbouwcalc.js, hier zonder DOM):
 *   - de lening is grond + aanneemsom; het depot is de aanneemsom;
 *   - bruto maandlast = annuiteit over de hele lening (30 jaar);
 *   - daarvan af gaat de depotvergoeding over het gemiddelde depotsaldo binnen
 *     de maand (vergoedingOverMaand), tegen hypotheekrente min de korting;
 *   - tijdens de bouw komt de huidige woonlast erbij.
 *
 * Twee dingen voegt dit voorbeeld toe om een tijdlijn te kunnen tonen, en beide
 * zijn aannames, geen rekenregels: drie maanden vooraf met alleen de huidige
 * woonlast, en drie maanden erna waarin die woonlast is weggevallen. Wanneer de
 * oude woonlast werkelijk stopt verschilt per huishouden.
 *
 * Dit is prototypecode. In mijlpaal 3 hoort de rekenkern als pure functie uit
 * nieuwbouwcalc.js getrokken te worden, in plaats van hier gespiegeld te staan.
 * Alle bedragen zijn bruto: er zit geen hypotheekrenteaftrek in.
 */

import { annuiteitTermijn } from '../../src/js/annuiteit.js';
import { vergoedingOverMaand } from '../../src/js/depotvergoeding.js';

export const AANNAMES = Object.freeze({
    grond: 150000,
    aanneemsom: 350000,
    rentePercent: 3.8,
    kortingDepotPercent: 0,
    looptijdJaren: 30,
    bouwduurMaanden: 12,
    huidigeWoonlast: 1200,
    maandenVooraf: 3,
    maandenNa: 3,
    termijnen: Object.freeze([
        { maand: 1, percent: 15, naam: 'Ruwbouw begane grond' },
        { maand: 3, percent: 20, naam: 'Ruwbouw verdiepingen' },
        { maand: 6, percent: 20, naam: 'Dak en gevelsluiting' },
        { maand: 9, percent: 25, naam: 'Afbouw en installaties' },
        { maand: 12, percent: 20, naam: 'Oplevering' },
    ]),
});

export function voorbeeldTijdlijn(a = AANNAMES) {
    const maandrente = a.rentePercent / 100 / 12;
    const depotrente = Math.max(0, (a.rentePercent - a.kortingDepotPercent) / 100 / 12);
    const lening = a.grond + a.aanneemsom;
    const annuiteit = annuiteitTermijn(lening, maandrente, a.looptijdJaren * 12);

    const regels = [];

    for (let i = a.maandenVooraf; i >= 1; i--) {
        regels.push({ fase: 'voor', bouwmaand: null, label: `${i} mnd vooraf`, depot: null, vergoeding: 0, hypotheek: 0, woonlast: a.huidigeWoonlast, totaal: a.huidigeWoonlast });
    }

    let depot = a.aanneemsom;
    for (let m = 1; m <= a.bouwduurMaanden; m++) {
        const begin = depot;
        const termijnen = a.termijnen.filter((t) => t.maand === m);
        for (const t of termijnen) depot -= (t.percent / 100) * a.aanneemsom;
        depot = Math.max(0, depot);
        const vergoeding = vergoedingOverMaand(begin, depot, depotrente);
        const hypotheek = Math.max(0, annuiteit - vergoeding);
        regels.push({
            fase: 'bouw', bouwmaand: m, label: `Bouwmaand ${m}`, depot, vergoeding, hypotheek,
            woonlast: a.huidigeWoonlast, totaal: hypotheek + a.huidigeWoonlast,
            termijn: termijnen.map((t) => t.naam).join(', ') || null,
        });
    }

    for (let i = 1; i <= a.maandenNa; i++) {
        regels.push({ fase: 'na', bouwmaand: null, label: `${i} mnd na oplevering`, depot: 0, vergoeding: 0, hypotheek: annuiteit, woonlast: 0, totaal: annuiteit });
    }

    const piek = regels.reduce((hoogste, r) => (r.totaal > hoogste.totaal ? r : hoogste), regels[0]);
    return { lening, annuiteit, regels, piek, aannames: a };
}

export const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
