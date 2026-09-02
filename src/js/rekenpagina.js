/**
 * Wat elke rekenpagina deelt.
 *
 * `main.js` bediende zes pagina's uit één bestand van bijna tweeduizend regels.
 * Elke pagina laadde daardoor ook de code van de vijf andere: wie de
 * maandlasten uitrekent haalde het termijnschema van de nieuwbouwpagina en de
 * fiscale regels van de belastingpagina mee binnen. Dat kost laadtijd op elke
 * pagina, en laadtijd is hier geen bijzaak — het verdienmodel hangt eraan.
 *
 * De pagina's verhuizen daarom één voor één naar een eigen module. Wat ze
 * werkelijk delen staat hier, en niet meer dan dat.
 */
import { initSharedFormMemory } from './shared-form-memory';
import { koppelBedragvelden, koppelPercentagevelden } from './getallen.js';

/**
 * Koppelt een printknop aan het rapport.
 *
 * `reporting.js` zet `window.BouwdepotReporting` en wordt op elke rekenpagina
 * vóór de rekenmodule geladen. Ontbreekt hij toch, dan valt de knop terug op
 * het printvenster van de browser: liever een ruwe afdruk dan een knop die
 * niets doet.
 */
export function bindReportButton(button, options = {}) {
    if (!button) return;
    const toolkit = window.BouwdepotReporting || null;
    if (toolkit?.registerReportButton) {
        toolkit.registerReportButton(button, options);
        return;
    }
    button.addEventListener('click', () => window.print());
}

/**
 * Start een rekenpagina zodra de HTML er staat.
 *
 * Het gedeelde geheugen vult eerst de onthouden waarden in; pas daarna rekent
 * de pagina. Andersom zou de eerste uitkomst over lege velden gaan en meteen
 * daarna verspringen.
 */
export function startRekenpagina(init) {
    document.addEventListener('DOMContentLoaded', () => {
        initSharedFormMemory();
        init();
        // Ná init: die vult velden met onthouden of berekende waarden, en pas
        // daarna is er iets om op te maken.
        koppelBedragvelden();
        koppelPercentagevelden();
    });
}
