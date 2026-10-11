/**
 * Wat een bouwdepot per maand kost, voor een reeks ronde bedragen.
 *
 * Mensen zoeken letterlijk op "wat kost een bouwdepot van 30.000 euro" en
 * "bouwdepot 100.000 per maand" (metingen/nulmeting-2026-10-08.md). De
 * rekentool beantwoordt dat voor één bedrag tegelijk; deze tabel zet de
 * gangbare bedragen onder elkaar bij een rente die de bezoeker zelf kiest.
 *
 * MODEL
 *   Elke rij is dezelfde berekening als de rekentool erboven
 *   (src/domain/bouwdepot.js, berekenDepot), met het bedrag en de rente van die
 *   rij en verder de standaardwaarden: annuïtair, dertig jaar, zes maanden
 *   verbouwen, gelijkmatig opnemen, depotvergoeding gelijk aan de rente.
 *
 *   maandlast        de last ná de verbouwing: de annuïteit over het hele
 *                    bedrag, B × r / (1 − (1 + r)^−n), met r de rente per maand
 *                    en n het aantal maanden. Elke maand gelijk.
 *   renteLooptijd    alle rente over de hele looptijd bij elkaar.
 *   eersteTijdens    wat je zelf betaalt in de eerste maand van de verbouwing:
 *                    rente plus aflossing, min de vergoeding over wat nog in
 *                    depot staat.
 *   hoogsteTijdens   de hoogste maand tijdens de verbouwing.
 *
 *   naVijftienJaar   de maandlast halverwege de looptijd (maand 181). Bij een
 *                    annuïteit is die gelijk aan de maandlast; bij lineair is
 *                    hij lager, omdat de rente daalt met wat je hebt afgelost.
 *
 * HYPOTHEEKVORM
 *   annuiteit        elke maand hetzelfde bedrag; eerst vooral rente, later
 *                    vooral aflossing.
 *   lineair          elke maand dezelfde aflossing (B / n) plus de rente over
 *                    wat nog openstaat. De eerste maand is de hoogste, daarna
 *                    daalt de last elke maand. In totaal betaal je minder rente:
 *                    r × B × (n + 1) / 2.
 *   Dit zijn de twee vormen waarmee een nieuwe lening recht geeft op
 *   hypotheekrenteaftrek. Aflossingsvrij bestaat ook nog en zit in de rekentool,
 *   maar niet in deze tabel.
 *
 *   De twee bedragen tijdens de verbouwing hangen af van aannames die per
 *   project en per aanbieder verschillen. Ze staan daarom niet standaard in
 *   de tabel, maar achter een knop, met de aannames erbij.
 *
 * Alles bruto, zonder hypotheekrenteaftrek. Bedragen worden niet afgerond; dat
 * doet de weergave.
 */

import { berekenDepot, STANDAARD_DEPOT } from './bouwdepot.js';
import { leningschema } from './hypotheek.js';

/** De vormen in de tabel. */
export const TABELVORMEN = Object.freeze({ annuiteit: 'Annuïtair', lineair: 'Lineair' });

/** De bedragen in de tabel. Rond, en met de bedragen waar het meest op gezocht wordt. */
export const TABELBEDRAGEN = Object.freeze([10000, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 100000, 125000, 150000]);

/** De bedragen die onder de tabel in een zin worden uitgeschreven. */
export const UITGELICHT = Object.freeze([30000, 50000, 100000]);

/** Waarmee de tabel in de HTML staat, vóórdat de bezoeker iets kiest. */
export const STANDAARD = Object.freeze({
    rentePercent: STANDAARD_DEPOT.rentePercent,
    looptijdJaren: STANDAARD_DEPOT.looptijdJaren,
    duurMaanden: STANDAARD_DEPOT.duurMaanden,
    vorm: 'annuiteit',
});

/** De grenzen van de schuif. */
export const RENTEGRENZEN = Object.freeze({ min: 1, max: 8, stap: 0.1 });

/**
 * @param {object} invoer
 * @param {number} invoer.rentePercent  jaarrente in procenten
 * @param {'annuiteit'|'lineair'} [invoer.vorm]
 * @param {number[]} [invoer.bedragen]
 * @returns {{bedrag:number, maandlast:number, naVijftienJaar:number, renteLooptijd:number, eersteTijdens:number, hoogsteTijdens:number}[]}
 */
export function bedragentabel({ rentePercent, vorm = STANDAARD.vorm, bedragen = TABELBEDRAGEN }) {
    if (!(rentePercent >= 0)) throw new Error('de rente moet een getal van nul of hoger zijn');
    if (!(vorm in TABELVORMEN)) throw new Error(`onbekende vorm voor de tabel: ${vorm}`);
    const looptijdMaanden = STANDAARD.looptijdJaren * 12;
    return bedragen.map((bedrag) => {
        const d = berekenDepot({ depot: bedrag, rentePercent, vorm });
        const schema = leningschema({ hoofdsom: bedrag, maandrente: rentePercent / 100 / 12, looptijdMaanden, vorm }, 181);
        return {
            bedrag,
            maandlast: d.maandlastDaarna,
            naVijftienJaar: schema[180].betaling,
            renteLooptijd: d.renteHeleLooptijd,
            eersteTijdens: d.eerste.totaal,
            hoogsteTijdens: d.hoogsteTijdens.totaal,
        };
    });
}
