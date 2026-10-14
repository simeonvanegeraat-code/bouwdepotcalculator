/**
 * De invoer van bouwdepot-berekenen.html in een link, en weer terug.
 *
 * Zo kan een bezoeker zijn berekening bewaren of doorsturen zonder dat er iets
 * op een server staat: de bedragen staan in de link zelf. De verbouwbegroting
 * linkt hierheen met alleen ?bedrag=; dat blijft werken.
 *
 * Pure functies, zonder DOM. De grenzen zijn die van het formulier.
 */

import { HYPOTHEEKVORMEN } from '../domain/hypotheek.js';
import { OPNAMEPATRONEN } from '../domain/bouwdepot.js';

const SOORTEN = ['gelijk', 'lager', 'geen'];
// Per sleutel in de link: binnen welke grenzen het getal moet liggen, en of het heel moet zijn.
const GETALLEN = {
    bedrag: [1, 1000000, false], rente: [0, 20, false], maanden: [1, 36, true], looptijd: [10, 30, true],
    afslag: [0, 20, false], stopt: [1, 36, true], woning: [0, 5000000, false], woonlast: [0, 100000, false],
};
const VOLGORDE = ['bedrag', 'rente', 'maanden', 'looptijd', 'vorm', 'soort', 'afslag', 'stopt', 'patroon', 'woning', 'woonlast'];

/** De invoer als het deel van een adres na het vraagteken; lege waarden blijven weg. */
export function naarAdres(w) {
    return VOLGORDE.filter((k) => w[k] !== null && w[k] !== undefined && w[k] !== '')
        .map((k) => `${k}=${encodeURIComponent(String(w[k]))}`).join('&');
}

/**
 * Leest de invoer terug. Geeft alleen wat er in de link staat; de pagina houdt
 * voor de rest haar eigen waarden. Geeft null als er geen bruikbaar bedrag in
 * staat, of als iets in de link niet klopt: een link met onzin moet geen
 * uitkomst opleveren die er geloofwaardig uitziet.
 */
export function uitAdres(zoek) {
    const p = new URLSearchParams(zoek);
    const bedrag = p.get('bedrag') ?? p.get('amount');   // "amount" gebruikte een oudere versie
    if (bedrag === null) return null;
    const w = {};
    for (const [k, [min, max, heel]] of Object.entries(GETALLEN)) {
        const ruw = k === 'bedrag' ? bedrag : p.get(k);
        if (ruw === null || ruw.trim() === '') continue;
        const n = Number(ruw);
        if (!Number.isFinite(n) || n < min || n > max || (heel && !Number.isInteger(n))) return null;
        w[k] = n;
    }
    if (!('bedrag' in w)) return null;
    for (const [k, toegestaan] of [['vorm', Object.keys(HYPOTHEEKVORMEN)], ['soort', SOORTEN], ['patroon', Object.keys(OPNAMEPATRONEN)]]) {
        if (!p.has(k)) continue;
        if (!toegestaan.includes(p.get(k))) return null;
        w[k] = p.get(k);
    }
    return w;
}
