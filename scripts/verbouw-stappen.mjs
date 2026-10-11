/**
 * De stappen van de verbouwroute, als HTML voor scripts/build-begroting.mjs.
 *
 * Wie op verbouwbegroting.html komt, begint bij een startscherm, kiest wat hij
 * gaat doen en vult daarna alleen daar de bedragen van in. De schermen komen
 * uit data/verbouwposten.json, net als de begroting zelf: een post die daar
 * bijkomt, staat ook in de stappen.
 *
 * De stappen zijn een laag over de bestaande rekentool. Ze schrijven naar de
 * velden van de begroting en van de leenruimte; rekenen doet
 * src/verbouwen/pagina.js. Het gedrag staat in src/verbouwen/stappen.js, de
 * stijl in src/styles/next/nieuwbouw.css (gedeeld met de nieuwbouwroute) en
 * src/styles/next/verbouwen.css.
 */

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Wat er op een tegel onder de naam van de categorie staat. Een categorie die
// hier niet in staat krijgt haar eerste posten uit de data.
const KORT = {
  ruwbouw: 'Uitbouw, dakkapel, draagmuur',
  'keuken-badkamer': 'Keuken, badkamer, toilet',
  afbouw: 'Vloeren, kozijnen, stuc- en schilderwerk',
  verduurzaming: 'Isolatie, glas, warmtepomp, zonnepanelen',
  buiten: 'Tuin, zonwering, oprit',
  overig: 'Vergunning, opslag, tijdelijke kosten',
};

/**
 * De doorsnede van een huis naast de vragen. Elke categorie heeft er een eigen
 * plek in (data-zone); wat de bezoeker aanvinkt, licht op. Puur versiering:
 * aria-hidden, en op een smal scherm staat hij er niet.
 */
const HUIS = `<svg viewBox="0 0 420 400" focusable="false">
                    <rect class="vb-h-gras" x="0" y="330" width="420" height="16" rx="8"/>
                    <!-- buiten: boom, heg en pad -->
                    <g class="vb-zone" data-zone="buiten">
                        <rect class="vb-h-detail" x="34" y="262" width="6" height="68"/>
                        <circle class="vb-h-detail vb-h-groen" cx="37" cy="246" r="26"/>
                        <rect class="vb-h-detail vb-h-groen" x="2" y="312" width="66" height="18" rx="6"/>
                    </g>
                    <!-- verduurzaming: warmtepomp buiten, zonnepanelen op het dak -->
                    <g class="vb-zone" data-zone="verduurzaming">
                        <rect class="vb-h-detail vb-h-accent" x="72" y="302" width="22" height="28" rx="3"/>
                        <circle class="vb-h-detail vb-h-wit" cx="83" cy="316" r="7"/>
                        <polygon class="vb-h-detail vb-h-accent" points="236,96 286,134 268,134 222,100"/>
                        <polygon class="vb-h-detail vb-h-accent" points="216,82 232,94 218,98 204,88"/>
                    </g>
                    <!-- afbouw: woonkamer en slaapkamer -->
                    <g class="vb-zone" data-zone="afbouw">
                        <rect class="vb-h-kamer" x="100" y="232" width="100" height="98"/>
                        <rect class="vb-h-kamer" x="100" y="142" width="100" height="90"/>
                        <rect class="vb-h-detail vb-h-accent" x="100" y="322" width="100" height="8"/>
                        <rect class="vb-h-detail" x="116" y="296" width="52" height="22" rx="5"/>
                        <line class="vb-h-detail vb-h-lijn" x1="150" y1="232" x2="150" y2="252"/>
                        <circle class="vb-h-detail vb-h-accent" cx="150" cy="258" r="7"/>
                        <rect class="vb-h-detail" x="112" y="206" width="60" height="18" rx="4"/>
                        <rect class="vb-h-detail vb-h-wit" x="116" y="158" width="30" height="30"/>
                    </g>
                    <!-- keuken en badkamer -->
                    <g class="vb-zone" data-zone="keuken-badkamer">
                        <rect class="vb-h-kamer" x="200" y="232" width="100" height="98"/>
                        <rect class="vb-h-kamer" x="200" y="142" width="100" height="90"/>
                        <rect class="vb-h-detail" x="214" y="292" width="72" height="38"/>
                        <rect class="vb-h-detail vb-h-accent" x="214" y="286" width="72" height="7"/>
                        <rect class="vb-h-detail" x="232" y="244" width="36" height="14"/>
                        <path class="vb-h-detail vb-h-wit" d="M214 198 h70 v10 a14 14 0 0 1 -14 14 h-42 a14 14 0 0 1 -14 -14 z"/>
                        <line class="vb-h-detail vb-h-lijn" x1="280" y1="198" x2="280" y2="172"/>
                    </g>
                    <!-- ruwbouw: uitbouw en dakkapel -->
                    <g class="vb-zone" data-zone="ruwbouw">
                        <rect class="vb-h-kamer vb-h-nieuw" x="300" y="258" width="76" height="72"/>
                        <rect class="vb-h-detail" x="296" y="250" width="86" height="9"/>
                        <rect class="vb-h-detail vb-h-wit" x="318" y="278" width="40" height="52"/>
                        <rect class="vb-h-kamer vb-h-nieuw" x="124" y="92" width="44" height="34"/>
                        <rect class="vb-h-detail" x="120" y="86" width="52" height="7"/>
                        <rect class="vb-h-detail vb-h-wit" x="132" y="100" width="28" height="20"/>
                    </g>
                    <!-- overig: het bouwbord voor de deur -->
                    <g class="vb-zone" data-zone="overig">
                        <rect class="vb-h-detail" x="392" y="296" width="4" height="34"/>
                        <rect class="vb-h-detail vb-h-wit" x="378" y="276" width="34" height="24" rx="2"/>
                        <line class="vb-h-detail vb-h-lijn" x1="384" y1="284" x2="406" y2="284"/>
                        <line class="vb-h-detail vb-h-lijn" x1="384" y1="291" x2="400" y2="291"/>
                    </g>
                    <!-- het huis zelf: altijd te zien -->
                    <polyline class="vb-h-muur" points="100,330 100,142 300,142 300,330"/>
                    <line class="vb-h-muur" x1="100" y1="232" x2="300" y2="232"/>
                    <line class="vb-h-muur vb-h-muur--dun" x1="200" y1="142" x2="200" y2="330"/>
                    <polygon class="vb-h-dak" points="84,142 200,62 316,142"/>
                    <line class="vb-h-muur" x1="0" y1="330" x2="420" y2="330"/>
                </svg>`;

