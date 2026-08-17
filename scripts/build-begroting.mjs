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
  ['/', 'Bereken'],
  [BESTAND, 'Begroting'],
  [HUB, 'Voorwaarden per bank'],
  ['kennisbank.html', 'Uitleg'],
];

const VOET = [
  ['/', 'Home'], [BESTAND, 'Verbouwbegroting'], ['depotplanner.html', 'Depotplanner'], [HUB, 'Voorwaarden per bank'],
  ['kennisbank.html', 'Kennisbank'], ['over-ons.html', 'Over ons'], ['methodologie.html', 'Methodologie'],
  ['contact.html', 'Contact'], ['privacy.html', 'Privacy'], ['cookies.html', 'Cookies'], ['voorwaarden.html', 'Voorwaarden'],
];

const totaalPosten = posten.categorieen.reduce((n, c) => n + c.posten.length, 0);
const nietVast = posten.categorieen.flatMap((c) => c.posten).filter((p) => !p.vastAanWoning).length;

/* ---------------------------------------------------------------- categorieen */

const categorieen = posten.categorieen.map((c) => `                <section class="cat">
                    <div class="cat__kop">
                        <h3>${esc(c.naam)}</h3>
                        <p class="ds-caption">${esc(c.toelichting)}</p>
                    </div>
                    <div class="cat__posten">
${c.posten.map((p) => `                        <div class="post${p.vastAanWoning ? '' : ' post--eigen-geld'}">
                            <div class="post__naam">
                                <label for="post-${p.id}">${esc(p.naam)}</label>
                                <span class="post__merk">${p.vastAanWoning
                                  ? '<span class="merkje merkje--depot">uit depot</span>'
                                  : '<span class="merkje merkje--eigen">eigen geld</span>'}</span>
                                ${p.let_op ? `<small class="post__letop">${esc(p.let_op)}</small>` : ''}
                                ${p.genoemdDoor?.length ? `<small class="post__bron" data-genoemd-door="${esc(p.genoemdDoor.join(' '))}">Expliciet genoemd door ${p.genoemdDoor.map(naamVan).map(esc).join(', ')}</small>` : ''}
                            </div>
                            <div class="post__invoer">
                                <div class="prefix-veld">
                                    <span>&euro;</span>
                                    <input class="ds-invoer" type="number" id="post-${p.id}" data-post="${p.id}" data-vast="${p.vastAanWoning}" min="0" step="100" inputmode="numeric" placeholder="0">
                                </div>
                                <select class="ds-invoer post__prioriteit" data-prioriteit="${p.id}" aria-label="Prioriteit ${esc(p.naam)}">
                                    <option value="noodzakelijk">Noodzakelijk</option>
                                    <option value="gewenst">Gewenst</option>
                                </select>
                            </div>
                        </div>`).join('\n')}
                    </div>
                </section>`).join('\n');

/* --------------------------------------------------------------------- pagina */

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verbouwbegroting maken | Wat mag uit het bouwdepot en wat niet?</title>
    <meta name="description" content="Stel uw verbouwbegroting samen en zie direct welk deel uit het bouwdepot mag en welk deel u uit eigen geld moet betalen. Met een specificatie die u meeneemt naar uw adviseur.">
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
    <link rel="stylesheet" href="/src/styles/calculator.css">
</head>
<body class="ds">
    <header class="kop no-print">
        <div class="ds-wrap kop__inner">
            <a class="merk" href="/">Bouwdepot<span>Calculator</span>.nl</a>
            <nav aria-label="Hoofdnavigatie">
