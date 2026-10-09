/**
 * De rekenkern van hypotheekrenteaftrek-gids.html: wat levert de
 * hypotheekrenteaftrek op, per jaar en per maand.
 *
 * Pure functies, zonder DOM. De tarieven en grenzen komen uit
 * src/js/fiscal-rules.js; hier staat hoe ze op de eigen woning worden toegepast.
 *
 * HET MODEL (regels 2026)
 *
 *   Kosten       de aftrekbare kosten van de eigen woning: de hypotheekrente van
 *                het jaar, plus in het jaar van afsluiten de financieringskosten.
 *   Forfait      het eigenwoningforfait: een percentage van de WOZ-waarde dat
 *                bij het inkomen wordt geteld.
 *   Saldo        forfait min kosten. Negatief: dat bedrag gaat van het inkomen
 *                af. Positief (weinig of geen rente): de aftrek wegens geen of
 *                geringe eigenwoningschuld (Hillen) haalt er 71,867% van af, de
 *                rest wordt bij het inkomen geteld.
 *   Tarief       het saldo verandert het inkomen in box 1 en wordt dus belast of
 *                afgetrokken tegen het schijftarief. Maar aftrekbare kosten
 *                tellen voor hooguit 37,56%: valt (een deel van) de kosten in de
 *                hoogste schijf, dan komt er een tariefsaanpassing van 11,94%
 *                over dat deel bij. Het forfait wordt in die schijf wel tegen
 *                49,50% belast. Daardoor is het voordeel bij een hoog inkomen
 *                kleiner dan 37,56% van (rente min forfait).
 *   Korting      de algemene heffingskorting wordt kleiner naarmate het
 *                verzamelinkomen hoger is: 6,398% per euro boven 29.736, tot
 *                hij bij 78.426 nul is. De aftrek verlaagt het verzamelinkomen,
 *                dus er komt korting bij. Tussen die twee grenzen levert een
 *                euro aftrek daardoor ruim 6 cent extra op. De arbeidskorting
 *                hangt aan het arbeidsinkomen en verandert niet.
 *   AOW          wie de AOW-leeftijd heeft betaalt in de eerste schijf 17,85%
 *                en krijgt daar dus ook maar 17,85% terug; de heffingskorting
 *                is lager en bouwt af met 3,195%.
 *   Partner      fiscale partners mogen het saldo van de eigen woning (forfait
 *                en kosten samen) in elke verhouding verdelen. Bij het hoogste
 *                inkomen is niet vanzelf het gunstigst: de aftrek telt voor
 *                hooguit 37,56%, en bij de partner met het lagere inkomen kan
 *                er meer heffingskorting bijkomen. De bezoeker kiest de
 *                verdeling, of laat de gunstigste zoeken in stappen van 1%.
 *
 *   voordeel = te betalen zonder eigen woning - te betalen met eigen woning
 *   te betalen = max(0, belasting box 1 - algemene heffingskorting)
 *
 *   Een negatief voordeel bestaat: bij een hoge WOZ-waarde en weinig rente
 *   betaal je per saldo belasting over je woning.
 *
 * WAT HIER NIET IN ZIT
 *
 *   Andere heffingskortingen dan de algemene, inkomen in box 2 en 3 (dat telt
 *   mee voor de korting), andere aftrekposten, toeslagen, de dertigjaarstermijn
 *   van een bestaande lening en leningen van vóór 2013. De regels
 *   van 2026 worden voor alle jaren aangehouden; dat is een vergelijking, geen
 *   voorspelling van wetgeving.
 */

import { TAX_RULES_2026 as R, calculateEigenwoningforfait } from '../js/fiscal-rules.js';
import { leningschema } from './hypotheek.js';

export const STANDAARD_AFTREK = Object.freeze({
    hypotheek: 300000,
    rentePercent: 3.8,
    vorm: 'annuiteit',
    looptijdJaren: 30,
    woz: 400000,
    inkomen: 60000,
    aow: false,
    partner: false,
    inkomenPartner: 0,
    aowPartner: false,
    // 'beste', 'ik', 'partner' of 'half'
    verdeling: 'beste',
    eenmaligeKosten: 0,
});

