/**
 * Genereert de declaratiegids uit data/bouwdepot-voorwaarden.json.
 *
 * Beantwoordt de vraag die volgens het onderzoek het vaakst gesteld wordt en
 * op deze site nergens stond: waarom wordt een declaratie afgewezen, en wat
 * moet er op een factuur staan.
 *
 * De eisen komen uit het veld declaratieEisen en worden per soort gegroepeerd,
 * zodat zichtbaar wordt waar aanbieders van elkaar verschillen. Alles wat een
 * aanbieder niet publiceert blijft leeg; nooit invullen met een aanname.
 *
 *   node scripts/build-declaratie.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const BESTAND = 'bouwdepot-declaratie-afgewezen.html';
const HUB = 'bouwdepot-voorwaarden-vergelijken.html';
const SITE = 'https://www.bouwdepotcalculator.nl';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NL_DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
const datum = (iso) => NL_DATUM.format(new Date(iso + 'T00:00:00Z'));

/** Menselijke naam per soort eis, plus de vraag die erachter zit. */
const SOORTEN = {
  'soort-bewijs': {
    kop: 'U stuurde een offerte in plaats van een factuur',
    uitleg: 'Dit is de meest voorkomende reden. Een offerte, orderbevestiging, pro-formafactuur of koopovereenkomst bewijst niet dat het werk is uitgevoerd of dat de spullen zijn geleverd. Vrijwel geen enkele geldverstrekker betaalt daarop uit.',
  },
  'vast-aan-woning': {
    kop: 'De aankoop zit niet vast aan de woning',
    uitleg: 'Een bouwdepot is bedoeld voor kwaliteitsverbetering van de woning. Wat u bij een verhuizing kunt meenemen valt daar niet onder. Twijfelgevallen zitten vaak bij verlichting, raamdecoratie en losse apparatuur.',
  },
  'ouderdom': {
    kop: 'Het bewijsstuk is te oud',
    uitleg: 'Sommige aanbieders accepteren geen factuur of bon die ouder is dan een bepaalde termijn. Wie inkopen vooruit doet en pas later declareert, loopt hier tegenaan.',
  },
  'factuurdatum': {
    kop: 'De factuurdatum ligt vóór uw hypotheekofferte',
    uitleg: 'Kosten die u maakte voordat de financiering rond was, horen formeel niet bij de lening. Bewaar daarom de offertedatum en plan grote inkopen daarna.',
  },
  'factuurgegevens': {
    kop: 'Er ontbreken verplichte gegevens op de factuur',
    uitleg: 'Een handgeschreven bonnetje of een kassabon zonder bedrijfsgegevens wordt afgewezen. Vraag bij grotere inkopen altijd om een volledige factuur op naam.',
  },
  'taal-en-valuta': {
    kop: 'De factuur is niet in een geaccepteerde taal of valuta',
    uitleg: 'Koopt u materiaal in het buitenland, let dan op de taal van de factuur en de munteenheid. Een factuur in een andere valuta wordt niet zomaar omgerekend.',
  },
  'bestandsformaat': {
    kop: 'De foto of scan is niet goed leesbaar',
    uitleg: 'Een schuine foto met schaduw of weerspiegeling kost een afwijzing en dus weken vertraging. Fotografeer recht van boven, op een egale ondergrond, bij daglicht.',
  },
};

/** Volgorde: eerst wat het vaakst misgaat. */
const VOLGORDE = ['soort-bewijs', 'vast-aan-woning', 'factuurgegevens', 'ouderdom', 'factuurdatum', 'taal-en-valuta', 'bestandsformaat'];

function perSoort(soort) {
  return data.aanbieders
    .map((a) => ({ aanbieder: a, eis: (a.declaratieEisen || []).find((e) => e.eis === soort) }))
    .filter((x) => x.eis);
}

const NAV = [
  ['/', 'Bereken'],
  [HUB, 'Voorwaarden per bank'],
  ['kennisbank.html', 'Uitleg'],
  ['over-ons.html', 'Over ons'],
];

const VOET = [
  ['/', 'Home'], [HUB, 'Voorwaarden per bank'], ['kennisbank.html', 'Kennisbank'],
  ['over-ons.html', 'Over ons'], ['methodologie.html', 'Methodologie'], ['contact.html', 'Contact'],
  ['privacy.html', 'Privacy'], ['cookies.html', 'Cookies'], ['voorwaarden.html', 'Voorwaarden'],
];

// ---------------------------------------------------------------- opbouw

