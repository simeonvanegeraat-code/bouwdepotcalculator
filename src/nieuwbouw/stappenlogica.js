/**
 * De regels achter het stap voor stap invullen op nieuwbouw.html, zonder DOM.
 *
 * De stappen vragen een handvol gegevens. Ze rekenen zelf niets uit: na elke stap
 * gaan de waarden naar het formulier van de rekentool, en die rekent zoals
 * altijd (src/domain/nieuwbouw.js). Wat hier staat is alleen: mag deze stap
 * door, en hoe bewaar je de invoer in een link.
 *
 * De link bevat de ingevulde bedragen. Dat is bewust: zo kun je hem bewaren of
 * doorsturen zonder dat er iets op een server staat.
 */

import { controleerSchema } from '../domain/nieuwbouw.js';

/** Onthoudt dat iemand de stappen al heeft doorlopen; die komt direct bij het overzicht. */
export const SLEUTEL = 'bouwdepot-nieuwbouw-stappen-v1';

export const STANDAARD = Object.freeze({ meerwerk: 0, vorm: 'annuiteit', maanden: 12, overlap: 2 });

const getal = (w) => typeof w === 'number' && Number.isFinite(w);

/** De vijf vragen: wat koop je, hoeveel leen je, welke hypotheek, hoe lang duurt de bouw, waar woon je nu. */
export const STAPPEN = Object.freeze([1, 2, 3, 4, 5]);

/**
 * @param {1|2|3|4|5} stap
 * @param {object} w  wat er tot nu toe is ingevuld; een leeg veld is null
 * @returns {string} lege tekst als de stap door mag, anders wat er mis is
 */
export function controleerStap(stap, w) {
    if (stap === 1) {
        if (!getal(w.von) || w.von <= 0) return 'Vul de koopsom van grond en woning samen in.';
        if (w.von > 5000000) return 'Boven vijf miljoen euro rekent deze tool niet; controleer het bedrag.';
        if (!getal(w.grond) || w.grond < 0) return 'Vul in welk deel daarvan de grond is. Heb je de grond al, vul dan 0 in.';
        if (w.grond >= w.von) return 'De grond kan niet evenveel of meer kosten dan de hele koopsom.';
        return '';
    }
    if (stap === 2) {
        if (!getal(w.meerwerk) || w.meerwerk < 0) return 'Vul het meerwerk in dat je meefinanciert, of laat het veld leeg.';
        if (w.meerwerk > 1000000) return 'Boven een miljoen euro meerwerk rekent deze tool niet; controleer het bedrag.';
        if (!getal(w.eigen) || w.eigen < 0) return 'Vul je eigen geld in. Leen je alles, vul dan 0 in.';
        if (getal(w.von) && w.eigen > w.von + w.meerwerk) return 'Je eigen geld is hoger dan koopsom en meerwerk samen; controleer het bedrag.';
        return '';
    }
    if (stap === 3) {
        if (!getal(w.rente) || w.rente < 0) return 'Vul je hypotheekrente in, bijvoorbeeld 3,8.';
        if (w.rente > 20) return 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.';
        if (w.vorm !== 'annuiteit' && w.vorm !== 'lineair') return 'Kies annuïtair of lineair.';
        return '';
    }
    if (stap === 4) {
        if (!getal(w.maanden) || !Number.isInteger(w.maanden) || w.maanden < 1) return 'Vul in hoeveel hele maanden de bouw duurt.';
        if (w.maanden > 36) return 'Deze rekentool rekent met bouwduren tot 36 maanden.';
        return '';
    }
    if (stap === 5) {
        if (!getal(w.woonlast) || w.woonlast < 0) return 'Vul je huidige woonlast in. Betaal je niets, vul dan 0 in.';
        if (w.woonlast > 100000) return 'Boven de honderdduizend euro per maand rekent deze tool niet.';
        if (!getal(w.overlap) || !Number.isInteger(w.overlap) || w.overlap < 0 || w.overlap > 12) return 'Vul in hoeveel maanden dat doorloopt, van 0 tot 12.';
        return '';
    }
    throw new Error(`onbekende stap: ${stap}`);
}

/** De eerste stap die niet door mag, of 0 als alles klopt. */
export const eersteOpenStap = (w) => STAPPEN.find((s) => controleerStap(s, w)) ?? 0;

// De laatste drie staan niet in de stappen maar onder "Meer instellingen" op het
// overzicht. Ze gaan mee in de link als ze van de standaard afwijken, anders
// zou een bewaarde link een ander bedrag geven dan het scherm waar hij vandaan komt.
const VOLGORDE = ['von', 'grond', 'meerwerk', 'eigen', 'rente', 'vorm', 'maanden', 'woonlast', 'overlap', 'depot', 'afslag', 'mee'];

/** De invoer als het deel van een adres na het vraagteken. */
export function naarAdres(w) {
    return VOLGORDE.filter((k) => w[k] !== null && w[k] !== undefined).map((k) => `${k}=${encodeURIComponent(String(w[k]))}`).join('&');
}

