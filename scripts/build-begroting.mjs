/**
 * Genereert de verbouwbegroting uit data/verbouwposten.json.
 *
 * De posten en de vraag of iets uit het depot mag, komen uit de data. Bedragen
 * staan er bewust niet in: verbouwkosten verschillen te sterk per woning en
 * regio om iets te publiceren dat we niet kunnen onderbouwen. De bezoeker vult
 * zijn eigen offertebedragen in.
 *
 *   node scripts/build-begroting.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const posten = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/verbouwposten.json'), 'utf8'));
const banken = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const BESTAND = 'verbouwbegroting.html';
const HUB = 'bouwdepot-voorwaarden-vergelijken.html';
const SITE = 'https://www.bouwdepotcalculator.nl';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const naamVan = (id) => banken.aanbieders.find((a) => a.id === id)?.naam || id;

const NAV = [
  ['bouwdepot-berekenen.html', 'Bereken'],
  [BESTAND, 'Begroting'],
  [HUB, 'Voorwaarden per bank'],
  ['kennisbank.html', 'Uitleg'],
];

const VOET = [
  ['/', 'Home'], [BESTAND, 'Verbouwbegroting'], ['leenruimte.html', 'Leenruimte'], ['depotplanner.html', 'Depotplanner'], [HUB, 'Voorwaarden per bank'],
  ['kennisbank.html', 'Kennisbank'], ['over-ons.html', 'Over ons'], ['methodologie.html', 'Methodologie'],
  ['contact.html', 'Contact'], ['privacy.html', 'Privacy'], ['cookies.html', 'Cookies'], ['voorwaarden.html', 'Voorwaarden'],
];

const totaalPosten = posten.categorieen.reduce((n, c) => n + c.posten.length, 0);
const nietVast = posten.categorieen.flatMap((c) => c.posten).filter((p) => !p.vastAanWoning).length;

/* ---------------------------------------------------------------- categorieen */

// Uitklapbaar per categorie. Alle vierendertig velden tegelijk tonen maakte de
// pagina 10,3 schermen lang, waarvan tweederde invoervelden -- ook voor iemand
// die alleen zijn keuken verbouwt. Dichtgeklapt is de pagina een keuzelijst van
// zes regels: je opent wat op jou van toepassing is.
//
// Bewust <details> en geen eigen JavaScript: de inhoud blijft in de HTML staan
// en dus vindbaar, het werkt met het toetsenbord, en het werkt zonder script.
const categorieen = posten.categorieen.map((c) => `                <details class="bs-cat">
                    <summary class="bs-cat__kop">
                        <h2>${esc(c.naam)}</h2>
                        <p>${esc(c.toelichting)}</p>
                        <!-- Subtotaal per categorie. Met vierendertig velden verspreid over
                             zes blokken weet je zonder dit niet waar je staat, en of een
                             categorie waar je niets aan doet al afgehandeld is. -->
                        <p class="bs-cat__subtotaal" data-subtotaal="${c.id ?? esc(c.naam)}"></p>
                        <span class="bs-cat__aantal">${c.posten.length} ${c.posten.length === 1 ? 'post' : 'posten'}</span>
                    </summary>
                    <div class="bs-cat__posten">
${c.posten.map((p) => `                        <div class="bs-post${p.vastAanWoning ? '' : ' bs-post--eigen-geld'}"${p.genoemdDoor?.length ? ` data-genoemd-door="${esc(p.genoemdDoor.join(' '))}"` : ''}>
                            <div class="bs-post__naam">
                                <label for="post-${p.id}">${esc(p.naam)}</label>
                                <span class="bs-post__merk">${p.vastAanWoning
                                  ? '<span class="bs-merkje bs-merkje--depot">uit depot</span>'
                                  : '<span class="bs-merkje bs-merkje--eigen">eigen geld</span>'}</span>
                                ${p.let_op ? `<small class="bs-post__letop">${esc(p.let_op)}</small>` : ''}
                            </div>
                            <div class="bs-post__invoer">
                                <div class="bs-omhulsel">
                                    <span>&euro;</span>
                                    <!-- Tekstinvoer en niet type="number": daarin las de browser
                                         "20.000" als 20 en gooide hij "EUR 20.000" helemaal weg.
                                         Wie zijn offerte overtypte zag zijn totaal kelderen zonder
                                         dat er iets misging op het scherm. inputmode houdt het
                                         numerieke toetsenbord op mobiel; leesGetal doet de rest. -->
                                    <input type="text" id="post-${p.id}" data-post="${p.id}" data-vast="${p.vastAanWoning}" inputmode="decimal" placeholder="0">
                                </div>
                                <select class="bs-select bs-post__prioriteit" data-prioriteit="${p.id}" aria-label="Prioriteit ${esc(p.naam)}">
                                    <option value="noodzakelijk">Noodzakelijk</option>
                                    <option value="gewenst">Gewenst</option>
                                </select>
                            </div>
                            <span class="bs-post__fout" role="alert"></span>
                        </div>`).join('\n')}
                    </div>
                </details>`).join('\n');

