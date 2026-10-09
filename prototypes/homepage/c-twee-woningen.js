/**
 * Concept C · Twee woningen.
 *
 * Zonder dit script staan de twee tekeningen stil in de HTML en werken alle
 * links. Het script voegt toe: de tekening die meedraait met de muis en bij
 * het wegscrollen platklapt tot een gevelaanzicht, het "bouwen" van de
 * aangewezen helft, en het ene invoerveld onder de keuze.
 */

import { voorbeeldTijdlijn, euro } from './voorbeeld.js';
import { annuiteitTermijn } from '../../src/js/annuiteit.js';
import { leesGetal } from '../../src/js/getallen.js';
import { MODELLEN, geometrie, svgInhoud, werkBij } from './c-tekening.js';

const RENTE = 3.8;
const JAREN = 30;
const maandlast = (bedrag) => annuiteitTermijn(bedrag, RENTE / 100 / 12, JAREN * 12);

/* --- Bedragen uit het model --- */

const cijfers = { piek: voorbeeldTijdlijn().piek.totaal, aanbouw: maandlast(60000) };
for (const el of document.querySelectorAll('[data-c]')) el.textContent = euro.format(cijfers[el.dataset.c]);

/* --- Welke helft is aangewezen --- */

const hero = document.querySelector('[data-hero]');
const kanten = [...document.querySelectorAll('[data-kant]')];
const fijn = matchMedia('(hover: hover) and (pointer: fine)').matches;

let aangewezen = null;
let gescrold = false;

// Een helft bouwt zich af als hij wordt aangewezen, en beide zodra de lezer
// begint te scrollen.
function werkKantenBij() {
    if (!fijn) return;
    for (const k of kanten) k.classList.toggle('is-actief', gescrold || k.dataset.kant === aangewezen);
}

function wijsAan(naam) {
    aangewezen = naam;
    if (naam) hero.dataset.actief = naam;
    else delete hero.dataset.actief;
    werkKantenBij();
}

addEventListener('scroll', () => {
    const voorbij = scrollY > 40;
    if (voorbij === gescrold) return;
    gescrold = voorbij;
    werkKantenBij();
}, { passive: true });

for (const kant of kanten) {
    kant.addEventListener('pointerenter', () => wijsAan(kant.dataset.kant));
    kant.addEventListener('pointerleave', () => wijsAan(null));
    kant.addEventListener('focusin', () => wijsAan(kant.dataset.kant));
    kant.addEventListener('focusout', () => wijsAan(null));
}
for (const woord of document.querySelectorAll('[data-wijst]')) {
    woord.addEventListener('pointerenter', () => wijsAan(woord.dataset.wijst));
    woord.addEventListener('pointerleave', () => wijsAan(null));
    woord.addEventListener('focus', () => wijsAan(woord.dataset.wijst));
    woord.addEventListener('blur', () => wijsAan(null));
}

// Zonder muis is er niets aan te wijzen: daar bouwt een tekening zich zodra hij
// in beeld komt, en blijft dan staan.
if (!fijn) {
    const kijker = new IntersectionObserver((items) => {
        for (const item of items) if (item.isIntersecting) item.target.classList.add('is-actief');
    }, { threshold: 0.55 });
    kanten.forEach((k) => kijker.observe(k));
}

/* --- Tekeningen --- */

const tekeningen = [...document.querySelectorAll('[data-tekening]')].map((svg) => {
    const model = MODELLEN[svg.dataset.tekening];
    svg.innerHTML = svgInhoud(geometrie(model));
    return { svg, model };
});

const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!stil) {
    let muis = 0, kijk = 0, plat = 0, platNu = 0, loopt = false;

    function teken() {
        kijk += (muis - kijk) * 0.08;
        platNu += (plat - platNu) * 0.12;
        const yaw = (35 + kijk * 14) * (1 - platNu);
        const pitch = 28 * (1 - platNu);
        for (const t of tekeningen) werkBij(t.svg, geometrie(t.model, yaw, pitch));
        if (Math.abs(muis - kijk) < 0.001 && Math.abs(plat - platNu) < 0.001) { loopt = false; return; }
        requestAnimationFrame(teken);
    }
    const wek = () => { if (!loopt) { loopt = true; requestAnimationFrame(teken); } };

    if (fijn) {
        hero.addEventListener('pointermove', (e) => { muis = e.clientX / innerWidth - 0.5; wek(); });
        hero.addEventListener('pointerleave', () => { muis = 0; wek(); });
    }

    // Wie doorscrolt ziet het perspectief platklappen tot een gevelaanzicht:
    // de overgang van de tekening naar de plattegrond eronder.
    const twee = document.querySelector('.c-twee');
    addEventListener('scroll', () => {
        const r = twee.getBoundingClientRect();
        plat = Math.min(1, Math.max(0, (innerHeight * 0.3 - r.top) / (r.height * 0.75)));
        wek();
    }, { passive: true });
}

/* --- Het ene invoerveld --- */

const formulier = document.querySelector('[data-snel]');
const veld = formulier.querySelector('input');
const uit = formulier.querySelector('[data-snel-uit]');

function rekenSnel() {
    const bedrag = leesGetal(veld.value);
    const fout = bedrag === null || !Number.isFinite(bedrag) ? 'Vul een bedrag in, bijvoorbeeld 25.000.'
        : bedrag < 1000 ? 'Vul een bedrag van minstens € 1.000 in.'
        : bedrag > 1000000 ? 'Boven één miljoen euro: gebruik de volledige rekentool.'
        : null;
    if (fout) {
        uit.dataset.fout = '';
        uit.textContent = fout;
        veld.setAttribute('aria-invalid', 'true');
        return;
    }
    delete uit.dataset.fout;
    veld.removeAttribute('aria-invalid');
    uit.textContent = `${euro.format(maandlast(bedrag))} bruto per maand`;
}

veld.addEventListener('input', rekenSnel);
formulier.addEventListener('submit', (e) => { e.preventDefault(); rekenSnel(); });
rekenSnel();
