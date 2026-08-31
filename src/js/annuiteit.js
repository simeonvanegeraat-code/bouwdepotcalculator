/**
 * De annuïteitenformule, op één plek.
 *
 * Hij stond drie keer letterlijk uitgeschreven in main.js en zou bij het
 * bouwen van de nieuwe homepage voor de vierde keer zijn overgetikt. Dat is
 * precies het soort verdubbeling dat een tijdje goed gaat en dan stil uit
 * elkaar loopt: iemand corrigeert een afronding op één plek en de andere drie
 * blijven achter, waarna dezelfde site twee bedragen noemt voor dezelfde vraag.
 *
 * De formule zelf is de standaard: de maandtermijn waarbij de lening na het
 * afgesproken aantal maanden precies op nul staat.
 *
 *     T = H x (i / (1 - (1 + i)^-n))
 *
 * met H het geleende bedrag, i de maandrente en n het aantal maanden.
 */

/**
 * Berekent de maandtermijn bij een annuïteitenhypotheek.
 *
 * Bij nul procent rente valt de formule uit elkaar -- delen door nul -- terwijl
 * het antwoord dan juist triviaal is: het bedrag gedeeld over de maanden. Die
 * uitzondering hoort hier en niet bij elke aanroeper.
 *
 * @param {number} bedrag        het geleende bedrag in euro
 * @param {number} maandrente    de rente per maand als breuk, dus 0,0031667 voor 3,80% per jaar
 * @param {number} maanden       het aantal maandtermijnen
 * @returns {number} de maandtermijn in euro
 */
export function annuiteitTermijn(bedrag, maandrente, maanden) {
    if (!maanden) return 0;
    if (!maandrente) return bedrag / maanden;
    return bedrag * (maandrente / (1 - Math.pow(1 + maandrente, -maanden)));
}
