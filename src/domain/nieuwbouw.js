/**
 * De rekenkern van de nieuwbouwpagina: wat betaal je per maand, van de eerste
 * bouwtermijn tot je oude woonlast is weggevallen.
 *
 * Pure functies, zonder DOM. De pagina (src/nieuwbouw/pagina.js), de homepage
 * (src/homepage/voorbeeld.js), de grafiek en de tabel lezen allemaal dezelfde
 * maandregels; geen van hen rekent zelf.
 *
 * HET MODEL
 *
 *   Lening      grond + aanneemsom - eigen geld. De hele lening gaat in bij
 *               het passeren.
 *   Eigen geld  gaat eerst op: bij het passeren aan de grond, en wat er dan
 *               nog over is aan de eerste bouwtermijnen. Dat is een aanname;
 *               zo schrijven geldverstrekkers het doorgaans voor, maar de
 *               offerte is leidend.
 *   Bouwdepot   het deel van de lening dat na het betalen van de grond
 *               overblijft: de aanneemsom, min het eigen geld dat nog voor de
 *               bouw beschikbaar is. Het depot is geen extra lening: het is het
 *               deel van de lening dat nog niet is uitbetaald aan de aannemer.
 *   Termijn     een betaling aan de aannemer, in een bouwmaand, als percentage
 *               van de aanneemsom. Voor zover er geen eigen geld meer is komt
 *               hij uit het depot. Een opname verlaagt het depot, niet de schuld.
 *   Hypotheek   rente en aflossing volgens het betaalschema over de HELE
 *               lening (zie hypotheek.js), vanaf maand 1.
 *   Vergoeding  de rente die de geldverstrekker over het depot vergoedt:
 *               hypotheekrente min een afslag, over het gemiddelde van begin-
 *               en eindsaldo van de maand (zie src/js/depotvergoeding.js).
 *               Of en hoe lang een aanbieder vergoedt staat in de voorwaarden;
 *               dit model neemt aan dat hij vergoedt zolang er saldo is.
 *   Woonlast    de huidige huur of hypotheek. Loopt door tijdens de bouw en
 *               nog `overlapNaOplevering` maanden daarna.
 *
 *   Per maand:  hypotheek na vergoeding = max(0, rente + aflossing - vergoeding)
 *               bruto totaal            = hypotheek na vergoeding + woonlast
 *
 *   Alles is bruto: er zit geen hypotheekrenteaftrek in.
 *
 * DRIE FASEN
 *
 *   'bouw'     maand 1 t/m de oplevermaand
 *   'overlap'  de maanden na oplevering waarin de oude woonlast nog doorloopt
 *   'na'       daarna: alleen de nieuwe hypotheek
 *
 * WAAROM DE OVERLAP EEN EIGEN INVOER IS
 *
 *   De vorige versie van deze berekening (src/js/nieuwbouwcalc.js) rekende door
 *   tot twee maanden na de laatste termijn en telde in die maanden de oude
 *   woonlast mee. Bij de standaardinvoer viel de piek daardoor in "maand 13 van
 *   de bouw", terwijl de bouw twaalf maanden duurde. De aanname zelf is
 *   verdedigbaar -- wie verhuist betaalt meestal nog een opzegtermijn of zit
 *   tussen twee woningen -- maar hij stond nergens. Hier is hij een getal dat de
 *   bezoeker ziet en kan aanpassen. De standaardwaarde is twee maanden, zodat de
 *   standaarduitkomst gelijk blijft aan wat de pagina al toonde.
 *
 * VERTRAGING
 *
 *   `vertragingMaanden` schuift de oplevering op. Alleen de termijnen die in de
 *   laatste bouwmaand vielen schuiven mee; wat eerder betaald is, blijft staan.
 *   Tijdens de vertraging blijft het restant in depot staan en loopt de
 *   vergoeding daarover door. Dat is een aanname: bij een aantal aanbieders
 *   stopt de vergoeding of het depot zelf na een vaste termijn.
 */

import { vergoedingOverMaand } from '../js/depotvergoeding.js';
import { leningschema } from './hypotheek.js';

export const STANDAARD = Object.freeze({
    grond: 150000,
    aanneemsom: 350000,
    eigenGeld: 0,
    rentePercent: 3.8,
    kortingDepotPercent: 0,
    looptijdJaren: 30,
    vorm: 'annuiteit',
    bouwduurMaanden: 12,
    huidigeWoonlast: 1200,
    overlapNaOplevering: 2,
});

/**
 * Het standaard termijnschema, meeschalend met de bouwduur. Een aannemer
 * factureert naar bouwvoortgang, dus schuiven de fasen mee met de looptijd; de
 * verdeling in procenten blijft gelijk.
 */
