/**
 * Het huis naast het stappenplan, dat meegroeit met wat je afvinkt.
 *
 * Achttien punten, van begroting tot archief. Met elk punt zakt er een stuk van
 * het huis op zijn plek: fundering, twee bouwlagen, dak, ramen, en bij het
 * laatste punt gaan de lampen aan. Het is dezelfde scene als op de
 * verbouwpagina (src/verbouwen/huis3d.js); hier stuurt de lijst hem aan in
 * plaats van de tijd.
 *
 * Het huis is versiering. Het staat er alleen op een breed scherm, en alleen
 * als 3D kan en mag: WebGL aanwezig, geen databesparing. Anders blijft het
 * figuur verborgen en verandert er niets aan de lijst. Three.js wordt pas
 * opgehaald als aan die voorwaarden is voldaan. Wie minder beweging wil, ziet
 * het huis wel, maar zonder dat de delen naar hun plek zweven.
 */

const BREED = '(min-width: 1000px)';
// De scene telt van 0 tot 4. Tot 0,6 staat er nog niets op de kavel; daar
// begint een lege lijst. Bij 4 is het huis af en branden de lampen.
const LEEG = 0.6, AF = 4;

const figuur = document.querySelector('[data-stappenhuis]');
const lijst = document.querySelector('[data-checklist="bouwdepot-stappenplan-v1"]');

if (figuur && lijst) {
    const sectie = figuur.closest('.ul-bouw');
    const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scene = null, bezig = false;

    const stand = () => {
        const vakjes = lijst.querySelectorAll('[data-plan-check]');
        const gedaan = lijst.querySelectorAll('[data-plan-check]:checked').length;
        return LEEG + (vakjes.length ? gedaan / vakjes.length : 0) * (AF - LEEG);
    };

    const magDrieD = () => {
        if (new URLSearchParams(location.search).has('geen3d')) return false;
        if (navigator.connection?.saveData) return false;
        try {
            const proef = document.createElement('canvas');
            return Boolean(proef.getContext('webgl2') || proef.getContext('webgl'));
        } catch {
            return false;
        }
    };

    const laad = async () => {
        if (scene || bezig || !matchMedia(BREED).matches || !magDrieD()) return;
        bezig = true;
        // Eerst de ruimte maken, dan pas laden: zo verspringt de lijst niet
        // nog een keer als de scene binnen is.
        figuur.hidden = false;
        sectie.classList.add('heeft-huis');
        try {
            const { maakScene } = await import('../verbouwen/huis3d.js');
            scene = maakScene(figuur.querySelector('[data-stappenhuis-canvas]'), figuur);
            scene.zetVoortgang(stand(), true);
            figuur.classList.add('is-3d');
        } catch (fout) {
            figuur.hidden = true;
            sectie.classList.remove('heeft-huis');
            console.warn('3D-huis niet geladen; het stappenplan werkt zonder.', fout);
        }
        bezig = false;
    };

    // checklist.js meldt elke verandering, ook "Opnieuw beginnen".
    lijst.addEventListener('checklist:stand', () => scene?.zetVoortgang(stand(), stil));

    laad();
    matchMedia(BREED).addEventListener('change', laad);
}