/** Inkomstenbelasting box 1 over een inkomen, tegen de volle schijftarieven. */
export function belastingBox1(inkomen, { aow = false } = {}) {
    const i = Math.max(0, inkomen);
    const eerste = Math.min(i, R.firstBracketLimit);
    const tweede = Math.min(Math.max(i - R.firstBracketLimit, 0), R.secondBracketLimit - R.firstBracketLimit);
    const derde = Math.max(i - R.secondBracketLimit, 0);
    return eerste * (aow ? R.aowFirstRate : R.firstRate) + tweede * R.secondRate + derde * R.thirdRate;
}

/** De algemene heffingskorting bij een verzamelinkomen. */
export function algemeneHeffingskorting(verzamelinkomen, { aow = false } = {}) {
    const boven = Math.max(0, verzamelinkomen - R.generalCreditStart);
    return Math.max(0, (aow ? R.generalCreditMaxAow : R.generalCreditMax) - boven * (aow ? R.generalCreditPhaseOutAow : R.generalCreditPhaseOut));
}

/** Belasting box 1 na de algemene heffingskorting; nooit onder de nul. */
const teBetalen = (inkomen, aow) => Math.max(0, belastingBox1(inkomen, { aow }) - algemeneHeffingskorting(Math.max(0, inkomen), { aow }));

/**
 * Wat de eigen woning doet met de belasting van één persoon in één jaar.
 *
 * @param {object} p
 * @param {number} p.inkomen   belastbaar inkomen box 1 zonder de eigen woning
 * @param {number} p.kosten    aftrekbare kosten eigen woning in dat jaar
 * @param {number} p.forfait   eigenwoningforfait in dat jaar
 * @param {boolean} [p.aow]
 * @returns {{voordeel:number, saldo:number, hillenAftrek:number, bijtelling:number, tariefsaanpassing:number}}
 *          voordeel > 0: minder belasting. saldo = kosten - forfait.
 */
export function woningEffect({ inkomen, kosten, forfait, aow = false }) {
    const i = Math.max(0, inkomen), k = Math.max(0, kosten), f = Math.max(0, forfait);
    // Forfait hoger dan de kosten: Hillen haalt een deel van het verschil weg.
    const hillenAftrek = f > k ? (f - k) * R.hillenDeductionRate : 0;
    const inkomenUitWoning = f - k - hillenAftrek;

    // De tariefsaanpassing: aftrekbare kosten die in de hoogste schijf vallen
    // tellen voor het tarief van de tweede schijf.
    const inTop = Math.min(k, Math.max(0, i + f - hillenAftrek - R.secondBracketLimit));
    const tariefsaanpassing = inTop * (R.thirdRate - R.maxMortgageDeductionRate);

    const zonder = teBetalen(i, aow);
    const met = teBetalen(i + inkomenUitWoning, aow) + tariefsaanpassing;
    return {
        voordeel: zonder - met,
        extraKorting: algemeneHeffingskorting(Math.max(0, i + inkomenUitWoning), { aow }) - algemeneHeffingskorting(i, { aow }),
        saldo: k - f,
        hillenAftrek,
        bijtelling: Math.max(0, inkomenUitWoning),
        tariefsaanpassing,
    };
}

/**
 * Hetzelfde voor een huishouden. Met een fiscale partner krijgt ieder een deel
 * van forfait en kosten; `verdeling` zegt welk deel.
 *
 * @returns het opgetelde effect, met `deelBijJou` (0..1) en `bij` in woorden
 */
