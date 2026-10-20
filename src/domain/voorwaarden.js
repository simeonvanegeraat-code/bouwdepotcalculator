/**
 * De rekenkern van bouwdepot-voorwaarden-vergelijken.html: wat de gepubliceerde
 * voorwaarden van een aanbieder betekenen voor één bouwduur.
 *
 * Pure functies, zonder DOM. Ze lezen een aanbieder in de vorm van
 * src/js/bankdata.generated.js (BANKEN).
 *
 * HET MODEL
 *
 *   Looptijd     hoe lang het depot open kan staan, in maanden: de
 *                standaardlooptijd plus de verlenging. Publiceert de aanbieder
 *                wel dat verlengen kan maar niet hoe lang, dan is het maximum
 *                onbekend (null), niet gelijk aan de standaardlooptijd.
 *   Vergoeding   hoeveel maanden de aanbieder rente vergoedt over het saldo,
 *                gerekend vanaf maand 1. De rest van de looptijd staat het
 *                depot open zonder vergoeding (het "gat").
 *   Past         of een bouwduur van n maanden binnen de standaardlooptijd
 *                valt, alleen met verlenging, of helemaal niet.
 *   Renteverlies uit src/domain/renteverlies.js, met de vergoeding volgens de
 *                regel van de aanbieder (gelijk aan je hypotheekrente, een
 *                procentpunt lager, of geen).
 *
 * WAT HIER NIET IN ZIT
 *
 *   Geen rentepercentages van aanbieders: alleen hun regel, toegepast op de
 *   rente die de bezoeker zelf invult. Publiceert een aanbieder de hoogte niet,
 *   dan rekenen we niets uit. Loopt de bouw langer dan het depot open kan
 *   staan, dan ook niet: het restant gaat dan meestal van de lening af en
 *   renteverlies zegt niets meer.
 */

import { berekenRenteverlies } from './renteverlies.js';

/** Standaardlooptijd, verlenging en maximum voor verbouw of nieuwbouw. */
export function looptijd(bank, soort) {
    const basis = bank.looptijd[soort];
    const v = bank.verlenging;
    if (v.geen) return { basis, verlenging: 0, max: basis, open: false, geen: true };
    if (v.duurOnbekend) return { basis, verlenging: null, max: null, open: true, geen: false };
    return { basis, verlenging: v[soort] ?? 0, max: bank.maximaal[soort] ?? basis, open: false, geen: false };
}

/** Het laatste bekende punt van de looptijd: het maximum, of de standaard als dat onbekend is. */
export const bekendEinde = (l) => (l.open ? l.basis : l.max);

/** Rente alleen over wat al is opgenomen, en dus geen vergoeding (ING). */
export const opnameModel = (bank) => bank.vergoeding.model === 'rente-alleen-over-opgenomen';

/**
 * Hoe lang de vergoeding loopt, afgezet tegen de looptijd.
 *
 *   maanden   maanden met vergoeding, of null als niet gepubliceerd
 *   gat       maanden open zonder vergoeding; null als dat niet vast te stellen is
 *   stoptInVerlenging  de vergoeding loopt in elk geval niet door in de
 *             verlenging, ook al is de duur van die verlenging onbekend
 */
export function vergoedingsduur(bank, soort) {
    const l = looptijd(bank, soort);
    if (opnameModel(bank)) return { maanden: null, gat: 0, stoptInVerlenging: false };
    const vm = bank.vergoeding.maanden?.[soort];
    if (typeof vm !== 'number') return { maanden: null, gat: null, stoptInVerlenging: false };
    if (l.open) return { maanden: vm, gat: null, stoptInVerlenging: !bank.vergoeding.naVerlengingOnbekend };
    const gat = Math.max(0, l.max - vm);
    if (gat > 0 && bank.vergoeding.naVerlengingOnbekend) return { maanden: vm, gat: null, stoptInVerlenging: false };
    return { maanden: vm, gat, stoptInVerlenging: gat > 0 };
}

/**
 * De depotvergoeding in procenten, gegeven de hypotheekrente die de bezoeker
 * invult. null wanneer de aanbieder het niveau niet publiceert.
 */
export function vergoedingsTarief(bank, hypotheekrente, soort = 'verbouw') {
    const tarief = bank?.vergoeding?.tarief?.[soort];
    if (tarief === 'geen') return 0;
    if (tarief === 'gelijk-aan-hypotheekrente') return hypotheekrente;
    if (tarief === 'hypotheekrente-min-1') return Math.max(0, hypotheekrente - 1);
    return null;
}

export const PAST = Object.freeze({
    'past': 'Past binnen de standaardlooptijd',
    'verlengen': 'Past met verlenging',
    'verlengen-onbekend': 'Verlenging nodig, duur niet gepubliceerd',
    'past-niet': 'Past niet',
});

/** Valt een bouwduur van `maanden` binnen de looptijd? Een sleutel uit PAST. */
export function past(bank, soort, maanden) {
    const l = looptijd(bank, soort);
    if (maanden <= l.basis) return 'past';
    if (l.open) return 'verlengen-onbekend';
    if (maanden <= l.max) return 'verlengen';
    return 'past-niet';
}

/**
 * Het renteverlies bij deze aanbieder voor één scenario.
 *
 * Geeft { van, tot } in euro's, of { reden } als het niet uit te rekenen is.
 * van en tot verschillen alleen als de aanbieder niet publiceert of de
 * vergoeding in de verlenging doorloopt: van geldt als ze doorloopt, tot als
 * ze stopt.
 *
 * @param {object} invoer  { soort, depot, rentePercent, maanden, patroon }
 */
export function renteverliesBijAanbieder(bank, { soort, depot, rentePercent, maanden, patroon = 'gelijk' }) {
    const status = past(bank, soort, maanden);
    if (status === 'past-niet') {
        return { status, reden: `Het depot sluit na ${looptijd(bank, soort).max} maanden` };
    }
    const basis = { depot, rentePercent, maanden, patroon };

    if (opnameModel(bank)) {
        const r = berekenRenteverlies({ ...basis, model: 'opname', vergoedingPercent: 0, vergoedingMaanden: 0 });
        return { status, van: r.renteverlies, tot: r.renteverlies };
    }

    const pct = vergoedingsTarief(bank, rentePercent, soort);
    if (pct == null) {
        return {
            status,
            reden: bank.vergoeding?.tarief?.[soort] === 'verschilt-per-product'
                ? 'De hoogte van de vergoeding verschilt per product'
                : 'De hoogte van de vergoeding is niet gepubliceerd',
        };
    }
    const vm = bank.vergoeding.maanden?.[soort];
    if (typeof vm !== 'number') return { status, reden: 'De duur van de vergoeding is niet gepubliceerd' };

    const reken = (vergoedingMaanden) =>
        berekenRenteverlies({ ...basis, model: 'vergoeding', vergoedingPercent: pct, vergoedingMaanden }).renteverlies;

    const metStop = reken(vm);
    if (bank.vergoeding.naVerlengingOnbekend && maanden > vm) return { status, van: reken(maanden), tot: metStop };
    return { status, van: metStop, tot: metStop };
}
