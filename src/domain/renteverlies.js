/**
 * De rekenkern van renteverlies-bouwdepot.html: wat kost het geld dat nog in
 * het bouwdepot staat.
 *
 * Pure functies, zonder DOM.
 *
 * HET MODEL
 *
 *   Depot        het bedrag dat bij de start in depot staat. Het loopt in de
 *                bouwperiode leeg volgens het opnamepatroon (zie
 *                opnameTermijnen in bouwdepot.js).
 *   Rente        de hypotheekrente over het depotbedrag. Die valt elke maand in
 *                twee delen uiteen:
 *                  over wat al is opgenomen   dat is de prijs van lenen; die
 *                                             betaal je ook zonder depot
 *                  over wat nog stilstaat     daar staat nog niets tegenover
 *                Beide over het gemiddelde saldo van de maand.
 *   Vergoeding   wat de geldverstrekker over het stilstaande saldo vergoedt,
 *                zolang de vergoeding loopt.
 *   Renteverlies rente over het stilstaande saldo, min de vergoeding. Dit is
 *                het bedrag dat het depot kost bovenop gewoon lenen. Het
 *                ontstaat op twee manieren:
 *                  lager tarief   de vergoeding is lager dan de hypotheekrente
 *                  gestopt        de vergoeding loopt korter dan de bouw
 *
 *   Twee rekenmodellen van geldverstrekkers:
 *     'vergoeding'  rente over het hele depot, vergoeding over het saldo
 *     'opname'      alleen rente over wat is opgenomen, geen vergoeding
 *   In het tweede model kost stilstaand geld niets: het renteverlies is nul.
 *   Dat is dezelfde uitkomst als een vergoeding die gelijk is aan de
 *   hypotheekrente en de hele bouw doorloopt.
 *
 * WAAROM DIT ANDERS IS DAN DE VORIGE VERSIE
 *
 *   src/js/renteverlies.js noemde renteverlies "het nadeel van niet-opgenomen
 *   depotgeld" en zette het in het opnamemodel daarom op nul. In het
 *   vergoedingsmodel trok het echter de vergoeding af van de rente over het
 *   HELE depot, dus inclusief de rente over geld dat al was uitgegeven. Bij een
 *   vergoeding gelijk aan de hypotheekrente gaf dat een "verlies" van de halve
 *   rente, terwijl stilstaand geld dan niets kost. Hier staan de twee delen
 *   apart; wat je per saldo betaalt (rente min vergoeding) blijft zichtbaar.
 *
 * WAT HIER NIET IN ZIT
 *
 *   Aflossing (de rente wordt over het volle depotbedrag gerekend), rente per
 *   dag, belasting, en wat er gebeurt als de depottermijn zelf afloopt.
 */

import { opnameTermijnen } from './bouwdepot.js';

export const REKENMODELLEN = Object.freeze({
    vergoeding: 'Rente over het hele depot, met vergoeding',
    opname: 'Alleen rente over het opgenomen deel',
});

export const STANDAARD_RENTEVERLIES = Object.freeze({
    depot: 50000,
    rentePercent: 3.8,
    vergoedingPercent: 2.8,
    maanden: 12,
    vergoedingMaanden: 12,
    patroon: 'gelijk',
    model: 'vergoeding',
});

/**
 * @param {object} invoer  zie STANDAARD_RENTEVERLIES. Verwacht gecontroleerde
 *                         invoer; maanden een geheel getal >= 1.
 */
export function berekenRenteverlies(invoer = {}) {
    const a = { ...STANDAARD_RENTEVERLIES, ...invoer };
    if (!(a.model in REKENMODELLEN)) throw new Error(`onbekend rekenmodel: ${a.model}`);
    const metVergoeding = a.model === 'vergoeding';
    const r = a.rentePercent / 100 / 12;
    const v = metVergoeding ? a.vergoedingPercent / 100 / 12 : 0;
    // Langer vergoeden dan er geld staat kan niet.
    const vergoedingMaanden = metVergoeding ? Math.min(a.maanden, Math.max(0, a.vergoedingMaanden)) : 0;

    const regels = [];
    let saldo = a.depot;
    let doorTarief = 0, doorStop = 0;
    for (const termijn of opnameTermijnen(a.patroon, a.maanden)) {
        const opname = Math.min(saldo, (termijn.percent / 100) * a.depot);
        let eind = saldo - opname;
        if (eind < 1e-6) eind = 0;
        const gemiddeld = (saldo + eind) / 2;

        const renteOpgenomen = (a.depot - gemiddeld) * r;
        // In het opnamemodel rekent de geldverstrekker geen rente over het saldo.
        const renteStilstaand = metVergoeding ? gemiddeld * r : 0;
        const loopt = termijn.maand <= vergoedingMaanden;
        const vergoeding = loopt ? gemiddeld * v : 0;
        const verlies = renteStilstaand - vergoeding;
        if (metVergoeding) { if (loopt) doorTarief += verlies; else doorStop += verlies; }

        regels.push({
            maand: termijn.maand, opname, saldo: eind, gemiddeldSaldo: gemiddeld,
            renteOpgenomen, renteStilstaand, rente: renteOpgenomen + renteStilstaand,
            vergoeding, vergoedingLoopt: loopt, verlies,
            perSaldo: renteOpgenomen + verlies,
        });
        saldo = eind;
    }

    const som = (veld) => regels.reduce((s, x) => s + x[veld], 0);
    return {
        invoer: { ...a, vergoedingMaanden },
        regels,
        renteverlies: som('verlies'),
        perMaand: som('verlies') / a.maanden,
        doorLagerTarief: doorTarief,
        doorGestopteVergoeding: doorStop,
        maandenZonderVergoeding: metVergoeding ? a.maanden - vergoedingMaanden : 0,
        rente: som('rente'),
        renteOpgenomen: som('renteOpgenomen'),
        renteStilstaand: som('renteStilstaand'),
        vergoeding: som('vergoeding'),
        perSaldo: som('perSaldo'),
        gemiddeldInDepot: a.depot > 0 ? som('gemiddeldSaldo') / a.maanden / a.depot : 0,
    };
}