/**
 * Leest de invoer terug uit een adres. Geeft null als er geen bruikbare
 * koopsom in staat, of als wat er staat niet door de stappen zou komen: een
 * link met onzin moet geen uitkomst opleveren.
 */
export function uitAdres(zoek) {
    const p = new URLSearchParams(zoek);
    if (!p.has('von')) return null;
    const n = (k, anders) => {
        if (!p.has(k) || p.get(k).trim() === '') return anders;
        const x = Number(p.get(k));
        return Number.isFinite(x) ? x : NaN;
    };
    const w = {
        von: n('von', NaN), grond: n('grond', NaN), meerwerk: n('meerwerk', STANDAARD.meerwerk), eigen: n('eigen', 0),
        rente: n('rente', NaN), vorm: p.get('vorm') === 'lineair' ? 'lineair' : STANDAARD.vorm,
        maanden: n('maanden', STANDAARD.maanden), woonlast: n('woonlast', 0), overlap: n('overlap', STANDAARD.overlap),
    };
    if (p.has('depot')) {
        if (!['gelijk', 'lager', 'geen'].includes(p.get('depot'))) return null;
        w.depot = p.get('depot');
    }
    if (w.depot === 'lager') {
        w.afslag = n('afslag', NaN);
        if (!getal(w.afslag) || w.afslag < 0 || w.afslag > 20) return null;
    }
    if (p.get('mee') === 'mee') w.mee = 'mee';
    return eersteOpenStap(w) === 0 ? w : null;
}

/** Hoe lang de invoer op het apparaat blijft staan; gelijk aan de rest van de site. */
export const BEWAARTERMIJN_MS = 90 * 24 * 60 * 60 * 1000;

/* ------------------------------ het termijnschema ------------------------------ */

export const MAX_TERMIJNEN = 30;

/** Het totaal van wat er is ingevuld, en wat er nog ontbreekt (negatief: te veel). Lege regels tellen als nul. */
export function schemaTotaal(rijen) {
    const { totaal } = controleerSchema(rijen.map((r) => ({ ...r, percent: getal(r.percent) ? r.percent : 0 })), Infinity);
    return { totaal, rest: Math.round((100 - totaal) * 10) / 10 };
}

/**
 * Mag dit schema naar de rekentool? Eerst per termijn wat er ontbreekt, dan
 * de regels van de rekenkern zelf (samen 100%, niets na de oplevering).
 *
 * @param {{naam: string, maand: number|null, percent: number|null}[]} rijen
 * @param {number} bouwduur  in maanden
 * @returns {string} lege tekst als het mag, anders wat er mis is
 */
export function controleerTermijnen(rijen, bouwduur) {
    if (rijen.length === 0) return 'Voeg minstens één termijn toe.';
    if (rijen.length > MAX_TERMIJNEN) return `Deze rekentool rekent met hooguit ${MAX_TERMIJNEN} termijnen.`;
    for (const [i, r] of rijen.entries()) {
        if (!getal(r.maand) || !Number.isInteger(r.maand) || r.maand < 0) return `Termijn ${i + 1}: vul de bouwmaand in, van 0 tot ${bouwduur}.`;
        if (!getal(r.percent) || r.percent <= 0) return `Termijn ${i + 1}: vul in welk deel van de aanneemsom dit is.`;
    }
    return controleerSchema(rijen, bouwduur).klachten[0] ?? '';
}

const geld = (n) => `€ ${Math.round(n).toLocaleString('nl-NL')}`;

/**
 * Wat het schemascherm vraagt, omgezet naar de termijnen van de rekentool.
 *
 * Het scherm werkt zoals de aannemingsovereenkomst: percentages van de
 * aanneemsom zonder meerwerk (`basis`). De rekentool kent één aanneemsom
 * waar het meefinancierde meerwerk in zit, en een percentage per termijn
 * daarvan. Loopt het meerwerk met de termijnen mee, dan zijn de percentages
 * gelijk: 15% van de basis plus 15% van het meerwerk is 15% van het geheel.
 * Wordt het apart betaald, dan krimpen de termijnen naar hun aandeel in het
 * geheel en komt elk betaalmoment van het meerwerk er als eigen termijn bij.
 *
 * @param {object} m
 * @param {{naam: string, maand: number|null, percent: number|null}[]} m.rijen   percent van de basis
 * @param {boolean} m.apart                                                       meerwerk op eigen momenten
 * @param {{naam: string, maand: number|null, bedrag: number|null}[]} m.meerwerkRijen
 * @param {number} m.basis     aanneemsom zonder meerwerk, in euro
 * @param {number} m.meerwerk  meefinancierd meerwerk, in euro
 */
