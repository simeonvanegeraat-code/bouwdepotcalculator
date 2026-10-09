/**
 * Het betaalschema van een hypotheek, maand voor maand.
 *
 * Pure functies: geen DOM, geen opslag, geen afronding. Afronden gebeurt pas bij
 * het tonen; wie hier al afrondt, ziet in een tabel van dertig jaar de centen
 * uit elkaar lopen.
 *
 * Conventies
 *   - Bedragen in euro, rente als breuk per maand (0,038 / 12 voor 3,80% per jaar).
 *   - Maand 1 is de eerste maand na het passeren. De rente van een maand wordt
 *     berekend over de restschuld aan het begin van die maand.
 *   - `betaling` is wat er die maand van de rekening gaat: rente plus aflossing.
 *     Dat is een kasstroom, geen kostenpost: de aflossing is geen verlies.
 *
 * Wat hier niet in zit: tussentijdse renteherziening, boetes, extra aflossingen
 * en bankspecifieke afspraken over een aflossingsvrije bouwperiode. Die staan in
 * iemands offerte, niet in een formule.
 */

import { annuiteitTermijn } from '../js/annuiteit.js';

export const HYPOTHEEKVORMEN = Object.freeze({
    annuiteit: 'Annuïteiten',
    lineair: 'Lineair',
    aflossingsvrij: 'Aflossingsvrij',
});

/**
 * @param {object} lening
 * @param {number} lening.hoofdsom          geleend bedrag in euro
 * @param {number} lening.maandrente        rente per maand als breuk
 * @param {number} lening.looptijdMaanden   looptijd van de hele lening
 * @param {string} [lening.vorm]            'annuiteit', 'lineair' of 'aflossingsvrij'
 * @param {number} aantal                   hoeveel maanden van het schema nodig zijn
 * @returns {{maand:number, rente:number, aflossing:number, betaling:number, restschuld:number}[]}
 */
export function leningschema({ hoofdsom, maandrente, looptijdMaanden, vorm = 'annuiteit' }, aantal) {
    if (!(vorm in HYPOTHEEKVORMEN)) throw new Error(`onbekende hypotheekvorm: ${vorm}`);
    const termijn = vorm === 'annuiteit' ? annuiteitTermijn(hoofdsom, maandrente, looptijdMaanden) : 0;
    const vasteAflossing = vorm === 'lineair' && looptijdMaanden ? hoofdsom / looptijdMaanden : 0;

    const schema = [];
    let rest = hoofdsom;
    for (let maand = 1; maand <= aantal; maand++) {
        const rente = rest * maandrente;
        let aflossing = 0;
        if (maand <= looptijdMaanden) {
            if (vorm === 'annuiteit') aflossing = termijn - rente;
            else if (vorm === 'lineair') aflossing = vasteAflossing;
        }
        aflossing = Math.min(Math.max(0, aflossing), rest);
        rest -= aflossing;
        schema.push({ maand, rente, aflossing, betaling: rente + aflossing, restschuld: rest });
    }
    return schema;
}
