/**
 * De grafiek bij het doorgerekende voorbeeld op de nieuwbouwpagina.
 *
 * De tekst en de tabel van het voorbeeld staan in nieuwbouw.html zelf, zodat ze
 * er ook zonder JavaScript zijn; tests/nieuwbouw-voorbeeld.test.mjs rekent ze
 * na. Dit bestand tekent er alleen de grafiek bij: met de standaardinvoer van
 * de rekenkern en dezelfde tekenfunctie als de uitkomst van de rekentool, dus
 * met dezelfde maandregels als de tabel.
 */

import { berekenTijdlijn } from '../domain/nieuwbouw.js';
import { tekenTijdlijn } from './grafiek.js';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const houder = document.getElementById('vb-grafiek');

if (houder) {
    const t = berekenTijdlijn();
    const bouw = t.regels.filter((r) => r.fase === 'bouw');
    const gegevens = {
        regels: t.regels, piek: t.piek, oplevermaand: t.oplevermaand, eindeOverlap: t.eindeOverlap,
        omschrijving: `Voorbeeld als staafgrafiek: de bruto maandlast loopt op van ${euro.format(bouw[0].totaal)} in bouwmaand 1 `
            + `naar ${euro.format(bouw.at(-1).totaal)} bij oplevering, is het hoogst in maand ${t.piek.maand} met ${euro.format(t.piek.totaal)} `
            + `en zakt naar ${euro.format(t.maandlastDaarna)} als de huur stopt.`,
    };
    const teken = () => tekenTijdlijn(houder, gegevens);
    teken();

    // Getekend op de werkelijke breedte. Op het overzicht is de sectie verborgen;
    // komt ze terug, dan verandert de breedte en tekent dit opnieuw.
    if ('ResizeObserver' in window) {
        let breedte = 0;
        new ResizeObserver(([item]) => {
            const nieuw = Math.round(item.contentRect.width);
            if (nieuw === breedte || nieuw === 0) return;
            breedte = nieuw;
            teken();
        }).observe(houder);
    }
}
