/**
 * De depotvergoeding over één maand, op één plek.
 *
 * Aanleiding: drie rekentools berekenden hetzelfde en kwamen op twee antwoorden
 * uit. De renteverliestool en de maandlastentool rekenden over het gemiddelde
 * saldo binnen de maand; de nieuwbouwtool over het saldo dat ná de
 * termijnbetaling overbleef. Dat laatste doet alsof elke termijn op dag één van
 * de maand wordt betaald, en liet daardoor een halve maand vergoeding wegvallen
 * -- 8,3% te weinig over een bouw van twaalf maanden.
 *
 * Welke van de twee juist is, is geen smaakkwestie. Een geldverstrekker vergoedt
 * over het werkelijke saldo per dag. Van de twee benaderingen zit het gemiddelde
 * van begin- en eindsaldo daar het dichtst bij; het eindsaldo onderschat
 * systematisch.
 *
 * Hoe het saldopad tot stand komt, verschilt wél per tool en hoort daar ook te
 * blijven: een termijnschema bij nieuwbouw, een opnamepatroon bij renteverlies,
 * een gemiddelde bij de maandlasten. Alleen de omrekening van saldo naar
 * vergoeding is gedeeld.
 */

/**
 * Vergoeding over één maand, over het gemiddelde saldo binnen die maand.
 *
 * @param {number} beginSaldo   het niet-opgenomen depot aan het begin van de maand
 * @param {number} eindSaldo    idem aan het eind, dus na de opnames van die maand
 * @param {number} maandrente   de vergoeding per maand als breuk, dus 0,0025 voor 3% per jaar
 * @returns {number} de vergoeding in euro
 */
export function vergoedingOverMaand(beginSaldo, eindSaldo, maandrente) {
    const begin = Math.max(0, Number(beginSaldo) || 0);
    const eind = Math.max(0, Number(eindSaldo) || 0);
    const rente = Number(maandrente) || 0;
    return ((begin + eind) / 2) * rente;
}

/**
 * Het gemiddelde niet-opgenomen deel van een depot bij gelijkmatige opname.
 *
 * Bij een depot dat in gelijke stappen van vol naar leeg loopt is dat precies de
 * helft. Dat is geen aanname maar de gesloten vorm van de som hierboven, en de
 * maandlastentool gebruikt hem om niet twaalf keer hetzelfde te hoeven optellen.
 * Hij staat hier zodat het verband met vergoedingOverMaand zichtbaar blijft en
 * een test beide tegen elkaar kan leggen.
 */
export const GELIJKMATIG_GEMIDDELDE = 0.5;
