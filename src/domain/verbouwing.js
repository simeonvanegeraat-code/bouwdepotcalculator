/**
 * De rekenkern van de financieringscheck op de verbouwpagina.
 *
 * Pure functies, zonder DOM. De begroting zelf (welke post uit het depot mag,
 * de reserve voor onvoorzien) staat in src/js/begrotingrekenen.js; dit bestand
 * beantwoordt de vraag erna: past het binnen de waarde van de woning, en wat
 * kost het per maand?
 *
 * DE WAARDETOETS
 *
 *   waarderuimte      = waarde na verbouwing - huidige hypotheek   (minimaal 0)
 *   financierbaar     = het kleinste van: gewenst bedrag, waarderuimte
 *   financieringsgat  = gewenst bedrag - financierbaar
 *   eigen geld nodig  = financieringsgat + kosten buiten het depot
 *   buffer daarna     = beschikbaar eigen geld - eigen geld nodig
 *
 * De hoofdregel waar dit op rust: de totale hypotheek komt niet boven 100% van
 * de woningwaarde na verbouwing. Voor energiebesparende maatregelen geldt bij
 * sommige aanbieders extra ruimte; die zit hier niet in.
 *
 * Dit is een waardetoets, GEEN inkomenstoets. Wat een geldverstrekker werkelijk
 * verstrekt hangt daarnaast af van inkomen, verplichtingen, de taxatie en het
 * acceptatiebeleid. Een positieve uitkomst is dus geen toezegging.
 *
 * DE MAANDLAST
 *
 *   De extra bruto maandlast van het financierbare deel, als annuiteit over de
 *   opgegeven looptijd tegen de opgegeven rente. Bruto: zonder
 *   hypotheekrenteaftrek, en zonder de depotvergoeding die er tijdens de
 *   verbouwing tegenover kan staan.
 */

import { annuiteitTermijn } from '../js/annuiteit.js';

/**
 * @param {object} i
 * @param {number} i.bedrag        wat de bezoeker voor de verbouwing wil lenen
 * @param {number} i.hypotheek     openstaande hypotheek voor de extra lening
 * @param {number} i.waarde        woningwaarde na verbouwing
 * @param {number} i.eigenGeld     eigen geld dat voor dit plan beschikbaar is
 * @param {number} i.buitenDepot   kosten die niet uit het depot mogen
 */
export function berekenLeenruimte({ bedrag, hypotheek, waarde, eigenGeld, buitenDepot }) {
    const ruimte = Math.max(0, waarde - hypotheek);
    const financierbaar = Math.min(bedrag, ruimte);
    const gat = bedrag - financierbaar;
    const nodig = gat + buitenDepot;
    const totaleLening = hypotheek + financierbaar;
    return {
        ruimte,
        financierbaar,
        gat,
        nodig,
        buffer: eigenGeld - nodig,
        totaleLening,
        // Lening als deel van de woningwaarde; null als er geen waarde is.
        verhouding: waarde > 0 ? totaleLening / waarde : null,
    };
}

/** De extra bruto maandlast van een bedrag, als annuiteit. */
export function maandlastExtraLening(bedrag, rentePercent, looptijdJaren = 30) {
    if (!(bedrag > 0)) return 0;
    return annuiteitTermijn(bedrag, rentePercent / 100 / 12, looptijdJaren * 12);
}
