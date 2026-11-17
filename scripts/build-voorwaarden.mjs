/**
 * Genereert de bouwdepot-voorwaardenvergelijking uit data/bouwdepot-voorwaarden.json.
 *
 * Eén bron van waarheid: de JSON. De HTML wordt hieruit gegenereerd en gecommit,
 * zodat de inhoud statisch in de pagina staat en dus indexeerbaar is.
 *
 * Juridisch kader (zie JURIDISCHE-CHECK.md): uitsluitend feiten, geen aanbeveling,
 * geen ranglijst op kwaliteit, elke aanbieder met bronlink en controledatum,
 * onbekend blijft "niet gepubliceerd" en wordt nooit geschat.
 *
 * Ontwerp: antwoord eerst. De vergelijking is één tabel met per aanbieder een
 * tijdlijnbalk op één schaal: hoe lang het depot open kan staan en hoe lang de
 * vergoeding loopt. Zie bouwHub() hieronder.
 *
 * Vormgeving: de pagina's gebruiken de nieuwe stijl (src/styles/next) en zeggen
 * "je". De teksten in de dataset en in dit script zijn met "u" geschreven; de
 * functie pagina() haalt alle zichtbare tekst door jij() (scripts/aanspreekvorm.mjs).
 * Nieuwe tekst in dit script mag dus in beide vormen staan, de uitvoer zegt "je".
 * Elke rij draagt data-bank, zodat src/voorwaarden/pagina.js de gekozen
 * geldverstrekker bovenaan kan zetten.
 *
 *   node scripts/build-voorwaarden.mjs
 */

import fs from 'fs';
import path from 'path';
import { headerHtml, voetHtml } from './build-header.mjs';
import { jij } from './aanspreekvorm.mjs';
import { verdieping } from './aanbieder-verdieping.mjs';
// Dezelfde termijnregels als de depotplanner. build-bankdata.mjs draait in
// npm run build:voorwaarden vóór dit script en schrijft bankdata.generated.js.
import { gebeurtenissen } from '../src/domain/depotplanning.js';
import { BANKEN } from '../src/js/bankdata.generated.js';
import { looptijd, vergoedingsduur, opnameModel } from '../src/domain/voorwaarden.js';
import { balk, procent, SCHAAL } from '../src/js/voorwaarden-balk.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const HUB = 'bouwdepot-voorwaarden-vergelijken.html';
const SITE = 'https://www.bouwdepotcalculator.nl';
const CONTROLE_INTERVAL_MAANDEN = 6;
const CONTROLE_INTERVAL_ZONDER_VANGNET = 3;

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NL_DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
const datum = (iso) => NL_DATUM.format(new Date(iso + 'T00:00:00Z'));

const LEEG = '<span class="ul-leeg">niet gepubliceerd</span>';
const NVT = '<span class="ul-leeg">niet van toepassing</span>';

/**
 * Een cel waarvan de waarde niet publiek is blijft expliciet leeg. Nooit schatten.
 *
 * "Niet van toepassing" is iets anders dan "niet gepubliceerd": bij een aanbieder
 * zonder declaratieproces bestaat een maximum per declaratie eenvoudigweg niet.
 * Daar een getal neerzetten dat uit een ander proces komt, maakt de vergelijking
 * onvergelijkbaar.
 */
function waarde(veld) {
  if (!veld) return LEEG;
  if (veld.status === 'niet-van-toepassing') return NVT;
  if (veld.status === 'niet-gepubliceerd' || (veld.waarde == null && veld.bedrag == null)) return LEEG;
  if (typeof veld.bedrag === 'number') return '&euro;&nbsp;' + veld.bedrag.toLocaleString('nl-NL');
  return esc(veld.waarde);
}

/** Totale looptijd inclusief verlenging, alleen als beide bekend zijn. */
function totaal(basis, extra) {
  if (typeof basis !== 'number') return null;
  if (typeof extra !== 'number') return { totaal: basis, zeker: false };
  return { totaal: basis + extra, zeker: true };
}

/**
 * Hoe lang een controle meegaat, afhankelijk van of er een vangnet is.
 *
 * Voor bronnen die het wekelijkse script kan bewaken volstaat een halfjaar: een
 * inhoudelijke wijziging levert dan tussentijds een melding op. Voor bronnen die
 * geautomatiseerd ophalen blokkeren bestaat dat vangnet niet, en is de
 * controledatum het enige dat een verouderde waarde nog aan het licht brengt.
 * Daar hoort een kortere termijn bij. Dit is geen theorie: bij Rabobank stond
 * maanden een verlengingsclaim die de bron niet ondersteunt, en die kwam pas
 * boven bij een handmatige controle.
 */
function isVerlopen(a) {
  const maanden = a.automatischTeControleren === false
    ? CONTROLE_INTERVAL_ZONDER_VANGNET
    : CONTROLE_INTERVAL_MAANDEN;
  const d = new Date(a.gecontroleerd + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + maanden);
  return d < new Date();
}

function controle(a) {
  const v = isVerlopen(a);
  return `<span class="ul-controle${v ? ' ul-controle--verlopen' : ''}">${
    v ? 'controle openstaand &middot; ' : ''}gecontroleerd ${datum(a.gecontroleerd)}</span>`;
}

/**
 * De hoogte van de depotvergoeding als regel, niet als tarief.
 *
 * Bewust geen rentepercentages op deze site. Een hypotheekrente hangt af van
 * rentevastperiode, de verhouding tussen lening en woningwaarde en soms het
 * energielabel; dat zijn tientallen waarden per aanbieder die wekelijks
 * wijzigen. Wat wel stabiel is, is de regel waarmee de aanbieder de
 * depotvergoeding aan uw eigen hypotheekrente koppelt. Die regel staat hier, en
 * de calculators passen hem toe op de rente die de bezoeker zelf invult. Zo is
 * de uitkomst persoonlijk in plaats van een marktgemiddelde, en veroudert er
 * niets.
 */
