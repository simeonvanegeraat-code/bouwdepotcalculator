/**
 * Het voorbeeldscenario op de homepage.
 *
 * Eén scenario, één keer uitgerekend, zodat de tekst, de kolommen en de tabel
 * dezelfde bedragen laten zien en geen ervan een getal verzint. De berekening
 * is die van de nieuwbouwpagina (src/domain/nieuwbouw.js) met de standaardinvoer
 * van die pagina: wie doorklikt ziet daar dezelfde uitkomst terug.
 *
 * Dit bestand voegt alleen toe wat de homepage nodig heeft om er een tijdlijn
 * van te maken: drie maanden vooraf met alleen de huidige woonlast, en labels
 * per maand. Alle bedragen zijn bruto: er zit geen hypotheekrenteaftrek in.
 */

import { berekenTijdlijn, STANDAARD } from '../domain/nieuwbouw.js';

export const AANNAMES = Object.freeze({ ...STANDAARD, maandenVooraf: 3, maandenNa: 3 });

export function voorbeeldTijdlijn() {
    const a = AANNAMES;
    const tijdlijn = berekenTijdlijn({ horizonMaanden: a.bouwduurMaanden + a.maandenNa });

    const regels = [];
    for (let i = a.maandenVooraf; i >= 1; i--) {
        regels.push({ fase: 'voor', bouwmaand: null, label: `${i} mnd vooraf`, depot: null, vergoeding: 0, hypotheek: 0, woonlast: a.huidigeWoonlast, totaal: a.huidigeWoonlast });
    }
    let piek = null;
    for (const r of tijdlijn.regels) {
        const inBouw = r.fase === 'bouw';
        const regel = {
            // De homepage kent drie fasen; de maanden met nog dubbele lasten na
            // oplevering horen daar bij "na".
            fase: inBouw ? 'bouw' : 'na',
            bouwmaand: inBouw ? r.maand : null,
            label: inBouw ? `Bouwmaand ${r.maand}` : `${r.maand - tijdlijn.oplevermaand} mnd na oplevering`,
            depot: r.depot, vergoeding: r.vergoeding, hypotheek: r.hypotheek, woonlast: r.woonlast, totaal: r.totaal,
        };
        if (r === tijdlijn.piek) piek = regel;
        regels.push(regel);
    }

    return { lening: tijdlijn.lening, annuiteit: tijdlijn.maandlastDaarna, regels, piek, aannames: a };
}

export const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
