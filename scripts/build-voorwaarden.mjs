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

/** Een cel waarvan de waarde niet publiek is, blijft expliciet leeg. Nooit schatten. */
function cel(veld) {
  if (!veld) return '<span class="cel-onbekend">niet gepubliceerd</span>';
  if (veld.status === 'niet-gepubliceerd' || veld.waarde == null && veld.bedrag == null) {
    return '<span class="cel-onbekend">niet gepubliceerd</span>';
  }
  if (typeof veld.bedrag === 'number') return '&euro; ' + veld.bedrag.toLocaleString('nl-NL');
  return esc(veld.waarde);
}

const maanden = (n) => (typeof n === 'number' ? n + ' mnd' : '<span class="cel-onbekend">niet gepubliceerd</span>');

/** Totale looptijd inclusief verlenging, alleen als beide bekend zijn. */
function totaal(basis, extra) {
  if (typeof basis !== 'number') return null;
  if (typeof extra !== 'number') return { totaal: basis, zeker: false };
  return { totaal: basis + extra, zeker: true };
}

function looptijdCel(basis, extra, eenmalig) {
  if (typeof basis !== 'number') return '<span class="cel-onbekend">niet gepubliceerd</span>';
  const t = totaal(basis, extra);
  if (!t.zeker) return `<strong>${basis} mnd</strong><span class="cel-detail">verlenging niet gepubliceerd</span>`;
  const hoe = eenmalig === false ? 'in twee stappen' : 'eenmalig';
  return `<strong>${t.totaal} mnd</strong><span class="cel-detail">${basis} + ${extra} ${hoe}</span>`;
}

function isVerlopen(gecontroleerd) {
  const d = new Date(gecontroleerd + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + CONTROLE_INTERVAL_MAANDEN);
  return d < new Date();
}

function controleBadge(a) {
  const verlopen = isVerlopen(a.gecontroleerd);
  return `<span class="controle-badge${verlopen ? ' controle-badge--verlopen' : ''}">${
    verlopen ? 'controle openstaand &middot; ' : ''
  }gecontroleerd ${datum(a.gecontroleerd)}</span>`;
}

// ---------------------------------------------------------------- shell

const NAV = fs
  .readFileSync(path.join(ROOT, 'over-ons.html'), 'utf8')
  .match(/<header class="site-header">[\s\S]*?<\/header>/)[0];

const FOOTER = fs
  .readFileSync(path.join(ROOT, 'over-ons.html'), 'utf8')
  .match(/<footer>[\s\S]*?<\/footer>/)[0];

const ADS = `    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9252617114074571"
      crossorigin="anonymous"></script>`;

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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">

${ADS}

    <link rel="stylesheet" href="/src/styles/main.css">
    <script type="module" src="/src/js/nav.js"></script>
</head>
<body>
${NAV}

    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <div class="container">
        <ol>
          <li><a href="/">Home</a></li>
${kruimel.map((k) => (k.href ? `          <li><a href="${k.href}">${esc(k.naam)}</a></li>` : `          <li aria-current="page">${esc(k.naam)}</li>`)).join('\n')}
        </ol>
      </div>
    </nav>

${inhoud}

${FOOTER}

    <script type="module" src="/src/js/main.js"></script>
