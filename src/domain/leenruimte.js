/**
 * Hoeveel kun je lenen voor je verbouwing? De rekenkern van leenruimte.html.
 *
 * Pure functies, zonder DOM. De normen komen uit de Tijdelijke regeling
 * hypothecair krediet (Trhk) die geldt vanaf 1 januari 2026; zie trhk-2026.js.
 *
 * TWEE TOETSEN, DE LAAGSTE BEPAALT
 *
 * 1. Inkomenstoets (Trhk art. 3, 3a en 4)
 *    toetsrente         = geoffreerde rente bij 10 jaar of langer vast,
 *                         anders het hoogste van AFM-rente (5%) en geoffreerde rente
 *    percentage         = bijlage 1: tabel 1, of tabel 2 als de aanvrager met het
 *                         hoogste inkomen de AOW-leeftijd heeft bereikt (art. 3 lid 7);
 *                         rij = gezamenlijk toetsinkomen (lid 6), kolom = toetsrente
 *    toegestane last    = toetsinkomen x percentage / 12                 (per maand)
 *                         - termijn studielening x bruteringsfactor      (art. 3a)
 *    uit de last        = contante waarde van die maandlast als annuiteit over
 *                         30 jaar tegen de toetsrente, maandelijks achteraf (art. 3 lid 2-4)
 *    erbij mag          = bedrag bij het energielabel (art. 4 lid 3)
 *                       + energiebesparende voorzieningen, tot het maximum bij het
 *                         label, of 10.000 zonder label (art. 4 lid 4 en 5)
 *                       + 17.000 voor een alleenstaande boven 30.000 toetsinkomen
 *                         (29.000 na de AOW-leeftijd) (art. 3 lid 8)
 *    Die drie zijn bevoegdheden van de aanbieder ("kan"), geen recht. Ze staan
 *    daarom apart in de uitkomst.
 *
 * 2. Waardetoets (Trhk art. 5)
 *    maximaal           = 100% van de woningwaarde na verbouwing
 *                       + kosten energiebesparende voorzieningen, tot 106% van die waarde
 *
 * UITKOMST
 *    maximale hypotheek = het kleinste van beide
 *    extra te lenen     = maximale hypotheek - huidige hypotheek, minimaal 0
 *    voor de verbouwing = het kleinste van: extra te lenen, kosten van de verbouwing
 *
 * VEREENVOUDIGINGEN (staan ook op de pagina)
 *  - De hele hypotheek telt als annuiteit over 30 jaar, ook het bestaande deel
 *    met een kortere resterende looptijd. Art. 3 lid 3 staat dat toe als het
 *    verantwoord is; een aanbieder kan met de werkelijke looptijd rekenen en komt
 *    dan lager uit.
 *  - Eén rente voor de hele hypotheek: bij meerdere leningdelen het gewogen
 *    gemiddelde (art. 3 lid 11), dat de bezoeker zelf invult.
 *  - Andere leningen dan een studieschuld (creditcard, autolening) zitten er niet in.
 *  - Boven 125.000 toetsinkomen (110.000 na de AOW-leeftijd) geldt het percentage
 *    van de laatste rij van de tabel.
 *  - Tabel 3 en 4 (rente niet aftrekbaar) worden niet gebruikt: uitgegaan wordt
 *    van een hypotheek waarvan de rente aftrekbaar is.
 */

import { annuiteitTermijn } from '../js/annuiteit.js';
import {
    TABEL_1, TABEL_2, TOETSRENTE_KOLOMMEN, BRUTERING_STUDIELENING,
    ENERGIELABEL_BEDRAG, ENERGIEBESPAREND_BEDRAG, ENERGIEBESPAREND_ZONDER_LABEL,
    ALLEENSTAAND, AFM_TOETSRENTE, MAX_WAARDE, MAX_WAARDE_ENERGIEBESPAREND,
} from './trhk-2026.js';

export const LOOPTIJD_TOETS_MAANDEN = 360;

/** De labelgroepen zoals de wet ze noemt, plus 'geen' voor een woning zonder geldig label. */
export const ENERGIELABELS = ['EFG', 'CD', 'AB', 'A+ A++', 'A+++', 'A++++', 'A++++ garantie', 'geen'];

/** Rente op drie decimalen, zoals de kolomgrenzen in de wet (1,501-2,000%). */
const opDrie = (p) => Math.round(p * 1000) / 1000;

/** Trhk art. 3 lid 9 en 10. */
export function toetsrente(rentePercent, tienJaarOfLangerVast, afm = AFM_TOETSRENTE) {
    return tienJaarOfLangerVast ? rentePercent : Math.max(afm, rentePercent);
}

/** Bijlage 1: het financieringslastpercentage, als fractie. */
export function financieringslastPercentage(toetsinkomen, toetsrentePercent, aowBereikt = false) {
    const tabel = aowBereikt ? TABEL_2 : TABEL_1;
    let rij = tabel[0];
    for (const r of tabel) if (toetsinkomen >= r[0]) rij = r;
    const p = opDrie(toetsrentePercent);
    const kolom = TOETSRENTE_KOLOMMEN.findIndex((grens) => p <= grens);
    return rij[1 + kolom];
}

/** Art. 3a: bruteringsfactor voor de termijn van een studielening. */
export function bruteringsfactor(toetsrentePercent) {
    const p = opDrie(toetsrentePercent);
    return BRUTERING_STUDIELENING.find(([grens]) => p <= grens)[1];
}

