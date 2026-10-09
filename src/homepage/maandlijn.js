/**
 * De maandlijn op de homepage.
 *
 * Achttien maanden uit het voorbeeldscenario als kolommen op een vloer. De
 * kolommen zijn gewone elementen met CSS-transformaties; dit script zet de
 * hoogtes (uit het model) en hangt de bedragen als kaartjes aan de kolommen.
 *
 * De beweging hangt niet aan de scrollpositie. Komt het paneel in beeld, dan
 * rijzen de kolommen en draait de camera van schuin-boven naar recht van voren;
 * dan staat er een staafgrafiek met een nullijn. Daarna maakt de camera om de
 * ongeveer elf seconden een kort rondje naar 3D en terug, zodat de pagina niet
 * stilvalt. De grafiek is de rusttoestand: daar staat hij het grootste deel
 * van de tijd, want dat is het beeld dat je kunt aflezen.
 *
 * Het rondje stopt als het paneel uit beeld is, als het tabblad niet zichtbaar
 * is, als de bezoeker een fase heeft vastgezet, en met de knop "Animatie
 * pauzeren". Wie verminderde beweging heeft ingesteld krijgt alleen de
 * grafiek. Een eerdere versie liet de camera meedraaien met het scrollen en
 * zette het paneel daarvoor ruim twee schermen vast; dat voelde als scrollen
 * zonder vooruit te komen.
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

/* --- Grafiek, met af en toe een rondje naar 3D --- */

const stil = matchMedia('(prefers-reduced-motion: reduce)');
const RUST_MS = 8000;      // zo lang staat de grafiek stil
const RONDJE_MS = 3200;    // zo lang duurt het uitstapje naar 3D, heen-draaien inbegrepen

function zetGrafiek(aan) {
    beeld.classList.toggle('is-grafiek', aan);
    volg(1900);
}

// Welke fase de bezoeker heeft vastgezet of aanwijst. Staat hier en niet bij
// de faseknoppen verderop, omdat de lus hieronder er al naar kijkt.
let vast = null;
let aangewezen = null;

let afgespeeld = false;
let inBeeld = false;
let gepauzeerd = false;
let klok = null;

/** Mag de camera nu uit zichzelf bewegen? */
const magLopen = () => afgespeeld && inBeeld && !gepauzeerd && !document.hidden && !stil.matches && vast === null;

function plan(ms, werk) {
    clearTimeout(klok);
    klok = setTimeout(werk, ms);
}

function rondje() {
    if (!magLopen()) return;
    zetGrafiek(false);
    plan(RONDJE_MS, () => {
        zetGrafiek(true);
        plan(RUST_MS, rondje);
    });
}

/** Herstart of stopt de lus, afhankelijk van wat er net veranderd is. */
function werkLusBij() {
    clearTimeout(klok);
    if (magLopen()) { plan(RUST_MS, rondje); return; }
    // Niet halverwege een rondje blijven hangen: terug naar de grafiek.
    if (afgespeeld) zetGrafiek(true);
}

// De eerste keer: de kolommen rijzen, dan draait de camera naar de grafiek.
function speelAf() {
    vloer.classList.remove('is-plat');
    volg(1600);
    const klaar = () => { zetGrafiek(true); afgespeeld = true; werkLusBij(); };
    if (stil.matches) klaar();
    else setTimeout(klaar, 1500);
}

if (stil.matches || !('IntersectionObserver' in window)) {
    inBeeld = true;
    speelAf();
} else {
    new IntersectionObserver(([item]) => {
        inBeeld = item.isIntersecting;
        if (inBeeld && vloer.classList.contains('is-plat')) speelAf();
        else werkLusBij();
    }, { threshold: 0.45 }).observe(beeld);
    document.addEventListener('visibilitychange', werkLusBij);
    stil.addEventListener('change', werkLusBij);
}

// Wat vanzelf beweegt moet stil te zetten zijn. De knop staat verborgen in de
// HTML en blijft dat voor wie verminderde beweging heeft ingesteld: dan is er
// niets om te pauzeren.
if (draaiknop && !stil.matches) {
    draaiknop.hidden = false;
    draaiknop.addEventListener('click', () => {
        gepauzeerd = !gepauzeerd;
        draaiknop.textContent = gepauzeerd ? 'speel animatie af' : 'pauzeer animatie';
        draaiknop.setAttribute('aria-pressed', String(gepauzeerd));
        werkLusBij();
        // Bij hervatten meteen iets laten zien, niet pas na acht seconden.
        if (!gepauzeerd && magLopen()) rondje();
    });
}

/* --- Fasen: aanwijzen licht op, aanklikken zet vast --- */

const NAMEN = ['voor', 'bouw', 'na'];
const faseknoppen = [...fasen.querySelectorAll('[data-fase]')];

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
    knop.addEventListener('click', () => { vast = vast === naam ? null : naam; aangewezen = null; toonFase(); werkLusBij(); });
}

/* --- Start --- */

addEventListener('resize', () => { pasSchaal(); volg(300); });
pasSchaal();
plaatsPrijzen();
