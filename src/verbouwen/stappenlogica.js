/**
 * De regels achter het stap voor stap invullen op verbouwbegroting.html, zonder DOM.
 *
 * De stappen rekenen niets uit: wat hier doorheen komt gaat naar de velden van
 * de begroting en de leenruimte, en daar rekent src/verbouwen/pagina.js mee.
 * De grenzen zijn die van dat formulier.
 */

const getal = (w) => typeof w === 'number' && Number.isFinite(w);
const MAX_PER_POST = 5000000;

/**
 * Welke schermen er komen, in volgorde: wat ga je doen, dan per gekozen
 * categorie de bedragen, dan reserve, financiering en rente.
 *
 * @param {string[]} categorieen  alle categorieën, in de volgorde van de pagina
 * @param {string[]} gekozen      wat de bezoeker heeft aangevinkt
 */
export function schermvolgorde(categorieen, gekozen) {
    return ['wat', ...categorieen.filter((c) => gekozen.includes(c)).map((c) => `cat-${c}`), 'reserve', 'geld', 'rente'];
}

/** Het scherm na dit scherm, of 'klaar' na het laatste. */
export function volgende(volgorde, nu) {
    const i = volgorde.indexOf(nu);
    return i === -1 ? volgorde[0] : volgorde[i + 1] ?? 'klaar';
}

/** Het scherm vóór dit scherm, of 'start' vóór het eerste. */
export function vorige(volgorde, nu) {
    const i = volgorde.indexOf(nu);
    return i <= 0 ? 'start' : volgorde[i - 1];
}

/** Hoe ver je bent, van 0 tot 1; het laatste scherm is nog niet klaar. */
export function voortgang(volgorde, nu) {
    const i = volgorde.indexOf(nu);
    return i === -1 ? 0 : (i + 1) / (volgorde.length + 1);
}

/**
 * De posten van één categorie: wat is aangevinkt moet een bedrag hebben.
 * @param {{naam: string, gekozen: boolean, bedrag: number|null}[]} posten
 * @returns {string} lege tekst als het scherm door mag
 */
export function controleerPosten(posten) {
    for (const p of posten) {
        if (!p.gekozen) continue;
        if (!getal(p.bedrag) || p.bedrag <= 0) return `Vul een bedrag in bij "${p.naam}", of vink het uit.`;
        if (p.bedrag > MAX_PER_POST) return `Het bedrag bij "${p.naam}" is hoger dan waar deze tool mee rekent; controleer het.`;
    }
    return '';
}

/** De reserve voor onvoorzien: een percentage van 0 tot 30. */
export function controleerReserve(percent) {
    if (!getal(percent) || percent < 0) return 'Vul een percentage in, of nul als je geen reserve aanhoudt.';
    if (percent > 30) return 'Boven de 30 procent is het geen reserve meer; controleer het percentage.';
    return '';
}

/** Hypotheek, woningwaarde en eigen geld; een leeg veld bij hypotheek of eigen geld is nul. */
export function controleerGeld({ hypotheek, waarde, eigen }) {
    if (!getal(hypotheek) || hypotheek < 0) return 'Vul je huidige hypotheek in, of laat het veld leeg als je die niet hebt.';
    if (hypotheek > 5000000) return 'Deze hypotheek is hoger dan waar deze tool mee rekent; controleer het bedrag.';
    if (!getal(waarde) || waarde <= 0) return 'Vul in wat je woning na de verbouwing waard is.';
    if (waarde > 5000000) return 'Deze woningwaarde is hoger dan waar deze tool mee rekent; controleer het bedrag.';
    if (!getal(eigen) || eigen < 0) return 'Vul je eigen geld in, of laat het veld leeg als je alles leent.';
    if (eigen > 1000000) return 'Dit eigen geld is hoger dan waar deze tool mee rekent; controleer het bedrag.';
    return '';
}

export function controleerRente(rente) {
    if (!getal(rente) || rente < 0) return 'Vul een hypotheekrente in, bijvoorbeeld 3,8.';
    if (rente > 20) return 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.';
    return '';
}
