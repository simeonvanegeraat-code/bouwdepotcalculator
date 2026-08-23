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
 * Ontwerp (zie ONTWERPPLAN.md): antwoord eerst. De vergelijking opent met wat
 * er te zien is, niet met een inleiding. Looptijden staan als balken op één
 * schaal, zodat je verschillen ziet in plaats van leest.
 *
 *   node scripts/build-voorwaarden.mjs
 */

import fs from 'fs';
import path from 'path';

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

const LEEG = '<span class="vgl-leeg">niet gepubliceerd</span>';
const NVT = '<span class="vgl-leeg">niet van toepassing</span>';

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
  return `<span class="vgl-controle${v ? ' vgl-controle--verlopen' : ''}">${
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
  if (typeof v.maandenVoorEinde !== 'number') {
    return { waarde: null, detail: v.detail || null };
  }
  const soort = v.soort === 'bericht-van-bank'
    ? `U krijgt ${v.maandenVoorEinde} maanden voor de einddatum bericht`
    : `Vanaf ${v.maandenVoorEinde} maanden voor de einddatum aan te vragen`;
  return { waarde: soort, detail: v.detail || null };
}
const tariefBerekenbaar = data.aanbieders.filter((a) =>
  ['gelijk-aan-hypotheekrente', 'hypotheekrente-min-1'].includes(a.rentevergoeding?.tarief?.verbouw)
).length;

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
  const detail = gat > 0
    ? `Het depot kan bij verbouwing tot ${max} maanden lopen. Over de laatste ${gat} maanden betaalt u wel rente maar ontvangt u geen vergoeding meer.`
    : 'De vergoeding loopt door tot het einde van de looptijd.';
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
  return `                        <div class="vgl-feit${opties.proza ? ' vgl-feit--proza' : ''}"><dt>${esc(label)}</dt><dd${
    opties.gedempt ? ' class="vgl-leeg"' : ''
  }>${inhoud}${detail}</dd></div>`;
}

/** Alle balken delen één schaal; anders zegt de lengte niets. */
const SCHAAL = Math.max(
  ...data.aanbieders.flatMap((a) => {
    const v = a.verlengingMaanden || {};
    return [totaal(a.looptijdVerbouwMaanden, v.verbouw), totaal(a.looptijdNieuwbouwMaanden, v.nieuwbouw)]
      .filter(Boolean).map((t) => t.totaal);
  })
);

/**
 * Eén looptijdbalk. Drie gevallen, en het onderscheid is wezenlijk:
 *
 *   1. Basis en verlenging bekend  -> massief plus gearceerd, totaal als getal
 *   2. Verlenging mogelijk, duur onbekend -> massief plus een open uiteinde, en
 *      "24 mnd +?" als waarde. Zonder die markering lijkt de basis het maximum,
 *      terwijl het werkelijke maximum hoger kan liggen.
 *   3. Geen verlenging gepubliceerd -> alleen de basis
 */
function balk(label, basis, extra, duurOnbekend = false) {
  if (typeof basis !== 'number') {
    return `<div class="vgl-balk__rij"><span class="vgl-balk__label">${label}</span><span class="vgl-balk__spoor"></span><span class="vgl-balk__waarde">${LEEG}</span></div>`;
  }

  const heeftVerlenging = typeof extra === 'number' && extra > 0;
  const som = basis + (heeftVerlenging ? extra : 0);
  const pctBasis = (basis / SCHAAL) * 100;
  const pctExtra = heeftVerlenging ? (extra / SCHAAL) * 100 : 0;

  let segmenten = `<span class="vgl-balk__vul" style="width:${pctBasis.toFixed(1)}%"></span>`;
  if (heeftVerlenging) {
    segmenten += `<span class="vgl-balk__vul vgl-balk__vul--verlenging" style="width:${pctExtra.toFixed(1)}%"></span>`;
  } else if (duurOnbekend) {
    // Vaste, korte breedte: de duur is onbekend, dus de balk mag geen lengte suggereren.
    segmenten += `<span class="vgl-balk__vul vgl-balk__vul--open" aria-hidden="true"></span>`;
  }

  const waarde = heeftVerlenging || !duurOnbekend
    ? `${som} mnd`
    : `${basis} mnd <span class="vgl-balk__open-teken" title="verlenging mogelijk, duur niet gepubliceerd">+?</span>`;

  return `<div class="vgl-balk__rij">
                            <span class="vgl-balk__label">${label}</span>
                            <span class="vgl-balk__spoor"><span class="vgl-balk__stapel">${segmenten}</span></span>
                            <span class="vgl-balk__waarde">${waarde}</span>
                        </div>`;
}

// ---------------------------------------------------------------- shell

const NAV = [
  ['/', 'Bereken'],
  [HUB, 'Voorwaarden per bank'],
  ['kennisbank.html', 'Uitleg'],
  ['over-ons.html', 'Over ons'],
];

const VOET = [
  ['/', 'Home'],
  ['verbouwbegroting.html', 'Verbouwbegroting'],
  ['leenruimte.html', 'Leenruimte'],
  ['depotplanner.html', 'Depotplanner'],
  [HUB, 'Voorwaarden per bank'],
  ['kennisbank.html', 'Kennisbank'],
  ['over-ons.html', 'Over ons'],
  ['methodologie.html', 'Methodologie'],
  ['contact.html', 'Contact'],
  ['privacy.html', 'Privacy'],
  ['cookies.html', 'Cookies'],
  ['voorwaarden.html', 'Voorwaarden'],
];

function pagina({ bestand, titel, omschrijving, kruimel, inhoud, schema }) {
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

    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9252617114074571"
      crossorigin="anonymous"></script>

    <!-- Vercel Web Analytics: cookieloos. Geen cookie en geen localStorage; de
         bezoeker wordt herkend aan een hash van het verzoek die na 24 uur
         vervalt. Wat er wel wordt vastgelegd staat in privacy.html. -->
    <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
    <script defer src="/_vercel/insights/script.js"></script>

    <link rel="stylesheet" href="/src/styles/design-system.css">
    <link rel="stylesheet" href="/src/styles/pagina.css">
</head>
<body class="ds">
    <header class="kop">
        <div class="ds-wrap kop__inner">
            <a class="merk" href="/">Bouwdepot<span>Calculator</span><b>.nl</b></a>
            <nav aria-label="Hoofdnavigatie">
                <details class="kop__menu">
                    <summary><span class="kop__streepjes" aria-hidden="true"></span>Menu</summary>
                </details>
                <div class="kop__paneel">
${NAV.map(([h, t]) => `                        <a href="${h}">${t}</a>`).join('\n')}
                </div>
            </nav>
        </div>
    </header>

    <nav class="kruimel" aria-label="Kruimelpad">
      <div class="ds-wrap">
        <ol>
          <li><a href="/">Home</a></li>
${kruimel.map((k) => (k.href ? `          <li><a href="${k.href}">${esc(k.naam)}</a></li>` : `          <li aria-current="page">${esc(k.naam)}</li>`)).join('\n')}
        </ol>
      </div>
    </nav>

${inhoud}

    <footer class="voet">
        <div class="ds-wrap">
            <nav class="voet__kolommen" aria-label="Voettekst">
                <div class="voet__groep">
                    <p class="voet__kop" id="voet-verbouwen">Verbouwen</p>
                    <ul aria-labelledby="voet-verbouwen">
                        <li><a href="verbouwbegroting.html">Verbouwbegroting</a></li>
                        <li><a href="leenruimte.html">Leenruimte</a></li>
                        <li><a href="maandlasten-bouwdepot.html">Maandlasten bouwdepot</a></li>
                        <li><a href="renteverlies-bouwdepot.html">Renteverlies</a></li>
                        <li><a href="belasting.html">Belastingvoordeel</a></li>
                    </ul>
                </div>
                <div class="voet__groep">
                    <p class="voet__kop" id="voet-nieuwbouw">Nieuwbouw</p>
                    <ul aria-labelledby="voet-nieuwbouw">
                        <li><a href="nieuwbouw.html">Nieuwbouwplanning</a></li>
                        <li><a href="bouwrente-nieuwbouw.html">Bouwrente</a></li>
                        <li><a href="dubbele-lasten-nieuwbouw.html">Dubbele lasten</a></li>
                        <li><a href="depotplanner.html">Depotplanner</a></li>
                    </ul>
                </div>
                <div class="voet__groep">
                    <p class="voet__kop" id="voet-uitleg">Uitleg en hulpmiddelen</p>
                    <ul aria-labelledby="voet-uitleg">
                        <li><a href="kennisbank.html">Kennisbank</a></li>
                        <li><a href="bouwdepot-voorwaarden-vergelijken.html">Voorwaarden per bank</a></li>
                        <li><a href="stappenplan.html">Stappenplan</a></li>
                        <li><a href="adviesgesprek-checklist.html">Adviesgesprek-checklist</a></li>
                        <li><a href="bouwdepot-declaratie-afgewezen.html">Declaratie afgewezen</a></li>
                    </ul>
                </div>
                <div class="voet__groep">
                    <p class="voet__kop" id="voet-site">Over deze site</p>
                    <ul aria-labelledby="voet-site">
                        <li><a href="/">Home</a></li>
                        <li><a href="over-ons.html">Over ons</a></li>
                        <li><a href="methodologie.html">Methodologie</a></li>
                        <li><a href="contact.html">Contact</a></li>
                        <li><a href="privacy.html">Privacy</a></li>
                        <li><a href="cookies.html">Cookies</a></li>
                        <li><a href="voorwaarden.html">Voorwaarden</a></li>
                    </ul>
                </div>
            </nav>
            <p class="ds-caption">&copy; 2026 BouwdepotCalculator.nl &middot; Onafhankelijk informatieplatform, geen aanbieder van hypotheken.</p>
        </div>
    </footer>
${schema}
</body>
</html>
`;
}