const TARIEFTEKST = {
  'gelijk-aan-hypotheekrente': 'Gelijk aan uw hypotheekrente',
  'hypotheekrente-min-1': 'Uw hypotheekrente min 1 procentpunt',
  'geen': 'Geen vergoeding over het depotsaldo',
};

function tariefVeld(a) {
  const t = a.rentevergoeding?.tarief || {};
  if (t.verbouw == null) return { waarde: null, status: undefined };
  const zelfde = t.verbouw === t.nieuwbouw;
  if (t.verbouw === 'niet-gepubliceerd' && (zelfde || t.nieuwbouw === 'niet-gepubliceerd')) {
    return {
      waarde: null,
      detail: 'Deze aanbieder publiceert wel dat u vergoeding krijgt, maar niet hoe hoog die is ten opzichte van uw hypotheekrente. Vraag dat na in uw offerte.',
    };
  }
  const v = TARIEFTEKST[t.verbouw] || null;
  const n = TARIEFTEKST[t.nieuwbouw] || null;
  if (zelfde || !n) return { waarde: v, detail: null };
  return { waarde: v, detail: `Bij nieuwbouw geldt een andere regel: ${n.toLowerCase()}.` };
}

/** Een gestructureerde declaratie-eis opzoeken, of een leeg veld. */
function eisVeld(a, naam) {
  const e = (a.declaratieEisen || []).find((x) => x.eis === naam);
  return e ? { waarde: e.waarde, detail: e.detail || null } : { waarde: null };
}

/** Het bewijsstuk dat bij een declaratie moet, uit de gestructureerde eisen. */
function bewijsVeld(a) {
  const bewijs = (a.declaratieEisen || []).find((e) => e.eis === 'soort-bewijs');
  if (!bewijs) return { waarde: null };
  return { waarde: bewijs.waarde, detail: bewijs.detail || null };
}

/** Wanneer een verlenging geregeld moet zijn. */
function verlengVeld(a) {
  const v = a.verlengingAanvragen || {};
  // Verlengt de aanbieder vanzelf, dan valt er niets te regelen.
  if (v.status === 'niet-van-toepassing') return { waarde: 'Niet nodig: gaat automatisch', detail: v.detail || null };
  if (typeof v.maandenVoorEinde !== 'number') {
    return { waarde: null, detail: v.detail || null };
  }
  const soort = v.soort === 'bericht-van-bank'
    ? `U krijgt ${v.maandenVoorEinde} maanden voor de einddatum bericht`
    : `Vanaf ${v.maandenVoorEinde} maanden voor de einddatum aan te vragen`;
  return { waarde: soort, detail: v.detail || null };
}
/**
 * Hoeveel maanden de vergoeding loopt, afgezet tegen de looptijd.
 *
 * Dit is het onderscheidende gegeven van deze vergelijking: de meeste
 * aanbieders vergoeden niet de hele periode waarin het depot open kan staan.
 * De maanden zonder vergoeding zijn de duurste van het traject, want dan
 * betaalt u wel rente en ontvangt u niets terug.
 */
function vergoedingsduurVeld(a) {
  const v = a.rentevergoeding || {};
  const duur = v.vergoedingMaanden || {};
  if (v.model === 'rente-alleen-over-opgenomen') {
    return {
      waarde: 'Niet van toepassing',
      detail: 'Deze aanbieder vergoedt niets over het depotsaldo, maar rekent er ook geen rente over.',
    };
  }
  if (typeof duur.verbouw !== 'number') return { waarde: null };
  const gelijk = duur.verbouw === duur.nieuwbouw;
  const waarde = gelijk
    ? `${duur.verbouw} maanden`
    : `${duur.verbouw} maanden bij verbouwing, ${duur.nieuwbouw} bij nieuwbouw`;

  const max = typeof a.verlengingMaanden?.verbouw === 'number'
    ? a.looptijdVerbouwMaanden + a.verlengingMaanden.verbouw
    : a.looptijdVerbouwMaanden;
  const gat = max - duur.verbouw;
  const detail = gat <= 0
    ? 'De vergoeding loopt door tot het einde van de looptijd.'
    : v.vergoedingNaVerlengingOnbekend
      ? `Het depot kan bij verbouwing tot ${max} maanden lopen. Over de laatste ${gat} maanden publiceert deze aanbieder niet of de vergoeding doorloopt; vraag dat na voordat u verlengt.`
      : `Het depot kan bij verbouwing tot ${max} maanden lopen. Over de laatste ${gat} maanden betaalt u wel rente maar ontvangt u geen vergoeding meer.`;
  return { waarde, detail };
}

/** Hoe u aan het geld komt: declareren of zelf overboeken. */
function opnameVeld(a) {
  if (a.opnamemethode === 'zelf-betalen') {
    return {
      waarde: 'U betaalt zelf vanuit het depot',
      detail: 'Geen goedkeuring vooraf per betaling; de aanbieder kan achteraf controleren.',
    };
  }
  if (a.opnamemethode === 'declaratie') {
    return {
      waarde: 'U declareert met een bewijsstuk',
      detail: 'De aanbieder beoordeelt elke declaratie voordat er wordt uitbetaald.',
    };
  }
  return { waarde: null };
}
const bestandsnaam = (a) => `bouwdepot-${a.id}.html`;

/**
 * Eén feit in een vergelijkingskaart.
 *
 * De toelichting is hier bewust niet optioneel. Een gebruiker meldde dat
 * "Max. per declaratie EUR 5.000" bij Rabobank niet klopte; het bedrag stond
 * goed in de data, maar de bijbehorende nuance ("limiet zelf verhoogbaar")
 * werd alleen op de detailpagina getoond. Zo ontstaat een kale waarde die
 * iets anders beweert dan de bron. Heeft een veld een detail, dan komt dat
 * overal mee. tests/nuance.test.mjs faalt als dat niet gebeurt.
 */
