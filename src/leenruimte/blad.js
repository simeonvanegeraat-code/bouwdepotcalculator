/**
 * De leenruimte als Excel-werkblad: dezelfde stappen als "Zo is het gerekend",
 * met formules, zodat de bezoeker zelf kan variëren. Werkt in de browser en in
 * Node; zo kan het bestand buiten de pagina in Excel worden nagerekend.
 *
 * De formules volgen src/domain/leenruimte.js. Het percentage is een vaste
 * waarde: het hoort bij inkomen en toetsrente, en de tabel uit de wet staat
 * niet in het werkblad.
 */

import { STIJL } from '../js/xlsx.js';
import { BRON } from '../domain/trhk-2026.js';

/**
 * @param {object} invoer  wat berekenLeenruimte kreeg
 * @param {object} u       wat berekenLeenruimte teruggaf
 */
export function leenruimteBlad(invoer, u) {
    const inv = (w) => ({ w, s: STIJL.invoer });
    const rijen = [
        [{ w: 'Leenruimte voor je verbouwing', s: STIJL.titel }],
        [{ w: 'Gemaakt op bouwdepotcalculator.nl/leenruimte.html. Gele cellen en de twee percentages kun je aanpassen. Het percentage hoort bij inkomen en toetsrente: verander je die, zoek het dan opnieuw op in de wet.', s: STIJL.zacht }],
        [],
        [{ w: 'Invoer', s: STIJL.kop }, { w: '', s: STIJL.kop }],
        ['Toetsinkomen (samen)', inv(u.toetsinkomen)],                                                // B5
        ['Toetsrente, in procenten', u.toetsrente],                                                    // B6
        ['Financieringslastpercentage uit de wet, in procenten', Math.round(u.percentage * 1000) / 10],  // B7
        ['Studieschuld per maand, gebruteerd', inv(Math.round(u.studieschuld.gebruteerd * 100) / 100)], // B8
        ['Ruimte die de bank mag geven (label, verduurzamen, alleenstaand)', inv(u.erbij.totaal)],     // B9
        ['Woningwaarde na verbouwing', inv(invoer.waarde)],                                            // B10
        ['Energiebesparend, tot 106%', inv(u.waarde.energiebesparend)],                                // B11
        ['Huidige hypotheek', inv(invoer.hypotheek)],                                                  // B12
        ['Kosten van de verbouwing', inv(invoer.verbouwing)],                                          // B13
        [],
        [{ w: 'Uitkomst', s: STIJL.kop }, { w: '', s: STIJL.kop }],
        ['Toegestane last per maand', { f: 'MAX(0,B5*B7/100/12-B8)', s: STIJL.euro }],                 // B16
        ['Te lenen met die last, 30 jaar', { f: 'IF(B16>0,PV(B6/100/12,360,-B16),0)', s: STIJL.euro }], // B17
        ['Maximale hypotheek op inkomen', { f: 'B17+B9', s: STIJL.euro }],                              // B18
        ['Maximale hypotheek op woningwaarde', { f: 'B10+B11', s: STIJL.euro }],                        // B19
        ['Maximale hypotheek', { f: 'MIN(B18,B19)', s: STIJL.euroVet }],                                // B20
        ['Extra te lenen', { f: 'MAX(0,B20-B12)', s: STIJL.euroVet }],                                  // B21
        ['Voor de verbouwing', { f: 'MIN(B21,B13)', s: STIJL.euroVet }],                                // B22
        ['Eigen geld nodig', { f: 'B13-B22', s: STIJL.euro }],                                          // B23
        [],
        [{ w: `Bron: Tijdelijke regeling hypothecair krediet, versie 1 januari 2026, ${BRON}. Een indicatie, geen toezegging.`, s: STIJL.zacht }],
    ];
    return { naam: 'Leenruimte', breedtes: [60, 18], rijen };
}