${NAV.map(([h, t]) => `                <a href="${h}">${t}</a>`).join('\n')}
            </nav>
        </div>
    </header>

    <nav class="kruimel no-print" aria-label="Kruimelpad">
      <div class="ds-wrap">
        <ol>
          <li><a href="/">Home</a></li>
          <li aria-current="page">Verbouwbegroting</li>
        </ol>
      </div>
    </nav>

    <main id="begroting">
        <section class="ds-wrap reken">
            <div class="aanhef">
                <p class="ds-eyebrow">Stap 1 van uw verbouwing</p>
                <h1 id="reken-titel">Wat gaat uw verbouwing kosten?</h1>
                <p class="ds-caption">En vooral: welk deel mag uit het bouwdepot en welk deel betaalt u zelf?</p>
            </div>

            <div class="reken__grid">
                <div class="reken__uitkomst">
                    <div class="ds-uitkomst">
                        <p class="ds-uitkomst__label">Totale verbouwkosten</p>
                        <strong class="ds-uitkomst__bedrag" id="res-totaal" data-bedrag>&euro; 0</strong>
                        <p class="ds-uitkomst__toelichting" id="res-zin">Vul hieronder in wat u verwacht uit te geven.</p>

                        <dl class="ds-uitsplitsing">
                            <div><span>Naar verwachting uit het depot</span><strong id="res-depot" data-bedrag>&euro; 0</strong></div>
                            <div><span>Uit eigen geld</span><strong id="res-eigen" data-bedrag>&euro; 0</strong></div>
                            <div><span>Waarvan onvoorzien</span><strong id="res-marge" data-bedrag>&euro; 0</strong></div>
                        </dl>

                        <div class="ds-veld" style="margin-top: var(--ds-5)">
                            <div class="ds-veld__kop">
                                <label class="ds-veld__naam" for="in-onvoorzien">Reserve voor onvoorzien</label>
                                <span class="ds-veld__waarde tnum" id="toon-onvoorzien">10%</span>
                            </div>
                            <input class="ds-schuif" type="range" id="in-onvoorzien" min="0" max="30" step="1" value="10">
                            <p class="ds-caption">Sloopwerk legt vaak verborgen gebreken bloot. Een begroting zonder marge loopt bijna altijd vast.</p>
                        </div>

                        <details class="uitleg-details">
                            <summary>Verdeling noodzakelijk en gewenst</summary>
                            <div class="uitleg-details__body">
                                <ul class="ds-uitsplitsing ds-uitsplitsing--vlak">
                                    <li><span>Noodzakelijk</span><strong id="res-noodzakelijk">&euro; 0</strong></li>
                                    <li><span>Gewenst</span><strong id="res-gewenst">&euro; 0</strong></li>
                                </ul>
                                <p class="ds-caption">Leg vóór de start vast welke wens als eerste vervalt als het budget onder druk komt. Dan hoeft u die keuze niet te maken terwijl de aannemer staat te wachten.</p>
                                <p class="ds-caption" id="res-aantal">0 posten ingevuld</p>
                            </div>
                        </details>

                        <div class="uitkomst-acties no-print">
                            <a class="ds-knop ds-knop--primair" id="naar-maandlast" href="/">Wat kost dit per maand?</a>
                            <button id="begroting-printen" class="ds-knop ds-knop--rustig" type="button">Specificatie printen</button>
                            <button id="begroting-wissen" class="ds-knop ds-knop--rustig" type="button">Wissen</button>
                        </div>
                    </div>

                    <p class="ds-caption no-print" style="margin-top: var(--ds-3)">Uw begroting blijft op dit apparaat en wordt nergens verstuurd.</p>
                </div>

                <div class="reken__invoer">
                    <div class="melding no-print" style="margin-bottom: var(--ds-5)">
                        <p><strong>Wij vullen bewust geen prijzen voor u in.</strong> Verbouwkosten verschillen te sterk per woning, regio en uitvoering om een bedrag te noemen dat wij kunnen onderbouwen. Gebruik uw eigen offertes; dat is bovendien wat uw geldverstrekker wil zien.</p>
                        <p>Wat wij wél toevoegen: per post of die doorgaans uit het bouwdepot mag. Dat is afgeleid uit wat de ${banken.aanbieders.length} vergeleken geldverstrekkers zelf publiceren.</p>
                    </div>

                    <div data-bankkeuze class="no-print" style="margin-bottom: var(--ds-5)"></div>

                    <div class="bankmelding no-print" id="begroting-bankmelding" hidden style="margin-bottom: var(--ds-5)">
                        <p id="begroting-bankmelding-tekst"></p>
                    </div>