function feit(label, veld, opties = {}) {
  const heeftWaarde = veld && (veld.waarde != null || veld.bedrag != null || veld.status);
  const inhoud = heeftWaarde ? waarde(veld) : LEEG;
  const detail = veld?.detail ? `<small>${esc(veld.detail)}</small>` : '';
  return `                        <div class="ul-feit${opties.proza ? ' ul-feit--proza' : ''}"><dt>${esc(label)}</dt><dd${
    opties.gedempt ? ' class="ul-leeg"' : ''
  }>${inhoud}${detail}</dd></div>`;
}

// ---------------------------------------------------------------- shell

/** De zichtbare tekst tussen de tags naar "je"; de tags zelf blijven zoals ze zijn. */
const jijTekst = (html) => html.replace(/>([^<]+)</g, (_, tekst) => `>${jij(tekst)}<`);

const kruimelHtml = (kruimel) => `<nav class="wr-kruimel wr-geen-print" aria-label="Kruimelpad"><a href="/">Home</a>${kruimel.map((k) => (k.href
  ? ` <span aria-hidden="true">&middot;</span> <a href="${k.href}">${esc(k.naam)}</a>`
  : ` <span aria-hidden="true">&middot;</span> <span>${esc(k.naam)}</span>`)).join('')}</nav>`;

function pagina({ bestand, titel, omschrijving, kruimel, inhoud, schema, script }) {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(titel)}</title>
    <meta name="description" content="${esc(omschrijving)}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="author" content="Simeon">
    <link rel="canonical" href="${SITE}/${bestand}">
    <!-- Wat een gedeelde link laat zien in WhatsApp, LinkedIn en Slack. Titel,
         omschrijving en adres zijn bewust dezelfde als hierboven;
         tests/deelkaart.test.mjs faalt zodra ze uit elkaar lopen. -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="BouwdepotCalculator.nl">
    <meta property="og:locale" content="nl_NL">
    <meta property="og:title" content="${esc(titel)}">
    <meta property="og:description" content="${esc(omschrijving)}">
    <meta property="og:url" content="${SITE}/${bestand}">
    <meta property="og:image" content="https://www.bouwdepotcalculator.nl/og-1200x630.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="BouwdepotCalculator.nl: reken je bouwdepot door, voor nieuwbouw en verbouwen">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="https://www.bouwdepotcalculator.nl/og-1200x630.png">
    <meta name="twitter:title" content="${esc(titel)}">
    <meta name="twitter:description" content="${esc(omschrijving)}">

    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9252617114074571"
      crossorigin="anonymous"></script>

    <link rel="stylesheet" href="/src/styles/next/tokens.css">
    <link rel="stylesheet" href="/src/styles/next/kop.css">
    <link rel="stylesheet" href="/src/styles/next/werkruimte.css">
    <link rel="stylesheet" href="/src/styles/next/uitleg.css">
</head>
<body class="ui wr">
    <a class="ui-skip" href="#inhoud">Direct naar de inhoud</a>

${headerHtml(bestand)}

${jijTekst(inhoud.replace('%KRUIMEL%', kruimelHtml(kruimel)))}