export function naarTermijnen({ rijen, apart, meerwerkRijen, basis, meerwerk }) {
    const los = apart && meerwerk > 0;
    const geheel = basis + (meerwerk > 0 ? meerwerk : 0);
    const aandeel = los && geheel > 0 ? basis / geheel : 1;
    const uit = rijen.map((r, i) => ({ maand: r.maand, percent: getal(r.percent) ? r.percent * aandeel : null, naam: r.naam.trim() || `Termijn ${i + 1}` }));
    if (los) {
        for (const r of meerwerkRijen) {
            uit.push({ maand: r.maand, percent: getal(r.bedrag) && geheel > 0 ? (r.bedrag / geheel) * 100 : null, naam: r.naam.trim() || 'Meerwerk', soort: 'meerwerk' });
        }
    }
    return uit;
}

/** Het omgekeerde: de termijnen van de rekentool terug naar wat het scherm toont. */
export function uitTermijnen(termijnen, basis, meerwerk) {
    const gewoon = termijnen.filter((t) => t.soort !== 'meerwerk');
    const los = termijnen.filter((t) => t.soort === 'meerwerk');
    if (los.length === 0) {
        return { apart: false, meerwerkRijen: [], rijen: gewoon.map((t) => ({ naam: t.naam ?? '', maand: t.maand, percent: t.percent })) };
    }
    // De gewone termijnen zijn samen de hele basis, ook als het meerwerk sindsdien is veranderd.
    const som = gewoon.reduce((s, t) => s + t.percent, 0);
    const geheel = basis + meerwerk;
    return {
        apart: meerwerk > 0,
        rijen: gewoon.map((t) => ({ naam: t.naam ?? '', maand: t.maand, percent: som > 0 ? (t.percent / som) * 100 : t.percent })),
        meerwerkRijen: meerwerk > 0 ? los.map((t) => ({ naam: t.naam === 'Meerwerk' ? '' : (t.naam ?? ''), maand: t.maand, bedrag: Math.round((t.percent / 100) * geheel) })) : [],
    };
}

/**
 * Mag wat er op het schemascherm staat naar de rekentool?
 * @returns {string} lege tekst als het mag, anders wat er mis is
 */
export function controleerSchemaInvoer(m, bouwduur) {
    const fout = controleerTermijnen(m.rijen, bouwduur);
    if (fout) return fout;
    if (!(m.apart && m.meerwerk > 0)) return '';
    if (m.meerwerkRijen.length === 0) return 'Vul in wanneer je het meerwerk betaalt, of kies "Met de termijnen mee".';
    if (m.rijen.length + m.meerwerkRijen.length > MAX_TERMIJNEN) return `Deze rekentool rekent met hooguit ${MAX_TERMIJNEN} termijnen.`;
    for (const [i, r] of m.meerwerkRijen.entries()) {
        if (!getal(r.maand) || !Number.isInteger(r.maand) || r.maand < 0 || r.maand > bouwduur) return `Meerwerk ${i + 1}: vul de bouwmaand in, van 0 tot ${bouwduur}.`;
        if (!getal(r.bedrag) || r.bedrag <= 0) return `Meerwerk ${i + 1}: vul het bedrag in.`;
    }
    const som = m.meerwerkRijen.reduce((s, r) => s + r.bedrag, 0);
    if (Math.abs(som - m.meerwerk) > 1) return `Het meerwerk telt op tot ${geld(som)}, terwijl je ${geld(m.meerwerk)} meefinanciert.`;
    return '';
}

/** Een bewaard schema teruglezen; null als het geen bruikbaar schema is. */
export function leesSchema(ruw) {
    if (!Array.isArray(ruw) || ruw.length === 0 || ruw.length > MAX_TERMIJNEN) return null;
    const schema = [];
    for (const t of ruw) {
        if (!t || typeof t !== 'object' || !getal(t.maand) || !Number.isInteger(t.maand) || t.maand < 0 || t.maand > 36) return null;
        if (!getal(t.percent) || t.percent < 0 || t.percent > 100) return null;
        schema.push({ maand: t.maand, percent: t.percent, naam: typeof t.naam === 'string' ? t.naam.slice(0, 60) : '', ...(t.soort === 'meerwerk' ? { soort: 'meerwerk' } : {}) });
    }
    return schema;
}

/**
 * Wat er in de lokale opslag komt: de invoer als adres, wanneer, en het eigen
 * termijnschema als dat er is. Het schema gaat niet mee in een gekopieerde link.
 */
export const bewaarTekst = (w, nu, schema = null) => JSON.stringify({ adres: naarAdres(w), op: nu, ...(schema ? { schema } : {}) });

/** Leest de opslag terug; null als er niets bruikbaars staat of het te oud is. */
export function leesBewaard(tekst, nu) {
    try {
        const { adres, op, schema } = JSON.parse(tekst);
        if (typeof adres !== 'string' || typeof op !== 'number' || nu - op > BEWAARTERMIJN_MS || op > nu + 60000) return null;
        const w = uitAdres(adres);
        const eigen = w ? leesSchema(schema) : null;
        // Een schema dat niet meer bij de bouwduur past, of niet optelt, laten we vallen.
        if (eigen && controleerTermijnen(eigen, w.maanden) === '') w.schema = eigen;
        return w;
    } catch {
        return null;
    }
}

