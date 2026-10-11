/**
 * Wat de pagina van één aanbieder meer zegt dan de tabel met voorwaarden.
 *
 * De tabel somt op wat een aanbieder publiceert. Wie een depot bij die
 * aanbieder heeft of overweegt, wil weten wat dat voor hem betekent: wanneer
 * gebeurt er wat, wat kost geld dat stilstaat, waar loopt een declaratie op
 * stuk en wat moet hij zelf nog navragen. Dat staat hier, per aanbieder
 * uitgerekend uit data/bouwdepot-voorwaarden.json.
 *
 * Niets hiervan is een oordeel of een advies. Het zijn de gepubliceerde
 * termijnen in een andere vorm, plus één rekenvoorbeeld waarvan de aanname
 * erbij staat. Wat een aanbieder niet publiceert wordt niet ingevuld: dan
 * staat er dat het niet uit te rekenen is, of komt het in de lijst met vragen.
 *
 * De functies die rekenen zijn puur en staan in tests/aanbieder-verdieping.test.mjs.
 */

/** De aanname van het rekenvoorbeeld: zo staat hij ook op de pagina. */
export const VOORBEELD = { rentePercent: 4, bedrag: 10000 };

const perMaand = (procent) => Math.round((VOORBEELD.bedrag * procent) / 100 / 12);

/**
 * Wat € 10.000 dat nog in depot staat per maand kost, per periode.
 *
 * Kosten zijn de hypotheekrente die je erover betaalt, min de vergoeding die je
 * erover ontvangt. Een bedrag van null betekent: niet uit te rekenen, omdat de
 * aanbieder de hoogte of de duur van de vergoeding niet publiceert.
 *
 * @returns {{geenRente:true} | {perioden:{van:number, tot:number|null, bedrag:number|null, bovengrens?:number, waarom:string}[], duurOnbekend:boolean}}
 */
export function stilstaandGeld(a, soort) {
  const v = a.rentevergoeding || {};
  if (v.model === 'rente-alleen-over-opgenomen') return { geenRente: true };

  const looptijd = soort === 'verbouw' ? a.looptijdVerbouwMaanden : a.looptijdNieuwbouwMaanden;
  const verlenging = a.verlengingMaanden?.[soort];
  const duurOnbekend = Boolean(a.verlengingMaanden?.mogelijkMaarDuurOnbekend);
  const max = looptijd + (typeof verlenging === 'number' ? verlenging : 0);
  const duur = v.vergoedingMaanden?.[soort];
  const tarief = v.tarief?.[soort];
  const vol = perMaand(VOORBEELD.rentePercent);

  if (typeof looptijd !== 'number' || typeof duur !== 'number') return { perioden: [], duurOnbekend };

  const tijdens = tarief === 'gelijk-aan-hypotheekrente'
    ? { bedrag: 0, waarom: 'De vergoeding is even hoog als de rente die je betaalt.' }
    : tarief === 'hypotheekrente-min-1'
      ? { bedrag: perMaand(1), waarom: 'De vergoeding ligt 1 procentpunt onder je hypotheekrente; dat verschil betaal je.' }
      : { bedrag: null, bovengrens: vol, waarom: 'De hoogte van de vergoeding is niet gepubliceerd of verschilt per product.' };

  const perioden = [];
  const eindeVergoeding = Math.min(duur, max);
  if (eindeVergoeding > 0) perioden.push({ van: 1, tot: eindeVergoeding, ...tijdens });
  if (duur < max) {
    perioden.push(v.vergoedingNaVerlengingOnbekend
      ? { van: duur + 1, tot: max, bedrag: null, bovengrens: vol, waarom: 'Niet gepubliceerd of de vergoeding in deze maanden doorloopt.' }
      : { van: duur + 1, tot: max, bedrag: vol, waarom: 'De vergoeding is gestopt; je betaalt de volle rente en ontvangt niets terug.' });
  }
  return { perioden, duurOnbekend };
}

