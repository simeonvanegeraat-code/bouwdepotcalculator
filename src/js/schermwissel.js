/**
 * Wisselen tussen de schermen van een route in stappen (nieuwbouw, verbouwen).
 *
 * Het scherm dat er staat is een attribuut op de body (data-nb); de stijl in
 * src/styles/next/nieuwbouw.css doet de rest. Elk scherm met vragen is een
 * <form data-scherm="…">; "start" en "klaar" zijn geen formulier. De wissel
 * loopt via een view transition waar de browser die kent, en de focus gaat mee
 * naar het eerste veld van het nieuwe scherm, of naar de kop van de pagina.
 */

/**
 * @param {object} o
 * @param {HTMLElement} o.wortel   het element waar de schermen in staan
 * @param {HTMLElement} o.kop      krijgt de focus als een scherm geen veld heeft
 * @param {(stand: string) => void} [o.opStand]     meteen, nog vóór de wissel
 * @param {(stand: string) => void} [o.voorWissel]  vlak voor een zichtbare wissel
 * @param {(stand: string, zonderBeweging: boolean) => void} [o.inWissel]  als het scherm wisselt
 */
export function maakSchermwissel({ wortel, kop, opStand = () => {}, voorWissel = () => {}, inWissel = () => {} }) {
    const lichaam = document.body;
    const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
    kop.tabIndex = -1;

    function toon(naar, { direct = false } = {}) {
        const stand = String(naar);
        opStand(stand);
        const wissel = () => {
            lichaam.dataset.nb = stand;
            for (const f of wortel.querySelectorAll('form[data-scherm]')) f.hidden = f.dataset.scherm !== stand;
            inWissel(stand, stil || direct);
        };
        const focus = () => {
            const scherm = wortel.querySelector(`form[data-scherm="${stand}"]`);
            (scherm?.querySelector('input:not([type=radio]):not([type=range]):not([type=checkbox])') ?? scherm?.querySelector('input') ?? kop).focus({ preventScroll: true });
            scrollTo({ top: 0, behavior: stil ? 'auto' : 'smooth' });
        };
        if (direct) { wissel(); return; }
        voorWissel(stand);
        // Met een overgang wisselt de browser het scherm een beeld later; pas dan
        // staat het veld er om de focus te krijgen.
        if (document.startViewTransition && !stil) {
            const overgang = document.startViewTransition(wissel);
            overgang.updateCallbackDone.then(focus, focus);
            // Breekt de browser de overgang af (tabblad op de achtergrond, of een
            // tweede klik), dan is het scherm toch gewisseld; geen fout om te melden.
            overgang.ready.catch(() => {});
            overgang.finished.catch(() => {});
        } else { wissel(); focus(); }
    }

    return { toon, stil };
}