${categorieen}
                </div>
            </div>
        </section>

        <section class="ds-sectie ds-sectie--gevuld no-print">
            <div class="ds-wrap ds-wrap--smal">
                <div class="ds-sectiekop">
                    <p class="ds-eyebrow">De vuistregel</p>
                    <h2 class="ds-title">Zit het vast, dan mag het meestal</h2>
                </div>
                <div class="proza">
                    <p>Een bouwdepot is bedoeld voor kwaliteitsverbetering van de woning. De praktische toets die vrijwel elke geldverstrekker hanteert: <strong>kunt u het meenemen bij een verhuizing, dan hoort het er niet in</strong>. Een ingebouwde oven wel, een vrijstaande koelkast niet. Gelijmd parket wel, een losliggende vloer niet.</p>
                    <p>Van de ${totaalPosten} posten hierboven vallen er ${nietVast} doorgaans buiten het depot. Die staan gemarkeerd, zodat u er eigen geld voor kunt reserveren in plaats van er tijdens de verbouwing achter te komen.</p>
                    <p>Twijfelt u over een post, vraag het dan schriftelijk na bij uw geldverstrekker en bewaar het antwoord. Zie ook <a href="bouwdepot-declaratie-afgewezen.html">waarom declaraties worden afgewezen</a>.</p>
                </div>
            </div>
        </section>

        <section class="ds-sectie no-print">
            <div class="ds-wrap">
                <div class="ds-sectiekop">
                    <p class="ds-eyebrow">Volgende stap</p>
                    <h2 class="ds-title">Van begroting naar financiering</h2>
                </div>
                <div class="ds-keuzes">
                    <a class="ds-keuze" href="/">
                        <span class="ds-keuze__titel">Wat kost dit per maand?</span>
                        <span class="ds-keuze__uitleg">Het depotbedrag omgerekend naar een maandlast, met uw eigen rente en looptijd.</span>
                        <span class="ds-keuze__meta">Maandlast berekenen &rarr;</span>
                    </a>
                    <a class="ds-keuze" href="${HUB}">
                        <span class="ds-keuze__titel">Wat accepteert mijn bank?</span>
                        <span class="ds-keuze__uitleg">Looptijd, vergoeding en bewijsstukken van ${banken.aanbieders.length} geldverstrekkers naast elkaar.</span>
                        <span class="ds-keuze__meta">Voorwaarden bekijken &rarr;</span>
                    </a>
                    <a class="ds-keuze" href="adviesgesprek-checklist.html">
                        <span class="ds-keuze__titel">Naar het adviesgesprek</span>
                        <span class="ds-keuze__uitleg">Wat u meeneemt en welke vragen u stelt, in een printbare checklist.</span>
                        <span class="ds-keuze__meta">Checklist bekijken &rarr;</span>
                    </a>
                </div>
            </div>
        </section>

        <section class="ds-sectie no-print">
            <div class="ds-wrap ds-wrap--smal">
                <div class="melding">
                    <p><strong>Indicatief hulpmiddel.</strong> Of een post daadwerkelijk uit uw depot betaald mag worden, bepaalt uw eigen geldverstrekker op basis van uw verbouwingsplan en voorwaarden. De markeringen hier zijn afgeleid uit publieke productinformatie en zijn geen toezegging.</p>
                    <p>Lees de <a href="methodologie.html">rekenregels en beperkingen</a>. Ziet u een post die bij uw bank anders wordt beoordeeld? <a href="contact.html">Laat het weten</a>.</p>
                </div>
            </div>
        </section>
    </main>

    <footer class="voet no-print">
        <div class="ds-wrap">
            <nav class="voet__links" aria-label="Voettekst">
${VOET.map(([h, t]) => `                <a href="${h}">${t}</a>`).join('\n')}
            </nav>
            <p class="ds-caption">&copy; 2026 BouwdepotCalculator.nl &middot; Onafhankelijk informatieplatform, geen aanbieder van hypotheken.</p>
        </div>
    </footer>

    <script type="module" src="/src/js/begroting.js"></script>

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
