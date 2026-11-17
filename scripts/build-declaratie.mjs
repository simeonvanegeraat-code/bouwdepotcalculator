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
 * De pagina staat in de nieuwe vormgeving en zegt "je". De teksten uit de
 * dataset zeggen nog "u" en gaan daarom door jij() (scripts/aanspreekvorm.mjs).
 * Elke rij draagt data-bank, zodat src/uitleg/declaratie.js de gekozen
 * geldverstrekker kan uitlichten.
 *
 *   node scripts/build-declaratie.mjs
 */

import fs from 'fs';
import path from 'path';
import { headerHtml, voetHtml } from './build-header.mjs';
import { jij } from './aanspreekvorm.mjs';

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
    kop: 'Je stuurde een offerte in plaats van een factuur',
    uitleg: 'Dit is de meest voorkomende reden. Een offerte, orderbevestiging, pro-formafactuur of koopovereenkomst bewijst niet dat het werk is uitgevoerd of dat de spullen zijn geleverd. Vrijwel geen enkele geldverstrekker betaalt daarop uit.',
  },
  'vast-aan-woning': {
    kop: 'De aankoop zit niet vast aan de woning',
    uitleg: 'Een bouwdepot is bedoeld voor kwaliteitsverbetering van de woning. Wat je bij een verhuizing kunt meenemen valt daar niet onder. Twijfelgevallen zitten vaak bij verlichting, raamdecoratie en losse apparatuur.',
  },
  'ouderdom': {
    kop: 'Het bewijsstuk is te oud',
    uitleg: 'Sommige aanbieders accepteren geen factuur of bon die ouder is dan een bepaalde termijn. Wie inkopen vooruit doet en pas later declareert, loopt hier tegenaan.',
  },
  'factuurdatum': {
    kop: 'De factuurdatum ligt vóór je hypotheekofferte',
    uitleg: 'Kosten die je maakte voordat de financiering rond was, horen formeel niet bij de lening. Bewaar daarom de offertedatum en plan grote inkopen daarna.',
  },
  'factuurgegevens': {
    kop: 'Er ontbreken verplichte gegevens op de factuur',
    uitleg: 'Een handgeschreven bonnetje of een kassabon zonder bedrijfsgegevens wordt afgewezen. Vraag bij grotere inkopen altijd om een volledige factuur op naam.',
  },
  'taal-en-valuta': {
    kop: 'De factuur is niet in een geaccepteerde taal of valuta',
    uitleg: 'Koop je materiaal in het buitenland, let dan op de taal van de factuur en de munteenheid. Een factuur in een andere valuta wordt niet zomaar omgerekend.',
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

// ---------------------------------------------------------------- opbouw

const N = data.aanbieders.length;

const gevonden = VOLGORDE
  .map((soort) => ({ soort, treffers: perSoort(soort) }))
  .filter((x) => x.treffers.length);

/** Een rij per aanbieder; data-bank is waar de bankkeuze op uitlicht. */
const rij = (aanbieder, inhoud, metLink = false) => `                            <div data-bank="${aanbieder.id}">
                                <dt>${metLink ? `<a href="bouwdepot-${aanbieder.id}.html">${esc(aanbieder.naam)}</a>` : esc(aanbieder.naam)}</dt>
                                <dd>${inhoud}</dd>
                            </div>`;

const inhoudsopgave = gevonden
  .map(({ soort }) => `                    <li><a href="#${soort}">${esc(SOORTEN[soort].kop)}</a></li>`)
  .join('\n');

const redenen = gevonden
  .map(({ soort, treffers }, i) => `                    <article class="ul-reden" id="${soort}">
                        <div class="ul-reden__tekst">
                            <p class="ul-fout__nummer">Reden ${i + 1}</p>
                            <h3>${esc(SOORTEN[soort].kop)}</h3>
                            <p>${esc(SOORTEN[soort].uitleg)}</p>
                            <p class="wr-voorbehoud">${treffers.length === N
                              ? 'Alle vergeleken aanbieders stellen hier een eis.'
                              : `Gepubliceerd door ${treffers.length} van de ${N} vergeleken aanbieders. Bij de overige staat hierover niets; vraag het dan na.`}</p>
                            <p class="ul-mijn" data-mijn hidden></p>
                        </div>
                        <dl class="ul-perbank" data-perbank>
${treffers.map(({ aanbieder, eis }) => rij(aanbieder, `<strong>${esc(jij(eis.waarde))}</strong><small>${esc(jij(eis.detail))}</small>`, true)).join('\n')}
                        </dl>
                    </article>`).join('\n');

const uitbetaaltijden = data.aanbieders
  .filter((a) => a.doorlooptijdUitbetaling?.digitaal)
  .map((a) => rij(a, esc(jij(a.doorlooptijdUitbetaling.digitaal))))
  .join('\n');

const voorschot = data.aanbieders
  .map((a) => rij(a, `${a.voorschieten?.waarde ? `<strong>${esc(jij(a.voorschieten.waarde))}</strong>` : '<span class="ul-leeg">niet gepubliceerd</span>'
  }${a.voorschieten?.detail ? `<small>${esc(jij(a.voorschieten.detail))}</small>` : ''}`))
  .join('\n');

const TITEL = 'Declaratie bouwdepot afgewezen | Redenen en oplossingen';
const OMSCHRIJVING = 'Waarom banken een bouwdepot-declaratie afwijzen: een offerte in plaats van een factuur, losse spullen of een te oud bewijsstuk. Met de eisen per bank.';

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${TITEL}</title>
    <meta name="description" content="${OMSCHRIJVING}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="author" content="Simeon">
    <link rel="canonical" href="${SITE}/${BESTAND}">
    <!-- Wat een gedeelde link laat zien in WhatsApp, LinkedIn en Slack. Titel,
         omschrijving en adres zijn bewust dezelfde als hierboven;
         tests/deelkaart.test.mjs faalt zodra ze uit elkaar lopen. -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="BouwdepotCalculator.nl">
    <meta property="og:locale" content="nl_NL">
    <meta property="og:title" content="${TITEL}">
    <meta property="og:description" content="${OMSCHRIJVING}">
    <meta property="og:url" content="${SITE}/${BESTAND}">
    <meta property="og:image" content="https://www.bouwdepotcalculator.nl/og-1200x630.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="BouwdepotCalculator.nl: reken je bouwdepot door, voor nieuwbouw en verbouwen">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="https://www.bouwdepotcalculator.nl/og-1200x630.png">
    <meta name="twitter:title" content="${TITEL}">
    <meta name="twitter:description" content="${OMSCHRIJVING}">

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

${headerHtml(BESTAND)}

    <main>
        <section class="wr-wrap wr-kop ul-kop" id="inhoud">
            <nav class="wr-kruimel wr-geen-print" aria-label="Kruimelpad"><a href="/">Home</a> <span aria-hidden="true">&middot;</span> <a href="stappenplan.html">Stappenplan</a> <span aria-hidden="true">&middot;</span> <span>Declaratie afgewezen</span></nav>
            <h1>Declaratie afgewezen: waarom, en wat nu?</h1>
            <p class="wr-lead">Een afwijzing kost meestal geen geld maar wel weken. De redenen zijn opvallend voorspelbaar: bijna altijd gaat het om het soort bewijsstuk, om iets dat niet vast aan de woning zit, of om ontbrekende gegevens op de factuur.</p>
            <p class="ul-inleiding">Hieronder staan de eisen die de ${N} vergeleken geldverstrekkers zelf publiceren, gegroepeerd per soort. Zo zie je niet alleen wát er misgaat, maar ook of je bank daar streng in is. Waar een aanbieder niets publiceert, staat dat er expliciet bij.</p>

            <!-- Wie zijn geldverstrekker kiest, ziet die bij elke reden bovenaan
                 staan. Zonder keuze, of zonder JavaScript, staat alles er gewoon. -->
            <div class="ul-kiezer wr-geen-print" data-bankkeuze></div>
        </section>

        <section class="wr-wrap wr-sectie">
            <p class="ui-opschrift">De redenen op een rij</p>
            <h2>Waar het meestal op stukloopt</h2>
            <ol class="ul-inhoud wr-geen-print">
${inhoudsopgave}
            </ol>

            <div class="ul-redenen">
${redenen}
            </div>
        </section>

        <section class="wr-wrap wr-sectie" id="voorschieten">
            <p class="ui-opschrift">Mag dat eigenlijk</p>
            <h2>Zelf betalen en later terugvragen</h2>
            <p class="wr-lead ul-lead">Veel mensen schieten een rekening voor omdat de leverancier snel betaald wil worden. Of dat mag, en wat je dan moet aanleveren, verschilt.</p>
            <dl class="ul-perbank ul-perbank--breed" data-perbank>
${voorschot}
            </dl>
        </section>

        <section class="wr-wrap wr-sectie" id="verwerkingstijd">
            <p class="ui-opschrift">Hoe lang duurt het</p>
            <h2>Verwerkingstijd per geldverstrekker</h2>
            <p class="wr-lead ul-lead">Plan hiermee je eigen betaalafspraken. Een aannemer die binnen zeven dagen betaald wil worden, past niet altijd bij de doorlooptijd van je bank.</p>
            <p class="ul-mijn" data-mijn hidden></p>
            <dl class="ul-perbank ul-perbank--breed" data-perbank>
${uitbetaaltijden}
            </dl>
        </section>

        <section class="wr-wrap wr-sectie" id="wat-nu">
            <p class="ui-opschrift">Na een afwijzing</p>
            <h2>Wat je dan doet</h2>
            <ul class="wr-lijst wr-proza">
                <li>Zoek de reden op in je online omgeving. Banken zetten die in het berichtenoverzicht van het portaal, niet altijd in een e-mail.</li>
                <li>Herstel wat er mis is en dien een <strong>nieuwe</strong> declaratie in. Een afgewezen aanvraag aanpassen kan meestal niet.</li>
                <li>Staat er op één factuur zowel toegestaan als niet-toegestaan spul, splits dat dan: streep de niet-toegestane regels door en declareer alleen het resterende bedrag.</li>
                <li>Twijfel je vooraf over een post, vraag het dan schriftelijk na en bewaar het antwoord. Dat scheelt discussie achteraf.</li>
                <li>Houd de einddatum van je depot in de gaten. Een afwijzing plus een nieuwe ronde kost al snel enkele weken. De <a href="depotplanner.html">depotplanner</a> zet die datum voor je op een rij.</li>
            </ul>
        </section>

        <section class="wr-wrap wr-sectie">
            <p class="ui-opschrift">Verder</p>
            <h2>Wat je hierna kunt bekijken</h2>
            <div class="wr-register">
                <a href="${HUB}">
                    <strong>Voorwaarden per bank</strong>
                    <span>Looptijd, vergoeding en bewijsstukken van ${N} geldverstrekkers naast elkaar.</span>
                </a>
                <a href="stappenplan.html#fouten">
                    <strong>Zeven fouten voorkomen</strong>
                    <span>Begroting, declaraties, kasstroom en depottermijn: waar het vaker misgaat.</span>
                </a>
                <a href="stappenplan.html">
                    <strong>Stappenplan</strong>
                    <span>Van begroting en taxatie tot de laatste declaratie, in volgorde.</span>
                </a>
            </div>
        </section>

        <section class="wr-wrap">
            <div class="wr-melding">
                <p><strong>Wat hier staat komt van de aanbieders zelf.</strong> Elke eis is overgenomen uit de publieke informatie van de betreffende geldverstrekker, met een controledatum per aanbieder in de <a href="${HUB}">vergelijking</a>. Waar een aanbieder iets niet publiceert, staat dat er expliciet bij in plaats van een aanname.</p>
                <p>Je eigen voorwaarden kunnen afwijken van de algemene productinformatie. Bij twijfel geldt wat in je offerte en voorwaarden staat. Zie je een afwijking? <a href="contact.html">Laat het weten</a>.</p>
            </div>
        </section>
    </main>

${voetHtml(BESTAND)}

    <script type="module" src="/src/uitleg/declaratie.js"></script>

    <script type="application/ld+json">
    ${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Declaratie bouwdepot afgewezen: de redenen en wat je dan doet',
      description: `De eisen die ${N} Nederlandse geldverstrekkers stellen aan een bouwdepot-declaratie, gegroepeerd per afwijzingsreden.`,
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
        { '@type': 'ListItem', position: 2, name: 'Stappenplan', item: `${SITE}/stappenplan.html` },
        { '@type': 'ListItem', position: 3, name: 'Declaratie afgewezen' },
      ],
    }, null, 2).replace(/\n/g, '\n    ')}
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, BESTAND), html);
console.log(`${BESTAND} gegenereerd`);
console.log(`  ${gevonden.length} afwijzingsredenen uit de data`);
console.log(`  laatst bijgewerkt: ${datum(data._laatstBijgewerkt)}`);
