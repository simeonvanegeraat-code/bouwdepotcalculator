/**
 * De levende rekening op de homepage.
 *
 * De homepage is sinds 31-08-2026 geen rekenmachine meer maar een introductie;
 * de tool staat op bouwdepot-berekenen.html. Wat hier overblijft is één
 * voorbeeld: een rekening op papier die met een schuifregelaar meerekent.
 *
 * Waarom dat er is en niet alleen een plaatje: het is het enige moment op de
 * pagina waarop de bezoeker merkt dat de site iets doet in plaats van iets
 * vertelt. Eén keer slepen en het bedrag loopt mee.
 *
 * Bewust NIET de hele calculator. Rente en looptijd staan hier vast; wie ze
 * wil veranderen hoort door te klikken. Anders bouwen we de rekenpagina hier
 * een tweede keer, en dan is de knop "Start berekenen" een leugen.
 */

import { annuiteitTermijn } from './annuiteit.js';

/** Vaste uitgangspunten van het voorbeeld. Staan ook zichtbaar op de rekening,
 *  zodat het getal nooit zonder zijn aannames op het scherm staat. */
const RENTE_PROCENT = 3.8;
const JAREN = 30;

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function initHomepageVoorbeeld() {
    const schuif = document.getElementById('voorbeeld-bedrag');
    if (!schuif) return;

    const velden = {
        bedrag: document.getElementById('vb-bedrag'),
        rente: document.getElementById('vb-rente'),
        aflossing: document.getElementById('vb-aflossing'),
        totaal: document.getElementById('vb-totaal'),
        waarde: document.getElementById('vb-waarde'),
    };

    const maandrente = (RENTE_PROCENT / 100) / 12;
    const maanden = JAREN * 12;

    function toon(bedrag) {
        const bruto = annuiteitTermijn(bedrag, maandrente, maanden);
        const rente = bedrag * maandrente;

        velden.bedrag.textContent = euro.format(bedrag);
        velden.waarde.textContent = euro.format(bedrag);
        velden.rente.textContent = euro.format(rente);
        velden.aflossing.textContent = euro.format(Math.max(0, bruto - rente));
        velden.totaal.textContent = euro.format(bruto);
    }

    schuif.addEventListener('input', () => toon(Number(schuif.value)));
    toon(Number(schuif.value));
}

/**
 * De rekening kantelt naar de muis.
 *
 * Alleen op apparaten met een echte aanwijzer: op een touchscreen bestaat hover
 * niet en zou dit niets doen behalve een listener kosten. De waarden gaan als
 * CSS-variabelen naar buiten zodat de transform in de stylesheet blijft staan
 * en het blad ondertussen door kan ademen -- twee transforms op één element
 * zouden elkaar overschrijven.
 */
export function initBladKanteling() {
    const kantel = document.querySelector('[data-kantel]');
    const veld = document.querySelector('[data-kantelveld]');
    if (!kantel || !veld) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let wacht = false;

    veld.addEventListener('pointermove', (e) => {
        if (wacht) return;
        wacht = true;
        requestAnimationFrame(() => {
            const v = veld.getBoundingClientRect();
            kantel.style.setProperty('--bs-kx', ((e.clientX - v.left) / v.width - 0.5).toFixed(3));
            kantel.style.setProperty('--bs-ky', ((e.clientY - v.top) / v.height - 0.5).toFixed(3));
            wacht = false;
        });
    });

    veld.addEventListener('pointerleave', () => {
        kantel.style.setProperty('--bs-kx', 0);
        kantel.style.setProperty('--bs-ky', 0);
    });
}

initHomepageVoorbeeld();
initBladKanteling();
