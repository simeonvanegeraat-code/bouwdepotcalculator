/**
 * De rekenkern van bouwdepot-berekenen.html: wat kost een bouwdepot per maand,
 * tijdens de verbouwing en daarna.
 *
 * Pure functies, zonder DOM. Er staat hier geen eigen hypotheek- of
 * vergoedingsformule: de maandregels komen uit berekenTijdlijn in nieuwbouw.js,
 * dezelfde functie waar de nieuwbouwpagina en de homepage mee rekenen. Dit
 * bestand vertaalt alleen de vraag van deze pagina naar die functie.
 *
 * HET MODEL
 *
 *   Lening      het bouwdepot, plus eventueel de hypotheek voor de woning zelf
 *               als die tegelijk wordt afgesloten. De hele lening gaat in op
 *               dag één; je betaalt vanaf maand 1 rente en aflossing over het
 *               geheel.
 *   Bouwdepot   het deel van de lening dat nog niet aan de aannemer is betaald.
 *               Het is geen extra lening.
 *   Opname      verlaagt het depot, niet de schuld. Wanneer er wordt opgenomen
 *               volgt uit het opnamepatroon (zie opnameTermijnen).
 *   Vergoeding  de rente die de geldverstrekker over het depot vergoedt:
 *               hypotheekrente min een afslag, over het gemiddelde van begin-
 *               en eindsaldo van de maand. Aangenomen is dat hij vergoedt
 *               zolang er saldo is; of en hoe lang staat in de voorwaarden.
 *   Woonlast    een huur of oude hypotheek die doorloopt zolang er verbouwd
 *               wordt, en stopt in de maand daarna.
 *
 *   Per maand:  zelf te betalen = max(0, rente + aflossing - vergoeding)
 *               bruto totaal    = zelf te betalen + woonlast
 *
 *   Alles is bruto: er zit geen hypotheekrenteaftrek in.
 *
 * WAT HIER NIET IN ZIT
 *
 *   Een bestaande hypotheek die al loopt en niet verandert. Wie zijn hypotheek
 *   verhoogt voor een verbouwing betaalt die oude maandlast gewoon door; het
 *   depot voegt daar de bedragen uit deze berekening aan toe.
 */

import { berekenTijdlijn } from './nieuwbouw.js';
import { leningschema } from './hypotheek.js';

export const OPNAMEPATRONEN = Object.freeze({
    gelijk: 'Gelijkmatig',
    vroeg: 'Vooral aan het begin',
    laat: 'Vooral aan het eind',
});

export const STANDAARD_DEPOT = Object.freeze({
    depot: 25000,
    woning: 0,
    rentePercent: 3.8,
    kortingDepotPercent: 0,
    looptijdJaren: 30,
    vorm: 'annuiteit',
    duurMaanden: 6,
    patroon: 'gelijk',
    woonlast: 0,
});

/** Zoveel maanden na de verbouwing rekent de tijdlijn nog door. */
export const MAANDEN_NA = 3;

/**
 * Het opnamepatroon als termijnschema: per maand van de verbouwing een deel van
 * het depot, samen 100%.
 *
 *   gelijk  elke maand evenveel
 *   vroeg   de eerste maand het meest, daarna elke maand een gelijke stap minder
 *           (gewichten n, n-1, ..., 1)
 *   laat    het spiegelbeeld: de laatste maand het meest (gewichten 1, 2, ..., n)
 *
 * Dit zijn illustraties, geen voorspelling: wanneer jouw aannemer factureert
 * staat in de offerte.
 */
export function opnameTermijnen(patroon, maanden) {
    if (!(patroon in OPNAMEPATRONEN)) throw new Error(`onbekend opnamepatroon: ${patroon}`);
    const gewicht = (i) => (patroon === 'gelijk' ? 1 : patroon === 'vroeg' ? maanden - i : i + 1);
    const totaal = Array.from({ length: maanden }, (_, i) => gewicht(i)).reduce((a, b) => a + b, 0);
    let rest = 100;
    return Array.from({ length: maanden }, (_, i) => {
        // De laatste maand krijgt wat er over is, zodat het geheel 100% blijft.
        const percent = i === maanden - 1 ? rest : (gewicht(i) / totaal) * 100;
        rest -= percent;
        return { maand: i + 1, percent, naam: null };
    });
}

/**
 * @param {object} invoer  zie STANDAARD_DEPOT. Verwacht gecontroleerde invoer:
 *                         eindige getallen, duurMaanden een geheel getal >= 1.
 */
export function berekenDepot(invoer = {}) {
    const a = { ...STANDAARD_DEPOT, ...invoer };
    const t = berekenTijdlijn({
        grond: a.woning,
        aanneemsom: a.depot,
        eigenGeld: 0,
        rentePercent: a.rentePercent,
        kortingDepotPercent: a.kortingDepotPercent,
        looptijdJaren: a.looptijdJaren,
        vorm: a.vorm,
        bouwduurMaanden: a.duurMaanden,
        huidigeWoonlast: a.woonlast,
        overlapNaOplevering: 0,
        renteMeefinancieren: false,
        termijnen: opnameTermijnen(a.patroon, a.duurMaanden),
        horizonMaanden: a.duurMaanden + MAANDEN_NA,
    });

    const tijdens = t.regels.slice(0, a.duurMaanden);
    const daarna = t.regels[a.duurMaanden];
    const som = (veld) => tijdens.reduce((s, r) => s + r[veld], 0);
    // De eerste van de hoogste maanden tijdens de verbouwing.
    const hoogsteTijdens = tijdens.reduce((h, r) => (r.totaal > h.totaal + 1e-9 ? r : h), tijdens[0]);

    // Hoeveel van het depot er gemiddeld nog stond, over dezelfde maandgemiddelden
    // als waarover de vergoeding is berekend.
    let begin = t.depotBijStart, saldoSom = 0;
    for (const r of tijdens) { saldoSom += (begin + r.depot) / 2; begin = r.depot; }

    const looptijdMaanden = a.looptijdJaren * 12;
    const renteHeleLooptijd = leningschema(
        { hoofdsom: t.lening, maandrente: a.rentePercent / 100 / 12, looptijdMaanden, vorm: a.vorm },
        looptijdMaanden,
    ).reduce((s, r) => s + r.rente, 0);

    return {
        invoer: a,
        lening: t.lening,
        klaarMaand: a.duurMaanden,
        regels: t.regels,
        piek: t.piek,
        eerste: tijdens[0],
        hoogsteTijdens,
        daarna,
        maandlastDaarna: daarna.betaling,
        gemiddeldTijdens: som('totaal') / tijdens.length,
        gemiddeldInDepot: a.depot > 0 ? saldoSom / tijdens.length / a.depot : 0,
        sommen: {
            rente: som('rente'),
            vergoeding: som('vergoeding'),
            renteNaVergoeding: som('rente') - som('vergoeding'),
            zelfBetaald: som('hypotheek'),
            woonlast: som('woonlast'),
        },
        renteHeleLooptijd,
    };
}
