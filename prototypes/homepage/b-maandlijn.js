/**
 * Concept B · Maandlijn.
 *
 * Achttien maanden uit het voorbeeldscenario als kolommen op een vloer. De
 * kolommen zijn gewone elementen met CSS-transformaties; dit script zet alleen
 * de hoogtes (uit het model) en draait de vloer mee met de scrollpositie.
 *
 * Aan het eind van de baan staat de camera recht voor de kolommen. Dan is het
 * bouwwerk een staafgrafiek met een nullijn, en dat is ook het beeld dat
 * bezoekers met "verminderde beweging" meteen krijgen.
 */

import { voorbeeldTijdlijn, euro } from './voorbeeld.js';

const tijdlijn = voorbeeldTijdlijn();
const { regels, piek } = tijdlijn;

const vloer = document.querySelector('[data-vloer]');
const assen = document.querySelector('[data-assen]');
const beeld = document.querySelector('[data-beeld]');
const fasen = document.querySelector('[data-fasen]');
const baan = document.querySelector('[data-baan]');

/* --- Bedragen in de tekst: uit hetzelfde model als de kolommen --- */

const eersteBouw = regels.find((r) => r.fase === 'bouw');
const tekst = { voor: regels[0].totaal, start: eersteBouw.totaal, piek: piek.totaal, na: tijdlijn.annuiteit };
for (const el of document.querySelectorAll('[data-b]')) el.textContent = euro.format(tekst[el.dataset.b]);

/* --- Kolommen --- */

function segment(soort, bedrag, vanaf) {
    const seg = document.createElement('div');
    seg.className = `b-seg b-seg--${soort}`;
    seg.style.setProperty('--e', bedrag.toFixed(0));
    seg.style.setProperty('--z', vanaf.toFixed(0));
    seg.append(document.createElement('i'), document.createElement('b'), document.createElement('u'));
    return seg;
}

regels.forEach((r, i) => {
    const staaf = document.createElement('div');
    staaf.className = 'b-staaf' + (r === piek ? ' is-piek' : '');
    staaf.dataset.fase = r.fase;
    staaf.style.setProperty('--i', i);
    if (r.woonlast > 0) staaf.append(segment('oud', r.woonlast, 0));
    if (r.hypotheek > 0) staaf.append(segment('nieuw', r.hypotheek, r.woonlast));
    vloer.append(staaf);
});
beeld.style.setProperty('--n', regels.length);

/* --- Assen van het eindbeeld --- */

const telling = { voor: 0, bouw: 0, na: 0 };
for (const r of regels) telling[r.fase]++;
const piekIndex = regels.indexOf(piek);
assen.style.setProperty('--piek', piek.totaal.toFixed(0));
assen.style.setProperty('--piek-i', piekIndex);
assen.innerHTML = `
    <p class="b-assen__piek">${euro.format(piek.totaal)} · ${piek.label.toLowerCase()}</p>
    <div class="b-assen__lijn"></div>
    <div class="b-assen__groepen">
        <span style="flex:${telling.voor}">vooraf</span>
        <span style="flex:${telling.bouw}">bouwmaand 1 t/m ${telling.bouw}</span>
        <span style="flex:${telling.na}">erna</span>
    </div>`;

/* --- Tabel: dezelfde regels, als tekst --- */

document.querySelector('[data-tabel]').innerHTML = regels.map((r) => `
    <tr${r === piek ? ' class="is-piek"' : ''}>
        <td>${r.label}${r === piek ? ' (hoogste)' : ''}</td>
        <td>${r.depot === null ? 'n.v.t.' : euro.format(r.depot)}</td>
        <td>${r.hypotheek ? euro.format(r.hypotheek) : '–'}</td>
        <td>${r.woonlast ? euro.format(r.woonlast) : '–'}</td>
        <td>${euro.format(r.totaal)}</td>
    </tr>`).join('');

/* --- Prijskaartjes: de bedragen hangen aan de kolommen zelf ---
   Alleen als de pagina er een laag voor heeft (concept D). Elk kaartje volgt
   de bovenkant van zijn kolom, ook terwijl de camera draait, zodat tekst en
   beeld niet meer los van elkaar staan. */

const prijslaag = document.querySelector('[data-prijzen]');
const kaartjes = [];
if (prijslaag) {
    const eersteNa = regels.findIndex((r) => r.fase === 'na');
    const keuze = [
        { i: 1, naam: 'vooraf' },
        { i: regels.indexOf(eersteBouw), naam: 'bouwmaand 1', extra: true },
        { i: piekIndex, naam: 'hoogste maand' },
        { i: eersteNa + 1, naam: 'na oplevering' },
    ];
    for (const k of keuze) {
        const el = document.createElement('p');
        el.className = 'b-prijs' + (k.extra ? ' b-prijs--extra' : '');
        el.dataset.fase = regels[k.i].fase;
        el.innerHTML = `<strong class="tnum">${euro.format(regels[k.i].totaal)}</strong><span>${k.naam}</span>`;
        prijslaag.append(el);
        kaartjes.push({ el, top: vloer.children[k.i].lastElementChild.firstElementChild });
    }
}