const STANDAARD_FASEN = Object.freeze([
    { deelVanDeBouw: 1 / 12, percent: 15, naam: 'Ruwbouw begane grond' },
    { deelVanDeBouw: 3 / 12, percent: 20, naam: 'Ruwbouw verdiepingen' },
    { deelVanDeBouw: 6 / 12, percent: 20, naam: 'Dak en gevelsluiting' },
    { deelVanDeBouw: 9 / 12, percent: 25, naam: 'Afbouw en installaties' },
    { deelVanDeBouw: 12 / 12, percent: 20, naam: 'Oplevering' },
]);

export function standaardTermijnen(bouwduur) {
    return STANDAARD_FASEN.map((fase) => ({
        maand: Math.min(bouwduur, Math.max(1, Math.round(fase.deelVanDeBouw * bouwduur))),
        percent: fase.percent,
        naam: fase.naam,
    }));
}

/** Een gelijkmatig schema: een fase per ongeveer drie maanden, samen 100%. */
export function gespreideTermijnen(bouwduur) {
    const aantal = Math.min(Math.max(Math.round(bouwduur / 3), 3), 8);
    const stap = Math.max(1, Math.floor(bouwduur / aantal));
    const basis = Math.floor((100 / aantal) * 10) / 10;
    let rest = 100;
    return Array.from({ length: aantal }, (_, i) => {
        const percent = i === aantal - 1 ? Math.round(rest * 10) / 10 : basis;
        rest -= percent;
        return { maand: Math.min(bouwduur, 1 + i * stap), percent, naam: `Bouwfase ${i + 1}` };
    });
}

const procent = (waarde) => `${waarde.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}%`;

/**
 * Wat er mis is met een termijnschema, in woorden voor de bezoeker. Een schema
 * dat niet klopt hoort geen uitkomst op te leveren die er hetzelfde uitziet als
 * een goede.
 */
export function controleerSchema(termijnen, bouwduur) {
    const totaal = Math.round(termijnen.reduce((som, t) => som + t.percent, 0) * 10) / 10;
    const klachten = [];
    if (termijnen.length === 0) {
        klachten.push('Er staat geen enkele bouwtermijn in het schema.');
    } else if (Math.abs(totaal - 100) > 0.1) {
        klachten.push(totaal < 100
            ? `De termijnen tellen op tot ${procent(totaal)} van de aanneemsom. Er ontbreekt nog ${procent(Math.round((100 - totaal) * 10) / 10)}.`
            : `De termijnen tellen op tot ${procent(totaal)} van de aanneemsom, dat is meer dan het geheel.`);
    }
    if (termijnen.some((t) => t.percent < 0)) klachten.push('Een termijn kan niet onder de nul liggen.');
    const teLaat = termijnen.filter((t) => t.maand > bouwduur);
    if (teLaat.length) {
        klachten.push(teLaat.length === 1
            ? `Er staat een termijn in maand ${teLaat[0].maand}, terwijl de bouw ${bouwduur} maanden duurt.`
            : `Er staan ${teLaat.length} termijnen na maand ${bouwduur}, terwijl de bouw zo lang duurt.`);
    }
    return { totaal, klachten };
}

/**
 * Rekent de tijdlijn uit. Verwacht gecontroleerde invoer: bedragen en
 * percentages zijn eindige getallen en het schema is door controleerSchema.
 *
 * @param {object} invoer                    zie STANDAARD, plus:
 * @param {{maand:number, percent:number, naam:string}[]} [invoer.termijnen]
 * @param {number} [invoer.vertragingMaanden]  zoveel maanden later opgeleverd
 * @param {number} [invoer.horizonMaanden]     tot welke maand er gerekend wordt
 */