${schema}
</body>
</html>
`;
}

/** Verplichte onafhankelijkheidsverklaring. Staat op elke gegenereerde pagina. */
const DISCLAIMER = `        <aside class="voorwaarden-disclaimer">
            <p><strong>Onafhankelijk en zonder samenwerking.</strong> BouwdepotCalculator.nl is niet verbonden aan, en werkt niet samen met, de genoemde geldverstrekkers. Deze pagina vergelijkt uitsluitend gepubliceerde voorwaarden en bevat geen aanbeveling, rangorde of persoonlijk advies.</p>
            <p>Voorwaarden verschillen per hypotheekvorm en kunnen in uw offerte afwijken. Elke regel vermeldt de bron en de datum waarop die is gecontroleerd. Controleer altijd de actuele voorwaarden van uw eigen geldverstrekker.</p>
        </aside>`;

// ---------------------------------------------------------------- hub

function bouwHub() {
  const rijen = data.aanbieders
    .map((a) => {
      const v = a.verlengingMaanden || {};
      return `                        <tr>
                            <th scope="row"><a href="${bestandsnaam(a)}">${esc(a.naam)}</a>${controleBadge(a)}</th>
                            <td>${looptijdCel(a.looptijdVerbouwMaanden, v.verbouw, v.eenmalig)}</td>
                            <td>${looptijdCel(a.looptijdNieuwbouwMaanden, v.nieuwbouw, v.eenmalig)}</td>
                            <td>${cel(a.rentevergoeding)}</td>
                            <td>${a.doorlooptijdUitbetaling?.digitaal ? esc(a.doorlooptijdUitbetaling.digitaal) : '<span class="cel-onbekend">niet gepubliceerd</span>'}</td>
                            <td>${cel(a.maxPerOpname)}</td>
                        </tr>`;
    })
    .join('\n');

  const inhoud = `    <main class="container editorial-shell">
        <section class="editorial-hero">
            <p class="editorial-eyebrow">Feitenvergelijking &middot; ${data.aanbieders.length} geldverstrekkers</p>
            <h1>Bouwdepot voorwaarden vergelijken per geldverstrekker</h1>
            <p class="editorial-lead">Hoe lang mag u over de verbouwing doen, krijgt u rente over het depot, en wat accepteert uw bank als bewijsstuk? Die voorwaarden verschillen sterk, terwijl ze zelden naast elkaar staan.</p>
            <p class="editorial-meta">Samengesteld uit de officiële voorwaarden van de aanbieders &middot; laatst bijgewerkt ${datum(data._laatstBijgewerkt)}</p>
        </section>

${DISCLAIMER}

        <section class="editorial-section">
            <h2>De vergelijking in één tabel</h2>
            <p>De looptijdkolommen tonen de <strong>maximale</strong> duur inclusief verlenging, met daaronder hoe die is opgebouwd. Klik op een aanbieder voor de volledige voorwaarden en de bron.</p>
            <div class="policy-table-wrap">
                <table class="policy-table voorwaarden-tabel">
                    <caption class="voorwaarden-caption">Gepubliceerde bouwdepotvoorwaarden per geldverstrekker. Lege cellen betekenen dat de aanbieder dit niet openbaar maakt.</caption>
                    <thead>
                        <tr>
                            <th scope="col">Geldverstrekker</th>
                            <th scope="col">Verbouwing, max.</th>
                            <th scope="col">Nieuwbouw, max.</th>
                            <th scope="col">Vergoeding over depot</th>
                            <th scope="col">Uitbetaling</th>
                            <th scope="col">Max. per declaratie</th>
                        </tr>
                    </thead>
                    <tbody>
${rijen}
                    </tbody>
                </table>
            </div>
            <p class="voorwaarden-melding">Klopt een gegeven niet meer? <a href="contact.html">Meld het via de contactpagina</a> met een link naar de actuele voorwaarden, dan pas ik het aan.</p>
        </section>

        <section class="editorial-section">
            <h2>Wat opvalt in de cijfers</h2>
            <div class="limit-grid">
