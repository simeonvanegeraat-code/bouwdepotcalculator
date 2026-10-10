/**
 * De datums van een lopend bouwdepot: wanneer het afloopt, wanneer de
 * vergoeding stopt en wanneer verlengen geregeld moet zijn.
 *
 * Pure functies, zonder DOM. Alle datums komen uit twee dingen die de bezoeker
 * weet, de passeerdatum en de aanbieder, gecombineerd met de termijnen die de
 * aanbieder publiceert (src/js/bankdata.generated.js). Wat een aanbieder niet
 * publiceert wordt niet gerekend: liever geen datum dan een verzonnen datum,
 * want een deadline waar iemand op vertrouwt moet kloppen. Elke gebeurtenis
 * heeft daarom of een datum, of een uitleg waarom die er niet is.
 *
 * De logica stond in src/js/depotplanner.js, tussen de schermcode. Ze staat
 * hier apart zodat ze te testen is; de regels zelf zijn niet veranderd.
 */

/**
 * Telt maanden bij een datum op. Een depot dat op 31 januari start en één
 * maand loopt, eindigt eind februari: new Date(2026, 1, 31) rolt door naar
 * 3 maart, dus de dag wordt teruggezet naar de laatste dag van de doelmaand.
 */
export function maandenErbij(d, n) {
    const doel = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const laatste = new Date(doel.getFullYear(), doel.getMonth() + 1, 0).getDate();
    doel.setDate(Math.min(d.getDate(), laatste));
    return doel;
}

/** Het aantal maanden tussen twee datums, als breuk (30,44 dagen per maand). */
export const maandenTussen = (van, tot) => (tot - van) / 86400000 / 30.44;

/**
 * De gebeurtenissen van een depot, op datum; wat geen datum heeft staat
 * onderaan.
 *
 * @param {object} bank   een aanbieder uit BANKEN
 * @param {Date} start    de passeerdatum
 * @param {'verbouw'|'nieuwbouw'} soort
 * @returns {{naam:string, datum?:Date, uitleg:string, let_op?:boolean, soort?:string}[]}
 */
export function gebeurtenissen(bank, start, soort) {
    const rij = [];
    const looptijd = bank.looptijd[soort];
    const vergoeding = bank.vergoeding.maanden[soort];
    const verlenging = bank.verlenging[soort];
    const aanvraag = bank.verlengingAanvragen;

    rij.push({
        naam: 'Depot geopend',
        soort: 'start',
        datum: start,
        uitleg: 'Vanaf deze datum betaal je rente over het depot en loopt de termijn.',
    });

    // De vergoedingsduur hoort vergeleken te worden met de langste termijn die
    // het depot kan halen, niet met de standaardtermijn. Bij ABN AMRO loopt de
    // vergoeding bij nieuwbouw 30 maanden: voorbij de standaard van 24, maar
    // niet tot de 36 die met verlenging mogelijk zijn.
    const langste = bank.maximaal[soort] ?? looptijd;

    if (bank.vergoeding.model === 'rente-alleen-over-opgenomen') {
        rij.push({
            naam: 'Vergoeding',
            uitleg: `${bank.naam} vergoedt geen rente over je depotsaldo, maar rekent er ook geen rente over. Er is dus geen datum waarop dit verandert.`,
        });
    } else if (typeof vergoeding === 'number') {
        const looptDoorNaStandaard = typeof looptijd === 'number' && vergoeding > looptijd;
        const stoptEerder = typeof langste === 'number' && vergoeding < langste;
        let uitleg;
        if (!stoptEerder) {
            uitleg = 'De vergoeding loopt door tot het einde van je depot, ook als je verlengt.';
        } else if (looptDoorNaStandaard) {
            uitleg = `De vergoeding loopt ${vergoeding} maanden en dus door in de verlenging, maar niet tot het einde daarvan. Over de laatste ${langste - vergoeding} maanden betaal je wel rente en ontvang je niets meer.`;
        } else {
            uitleg = `Na ${vergoeding} maanden stopt de vergoeding, terwijl het depot tot ${langste} maanden kan lopen. Wat er daarna nog in staat kost je wel rente en levert niets meer op.`;
        }
        rij.push({
            naam: 'Vergoeding stopt',
            soort: 'vergoeding',
            datum: maandenErbij(start, vergoeding),
            uitleg,
            let_op: stoptEerder,
        });
    }

    if (aanvraag.maandenVoorEinde != null && typeof looptijd === 'number') {
        rij.push({
            naam: aanvraag.soort === 'bericht-van-bank' ? 'Bericht over verlengen' : 'Verlengen aanvragen kan vanaf',
            soort: 'verlengen',
            datum: maandenErbij(start, looptijd - aanvraag.maandenVoorEinde),
            uitleg: aanvraag.detail || '',
            let_op: aanvraag.soort !== 'bericht-van-bank',
        });
    }

    if (typeof looptijd === 'number') {
        rij.push({
            naam: 'Standaardtermijn eindigt',
            soort: 'einde',
            datum: maandenErbij(start, looptijd),
            uitleg: `De standaardlooptijd bij ${bank.naam} is ${looptijd} maanden voor ${soort === 'verbouw' ? 'verbouwing van een bestaande woning' : 'nieuwbouw'}.`,
            let_op: true,
        });
    }

    if (typeof verlenging === 'number' && typeof looptijd === 'number') {
        rij.push({
            naam: 'Uiterste einddatum na verlenging',
            soort: 'uiterste',
            datum: maandenErbij(start, looptijd + verlenging),
            uitleg: bank.verlenging.eenmalig === false
                ? `Verlengen kan bij ${bank.naam} in meer dan één stap, tot in totaal ${looptijd + verlenging} maanden.`
                : `Met de eenmalige verlenging van ${verlenging} maanden kom je op ${looptijd + verlenging} maanden in totaal.`,
        });
    } else if (bank.verlenging.duurOnbekend) {
        rij.push({
            naam: 'Na verlenging',
            uitleg: `${bank.naam} maakt verlenging wel mogelijk maar publiceert niet met hoeveel maanden. Wij rekenen daar geen datum voor uit; vraag die op bij je eigen adviseur.`,
        });
    } else if (bank.verlenging.geen) {
        rij.push({
            naam: 'Geen verlenging gepubliceerd',
            uitleg: `${bank.naam} publiceert geen verlenging: de bron stelt dat het depot na de looptijd automatisch stopt. Reken dus met de einddatum hierboven als een harde datum, en vraag bij je adviseur na of er in jouw geval iets mogelijk is.`,
        });
    }

    if (aanvraag.maandenVoorEinde == null) {
        rij.push({
            naam: 'Verlengen regelen',
            uitleg: aanvraag.detail
                ? `${aanvraag.detail} Zet zelf een herinnering ruim voor de einddatum.`
                : `${bank.naam} publiceert niet hoeveel maanden voor de einddatum een verlenging geregeld moet zijn. Wacht er niet mee tot de laatste weken.`,
        });
    }

    // Een tijdlijn die niet op datum staat is geen tijdlijn. De gebeurtenissen
    // worden hierboven per onderwerp opgebouwd, niet per moment.
    const metDatum = rij.filter((g) => g.datum).sort((a, b) => a.datum - b.datum);
    return [...metDatum, ...rij.filter((g) => !g.datum)];
}
