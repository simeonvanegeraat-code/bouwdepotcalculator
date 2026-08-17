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
      duurOnbekend: v.mogelijkMaarDuurOnbekend === true,
    },
    maximaal: {
      verbouw: som(a.looptijdVerbouwMaanden, v.verbouw),
      nieuwbouw: som(a.looptijdNieuwbouwMaanden, v.nieuwbouw),
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
    opnamemethode: a.opnamemethode ?? null,
    uitbetaling: a.doorlooptijdUitbetaling?.digitaal ?? null,
    voorschieten: a.voorschieten?.waarde ?? null,
    restant: a.restant?.waarde ?? null,
    eigenArbeid: a.eigenArbeid?.waarde ?? null,
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