${bouwObservaties()}
            </div>
            <p class="source-note">Deze constateringen beschrijven de verschillen tussen gepubliceerde voorwaarden. Ze zijn geen oordeel over welke aanbieder beter is; dat hangt af van uw situatie, rente, hypotheekvorm en acceptatie.</p>
        </section>

        <section class="editorial-section">
            <h2>Waarom deze voorwaarden ertoe doen</h2>
            <div class="editorial-split">
                <div>
                    <p class="editorial-eyebrow">Looptijd</p>
                    <h3>De grens is hard</h3>
                </div>
                <div>
                    <p>Loopt uw verbouwing uit voorbij de depottermijn, dan wordt het restant meestal afgelost op uw hypotheek. Het geld is dan niet weg, maar u kunt het niet meer voor de verbouwing gebruiken zonder nieuwe financiering.</p>
                    <p>Verlenging is bij de meeste aanbieders eenmalig en moet vóór de einddatum worden aangevraagd. Wie dat moment mist, heeft geen tweede kans.</p>
                </div>
            </div>
            <div class="editorial-split">
                <div>
                    <p class="editorial-eyebrow">Depotvergoeding</p>
                    <h3>Niet iedere aanbieder betaalt rente</h3>
                </div>
                <div>
                    <p>De meeste aanbieders vergoeden rente over het bedrag dat nog in het depot staat, vaak gelijk aan uw hypotheekrente. Maar niet allemaal, en niet altijd gedurende de hele looptijd.</p>
                    <p>Er bestaat ook een fundamenteel ander model, waarbij u alleen rente betaalt over wat u al hebt opgenomen en er dus geen vergoeding tegenover staat. Reken daarom nooit met een vergoedingspercentage zonder te controleren of uw aanbieder er een hanteert. Zie ook de <a href="renteverlies-bouwdepot.html">renteverliesberekening</a>.</p>
                </div>
            </div>
            <div class="editorial-split">
                <div>
                    <p class="editorial-eyebrow">Bewijsstukken</p>
                    <h3>Een bon is niet overal een factuur</h3>
                </div>
                <div>
                    <p>Sommige aanbieders accepteren een kassabon, andere uitsluitend een op naam gestelde factuur. Offertes, orderbevestigingen en pro-formafacturen worden vrijwel nergens geaccepteerd.</p>
                    <p>Dat verschil bepaalt hoe u uw inkopen moet organiseren. Bekijk ook de <a href="bouwdepot-fouten.html">veelgemaakte fouten bij declaraties</a>.</p>
                </div>
            </div>
        </section>

        <section class="editorial-section">
            <h2>Hoe deze pagina tot stand komt</h2>
            <p>Elk gegeven komt uit de officiële, publiek toegankelijke voorwaarden of klantinformatie van de betreffende aanbieder. De bron staat bij iedere aanbieder vermeld met de datum waarop die is geraadpleegd.</p>
            <p>Waar een aanbieder een gegeven niet publiceert, staat <em>niet gepubliceerd</em>. Er wordt niets geschat of afgeleid. Dat een aanbieder bijvoorbeeld geen minimum declaratiebedrag noemt, is zelf bruikbare informatie.</p>
            <p>Voorwaarden wijzigen. Deze pagina claimt daarom geen permanente actualiteit, maar vermeldt per aanbieder wanneer de gegevens voor het laatst zijn gecontroleerd. Lees ook de <a href="methodologie.html">volledige methodologie</a>.</p>
        </section>

        <section class="editorial-section">
            <h2>Alle aanbieders afzonderlijk</h2>
            <div class="resource-grid">
