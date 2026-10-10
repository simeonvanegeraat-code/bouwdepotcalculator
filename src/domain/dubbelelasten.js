/**
 * De rekenkern van dubbele-lasten-nieuwbouw.html: wat betaal je in de maanden
 * waarin je oude en je nieuwe woonlast tegelijk lopen.
 *
 * Pure functies, zonder DOM. Bewust eenvoudig: de bezoeker vult vaste
 * maandbedragen in die hij al kent. Wie de nieuwe last per bouwmaand wil laten
 * uitrekenen, met bouwtermijnen en depot, gebruikt de nieuwbouwpagina
 * (src/domain/nieuwbouw.js).
 *
 * HET MODEL
 *
 *   Huidig      de huur of hypotheek van de woning waar je nu woont.
 *   Nieuw       de maandlast van de nieuwe hypotheek, zoals de bezoeker hem
 *               invult. Het model rekent er niet aan en zegt dus ook niet of
 *               hij bruto of netto is.
 *   Vergoeding  wat je per maand gemiddeld aan depotvergoeding ontvangt. Die
 *               gaat van de nieuwe last AF. Na de overlap is het depot leeg en
 *               vervalt hij.
 *   Extra       vaste lasten die alleen door de overlap bestaan: dubbele
 *               energie, verzekering, opslag.
 *   Overlap     het aantal maanden dat alles tegelijk loopt, plus eventueel
 *               een aantal maanden uitloop.
 *
 *   Per maand in de overlap:  huidig + extra + max(0, nieuw - vergoeding)
 *   Daarna:                   nieuw
 *
 *   "Bovenop je huidige woonlast" is wat de overlap je kost ten opzichte van
 *   blijven zitten: de nieuwe last na vergoeding, plus de extra lasten.
 *
 * WAAROM DIT ANDERS IS DAN DE VORIGE VERSIE
 *
 *   src/js/dubbelelasten.js telde een "renteverlies bouwdepot" OP bij de volle
 *   nieuwe hypotheeklast. Maar renteverlies is rente min vergoeding, en die
 *   rente zit al in de hypotheeklast: zo telde hij dubbel. Het depot verlaagt
 *   de last juist. Hier vult de bezoeker de vergoeding in en gaat die eraf.
 *   Het aparte netto-veld, dat de bruto last stilzwijgend verving, is weg.
 */

export const STANDAARD_OVERLAP = Object.freeze({
    huidig: 1100,
    nieuw: 1550,
    vergoeding: 0,
    extra: 100,
    maanden: 6,
    langer: 0,
});

/** Zoveel maanden na de overlap rekent de tijdlijn nog door. */
export const MAANDEN_NA_OVERLAP = 3;

/**
 * @param {object} invoer  zie STANDAARD_OVERLAP. Verwacht gecontroleerde
 *                         invoer: bedragen niet negatief, maanden >= 1.
 */
export function berekenOverlap(invoer = {}) {
    const a = { ...STANDAARD_OVERLAP, ...invoer };
    const duur = a.maanden + Math.max(0, a.langer);
    // Een vergoeding hoger dan de last maakt de last nul, niet negatief.
    const nieuwNaVergoeding = Math.max(0, a.nieuw - a.vergoeding);
    const perMaand = a.huidig + a.extra + nieuwNaVergoeding;
    const bovenop = nieuwNaVergoeding + a.extra;

    const regels = Array.from({ length: duur + MAANDEN_NA_OVERLAP }, (_, i) => {
        const maand = i + 1;
        const inOverlap = maand <= duur;
        return {
            maand,
            fase: inOverlap ? (maand > a.maanden ? 'uitloop' : 'overlap') : 'na',
            huidig: inOverlap ? a.huidig : 0,
            extra: inOverlap ? a.extra : 0,
            nieuw: inOverlap ? nieuwNaVergoeding : a.nieuw,
            totaal: inOverlap ? perMaand : a.nieuw,
        };
    });

    return {
        invoer: a,
        duur,
        nieuwNaVergoeding,
        perMaand,
        bovenop,
        daarna: a.nieuw,
        totaal: perMaand * duur,
        totaalBovenop: bovenop * duur,
        // Wat de uitloop alleen kost: de maanden dat de oude woning langer doorloopt.
        uitloopKost: (a.huidig + a.extra) * Math.max(0, a.langer),
        regels,
    };
}