const redenen = VOLGORDE
  .map((soort) => ({ soort, treffers: perSoort(soort) }))
  .filter((x) => x.treffers.length)
  .map(({ soort, treffers }, i) => `                    <article class="reden">
                        <p class="reden__nummer">Reden ${i + 1}</p>
                        <h3>${esc(SOORTEN[soort].kop)}</h3>
                        <p class="reden__uitleg">${esc(SOORTEN[soort].uitleg)}</p>
                        <dl class="reden__per-bank">
${treffers.map(({ aanbieder, eis }) => `                            <div>
                                <dt><a href="bouwdepot-${aanbieder.id}.html">${esc(aanbieder.naam)}</a></dt>
                                <dd><strong>${esc(eis.waarde)}</strong><small>${esc(eis.detail)}</small></dd>
                            </div>`).join('\n')}
                        </dl>
                        <p class="ds-caption">${treffers.length === data.aanbieders.length
                          ? 'Alle vergeleken aanbieders stellen hier een eis.'
                          : `Gepubliceerd door ${treffers.length} van de ${data.aanbieders.length} vergeleken aanbieders. Bij de overige staat hierover niets; vraag het dan na.`}</p>
                    </article>`).join('\n');

const uitbetaaltijden = data.aanbieders
  .filter((a) => a.doorlooptijdUitbetaling?.digitaal)
  .map((a) => `                        <div><dt>${esc(a.naam)}</dt><dd>${esc(a.doorlooptijdUitbetaling.digitaal)}</dd></div>`)
  .join('\n');

const voorschot = data.aanbieders
  .map((a) => `                        <div><dt>${esc(a.naam)}</dt><dd>${
    a.voorschieten?.waarde ? `<strong>${esc(a.voorschieten.waarde)}</strong>` : '<span class="vgl-leeg">niet gepubliceerd</span>'
  }${a.voorschieten?.detail ? `<small>${esc(a.voorschieten.detail)}</small>` : ''}</dd></div>`)
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Declaratie bouwdepot afgewezen | De redenen en wat u dan doet</title>
    <meta name="description" content="Waarom banken een bouwdepot-declaratie afwijzen: offerte in plaats van factuur, losse spullen, ontbrekende factuurgegevens of een te oud bewijsstuk. Met de eisen per geldverstrekker.">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="author" content="Simeon">
    <link rel="canonical" href="${SITE}/${BESTAND}">

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
          <li><a href="kennisbank.html">Uitleg</a></li>
          <li aria-current="page">Declaratie afgewezen</li>
        </ol>
      </div>
    </nav>

    <main>
        <section class="ds-wrap ds-sectie">
            <div class="ds-sectiekop">
                <p class="ds-eyebrow">Uw depot gebruiken</p>
                <h1 class="ds-heading">Declaratie afgewezen: waarom, en wat nu?</h1>
            </div>

            <p class="kernzin">Een afwijzing kost meestal geen geld maar wel weken. De redenen zijn opvallend voorspelbaar: bijna altijd gaat het om het soort bewijsstuk, om iets dat niet vast aan de woning zit, of om ontbrekende gegevens op de factuur.</p>

            <div class="proza" style="margin-top: var(--ds-5)">
                <p>Hieronder staan de eisen die de ${data.aanbieders.length} vergeleken geldverstrekkers zelf publiceren, gegroepeerd per soort. Zo ziet u niet alleen wát er misgaat, maar ook of uw bank daar streng in is. Waar een aanbieder niets publiceert, staat dat er expliciet bij.</p>
            </div>
        </section>

        <section class="ds-sectie ds-sectie--gevuld">
            <div class="ds-wrap">
                <div class="ds-sectiekop">
                    <p class="ds-eyebrow">De redenen op een rij</p>
                    <h2 class="ds-title">Waar het meestal op stukloopt</h2>
                </div>

                <div class="redenen">
${redenen}
                </div>
            </div>
        </section>

        <section class="ds-sectie">
            <div class="ds-wrap ds-wrap--smal">
                <div class="ds-sectiekop">
                    <p class="ds-eyebrow">Mag dat eigenlijk</p>
                    <h2 class="ds-title">Zelf betalen en later terugvragen</h2>
                    <p class="ds-lead">Veel mensen schieten een rekening voor omdat de leverancier snel betaald wil worden. Of dat mag, en wat u dan moet aanleveren, verschilt.</p>
                </div>
                <dl class="per-bank">
${voorschot}
                </dl>
            </div>
        </section>

        <section class="ds-sectie ds-sectie--gevuld">
            <div class="ds-wrap ds-wrap--smal">
                <div class="ds-sectiekop">
                    <p class="ds-eyebrow">Hoe lang duurt het</p>
                    <h2 class="ds-title">Verwerkingstijd per geldverstrekker</h2>
                    <p class="ds-lead">Plan hiermee uw eigen betaalafspraken. Een aannemer die binnen zeven dagen betaald wil worden, past niet altijd bij de doorlooptijd van uw bank.</p>
                </div>
                <dl class="per-bank">