${voetHtml(bestand)}
${script ? `\n    <script type="module" src="${script}"></script>\n` : ''}${schema}
</body>
</html>
`;
}

/** Verplichte onafhankelijkheidsverklaring. Staat op elke gegenereerde pagina. */
const DISCLAIMER = `                <aside class="wr-melding">
                    <p><strong>Onafhankelijk en zonder samenwerking.</strong> Wij zijn niet verbonden aan, en werken niet samen met, de genoemde geldverstrekkers. Deze pagina vergelijkt gepubliceerde voorwaarden en bevat geen aanbeveling, rangorde of persoonlijk advies.</p>
                    <p>Voorwaarden verschillen per hypotheekvorm en kunnen in uw offerte afwijken. Elke aanbieder vermeldt de bron en de controledatum.</p>
                </aside>`;

const ldjson = (obj) => `    <script type="application/ld+json">
    ${JSON.stringify(obj, null, 2).replace(/\n/g, '\n    ')}
    </script>`;

// ---------------------------------------------------------------- hub

/**
 * De vergelijking als één tabel met een tijdlijn per aanbieder.
 *
 * Alles staat in de HTML: de balk voor verbouwing, de feiten en de uitklap
 * met alle voorwaarden. Zonder JavaScript is de uitklap gewoon open en werkt
 * de pagina als naslag. src/voorwaarden/pagina.js voegt toe: wisselen naar
 * nieuwbouw, filters, je eigen bouwduur als lijn door alle balken, en per
 * aanbieder het renteverlies in de uitklap.
 *
 * De balk komt uit src/js/voorwaarden-balk.js, dezelfde module die de pagina
 * gebruikt, zodat statisch en bewegend niet uit elkaar lopen.
 */
const BANK = Object.fromEntries(BANKEN.map((b) => [b.id, b]));

function balkHtml(bank) {
  const g = balk(bank, 'verbouw');
  const lab = (l, maanden) => `<span class="ul-tl__lab" data-lang="${esc(l.lang)}" data-midden="${esc(l.midden)}" data-kort="${esc(l.kort)}" data-maanden="${maanden}">${maanden > 0 ? esc(l.midden) : ""}</span>`;
  return `<div class="ul-tl__balk" aria-hidden="true">
                            <div class="ul-tl__spoor">
                                <span class="ul-tl__seg ul-tl__seg--met${g.kostNiets ? ' ul-tl__seg--kost-niets' : ''}" style="left:0%;width:${procent(g.met)}">${lab(g.labels.met, g.met)}</span>
                                <span class="ul-tl__seg ul-tl__seg--zonder${g.onbekend ? ' ul-tl__seg--onbekend' : ''}" style="left:${procent(g.met)};width:${procent(g.rest)}">${lab(g.labels.rest, g.rest)}</span>
                                <span class="ul-tl__seg ul-tl__seg--open" style="left:${procent(g.eind)}"${g.open ? '' : ' hidden'}></span>
                                <span class="ul-tl__tick" style="left:${procent(g.tick ?? 0)}"${g.tick == null ? ' hidden' : ''}></span>
                                <span class="ul-tl__lijn" hidden></span>
                                <span class="ul-tl__totaal" style="left:${g.open ? `calc(${procent(g.eind)} + 2.5rem)` : procent(g.eind)}">${esc(g.totaal)}</span>
                            </div>
                        </div>`;
}

/** Tekst die per soort verschilt: beide staan in de HTML, de pagina wisselt. */
const perSoort = (verbouw, nieuwbouw) => (verbouw === nieuwbouw
  ? verbouw
  : `<span data-soort="verbouw">${verbouw}</span><span data-soort="nieuwbouw" hidden>${nieuwbouw}</span>`);

function tariefKort(a, soort) {
  const bank = BANK[a.id];
  if (opnameModel(bank)) return 'Geen, maar ook geen rente over het saldo';
  const t = a.rentevergoeding?.tarief?.[soort];
  if (t === 'niet-gepubliceerd') return 'Ja, hoogte niet gepubliceerd';
  if (t === 'verschilt-per-product') return 'Ja, hoogte verschilt per product';
  return TARIEFTEKST[t] || LEEG;
}

function hubRij(a) {
  const bank = BANK[a.id];
  const v = balk(bank, 'verbouw');
  const geenRente = /^geen/i.test(a.rentevergoeding?.waarde || '');
  return `                <tr class="ul-tl__rij" id="${a.id}" data-bank="${a.id}">
                    <th scope="row" class="ul-tl__naam"><a href="${bestandsnaam(a)}">${esc(a.naam)}</a><small class="ul-tl__looptijd">${esc(v.onderschrift)}</small></th>
                    <td class="ul-tl__tijd" data-label="Hoe lang open">
                        ${balkHtml(bank)}
                        <span class="ul-tl__past" hidden></span>
                        <span class="ui-alleen-lezer ul-tl__zin">${esc(v.zin)}</span>
                    </td>
                    <td data-label="Vergoeding over depot">${perSoort(tariefKort(a, 'verbouw'), tariefKort(a, 'nieuwbouw'))}</td>
                    <td data-label="Opnemen">${waarde(opnameVeld(a))}<small>uitbetaling: ${waarde({ waarde: uitbetalingKort(bank) })}</small></td>
                    <td class="ul-tl__knopcel"><button class="ul-tl__open" type="button" aria-expanded="true" aria-controls="detail-${a.id}" hidden><span aria-hidden="true">&minus;</span><span class="ui-alleen-lezer">Alle voorwaarden van ${esc(a.naam)}</span></button></td>
                </tr>
                <tr class="ul-tl__detail" id="detail-${a.id}" data-bank="${a.id}">
                    <td colspan="5">
                    <dl class="ul-feiten">
