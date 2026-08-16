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

function isVerlopen(gecontroleerd) {
  const d = new Date(gecontroleerd + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + CONTROLE_INTERVAL_MAANDEN);
  return d < new Date();
}

function controle(a) {
  const v = isVerlopen(a.gecontroleerd);
  return `<span class="vgl-controle${v ? ' vgl-controle--verlopen' : ''}">${
    v ? 'controle openstaand &middot; ' : ''}gecontroleerd ${datum(a.gecontroleerd)}</span>`;
}

const bestandsnaam = (a) => `bouwdepot-${a.id}.html`;

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

    <link rel="stylesheet" href="/src/styles/design-system.css">
    <link rel="stylesheet" href="/src/styles/pagina.css">
</head>
<body class="ds">
    <header class="kop">
        <div class="ds-wrap kop__inner">
            <a class="merk" href="/">Bouwdepot<span>Calculator</span>.nl</a>
            <nav aria-label="Hoofdnavigatie">
${NAV.map(([h, t]) => `                <a href="${h}">${t}</a>`).join('\n')}
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
            <nav class="voet__links" aria-label="Voettekst">
${VOET.map(([h, t]) => `                <a href="${h}">${t}</a>`).join('\n')}
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
                        <div class="vgl-feit"><dt>Vergoeding over depot</dt><dd${geenRente ? ' class="vgl-leeg"' : ''}>${waarde(a.rentevergoeding)}</dd></div>
                        <div class="vgl-feit"><dt>Uitbetaling</dt><dd>${a.doorlooptijdUitbetaling?.digitaal ? esc(a.doorlooptijdUitbetaling.digitaal) : LEEG}</dd></div>
                        <div class="vgl-feit"><dt>Grens per opname</dt><dd>${waarde(a.maxPerOpname)}${
                          a.maxPerOpname?.detail ? `<small>${esc(a.maxPerOpname.detail)}</small>` : ''
                        }</dd></div>
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
                        <p>Loopt uw verbouwing uit voorbij de depottermijn, dan wordt het restant meestal afgelost op uw hypotheek. Het geld is niet weg, maar u kunt het niet meer voor de verbouwing gebruiken zonder nieuwe financiering. Verlenging is bij de meeste aanbieders eenmalig en moet vóór de einddatum worden aangevraagd.</p>
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
    titel: `Bouwdepot voorwaarden vergelijken (${data.aanbieders.length} geldverstrekkers) | BouwdepotCalculator.nl`,
    omschrijving: `Vergelijk de bouwdepotvoorwaarden van ${data.aanbieders.length} Nederlandse geldverstrekkers: looptijd, verlenging, depotvergoeding, uitbetaaltermijn en bewijsstukken. Met bron en controledatum per aanbieder.`,
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
    rij('Manier van opnemen',
      a.opnamemethode === 'declaratie' ? 'Declareren: bewijsstuk indienen, daarna uitbetaling' : esc(a.opnamemethode),
      a.opnamemethodeDetail),
    rij('Maximum per declaratie', waarde(a.maxPerOpname), a.maxPerOpname?.detail),
    rij('Minimum per declaratie', waarde(a.minPerOpname), a.minPerOpname?.detail),
    a.minimumDepot ? rij('Minimum depotbedrag', waarde(a.minimumDepot), a.minimumDepot?.detail) : '',
    rij('Doorlooptijd uitbetaling',
      a.doorlooptijdUitbetaling?.digitaal ? esc(a.doorlooptijdUitbetaling.digitaal) : LEEG,
      a.doorlooptijdUitbetaling?.post),
    rij('Vereist bewijsstuk', a.bewijsstuk ? esc(a.bewijsstuk) : LEEG),
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
    titel: `Bouwdepot ${a.naam}: voorwaarden, looptijd en declareren | BouwdepotCalculator.nl`,
    omschrijving: `De gepubliceerde bouwdepotvoorwaarden van ${a.naam}: looptijd, verlenging, depotvergoeding, uitbetaaltermijn en welke bewijsstukken worden geaccepteerd. Met bron en controledatum.`,
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

const verlopen = data.aanbieders.filter((a) => isVerlopen(a.gecontroleerd));
if (verlopen.length) {
  console.log(`\nControle openstaand (ouder dan ${CONTROLE_INTERVAL_MAANDEN} maanden): ${verlopen.map((a) => a.naam).join(', ')}`);
}