/* --------------------------------------------------------------------- pagina */

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verbouwbegroting maken | Wat mag uit het bouwdepot?</title>
    <meta name="description" content="Stel uw verbouwbegroting samen en zie welk deel uit het bouwdepot mag en welk deel u zelf betaalt. Met een specificatie voor uw adviseur.">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="author" content="Simeon">
    <link rel="canonical" href="${SITE}/${BESTAND}">
    <!-- Wat een gedeelde link laat zien in WhatsApp, LinkedIn en Slack. Titel,
         omschrijving en adres zijn bewust dezelfde als hierboven;
         tests/deelkaart.test.mjs faalt zodra ze uit elkaar lopen. -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="BouwdepotCalculator.nl">
    <meta property="og:locale" content="nl_NL">
    <meta property="og:title" content="Verbouwbegroting maken | Wat mag uit het bouwdepot?">
    <meta property="og:description" content="Stel uw verbouwbegroting samen en zie welk deel uit het bouwdepot mag en welk deel u zelf betaalt. Met een specificatie voor uw adviseur.">
    <meta property="og:url" content="${SITE}/${BESTAND}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Verbouwbegroting maken | Wat mag uit het bouwdepot?">
    <meta name="twitter:description" content="Stel uw verbouwbegroting samen en zie welk deel uit het bouwdepot mag en welk deel u zelf betaalt. Met een specificatie voor uw adviseur.">

    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9252617114074571"
      crossorigin="anonymous"></script>

    <!-- Vercel Web Analytics: cookieloos. Geen cookie en geen localStorage; de
         bezoeker wordt herkend aan een hash van het verzoek die na 24 uur
         vervalt. Wat er wel wordt vastgelegd staat in privacy.html. -->
    <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
    <script defer src="/_vercel/insights/script.js"></script>

    <link rel="stylesheet" href="/src/styles/broadsheet.css">
</head>
<body class="bs">
    <header class="bs-kop no-print">
        <div class="bs-wrap bs-kop__inner">
            <a class="bs-merk" href="/">Bouwdepot<span>Calculator</span><b>.nl</b></a>
            <div class="bs-kop__rechts">
