/**
 * Gestapelde staafgrafiek in eigen SVG.
 *
 * Twee rekenpagina's toonden hun bs-verloop met Chart.js, maar die bibliotheek
 * werd nergens geladen: de code viel stil terug op een guard en de bezoeker
 * keek naar een leeg wit vlak, midden in een sectie die "Het bs-verloop" heet.
 *
 * Eigen SVG kost geen kilobyte extra, haalt zijn kleuren uit de tokens en
 * volgt daardoor de donkere modus. Voor twee gestapelde reeksen is dat twintig
 * regels tekenwerk; een bibliotheek van 70 kB verdient zijn laadtijd hier niet.
 *
 * Beide pagina's tonen dezelfde vorm: een totaal dat opgesplitst is in een deel
 * dat u zelf betaalt en een deel dat ergens anders vandaan komt. Bij nieuwbouw is
 * dat de depotvergoeding, bij de belastingpagina het fiscale voordeel. Wat het
 * verhaal draagt is dat het onderste deel groeit terwijl het bovenste slinkt.
 */

const BREEDTE = 720;
const HOOGTE = 220;
const MARGE = { links: 4, rechts: 4, boven: 6, onder: 4 };

/**
 * @param {HTMLElement|string} doel        element of id waar de grafiek in komt
 * @param {object}   opties
 * @param {Array}    opties.regels         [{ onder, boven }] per staaf
 * @param {string}   opties.eersteLabel    label onder de eerste staaf
 * @param {string}   opties.laatsteLabel   label onder de laatste staaf
 * @param {object}   [opties.piek]         { index, tekst } voor de stippellijn
 * @param {string}   opties.omschrijving   zin die de grafiek beschrijft, voor schermlezers
 */
export function tekenStaafgrafiek(doel, { regels, eersteLabel, laatsteLabel, piek, omschrijving }) {
    const vlak = typeof doel === 'string' ? document.getElementById(doel) : doel;
    if (!vlak || !regels || !regels.length) return;

    const vlakB = BREEDTE - MARGE.links - MARGE.rechts;
    const vlakH = HOOGTE - MARGE.boven - MARGE.onder;
    const grond = MARGE.boven + vlakH;

    const hoogste = Math.max(...regels.map((r) => r.onder + r.boven), 1);
    const sleuf = vlakB / regels.length;
    const staafB = Math.max(1, sleuf * 0.72);
    const schaal = (waarde) => (waarde / hoogste) * vlakH;

    const staven = regels.map((regel, i) => {
        const x = MARGE.links + (i * sleuf) + ((sleuf - staafB) / 2);
        const hOnder = schaal(regel.onder);
        const hBoven = schaal(regel.boven);
        const rect = (klasse, y, hoogte) =>
            `<rect class="${klasse}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${staafB.toFixed(1)}" height="${hoogte.toFixed(1)}" rx="1"/>`;

        // Een deel van minder dan een halve eenheid tekent als een streepje dat
        // er als afrondingsruis uitziet; die laten we weg.
        return rect('bs-verloop__staaf--eigen', grond - hOnder, hOnder)
            + (hBoven > 0.5 ? rect('bs-verloop__staaf--vergoeding', grond - hOnder - hBoven, hBoven) : '');
    }).join('');

    const deelVan = (index) => (((index + 0.5) / regels.length) * 100).toFixed(1);

    let piekLijn = '';
    let piekLabel = '';
    if (piek && piek.index >= 0 && piek.index < regels.length) {
        const x = (MARGE.links + ((piek.index + 0.5) * sleuf)).toFixed(1);
        piekLijn = `<line class="bs-verloop__piek" x1="${x}" y1="${MARGE.boven}" x2="${x}" y2="${grond}"/>`;
        // Rechts uitlijnen zodra de piek tegen de rand ligt, anders steekt het
        // label buiten de grafiek uit.
        const deel = Number(deelVan(piek.index));
        piekLabel = `<span class="bs-verloop__pieklabel${deel > 80 ? ' bs-verloop__pieklabel--rechts' : ''}" style="left:${deel}%">${piek.tekst}</span>`;
    }

    // De aslabels staan bewust in HTML en niet in de SVG. In de SVG schalen ze
    // mee met het tekengebied: op 375px breed kwam een letter van 12 eenheden
    // neer op nog geen 5 echte pixels.
    const labels = `<span class="bs-verloop__aslabel" style="left:${deelVan(0)}%">${eersteLabel}</span>`
        + (regels.length > 1
            ? `<span class="bs-verloop__aslabel" style="left:${deelVan(regels.length - 1)}%">${laatsteLabel}</span>`
            : '');

    // preserveAspectRatio="none" laat de staven de beschikbare hoogte vullen.
    // Het zijn rechthoeken, dus ongelijk schalen vervormt niets; zonder dit was
    // de grafiek op mobiel een strook van 90px hoog.
    vlak.innerHTML = piekLabel
        + `<svg viewBox="0 0 ${BREEDTE} ${HOOGTE}" preserveAspectRatio="none" role="img" aria-label="${omschrijving}" focusable="false">`
        + piekLijn
        + staven
        + `<line class="bs-verloop__as" x1="${MARGE.links}" y1="${grond}" x2="${BREEDTE - MARGE.rechts}" y2="${grond}"/>`
        + `</svg>`
        + `<div class="bs-verloop__aslabels">${labels}</div>`;
}