${feit('Vergoeding over depot', a.rentevergoeding, { gedempt: geenRente })}
${feit('Hoogte van die vergoeding', tariefVeld(a))}
${feit('Vergoeding loopt', vergoedingsduurVeld(a))}
${feit('Wat mag eruit betaald worden', { waarde: a.declarabel }, { proza: true })}
${feit('Bewijsstuk bij declareren', bewijsVeld(a))}
${feit('Manier van opnemen', opnameVeld(a))}
${feit('Uitbetaling', { waarde: a.doorlooptijdUitbetaling?.digitaal, detail: a.doorlooptijdUitbetaling?.post })}
${feit('Zelf voorschieten', a.voorschieten)}
${feit('Verlengen regelen', verlengVeld(a))}
${feit('Grens per opname', a.maxPerOpname)}
${feit('Restant bij beëindiging', a.restant)}
${feit('Eigen arbeid', a.eigenArbeid)}
                    </dl>
                    <div class="ul-tl__reken" data-reken></div>
                    <p class="ul-tl__voet"><a href="${bestandsnaam(a)}">Alle voorwaarden van ${esc(a.naam)}<span aria-hidden="true"> &rarr;</span></a>${controle(a)}</p>
                    </td>
                </tr>`;
}

function uitbetalingKort(bank) {
  const d = bank.uitbetalingWerkdagen;
  if (d === 0) return 'direct';
  if (typeof d === 'number') return `${d} werkdagen`;
  return null;
}

/** Antwoord eerst: de spreiding in looptijd en hoe vaak de vergoeding eerder stopt. */
function antwoordZin(soort) {
  const eindes = BANKEN.map((b) => looptijd(b, soort)).filter((l) => !l.open).map((l) => l.max);
  const korter = BANKEN.filter((b) => vergoedingsduur(b, soort).stoptInVerlenging || vergoedingsduur(b, soort).gat > 0).length;
  return `Bij ${soort === 'verbouw' ? 'een verbouwing' : 'nieuwbouw'} staat het depot <strong>${Math.min(...eindes)} tot ${Math.max(...eindes)} maanden</strong> open, verlenging inbegrepen. ` +
    `Bij <strong>${korter} van de ${BANKEN.length}</strong> aanbieders stopt de vergoeding voordat het depot dicht moet: het lichte deel van de balk.`;
}

/**
 * Wat bij (bijna) niemand gepubliceerd is, uit de data afgeleid. Een vaste zin
 * veroudert: de vorige versie zei dat geen enkele aanbieder iets over eigen
 * arbeid publiceert, terwijl Florius dat wel doet.
 */
function bevinding() {
  const wel = (k) => data.aanbieders.filter((a) => !(a[k]?.status === 'niet-gepubliceerd' || (a[k]?.waarde == null && a[k]?.bedrag == null)));
  const namen = (lijst) => lijst.map((a) => esc(a.naam)).join(' en ');
  const min = wel('minPerOpname'), eigen = wel('eigenArbeid');
  const zin1 = min.length
    ? `Een <strong>minimumbedrag per opname</strong> noemt alleen ${namen(min)}`
    : 'Geen enkele aanbieder noemt een <strong>minimumbedrag per opname</strong>';
  const zin2 = eigen.length
    ? `over <strong>eigen arbeid</strong> zegt alleen ${namen(eigen)} iets`
    : 'niemand zegt of <strong>eigen arbeid</strong> declarabel is';
  return `${zin1}, en ${zin2}. Wij vullen die gaten niet met een aanname: <strong>je moet dit schriftelijk navragen en het antwoord bewaren</strong>. De <a href="stappenplan.html#adviesgesprek">advieschecklist</a> heeft er vragen voor.`;
}

/** Bij hoeveel aanbieders de vergoeding uit je eigen rente volgt. */
const tariefBerekenbaar = () => data.aanbieders.filter((a) =>
  ['gelijk-aan-hypotheekrente', 'hypotheekrente-min-1'].includes(a.rentevergoeding?.tarief?.verbouw)).length;

function bouwHub() {
  const volgorde = [...data.aanbieders].sort((x, y) => x.naam.localeCompare(y.naam, 'nl'));
  const controles = data.aanbieders.map((a) => a.gecontroleerd).sort();
  const as = Array.from({ length: SCHAAL / 6 + 1 }, (_, i) => i * 6)
    .map((m) => `<span style="left:${procent(m)}">${m}</span>`).join('');

  const inhoud = `    <main>
        <section class="wr-wrap wr-kop ul-kop" id="inhoud">
            %KRUIMEL%
            <h1>Bouwdepot voorwaarden vergelijken</h1>
            <p class="wr-lead ul-tl__antwoord" data-antwoord><span data-soort="verbouw">${antwoordZin('verbouw')}</span><span data-soort="nieuwbouw" hidden>${antwoordZin('nieuwbouw')}</span></p>
            <p class="ui-opschrift">${data.aanbieders.length} geldverstrekkers &middot; bij de bron gecontroleerd tussen ${datum(controles[0])} en ${datum(controles.at(-1))}</p>

            <!-- De bediening werkt alleen met JavaScript en staat daarom pas
                 zichtbaar als src/voorwaarden/pagina.js draait. -->
            <form class="ul-tl__bediening wr-geen-print" id="bediening" onsubmit="return false" aria-label="Vergelijking aanpassen" hidden>
                <fieldset class="ul-tl__schakel">
                    <legend class="ui-alleen-lezer">Waar is het depot voor?</legend>
                    <label><input type="radio" name="soort" value="verbouw" checked>Verbouwing</label>
                    <label><input type="radio" name="soort" value="nieuwbouw">Nieuwbouw</label>
                </fieldset>
                <div class="wr-veld ul-tl__duur">
                    <label for="tl-bouw">Hoe lang duurt je bouw? <span class="ul-tl__optioneel">optioneel</span></label>
                    <div class="ul-tl__duurrij">
                        <div class="wr-veld__in"><input type="text" id="tl-bouw" inputmode="numeric" autocomplete="off" placeholder="bijv. 15" aria-describedby="fout-tl-bouw"><span aria-hidden="true">mnd</span></div>
                        <input class="wr-schuif" type="range" id="tl-schuif" min="1" max="48" step="1" value="15" aria-label="Bouwduur in maanden">
                    </div>
                    <span class="wr-veld__fout" id="fout-tl-bouw" role="alert"></span>
                </div>
                <div class="wr-veld">
                    <label for="tl-opname">Zo wil ik betalen</label>
                    <div class="wr-veld__in"><select id="tl-opname">
                        <option value="">Maakt niet uit</option>
                        <option value="declaratie">Declareren met bewijsstuk</option>
                        <option value="zelf-betalen">Zelf betalen vanuit het depot</option>
                    </select></div>
                </div>
                <label class="ul-tl__vink"><input type="checkbox" id="tl-kassabon">Kassabon telt als bewijs</label>
            </form>
        </section>

        <section class="wr-wrap" id="aanbieders" aria-label="Alle aanbieders">
            <div class="ul-tl__telling wr-geen-print" aria-live="polite"><span id="tl-telling"></span><button type="button" id="tl-wis" hidden>Wissen</button></div>
            <div class="ul-kiezer ul-kiezer--los wr-geen-print" data-bankkeuze></div>

            <div class="ul-tl__as ul-tl__as--smal" aria-hidden="true">${as}</div>
            <table class="ul-tl">
                <thead>
                    <tr>
                        <th scope="col">Aanbieder</th>
                        <th scope="col" class="ul-tl__askop"><span class="ui-alleen-lezer">Hoe lang het depot open kan staan en hoe lang de vergoeding loopt, in maanden</span><span class="ul-tl__as" aria-hidden="true">${as}</span></th>
                        <th scope="col">Vergoeding over depot</th>
                        <th scope="col">Opnemen</th>
                        <th scope="col"><span class="ui-alleen-lezer">Details</span></th>
                    </tr>
                </thead>
                <tbody data-perbank>
${volgorde.map(hubRij).join('\n')}
                </tbody>
            </table>
            <p class="wr-voorbehoud ul-na-lijst">Donker: het depot staat open en je krijgt vergoeding over wat er nog in staat. Licht: het staat nog open, maar de vergoeding is gestopt. Gestreept: niet gepubliceerd of de vergoeding doorloopt. Het witte streepje is het einde van de standaardlooptijd. Klopt een gegeven niet meer? <a href="contact.html">Laat het weten</a> met een link naar de actuele voorwaarden.</p>
        </section>

        <section class="wr-wrap wr-sectie">
            <h2>Wat geen enkele aanbieder publiceert</h2>
            <div class="wr-proza ul-tl__bevinding">
                <p>${bevinding()}</p>
                <p>Elk gegeven op deze pagina komt uit de openbare voorwaarden van de aanbieder, met de datum van controle. Wat niet gepubliceerd is, staat er zo en wordt niet geschat. Zie de <a href="methodologie.html">methodologie</a>.</p>
                <p>Wij publiceren geen hypotheekrentes: die wijzigen wekelijks en hangen af van je rentevaste periode en je lening. Wel de regel waarmee een aanbieder de vergoeding aan je eigen rente koppelt. Bij ${tariefBerekenbaar()} van de ${data.aanbieders.length} aanbieders is de vergoeding daarmee uit te rekenen: open een rij en vul je rente in.</p>
            </div>