${uitbetaaltijden}
                </dl>
            </div>
        </section>

        <section class="ds-sectie">
            <div class="ds-wrap ds-wrap--smal">
                <div class="ds-sectiekop">
                    <p class="ds-eyebrow">Na een afwijzing</p>
                    <h2 class="ds-title">Wat u dan doet</h2>
                </div>
                <ul class="checklijst">
                    <li>Zoek de reden op in uw online omgeving. Banken zetten die in het berichtenoverzicht van het portaal, niet altijd in een e-mail.</li>
                    <li>Herstel wat er mis is en dien een <strong>nieuwe</strong> declaratie in. Een afgewezen aanvraag aanpassen kan meestal niet.</li>
                    <li>Staat er op één factuur zowel toegestaan als niet-toegestaan spul, splits dat dan: streep de niet-toegestane regels door en declareer alleen het resterende bedrag.</li>
                    <li>Twijfelt u vooraf over een post, vraag het dan schriftelijk na en bewaar het antwoord. Dat scheelt discussie achteraf.</li>
                    <li>Houd de einddatum van uw depot in de gaten. Een afwijzing plus een nieuwe ronde kost al snel enkele weken.</li>
                </ul>
            </div>
        </section>

        <section class="ds-sectie">
            <div class="ds-wrap">
                <div class="ds-sectiekop">
                    <p class="ds-eyebrow">Verder</p>
                    <h2 class="ds-title">Wat u hierna kunt bekijken</h2>
                </div>
                <div class="ds-keuzes">
                    <a class="ds-keuze" href="${HUB}">
                        <span class="ds-keuze__titel">Voorwaarden per bank</span>
                        <span class="ds-keuze__uitleg">Looptijd, vergoeding en bewijsstukken van ${data.aanbieders.length} geldverstrekkers naast elkaar.</span>
                        <span class="ds-keuze__meta">Vergelijking bekijken &rarr;</span>
                    </a>
                    <a class="ds-keuze" href="bouwdepot-fouten.html">
                        <span class="ds-keuze__titel">Zeven fouten voorkomen</span>
                        <span class="ds-keuze__uitleg">Begroting, declaraties, kasstroom en depottermijn: waar het vaker misgaat.</span>
                        <span class="ds-keuze__meta">Fouten bekijken &rarr;</span>
                    </a>
                    <a class="ds-keuze" href="stappenplan.html">
                        <span class="ds-keuze__titel">Stappenplan</span>
                        <span class="ds-keuze__uitleg">Van begroting en taxatie tot de laatste declaratie, in volgorde.</span>
                        <span class="ds-keuze__meta">Naar het stappenplan &rarr;</span>
                    </a>
                </div>
            </div>
        </section>

        <section class="ds-sectie">
            <div class="ds-wrap ds-wrap--smal">
                <div class="melding">
                    <p><strong>Wat hier staat komt van de aanbieders zelf.</strong> Elke eis is overgenomen uit de publieke informatie van de betreffende geldverstrekker, met een controledatum per aanbieder in de <a href="${HUB}">vergelijking</a>. Waar een aanbieder iets niet publiceert, staat dat er expliciet bij in plaats van een aanname.</p>
                    <p>Uw eigen voorwaarden kunnen afwijken van de algemene productinformatie. Bij twijfel geldt wat in uw offerte en voorwaarden staat. Ziet u een afwijking? <a href="contact.html">Laat het weten</a>.</p>
                </div>
            </div>
        </section>
    </main>

    <footer class="voet">
        <div class="ds-wrap">
            <nav class="voet__links" aria-label="Voettekst">
${VOET.map(([h, t]) => `                <a href="${h}">${t}</a>`).join('\n')}
            </nav>
            <p class="ds-caption">&copy; 2026 BouwdepotCalculator.nl &middot; Onafhankelijk informatieplatform, geen aanbieder van hypotheken.</p>
        </div>
    </footer>

    <script type="application/ld+json">
    ${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Declaratie bouwdepot afgewezen: de redenen en wat u dan doet',
      description: `De eisen die ${data.aanbieders.length} Nederlandse geldverstrekkers stellen aan een bouwdepot-declaratie, gegroepeerd per afwijzingsreden.`,
      url: `${SITE}/${BESTAND}`,
      dateModified: data._laatstBijgewerkt,
      author: { '@type': 'Person', name: 'Simeon' },
      publisher: { '@type': 'Organization', name: 'BouwdepotCalculator.nl', url: SITE },
      isAccessibleForFree: true,
    }, null, 2).replace(/\n/g, '\n    ')}
    </script>
    <script type="application/ld+json">
    ${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Uitleg', item: `${SITE}/kennisbank.html` },
        { '@type': 'ListItem', position: 3, name: 'Declaratie afgewezen' },
      ],
    }, null, 2).replace(/\n/g, '\n    ')}
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, BESTAND), html);
console.log(`${BESTAND} gegenereerd`);
console.log(`  ${VOLGORDE.filter((s) => perSoort(s).length).length} afwijzingsredenen uit de data`);
console.log(`  laatst bijgewerkt: ${datum(data._laatstBijgewerkt)}`);