/** Het bedrag dat je met een maandlast kunt lenen: contante waarde van een annuiteit. */
export function hoofdsomBijMaandlast(maandlast, rentePercent, maanden = LOOPTIJD_TOETS_MAANDEN) {
    if (!(maandlast > 0)) return 0;
    const r = rentePercent / 100 / 12;
    if (r === 0) return maandlast * maanden;
    return maandlast * (1 - (1 + r) ** -maanden) / r;
}

/** Art. 4 lid 3 tot en met 5: wat bij het energielabel buiten de last mag blijven. */
export function energieRuimte(label, energiebesparendeKosten) {
    const kosten = Math.max(0, energiebesparendeKosten || 0);
    const labelBedrag = label === 'geen' ? 0 : ENERGIELABEL_BEDRAG[label] ?? 0;
    const maxBesparend = label === 'geen' ? ENERGIEBESPAREND_ZONDER_LABEL : ENERGIEBESPAREND_BEDRAG[label] ?? 0;
    return { labelBedrag, besparend: Math.min(kosten, maxBesparend), maxBesparend };
}

/**
 * @param {object} i
 * @param {number} i.inkomen            bruto toetsinkomen per jaar van de aanvrager
 * @param {number} [i.inkomenPartner]   van de partner; 0 of leeg als je alleen aanvraagt
 * @param {boolean} [i.aowBereikt]      de aanvrager met het hoogste inkomen heeft de AOW-leeftijd bereikt
 * @param {number} i.rentePercent       hypotheekrente (gewogen gemiddelde bij meerdere delen)
 * @param {boolean} [i.tienJaarVast]    rentevaste periode van 10 jaar of langer
 * @param {number} [i.studieschuldMaand] termijnbedrag studielening per maand
 * @param {number} i.hypotheek          huidige openstaande hypotheek
 * @param {number} i.waarde             woningwaarde na verbouwing
 * @param {number} i.verbouwing         kosten van de verbouwing
 * @param {number} [i.energiebesparend] waarvan energiebesparende voorzieningen (Trhk art. 1 sub b)
 * @param {string} [i.label]            energielabel van de woning, zie ENERGIELABELS
 */
export function berekenLeenruimte(i) {
    const inkomenPartner = Math.max(0, i.inkomenPartner || 0);
    const toetsinkomen = Math.max(0, i.inkomen) + inkomenPartner;
    const aow = Boolean(i.aowBereikt);
    const tRente = toetsrente(i.rentePercent, Boolean(i.tienJaarVast));
    const percentage = financieringslastPercentage(toetsinkomen, tRente, aow);

    const lastUitInkomen = toetsinkomen * percentage / 12;
    const factor = bruteringsfactor(tRente);
    const studie = Math.max(0, i.studieschuldMaand || 0) * factor;
    const toegestaneLast = Math.max(0, lastUitInkomen - studie);
    const uitLast = hoofdsomBijMaandlast(toegestaneLast, tRente);

    const besparendeKosten = Math.min(Math.max(0, i.energiebesparend || 0), Math.max(0, i.verbouwing || 0));
    const energie = energieRuimte(i.label ?? 'geen', besparendeKosten);
    const alleen = inkomenPartner === 0
        && toetsinkomen > (aow ? ALLEENSTAAND.grensNaAow : ALLEENSTAAND.grensVoorAow);
    const alleenstaand = alleen ? ALLEENSTAAND.bedrag : 0;
    const magErbij = energie.labelBedrag + energie.besparend + alleenstaand;
    const maxInkomen = uitLast + magErbij;

    const waarde = Math.max(0, i.waarde);
    const waardeBasis = waarde * MAX_WAARDE;
    // In hele procenten rekenen: 1,06 - 1 is in JavaScript net geen 0,06.
    const extraProcent = Math.round((MAX_WAARDE_ENERGIEBESPAREND - MAX_WAARDE) * 100);
    const waardeBesparend = Math.min(besparendeKosten, waarde * extraProcent / 100);
    const maxWaarde = waardeBasis + waardeBesparend;

    const maximaal = Math.min(maxInkomen, maxWaarde);
    const hypotheek = Math.max(0, i.hypotheek);
    const extra = Math.max(0, maximaal - hypotheek);
    const verbouwing = Math.max(0, i.verbouwing || 0);
    const voorVerbouwing = Math.min(extra, verbouwing);

    return {
        toetsinkomen,
        toetsrente: tRente,
        percentage,
        lastUitInkomen,
        studieschuld: { termijn: Math.max(0, i.studieschuldMaand || 0), factor, gebruteerd: studie },
        toegestaneLast,
        uitLast,
        erbij: { label: energie.labelBedrag, energiebesparend: energie.besparend, alleenstaand, totaal: magErbij },
        maxInkomen,
        maxWaarde,
        waarde: { basis: waardeBasis, energiebesparend: waardeBesparend },
        maximaal,
        grens: maxInkomen <= maxWaarde ? 'inkomen' : 'waarde',
        hypotheek,
        extra,
        voorVerbouwing,
        eigenGeld: Math.max(0, verbouwing - voorVerbouwing),
        // Wat de extra lening per maand kost, bruto, tegen de opgegeven rente
        // (niet de toetsrente): dat is wat je werkelijk gaat betalen.
        extraMaandlast: voorVerbouwing > 0 ? annuiteitTermijn(voorVerbouwing, i.rentePercent / 100 / 12, LOOPTIJD_TOETS_MAANDEN) : 0,
        // Zonder de bevoegdheden van de aanbieder: het deel dat elke aanbieder
        // volgens de wet moet kunnen geven als het verder rond is.
        extraZonderErbij: Math.max(0, Math.min(uitLast, maxWaarde) - hypotheek),
    };
}
