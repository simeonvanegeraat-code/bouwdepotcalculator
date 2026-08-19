/**
 * Zet de datums van een bouwdepot in een agendabestand (.ics).
 *
 * De depotplanner rekende datums uit die twaalf tot vierentwintig maanden in de
 * toekomst liggen, en de bezoeker kon alleen een afdruk meenemen. Op de pagina
 * stond zelfs de zin "Zet zelf een herinnering ruim voor de einddatum": werk dat
 * de tool zelf kan doen.
 *
 * Dat is geen bijzaak. De fout waar deze pagina voor waarschuwt -- het
 * verlengingsmoment missen en het restant zien verdwijnen in een aflossing --
 * ontstaat doordat mensen een datum van anderhalf jaar vooruit vergeten. Een
 * pagina die dat vertelt en vervolgens op het geheugen vertrouwt, heeft dezelfde
 * faalwijze als de bank.
 *
 * Het bestand wordt in de browser gemaakt en nergens heen gestuurd; dat past bij
 * een site zonder account en zonder opslag van persoonsgegevens.
 */

/** Regeleinden in ICS zijn CRLF, ook op een systeem dat het anders doet. */
const EOL = '\r\n';

/** ICS kent een eigen escaping voor tekst: RFC 5545, paragraaf 3.3.11. */
const ontsnap = (tekst) => String(tekst ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/**
 * Regels langer dan 75 octetten moeten gevouwen worden, anders weigeren sommige
 * agenda's het bestand. Vouwen betekent: afbreken en de volgende regel met een
 * spatie beginnen.
 */
const vouw = (regel) => {
    if (regel.length <= 75) return regel;
    const delen = [regel.slice(0, 75)];
    let rest = regel.slice(75);
    while (rest.length > 74) {
        delen.push(' ' + rest.slice(0, 74));
        rest = rest.slice(74);
    }
    if (rest) delen.push(' ' + rest);
    return delen.join(EOL);
};

const alsDatum = (d) => [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
].join('');

const alsTijdstip = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/**
 * Bouwt een agendabestand uit gebeurtenissen met een datum.
 *
 * @param {object}  opties
 * @param {string}  opties.naam            naam van de agenda, bijv. "Bouwdepot Rabobank"
 * @param {Array}   opties.gebeurtenissen  [{ naam, datum, uitleg, herinnering }]
 * @param {string}  [opties.bron]          URL die als toelichting meegaat
 * @returns {string} de inhoud van het .ics-bestand
 */
export function maakAgenda({ naam, gebeurtenissen, bron }) {
    const metDatum = (gebeurtenissen || []).filter((g) => g.datum instanceof Date && !Number.isNaN(g.datum.valueOf()));
    if (!metDatum.length) return '';

    const nu = alsTijdstip(new Date());
    const regels = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//BouwdepotCalculator.nl//Depotplanner//NL',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${ontsnap(naam)}`,
    ];

    metDatum.forEach((g, i) => {
        // Een dagvullende gebeurtenis: DTEND is exclusief, dus de dag erna.
        const eind = new Date(g.datum);
        eind.setDate(eind.getDate() + 1);

        const omschrijving = [g.uitleg, bron ? `Berekend op ${bron}` : '']
            .filter(Boolean).join('\n\n');

        regels.push(
            'BEGIN:VEVENT',
            `UID:${alsDatum(g.datum)}-${i}-depotplanner@bouwdepotcalculator.nl`,
            `DTSTAMP:${nu}`,
            `DTSTART;VALUE=DATE:${alsDatum(g.datum)}`,
            `DTEND;VALUE=DATE:${alsDatum(eind)}`,
            vouw(`SUMMARY:${ontsnap(`${g.naam} — ${naam}`)}`),
            vouw(`DESCRIPTION:${ontsnap(omschrijving)}`),
            'TRANSP:TRANSPARENT',
        );

        // Alleen waar iets te doen valt een herinnering. Een agenda die bij elke
        // gebeurtenis piept wordt uitgezet, en dan werkt hij niet meer op het
        // moment dat het ertoe doet.
        if (g.herinnering) {
            regels.push(
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                `TRIGGER:-P${g.herinnering}D`,
                vouw(`DESCRIPTION:${ontsnap(`Over ${g.herinnering} dagen: ${g.naam}`)}`),
                'END:VALARM',
            );
        }

        regels.push('END:VEVENT');
    });

    regels.push('END:VCALENDAR');
    return regels.join(EOL) + EOL;
}

/** Biedt de agenda als bestand aan. Blijft volledig op het apparaat. */
export function downloadAgenda(bestandsnaam, inhoud) {
    const blob = new Blob([inhoud], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = bestandsnaam;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Zonder vrijgeven blijft de blob in het geheugen hangen zolang de pagina
    // openstaat, en deze pagina wordt bij elk veld opnieuw doorgerekend.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