${DISCLAIMER}
        </section>
    </main>`;

  const schema = [
    ldjson({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Bouwdepot voorwaarden vergelijken per geldverstrekker',
      description: `Feitelijke vergelijking van de gepubliceerde bouwdepotvoorwaarden van ${data.aanbieders.length} Nederlandse geldverstrekkers.`,
      url: `${SITE}/${HUB}`,
      dateModified: data._laatstBijgewerkt,
      author: { '@type': 'Person', name: 'Simeon' },
      publisher: { '@type': 'Organization', name: 'BouwdepotCalculator.nl', url: SITE },
      isAccessibleForFree: true,
    }),
    ldjson({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Voorwaarden vergelijken' },
      ],
    }),
  ].join('\n');

  return pagina({
    bestand: HUB,
    titel: `Bouwdepot voorwaarden vergelijken (${data.aanbieders.length} geldverstrekkers)`,
    omschrijving: `Vergelijk de bouwdepotvoorwaarden van ${data.aanbieders.length} geldverstrekkers: looptijd, verlenging, vergoeding, uitbetaaltermijn en bewijsstukken. Met bron en datum.`,
    kruimel: [{ naam: 'Voorwaarden vergelijken' }],
    inhoud,
    schema,
    script: '/src/voorwaarden/pagina.js',
  });
}

// ---------------------------------------------------------------- per aanbieder

function rij(label, inhoud, detail) {
  return `                    <div>
                        <dt>${esc(label)}</dt>
                        <dd>${inhoud}${detail ? `<small>${esc(detail)}</small>` : ''}</dd>
                    </div>`;
}

const mnd = (n) => (typeof n === 'number' ? `${n} maanden` : LEEG);

function bouwAanbieder(a) {
  const v = a.verlengingMaanden || {};
  const bronnen = [a.bron, ...(a.bronnen || [])].filter(Boolean);
  const tv = totaal(a.looptijdVerbouwMaanden, v.verbouw);
  const tn = totaal(a.looptijdNieuwbouwMaanden, v.nieuwbouw);

  const rijen = [
    rij('Looptijd verbouwing', mnd(a.looptijdVerbouwMaanden)),
    rij('Looptijd nieuwbouw', mnd(a.looptijdNieuwbouwMaanden)),
    rij('Verlenging',
      typeof v.verbouw === 'number' || typeof v.nieuwbouw === 'number'
        ? (v.verbouw === v.nieuwbouw ? mnd(v.verbouw) : `verbouwing ${mnd(v.verbouw)}, nieuwbouw ${mnd(v.nieuwbouw)}`)
        : LEEG, v.detail),
    rij('Vergoeding over depotsaldo', waarde(a.rentevergoeding), a.rentevergoeding?.detail),
    // De vergoedingsduur is afgeleid uit het detail hierboven en staat er los bij,
    // omdat juist die duur bepaalt hoeveel stilstaand depotgeld kost.
    rij('Vergoeding loopt',
      a.rentevergoeding?.model === 'rente-alleen-over-opgenomen'
        ? 'Niet van toepassing'
        : a.rentevergoeding?.vergoedingMaanden
          ? (a.rentevergoeding.vergoedingMaanden.verbouw === a.rentevergoeding.vergoedingMaanden.nieuwbouw
              ? mnd(a.rentevergoeding.vergoedingMaanden.verbouw)
              : `verbouwing ${mnd(a.rentevergoeding.vergoedingMaanden.verbouw)}, nieuwbouw ${mnd(a.rentevergoeding.vergoedingMaanden.nieuwbouw)}`)
          : LEEG),
    // Het verschil tussen zelf mogen aanvragen en bericht krijgen is wezenlijk:
    // in het tweede geval hoeft de klant niets te onthouden, in het eerste wel.
    rij('Verlenging regelen',
      a.verlengingAanvragen?.status === 'niet-van-toepassing'
        ? 'Niet nodig: gaat automatisch'
        : a.verlengingAanvragen?.maandenVoorEinde == null
        ? LEEG
        : a.verlengingAanvragen.soort === 'bericht-van-bank'
          ? `Bericht van de aanbieder ${a.verlengingAanvragen.maandenVoorEinde} maanden voor de einddatum`
          : `Zelf aanvragen, vanaf ${a.verlengingAanvragen.maandenVoorEinde} maanden voor de einddatum`,
      a.verlengingAanvragen?.detail),
    rij('Manier van opnemen',
      a.opnamemethode === 'declaratie' ? 'Declareren: bewijsstuk indienen, daarna uitbetaling' : esc(a.opnamemethode),
      a.opnamemethodeDetail),
    rij('Maximum per declaratie', waarde(a.maxPerOpname), a.maxPerOpname?.detail),
    a.minimumDepot ? rij('Minimum depotbedrag', waarde(a.minimumDepot), a.minimumDepot?.detail) : '',
    rij('Doorlooptijd uitbetaling',
      a.doorlooptijdUitbetaling?.digitaal ? esc(a.doorlooptijdUitbetaling.digitaal) : LEEG,
      a.doorlooptijdUitbetaling?.post),
    rij('Zelf voorschieten en terugvragen', waarde(a.voorschieten), a.voorschieten?.detail),
    // Las eerder a.bewijsstuk, een veld dat bij vrijwel geen aanbieder bestaat en
    // nergens werd gevuld; daardoor stond deze rij op alle aanbiederpagina's leeg
    // terwijl het antwoord in declaratieEisen staat.
    rij('Vereist bewijsstuk', waarde(bewijsVeld(a)), bewijsVeld(a).detail),
    rij('Ouderdom van de factuur', waarde(eisVeld(a, 'ouderdom')), eisVeld(a, 'ouderdom').detail),
    rij('Wat u mag declareren', a.declarabel ? esc(a.declarabel) : LEEG),
    rij('Eigen arbeid', waarde(a.eigenArbeid), a.eigenArbeid?.detail),
    rij('Restant bij beëindiging', waarde(a.restant), a.restant?.detail),
  ].filter(Boolean).join('\n');

  const bank = BANKEN.find((b) => b.id === a.id);
  if (!bank) throw new Error(`${a.id} ontbreekt in bankdata.generated.js; draai eerst scripts/build-bankdata.mjs`);
  const diep = verdieping(a, bank, gebeurtenissen, { esc });

  const inhoud = `    <main>
        <section class="wr-wrap wr-kop ul-kop" id="inhoud">
            %KRUIMEL%
            <h1>Bouwdepot bij ${esc(a.naam)}</h1>
            <p class="wr-lead">Looptijd, verlenging, depotvergoeding, bewijsstukken en uitbetaling zoals ${esc(a.naam)} die zelf publiceert.</p>
            <p class="ui-opschrift">Gepubliceerde voorwaarden &middot; ${controle(a)}</p>
        </section>

        <section class="wr-wrap wr-sectie wr-sectie--vervolg">
            <div class="wr-kern ul-kern--twee">
                <div>
                    <p class="wr-kern__cijfer tnum">${tv ? tv.totaal : '&mdash;'}</p>
                    <p class="wr-kern__eenheid">maanden voor een verbouwing</p>
                    <p class="wr-kern__tekst">${tv && tv.zeker ? `${a.looptijdVerbouwMaanden} maanden standaard, plus ${v.verbouw} maanden verlenging.` : 'Verlenging niet gepubliceerd.'}</p>
                </div>
                <div>
                    <p class="wr-kern__cijfer tnum">${tn ? tn.totaal : '&mdash;'}</p>
                    <p class="wr-kern__eenheid">maanden voor nieuwbouw</p>
                    <p class="wr-kern__tekst">${tn && tn.zeker ? `${a.looptijdNieuwbouwMaanden} maanden standaard, plus ${v.nieuwbouw} maanden verlenging.` : 'Verlenging niet gepubliceerd.'}</p>
                </div>
            </div>
        </section>

        <section class="wr-wrap wr-sectie">
                <p class="ui-opschrift">Per onderwerp</p>
                <h2>Alle gepubliceerde voorwaarden</h2>
                <dl class="ul-detail">
