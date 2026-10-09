/**
 * De maandtijdlijn als staafgrafiek in SVG, voor de nieuwbouwpagina en voor
 * bouwdepot-berekenen.html.
 *
 * Deze functie rekent niets uit. Ze tekent de maandregels die ze krijgt: de
 * hoogte van een staaf is `woonlast + hypotheek` uit dezelfde regel waar de
 * tabel zijn cijfers uit haalt. Wijken grafiek en tabel van elkaar af, dan zit
 * de fout hier in het tekenen en niet in een tweede berekening.
 *
 * Getekend op de werkelijke breedte van de houder, zodat tekst op een telefoon
 * even groot blijft als op een breed scherm. De pagina tekent opnieuw als de
 * breedte verandert.
 *
 * De as begint bij nul: bij staven is een afgeknotte as misleidend.
 */

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const r1 = (n) => n.toFixed(1);

/**
 * Rondt het maximum naar boven af op een rond bedrag voor de as. De kleine
 * stappen zijn er voor een los bouwdepot: bij een maandlast van 116 euro is
 * een as tot 500 een grafiek van bijna niets.
 */
function asMaximum(hoogste) {
    const stap = hoogste > 8000 ? 2000 : hoogste > 4000 ? 1000 : hoogste > 1000 ? 500 : hoogste > 400 ? 200 : hoogste > 100 ? 50 : 20;
    return Math.max(stap, Math.ceil(hoogste / stap) * stap);
}

/**
 * @param {HTMLElement} houder
 * @param {object} gegevens
 * @param {object[]} gegevens.regels        maandregels uit berekenTijdlijn
 * @param {object} gegevens.piek            de regel met het hoogste totaal
 * @param {number} gegevens.oplevermaand
 * @param {number} gegevens.eindeOverlap
 * @param {object[]|null} [gegevens.basis]  regels van de basis, als er een scenario getoond wordt
 * @param {string} gegevens.omschrijving    tekst voor wie de grafiek niet ziet
 * @param {string} [gegevens.merkTekst]     wat er bij de streep na de bouw staat
 */
export function tekenTijdlijn(houder, { regels, piek, oplevermaand, eindeOverlap, basis = null, omschrijving, merkTekst = 'oplevering' }) {
    const breedte = Math.max(280, Math.round(houder.clientWidth || 640));
    const smal = breedte < 480;
    const hoogte = smal ? 250 : 300;
    const m = { links: smal ? 44 : 56, rechts: 8, boven: 34, onder: 30 };
    const vlakB = breedte - m.links - m.rechts;
    const vlakH = hoogte - m.boven - m.onder;

    const max = asMaximum(Math.max(...regels.map((r) => r.totaal), ...(basis ?? []).map((r) => r.totaal)));
    const y = (bedrag) => m.boven + vlakH - (bedrag / max) * vlakH;
    const stap = vlakB / regels.length;
    const staafB = Math.max(3, stap * (regels.length > 30 ? 0.8 : 0.7));
    const x = (index) => m.links + index * stap + (stap - staafB) / 2;

    let svg = '';

    // Raster en bedragen langs de as.
    for (const deel of [0, 0.5, 1]) {
        const bedrag = max * deel;
        svg += `<line class="wr-g-raster" x1="${m.links}" x2="${breedte - m.rechts}" y1="${r1(y(bedrag))}" y2="${r1(y(bedrag))}"/>`;
        svg += `<text class="wr-g-as" x="${m.links - 8}" y="${r1(y(bedrag) + 4)}" text-anchor="end">${euro.format(bedrag)}</text>`;
    }

    // Staven: onder de huidige woonlast, daarboven de hypotheek na vergoeding.
    regels.forEach((r, i) => {
        const titel = `Maand ${r.maand}: ${euro.format(r.totaal)}`;
        svg += `<g><title>${titel}</title>`;
        if (r.woonlast > 0) svg += `<rect class="wr-g-oud" x="${r1(x(i))}" y="${r1(y(r.woonlast))}" width="${r1(staafB)}" height="${r1(y(0) - y(r.woonlast))}"/>`;
        if (r.hypotheek > 0) svg += `<rect class="wr-g-nieuw" x="${r1(x(i))}" y="${r1(y(r.totaal))}" width="${r1(staafB)}" height="${r1(y(r.woonlast) - y(r.totaal))}"/>`;
        svg += '</g>';
    });

    // De basis als getrapte lijn, als er een scenario overheen ligt.
    if (basis) {
        let pad = '';
        basis.forEach((r, i) => {
            const links = m.links + i * stap, rechts = links + stap;
            pad += `${i === 0 ? 'M' : 'L'}${r1(links)},${r1(y(r.totaal))} L${r1(rechts)},${r1(y(r.totaal))} `;
        });
        svg += `<path class="wr-g-basis" d="${pad.trim()}"/>`;
    }

    // Twee momenten: de oplevering en het einde van de oude woonlast.
    const merk = (naMaand, tekst, licht) => {
        if (naMaand >= regels.length) return '';
        const mx = m.links + naMaand * stap;
        // Links van de streep als de tekst rechts niet meer in beeld past.
        const anker = mx > breedte * 0.7 || mx + 5 + tekst.length * 7 > breedte ? 'end' : 'start';
        return `<line class="wr-g-merk${licht ? ' wr-g-merk--licht' : ''}" x1="${r1(mx)}" x2="${r1(mx)}" y1="${m.boven - 20}" y2="${r1(y(0))}"/>`
            + `<text class="wr-g-merktekst" x="${r1(mx + (anker === 'end' ? -5 : 5))}" y="${m.boven - (licht ? 24 : 12)}" text-anchor="${anker}">${tekst}</text>`;
    };
    svg += merk(oplevermaand, merkTekst, false);
    if (eindeOverlap > oplevermaand) svg += merk(eindeOverlap, smal ? 'woonlast stopt' : 'huidige woonlast stopt', true);

    // De hoogste maand: een rand eromheen en het bedrag erboven. Niet alleen
    // een kleur, want die ziet niet iedereen.
    const pi = regels.indexOf(piek);
    if (pi >= 0) {
        svg += `<rect class="wr-g-piek" x="${r1(x(pi) - 2)}" y="${r1(y(piek.totaal) - 2)}" width="${r1(staafB + 4)}" height="${r1(y(0) - y(piek.totaal) + 2)}"/>`;
    }

    // Maandnummers onder de as.
    const elke = Math.ceil(regels.length / (smal ? 8 : 16));
    regels.forEach((r, i) => {
        if (i !== 0 && r.maand % elke !== 0) return;
        svg += `<text class="wr-g-as" x="${r1(x(i) + staafB / 2)}" y="${hoogte - 10}" text-anchor="middle">${r.maand}</text>`;
    });
    svg += `<text class="wr-g-as" x="${m.links - 8}" y="${hoogte - 10}" text-anchor="end">mnd</text>`;

    houder.innerHTML = `<svg viewBox="0 0 ${breedte} ${hoogte}" width="${breedte}" height="${hoogte}" role="img" aria-label="${omschrijving.replace(/"/g, '&quot;')}">${svg}</svg>`;
}
