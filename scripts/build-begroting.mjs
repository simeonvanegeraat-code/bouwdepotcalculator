/**
 * Genereert de verbouwbegroting uit data/verbouwposten.json.
 *
 * De posten en de vraag of iets uit het depot mag, komen uit de data. Bedragen
 * staan er bewust niet in: verbouwkosten verschillen te sterk per woning en
 * regio om iets te publiceren dat we niet kunnen onderbouwen. De bezoeker vult
 * zijn eigen offertebedragen in.
 *
 * De pagina gebruikt de nieuwe vormgeving (src/styles/next) en wordt bediend
 * door src/verbouwen/pagina.js. Wijzig de opmaak hier, niet in
 * verbouwbegroting.html: dat bestand wordt bij elke build overschreven.
 *
 *   node scripts/build-begroting.mjs
 */

import fs from 'fs';
import path from 'path';
import { headerHtml } from './build-header.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const posten = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/verbouwposten.json'), 'utf8'));
const banken = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const BESTAND = 'verbouwbegroting.html';
const HUB = 'bouwdepot-voorwaarden-vergelijken.html';
const SITE = 'https://www.bouwdepotcalculator.nl';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const totaalPosten = posten.categorieen.reduce((n, c) => n + c.posten.length, 0);
const nietVast = posten.categorieen.flatMap((c) => c.posten).filter((p) => !p.vastAanWoning).length;

/* ---------------------------------------------------------------- categorieen */

// Uitklapbaar per categorie. Alle vierendertig velden tegelijk tonen maakte de
// pagina ruim tien schermen lang, waarvan tweederde invoervelden -- ook voor
// iemand die alleen zijn keuken verbouwt. Dichtgeklapt is de pagina een
// keuzelijst van zes regels: je opent wat op jou van toepassing is.
//
// Bewust <details> en geen eigen JavaScript: de inhoud blijft in de HTML staan
// en dus vindbaar, het werkt met het toetsenbord, en het werkt zonder script.
const prioriteit = (id, naam) => `<select class="wr-post__prioriteit" data-prioriteit="${id}" aria-label="Prioriteit ${esc(naam)}">
                                    <option value="noodzakelijk">Noodzakelijk</option>
                                    <option value="gewenst">Gewenst</option>
                                </select>`;

const categorieen = posten.categorieen.map((c) => `                <details class="wr-cat" data-cat="${esc(c.id)}">
                    <summary class="wr-cat__kop">
                        <span class="wr-cat__titel">
                            <h3>${esc(c.naam)}</h3>
                            <span class="wr-cat__uitleg">${esc(c.toelichting)}</span>
                        </span>
                        <!-- Subtotaal per categorie. Met vierendertig velden verspreid over
                             zes blokken weet je zonder dit niet waar je staat. -->
                        <span class="wr-cat__stand"><span class="wr-cat__subtotaal tnum" data-subtotaal="${esc(c.id)}"></span><span class="wr-cat__aantal">${c.posten.length} ${c.posten.length === 1 ? 'post' : 'posten'}</span></span>
                    </summary>
                    <div class="wr-cat__posten">
${c.posten.map((p) => `                        <div class="wr-post"${p.genoemdDoor?.length ? ` data-genoemd-door="${esc(p.genoemdDoor.join(' '))}"` : ''}>
                            <div class="wr-post__naam">
                                <label for="post-${p.id}">${esc(p.naam)}</label>
                                <span class="wr-post__merk">${p.vastAanWoning
                                  ? '<span class="wr-merkje wr-merkje--depot">uit depot</span>'
                                  : '<span class="wr-merkje wr-merkje--eigen">eigen geld</span>'}</span>
                                ${p.let_op ? `<small class="wr-post__letop">${esc(p.let_op)}</small>` : ''}
                            </div>
                            <div class="wr-post__invoer">
                                <!-- Tekstinvoer en niet type="number": daarin las de browser
                                     "20.000" als 20 en gooide hij "EUR 20.000" helemaal weg.
                                     inputmode houdt het numerieke toetsenbord op mobiel. -->
                                <div class="wr-veld__in"><span aria-hidden="true">&euro;</span><input type="text" id="post-${p.id}" data-post="${p.id}" data-vast="${p.vastAanWoning}" inputmode="decimal" placeholder="0" autocomplete="off"></div>
                                ${prioriteit(p.id, p.naam)}
                            </div>
                            <span class="wr-veld__fout wr-post__fout" role="alert"></span>
                        </div>`).join('\n')}
                    </div>
                </details>`).join('\n');

