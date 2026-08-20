/**
 * Het declaratieplan van een lopend bouwdepot.
 *
 * De depotplanner rekende alleen passeerdatum plus looptijd uit. Dat is een som
 * die de bezoeker ook uit zijn hypotheekakte haalt, en het beantwoordt zijn
 * werkelijke vraag niet: krijg ik dit geld op tijd besteed, en wat moet ik
 * wanneer indienen?
 *
 * Twee dingen die de bank niet uit zichzelf vertelt:
 *
 *   1. Indienen op de einddatum is te laat. Er zit verwerkingstijd tussen, en
 *      pas als het geld is uitbetaald telt het. De uiterste indiendatum is dus
 *      de einddatum min de doorlooptijd van die aanbieder.
 *   2. Wat er niet op tijd besteed is, verdwijnt meestal in een aflossing op de
 *      lening. Dat is geen ramp, maar wel iets anders dan wat je van plan was.
 *
 * Wie geen doorlooptijd publiceert -- Obvion en SNS -- krijgt geen datum maar
 * een uitleg. Een deadline waar iemand op vertrouwt moet kloppen.
 */

/** Telt werkdagen terug vanaf een datum; weekenden slaan we over. */
export function werkdagenTerug(datum, werkdagen) {
    const d = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate());
    let over = Math.max(0, werkdagen);
    while (over > 0) {
        d.setDate(d.getDate() - 1);
        const dag = d.getDay();
        if (dag !== 0 && dag !== 6) over -= 1;
    }
    return d;
}

/**
 * Bouwt het plan.
 *
 * @param {object} opties
 * @param {Date}   opties.einde        einddatum van de standaardtermijn
 * @param {number|null} opties.werkdagen  doorlooptijd van de aanbieder, of null
 * @param {number} opties.saldo        wat er nog in het depot staat
 * @param {Array}  opties.posten       [{ omschrijving, bedrag, maand }] maand als 'JJJJ-MM' of leeg
 * @returns {object} { uiterste, regels, totaalPosten, nietBelegd, tekort, teLaat }
 */
export function maakPlan({ einde, werkdagen, saldo, posten }) {
    const uiterste = einde && typeof werkdagen === 'number'
        ? werkdagenTerug(einde, werkdagen)
        : null;

    const regels = (posten || [])
        .filter((p) => p && (p.omschrijving || p.bedrag))
        .map((p) => {
            const bedrag = Number(p.bedrag) || 0;
            // De maand komt als 'JJJJ-MM'; we rekenen met de laatste dag ervan,
            // want een post "maart" is uiterlijk eind maart aan de orde.
            let verwacht = null;
            if (p.maand && /^\d{4}-\d{2}$/.test(p.maand)) {
                const [jaar, maand] = p.maand.split('-').map(Number);
                verwacht = new Date(jaar, maand, 0);
            }
            const teLaat = !!(verwacht && uiterste && verwacht > uiterste);
            return { omschrijving: p.omschrijving || 'Post zonder omschrijving', bedrag, verwacht, teLaat };
        });

    const totaalPosten = regels.reduce((som, r) => som + r.bedrag, 0);

    return {
        uiterste,
        regels,
        totaalPosten,
        // Wat er nog in het depot staat en nergens aan toegewezen is. Precies het
        // bedrag dat straks op de lening wordt afgelost als er niets mee gebeurt.
        nietBelegd: Math.max(0, saldo - totaalPosten),
        // Andersom: meer plannen dan er in het depot zit.
        tekort: Math.max(0, totaalPosten - saldo),
        teLaat: regels.filter((r) => r.teLaat).length,
    };
}
