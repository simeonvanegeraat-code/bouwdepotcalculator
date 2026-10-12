/**
 * Wisselen tussen de schermen van een route in stappen (nieuwbouw, verbouwen).
 *
 * Het scherm dat er staat is een attribuut op de body (data-nb); de stijl in
 * src/styles/next/nieuwbouw.css doet de rest. Elk scherm met vragen is een
 * <form data-scherm="…">; "start" en "klaar" zijn geen formulier. De wissel
 * loopt via een view transition waar de browser die kent, en de focus gaat mee
 * naar het eerste veld van het nieuwe scherm, of naar de kop van de pagina.
 *
 * Op een aanraakscherm gaat de focus naar de kop van het scherm en niet naar
 * het veld: een veld met focus opent daar het toetsenbord, en dat schuift over
 * de vraag heen voordat je hem hebt gelezen. Het toetsenbord komt als je zelf
 * een veld aantikt. Binnen een scherm brengt Enter je naar het volgende veld;
 * pas in het laatste veld gaat het scherm door.
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
    const aanraak = matchMedia('(pointer: coarse)').matches;
    const tekstvelden = (formulier) => [...formulier.querySelectorAll('input[type="text"]')].filter((v) => v.offsetParent !== null);

    // Het toetsenbord van een telefoon toont wat Enter doet: verder naar het
    // volgende veld, of klaar met dit scherm.
    for (const formulier of wortel.querySelectorAll('form[data-scherm]')) {
        const velden = [...formulier.querySelectorAll('input[type="text"]')];
        velden.forEach((v, i) => { v.enterKeyHint = i === velden.length - 1 ? 'done' : 'next'; });
    }
    // Velden die pas later verschijnen of verdwijnen (een aangevinkte post): bij focus opnieuw.
    wortel.addEventListener('focusin', (e) => {
        const formulier = e.target.closest?.('form[data-scherm]');
        if (!formulier || !e.target.matches('input[type="text"]')) return;
        e.target.enterKeyHint = tekstvelden(formulier).at(-1) === e.target ? 'done' : 'next';
    });
    wortel.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || !e.target.matches?.('input[type="text"]')) return;
        const formulier = e.target.closest('form[data-scherm]');
        if (!formulier) return;
        const velden = tekstvelden(formulier);
        const volgende = velden[velden.indexOf(e.target) + 1];
        if (!volgende) return;   // het laatste veld: Enter verstuurt het scherm
        e.preventDefault();
        volgende.focus();
    });

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
            const titel = scherm?.querySelector('h2');
            if (titel) titel.tabIndex = -1;
            const veld = scherm?.querySelector('input:not([type=radio]):not([type=range]):not([type=checkbox])') ?? scherm?.querySelector('input');
            ((aanraak ? titel : veld) ?? titel ?? kop).focus({ preventScroll: true });
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
