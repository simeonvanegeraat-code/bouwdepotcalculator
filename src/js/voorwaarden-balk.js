/**
 * De tijdlijnbalk van de voorwaardenvergelijking: welke stukken, hoe lang, en
 * welke tekst erop of erbij staat.
 *
 * Gedeeld door de generator (scripts/build-voorwaarden.mjs, die de balk voor
 * verbouwing in de HTML zet) en de pagina (src/voorwaarden/pagina.js, die bij
 * een wissel naar nieuwbouw dezelfde balk opnieuw uitrekent). Zo kunnen de
 * statische en de bewegende versie niet uit elkaar lopen. Geen DOM.
 */

import { BANKEN } from './bankdata.generated.js';
import { looptijd, bekendEinde, vergoedingsduur, opnameModel } from '../domain/voorwaarden.js';

/** Eén schaal voor alle balken, verbouw en nieuwbouw samen; anders zegt lengte niets. */
export const SCHAAL = Math.ceil(Math.max(...BANKEN.flatMap((b) => ['verbouw', 'nieuwbouw'].map((s) => {
    const l = looptijd(b, s);
    // Een open einde krijgt een half jaar ruimte voor het uitlopende stuk.
    return l.open ? l.basis + 6 : l.max;
}))) / 6) * 6;

export function onderschrift(l) {
    if (l.open) return `${l.basis} mnd + verlenging, duur niet gepubliceerd`;
    if (l.geen) return `${l.basis} mnd, geen verlenging`;
    return `${l.basis} mnd + ${l.verlenging} mnd verlenging`;
}

/**
 * De stukken van de balk in maanden, met labels in drie lengtes. Welke lengte
 * past, hangt af van de schermbreedte; dat kiest de pagina.
 */
export function balk(bank, soort) {
    const l = looptijd(bank, soort);
    const vd = vergoedingsduur(bank, soort);
    const eind = bekendEinde(l);
    const kostNiets = opnameModel(bank);
    const met = kostNiets ? eind : Math.min(vd.maanden ?? eind, eind);
    const rest = eind - met;
    const onbekend = !kostNiets && Boolean(bank.vergoeding.naVerlengingOnbekend) && rest > 0;

    const labelMet = kostNiets
        ? { lang: 'geen rente over het saldo', midden: 'geen rente over saldo', kort: 'geen rente' }
        : { lang: `vergoeding ${met} mnd`, midden: `${met} mnd vergoeding`, kort: `${met} mnd` };
    const labelRest = onbekend
        ? { lang: `niet gepubliceerd, ${rest} mnd`, midden: `? ${rest} mnd`, kort: '?' }
        : { lang: `zonder vergoeding ${rest} mnd`, midden: `zonder ${rest} mnd`, kort: `${rest}` };

    // De looptijd staat al als tekst onder de naam; de zin vertelt wat alleen
    // de kleuren van de balk laten zien: hoe lang de vergoeding loopt.
    let zin = '';
    if (kostNiets) zin += 'Geen rente over wat nog in het depot staat, dus ook geen vergoeding.';
    else if (vd.maanden == null) zin += 'Hoe lang de vergoeding loopt is niet gepubliceerd.';
    else if (rest === 0 && !l.open) zin += 'Vergoeding over de hele looptijd.';
    else if (onbekend) zin += `Vergoeding de eerste ${met} maanden; of die daarna doorloopt is niet gepubliceerd.`;
    else if (l.open) zin += `Vergoeding de eerste ${met} maanden, ${rest > 0 ? 'daarna niet en ook niet' : 'niet'} in de verlenging.`;
    else zin += `Vergoeding de eerste ${met} maanden, de laatste ${rest} maanden niet.`;

    return {
        looptijd: l, eind, met, rest, onbekend, kostNiets,
        open: l.open,
        tick: l.verlenging > 0 ? l.basis : null,
        totaal: l.open ? `${l.basis} mnd + ?` : `${eind} mnd`,
        onderschrift: onderschrift(l),
        labels: { met: labelMet, rest: labelRest },
        zin,
    };
}

/** Percentage van de schaal, als CSS-waarde. */
export const procent = (maanden, schaal = SCHAAL) => `${((maanden / schaal) * 100).toFixed(2)}%`;
