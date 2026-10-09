/**
 * Concept A · Bouwlagen.
 *
 * De pagina werkt zonder dit bestand: tekst, bedragen, knoppen en het
 * stilstaande huis staan in de HTML. Dit script doet drie dingen erbij:
 *   1. de bedragen nog eens uit het voorbeeldmodel halen, zodat tekst en meter
 *      niet uit elkaar kunnen lopen;
 *   2. bijhouden bij welke stap de lezer is;
 *   3. de 3D-scene pas laden als het apparaat en de bezoeker dat toelaten.
 */

import { voorbeeldTijdlijn, euro } from './voorbeeld.js';

const tijdlijn = voorbeeldTijdlijn();
const bouw = (m) => tijdlijn.regels.find((r) => r.bouwmaand === m);
const { aanneemsom, huidigeWoonlast } = tijdlijn.aannames;

// Wat de meter per stap laat zien. Stap 0 is de hero.
const STANDEN = [
    { fase: 'Vóór de bouw', depot: aanneemsom, maand: huidigeWoonlast, noot: 'alleen je huidige woonlast' },
    { fase: 'Bouwmaand 1', depot: bouw(1).depot, maand: bouw(1).totaal, noot: 'hypotheek na depotvergoeding + huidige woonlast' },
    { fase: 'Bouwmaand 4 · ruwbouw staat', depot: bouw(4).depot, maand: bouw(4).totaal, noot: 'hypotheek na depotvergoeding + huidige woonlast' },
    { fase: 'Bouwmaand 10 · dak en afbouw', depot: bouw(10).depot, maand: bouw(10).totaal, noot: 'hypotheek na depotvergoeding + huidige woonlast' },
    { fase: 'Bouwmaand 12 · oplevering', depot: bouw(12).depot, maand: bouw(12).totaal, noot: `daarna ${euro.format(tijdlijn.annuiteit)} per maand` },
];

const bedragen = { m1: bouw(1).totaal, m4: bouw(4).totaal, m10: bouw(10).totaal, m12: bouw(12).totaal, na: tijdlijn.annuiteit };
for (const el of document.querySelectorAll('[data-bedrag]')) {
    el.textContent = euro.format(bedragen[el.dataset.bedrag]);
}

const meter = Object.fromEntries([...document.querySelectorAll('[data-meter]')].map((el) => [el.dataset.meter, el]));
let getoond = -1;

// Bedragen verspringen in één keer. Een teller die naar het antwoord toe loopt
// laat een halve seconde lang een bedrag zien dat niet klopt.
function toonStand(index) {
    if (index === getoond) return;
    getoond = index;
    const s = STANDEN[index];
    meter.fase.textContent = s.fase;
    meter.depot.textContent = euro.format(s.depot);
    meter.maand.textContent = euro.format(s.maand);
    meter.noot.textContent = s.noot;
    meter.balk.style.width = `${(s.depot / aanneemsom) * 100}%`;
}

const toneel = document.querySelector('[data-toneel]');
const stappen = [...document.querySelectorAll('[data-stap]')];

/**
 * Waar de lezer is, als doorlopend getal: 0 is de hero, 1 de eerste stap, en
 * 1,5 halverwege stap één en twee. Gemeten aan het midden van het leesvlak,
 * dus op mobiel het deel onder het vastgezette huis.
 */
function voortgang() {
    const boven = innerWidth < 900 ? toneel.offsetHeight : 0;
    const lees = boven + (innerHeight - boven) / 2;
    const positie = scrollY + lees;
    // Het eerste anker is de leeslijn bij een pagina die bovenaan staat.
    const ankers = [lees, ...stappen.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + scrollY + r.height / 2;
    })];
    if (positie <= ankers[0]) return 0;
    for (let i = 1; i < ankers.length; i++) {
        if (positie <= ankers[i]) return i - 1 + (positie - ankers[i - 1]) / (ankers[i] - ankers[i - 1]);
    }
    return ankers.length - 1;
}

let scene = null;
let wacht = false;

function bijScroll() {
    if (wacht) return;
    wacht = true;
    requestAnimationFrame(() => {
        wacht = false;
        const s = voortgang();
        toonStand(Math.min(STANDEN.length - 1, Math.round(s)));
        scene?.zetVoortgang(s);
    });
}

addEventListener('scroll', bijScroll, { passive: true });
addEventListener('resize', bijScroll);
bijScroll();

/* --- 3D: alleen als het kan en mag --- */

function magDrieD() {
    if (new URLSearchParams(location.search).has('geen3d')) return false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (navigator.connection?.saveData) return false;
    try {
        const proef = document.createElement('canvas');
        return Boolean(proef.getContext('webgl2') || proef.getContext('webgl'));
    } catch {
        return false;
    }
}

async function laadScene() {
    if (!magDrieD()) return;
    try {
        const { maakScene } = await import('./a-scene.js');
        scene = maakScene(document.querySelector('[data-canvas]'), toneel);
        scene.zetVoortgang(voortgang(), true);
        toneel.classList.add('is-3d');
    } catch (fout) {
        // Lukt het niet, dan blijft de poster staan. Niets op de pagina hangt
        // van de scene af.
        console.warn('3D-scene niet geladen; de statische weergave blijft staan.', fout);
    }
}

// Pas na de eerste weergave: tekst en knoppen hoeven nergens op te wachten.
if ('requestIdleCallback' in window) requestIdleCallback(laadScene, { timeout: 1500 });
else setTimeout(laadScene, 300);