export function huishoudEffect({ inkomen, aow = false, partner = false, inkomenPartner = 0, aowPartner = false, verdeling = 'beste', kosten, forfait }) {
    if (!partner) return { ...woningEffect({ inkomen, kosten, forfait, aow }), deelBijJou: 1, bij: 'jou' };

    const bijDeel = (deel) => {
        const jij = woningEffect({ inkomen, kosten: kosten * deel, forfait: forfait * deel, aow });
        const ander = woningEffect({ inkomen: inkomenPartner, kosten: kosten * (1 - deel), forfait: forfait * (1 - deel), aow: aowPartner });
        const som = (veld) => jij[veld] + ander[veld];
        return {
            voordeel: som('voordeel'), saldo: som('saldo'), hillenAftrek: som('hillenAftrek'), bijtelling: som('bijtelling'),
            tariefsaanpassing: som('tariefsaanpassing'), extraKorting: som('extraKorting'), deelBijJou: deel,
        };
    };

    let uitkomst;
    if (verdeling === 'ik') uitkomst = bijDeel(1);
    else if (verdeling === 'partner') uitkomst = bijDeel(0);
    else if (verdeling === 'half') uitkomst = bijDeel(0.5);
    else {
        // De gunstigste verdeling, gezocht in stappen van 1%. Bij gelijke
        // uitkomst wint de eenvoudigste: alles bij één van beiden.
        const kandidaten = [1, 0, ...Array.from({ length: 99 }, (_, i) => (i + 1) / 100)];
        uitkomst = kandidaten.map(bijDeel).reduce((beste, k) => (k.voordeel > beste.voordeel + 0.005 ? k : beste));
    }
    const pct = Math.round(uitkomst.deelBijJou * 100);
    return { ...uitkomst, bij: pct === 100 ? 'jou' : pct === 0 ? 'je partner' : `jou voor ${pct}% en je partner voor ${100 - pct}%` };
}

/**
 * @param {object} invoer  zie STANDAARD_AFTREK. Verwacht gecontroleerde invoer.
 */
export function berekenAftrek(invoer = {}) {
    const a = { ...STANDAARD_AFTREK, ...invoer };
    const looptijdMaanden = a.looptijdJaren * 12;
    const schema = leningschema({ hoofdsom: a.hypotheek, maandrente: a.rentePercent / 100 / 12, looptijdMaanden, vorm: a.vorm }, looptijdMaanden);
    const forfait = calculateEigenwoningforfait(a.woz);
    const wie = { inkomen: a.inkomen, aow: a.aow, partner: a.partner, inkomenPartner: a.inkomenPartner, aowPartner: a.aowPartner, verdeling: a.verdeling, forfait };

    const jaren = [];
    for (let jaar = 1; jaar <= a.looptijdJaren; jaar++) {
        const maandregels = schema.slice((jaar - 1) * 12, jaar * 12);
        const rente = maandregels.reduce((s, r) => s + r.rente, 0);
        const aflossing = maandregels.reduce((s, r) => s + r.aflossing, 0);
        const effect = huishoudEffect({ ...wie, kosten: rente });
        const bruto = rente + aflossing;
        jaren.push({
            jaar, rente, aflossing, bruto, forfait,
            saldo: effect.saldo, bijtelling: effect.bijtelling, hillenAftrek: effect.hillenAftrek,
            tariefsaanpassing: effect.tariefsaanpassing, extraKorting: effect.extraKorting, bij: effect.bij, deelBijJou: effect.deelBijJou,
            voordeel: effect.voordeel,
            netto: bruto - effect.voordeel,
            restschuld: maandregels.at(-1).restschuld,
        });
    }

    // De financieringskosten zijn aftrekbaar in het jaar van afsluiten: wat het
    // eerste jaar met die kosten méér oplevert dan zonder.
    const eerste = jaren[0];
    const eenmalig = a.eenmaligeKosten > 0
        ? huishoudEffect({ ...wie, kosten: eerste.rente + a.eenmaligeKosten }).voordeel - eerste.voordeel
        : 0;

    return {
        invoer: a,
        forfait,
        jaren,
        eerste,
        laatste: jaren.at(-1),
        eenmaligVoordeel: eenmalig,
        // Van elke euro rente in jaar 1: hoeveel komt er terug?
        effectiefTarief: eerste.rente > 0 ? eerste.voordeel / eerste.rente : 0,
        totaalVoordeel: jaren.reduce((s, r) => s + r.voordeel, 0),
        totaalRente: jaren.reduce((s, r) => s + r.rente, 0),
    };
}