const VRAGEN = [
  [(a) => ['niet-gepubliceerd', 'verschilt-per-product'].includes(a.rentevergoeding?.tarief?.verbouw) && a.rentevergoeding?.model !== 'rente-alleen-over-opgenomen',
    'Hoe hoog is de depotvergoeding ten opzichte van mijn hypotheekrente, voor mijn hypotheekvorm?'],
  [(a) => a.rentevergoeding?.vergoedingNaVerlengingOnbekend,
    'Loopt de depotvergoeding door als ik het depot verleng?'],
  [(a) => a.verlengingMaanden?.mogelijkMaarDuurOnbekend,
    'Met hoeveel maanden kan het depot worden verlengd, en onder welke voorwaarden?'],
  [(a) => typeof a.verlengingMaanden?.verbouw !== 'number' && !a.verlengingMaanden?.mogelijkMaarDuurOnbekend,
    'Is verlengen in mijn situatie toch mogelijk, of stopt het depot op de einddatum?'],
  // Alleen als er iets te verlengen valt; anders spreekt de vraag de vorige tegen.
  [(a) => a.verlengingAanvragen?.maandenVoorEinde == null && (typeof a.verlengingMaanden?.verbouw === 'number' || a.verlengingMaanden?.mogelijkMaarDuurOnbekend),
    'Hoeveel maanden voor de einddatum moet ik een verlenging geregeld hebben?'],
  [(a) => !a.maxPerOpname || a.maxPerOpname.status === 'niet-gepubliceerd',
    'Is er een maximumbedrag per declaratie of per opname?'],
  // Wie zelf vanuit het depot betaalt, declareert niet.
  [(a) => (!a.minPerOpname || a.minPerOpname.status === 'niet-gepubliceerd') && a.opnamemethode !== 'zelf-betalen',
    'Is er een minimumbedrag per declaratie?'],
  [(a) => (!a.minPerOpname || a.minPerOpname.status === 'niet-gepubliceerd') && a.opnamemethode === 'zelf-betalen',
    'Is er een minimumbedrag per overboeking uit het depot?'],
  [(a) => !a.doorlooptijdUitbetaling?.digitaal,
    'Hoe lang duurt het voordat een goedgekeurde declaratie is uitbetaald?'],
  [(a) => !a.voorschieten?.waarde,
    'Mag ik een rekening eerst zelf betalen en later terugvragen, en welk betaalbewijs is dan nodig?'],
  [(a) => !a.eigenArbeid || a.eigenArbeid.status === 'niet-gepubliceerd',
    'Mag ik eigen arbeid of zelf gekochte materialen declareren, en hoe toon ik dat aan?'],
  [(a) => !a.restant?.waarde,
    'Wat gebeurt er met het bedrag dat aan het einde overblijft?'],
];

/** De vragen die deze aanbieder publiek niet beantwoordt. */
export const openVragen = (a) => VRAGEN.filter(([geldt]) => geldt(a)).map(([, vraag]) => vraag);

const EISNAMEN = {
  'soort-bewijs': 'Soort bewijsstuk',
  'vast-aan-woning': 'Vast aan de woning',
  'factuurgegevens': 'Gegevens op de factuur',
  'ouderdom': 'Ouderdom van het bewijsstuk',
  'factuurdatum': 'Factuurdatum',
  'taal-en-valuta': 'Taal en valuta',
  'bestandsformaat': 'Bestandsformaat',
};

/** Hoeveel maanden na de start een gebeurtenis valt. */
const maandNa = (start, datum) => (datum.getFullYear() - start.getFullYear()) * 12 + datum.getMonth() - start.getMonth();

/**
 * De vier secties als HTML.
 *
 * @param {object} a           de aanbieder uit de dataset
 * @param {object} bank        dezelfde aanbieder uit BANKEN (src/js/bankdata.generated.js)
 * @param {function} gebeurtenissen  uit src/domain/depotplanning.js; dezelfde regels als de depotplanner
 * @param {{esc:function, euro:function}} hulp
 */