${NAV.map(([h, t]) => `                <a href="${h}">${t}</a>`).join('\n')}
                <a class="bs-menu" href="kennisbank.html">Kennisbank</a>
                <span class="bs-staafjes" aria-hidden="true"><i></i><i></i><i></i></span>
            </div>
        </div>
    </header>

    <nav class="bs-wrap bs-kruimel no-print" aria-label="Kruimelpad">
        <a href="/">Home</a> <span aria-hidden="true">&middot;</span> <span>Verbouwbegroting</span>
    </nav>

    <main id="begroting">
        <section class="bs-reken">
            <div class="bs-wrap">
                <h1 class="bs-reken__titel" id="reken-titel">Wat gaat uw verbouwing kosten?</h1>
                <p class="bs-reken__lead">En vooral: welk deel mag uit het bouwdepot en welk deel betaalt u zelf?</p>

                <div class="bs-reken__grid">
                    <div>
                        <article class="bs-blad ds-uitkomst">
                            <div class="bs-blad__kop">
                                <span class="bs-blad__merk">BouwdepotCalculator.nl</span>
                                <span class="bs-blad__stempel">Begroting</span>
                            </div>

                            <div class="bs-antwoord">
                                <p class="bs-antwoord__label ds-uitkomst__label">Totale verbouwkosten</p>
                                <strong class="bs-antwoord__bedrag ds-uitkomst__bedrag" id="res-totaal" data-bedrag>&euro; 0</strong>
                                <p class="bs-antwoord__zin" id="res-zin">Vul hieronder in wat u verwacht uit te geven.</p>
                            </div>

                        <dl class="bs-uitsplitsing">
                            <div><dt>Naar verwachting uit het depot</dt><dd class="tnum" id="res-depot" data-bedrag>&euro; 0</dd></div>
                            <div><dt>Uit eigen geld</dt><dd class="tnum" id="res-eigen" data-bedrag>&euro; 0</dd></div>
                            <div><dt>Waarvan onvoorzien</dt><dd class="tnum" id="res-marge" data-bedrag>&euro; 0</dd></div>
                        </dl>

                        <div class="bs-notitie">
                            <div class="bs-veld__kop">
                                <label class="bs-veld__naam" for="in-onvoorzien">Reserve voor onvoorzien</label>
                                <span class="bs-veld__waarde tnum" id="toon-onvoorzien">10%</span>
                            </div>
                            <input class="bs-schuif" type="range" id="in-onvoorzien" min="0" max="30" step="1" value="10">
                            <p class="bs-hulp">Sloopwerk legt vaak verborgen gebreken bloot. Een begroting zonder marge loopt bijna altijd vast. Tien procent is in de bouw de gangbare vuistregel; bij oudere woningen wordt vijftien tot twintig procent aangehouden.</p>
                        </div>

                            <p class="bs-blad__voet">Indicatief &middot; informatie, geen advies</p>
                        </article>

                        <details class="bs-uitklap bs-aannames">
                            <summary><span><b>Verdeling noodzakelijk en gewenst</b><small>Waar uw budget aan vastzit</small></span></summary>
                            <div class="bs-uitklap__body">
                                <dl class="bs-uitsplitsing">
                                    <div><dt>Noodzakelijk</dt><dd class="tnum" id="res-noodzakelijk">&euro; 0</dd></div>
                                    <div><dt>Gewenst</dt><dd class="tnum" id="res-gewenst">&euro; 0</dd></div>
                                    <div><dt>Reserve voor onvoorzien</dt><dd class="tnum" id="res-marge-split">&euro; 0</dd></div>
                                </dl>
                                <p class="bs-hulp">De reserve staat apart: die hoort bij geen van beide, want u weet nog niet waaraan u hem kwijtraakt. Samen met de twee bedragen erboven vormt hij het totaal.</p>
                                <p class="bs-hulp">Leg vóór de start vast welke wens als eerste vervalt als het budget onder druk komt. Dan hoeft u die keuze niet te maken terwijl de aannemer staat te wachten.</p>
                                <p class="bs-hulp" id="res-aantal">0 posten ingevuld</p>
                            </div>
                        </details>

                    </div>

                    <div class="bs-invoer">
                        <div class="bs-melding no-print">
                        <p><strong>Wij vullen bewust geen prijzen voor u in.</strong> Verbouwkosten verschillen te sterk per woning, regio en uitvoering om een bedrag te noemen dat wij kunnen onderbouwen. Gebruik uw eigen offertes; dat is bovendien wat uw geldverstrekker wil zien.</p>
                        <p>Wat wij wél toevoegen: per post of die doorgaans uit het bouwdepot mag. Dat is afgeleid uit wat de ${banken.aanbieders.length} vergeleken geldverstrekkers zelf publiceren.</p>
                    </div>

                        <div data-bankkeuze class="no-print"></div>

                        <div class="bs-melding no-print" id="begroting-bankmelding" hidden>
                            <p id="begroting-bankmelding-tekst"></p>
                        </div>