/** Verplichte onafhankelijkheidsverklaring. Staat op elke gegenereerde pagina. */
const DISCLAIMER = `                <aside class="melding">
                    <p><strong>Onafhankelijk en zonder samenwerking.</strong> Wij zijn niet verbonden aan, en werken niet samen met, de genoemde geldverstrekkers. Deze pagina vergelijkt gepubliceerde voorwaarden en bevat geen aanbeveling, rangorde of persoonlijk advies.</p>
                    <p>Voorwaarden verschillen per hypotheekvorm en kunnen in uw offerte afwijken. Elke aanbieder vermeldt de bron en de controledatum.</p>
                </aside>`;

const ldjson = (obj) => `    <script type="application/ld+json">
    ${JSON.stringify(obj, null, 2).replace(/\n/g, '\n    ')}
    </script>`;

// ---------------------------------------------------------------- hub

function bouwHub() {
  const items = data.aanbieders.map((a) => {
    const v = a.verlengingMaanden || {};
    const geenRente = /^geen/i.test(a.rentevergoeding?.waarde || '');
    return `                <article class="vgl-item">
                    <div class="vgl-item__kop">
                        <h3 class="vgl-item__naam"><a href="${bestandsnaam(a)}">${esc(a.naam)}</a></h3>
                        ${controle(a)}
                    </div>

                    <div class="vgl-balken">
${balk('Verbouwing', a.looptijdVerbouwMaanden, v.verbouw, v.mogelijkMaarDuurOnbekend)}
${balk('Nieuwbouw', a.looptijdNieuwbouwMaanden, v.nieuwbouw, v.mogelijkMaarDuurOnbekend)}
                    </div>

                    <dl class="vgl-feiten">
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
${feit('Minimum per opname', a.minPerOpname)}
${feit('Eigen arbeid declarabel', a.eigenArbeid)}
${feit('Restant bij beëindiging', a.restant)}
                    </dl>
                </article>`;
  }).join('\n');

  const inhoud = `    <main>
        <section class="ds-wrap ds-sectie">
            <div class="ds-sectiekop">
                <p class="ds-eyebrow">Eigen onderzoek &middot; ${data.aanbieders.length} geldverstrekkers</p>
                <h1 class="ds-heading">Bouwdepot voorwaarden vergelijken</h1>
                <p class="ds-lead">Dezelfde productnaam, sterk uiteenlopende voorwaarden. Hoe lang u de tijd krijgt, of u rente ontvangt en wat als bewijsstuk telt, verschilt per bank.</p>
            </div>

${bouwKerncijfers()}
        </section>

        <section class="ds-sectie ds-sectie--gevuld">
            <div class="ds-wrap">
                <div class="ds-sectiekop">
                    <h2 class="ds-title">Alle aanbieders naast elkaar</h2>
                    <p class="ds-lead">De balken tonen de maximale looptijd inclusief verlenging, op dezelfde schaal. Het gearceerde deel is de verlenging.</p>
                </div>

                <div class="vgl-schaal" aria-hidden="true">
                    <span></span>
                    <span class="vgl-schaal__as"><span>0</span><span>${Math.round(SCHAAL / 2)} mnd</span><span>${SCHAAL} mnd</span></span>
                </div>

                <div class="vgl-legenda">
                    <span class="vgl-legenda__item"><span class="vgl-legenda__staal vgl-legenda__staal--basis"></span>Standaardlooptijd</span>
                    <span class="vgl-legenda__item"><span class="vgl-legenda__staal vgl-legenda__staal--verlenging"></span>Verlenging</span>
                    <span class="vgl-legenda__item"><span class="vgl-legenda__staal vgl-legenda__staal--open"></span>Verlenging mogelijk, duur niet gepubliceerd</span>
                </div>

                <div class="vgl-lijst">
${items}
                </div>

                <p class="ds-caption" style="margin-top: var(--ds-5)">Klopt een gegeven niet meer? <a href="contact.html">Laat het weten</a> met een link naar de actuele voorwaarden.</p>
            </div>
        </section>

        <section class="ds-sectie">
            <div class="ds-wrap">
${DISCLAIMER}
            </div>
        </section>

        <section class="ds-sectie">
            <div class="ds-wrap ds-wrap--smal">
                <div class="ds-sectiekop">
                    <p class="ds-eyebrow">Waarom dit ertoe doet</p>
                    <h2 class="ds-title">Drie voorwaarden die uw verbouwing kunnen bepalen</h2>
                </div>

                <div class="uitleg">
                    <article>
                        <h3>De looptijd is een harde grens</h3>
                        <p>Loopt uw verbouwing uit voorbij de depottermijn, dan wordt het restant meestal afgelost op uw hypotheek. Het geld is niet weg, maar u kunt het niet meer voor de verbouwing gebruiken zonder nieuwe financiering. Verlenging is bij de meeste aanbieders eenmalig en moet vóór de einddatum worden aangevraagd. De <a href="depotplanner.html">depotplanner</a> rekent die datums voor u uit vanaf uw passeerdatum.</p>
                    </article>
                    <article>
                        <h3>Niet iedereen betaalt rente over uw depot</h3>
                        <p>De meeste aanbieders vergoeden rente over het bedrag dat nog in het depot staat, vaak gelijk aan uw hypotheekrente. Maar niet allemaal, en niet altijd de hele looptijd. Er bestaat ook een model waarbij u alleen rente betaalt over wat u al hebt opgenomen; dan is er geen vergoeding, maar ook geen renteverlies. Zie de <a href="renteverlies-bouwdepot.html">renteverliesberekening</a>.</p>
                    </article>
                    <article>
                        <h3>Een bon is niet overal een factuur</h3>
                        <p>Sommige aanbieders accepteren een kassabon, andere uitsluitend een factuur op naam met KvK- en btw-nummer. Offertes en pro-formafacturen worden vrijwel nergens geaccepteerd. Dat verschil bepaalt hoe u uw inkopen organiseert. Bekijk ook de <a href="bouwdepot-fouten.html">veelgemaakte fouten bij declaraties</a>.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="ds-sectie ds-sectie--gevuld">
            <div class="ds-wrap ds-wrap--smal">
                <div class="ds-sectiekop">
                    <p class="ds-eyebrow">Twee bewuste keuzes</p>
                    <h2 class="ds-title">Wat u hier niet vindt, en waarom</h2>
                </div>

                <div class="uitleg">
                    <article>
                        <h3>Geen rentepercentages, wel de rekenregel</h3>
                        <p>Wij publiceren geen hypotheekrentes. Een rente hangt af van de rentevastperiode, van de verhouding tussen uw lening en de woningwaarde en soms van het energielabel. Dat zijn tientallen waarden per aanbieder die wekelijks wijzigen, en een rente van twee dagen oud is simpelweg onjuist.</p>
                        <p>Wat wel stabiel is, is de <strong>regel</strong> waarmee een aanbieder de depotvergoeding aan uw eigen hypotheekrente koppelt. Die staat hierboven per aanbieder: gelijk aan uw rente, een procentpunt lager, of geen vergoeding. Bij ${tariefBerekenbaar} van de ${data.aanbieders.length} aanbieders is de vergoeding daarmee uit te rekenen zodra u uw eigen rente invult, en dat doen de <a href="maandlasten-bouwdepot.html">maandlastberekening</a> en de <a href="renteverlies-bouwdepot.html">renteverliesberekening</a> ook. Die uitkomst gaat over uw eigen offerte in plaats van over een marktgemiddelde, en veroudert niet.</p>
                    </article>
                    <article>
                        <h3>Wat geen enkele aanbieder publiceert</h3>
                        <p>Drie gegevens ontbreken bij alle ${data.aanbieders.length}: het <strong>minimumbedrag per opname</strong>, de <strong>grens per opname</strong> bij aanbieders zonder declaratieproces, en of <strong>eigen arbeid</strong> declarabel is. Dat laatste is de meest gestelde vraag van wie zelf klust, en niemand geeft er publiek antwoord op.</p>
                        <p>Wij vullen die gaten niet met een aanname. Ze staan hierboven als &quot;niet gepubliceerd&quot;, en dat is zelf het antwoord: <strong>u moet dit schriftelijk navragen en het antwoord bewaren</strong>. Een mondelinge toezegging helpt u niet als een declaratie later wordt afgewezen. De <a href="adviesgesprek-checklist.html">advieschecklist</a> heeft hier vragen voor staan.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="ds-sectie ds-sectie--diep">
            <div class="ds-wrap ds-wrap--smal">
                <p class="ds-eyebrow">Verantwoording</p>
                <h2 class="ds-title">Hoe deze pagina tot stand komt</h2>
                <p style="margin-top: var(--ds-4)">Elk gegeven komt uit de officiële, publiek toegankelijke voorwaarden van de betreffende aanbieder. De bron staat bij iedere aanbieder vermeld met de datum waarop die is geraadpleegd.</p>
                <p>Waar een aanbieder iets niet publiceert, staat <em>niet gepubliceerd</em>. Er wordt niets geschat of afgeleid. Dat een aanbieder geen minimum declaratiebedrag noemt, is zelf bruikbare informatie.</p>
                <p>Voorwaarden wijzigen. Deze pagina claimt daarom geen permanente actualiteit, maar vermeldt per aanbieder wanneer de gegevens voor het laatst zijn gecontroleerd. Lees ook de <a href="methodologie.html">volledige methodologie</a>.</p>
            </div>
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
  });
}

/** Antwoord eerst: wat je in de cijfers ziet, voordat de lijst begint. */
function bouwKerncijfers() {
  const spans = data.aanbieders
    .map((a) => totaal(a.looptijdVerbouwMaanden, a.verlengingMaanden?.verbouw))
    .filter((t) => t && t.zeker).map((t) => t.totaal);

  const kaarten = [];

  if (spans.length >= 2) {
    const min = Math.min(...spans), max = Math.max(...spans);
    if (max !== min) {
      kaarten.push({
        cijfer: `${min}&ndash;${max}`,
        eenheid: 'maanden',
        tekst: `Zoveel tijd krijgt u voor een verbouwing, inclusief verlenging. Een verschil van ${max - min} maanden tussen de ruimste en de krapste aanbieder.`,
      });
    }
  }

  const zonder = data.aanbieders.filter((a) => /^geen/i.test(a.rentevergoeding?.waarde || '')).length;
  kaarten.push({
    cijfer: `${data.aanbieders.length - zonder}<span class="kern__van">/${data.aanbieders.length}</span>`,
    eenheid: 'betaalt depotrente',
    tekst: zonder
      ? `${zonder === 1 ? 'Eén aanbieder' : `${zonder} aanbieders`} vergoedt niets over het depotsaldo, maar rekent daar ook geen rente over.`
      : 'Alle vergeleken aanbieders vergoeden rente over het saldo dat nog in het depot staat.',
  });

  const gaten = data.aanbieders.reduce(
    (n, a) => n + ['maxPerOpname', 'minPerOpname', 'restant', 'eigenArbeid'].filter((k) => a[k]?.status === 'niet-gepubliceerd').length, 0);
  if (gaten) {
    kaarten.push({
      cijfer: gaten,
      eenheid: 'niet gepubliceerd',
      tekst: 'Zoveel gegevens maken de aanbieders niet openbaar, vooral bedragen per declaratie en de regels rond eigen arbeid. Vraag die na vóór u tekent.',
    });
  }

  return `            <div class="kern">
${kaarten.map((k) => `                <div class="kern__item">
                    <p class="kern__cijfer tnum">${k.cijfer}</p>
                    <p class="kern__eenheid">${k.eenheid}</p>
                    <p class="kern__tekst">${k.tekst}</p>
                </div>`).join('\n')}
            </div>`;
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
      a.verlengingAanvragen?.maandenVoorEinde == null
        ? LEEG
        : a.verlengingAanvragen.soort === 'bericht-van-bank'
          ? `Bericht van de aanbieder ${a.verlengingAanvragen.maandenVoorEinde} maanden voor de einddatum`
          : `Zelf aanvragen, vanaf ${a.verlengingAanvragen.maandenVoorEinde} maanden voor de einddatum`,
      a.verlengingAanvragen?.detail),
    rij('Manier van opnemen',
      a.opnamemethode === 'declaratie' ? 'Declareren: bewijsstuk indienen, daarna uitbetaling' : esc(a.opnamemethode),
      a.opnamemethodeDetail),
    rij('Maximum per declaratie', waarde(a.maxPerOpname), a.maxPerOpname?.detail),
    rij('Minimum per declaratie', waarde(a.minPerOpname), a.minPerOpname?.detail),
    a.minimumDepot ? rij('Minimum depotbedrag', waarde(a.minimumDepot), a.minimumDepot?.detail) : '',
    rij('Doorlooptijd uitbetaling',
      a.doorlooptijdUitbetaling?.digitaal ? esc(a.doorlooptijdUitbetaling.digitaal) : LEEG,
      a.doorlooptijdUitbetaling?.post),
    rij('Zelf voorschieten en terugvragen', waarde(a.voorschieten), a.voorschieten?.detail),
    // Las eerder a.bewijsstuk, een veld dat bij vrijwel geen aanbieder bestaat en
    // nergens werd gevuld; daardoor stond deze rij op alle aanbiederpagina's leeg
    // terwijl het antwoord in declaratieEisen staat.
    rij('Vereist bewijsstuk', waarde(bewijsVeld(a)), bewijsVeld(a).detail),
    rij('Ouderdom van de factuur', waarde(eisVeld(a, 'factuurouderdom')), eisVeld(a, 'factuurouderdom').detail),
    rij('Wat u mag declareren', a.declarabel ? esc(a.declarabel) : LEEG),
    rij('Restant bij beëindiging', waarde(a.restant), a.restant?.detail),
    rij('Eigen arbeid', waarde(a.eigenArbeid), a.eigenArbeid?.detail),
  ].filter(Boolean).join('\n');

  const inhoud = `    <main>
        <section class="ds-wrap ds-sectie">
            <div class="ds-sectiekop">
                <p class="ds-eyebrow">Gepubliceerde voorwaarden</p>
                <h1 class="ds-heading">Bouwdepot bij ${esc(a.naam)}</h1>
                <p class="ds-lead">Looptijd, verlenging, depotvergoeding, bewijsstukken en uitbetaling zoals ${esc(a.naam)} die zelf publiceert.</p>
                <p style="margin-top: var(--ds-3)">${controle(a)}</p>
            </div>

            <div class="kern kern--twee">
                <div class="kern__item">
                    <p class="kern__cijfer tnum">${tv ? tv.totaal : '&mdash;'}</p>
                    <p class="kern__eenheid">maanden voor een verbouwing</p>
                    <p class="kern__tekst">${tv && tv.zeker ? `${a.looptijdVerbouwMaanden} maanden standaard, plus ${v.verbouw} maanden verlenging.` : 'Verlenging niet gepubliceerd.'}</p>
                </div>
                <div class="kern__item">
                    <p class="kern__cijfer tnum">${tn ? tn.totaal : '&mdash;'}</p>
                    <p class="kern__eenheid">maanden voor nieuwbouw</p>
                    <p class="kern__tekst">${tn && tn.zeker ? `${a.looptijdNieuwbouwMaanden} maanden standaard, plus ${v.nieuwbouw} maanden verlenging.` : 'Verlenging niet gepubliceerd.'}</p>
                </div>
            </div>
        </section>

        <section class="ds-sectie ds-sectie--gevuld">
            <div class="ds-wrap">
                <h2 class="ds-title" style="margin-bottom: var(--ds-4)">Alle gepubliceerde voorwaarden</h2>
                <div class="ds-card">
                    <dl class="vgl-detail">
${rijen}
                    </dl>
                </div>
            </div>
        </section>
${vergelijkendeContext(a)}${
  a.bijzonderheden?.length
    ? `
        <section class="ds-sectie">
            <div class="ds-wrap ds-wrap--smal">
                <h2 class="ds-title" style="margin-bottom: var(--ds-4)">Bijzonderheden</h2>
                <ul class="punten">
${a.bijzonderheden.map((b) => `                    <li>${esc(b)}</li>`).join('\n')}
                </ul>
            </div>
        </section>`
    : ''
}
        <section class="ds-sectie">
            <div class="ds-wrap ds-wrap--smal">
${DISCLAIMER}

                <h2 class="ds-title" style="margin: var(--ds-6) 0 var(--ds-3)">Bron en controle</h2>
                <p>De gegevens op deze pagina komen uit de publieke informatie van ${esc(a.naam)}, geraadpleegd op ${datum(a.gecontroleerd)}:</p>
                <ul class="bronnen">
${bronnen.map((b) => `                    <li><a href="${esc(b)}" target="_blank" rel="noopener noreferrer nofollow">${esc(b)}</a></li>`).join('\n')}
                </ul>
                <p class="ds-caption">Voorwaarden wijzigen en kunnen per hypotheekvorm verschillen. Ziet u een afwijking? <a href="contact.html">Laat het weten</a>.</p>

                <p style="margin-top: var(--ds-6)">
                    <a class="ds-knop ds-knop--primair" href="${HUB}">Alle aanbieders vergelijken</a>
                </p>
            </div>
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

  const onbekend = ['maxPerOpname', 'minPerOpname', 'restant', 'eigenArbeid'].filter((k) => a[k]?.status === 'niet-gepubliceerd');
  if (onbekend.length >= 2) {
    punten.push(`Van deze aanbieder zijn ${onbekend.length} gegevens niet publiek terug te vinden. Vraag die punten expliciet na bij uw adviseur voordat u tekent.`);
  }

  if (!punten.length) return '';

  return `
        <section class="ds-sectie ds-sectie--diep">
            <div class="ds-wrap ds-wrap--smal">
                <p class="ds-eyebrow">In verhouding</p>
                <h2 class="ds-title">Hoe dit zich verhoudt tot de andere aanbieders</h2>
                <ul class="punten" style="margin-top: var(--ds-4)">
${punten.map((p) => `                    <li>${p}</li>`).join('\n')}
                </ul>
                <p class="ds-caption" style="margin-top: var(--ds-4)">Beschrijft uitsluitend gepubliceerde voorwaarden; geen oordeel over welke aanbieder beter past. Zie <a href="${HUB}">de volledige vergelijking</a>.</p>
            </div>
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
