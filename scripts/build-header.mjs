/**
 * Schrijft één header in alle HTML-pagina's, uit data/navigatie.json.
 *
 * De header stond in 26 bestanden plus drie generatoren, elk met een eigen
 * kopie. Ze waren uit elkaar gelopen: zes pagina's hadden zes verschillende
 * navigaties, drie toonden het woord "Uitleg" twee keer, en onder 760px werd
 * alles op één link na verborgen zonder vervanging. Een bezoeker op een
 * telefoon kon de rekentools niet bereiken.
 *
 * Eén bron lost dat structureel op: een wijziging kost voortaan één bestand.
 * tests/header.test.mjs faalt zodra de pagina's weer uit elkaar lopen.
 *
 * Het paneel gebruikt de Popover API (Baseline 2025, 92,5% wereldwijd). Dat
 * geeft top-layer, licht-wegklikken, Escape en focusbeheer zonder één regel
 * JavaScript. De CSS schakelt de knop pas in achter
 * `@supports selector(:popover-open)`, zodat browsers zonder ondersteuning de
 * gewone link houden in plaats van een paneel dat permanent openstaat.
 *
 * De header is op elke pagina dezelfde, op één ding na: de link naar de pagina
 * zelf krijgt aria-current="page", zodat je ziet waar je bent. Dat gebeurt hier
 * en niet met JavaScript, zodat het er ook staat als scripts niet laden.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAV = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/navigatie.json'), 'utf8'));

const esc = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * De header als één blok, met het paneel erin.
 *
 * @param {string} [huidig] de bestandsnaam van de pagina, bijvoorbeeld
 *   "depotplanner.html". Alleen een link naar precies die pagina wordt
 *   gemarkeerd; een link naar een anker op die pagina niet, anders lichten er
 *   twee regels tegelijk op.
 */
export function headerHtml(huidig = '') {
    const hier = (href) => (huidig && href === huidig ? ' aria-current="page"' : '');

    const hoofd = NAV.hoofd
        .map((i) => `                <a href="${esc(i.href)}"${hier(i.href)}>${esc(i.label)}</a>`)
        .join('\n');

    const groep = (vraag, items, extra = '') => `                    <div class="bs-paneel__groep${extra}">
                        <p class="bs-paneel__vraag">${esc(vraag)}</p>
                        <ul class="bs-paneel__lijst">
${items}
                        </ul>
                    </div>`;

    const regel = (i) => `                        <li>
                            <a href="${esc(i.href)}"${hier(i.href)}>
                                <strong>${esc(i.label)}</strong>${i.uitleg ? `
                                <span>${esc(i.uitleg)}</span>` : ''}
                            </a>
                        </li>`;

    const groepen = NAV.rekenhulpen.groepen
        .map((g) => groep(g.vraag, g.items.map(regel).join('\n')))
        .join('\n');

    // Op een telefoon past naast het woordmerk maar één knop. De hoofditems
    // staan daarom ook in het paneel, bovenaan: het zijn de twee meest
    // gebruikte pagina's. Boven 760px verbergt de CSS die groep, want daar
    // staan ze gewoon in de kop.
    const ookInPaneel = groep('Opzoeken en uitleg', NAV.hoofd.map(regel).join('\n'), ' bs-paneel__groep--ook');

    return `    <header class="bs-kop">
        <div class="bs-wrap bs-kop__inner">
            <a class="bs-merk" href="/">Bouwdepot<span>Calculator</span><b>.nl</b></a>
            <nav class="bs-kop__nav" aria-label="Hoofdnavigatie">
                <button class="bs-kop__knop" type="button" popovertarget="rekenhulpen">
                    <span class="bs-kop__breed">${esc(NAV.rekenhulpen.label)}</span><span class="bs-kop__smal">${esc(NAV.rekenhulpen.labelSmal)}</span>
                    <span class="bs-staafjes" aria-hidden="true"><i></i><i></i><i></i></span>
                </button>
                <a class="bs-kop__terugval" href="${esc(NAV.rekenhulpen.terugval)}">${esc(NAV.rekenhulpen.label)}</a>
${hoofd}
            </nav>
        </div>

        <div class="bs-paneel" id="rekenhulpen" popover>
            <div class="bs-wrap bs-paneel__inner">
${ookInPaneel}
${groepen}
            </div>
        </div>
    </header>`;
}

/**
 * De voettekst, uit dezelfde bron. Hij stond met de hand in elke pagina en was
 * in drie varianten uit elkaar gelopen: 26 van de 32 pagina's misten de link
 * naar de gebruiksvoorwaarden.
 *
 * De 404-pagina krijgt links vanaf de root: Vercel toont haar op elk adres dat
 * niet bestaat, ook een adres in een map, en daar wijst een relatieve link mis.
 *
 * @param {string} [bestand] de bestandsnaam van de pagina
 */
export function voetHtml(bestand = '') {
    const voor = bestand === '404.html' ? '/' : '';
    const links = NAV.voet.links.map((i) => `<a href="${voor}${esc(i.href)}">${esc(i.label)}</a>`).join('');
    return `    <footer class="ui-voet">
        <span>${esc(NAV.voet.tekst)}</span>
        <nav aria-label="Over deze site">${links}</nav>
    </footer>`;
}

/** Vervangt het blok dat met `begin` start en met `eind` sluit door `blok`, met de regeleindes van het bestand. */
function vervang(html, begin, eind, blok, bestand) {
    const start = html.indexOf(begin);
    if (start < 0) { console.warn(`  overgeslagen, geen ${begin}: ${bestand}`); return html; }
    const slot = html.indexOf(eind, start);
    if (slot < 0) throw new Error(`geen sluitende ${eind} in ${bestand}`);

    // Regeleindes per bestand aanhouden; de repo is gemengd LF en CRLF.
    const nl = html.includes('\r\n') ? '\r\n' : '\n';
    const regelStart = html.lastIndexOf('\n', start) + 1;
    return html.slice(0, regelStart) + blok.split('\n').join(nl) + html.slice(slot + eind.length);
}

// Alleen uitvoeren als dit bestand zelf wordt gestart; de generatoren
// importeren headerHtml() en voetHtml() en schrijven hun eigen pagina.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const pagina = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
    let geschreven = 0;

    for (const bestand of pagina) {
        const pad = path.join(ROOT, bestand);
        const html = fs.readFileSync(pad, 'utf8');

        let nieuw = vervang(html, '<header class="bs-kop', '</header>', headerHtml(bestand), bestand);
        nieuw = vervang(nieuw, '<footer class="ui-voet', '</footer>', voetHtml(bestand), bestand);

        if (nieuw !== html) { fs.writeFileSync(pad, nieuw); geschreven++; }
    }

    console.log(`Header en voettekst geschreven in ${geschreven} van ${pagina.length} pagina's.`);
}