const veld = (id, naam, waarde, hulp, na = '', soort = 'numeric', voor = '&euro;') => `                        <div class="wr-veld">
                            <label for="${id}">${naam}</label>
                            <div class="wr-veld__in">${voor ? `<span aria-hidden="true">${voor}</span>` : ''}<input type="text" id="${id}" aria-describedby="fout-${id} hulp-${id}" value="${waarde}" inputmode="${soort}" autocomplete="off">${na ? `<span aria-hidden="true">${na}</span>` : ''}</div>
                            <span class="wr-veld__fout" id="fout-${id}" role="alert"></span>
                            <p class="wr-hulp" id="hulp-${id}">${hulp}</p>
                        </div>`;

/* --------------------------------------------------------------------- pagina */

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verbouwbegroting maken | Wat mag uit het bouwdepot?</title>
    <meta name="description" content="Stel uw verbouwbegroting samen en zie welk deel uit het bouwdepot mag en welk deel u zelf betaalt. Met een specificatie voor uw adviseur.">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="author" content="Simeon van Egeraat">
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
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9252617114074571"
      crossorigin="anonymous"></script>

    <!-- Vercel Web Analytics: cookieloos. Geen cookie en geen localStorage; de
         bezoeker wordt herkend aan een hash van het verzoek die na 24 uur
         vervalt. Wat er wel wordt vastgelegd staat in privacy.html. -->
    <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
    <script defer src="/_vercel/insights/script.js"></script>

    <!-- Deze pagina gebruikt de nieuwe vormgeving en laadt broadsheet.css niet. -->
    <link rel="stylesheet" href="/src/styles/next/tokens.css">
    <link rel="stylesheet" href="/src/styles/next/kop.css">
    <link rel="stylesheet" href="/src/styles/next/werkruimte.css">
</head>
<body class="ui wr">
    <a class="ui-skip" href="#inhoud">Direct naar de inhoud</a>

