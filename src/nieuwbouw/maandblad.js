/**
 * De nieuwbouwplanning als werkblad voor Excel: de invoer waarmee is gerekend
 * en de maandtabel, met een totaalregel die Excel zelf optelt.
 *
 * Het blad wordt gevuld uit hetzelfde rapport als het afdrukoverzicht
 * (pagina.js zet dat klaar bij elke berekening), dus scherm, afdruk en Excel
 * tonen dezelfde maandregels. Hier wordt niets uitgerekend.
 */

import { STIJL, kolom } from '../js/xlsx.js';

/**
 * @param {object} rapport            wat pagina.js voor het afdrukoverzicht klaarzet
 * @param {{columns: {key: string, label: string, type: string}[], rows: object[]}} rapport.tabel
 * @param {string} rapport.toelichting
 * @param {[string, string][]} invoer  de regels van "Jouw invoer": naam en waarde als tekst
 * @param {object} [kop]               titel en bronpagina; standaard die van nieuwbouw
 */
export function maandblad({ tabel, toelichting }, invoer, { titel = 'Nieuwbouw: je maandlast, maand voor maand', pagina = 'nieuwbouw.html', blad = 'Nieuwbouwplanning' } = {}) {
    const rijen = [
        [{ w: titel, s: STIJL.titel }],
        [{ w: `Bruto, zonder hypotheekrenteaftrek. Gemaakt met bouwdepotcalculator.nl/${pagina}`, s: STIJL.zacht }],
        [],
        [{ w: 'Jouw invoer', s: STIJL.kop }, { w: '', s: STIJL.kop }],
        ...invoer.map(([naam, waarde]) => [naam, waarde]),
        [],
        tabel.columns.map((k) => ({ w: k.label, s: STIJL.kop })),
    ];
    const eerste = rijen.length + 1;
    for (const rij of tabel.rows) {
        rijen.push(tabel.columns.map((k) => (k.type === 'currency' ? { w: Math.round(rij[k.key]), s: STIJL.euro } : rij[k.key])));
    }
    const laatste = rijen.length;
    // Een saldo optellen heeft geen betekenis: het depot krijgt geen totaal.
    rijen.push(tabel.columns.map((k, i) => {
        if (i === 0) return { w: 'Totaal', s: STIJL.vet };
        if (k.type !== 'currency' || k.key === 'depot') return null;
        return { f: `SUM(${kolom(i)}${eerste}:${kolom(i)}${laatste})`, s: STIJL.euroVet };
    }));
    rijen.push([], [{ w: toelichting, s: STIJL.zacht }]);
    return { naam: blad, breedtes: [34, ...tabel.columns.slice(1).map(() => 20)], rijen, vast: 0, eersteMaandrij: eerste, laatsteMaandrij: laatste };
}
