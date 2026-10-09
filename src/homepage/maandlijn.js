/**
 * De maandlijn op de homepage.
 *
 * Achttien maanden uit het voorbeeldscenario als kolommen op een vloer. De
 * kolommen zijn gewone elementen met CSS-transformaties; dit script zet de
 * hoogtes (uit het model) en hangt de bedragen als kaartjes aan de kolommen.
 *
 * De beweging hangt niet aan de scrollpositie. Komt het paneel in beeld, dan
 * rijzen de kolommen en draait de camera één keer van schuin-boven naar recht
 * van voren; dan staat er een staafgrafiek met een nullijn. Daarna bedient de
 * bezoeker het zelf: een knop wisselt tussen 3D en grafiek, en een fase
 * aanwijzen of aanklikken licht de bijbehorende kolommen op. Een eerdere
 * versie liet de camera meedraaien met het scrollen en zette het paneel
 * daarvoor ruim twee schermen vast; dat voelde als scrollen zonder vooruit te
 * komen.
 *
 * De bedragen in de tekst en de tabel staan in index.html zelf, zodat ze er
 * ook zonder JavaScript zijn. tests/homepage-voorbeeld.test.mjs bewaakt dat ze
 * gelijk blijven aan wat dit model uitrekent.
 */

import { voorbeeldTijdlijn, euro } from './voorbeeld.js';

const tijdlijn = voorbeeldTijdlijn();
const { regels, piek } = tijdlijn;

const vloer = document.querySelector('[data-vloer]');
const assen = document.querySelector('[data-assen]');
const beeld = document.querySelector('[data-beeld]');
const fasen = document.querySelector('[data-fasen]');
const draaiknop = document.querySelector('[data-draai]');

const eersteBouw = regels.find((r) => r.fase === 'bouw');

/* --- Kolommen --- */

function segment(soort, bedrag, vanaf) {
    const seg = document.createElement('div');
    seg.className = `hp-seg hp-seg--${soort}`;
    seg.style.setProperty('--e', bedrag.toFixed(0));
    seg.style.setProperty('--z', vanaf.toFixed(0));
    seg.append(document.createElement('i'), document.createElement('b'), document.createElement('u'));
    return seg;
}