${headerHtml()}

    <main id="inhoud">
        <div class="wr-wrap wr-kop wr-geen-print">
            <nav class="wr-kruimel" aria-label="Kruimelpad"><a href="/">Home</a> <span aria-hidden="true">&middot;</span> <span>Verbouwen</span></nav>
            <h1 id="reken-titel">Wat gaat je verbouwing kosten?</h1>
            <p class="wr-lead">Begin met een bedrag en zie direct of het binnen de waarde van je woning past en wat het per maand doet. Werk het daarna uit tot een begroting per post.</p>
        </div>

        <!-- De pagina opent met de vraag die iedereen kan beantwoorden: ongeveer
             welk bedrag, en wat is de woning waard. Dat geeft meteen een
             uitkomst. De begroting per post staat eronder en neemt het bedrag
             over zodra hij is ingevuld.

             Het anker #leenruimte wordt gebruikt door de kop, de homepage en
             drie redirects in vercel.json (/leenruimte.html en twee oudere
             adressen). -->
        <div class="wr-wrap wr-geen-print" id="leenruimte">
            <div class="wr-werk">
                <section class="wr-paneel wr-uitkomst" aria-live="polite" aria-labelledby="lr-kop">
                    <p class="wr-uitkomst__label"><span id="lr-kop">Te lenen binnen de waarde van je woning</span> <span class="wr-stempel" id="lr-stempel">Voorbeeld</span></p>
                    <strong class="wr-uitkomst__bedrag tnum" id="lr-res-financierbaar" data-bedrag>&ndash;<small id="lr-res-van"></small></strong>
                    <p class="wr-uitkomst__zin" id="lr-res-zin">De berekening wordt geladen.</p>

                    <div class="wr-verhouding" aria-hidden="true">
                        <div class="wr-verhouding__balk"><i id="lr-balk-lening"></i><b id="lr-balk-ruimte"></b></div>
                        <p class="wr-verhouding__legenda"><span><i></i>Huidige hypotheek</span><span><b></b>Extra lening</span><span id="lr-res-verhouding"></span></p>
                    </div>

                    <dl class="wr-cijfers wr-cijfers--twee">
                        <div><dt>Extra per maand</dt><dd class="tnum" id="lr-res-maand">&ndash;<small id="lr-res-maand-noot">bruto</small></dd></div>
                        <div><dt>Eigen geld nodig</dt><dd class="tnum" id="lr-res-nodig">&ndash;<small id="lr-res-nodig-noot"></small></dd></div>
                        <div><dt>Eigen geld daarna</dt><dd class="tnum" id="lr-res-buffer">&ndash;<small id="lr-res-buffer-noot"></small></dd></div>
                        <div><dt>Ruimte in je woning</dt><dd class="tnum" id="lr-res-ruimte">&ndash;<small>woningwaarde min huidige hypotheek</small></dd></div>
                    </dl>
                    <p class="wr-uitkomst__noot">Een waardetoets, geen inkomenstoets. De hoofdregel is dat de totale hypotheek niet boven 100% van de woningwaarde uitkomt; wat je werkelijk kunt lenen hangt ook af van je inkomen en de beoordeling van de geldverstrekker.</p>
                </section>

                <form class="wr-paneel wr-invoer" novalidate onsubmit="return false">
                    <div class="wr-paneel__kop">
                        <h2>Jouw gegevens</h2>
                        <p class="wr-micro">Blijft op dit apparaat</p>
                    </div>

                    <fieldset class="wr-groep">
                        <legend>Je verbouwing</legend>
${veld('lr-totaal', 'Wat kost je verbouwing ongeveer?', '75000', 'Een ruwe schatting is genoeg om te beginnen. Vul je hieronder een begroting in, dan nemen we dat totaal over.')}
                        <label class="wr-vink" id="lr-volg-rij" hidden><input type="checkbox" id="lr-volg" checked> <span>Neem het totaal uit mijn begroting over</span></label>
                    </fieldset>

                    <fieldset class="wr-groep">
                        <legend>Je woning en hypotheek</legend>
${veld('lr-hypotheek', 'Huidige hypotheek', '300000', 'Wat er nu nog openstaat. Staat op je jaaroverzicht of in de app van je bank. Vul nul in als je geen hypotheek hebt.')}
${veld('lr-waarde', 'Woningwaarde na verbouwing', '360000', 'Staat in een taxatierapport. Heb je dat nog niet, vul dan in wat je woning nu waard is: dan zie je wat er minimaal kan. Niet elke euro verbouwing wordt een euro waarde.')}
${veld('lr-eigen-geld', 'Eigen geld voor dit plan', '25000', 'Alleen wat je echt voor deze verbouwing opzij hebt staan. Vul nul in als je alles wilt lenen.')}
${veld('input-interest', 'Hypotheekrente voor de extra lening', '3,80', 'De rente voor een nieuw leningdeel bij je geldverstrekker. Hiermee schatten we de maandlast, als annu&iuml;teit over 30 jaar.', '%', 'decimal', '')}
                    </fieldset>

                    <details class="wr-uitklap">
                        <summary><span>Meer instellingen<small>Losse spullen die niet uit het depot mogen</small></span></summary>
                        <div class="wr-uitklap__body">
