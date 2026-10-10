/**
 * De rekenkern van bouwrente-nieuwbouw.html: de rente die een ontwikkelaar
 * rekent over de grond en over bouwtermijnen die al vervallen zijn, tot aan de
 * notaris.
 *
 * Pure functies, zonder DOM.
 *
 * HET MODEL
 *
 *   Grond       de grondkosten. De rente daarover loopt een aantal maanden,
 *               van de datum in de overeenkomst tot de levering bij de notaris.
 *   Termijnen   bouwtermijnen die bij de notaris al vervallen zijn. Die lopen
 *               korter mee dan de grond: elk vanaf zijn eigen vervaldatum. De
 *               bezoeker geeft het totaalbedrag en hoeveel maanden ze
 *               gemiddeld openstaan.
 *   Rente       enkelvoudig: bedrag x percentage x maanden / 12. Geen rente op
 *               rente; zo staat het ook in een koop-/aannemingsovereenkomst.
 *   Btw         staat in de overeenkomst dat de rente wordt vermeerderd met
 *               omzetbelasting, dan komt er 21% bij.
 *   Tekenen     de rente over de tijd vóór het tekenen van de overeenkomst
 *               hoort fiscaal bij de koopsom; de rente over de tijd daarna is
 *               bouwrente in de zin van het besluit van 27 februari 2013
 *               (Stcrt. 2013, 5951). Daarom splitst het model de uitkomst op
 *               het moment van tekenen. Wat dat voor iemands aangifte
 *               betekent rekent het niet uit.
 *   Meefinancieren  wie de bouwrente in de hypotheek meeneemt, lost dat bedrag
 *               annuïtair af over de looptijd en betaalt er al die tijd
 *               hypotheekrente over.
 *
 * WAAROM HET FINANCIERINGSEFFECT ANDERS IS DAN IN DE VORIGE VERSIE
 *
 *   src/js/bouwrente.js rekende het effect van meefinancieren als bouwrente x
 *   hypotheekrente x dezelfde maanden: de maanden vóór de notaris, waarin de
 *   hypotheek nog niet loopt. Wie € 2.000 meefinanciert betaalt daar dertig
 *   jaar rente over, niet zes maanden. Hier is het de rente over de hele
 *   looptijd, en de maandlast die erbij komt.
 *
 * WAT HIER NIET IN ZIT
 *
 *   De precieze dagtelling en vervaldata per termijn, een boeterente bij te
 *   laat betalen, en het belastingeffect. De afrekening van de notaris is
 *   leidend.
 */

import { annuiteitTermijn } from '../js/annuiteit.js';

export const BTW = 0.21;

export const STANDAARD_BOUWRENTE = Object.freeze({
    grond: 100000,
    maandenGrond: 6,
    termijnen: 0,
    maandenTermijnen: 3,
    rentePercent: 4,
    metBtw: false,
    maandenNaTekenen: 2,
    meefinancieren: false,
    hypotheekrentePercent: 3.8,
    looptijdJaren: 30,
});

/**
 * @param {object} invoer  zie STANDAARD_BOUWRENTE. Verwacht gecontroleerde
 *                         invoer: eindige getallen, maanden niet negatief.
 */
export function berekenBouwrente(invoer = {}) {
    const a = { ...STANDAARD_BOUWRENTE, ...invoer };
    const r = a.rentePercent / 100 / 12;
    const maandenTermijnen = a.termijnen > 0 ? a.maandenTermijnen : 0;
    const duur = Math.max(a.maandenGrond, maandenTermijnen);
    const naTekenen = Math.min(Math.max(0, a.maandenNaTekenen), duur);
    const opslag = a.metBtw ? 1 + BTW : 1;

    const renteGrond = a.grond * r * a.maandenGrond;
    const renteTermijnen = a.termijnen * r * maandenTermijnen;
    const rente = renteGrond + renteTermijnen;
    const btw = rente * (opslag - 1);
    const totaal = rente + btw;

    // Het deel over de maanden na het tekenen: elk bedrag telt mee voor zover
    // het in die laatste maanden rente droeg.
    const renteNa = a.grond * r * Math.min(a.maandenGrond, naTekenen) + a.termijnen * r * Math.min(maandenTermijnen, naTekenen);
    const naTekenenTotaal = renteNa * opslag;

    // Maand voor maand tot de notaris: wat er tot dan toe is opgelopen. Maand 1
    // is de eerste maand waarin er rente loopt; maand `duur` eindigt bij de notaris.
    const regels = Array.from({ length: duur }, (_, i) => {
        const maand = i + 1;
        const grondLoopt = Math.max(0, maand - (duur - a.maandenGrond));
        const termijnenLopen = Math.max(0, maand - (duur - maandenTermijnen));
        const grondDeel = a.grond * r * grondLoopt * opslag;
        const termijnDeel = a.termijnen * r * termijnenLopen * opslag;
        return { maand, grond: grondDeel, termijnen: termijnDeel, totaal: grondDeel + termijnDeel };
    });

    const maandenLening = a.looptijdJaren * 12;
    const extraMaandlast = a.meefinancieren ? annuiteitTermijn(totaal, a.hypotheekrentePercent / 100 / 12, maandenLening) : 0;
    const renteOverLooptijd = a.meefinancieren ? extraMaandlast * maandenLening - totaal : 0;

    return {
        invoer: { ...a, maandenTermijnen, maandenNaTekenen: naTekenen },
        duur,
        tekenmaand: duur - naTekenen,   // na zoveel maanden wordt er getekend
        renteGrond, renteTermijnen, rente, btw, totaal,
        naTekenen: naTekenenTotaal,
        voorTekenen: totaal - naTekenenTotaal,
        regels,
        extraMaandlast,
        renteOverLooptijd,
        totaalMetFinanciering: totaal + renteOverLooptijd,
    };
}
