/**
 * Getallen lezen zoals Nederlanders ze schrijven.
 *
 * Aanleiding: het bedragveld in het termijnschema was een `input type="number"`.
 * Wie daar "87.500" typte -- de normale Nederlandse schrijfwijze, en precies wat
 * er in een aannemingsovereenkomst staat -- kreeg een rij van 87 euro 50. Wie
 * "87 500", "87500,50" of "EUR 87500" typte hield een leeg veld over. In alle
 * vier de gevallen zakte het totaal naar 75% en veranderde de piekmaandlast,
 * zonder dat er iets misging op het scherm: een fout antwoord met dezelfde
 * stelligheid als een goed antwoord.
 *
 * Alleen de kale variant "87500" werkte. Dat is de schrijfwijze van een
 * computer, niet van een bezoeker.
 */

/**
 * Leest een bedrag of percentage uit vrije invoer.
 *
 * De punt geldt als duizendscheiding en de komma als decimaalteken, want zo
 * schrijft Nederland. Gevolg: "87.5" wordt 875 en niet 87,5. Dat is een bewuste
 * keuze -- in dit veld staan bouwtermijnen van tienduizenden euro's, dus een
 * punt is daar duizendtallen en nooit een decimaal. Wie halve euro's wil,
 * gebruikt de komma.
 *
 * @param {string|number} invoer
 * @returns {number|null} het getal, of null als er geen getal in staat
 */
export function leesGetal(invoer) {
    if (typeof invoer === 'number') return Number.isFinite(invoer) ? invoer : null;
    if (invoer === null || invoer === undefined) return null;

    const opgeschoond = String(invoer)
        .replace(/[^0-9,.-]/g, '')   // euroteken, spaties, letters: allemaal weg
        .replace(/\./g, '')          // punt is duizendscheiding
        .replace(',', '.');          // komma is het decimaalteken

    if (!/^-?\d*\.?\d*$/.test(opgeschoond) || opgeschoond === '' || opgeschoond === '-') return null;

    const getal = Number(opgeschoond);
    return Number.isFinite(getal) ? getal : null;
}

/** Toont een bedrag zoals de rest van de site dat doet: "87.500". */
export function toonGetal(waarde, decimalen = 0) {
    if (typeof waarde !== 'number' || !Number.isFinite(waarde)) return '';
    return waarde.toLocaleString('nl-NL', {
        minimumFractionDigits: decimalen,
        maximumFractionDigits: decimalen,
    });
}