${data.aanbieders.map((a) => `                <a class="resource-card" href="${bestandsnaam(a)}"><strong>${esc(a.naam)}</strong><span>Volledige bouwdepotvoorwaarden en bron.</span></a>`).join('\n')}
            </div>
        </section>
    </main>`;

  const schema = `    <script type="application/ld+json">
    ${JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Bouwdepot voorwaarden vergelijken per geldverstrekker',
        description: `Feitelijke vergelijking van de gepubliceerde bouwdepotvoorwaarden van ${data.aanbieders.length} Nederlandse geldverstrekkers.`,
        url: `${SITE}/${HUB}`,
        dateModified: data._laatstBijgewerkt,
        author: { '@type': 'Person', name: 'Simeon' },
        publisher: { '@type': 'Organization', name: 'BouwdepotCalculator.nl', url: SITE },
        isAccessibleForFree: true,
      },
      null,
      2
    ).replace(/\n/g, '\n    ')}
    </script>
    <script type="application/ld+json">
    ${JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Kennisbank', item: `${SITE}/kennisbank.html` },
          { '@type': 'ListItem', position: 3, name: 'Bouwdepot voorwaarden vergelijken' },
        ],
      },
      null,
      2
    ).replace(/\n/g, '\n    ')}
    </script>`;

  return pagina({
    bestand: HUB,
    titel: `Bouwdepot voorwaarden vergelijken (${data.aanbieders.length} geldverstrekkers) | BouwdepotCalculator.nl`,
    omschrijving: `Vergelijk de bouwdepotvoorwaarden van ${data.aanbieders.length} Nederlandse geldverstrekkers: looptijd, verlenging, depotvergoeding, uitbetaaltermijn en bewijsstukken. Met bron en controledatum per aanbieder.`,
    kruimel: [{ naam: 'Kennisbank', href: 'kennisbank.html' }, { naam: 'Voorwaarden vergelijken' }],
    inhoud,
    schema,
  });
}

/**
 * Observaties worden uit de data afgeleid, niet met de hand geschreven,
 * zodat ze meebewegen als er aanbieders bijkomen. Beschrijvend, geen oordeel.
 */
function bouwObservaties() {
  const kaarten = [];

  const metVerbouw = data.aanbieders
    .map((a) => ({ a, t: totaal(a.looptijdVerbouwMaanden, a.verlengingMaanden?.verbouw) }))
    .filter((x) => x.t && x.t.zeker);

  if (metVerbouw.length >= 2) {
    const sorted = [...metVerbouw].sort((x, y) => x.t.totaal - y.t.totaal);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    if (max.t.totaal !== min.t.totaal) {
      kaarten.push(
        `                <article><h3>${max.t.totaal - min.t.totaal} maanden verschil in doorlooptijd</h3><p>Voor een verbouwing loopt de maximale depotduur inclusief verlenging uiteen van ${min.t.totaal} maanden (${esc(min.a.naam)}) tot ${max.t.totaal} maanden (${esc(max.a.naam)}). Wie een uitloop verwacht, merkt dat verschil direct.</p></article>`
      );
    }
  }

  const zonderRente = data.aanbieders.filter((a) => /^geen/i.test(a.rentevergoeding?.waarde || ''));
  if (zonderRente.length) {
    kaarten.push(
      `                <article><h3>Niet overal een depotvergoeding</h3><p>${zonderRente.map((a) => esc(a.naam)).join(' en ')} ${zonderRente.length === 1 ? 'vergoedt' : 'vergoeden'} geen rente over het depotsaldo, maar rekent daar ook geen hypotheekrente over. Een renteverliesberekening pakt daardoor anders uit dan bij de overige aanbieders.</p></article>`
    );
  }

  const beperkt = data.aanbieders.filter((a) => /beperkt|stopt/i.test(a.rentevergoeding?.detail || ''));
  if (beperkt.length) {
    kaarten.push(
      `                <article><h3>Vergoeding loopt korter dan het depot</h3><p>Bij ${beperkt.map((a) => esc(a.naam)).join(', ')} stopt de depotvergoeding eerder dan de looptijd van het depot zelf. De langste looptijd betekent dus niet automatisch de langste vergoeding.</p></article>`
    );
  }

  const gaten = data.aanbieders.reduce(
    (n, a) => n + ['maxPerOpname', 'minPerOpname', 'restant', 'eigenArbeid'].filter((k) => a[k]?.status === 'niet-gepubliceerd').length,
    0
  );
  if (gaten) {
    kaarten.push(
      `                <article><h3>Veel voorwaarden zijn niet openbaar</h3><p>Van de gecontroleerde gegevens zijn er ${gaten} niet publiek terug te vinden, vooral minimum- en maximumbedragen per declaratie en de regels rond eigen arbeid. Vraag die vóór het tekenen op bij uw adviseur.</p></article>`
    );
  }

  return kaarten.join('\n');
}

// ---------------------------------------------------------------- per aanbieder

const bestandsnaam = (a) => `bouwdepot-${a.id}.html`;

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
    const basis = soort === 'verbouw' ? x.looptijdVerbouwMaanden : x.looptijdNieuwbouwMaanden;
    const extra = x.verlengingMaanden?.[soort];
    const t = totaal(basis, extra);
    return t && t.zeker ? t.totaal : null;
  };

  for (const soort of ['verbouw', 'nieuwbouw']) {
    const mij = totVan(a, soort);
    if (mij == null) continue;
    const rest = anderen.map((x) => totVan(x, soort)).filter((n) => n != null);
    if (rest.length < 2) continue;
    const label = soort === 'verbouw' ? 'een verbouwing van een bestaande woning' : 'nieuwbouw';
    const laagste = Math.min(mij, ...rest);
    const hoogste = Math.max(mij, ...rest);
    if (mij === laagste && mij !== hoogste) {
      punten.push(
        `Voor ${label} is dit met ${mij} maanden inclusief verlenging de <strong>kortste</strong> termijn van de ${data.aanbieders.length} vergeleken aanbieders. De langste is ${hoogste} maanden.`
      );
    } else if (mij === hoogste && mij !== laagste) {
      punten.push(
        `Voor ${label} is dit met ${mij} maanden inclusief verlenging de <strong>langste</strong> termijn van de ${data.aanbieders.length} vergeleken aanbieders. De kortste is ${laagste} maanden.`
      );
    } else {
      punten.push(
        `Voor ${label} ligt de maximale termijn van ${mij} maanden tussen de kortste (${laagste}) en de langste (${hoogste}) in deze vergelijking.`
      );
    }
  }

  const geenRente = /^geen/i.test(a.rentevergoeding?.waarde || '');
  const anderenMetRente = anderen.filter((x) => !/^geen/i.test(x.rentevergoeding?.waarde || '')).length;
  if (geenRente && anderenMetRente) {
    punten.push(
      `Anders dan ${anderenMetRente} van de ${anderen.length} overige aanbieders wordt hier geen vergoeding over het depotsaldo betaald. Daar staat tegenover dat er ook geen rente wordt gerekend over het deel dat nog niet is opgenomen, waardoor een renteverliesberekening hier niet op dezelfde manier opgaat.`
    );
  } else if (!geenRente && anderen.some((x) => /^geen/i.test(x.rentevergoeding?.waarde || ''))) {
    punten.push(
      `Er wordt hier wel een vergoeding over het depotsaldo betaald. Dat is niet vanzelfsprekend: niet elke aanbieder in deze vergelijking doet dat.`
    );
  }

  // Bijna elke aanbieder laat de vergoeding eerder aflopen dan het depot zelf,
  // maar iedereen verwoordt dat anders. Niet tonen bij aanbieders zonder vergoeding:
  // daar staat de vorige regel al, en dit zou die tegenspreken.
  const rentetekst = `${a.rentevergoeding?.waarde || ''} ${a.rentevergoeding?.detail || ''}`;
  const loopteerderAf = /beperkt|stopt|geen rente|eerste \d+ maanden|na \d+ maanden|maximaal \d+ maanden|voorbij \d+ jaar/i.test(rentetekst);
  if (!geenRente && loopteerderAf) {
    punten.push(
      `Let op het verschil tussen de looptijd van het depot en de duur van de vergoeding: die lopen hier niet gelijk op. Het depot kan dus nog open staan terwijl er geen vergoeding meer tegenover staat.`
    );
  }

  const onbekend = ['maxPerOpname', 'minPerOpname', 'restant', 'eigenArbeid'].filter((k) => a[k]?.status === 'niet-gepubliceerd');
  if (onbekend.length >= 2) {
    punten.push(
      `Van deze aanbieder ${onbekend.length === 1 ? 'is één gegeven' : `zijn ${onbekend.length} gegevens`} niet publiek terug te vinden. Vraag die punten expliciet na bij uw adviseur voordat u tekent.`
    );
  }

  if (!punten.length) return '';

  return `
        <section class="editorial-section">
            <h2>Hoe dit zich verhoudt tot de andere aanbieders</h2>
            <ul class="editorial-checklist">