regels.forEach((r, i) => {
    const staaf = document.createElement('div');
    staaf.className = 'hp-staaf' + (r === piek ? ' is-piek' : '');
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
assen.innerHTML = `
    <div class="hp-assen__lijn"></div>
    <div class="hp-assen__groepen">
        <span style="flex:${telling.voor}">vooraf</span>
        <span style="flex:${telling.bouw}">bouwmaand 1 t/m ${telling.bouw}</span>
        <span style="flex:${telling.na}">erna</span>
    </div>`;

/* --- Prijskaartjes: de bedragen hangen aan de kolommen zelf ---
   Elk kaartje volgt de bovenkant van zijn kolom, ook terwijl de camera
   draait, zodat tekst en beeld niet los van elkaar staan. */

const prijslaag = document.querySelector('[data-prijzen]');
const kaartjes = [];
if (prijslaag) {
    const keuze = [
        { i: 1, naam: 'vooraf' },
        { i: regels.indexOf(eersteBouw), naam: 'bouwmaand 1', extra: true },
        { i: piekIndex, naam: 'hoogste maand' },
        { i: regels.length - 1, naam: 'daarna' },
    ];
    for (const k of keuze) {
        const el = document.createElement('p');
        el.className = 'hp-prijs' + (k.extra ? ' hp-prijs--extra' : '');
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

/* --- Schaal --- */

/**
 * Past de schaal aan het toneel aan, zodat de hoogste kolom en zijn kaartje in
 * beide standen binnen het beeld blijven. De verhouding tussen de kolommen
 * verandert daar niet door: alle hoogtes delen dezelfde factor.
 */
function pasSchaal() {
    for (const naam of ['--k', '--stap', '--w']) beeld.style.removeProperty(naam);
    // Eerst de breedte: de rij kolommen moet recht van voren in het beeld passen.
    const ruimte = (beeld.clientWidth - 24) / regels.length;
    const cssStap = parseFloat(getComputedStyle(beeld).getPropertyValue('--stap'));
    if (ruimte < cssStap) {
        beeld.style.setProperty('--stap', `${ruimte.toFixed(2)}px`);
        beeld.style.setProperty('--w', `${(ruimte * 0.65).toFixed(2)}px`);
    }
    const maxK = parseFloat(getComputedStyle(beeld).getPropertyValue('--k'));
    const breedte = vloer.offsetWidth;
    const hoogte = beeld.clientHeight;
    const boven = hoogte * 0.74;                    // ruimte boven de nullijn
    const schuin = breedte * 0.15;                  // zoveel steekt de schuine rij boven en onder uit
    const k = Math.min(maxK, (boven - 44) / piek.totaal, (boven - schuin) / (0.9 * piek.totaal));
    beeld.style.setProperty('--k', Math.max(0.02, k).toFixed(4));
    // Schuin gezien steekt de rij onder de nullijn uit; dan schuift hij iets omhoog.
    beeld.style.setProperty('--dy', `${-Math.max(0, schuin + 12 - hoogte * 0.26)}px`);
}

/* --- Kaartjes volgen zolang er iets beweegt --- */

let volgTot = 0;
let volgt = false;
function volg(ms) {
    volgTot = Math.max(volgTot, performance.now() + ms);
    if (volgt) return;
    volgt = true;
    const stap = () => {
        plaatsPrijzen();
        if (performance.now() < volgTot) requestAnimationFrame(stap);
        else volgt = false;
    };
    requestAnimationFrame(stap);
}

/* --- 3D of grafiek --- */

const stil = matchMedia('(prefers-reduced-motion: reduce)');

function zetGrafiek(aan) {
    beeld.classList.toggle('is-grafiek', aan);
    if (draaiknop) {
        draaiknop.textContent = aan ? 'Bekijk in 3D' : 'Bekijk als grafiek';
        draaiknop.setAttribute('aria-pressed', String(!aan));
    }
    volg(1900);
}

// De knop staat verborgen in de HTML: zonder script valt er niets te draaien.
if (draaiknop) draaiknop.hidden = false;
draaiknop?.addEventListener('click', () => zetGrafiek(!beeld.classList.contains('is-grafiek')));

// Eén keer afspelen, zodra het bouwwerk goed in beeld is: eerst rijzen de
// kolommen, dan draait de camera naar de grafiek.
function speelAf() {
    vloer.classList.remove('is-plat');
    volg(1600);
    if (stil.matches) { zetGrafiek(true); return; }
    setTimeout(() => zetGrafiek(true), 1500);
}

if (stil.matches || !('IntersectionObserver' in window)) {
    speelAf();
} else {
    const kijker = new IntersectionObserver((items) => {
        if (!items.some((item) => item.isIntersecting)) return;
        kijker.disconnect();
        speelAf();
    }, { threshold: 0.45 });
    kijker.observe(beeld);
}

/* --- Fasen: aanwijzen licht op, aanklikken zet vast --- */

const NAMEN = ['voor', 'bouw', 'na'];
const faseknoppen = [...fasen.querySelectorAll('[data-fase]')];
let vast = null;
let aangewezen = null;

function toonFase() {
    const naam = aangewezen ?? vast;
    const index = naam === null ? -1 : NAMEN.indexOf(naam);
    for (const el of [vloer, fasen, prijslaag]) {
        if (!el) continue;
        if (index < 0) delete el.dataset.actief;
        else el.dataset.actief = index;
    }
    faseknoppen.forEach((knop) => {
        knop.parentElement.classList.toggle('is-actief', knop.dataset.fase === naam);
        knop.setAttribute('aria-pressed', String(knop.dataset.fase === vast));
    });
    for (const k of kaartjes) k.el.classList.toggle('is-actief', k.el.dataset.fase === naam);
}

for (const knop of faseknoppen) {
    const naam = knop.dataset.fase;
    knop.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { aangewezen = naam; toonFase(); } });
    knop.addEventListener('pointerleave', () => { aangewezen = null; toonFase(); });
    knop.addEventListener('click', () => { vast = vast === naam ? null : naam; aangewezen = null; toonFase(); });
}

/* --- Start --- */

addEventListener('resize', () => { pasSchaal(); volg(300); });
pasSchaal();
plaatsPrijzen();