${veld('lr-buiten-depot', 'Waarvan losse spullen en inrichting', '0', 'Het deel van je bedrag dat niet vast aan de woning zit, zoals meubels en losse apparatuur. Dat mag doorgaans niet uit het bouwdepot en betaal je zelf. Met een begroting hieronder vullen we dit voor je in.')}
                        </div>
                    </details>

                    <div class="wr-knoppen">
                        <button class="wr-knop wr-knop--klein" id="lr-praktijkcase" type="button">Terug naar het voorbeeld</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- De begroting per post. Volgorde in de HTML: posten, totaal. Op een
             telefoon begin je zo bij de velden en houdt de balk onderaan het
             totaal in beeld; op een breed scherm staat het totaal rechts naast
             de posten. De optelling gebeurt in src/js/begrotingrekenen.js. -->
        <div class="wr-wrap wr-sectie wr-sectie--strak wr-geen-print">
            <p class="ui-opschrift">Stap twee, als je offertes hebt</p>
            <h2>Maak er een begroting van</h2>
            <p class="wr-lead">Zet je offertes op een rij en zie welk deel uit het bouwdepot mag en welk deel je zelf betaalt. Het totaal gaat mee naar de berekening hierboven.</p>
        </div>
        <div class="wr-wrap wr-werk wr-werk--lang wr-geen-print" id="begroting">

            <section class="wr-paneel wr-invoer" aria-labelledby="begroting-kop">
                <div class="wr-paneel__kop">
                    <h3 class="wr-paneel__titel" id="begroting-kop">Je posten</h3>
                    <p class="wr-micro">Blijft op dit apparaat</p>
                </div>

                <p class="wr-hulp wr-hulp--groot"><strong>We vullen bewust geen prijzen voor je in.</strong> Verbouwkosten verschillen te sterk per woning, regio en uitvoering om een bedrag te noemen dat we kunnen onderbouwen. Gebruik je eigen offertes; dat is ook wat je geldverstrekker wil zien. Wat we wel toevoegen: per post of die doorgaans uit het bouwdepot mag, afgeleid uit wat de ${banken.aanbieders.length} vergeleken geldverstrekkers zelf publiceren.</p>

                <div data-bankkeuze></div>
                <p class="wr-melding wr-melding--klein" id="begroting-bankmelding" hidden><span id="begroting-bankmelding-tekst"></span></p>

                <div class="wr-cats">