${punten.map((p) => `                <li>${p}</li>`).join('\n')}
            </ul>
            <p class="source-note">Deze vergelijking beschrijft uitsluitend gepubliceerde voorwaarden en is geen oordeel over welke aanbieder beter past. Zie <a href="${HUB}">de volledige vergelijking</a>.</p>
        </section>
`;
}

function rij(label, waarde, detail) {
  return `                        <tr>
                            <th scope="row">${esc(label)}</th>
                            <td>${waarde}${detail ? `<span class="cel-detail">${esc(detail)}</span>` : ''}</td>
                        </tr>`;
}

function bouwAanbieder(a) {
  const v = a.verlengingMaanden || {};
  const bronnen = [a.bron, ...(a.bronnen || [])].filter(Boolean);

  const rijen = [
    rij('Looptijd verbouwing', maanden(a.looptijdVerbouwMaanden)),
    rij('Looptijd nieuwbouw', maanden(a.looptijdNieuwbouwMaanden)),
    rij('Verlenging', typeof v.verbouw === 'number' || typeof v.nieuwbouw === 'number' ? `${v.verbouw === v.nieuwbouw ? maanden(v.verbouw) : `verbouwing ${maanden(v.verbouw)}, nieuwbouw ${maanden(v.nieuwbouw)}`}` : '<span class="cel-onbekend">niet gepubliceerd</span>', v.detail),
    rij('Vergoeding over depotsaldo', cel(a.rentevergoeding), a.rentevergoeding?.detail),
    rij('Manier van opnemen', a.opnamemethode === 'declaratie' ? 'Declareren: bewijsstuk indienen, daarna uitbetaling' : esc(a.opnamemethode), a.opnamemethodeDetail),
    rij('Maximum per declaratie', cel(a.maxPerOpname), a.maxPerOpname?.detail),
    rij('Minimum per declaratie', cel(a.minPerOpname), a.minPerOpname?.detail),
    a.minimumDepot ? rij('Minimum depotbedrag', cel(a.minimumDepot), a.minimumDepot?.detail) : '',
    rij('Doorlooptijd uitbetaling', a.doorlooptijdUitbetaling?.digitaal ? esc(a.doorlooptijdUitbetaling.digitaal) : '<span class="cel-onbekend">niet gepubliceerd</span>', a.doorlooptijdUitbetaling?.post),
    rij('Vereist bewijsstuk', a.bewijsstuk ? esc(a.bewijsstuk) : '<span class="cel-onbekend">niet gepubliceerd</span>'),
    rij('Wat u mag declareren', a.declarabel ? esc(a.declarabel) : '<span class="cel-onbekend">niet gepubliceerd</span>'),
    rij('Restant bij beëindiging', cel(a.restant), a.restant?.detail),
    rij('Eigen arbeid', cel(a.eigenArbeid), a.eigenArbeid?.detail),
  ]
    .filter(Boolean)
    .join('\n');

  const inhoud = `    <main class="container editorial-shell editorial-shell--narrow">
        <section class="editorial-hero">
            <p class="editorial-eyebrow">Gepubliceerde voorwaarden</p>
            <h1>Bouwdepot bij ${esc(a.naam)}: de voorwaarden</h1>
            <p class="editorial-lead">Looptijd, verlenging, depotvergoeding, bewijsstukken en uitbetaling zoals ${esc(a.naam)} die zelf publiceert.</p>
            <p class="editorial-meta">${controleBadge(a)}</p>
        </section>

