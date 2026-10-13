/**
 * De verbouwbegroting als werkblad voor Excel.
 *
 * Eén opbouw voor twee bestanden: het lege template dat de generator maakt
 * (public/downloads/verbouwbegroting-template.xlsx) en het ingevulde bestand
 * dat de pagina maakt van wat de bezoeker heeft ingevuld. Het blad rekent zelf
 * door: wie er een bedrag in wijzigt, ziet de totalen meebewegen.
 *
 * De formules volgen src/js/begrotingrekenen.js: de reserve is een percentage
 * van het deel dat uit het depot komt, afgerond op hele euro's, en telt bij
 * het depotdeel. Een test rekent het blad na tegen die rekenkern.
 */

import { STIJL } from '../js/xlsx.js';

export const UIT_DEPOT = 'Bouwdepot';
export const UIT_EIGEN = 'Eigen geld';
const LEGE_REGELS = 5;

/**
 * @param {{naam: string, posten: {id: string, naam: string, vastAanWoning: boolean}[]}[]} categorieen
 * @param {object} [invoer]
 * @param {Record<string, {bedrag: number, prioriteit?: string}>} [invoer.posten]  per post-id
 * @param {{naam: string, bedrag: number, vast: boolean, prioriteit?: string}[]} [invoer.eigen]  eigen posten
 * @param {number} [invoer.reservePct]  reserve voor onvoorzien, in procenten
 * @returns {{naam: string, breedtes: number[], rijen: Array<Array>, vast: number, cellen: object}}
 */
export function begrotingsblad(categorieen, { posten = {}, eigen = [], reservePct = 10 } = {}) {
    const rijen = [
        [{ w: 'Verbouwbegroting', s: STIJL.titel }],
        [{ w: 'Vul in kolom D je bedragen in; de totalen onderaan rekenen mee. Gemaakt met bouwdepotcalculator.nl/verbouwbegroting.html', s: STIJL.zacht }],
        [],
        ['Post', 'Betaald uit', 'Prioriteit', 'Bedrag'].map((w) => ({ w, s: STIJL.kop })),
    ];
    const eerste = rijen.length + 1;
    const prio = (p) => (p === 'gewenst' ? 'Gewenst' : 'Noodzakelijk');

    for (const c of categorieen) {
        rijen.push([{ w: c.naam, s: STIJL.vet }]);
        for (const p of c.posten) {
            const v = posten[p.id];
            rijen.push([p.naam, p.vastAanWoning ? UIT_DEPOT : UIT_EIGEN, prio(v?.prioriteit), { w: v?.bedrag > 0 ? v.bedrag : null, s: STIJL.invoer }]);
        }
    }
    // Eigen posten, en lege regels om er zelf bij te zetten. Wie in kolom B
    // "Eigen geld" typt, haalt de post uit het depotdeel.
    rijen.push([{ w: 'Eigen posten', s: STIJL.vet }]);
    for (const e of eigen) rijen.push([e.naam, e.vast ? UIT_DEPOT : UIT_EIGEN, prio(e.prioriteit), { w: e.bedrag > 0 ? e.bedrag : null, s: STIJL.invoer }]);
    for (let i = 0; i < LEGE_REGELS; i++) rijen.push(['', UIT_DEPOT, 'Noodzakelijk', { w: null, s: STIJL.invoer }]);
    const laatste = rijen.length;

    const b = `$B$${eerste}:$B$${laatste}`, d = `$D$${eerste}:$D$${laatste}`, c = `$C$${eerste}:$C$${laatste}`;
    rijen.push([]);
    const r = rijen.length + 1;   // de eerste totaalregel
    const cellen = { depot: `D${r}`, reservePct: `D${r + 1}`, reserve: `D${r + 2}`, depotMetReserve: `D${r + 3}`, eigen: `D${r + 4}`, totaal: `D${r + 5}`, noodzakelijk: `D${r + 7}`, gewenst: `D${r + 8}` };
    rijen.push(
        ['Posten uit het bouwdepot', '', '', { f: `SUMIF(${b},"${UIT_DEPOT}",${d})`, s: STIJL.euro }],
        ['Reserve voor onvoorzien, over het depotdeel', '', '', { w: reservePct / 100, s: STIJL.procent }],
        ['Reserve in euro', '', '', { f: `ROUND(${cellen.depot}*${cellen.reservePct},0)`, s: STIJL.euro }],
        [{ w: 'Uit het bouwdepot, met reserve', s: STIJL.vet }, '', '', { f: `${cellen.depot}+${cellen.reserve}`, s: STIJL.euroVet }],
        [{ w: 'Uit eigen geld', s: STIJL.vet }, '', '', { f: `SUMIF(${b},"${UIT_EIGEN}",${d})`, s: STIJL.euroVet }],
        [{ w: 'Totale verbouwkosten', s: STIJL.kop }, { w: '', s: STIJL.kop }, { w: '', s: STIJL.kop }, { f: `${cellen.depotMetReserve}+${cellen.eigen}`, s: STIJL.euroVet }],
        [],
        ['Waarvan noodzakelijk', '', '', { f: `SUMIF(${c},"Noodzakelijk",${d})`, s: STIJL.euro }],
        ['Waarvan gewenst', '', '', { f: `SUMIF(${c},"Gewenst",${d})`, s: STIJL.euro }],
        [],
        [{ w: 'De kolom "Betaald uit" volgt de vuistregel van vrijwel elke geldverstrekker: wat vast aan de woning zit mag meestal uit het bouwdepot, losse spullen niet. Het is een indicatie en geen toezegging; je geldverstrekker beoordeelt je eigen verbouwingsplan.', s: STIJL.zacht }],
    );
    return { naam: 'Verbouwbegroting', breedtes: [58, 16, 16, 16], rijen, vast: 4, cellen };
}