export function berekenTijdlijn(invoer = {}) {
    const a = { ...STANDAARD, ...invoer };
    const vertraging = Math.max(0, a.vertragingMaanden ?? 0);
    const termijnen = (a.termijnen ?? standaardTermijnen(a.bouwduurMaanden))
        .map((t) => ({ ...t, maand: t.maand >= a.bouwduurMaanden ? t.maand + vertraging : t.maand }));

    const oplevermaand = a.bouwduurMaanden + vertraging;
    const eindeOverlap = oplevermaand + Math.max(0, a.overlapNaOplevering);
    const horizon = Math.max(a.horizonMaanden ?? 0, eindeOverlap + 1);

    const maandrente = a.rentePercent / 100 / 12;
    const depotrente = Math.max(0, (a.rentePercent - a.kortingDepotPercent) / 100 / 12);
    const lening = Math.max(0, a.grond + a.aanneemsom - a.eigenGeld);
    // Wat er van het eigen geld over is nadat de grond is betaald.
    let eigenRest = Math.max(0, a.eigenGeld - a.grond);
    const depotBijStart = Math.max(0, a.aanneemsom - eigenRest);
    const schema = leningschema({ hoofdsom: lening, maandrente, looptijdMaanden: a.looptijdJaren * 12, vorm: a.vorm }, horizon);

    const regels = [];
    let depot = depotBijStart;
    for (let maand = 1; maand <= horizon; maand++) {
        const begin = depot;
        const vandaag = termijnen.filter((t) => t.maand === maand);
        const termijnbedrag = vandaag.reduce((som, t) => som + (t.percent / 100) * a.aanneemsom, 0);
        const uitEigenGeld = Math.min(eigenRest, termijnbedrag);
        eigenRest -= uitEigenGeld;
        const opname = Math.min(begin, termijnbedrag - uitEigenGeld);
        depot = Math.max(0, begin - opname);
        // Percentages als 14,3 zijn binair niet exact; zonder dit blijft er na
        // de laatste termijn een miljardste euro in depot staan.
        if (depot < 1e-6) depot = 0;

        const { rente, aflossing, betaling, restschuld } = schema[maand - 1];
        const vergoeding = vergoedingOverMaand(begin, depot, depotrente);
        const hypotheek = Math.max(0, betaling - vergoeding);
        const fase = maand <= oplevermaand ? 'bouw' : maand <= eindeOverlap ? 'overlap' : 'na';
        const woonlast = fase === 'na' ? 0 : a.huidigeWoonlast;

        regels.push({
            maand, fase,
            termijn: vandaag.map((t) => t.naam).filter(Boolean).join(', ') || null,
            termijnbedrag, uitEigenGeld, opname, depot,
            rente, aflossing, betaling, restschuld,
            vergoeding, hypotheek, woonlast,
            totaal: hypotheek + woonlast,
        });
    }

    const dubbel = regels.filter((r) => r.fase !== 'na');
    const bouw = regels.filter((r) => r.fase === 'bouw');
    const som = (lijst, veld) => lijst.reduce((s, r) => s + r[veld], 0);
    // De eerste van de hoogste maanden: bij gelijke bedragen telt de vroegste.
    // Over alle maanden, ook die na de overlap: wie geen huidige woonlast heeft
    // betaalt het meest zodra het depot leeg is, en dat is na de oplevering.
    const piek = regels.reduce((hoogste, r) => (r.totaal > hoogste.totaal + 1e-9 ? r : hoogste), regels[0]);

    return {
        invoer: { ...a, termijnen, vertragingMaanden: vertraging },
        lening,
        depotBijStart,
        oplevermaand,
        eindeOverlap,
        regels,
        piek,
        maandlastDaarna: regels[eindeOverlap].betaling,
        restDepotBijOplevering: regels[oplevermaand - 1].depot,
        sommen: {
            // Over de bouw: wat de lening aan rente kost, en wat daarvan terugkomt.
            renteTijdensBouw: som(bouw, 'rente'),
            vergoeding: som(bouw, 'vergoeding'),
            renteNaVergoeding: som(bouw, 'rente') - som(bouw, 'vergoeding'),
            // Over de hele periode waarin de oude woonlast nog loopt.
            hypotheekTijdensDubbel: som(dubbel, 'hypotheek'),
            woonlastTijdensDubbel: som(dubbel, 'woonlast'),
            totaalTijdensDubbel: som(dubbel, 'totaal'),
            maandenDubbel: dubbel.length,
        },
    };
}

/**
 * Legt een scenario naast de basis, over dezelfde periode. Zonder gelijke
 * periode vergelijk je een lange met een korte reeks en lijkt elk uitstel duur.
 *
 * Het verschil is NIET vertraging x huur: tijdens het uitstel loopt de oude
 * woonlast door, maar blijft er ook depot staan waarover vergoeding komt.
 */
export function vergelijk(invoer, scenario) {
    const horizon = Math.max(
        berekenTijdlijn(invoer).eindeOverlap,
        berekenTijdlijn({ ...invoer, ...scenario }).eindeOverlap,
    ) + 1;
    const basis = berekenTijdlijn({ ...invoer, horizonMaanden: horizon });
    const anders = berekenTijdlijn({ ...invoer, ...scenario, horizonMaanden: horizon });
    const totaal = (t) => t.regels.reduce((s, r) => s + r.totaal, 0);
    return {
        horizon,
        basis,
        scenario: anders,
        verschil: {
            piek: anders.piek.totaal - basis.piek.totaal,
            piekmaand: anders.piek.maand - basis.piek.maand,
            cumulatief: totaal(anders) - totaal(basis),
            woonlast: anders.sommen.woonlastTijdensDubbel - basis.sommen.woonlastTijdensDubbel,
            vergoeding: anders.sommen.vergoeding - basis.sommen.vergoeding,
            maandenDubbel: anders.sommen.maandenDubbel - basis.sommen.maandenDubbel,
        },
    };
}
