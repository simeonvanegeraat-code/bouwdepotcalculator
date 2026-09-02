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

/**
 * Leest een percentage uit vrije invoer.
 *
 * Bewust anders dan leesGetal. Daar is de punt duizendscheiding, want daar
 * gaat het over bedragen van tienduizenden euro's. Een rentepercentage ligt
 * tussen de nul en de twintig, dus daar kan een punt nooit iets anders zijn
 * dan een decimaalteken. Wie leesGetal op een renteveld loslaat, leest "3.80"
 * als 380 procent -- dat is bij een eerdere poging ook precies gebeurd, en de
 * piekmaandlast schoot naar 159.533 euro.
 *
 * @param {string|number} invoer
 * @returns {number|null} het percentage, of null als er geen getal in staat
 */
export function leesPercentage(invoer) {
    if (typeof invoer === 'number') return Number.isFinite(invoer) ? invoer : null;
    if (invoer === null || invoer === undefined) return null;

    const opgeschoond = String(invoer)
        .replace(/[^0-9,.-]/g, '')   // procentteken, spaties, letters weg
        .replace(',', '.');          // komma en punt betekenen hier hetzelfde

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

/**
 * Bedragen opmaken zoals de site ze toont: "€ 87.500", zonder centen.
 *
 * Deze opmaker stond in zes modules apart, en in main.js onder de naam
 * `formatEuro`. Eén exemplaar hier betekent dat een besluit over afronding of
 * over het euroteken op één plek valt.
 */
export const euro = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

/**
 * Koppelt een bedragveld aan de Nederlandse schrijfwijze.
 *
 * Zolang je typt staat er wat je intypt: "87500". Zodra je het veld verlaat
 * staat er "87.500". Dat is dezelfde afspraak als in het termijnschema van de
 * nieuwbouwpagina, en de reden om niet tijdens het typen op te maken is daar
 * ook al opgeschreven: een cursor die verspringt terwijl je een bedrag intikt
 * is erger dan een bedrag dat een seconde onopgemaakt blijft.
 *
 * Waarom dit nodig was: de velden toonden "400000" terwijl de uitkomst ernaast
 * "€ 1.204" zei en de snelkeuzeknop eronder "25.000". Zeventien bedragvelden
 * over zeven rekenpagina's, geen enkele opgemaakt.
 *
 * @param {HTMLInputElement} veld
 */
export function koppelBedragveld(veld) {
    if (!veld || veld.dataset.bedragGekoppeld) return;
    veld.dataset.bedragGekoppeld = 'ja';

    const opmaken = () => {
        const n = leesGetal(veld.value);
        if (n !== null) veld.value = toonGetal(n);
    };
    const kaal = () => {
        const n = leesGetal(veld.value);
        if (n !== null) veld.value = String(n);
    };

    veld.addEventListener('focus', kaal);
    veld.addEventListener('blur', opmaken);
    opmaken();
}

/**
 * Zoekt de bedragvelden op de pagina en koppelt ze.
 *
 * Een bedragveld herken je aan het euroteken dat ervoor staat: de opmaak van
 * het rekenblok zet dat als eerste kind in de omhulsel. Zo hoeft er in geen
 * enkele van de elf rekenpagina's een markering bij, en werkt het ook op velden
 * die er later bij komen.
 */
export function koppelBedragvelden(wortel = document) {
    wortel.querySelectorAll('.bs-omhulsel').forEach((omhulsel) => {
        const eerste = omhulsel.firstElementChild;
        if (!eerste || eerste.tagName !== 'SPAN') return;
        if (!/€|euro/i.test(eerste.textContent)) return;
        koppelBedragveld(omhulsel.querySelector('input'));
    });
}
