/**
 * Zet de voorwaarden om in een compacte module voor de browser.
 *
 * data/bouwdepot-voorwaarden.json is geschreven om te vergelijken en te
 * verantwoorden: elk veld heeft een detailtekst en een bron. Dat hoort op de
 * vergelijkingspagina, maar niet in de bundel van elke rekenpagina. De
 * calculators hebben alleen de harde getallen nodig om mee te rekenen.
 *
 * Dit script leidt niets af en verzint niets: het kiest velden en telt
 * looptijd en verlenging bij elkaar op. Wat de aanbieder niet publiceert komt
 * hier als null binnen en blijft null.
 *
 *   node scripts/build-bankdata.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const DOEL = 'src/js/bankdata.generated.js';

const som = (basis, extra) =>
  typeof basis === 'number' && typeof extra === 'number' ? basis + extra : null;

const banken = data.aanbieders.map((a) => {
  const v = a.verlengingMaanden || {};
  return {
    id: a.id,
    naam: a.naam,
    pagina: `bouwdepot-${a.id}.html`,
    looptijd: {
      verbouw: a.looptijdVerbouwMaanden ?? null,
      nieuwbouw: a.looptijdNieuwbouwMaanden ?? null,
    },
    verlenging: {
      verbouw: v.verbouw ?? null,
      nieuwbouw: v.nieuwbouw ?? null,
      eenmalig: v.eenmalig ?? null,
      // Drie toestanden die uit elkaar moeten blijven: een bekende verlenging,
      // een verlenging waarvan de duur niet gepubliceerd is, en een aanbieder
      // die geen verlenging publiceert. Bij die laatste is de standaardlooptijd
      // het maximum en hoort er geen open einde te worden gesuggereerd.
      duurOnbekend: v.mogelijkMaarDuurOnbekend === true,
      geen: v.geenVerlengingGepubliceerd === true,
    },
    maximaal: {
      verbouw: v.geenVerlengingGepubliceerd === true
        ? (a.looptijdVerbouwMaanden ?? null)
        : som(a.looptijdVerbouwMaanden, v.verbouw),
      nieuwbouw: v.geenVerlengingGepubliceerd === true
        ? (a.looptijdNieuwbouwMaanden ?? null)
        : som(a.looptijdNieuwbouwMaanden, v.nieuwbouw),
    },
    vergoeding: {
      samenvatting: a.rentevergoeding?.waarde ?? null,
      detail: a.rentevergoeding?.detail ?? null,
      model: a.rentevergoeding?.model ?? null,
      maanden: {
        verbouw: a.rentevergoeding?.vergoedingMaanden?.verbouw ?? null,
        nieuwbouw: a.rentevergoeding?.vergoedingMaanden?.nieuwbouw ?? null,
      },
      tarief: {
        verbouw: a.rentevergoeding?.tarief?.verbouw ?? null,
        nieuwbouw: a.rentevergoeding?.tarief?.nieuwbouw ?? null,
      },
    },
    verlengingAanvragen: {
      maandenVoorEinde: a.verlengingAanvragen?.maandenVoorEinde ?? null,
      soort: a.verlengingAanvragen?.soort ?? null,
      detail: a.verlengingAanvragen?.detail ?? null,
    },
    opnamemethode: a.opnamemethode ?? null,
    // De tekst en het rekenbare getal gaan allebei mee. De depotplanner leidt
    // uit het getal de uiterste declaratiedatum af; de tekst hoort daar altijd
    // bij te staan, want "5 werkdagen" is iets anders dan "meestal 5 werkdagen".
    uitbetaling: a.doorlooptijdUitbetaling?.digitaal ?? null,
    uitbetalingWerkdagen: a.doorlooptijdUitbetaling?.werkdagenDigitaal ?? null,
    voorschieten: a.voorschieten?.waarde ?? null,
    restant: {
      waarde: a.restant?.waarde ?? null,
      detail: a.restant?.detail ?? null,
    },
    eigenArbeid: a.eigenArbeid?.waarde ?? null,
    // Wat er bij een declaratie mee moet. Staat in de specificatie die de
    // bezoeker meeneemt, zodat hij niet met het verkeerde bewijsstuk aankomt.
    // De toelichting gaat mee. Zonder detail staat er bij een eis alleen
    // "Verplicht", en dat zegt niets: de nuance zit in de zin eronder.
    eisen: (a.declaratieEisen || []).map((e) => ({ eis: e.eis, waarde: e.waarde, detail: e.detail ?? null })),
    declarabel: a.declarabel ?? null,
  };
});

const inhoud = `/**
 * GEGENEREERD BESTAND - niet met de hand aanpassen.
 * Bron: data/bouwdepot-voorwaarden.json
 * Opnieuw maken: node scripts/build-bankdata.mjs
 *
 * Laatst bijgewerkt volgens de bron: ${data._laatstBijgewerkt}
 */

export const BANKEN = ${JSON.stringify(banken, null, 2)};

export const BRON_BIJGEWERKT = ${JSON.stringify(data._laatstBijgewerkt)};
`;

fs.writeFileSync(path.join(ROOT, DOEL), inhoud);
console.log(`${DOEL} gegenereerd (${banken.length} aanbieders)`);