const knoppen = (laatste = false) => `<p class="nb-fout" role="alert" data-st-fout></p>
                    <p class="nb-knoppen"><button class="nb-link" type="button" data-vb-terug>Terug</button><button class="wr-knop wr-knop--vol" type="submit">${laatste ? 'Toon mijn overzicht' : 'Volgende'}</button></p>`;

const bedragveld = (id, naam, hulp, { voor = '&euro;', na = '', plaats = '0', soort = 'numeric' } = {}) => `<div class="nb-veld">
                        <label for="${id}">${naam}</label>
                        <div class="wr-veld__in">${voor ? `<span aria-hidden="true">${voor}</span>` : ''}<input type="text" id="${id}" inputmode="${soort}" autocomplete="off" placeholder="${plaats}">${na ? `<span aria-hidden="true">${na}</span>` : ''}</div>
                        ${hulp ? `<p class="wr-hulp">${hulp}</p>` : ''}
                    </div>`;

/** Het startscherm, de vragen en de voortgang; komt op de plek van de paginakop. */
export function stappenHtml(posten, { h1, lead }) {
  const tegels = posten.categorieen.map((c) => `                        <label><input type="checkbox" data-vb-cat="${esc(c.id)}"><span><strong>${esc(c.naam)}</strong>${esc(KORT[c.id] ?? c.posten.slice(0, 3).map((p) => p.naam).join(', '))}</span></label>`).join('\n');

  const categorieen = posten.categorieen.map((c) => `                <form class="nb-scherm vb-cat" data-scherm="cat-${esc(c.id)}" data-vb-naam="${esc(c.naam)}" novalidate hidden>
                    <p class="ui-opschrift">Wat kost het?</p>
                    <h2>${esc(c.naam)}</h2>
                    <p class="nb-uitleg">Vink aan wat je laat doen en vul het bedrag van je offerte in. Een schatting mag ook; je past het later aan.</p>
                    <div class="vb-posten">
${c.posten.map((p) => `                        <div class="vb-post" data-vb-post="${esc(p.id)}">
                            <label class="vb-post__kies"><input type="checkbox" data-vb-kies="${esc(p.id)}"><span>${esc(p.naam)}</span></label>
                            <span class="wr-merkje ${p.vastAanWoning ? 'wr-merkje--depot">uit depot' : 'wr-merkje--eigen">eigen geld'}</span>
                            <div class="vb-post__bedrag" hidden><div class="wr-veld__in"><span aria-hidden="true">&euro;</span><input type="text" id="vb-${esc(p.id)}" data-vb-bedrag="${esc(p.id)}" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="Bedrag voor ${esc(p.naam)}"></div></div>
                        </div>`).join('\n')}
                    </div>
                    ${knoppen()}
                </form>`).join('\n\n');

  return `        <!-- Wie hier komt, begint bij het startscherm en vult stap voor stap in;
             daarna komt het overzicht. Wie via het menu naar de leenruimte gaat
             (#leenruimte) of een bedrag in het adres meekrijgt, komt direct bij
             de rekentool. Dit regeltje beslist dat vóórdat de pagina getekend
             wordt; de rest staat in src/verbouwen/stappen.js. Zonder
             JavaScript staat de pagina er zoals altijd. -->
        <script>
            if ('noModule' in HTMLScriptElement.prototype) try {
                document.body.dataset.nb = location.hash === '#leenruimte' || new URLSearchParams(location.search).has('bedrag') ? 'klaar' : 'start';
            } catch (e) { document.body.dataset.nb = 'klaar'; }
        </script>

        <div class="wr-wrap nb wr-geen-print" data-stappen>
            <figure class="nb-bouw vb-huis" aria-hidden="true">
                ${HUIS}
            </figure>

            <div class="nb-paneel">
                <div class="wr-kop nb-scherm" data-scherm="start">
                    <nav class="wr-kruimel" aria-label="Kruimelpad"><a href="/">Home</a> <span aria-hidden="true">&middot;</span> <span>Verbouwen</span></nav>
                    <h1 id="reken-titel">${h1}</h1>
                    <p class="wr-lead">${lead}</p>
                    <div class="nb-start">
                        <p class="nb-knoppen">
                            <button class="wr-knop wr-knop--vol nb-groot" type="button" data-vb-naar="wat">Laten we beginnen</button>
                            <button class="nb-link" type="button" data-vb-voorbeeld>of bekijk eerst een voorbeeld</button>
                        </p>
                        <p class="nb-klein">Een paar korte vragen, alleen over wat jij gaat doen. Je gegevens blijven op dit apparaat.</p>
                        <p class="nb-verder" data-vb-verder hidden>Je hebt dit eerder ingevuld. <button class="nb-link" type="button" data-vb-overzicht>Ga verder met je overzicht</button></p>
                    </div>
                    <p class="nb-opnieuw"><button class="nb-link" type="button" data-vb-naar="wat">Stap voor stap invullen</button></p>
                </div>

                <form class="nb-scherm" data-scherm="wat" novalidate hidden>
                    <p class="ui-opschrift">Je verbouwing</p>
                    <h2>Wat ga je doen?</h2>
                    <p class="nb-uitleg">Vink aan wat bij je verbouwing hoort. Daarna vragen we alleen daarvan de bedragen.</p>
                    <fieldset class="nb-keuze vb-tegels">
                        <legend>Onderdelen van je verbouwing</legend>
${tegels}
                    </fieldset>
                    ${knoppen()}
                </form>

${categorieen}

                <form class="nb-scherm" data-scherm="reserve" novalidate hidden>
                    <p class="ui-opschrift">Onvoorzien</p>
                    <h2>Hoeveel reserve houd je aan?</h2>
                    <p class="nb-uitleg">Sloopwerk legt vaak verborgen gebreken bloot. Tien procent is in de bouw de gangbare vuistregel; bij een oudere woning is vijftien tot twintig niet vreemd.</p>
                    ${bedragveld('vb-reserve', 'Reserve voor onvoorzien', 'Over het deel dat uit het bouwdepot komt.', { voor: '', na: '%', plaats: '10' })}
                    <p class="nb-som" role="status">Je verbouwing komt op <strong class="tnum" data-vb-totaal>&ndash;</strong><span data-vb-totaal-noot></span></p>
                    ${knoppen()}
                </form>

                <form class="nb-scherm" data-scherm="geld" novalidate hidden>
                    <p class="ui-opschrift">Financiering</p>
                    <h2>Hoe financier je het?</h2>
                    <p class="nb-uitleg">Hiermee zien we of je verbouwing binnen de waarde van je woning past.</p>
                    ${bedragveld('vb-hypotheek', 'Huidige hypotheek', 'Wat er nu nog openstaat; staat op je jaaroverzicht. Geen hypotheek? Laat leeg.')}
                    ${bedragveld('vb-waarde', 'Woningwaarde na verbouwing', 'Uit een taxatierapport. Heb je dat nog niet, vul dan in wat je woning nu waard is: dan zie je wat er minimaal kan.', { plaats: '' })}
                    ${bedragveld('vb-eigen', 'Eigen geld voor dit plan', 'Wat je echt voor deze verbouwing opzij hebt staan. Leen je alles? Laat leeg.')}
                    ${knoppen()}
                </form>

                <form class="nb-scherm" data-scherm="rente" novalidate hidden>
                    <p class="ui-opschrift">Maandlast</p>
                    <h2>Tegen welke rente leen je bij?</h2>
                    <p class="nb-uitleg">De rente voor een nieuw leningdeel bij je geldverstrekker. Nog geen offerte? Vul in waar je mee rekent.</p>
                    ${bedragveld('vb-rente', 'Hypotheekrente', 'Hiermee schatten we de extra maandlast, annu&iuml;tair over 30 jaar.', { voor: '', na: '%', plaats: '3,80', soort: 'decimal' })}
                    ${knoppen(true)}
                </form>

                <div class="vb-voortgang" aria-hidden="true"><i data-vb-voortgang></i></div>
            </div>
        </div>
`;
}