${DISCLAIMER}

        <section class="editorial-section">
            <h2>Alle gepubliceerde voorwaarden</h2>
            <div class="policy-table-wrap">
                <table class="policy-table voorwaarden-detail">
                    <caption class="voorwaarden-caption">Bouwdepotvoorwaarden ${esc(a.naam)}, gecontroleerd op ${datum(a.gecontroleerd)}.</caption>
                    <tbody>
${rijen}
                    </tbody>
                </table>
            </div>
        </section>
${vergelijkendeContext(a)}${
  a.bijzonderheden?.length
    ? `
        <section class="editorial-section">
            <h2>Bijzonderheden</h2>
            <ul class="editorial-checklist">
${a.bijzonderheden.map((b) => `                <li>${esc(b)}</li>`).join('\n')}
            </ul>
        </section>`
    : ''
}
        <section class="editorial-section">
            <h2>Bron en controle</h2>
            <p>De gegevens op deze pagina komen uit de publieke informatie van ${esc(a.naam)}, geraadpleegd op ${datum(a.gecontroleerd)}:</p>
            <ul class="source-list">
${bronnen.map((b) => `                <li><a href="${esc(b)}" target="_blank" rel="noopener noreferrer nofollow">${esc(b)}</a></li>`).join('\n')}
            </ul>
            <p class="voorwaarden-melding">Voorwaarden wijzigen en kunnen per hypotheekvorm verschillen. Ziet u een afwijking? <a href="contact.html">Laat het weten</a> met een link naar de actuele voorwaarden.</p>
        </section>

        <aside class="editorial-callout">
            <h2>Verder rekenen</h2>
            <p>Bekijk <a href="${HUB}">alle aanbieders naast elkaar</a>, bereken uw <a href="maandlasten-bouwdepot.html">maandlast tijdens de depotfase</a> of loop het <a href="stappenplan.html">stappenplan</a> door.</p>
        </aside>
    </main>`;

  const schema = `    <script type="application/ld+json">
    ${JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Bouwdepot bij ${a.naam}: de voorwaarden`,
        url: `${SITE}/${bestandsnaam(a)}`,
        dateModified: a.gecontroleerd,
        author: { '@type': 'Person', name: 'Simeon' },
        publisher: { '@type': 'Organization', name: 'BouwdepotCalculator.nl', url: SITE },
        isAccessibleForFree: true,
      },
      null,
      2
    ).replace(/\n/g, '\n    ')}
    </script>
    <script type="application/ld+json">
    ${JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Voorwaarden vergelijken', item: `${SITE}/${HUB}` },
          { '@type': 'ListItem', position: 3, name: a.naam },
        ],
      },
      null,
      2
    ).replace(/\n/g, '\n    ')}
    </script>`;

  return pagina({
    bestand: bestandsnaam(a),
    titel: `Bouwdepot ${a.naam}: voorwaarden, looptijd en declareren | BouwdepotCalculator.nl`,
    omschrijving: `De gepubliceerde bouwdepotvoorwaarden van ${a.naam}: looptijd, verlenging, depotvergoeding, uitbetaaltermijn en welke bewijsstukken worden geaccepteerd. Met bron en controledatum.`,
    kruimel: [{ naam: 'Voorwaarden vergelijken', href: HUB }, { naam: a.naam }],
    inhoud,
    schema,
  });
}

// ---------------------------------------------------------------- schrijven

const geschreven = [];

fs.writeFileSync(path.join(ROOT, HUB), bouwHub());
geschreven.push(HUB);

for (const a of data.aanbieders) {
  fs.writeFileSync(path.join(ROOT, bestandsnaam(a)), bouwAanbieder(a));
  geschreven.push(bestandsnaam(a));
}

console.log(`${geschreven.length} pagina's gegenereerd uit ${data.aanbieders.length} aanbieders:`);
for (const g of geschreven) console.log('  ' + g);

const verlopen = data.aanbieders.filter((a) => isVerlopen(a.gecontroleerd));
if (verlopen.length) {
  console.log(`\nControle openstaand (ouder dan ${CONTROLE_INTERVAL_MAANDEN} maanden): ${verlopen.map((a) => a.naam).join(', ')}`);
}
