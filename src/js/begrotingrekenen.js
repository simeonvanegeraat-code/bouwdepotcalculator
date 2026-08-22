/**
 * De rekenkern van de verbouwbegroting.
 *
 * Stond eerst verweven met de invoervelden, waardoor er geen test op kon. Juist
 * hier is dat bezwaarlijk: de splitsing tussen wat uit het depot mag en wat de
 * bezoeker zelf moet meebrengen is het hele product van deze pagina. Een fout
 * daarin ziet er precies zo uit als een goede uitkomst.
 *
 * Twee splitsingen die niet dezelfde zijn:
 *
 *   depot / eigen geld      volgt uit de post: zit het vast aan de woning?
 *   noodzakelijk / gewenst  volgt uit de keuze van de bezoeker
 *
 * De reserve voor onvoorzien valt in geen van beide. Hij hoort bij het werk aan
 * de woning en telt dus mee in het depotdeel, maar hij is niet noodzakelijk of
 * gewenst -- je weet nog niet waaraan je hem kwijtraakt.
 */

/**
 * @param {Array}  posten   [{ bedrag, vast, prioriteit }]
 * @param {number} margePct percentage onvoorzien, over het depotdeel
 * @returns {object} de bedragen die op het scherm en in de specificatie komen
 */
export function berekenBegroting(posten, margePct = 0) {
    let depot = 0, eigen = 0, noodzakelijk = 0, gewenst = 0, aantal = 0;

    for (const post of posten || []) {
        const bedrag = Number(post?.bedrag) || 0;
        if (bedrag <= 0) continue;

        aantal++;
        // Wat niet vast aan de woning zit, komt doorgaans niet uit het depot.
        if (post.vast) depot += bedrag; else eigen += bedrag;
        if (post.prioriteit === 'gewenst') gewenst += bedrag; else noodzakelijk += bedrag;
    }

    const pct = Number(margePct) || 0;
    const margeBedrag = Math.round(depot * (pct / 100));

    return {
        aantal,
        depot,
        eigen,
        noodzakelijk,
        gewenst,
        margeBedrag,
        // Wat er uit het depot mag, inclusief de reserve.
        depotMetMarge: depot + margeBedrag,
        totaal: depot + eigen + margeBedrag,
    };
}