/** Links op het overzicht, vóór het formulier van de leenruimte: wat er is ingevuld. */
export const SAMENVATTING = `                <div class="nb-links">
                <p class="wr-melding wr-melding--klein nb-voorbeeld" data-vb-voorbeeldmelding hidden><strong>Dit is een voorbeeld, niet jouw cijfers.</strong> <button class="nb-link" type="button" data-vb-naar="wat">Vul je eigen gegevens in</button></p>
                <section class="wr-paneel nb-samen" aria-labelledby="nb-samen-kop">
                    <div class="wr-paneel__kop">
                        <h2 id="nb-samen-kop">Jouw gegevens</h2>
                        <p class="wr-micro">Blijft op dit apparaat</p>
                    </div>
                    <dl class="wr-dl" data-vb-samen></dl>
                    <p class="nb-samen__knoppen"><button class="wr-knop wr-knop--klein" type="button" data-vb-aanpas aria-expanded="false" aria-controls="invoer">Aanpassen</button></p>
                </section>
`;

/** Onder dat formulier: de twee dingen waar de uitkomst een aanname voor gebruikt. */
export const CONTROLE = `
                <!-- De uitkomst leunt op twee dingen die de stappen niet kunnen weten:
                     wat de woning na de verbouwing waard is, en wat de eigen bank
                     uit het depot betaalt. -->
                <section class="wr-paneel nb-controle" aria-labelledby="nb-controle-kop">
                    <div class="wr-paneel__kop" style="margin-bottom:0">
                        <h2 id="nb-controle-kop">Nog te controleren</h2>
                    </div>
                    <p class="wr-hulp">Twee dingen bepalen je uitkomst en liggen nog niet vast.</p>
                    <div class="nb-punt">
                        <h3>De waarde na verbouwing</h3>
                        <p data-vb-waardepunt></p>
                        <p class="nb-punt__acties"><button class="wr-knop wr-knop--klein" type="button" data-vb-aanpas="waarde">Waarde aanpassen</button></p>
                    </div>
                    <div class="nb-punt">
                        <h3>Wat jouw bank uit het depot betaalt</h3>
                        <p data-vb-bankpunt></p>
                        <p class="nb-punt__acties"><button class="wr-knop wr-knop--klein" type="button" data-vb-aanpas="bank">Kies je geldverstrekker</button></p>
                    </div>
                </section>
                </div>
`;

/** Op het overzicht, op de plek van de lange lijst met posten: wat er is ingevuld. */
export const POSTENLIJST = `            <section class="wr-paneel vb-lijst" aria-labelledby="vb-lijst-kop">
                <div class="wr-paneel__kop">
                    <h3 class="wr-paneel__titel" id="vb-lijst-kop">Je posten</h3>
                    <p class="wr-micro" data-vb-lijst-aantal></p>
                </div>
                <dl class="wr-dl vb-lijst__posten" data-vb-lijst></dl>
                <p class="nb-samen__knoppen"><button class="wr-knop wr-knop--klein" type="button" data-vb-posten aria-expanded="false" aria-controls="begroting-posten">Posten aanpassen of toevoegen</button></p>
            </section>
`;