${categorieen}
                    </div>

                    <!-- Printen en doorrekenen doe je als de begroting staat, dus
                         ná de invoer. Derde blok in het raster. -->
                    <div class="bs-reken__na no-print">
                        <a class="bs-knop" id="naar-maandlast" href="bouwdepot-berekenen.html">Wat kost dit per maand?</a>
                        <button id="begroting-printen" class="bs-knop bs-knop--licht" type="button">Specificatie printen</button>
                        <button id="begroting-wissen" class="bs-knop bs-knop--licht" type="button">Wissen</button>
                        <p class="bs-voorbehoud">Uw begroting blijft op dit apparaat en wordt nergens verstuurd.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- De specificatie die de bezoeker meeneemt. Alleen bij printen zichtbaar:
             op het scherm is het formulier het gereedschap, op papier is een
             ingevuld formulier geen document. Wordt gevuld door begroting.js. -->
        <section id="specificatie" class="bs-alleen-print" aria-hidden="true"></section>

        <section class="bs-sectie no-print">
            <div class="bs-wrap">
                <p class="bs-micro">De vuistregel</p>
                <h2 class="bs-titel">Zit het vast, dan mag het meestal</h2>
                <div class="bs-proza">
                    <p>Een bouwdepot is bedoeld voor kwaliteitsverbetering van de woning. De praktische toets die vrijwel elke geldverstrekker hanteert: <strong>kunt u het meenemen bij een verhuizing, dan hoort het er niet in</strong>. Een ingebouwde oven wel, een vrijstaande koelkast niet. Gelijmd parket wel, een losliggende vloer niet.</p>
                    <p>Van de ${totaalPosten} posten hierboven vallen er ${nietVast} doorgaans buiten het depot. Die staan gemarkeerd, zodat u er eigen geld voor kunt reserveren in plaats van er tijdens de verbouwing achter te komen.</p>
                    <p>Twijfelt u over een post, vraag het dan schriftelijk na bij uw geldverstrekker en bewaar het antwoord. Zie ook <a href="bouwdepot-declaratie-afgewezen.html">waarom declaraties worden afgewezen</a>.</p>
                </div>
            </div>
        </section>

        <section class="bs-sectie no-print">
            <div class="bs-wrap">
                <p class="bs-micro">Volgende stap</p>
                <h2 class="bs-titel">Van begroting naar financiering</h2>
                <div class="bs-rooster">
                    <a class="bs-tool" href="leenruimte.html">
                        <span class="bs-tool__naam">Kunt u dit bedrag lenen?</span>
                        <span class="bs-tool__uitleg">De vraag die vóór de maandlast komt: past dit bedrag binnen de waarde van uw woning na verbouwing, en hoeveel eigen geld heeft u nodig?</span>
                        <span class="bs-tool__meta">Leenruimte berekenen &rarr;</span>
                    </a>
                    <a class="bs-tool" href="bouwdepot-berekenen.html">
                        <span class="bs-tool__naam">Wat kost dit per maand?</span>
                        <span class="bs-tool__uitleg">Het depotbedrag omgerekend naar een maandlast, met uw eigen rente en looptijd.</span>
                        <span class="bs-tool__meta">Maandlast berekenen &rarr;</span>
                    </a>
                    <a class="bs-tool" href="${HUB}">
                        <span class="bs-tool__naam">Wat accepteert mijn bank?</span>
                        <span class="bs-tool__uitleg">Looptijd, vergoeding en bewijsstukken van ${banken.aanbieders.length} geldverstrekkers naast elkaar.</span>
                        <span class="bs-tool__meta">Voorwaarden bekijken &rarr;</span>
                    </a>
                    <a class="bs-tool" href="adviesgesprek-checklist.html">
                        <span class="bs-tool__naam">Naar het adviesgesprek</span>
                        <span class="bs-tool__uitleg">Wat u meeneemt en welke vragen u stelt, in een printbare checklist.</span>
                        <span class="bs-tool__meta">Checklist bekijken &rarr;</span>
                    </a>
                </div>
            </div>
        </section>

        <section class="bs-sectie no-print">
            <div class="bs-wrap">
                <div class="bs-melding">
                    <p><strong>Indicatief hulpmiddel.</strong> Of een post daadwerkelijk uit uw depot betaald mag worden, bepaalt uw eigen geldverstrekker op basis van uw verbouwingsplan en voorwaarden. De markeringen hier zijn afgeleid uit publieke productinformatie en zijn geen toezegging.</p>
                    <p>Lees de <a href="methodologie.html">rekenregels en beperkingen</a>. Ziet u een post die bij uw bank anders wordt beoordeeld? <a href="contact.html">Laat het weten</a>.</p>
                </div>
            </div>
        </section>
    </main>

    <div class="bs-band no-print" aria-hidden="true">
        <div class="bs-band__spoor">
            <span>Maandlasten &middot; Verbouwbegroting &middot; Leenruimte &middot; Nieuwbouwplanning &middot; Depotplanner &middot; Belastingvoordeel &middot; Voorwaarden per bank &middot;</span>
            <span>Maandlasten &middot; Verbouwbegroting &middot; Leenruimte &middot; Nieuwbouwplanning &middot; Depotplanner &middot; Belastingvoordeel &middot; Voorwaarden per bank &middot;</span>
        </div>
    </div>

    <footer class="bs-voet no-print">
        <div class="bs-wrap bs-voet__inner">
            <span>&copy; 2026 BouwdepotCalculator.nl &mdash; informatie, geen advies</span>
            <span>${VOET.map(([h, t]) => `<a href="${h}">${t}</a>`).join(' &middot; ')}</span>
        </div>
    </footer>

    <script type="module" src="/src/js/begroting.js"></script>
    <script type="module" src="/src/js/stickybalk.js"></script>

    <script type="application/ld+json">
    ${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Verbouwbegroting met bouwdepottoets',
      url: `${SITE}/${BESTAND}`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      description: 'Stel een verbouwbegroting samen en zie welk deel uit het bouwdepot mag en welk deel uit eigen geld betaald moet worden.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      publisher: { '@type': 'Organization', name: 'BouwdepotCalculator.nl', url: SITE },
    }, null, 2).replace(/\n/g, '\n    ')}
    </script>
    <script type="application/ld+json">
    ${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Verbouwbegroting' },
      ],
    }, null, 2).replace(/\n/g, '\n    ')}
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, BESTAND), html);
console.log(`${BESTAND} gegenereerd`);
console.log(`  ${posten.categorieen.length} categorieen, ${totaalPosten} posten`);
console.log(`  ${nietVast} posten gemarkeerd als eigen geld`);