${categorieen}
                <details class="wr-cat" data-cat="eigen" id="cat-eigen">
                    <summary class="wr-cat__kop">
                        <span class="wr-cat__titel">
                            <h3>Eigen posten</h3>
                            <span class="wr-cat__uitleg">Staat iets niet in de lijst? Voeg het hier toe en kies zelf of het vast aan de woning zit.</span>
                        </span>
                        <span class="wr-cat__stand"><span class="wr-cat__subtotaal tnum" data-subtotaal="eigen"></span><span class="wr-cat__aantal" id="eigen-aantal">zelf toevoegen</span></span>
                    </summary>
                    <div class="wr-cat__posten">
                        <div id="eigen-posten"></div>
                        <p><button class="wr-knop wr-knop--klein" id="eigen-post-erbij" type="button">+ Post toevoegen</button></p>
                    </div>
                </details>
                </div>
            </section>

            <section class="wr-paneel wr-uitkomst" id="uitkomst" aria-live="polite">
                <p class="wr-uitkomst__label"><span>Totaal van je begroting</span> <span class="wr-stempel">Per post</span></p>
                <strong class="wr-uitkomst__bedrag tnum" id="res-totaal" data-bedrag>&euro; 0</strong>
                <p class="wr-uitkomst__zin" id="res-zin">Vul in wat je verwacht uit te geven.</p>

                <dl class="wr-cijfers wr-cijfers--twee">
                    <div><dt>Uit het bouwdepot</dt><dd class="tnum" id="res-depot">&euro; 0<small>naar verwachting, met de reserve</small></dd></div>
                    <div><dt>Uit eigen geld</dt><dd class="tnum" id="res-eigen">&euro; 0<small>zit niet vast aan de woning</small></dd></div>
                    <div><dt>Waarvan onvoorzien</dt><dd class="tnum" id="res-marge">&euro; 0<small id="res-marge-noot">reserve over het depotdeel</small></dd></div>
                    <div><dt>Extra per maand</dt><dd class="tnum" id="res-maand">&ndash;<small id="res-maand-noot">volgt uit de berekening hierboven</small></dd></div>
                </dl>

                <div class="wr-uitkomst__veld">
                    <label for="in-onvoorzien">Reserve voor onvoorzien</label>
                    <div class="wr-veld__in"><input type="text" id="in-onvoorzien" value="10" inputmode="numeric" aria-describedby="fout-in-onvoorzien hulp-in-onvoorzien" autocomplete="off"><span aria-hidden="true">%</span></div>
                    <span class="wr-veld__fout" id="fout-in-onvoorzien" role="alert"></span>
                    <p class="wr-hulp" id="hulp-in-onvoorzien">Sloopwerk legt vaak verborgen gebreken bloot. Tien procent is in de bouw de gangbare vuistregel; bij oudere woningen wordt vijftien tot twintig procent aangehouden.</p>
                </div>

                <dl class="wr-dl wr-uitkomst__split">
                    <dt>Noodzakelijk</dt><dd id="res-noodzakelijk">&euro; 0</dd>
                    <dt>Gewenst</dt><dd id="res-gewenst">&euro; 0</dd>
                    <dt id="res-aantal">0 posten ingevuld</dt><dd></dd>
                </dl>

                <div class="wr-knoppen">
                    <a class="wr-knop wr-knop--licht" href="#leenruimte">Naar de berekening</a>
                    <button id="begroting-printen" class="wr-knop wr-knop--licht" type="button">Specificatie printen</button>
                    <button id="begroting-wissen" class="wr-knop wr-knop--licht" type="button">Wissen</button>
                </div>
            </section>
        </div>

        <!-- De specificatie die de bezoeker meeneemt. Alleen bij printen zichtbaar:
             op het scherm is het formulier het gereedschap, op papier is een
             ingevuld formulier geen document. Wordt gevuld door pagina.js. -->
        <section id="specificatie" class="wr-wrap wr-alleen-print" aria-hidden="true"></section>

        <section class="wr-wrap wr-sectie wr-geen-print">
            <p class="ui-opschrift">De vuistregel</p>
            <h2>Zit het vast, dan mag het meestal</h2>
            <div class="wr-proza">
                <p>Een bouwdepot is bedoeld voor kwaliteitsverbetering van de woning. De praktische toets die vrijwel elke geldverstrekker hanteert: <strong>kun je het meenemen bij een verhuizing, dan hoort het er niet in</strong>. Een ingebouwde oven wel, een vrijstaande koelkast niet. Gelijmd parket wel, een losliggende vloer niet.</p>
                <p>Van de ${totaalPosten} posten hierboven vallen er ${nietVast} doorgaans buiten het depot. Die staan gemarkeerd, zodat je er eigen geld voor kunt reserveren in plaats van er tijdens de verbouwing achter te komen.</p>
                <p>Twijfel je over een post, vraag het dan schriftelijk na bij je geldverstrekker en bewaar het antwoord. Zie ook <a href="bouwdepot-declaratie-afgewezen.html">waarom declaraties worden afgewezen</a>.</p>
            </div>
        </section>

        <section class="wr-wrap wr-sectie wr-geen-print" id="uitleg">
            <p class="ui-opschrift">Belangrijk onderscheid</p>
            <h2>Drie grenzen, en deze pagina toetst er &eacute;&eacute;n</h2>
            <div class="wr-kolommen">
                <article>
                    <h3>De waardegrens: wat hier wordt berekend</h3>
                    <p>De totale hypotheek mag als hoofdregel niet boven 100% van de woningwaarde na verbouwing uitkomen. Die grens toetst deze pagina. Voor energiebesparende maatregelen geldt bij sommige aanbieders extra ruimte.</p>
                </article>
                <article>
                    <h3>De inkomensgrens: hier niet berekend</h3>
                    <p>Een positieve waardetoets zegt niets over wat je op basis van inkomen, rente en verplichtingen kunt dragen. Die beoordeling zit bewust niet in deze tool; daarvoor heb je een adviseur nodig.</p>
                </article>
                <article>
                    <h3>Je eigen kasstroom</h3>
                    <p>Een financieringsgat en kosten die niet uit het depot mogen, vragen eigen geld. Wat daarna overblijft is je zichtbare buffer voor tegenvallers, en niet automatisch je volledige noodbuffer.</p>
                </article>
                <article>
                    <h3>Sluitend is niet hetzelfde als goedgekeurd</h3>
                    <p>De taxatie kan lager uitvallen dan verwacht, en een geldverstrekker kan posten weigeren. Gebruik de uitkomst als vragenlijst voor je dossier, niet als toezegging.</p>
                </article>
            </div>
        </section>

        <section class="wr-wrap wr-sectie wr-geen-print">
            <p class="ui-opschrift">Volgende stap</p>
            <h2>Van begroting naar financiering</h2>
            <div class="wr-register">
                <a id="naar-maandlast" href="bouwdepot-berekenen.html"><strong>Wat kost dit per maand, precies?</strong><span>Het depotbedrag omgerekend naar een maandlast, met je eigen looptijd, hypotheekvorm en bank.</span></a>
                <a href="${HUB}"><strong>Wat accepteert mijn bank?</strong><span>Looptijd, vergoeding en bewijsstukken van ${banken.aanbieders.length} geldverstrekkers naast elkaar.</span></a>
                <a href="stappenplan.html#adviesgesprek"><strong>Naar het adviesgesprek</strong><span>Wat je meeneemt en welke vragen je stelt, in een printbare checklist.</span></a>
                <a href="depotplanner.html"><strong>Loopt je depot al?</strong><span>Einddatum, restsaldo en het moment waarop de vergoeding stopt.</span></a>
            </div>
        </section>

        <div class="wr-wrap wr-geen-print">
            <div class="wr-melding">
                <p><strong>Indicatief hulpmiddel.</strong> Of een post daadwerkelijk uit je depot betaald mag worden, bepaalt je eigen geldverstrekker op basis van je verbouwingsplan en voorwaarden. De markeringen hier zijn afgeleid uit publieke productinformatie en zijn geen toezegging.</p>
                <p>Lees de <a href="methodologie.html">rekenregels en beperkingen</a>. Je begroting blijft op dit apparaat en wordt nergens verstuurd. Zie je een post die bij jouw bank anders wordt beoordeeld? <a href="contact.html">Laat het weten</a>.</p>
            </div>
        </div>
    </main>

    <div class="wr-vast" id="wr-vast" role="status"><span>Totale verbouwkosten</span><strong class="tnum" id="wr-vast-bedrag"></strong></div>

    <footer class="ui-voet wr-geen-print">
        <span>&copy; 2026 BouwdepotCalculator.nl &mdash; informatie, geen advies</span>
        <nav aria-label="Over deze site"><a href="methodologie.html">Methodologie</a><a href="privacy.html">Privacy</a><a href="cookies.html">Cookies</a><a href="voorwaarden.html">Voorwaarden</a><a href="over-ons.html">Over ons</a><a href="contact.html">Contact</a></nav>
    </footer>

    <script type="module" src="/src/verbouwen/pagina.js"></script>

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