export function verdieping(a, bank, gebeurtenissen, { esc }) {
  const START = new Date(2027, 0, 15);
  const euro = (n) => `&euro;&nbsp;${n.toLocaleString('nl-NL')}`;

  /* --- 1. Maand voor maand --- */
  const lijn = (soort) => gebeurtenissen(bank, START, soort).map((g) => ({
    wanneer: g.datum ? (maandNa(START, g.datum) === 0 ? 'Bij de start' : `Maand ${maandNa(START, g.datum)}`) : 'Geen datum',
    naam: g.naam,
    // De start spreekt voor zich; de uitleg daarbij is op elke pagina dezelfde zin.
    uitleg: g.soort === 'start' ? '' : g.uitleg,
    zonder: !g.datum,
  }));
  const maanden = (rij) => `                <ol class="ul-maanden">
${rij.map((g) => `                    <li${g.zonder ? ' class="is-zonder"' : ''}><span>${esc(g.wanneer)}</span><div><strong>${esc(g.naam)}</strong>${g.uitleg ? `<p>${esc(g.uitleg)}</p>` : ''}</div></li>`).join('\n')}
                </ol>`;
  const lv = lijn('verbouw'), ln = lijn('nieuwbouw');
  const gelijk = JSON.stringify(lv) === JSON.stringify(ln);
  const tijdlijn = `
        <section class="wr-wrap wr-sectie" id="maand-voor-maand">
                <p class="ui-opschrift">In de tijd</p>
                <h2>Een depot bij ${esc(a.naam)}, maand voor maand</h2>
                <p class="wr-lead ul-lead">Dezelfde termijnen als in de tabel, maar dan in de volgorde waarin je ze tegenkomt. Geteld vanaf de maand waarin het depot opent.</p>
${gelijk
    ? `                <h3 class="ul-tussenkop">Verbouwing en nieuwbouw</h3>\n${maanden(lv)}`
    : `                <div class="ul-tweeluik">
                    <div>
                <h3 class="ul-tussenkop">Verbouwing van een bestaande woning</h3>
${maanden(lv)}
                    </div>
                    <div>
                <h3 class="ul-tussenkop">Nieuwbouw</h3>
${maanden(ln)}
                    </div>
                </div>`}
                <p class="wr-voorbehoud ul-na-lijst">Wil je dit met je eigen passeerdatum zien? De <a href="depotplanner.html">depotplanner</a> zet er datums bij en maakt er een agendabestand van.</p>
        </section>`;

  /* --- 2. Wat stilstaand geld kost --- */
  const blok = (soort) => {
    const s = stilstaandGeld(a, soort);
    if (s.geenRente) return null;
    if (!s.perioden.length) return '';
    return `                <dl class="ul-detail">
${s.perioden.map((p) => `                    <div>
                        <dt>Maand ${p.van}${p.tot && p.tot !== p.van ? ` t/m ${p.tot}` : ''}</dt>
                        <dd>${p.bedrag == null
    ? `<span class="ul-leeg">niet uit te rekenen</span>, hooguit ${euro(p.bovengrens)} per maand`
    : p.bedrag === 0 ? `<strong>${euro(0)} per maand</strong>` : `<strong>${euro(p.bedrag)} per maand</strong>`}<small>${esc(p.waarom)}</small></dd>
                    </div>`).join('\n')}
                </dl>${s.duurOnbekend ? `\n                <p class="wr-voorbehoud ul-na-lijst">${esc(a.naam)} maakt verlengen mogelijk maar publiceert niet met hoeveel maanden. Dit overzicht stopt daarom bij de standaardlooptijd.</p>` : ''}`;
  };
  const bv = blok('verbouw'), bn = blok('nieuwbouw');
  const kosten = `
        <section class="wr-wrap wr-sectie" id="stilstaand-geld">
                <p class="ui-opschrift">Rekenvoorbeeld</p>
                <h2>Wat stilstaand geld kost bij ${esc(a.naam)}</h2>
${bv === null
    ? `                <div class="wr-proza">
                    <p>${esc(a.naam)} rekent geen rente over het deel van het depot dat je nog niet hebt opgenomen, en vergoedt er ook niets over. Geld dat nog in depot staat kost hier dus niets. Je maandlast groeit mee met wat je opneemt: elke declaratie verhoogt het bedrag waarover je rente betaalt.</p>
                    <p>Bij de meeste andere aanbieders werkt het andersom: daar betaal je vanaf de eerste dag rente over het hele depot en krijg je een vergoeding terug. Het verschil zie je in de <a href="renteverlies-bouwdepot.html">renteverliesberekening</a>.</p>
                </div>`
    : `                <p class="wr-lead ul-lead">Per ${euro(VOORBEELD.bedrag)} die nog in depot staat, bij een hypotheekrente van ${VOORBEELD.rentePercent}%. Kosten zijn hier de rente die je betaalt min de vergoeding die je ontvangt, bruto.</p>
${bv === bn
    ? `                <h3 class="ul-tussenkop">Verbouwing en nieuwbouw</h3>\n${bv}`
    : `                <div class="ul-tweeluik">
                    <div>
                <h3 class="ul-tussenkop">Verbouwing van een bestaande woning</h3>
${bv}
                    </div>
                    <div>
                <h3 class="ul-tussenkop">Nieuwbouw</h3>
${bn}
                    </div>
                </div>`}
                <p class="wr-voorbehoud ul-na-lijst">Een voorbeeld, geen offerte: je eigen rente en opnametempo geven een ander bedrag. Reken het na in de <a href="renteverlies-bouwdepot.html">renteverliesberekening</a>.</p>`}
        </section>`;

  /* --- 3. Declareren --- */
  const eisen = a.declaratieEisen || [];
  const declareren = eisen.length ? `
        <section class="wr-wrap wr-sectie" id="declareren">
                <p class="ui-opschrift">Declareren</p>
                <h2>Waar een declaratie bij ${esc(a.naam)} aan moet voldoen</h2>
                <p class="wr-lead ul-lead">${a.opnamemethode === 'zelf-betalen'
    ? `Bij ${esc(a.naam)} betaal je zelf vanuit het depot; er is geen beoordeling vooraf. Dit is wat de aanbieder over de onderbouwing publiceert.`
    : `Dit zijn de eisen die ${esc(a.naam)} zelf publiceert. Voldoet een declaratie hier niet aan, dan wordt ze afgewezen en begin je opnieuw.`}</p>
                <dl class="ul-detail">
${eisen.map((e) => `                    <div>
                        <dt>${esc(EISNAMEN[e.eis] || e.eis)}</dt>
                        <dd><strong>${esc(e.waarde)}</strong>${e.detail ? `<small>${esc(e.detail)}</small>` : ''}${EISNAMEN[e.eis] ? `<small><a href="bouwdepot-declaratie-afgewezen.html#${esc(e.eis)}">Hoe andere aanbieders dit doen</a></small>` : ''}</dd>
                    </div>`).join('\n')}
                </dl>
        </section>` : '';

  /* --- 4. Zelf navragen --- */
  const open = openVragen(a);
  const navragen = open.length ? `
        <section class="wr-wrap wr-sectie" id="navragen">
                <p class="ui-opschrift">Niet gepubliceerd</p>
                <h2>Wat je bij ${esc(a.naam)} zelf moet navragen</h2>
                <p class="wr-lead ul-lead">Op deze ${open.length === 1 ? 'vraag geeft' : `${open.length} vragen geeft`} ${esc(a.naam)} publiek geen antwoord. Stel ze schriftelijk en bewaar het antwoord; een mondelinge toezegging helpt je niet als een declaratie later wordt afgewezen.</p>
                <ul class="wr-lijst wr-proza">
${open.map((v) => `                    <li>${esc(v)}</li>`).join('\n')}
                </ul>
        </section>` : '';

  return { tijdlijn, kosten, declareren, navragen };
}
