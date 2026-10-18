/**
 * De posities in de ruimtebalk, in procenten van de breedte. Pure functie,
 * zodat het beeld getest kan worden zonder browser.
 *
 * Het blok van de huidige hypotheek krijgt een vaste breedte (KNIK procent),
 * ongeacht het bedrag: bij € 280.000 hypotheek en € 31.571 ruimte zou de ruimte
 * anders een smal streepje zijn, terwijl daar de vraag over gaat. Voorbij de
 * huidige hypotheek is de schaal lineair, tot het hoogste van: beide grenzen en
 * de huidige hypotheek plus de verbouwing. De knik in het blok laat zien dat
 * het ingekort is.
 */

export const KNIK = 30;

/**
 * @param {object} u           uitkomst van berekenLeenruimte
 * @param {number} verbouwing  kosten van de verbouwing
 */
export function ruimtebalk(u, verbouwing) {
    const H = u.hypotheek;
    const kosten = Math.max(0, verbouwing);
    const over = Math.max(0, u.extra - u.voorVerbouwing);
    let top = Math.max(u.maxInkomen, u.maxWaarde, H + kosten, H);
    if (top <= H) top = H + 1;
    const geknikt = H > 0;

    const pos = (x) => {
        const p = !geknikt ? (100 * x) / top
            : x <= H ? (KNIK * x) / H
                : KNIK + ((100 - KNIK) * (x - H)) / (top - H);
        return Math.min(100, Math.max(0, p));
    };
    const vak = (van, tot) => ({ left: pos(van), width: Math.max(0, pos(tot) - pos(van)) });

    return {
        geknikt,
        huidig: vak(0, H),
        lenen: vak(H, H + u.voorVerbouwing),
        zelf: vak(H + u.voorVerbouwing, H + kosten),
        over: vak(H + u.voorVerbouwing, H + u.voorVerbouwing + over),
        overBedrag: over,
        // Een streep op 100% valt buiten de rand; net ervoor blijft hij zichtbaar.
        grensInkomen: Math.min(99.6, pos(u.maxInkomen)),
        grensWaarde: Math.min(99.6, pos(u.maxWaarde)),
    };
}
