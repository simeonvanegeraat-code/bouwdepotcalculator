/**
 * Het huis naast de leenruimtecheck, dat laag voor laag wordt gebouwd.
 *
 * Op een breed scherm blijft onder de uitkomst ruimte over. Daar staat het
 * 3D-huis uit homepageconcept A (src/verbouwen/huis3d.js): fundering, twee
 * bouwlagen, dak en ramen zakken een voor een op hun plek.
 *
 * De bouw speelt af zodra het huis goed in beeld is, in zijn eigen tempo. Hij
 * hing eerst aan de scrollpositie, maar dan gebeurde de helft pas als het huis
 * al bijna uit beeld was. Is het huis helemaal uit beeld geweest, dan begint
 * het de volgende keer opnieuw; wie er met de muis overheen gaat ziet het ook
 * nog een keer.
 *
 * Zonder dit script staat er een stilstaande lijntekening in de HTML. Die
 * blijft ook staan als 3D niet kan of mag: geen WebGL, verminderde beweging of
 * databesparing. In dat geval bouwt de lijntekening zelf op.
 *
 * Three.js wordt pas opgehaald als het huis bijna in beeld is.
 */

import { leesGetal, euro } from '../js/getallen.js';

const DUUR = 4200;   // milliseconden voor de hele bouw

const huis = document.querySelector('[data-huis]');
if (huis) {
    const svg = huis.querySelector('svg');
    const veld = document.getElementById('lr-totaal');

    /* --- Het bedrag in de lijntekening --- */

    const label = svg.querySelector('.hp-maattekst');
    const werkBedragBij = () => {
        const bedrag = leesGetal(veld?.value ?? '');
        label.textContent = bedrag !== null && bedrag > 0 ? `je verbouwing ${euro.format(bedrag)}` : 'je verbouwing';
    };
    if (veld && label) {
        veld.addEventListener('input', werkBedragBij);
        // De pagina vult het veld bij het laden met een onthouden of meegegeven bedrag.
        addEventListener('load', werkBedragBij);
        werkBedragBij();
    }

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        huis.classList.add('is-actief');
    } else {
        /* --- De bouw: 0 is leeg, 1 is af --- */

        // De lijntekening leest --p zelf uit; de 3D-scene krijgt de stand
        // doorgegeven en kent vier stappen (bij 4 branden de lampen).
        huis.classList.add('is-scroll');
        let stand = 0, lus = 0, scene = null;

        const zet = (waarde, direct = false) => {
            stand = waarde;
            huis.style.setProperty('--p', waarde.toFixed(3));
            scene?.zetVoortgang(waarde * 4, direct);
        };

        const speel = () => {
            if (lus || stand >= 1) return;
            const van = stand, start = performance.now();
            const stap = (nu) => {
                const t = Math.min(1, (nu - start) / (DUUR * (1 - van)));
                zet(van + (1 - van) * t);
                lus = t < 1 ? requestAnimationFrame(stap) : 0;
            };
            lus = requestAnimationFrame(stap);
        };

        const begin = () => {
            cancelAnimationFrame(lus);
            lus = 0;
            zet(0, true);
        };

        if ('IntersectionObserver' in window) {
            // Spelen als driekwart van het huis in beeld is; terug naar het
            // begin als het helemaal uit beeld is.
            new IntersectionObserver(([item]) => {
                if (item.intersectionRatio >= 0.75) speel();
                else if (!item.isIntersecting) begin();
            }, { threshold: [0, 0.75] }).observe(huis.querySelector('.wr-huis__beeld'));
        } else {
            zet(1, true);
        }

        // Nog een keer zien: met de muis erover begint een afgebouwd huis opnieuw.
        huis.addEventListener('pointerenter', () => {
            if (stand < 1) return;
            begin();
            speel();
        });

        /* --- 3D: alleen als het kan en mag, en pas als het bijna in beeld is --- */

        const magDrieD = () => {
            if (new URLSearchParams(location.search).has('geen3d')) return false;
            if (navigator.connection?.saveData) return false;
            if (getComputedStyle(huis).display === 'none') return false;
            try {
                const proef = document.createElement('canvas');
                return Boolean(proef.getContext('webgl2') || proef.getContext('webgl'));
            } catch {
                return false;
            }
        };

        const laadScene = async () => {
            if (!magDrieD()) return;
            try {
                const { maakScene } = await import('./huis3d.js');
                scene = maakScene(huis.querySelector('[data-huis-canvas]'), huis);
                scene.zetVoortgang(stand * 4, true);
                huis.classList.add('is-3d');
            } catch (fout) {
                // Lukt het niet, dan blijft de lijntekening staan. Niets op de
                // pagina hangt van de scene af.
                console.warn('3D-huis niet geladen; de tekening blijft staan.', fout);
            }
        };

        if ('IntersectionObserver' in window) {
            const kijker = new IntersectionObserver(([item]) => {
                if (!item.isIntersecting) return;
                kijker.disconnect();
                laadScene();
            }, { rootMargin: '400px 0px' });
            kijker.observe(huis);
        }
    }
}
