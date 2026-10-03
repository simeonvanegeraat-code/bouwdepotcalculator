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
import { headerHtml } from './build-header.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const posten = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/verbouwposten.json'), 'utf8'));
const banken = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

const BESTAND = 'verbouwbegroting.html';
const HUB = 'bouwdepot-voorwaarden-vergelijken.html';
const SITE = 'https://www.bouwdepotcalculator.nl';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const naamVan = (id) => banken.aanbieders.find((a) => a.id === id)?.naam || id;

const VOET = [
  ['/', 'Home'], [BESTAND, 'Verbouwbegroting'], ['verbouwbegroting.html#leenruimte', 'Leenruimte'], ['depotplanner.html', 'Depotplanner'], [HUB, 'Voorwaarden per bank'],
  ['stappenplan.html', 'Uitleg'], ['over-ons.html', 'Over ons'], ['methodologie.html', 'Methodologie'],
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
${headerHtml()}

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
                        <article class="bs-blad">
                            <div class="bs-blad__kop">
                                <span class="bs-blad__merk">BouwdepotCalculator.nl</span>
                                <span class="bs-blad__stempel">Begroting</span>
                            </div>

                            <div class="bs-antwoord">
                                <p class="bs-antwoord__label">Totale verbouwkosten</p>
                                <strong class="bs-antwoord__bedrag" id="res-totaal" data-bedrag>&euro; 0</strong>
                                <p class="bs-antwoord__zin" id="res-zin">Vul hieronder in wat u verwacht uit te geven.</p>
                            </div>

                        <dl class="bs-uitsplitsing">
                            <div><dt>Naar verwachting uit het depot</dt><dd class="tnum" id="res-depot" data-bedrag>&euro; 0</dd></div>
                            <div><dt>Uit eigen geld</dt><dd class="tnum" id="res-eigen" data-bedrag>&euro; 0</dd></div>
                            <div><dt>Waarvan onvoorzien</dt><dd class="tnum" id="res-marge" data-bedrag>&euro; 0</dd></div>
                        </dl>

                        <div class="bs-notitie">
                            <div class="bs-veld__kop"><label class="bs-veld__naam" for="in-onvoorzien">Reserve voor onvoorzien</label></div>
                            <!-- Een veld en geen schuif. Dit is een percentage, en de hulptekst
                                 hieronder noemt de drie waarden die er in de bouw toe doen: tien,
                                 vijftien en twintig. Die typ je sneller dan je ze sleept. De schuif
                                 was bovendien de enige bediening, met de waarde alleen-lezen op
                                 halve maat ernaast -- hetzelfde gebrek als bij Looptijd. -->
                            <div class="bs-omhulsel">
                                <span></span>
                                <input type="text" id="in-onvoorzien" value="10" inputmode="numeric" aria-describedby="fout-in-onvoorzien">
                                <span>%</span>
                            </div>
                            <span class="bs-veld__fout" id="fout-in-onvoorzien" role="alert"></span>
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


        <section class="bs-reken" id="leenruimte">
            <div class="bs-wrap">
                <nav class="bs-kruimel" aria-label="Kruimelpad">
                    <a href="/">Home</a> <span aria-hidden="true">&middot;</span> <span>Leenruimte</span>
                </nav>
                <p class="bs-micro">Kunt u dit lenen?</p>
                <h2 class="bs-reken__titel">Past uw verbouwing binnen de waarde van uw woning?</h2>
                <p class="bs-reken__lead">Een waardetoets, geen inkomenstoets. Wat u werkelijk kunt lenen hangt daarnaast af van uw inkomen en de beoordeling van de geldverstrekker.</p>

                <div class="bs-reken__grid">
                    <div>
                        <article class="bs-blad">
                            <div class="bs-blad__kop">
                                <span class="bs-blad__merk">BouwdepotCalculator.nl</span>
                                <span class="bs-blad__stempel">Waardetoets</span>
                            </div>

                            <div class="bs-antwoord">
                                <p class="bs-antwoord__label">Ruimte op basis van woningwaarde</p>
                                <strong class="bs-antwoord__bedrag" id="lr-res-ruimte" data-bedrag>&euro; 0</strong>
                                <p class="bs-antwoord__zin" id="lr-res-zin">Vul uw gegevens in om de waarderuimte te beoordelen.</p>
                            </div>

                            <div class="bs-verhouding" aria-hidden="true">
                                <div class="bs-verhouding__balk">
                                    <div class="bs-verhouding__rente" id="lr-balk-lening" style="width:0%"></div>
                                    <div class="bs-verhouding__aflossing" id="lr-balk-ruimte" style="width:0%"></div>
                                </div>
                                <p class="bs-verhouding__legenda">
                                    <span><i class="bs-verhouding__rente"></i>Huidige hypotheek</span>
                                    <span><i class="bs-verhouding__aflossing"></i>Extra lening</span>
                                </p>
                                <p class="bs-hulp" id="lr-res-verhouding">Vul de waarde na verbouwing in</p>
                            </div>

                            <dl class="bs-uitsplitsing">
                                <div><dt>Niet gedekt door waarderuimte</dt><dd class="tnum" id="lr-res-gat" data-bedrag>&euro; 0</dd></div>
                                <div><dt>Eigen geld nodig in dit model</dt><dd class="tnum" id="lr-res-nodig" data-bedrag>&euro; 0</dd></div>
                                <div><dt>Eigen buffer daarna</dt><dd class="tnum" id="lr-res-buffer" data-bedrag>&euro; 0</dd></div>
                            </dl>

                            <p class="bs-notitie">De hoofdregel is dat de totale hypotheek niet boven 100% van de woningwaarde uitkomt. Bij energiebesparende maatregelen geldt soms meer ruimte.</p>

                            <p class="bs-blad__voet">Indicatief &middot; informatie, geen advies</p>
                        </article>

                        <p class="bs-vervolgstap">Past uw plan binnen de waarderuimte? <a href="bouwdepot-berekenen.html#tijdens-de-bouw">Bereken wat het per maand kost &rarr;</a></p>
                    </div>

                    <div class="bs-invoer">
                        <div>
                            <div class="bs-veld__kop"><label class="bs-veld__naam" for="lr-bedrag">Gewenst bedrag voor de verbouwing</label></div>
                            <div class="bs-omhulsel"><span>&euro;</span><input type="text" id="lr-bedrag" aria-describedby="fout-lr-bedrag" value="75000" inputmode="numeric"></div>
                                <span class="bs-veld__fout" id="fout-lr-bedrag" role="alert"></span>
                            <p class="bs-hulp">Komt uit uw <a href="verbouwbegroting.html">verbouwbegroting</a>, of vul uw eigen schatting in.</p>
                        </div>

                        <div class="bs-veldrij">
                            <div>
                                <div class="bs-veld__kop"><label class="bs-veld__naam" for="lr-hypotheek">Huidige hypotheek</label></div>
                                <div class="bs-omhulsel"><span>&euro;</span><input type="text" id="lr-hypotheek" aria-describedby="fout-lr-hypotheek" value="300000" inputmode="numeric"></div>
                                <span class="bs-veld__fout" id="fout-lr-hypotheek" role="alert"></span>
                                <p class="bs-hulp">Openstaand saldo v&oacute;&oacute;r de extra lening.</p>
                            </div>
                            <div>
                                <div class="bs-veld__kop"><label class="bs-veld__naam" for="lr-waarde">Waarde na verbouwing</label></div>
                                <div class="bs-omhulsel"><span>&euro;</span><input type="text" id="lr-waarde" aria-describedby="fout-lr-waarde" value="360000" inputmode="numeric"></div>
                                <span class="bs-veld__fout" id="fout-lr-waarde" role="alert"></span>
                                <p class="bs-hulp">Gebruik bij voorkeur een taxatie, niet uw eigen inschatting.</p>
                            </div>
                            <div>
                                <div class="bs-veld__kop"><label class="bs-veld__naam" for="lr-eigen-geld">Beschikbaar eigen geld</label></div>
                                <div class="bs-omhulsel"><span>&euro;</span><input type="text" id="lr-eigen-geld" aria-describedby="fout-lr-eigen-geld" value="25000" inputmode="numeric"></div>
                                <span class="bs-veld__fout" id="fout-lr-eigen-geld" role="alert"></span>
                                <p class="bs-hulp">Alleen wat u echt voor dit plan reserveert.</p>
                            </div>
                            <div>
                                <div class="bs-veld__kop"><label class="bs-veld__naam" for="lr-buiten-depot">Kosten buiten het depot</label></div>
                                <div class="bs-omhulsel"><span>&euro;</span><input type="text" id="lr-buiten-depot" aria-describedby="fout-lr-buiten-depot" value="10000" inputmode="numeric"></div>
                                <span class="bs-veld__fout" id="fout-lr-buiten-depot" role="alert"></span>
                                <p class="bs-hulp">Losse spullen, inrichting en posten die uw bank niet accepteert. Staat in uw <a href="verbouwbegroting.html">begroting</a> onder eigen geld.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Doorrekenen en de praktijkcase horen ná de invoer: het zijn
                         acties die je neemt als je klaar bent met invullen. -->
                    <div class="bs-reken__na no-print">
                        <a class="bs-knop" id="lr-naar-maandlast" href="bouwdepot-berekenen.html">Wat kost dit per maand?</a>
                        <button class="bs-knop bs-knop--licht" id="lr-praktijkcase" type="button">Laad praktijkcase van &euro; 75.000</button>
                        <p class="bs-voorbehoud">Uw invoer blijft op dit apparaat en wordt nergens verstuurd.</p>
                    </div>
                </div>
            </div>
        </section>
        <section class="bs-sectie" id="uitleg">
            <div class="bs-wrap">
                <p class="bs-micro">Belangrijk onderscheid</p>
                <h2 class="bs-titel">Drie grenzen, en deze pagina toetst er &eacute;&eacute;n</h2>
                <div class="bs-kolommen">
                    <article>
                        <h3>De waardegrens &mdash; wat hier wordt berekend</h3>
                        <p>De totale hypotheek mag als hoofdregel niet boven 100% van de woningwaarde na verbouwing uitkomen. Die grens toetst deze pagina. Voor energiebesparende maatregelen geldt bij sommige aanbieders extra ruimte.</p>
                    </article>
                    <article>
                        <h3>De inkomensgrens &mdash; hier niet berekend</h3>
                        <p>Een positieve waardetoets zegt niets over wat u op basis van inkomen, rente en verplichtingen kunt dragen. Die beoordeling zit bewust niet in deze tool; daarvoor heeft u een adviseur nodig.</p>
                    </article>
                    <article>
                        <h3>Uw eigen kasstroom</h3>
                        <p>Een financieringsgat en kosten die niet uit het depot mogen, vragen eigen geld. Wat daarna overblijft is uw zichtbare buffer voor tegenvallers, en niet automatisch uw volledige noodbuffer.</p>
                    </article>
                    <article>
                        <h3>Sluitend is niet hetzelfde als goedgekeurd</h3>
                        <p>De taxatie kan lager uitvallen dan verwacht, en een geldverstrekker kan posten weigeren. Gebruik de uitkomst als vragenlijst voor uw dossier, niet als toezegging.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="bs-sectie no-print">
            <div class="bs-wrap">
                <p class="bs-micro">Volgende stap</p>
                <h2 class="bs-titel">Van begroting naar financiering</h2>
                <div class="bs-rooster">
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
                    <a class="bs-tool" href="stappenplan.html#adviesgesprek">
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
    <script type="module" src="/src/js/leenruimte.js"></script>
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