${rijen}
                </dl>
        </section>
${diep.tijdlijn}
${diep.kosten}
${diep.declareren}
${vergelijkendeContext(a)}${diep.navragen}${
  a.bijzonderheden?.length
    ? `
        <section class="wr-wrap wr-sectie">
                <p class="ui-opschrift">Goed om te weten</p>
                <h2>Bijzonderheden</h2>
                <ul class="wr-lijst wr-proza">
${a.bijzonderheden.map((b) => `                    <li>${esc(b)}</li>`).join('\n')}
                </ul>
        </section>`
    : ''
}
        <section class="wr-wrap wr-sectie">
                <p class="ui-opschrift">Verantwoording</p>
                <h2>Bron en controle</h2>
                <div class="wr-proza">
                    <p>De gegevens op deze pagina komen uit de publieke informatie van ${esc(a.naam)}, geraadpleegd op ${datum(a.gecontroleerd)}:</p>
                    <ul class="ul-bronnen">
${bronnen.map((b) => `                        <li><a href="${esc(b)}" target="_blank" rel="noopener noreferrer nofollow">${esc(b)}</a></li>`).join('\n')}
                    </ul>
                    <p class="wr-voorbehoud">Voorwaarden wijzigen en kunnen per hypotheekvorm verschillen. Ziet u een afwijking? <a href="contact.html">Laat het weten</a>.</p>
                </div>
        </section>

        <section class="wr-wrap wr-sectie">
                <p class="ui-opschrift">Verder</p>
                <h2>Rekenen met deze voorwaarden</h2>
                <div class="wr-register">
                    <a href="${HUB}">
                        <strong>Alle aanbieders vergelijken</strong>
                        <span>Looptijd, vergoeding en bewijsstukken van ${data.aanbieders.length} geldverstrekkers naast elkaar.</span>
                    </a>
                    <a href="depotplanner.html">
                        <strong>Depotplanner</strong>
                        <span>Wanneer het depot afloopt en wanneer verlengen geregeld moet zijn, vanaf uw passeerdatum.</span>
                    </a>
                    <a href="bouwdepot-declaratie-afgewezen.html">
                        <strong>Declaratie afgewezen</strong>
                        <span>De redenen waarop een declaratie stukloopt, met de eisen per aanbieder.</span>
                    </a>
                </div>
        </section>

        <section class="wr-wrap">
${DISCLAIMER}
        </section>
    </main>`;

  const schema = [
    ldjson({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Bouwdepot bij ${a.naam}: de voorwaarden`,
      url: `${SITE}/${bestandsnaam(a)}`,
      dateModified: a.gecontroleerd,
      author: { '@type': 'Person', name: 'Simeon' },
      publisher: { '@type': 'Organization', name: 'BouwdepotCalculator.nl', url: SITE },
      isAccessibleForFree: true,
    }),
    ldjson({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Voorwaarden vergelijken', item: `${SITE}/${HUB}` },
        { '@type': 'ListItem', position: 3, name: a.naam },
      ],
    }),
  ].join('\n');

  return pagina({
    bestand: bestandsnaam(a),
    titel: `Bouwdepot ${a.naam}: voorwaarden en declareren`,
    omschrijving: `Bouwdepotvoorwaarden van ${a.naam}: looptijd, verlenging, vergoeding, uitbetaaltermijn en geaccepteerde bewijsstukken. Met bron en datum.`,
    kruimel: [{ naam: 'Voorwaarden vergelijken', href: HUB }, { naam: a.naam }],
    inhoud,
    schema,
  });
}