function plaatsPrijzen() {
    if (!kaartjes.length) return;
    const kader = prijslaag.getBoundingClientRect();
    for (const k of kaartjes) {
        const r = k.top.getBoundingClientRect();
        k.el.style.transform = `translate(${(r.left + r.width / 2 - kader.left).toFixed(1)}px, ${(r.top - kader.top).toFixed(1)}px) translate(-50%, -100%)`;
    }
}

/* --- Camera --- */

const stil = matchMedia('(prefers-reduced-motion: reduce)');
const zacht = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/**
 * Past de schaal aan het toneel aan, zodat de hoogste kolom en zijn label in
 * beide standen binnen het beeld blijven. De verhouding tussen de kolommen
 * verandert daar niet door: alle hoogtes delen dezelfde factor.
 */
let zakIso = 0;
function pasSchaal() {
    for (const naam of ['--k', '--stap', '--w']) beeld.style.removeProperty(naam);
    // Eerst de breedte: de rij kolommen moet recht van voren in het beeld passen.
    const ruimte = (beeld.clientWidth - 24) / regels.length;
    const cssStap = parseFloat(getComputedStyle(beeld).getPropertyValue('--stap'));
    if (ruimte < cssStap) {
        beeld.style.setProperty('--stap', `${ruimte.toFixed(2)}px`);
        beeld.style.setProperty('--w', `${(ruimte * 0.65).toFixed(2)}px`);
    }
    const stijl = getComputedStyle(beeld);
    const maxK = parseFloat(stijl.getPropertyValue('--k'));
    const breedte = vloer.offsetWidth;
    const hoogte = beeld.clientHeight;
    const boven = hoogte * 0.74;                    // ruimte boven de nullijn
    const schuin = breedte * 0.15;                  // zoveel steekt de schuine rij boven en onder uit
    const k = Math.min(maxK, (boven - 36) / piek.totaal, (boven - schuin) / (0.9 * piek.totaal));
    beeld.style.setProperty('--k', Math.max(0.02, k).toFixed(4));
    zakIso = Math.max(0, schuin + 12 - hoogte * 0.26);
}

function zetCamera(p) {
    const draai = zacht(0.08, 0.86, p);
    vloer.style.setProperty('--rx', `${62 + 28 * draai}deg`);
    vloer.style.setProperty('--rz', `${40 * (1 - draai)}deg`);
    // Schuin gezien steekt de rij onder de nullijn uit; dan schuift hij iets omhoog.
    vloer.style.setProperty('--dy', `${(1 - draai) * -zakIso}px`);
    assen.style.setProperty('--assen', zacht(0.88, 0.97, p).toFixed(3));

    // Vier standen: alles, vooraf, bouw, erna, en aan het eind weer alles.
    let actief = null;
    if (p > 0.14 && p <= 0.4) actief = 0;
    else if (p > 0.4 && p <= 0.7) actief = 1;
    else if (p > 0.7 && p <= 0.9) actief = 2;
    if (actief === getoond) return;
    getoond = actief;
    for (const el of [vloer, fasen, prijslaag]) {
        if (!el) continue;
        if (actief === null) delete el.dataset.actief;
        else el.dataset.actief = actief;
    }
    [...fasen.children].forEach((li, i) => li.classList.toggle('is-actief', i === actief));
    const naam = ['voor', 'bouw', 'na'][actief];
    for (const k of kaartjes) k.el.classList.toggle('is-actief', k.el.dataset.fase === naam);
}
let getoond;

function voortgang() {
    const r = baan.getBoundingClientRect();
    const lengte = r.height - innerHeight;
    return lengte > 0 ? Math.min(1, Math.max(0, -r.top / lengte)) : 1;
}

// De camera loopt naar de scrollpositie toe in plaats van er direct op te
// springen. Een muiswiel scrolt in stappen van zo'n honderd pixels; zonder
// demping zie je elke stap als een schok in de draaiing.
let doel = 0;
let nu = 0;
let loopt = false;
let warmTot = 0;

function stap() {
    nu += (doel - nu) * 0.12;
    if (Math.abs(doel - nu) < 0.0004) nu = doel;
    zetCamera(nu);
    plaatsPrijzen();
    if (nu !== doel || performance.now() < warmTot) requestAnimationFrame(stap);
    else loopt = false;
}

function bijScroll() {
    doel = stil.matches ? 1 : voortgang();
    if (loopt) return;
    loopt = true;
    requestAnimationFrame(stap);
}

addEventListener('scroll', bijScroll, { passive: true });
addEventListener('resize', () => { pasSchaal(); bijScroll(); });
stil.addEventListener('change', bijScroll);
pasSchaal();
doel = nu = stil.matches ? 1 : voortgang();
zetCamera(nu);
// Terwijl de kolommen rijzen moeten de kaartjes mee omhoog.
warmTot = performance.now() + 1800;
bijScroll();

// De kolommen rijzen één keer, na de eerste weergave.
requestAnimationFrame(() => requestAnimationFrame(() => vloer.classList.remove('is-plat')));