/**
 * Plaatst één aanbieder feitelijk tussen de andere. Uitsluitend beschrijvend:
 * "de kortste termijn in deze vergelijking" is een feit, "de slechtste bank" een oordeel.
 * Wordt berekend, zodat de tekst klopt zodra er aanbieders bijkomen.
 */
function vergelijkendeContext(a) {
  const punten = [];
  const anderen = data.aanbieders.filter((x) => x.id !== a.id);
  if (!anderen.length) return '';

  const totVan = (x, soort) => {
    const t = totaal(
      soort === 'verbouw' ? x.looptijdVerbouwMaanden : x.looptijdNieuwbouwMaanden,
      x.verlengingMaanden?.[soort]);
    return t && t.zeker ? t.totaal : null;
  };

  for (const soort of ['verbouw', 'nieuwbouw']) {
    const mij = totVan(a, soort);
    if (mij == null) continue;
    const rest = anderen.map((x) => totVan(x, soort)).filter((n) => n != null);
    if (rest.length < 2) continue;
    const label = soort === 'verbouw' ? 'een verbouwing van een bestaande woning' : 'nieuwbouw';
    const laagste = Math.min(mij, ...rest), hoogste = Math.max(mij, ...rest);
    if (mij === laagste && mij !== hoogste) {
      punten.push(`Voor ${label} is dit met ${mij} maanden inclusief verlenging de <strong>kortste</strong> termijn van de ${data.aanbieders.length} vergeleken aanbieders. De langste is ${hoogste} maanden.`);
    } else if (mij === hoogste && mij !== laagste) {
      punten.push(`Voor ${label} is dit met ${mij} maanden inclusief verlenging de <strong>langste</strong> termijn van de ${data.aanbieders.length} vergeleken aanbieders. De kortste is ${laagste} maanden.`);
    } else {
      punten.push(`Voor ${label} ligt de maximale termijn van ${mij} maanden tussen de kortste (${laagste}) en de langste (${hoogste}) in deze vergelijking.`);
    }
  }

  const geenRente = /^geen/i.test(a.rentevergoeding?.waarde || '');
  const metRente = anderen.filter((x) => !/^geen/i.test(x.rentevergoeding?.waarde || '')).length;
  if (geenRente && metRente) {
    punten.push(`Anders dan ${metRente} van de ${anderen.length} overige aanbieders wordt hier geen vergoeding over het depotsaldo betaald. Daar staat tegenover dat er ook geen rente wordt gerekend over het deel dat nog niet is opgenomen, waardoor een renteverliesberekening hier niet op dezelfde manier opgaat.`);
  } else if (!geenRente && anderen.some((x) => /^geen/i.test(x.rentevergoeding?.waarde || ''))) {
    punten.push(`Er wordt hier wel een vergoeding over het depotsaldo betaald. Dat is niet vanzelfsprekend: niet elke aanbieder in deze vergelijking doet dat.`);
  }

  // Bijna elke aanbieder laat de vergoeding eerder aflopen dan het depot zelf,
  // maar iedereen verwoordt dat anders. Niet tonen bij aanbieders zonder vergoeding.
  const rentetekst = `${a.rentevergoeding?.waarde || ''} ${a.rentevergoeding?.detail || ''}`;
  if (!geenRente && /beperkt|stopt|geen rente|eerste \d+ maanden|na \d+ maanden|maximaal \d+ maanden|voorbij \d+ jaar/i.test(rentetekst)) {
    punten.push(`Let op het verschil tussen de looptijd van het depot en de duur van de vergoeding: die lopen hier niet gelijk op. Het depot kan dus nog open staan terwijl er geen vergoeding meer tegenover staat.`);
  }

  const onbekend = ['maxPerOpname', 'verlengingAanvragen', 'doorlooptijdUitbetaling', 'voorschieten']
    .filter((k) => a[k] == null || a[k].status === 'niet-gepubliceerd');
  if (onbekend.length >= 2) {
    punten.push(`Van deze aanbieder zijn ${onbekend.length} gegevens niet publiek terug te vinden. Vraag die punten expliciet na bij uw adviseur voordat u tekent.`);
  }

  if (!punten.length) return '';

  return `
        <section class="wr-wrap wr-sectie">
                <p class="ui-opschrift">In verhouding</p>
                <h2>Hoe dit zich verhoudt tot de andere aanbieders</h2>
                <ul class="wr-lijst wr-proza">
${punten.map((p) => `                    <li>${p}</li>`).join('\n')}
                </ul>
                <p class="wr-voorbehoud ul-na-lijst">Beschrijft uitsluitend gepubliceerde voorwaarden; geen oordeel over welke aanbieder beter past. Zie <a href="${HUB}">de volledige vergelijking</a>.</p>
        </section>
`;
}

// ---------------------------------------------------------------- schrijven

const geschreven = [HUB];
fs.writeFileSync(path.join(ROOT, HUB), bouwHub());

for (const a of data.aanbieders) {
  fs.writeFileSync(path.join(ROOT, bestandsnaam(a)), bouwAanbieder(a));
  geschreven.push(bestandsnaam(a));
}

console.log(`${geschreven.length} pagina's gegenereerd uit ${data.aanbieders.length} aanbieders (schaal: ${SCHAAL} maanden):`);
for (const g of geschreven) console.log('  ' + g);

const verlopen = data.aanbieders.filter(isVerlopen);
if (verlopen.length) {
  console.log(`\nControle openstaand (ouder dan ${CONTROLE_INTERVAL_MAANDEN} maanden): ${verlopen.map((a) => a.naam).join(', ')}`);
}
