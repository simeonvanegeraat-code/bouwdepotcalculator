/**
 * GEGENEREERD BESTAND - niet met de hand aanpassen.
 * Bron: data/bouwdepot-voorwaarden.json
 * Opnieuw maken: node scripts/build-bankdata.mjs
 *
 * Laatst bijgewerkt volgens de bron: 2026-10-14
 */

export const BANKEN = [
  {
    "id": "abn-amro",
    "naam": "ABN AMRO",
    "pagina": "bouwdepot-abn-amro.html",
    "looptijd": {
      "verbouw": 18,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 6,
      "nieuwbouw": 12,
      "eenmalig": true,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 24,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Ja, maar niet de hele verlenging",
      "detail": "Tijdens de standaardlooptijd ontvang je vergoeding. Verleng je, dan krijg je over de laatste 6 maanden geen rente meer. Bij nieuwbouw duurt de vergoeding maximaal 30 maanden, terwijl het depot tot 36 maanden kan lopen.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 18,
        "nieuwbouw": 30
      },
      "tarief": {
        "verbouw": "niet-gepubliceerd",
        "nieuwbouw": "niet-gepubliceerd"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": 3,
      "soort": "bericht-van-bank",
      "automatisch": false,
      "detail": "Drie maanden voor de einddatum ontvang je een brief over verlengen of beeindigen. Regelen kan via Internet Bankieren of met een formulier per post."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Meestal binnen 5 werkdagen",
    "uitbetalingWerkdagen": 5,
    "voorschieten": "Bij verbouwing schiet je voor, bij nieuwbouw niet altijd",
    "restant": {
      "waarde": "Gaat van de lening af",
      "detail": "Telt niet mee voor het bedrag dat je jaarlijks zonder extra kosten mag terugbetalen. Bij meerdere leningdelen bepaalt de bank de volgorde en kan die volgorde wijzigen."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur",
        "detail": "Alleen bedragen uit het verbouwingsplan of de koop-/aannemingsovereenkomst, die onderdeel zijn van je hypotheekofferte."
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht",
        "detail": "Alleen verbeteringen die vast aan de woning zitten, zoals gelijmd parket en inbouwapparatuur."
      },
      {
        "eis": "factuurgegevens",
        "waarde": "KvK, btw-nummer en IBAN verplicht",
        "detail": "Op de rekening van de aannemer of leverancier staan naam, adres, KvK-nummer, IBAN en btw-identificatienummer, met een duidelijke omschrijving. Een kassabon noemt naam en adres; bij een pinbon stuur je ook de rekening of kassabon mee. Verwijst de rekening naar een offerte, voeg die dan toe."
      },
      {
        "eis": "ouderdom",
        "waarde": "Niet ouder dan 6 maanden",
        "detail": "De nota of factuur mag niet ouder zijn dan zes maanden."
      },
      {
        "eis": "factuurdatum",
        "waarde": "Met NHG: na de aanvraag van de offerte",
        "detail": "Bij een hypotheek met NHG moet de rekeningdatum na de aanvraagdatum van de hypotheekofferte liggen."
      },
      {
        "eis": "taal-en-valuta",
        "waarde": "NL, EN of DU en euro's",
        "detail": "Facturen mogen in het Engels of Duits zijn, maar altijd in euro's. De aannemer moet bij de Nederlandse KvK staan ingeschreven."
      },
      {
        "eis": "bestandsformaat",
        "waarde": "TIFF, PDF of JPEG, tot 20 MB",
        "detail": "De bijlage moet goed leesbaar zijn."
      }
    ],
    "declarabel": "Nieuwbouw: alleen bedragen uit de koop-/aannemingsovereenkomst en meerwerklijst. Verbouwing: alleen bedragen uit het verbouwingsplan. Alleen verbeteringen die vast aan de woning zitten, zoals gelijmd parket en inbouwapparatuur."
  },
  {
    "id": "rabobank",
    "naam": "Rabobank",
    "pagina": "bouwdepot-rabobank.html",
    "looptijd": {
      "verbouw": 24,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": null,
      "nieuwbouw": null,
      "eenmalig": null,
      "duurOnbekend": true,
      "geen": false
    },
    "maximaal": {
      "verbouw": null,
      "nieuwbouw": null
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente bij aanvang",
      "detail": "De depotrente wijzigt niet, ook niet als je hypotheekrente wijzigt. De vergoeding loopt over de hele looptijd van 2 jaar, maar stopt zodra het depot daarna wordt verlengd.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 24,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "gelijk-aan-hypotheekrente",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": false,
      "detail": null
    },
    "opnamemethode": "zelf-betalen",
    "uitbetaling": "Direct - je betaalt zelf vanuit het depot via Online Bankieren of de Rabo App",
    "uitbetalingWerkdagen": 0,
    "voorschieten": "Kan, je maakt het daarna naar jezelf over",
    "restant": {
      "waarde": "Wordt standaard afgelost op de lening",
      "detail": "Wil je het bedrag op je betaalrekening laten storten, dan is eerst een nieuwe inkomenstoets nodig via je adviseur. Los je zo meer af dan zonder kosten mag, dan betaal je een vergoeding; die hangt af van je rente en je vergoedingsvrije ruimte."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Vooraf geen",
        "detail": "Je betaalt zelf vanuit het depot en hoeft facturen niet vooraf in te dienen. Rabobank kan achteraf wel om onderbouwing vragen, dus bewaar alles."
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht",
        "detail": "Niet toegestaan: inboedel en spullen die je bij een verhuizing meeneemt, zoals gordijnen en meubels."
      }
    ],
    "declarabel": "Alle kosten die nodig zijn voor bouw, verbouwing of verduurzaming: aannemer, architect, bouwmaterialen, keuken, badkamer. Niet: inboedel en spullen die je bij een verhuizing meeneemt, zoals gordijnen en meubels."
  },
  {
    "id": "ing",
    "naam": "ING",
    "pagina": "bouwdepot-ing.html",
    "looptijd": {
      "verbouw": 24,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 12,
      "nieuwbouw": 12,
      "eenmalig": true,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 36,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Geen",
      "detail": "ING hanteert een afwijkend model: je betaalt alleen rente over het bedrag dat je al hebt opgenomen. Over het saldo dat nog in het depot staat betaal je geen rente en ontvang je ook geen rente. Voor de belastingaangifte vul je EUR 0,00 aan ontvangen rente in.",
      "model": "rente-alleen-over-opgenomen",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 0,
        "nieuwbouw": 0
      },
      "tarief": {
        "verbouw": "geen",
        "nieuwbouw": "geen"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": 4,
      "soort": "aanvraagvenster",
      "automatisch": false,
      "detail": "Aanvragen kan vanaf vier maanden voor de einddatum. Het verzoek wordt binnen vijf werkdagen afgehandeld."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Binnen vijf werkdagen bij een digitale declaratie die aan de voorwaarden voldoet",
    "uitbetalingWerkdagen": 5,
    "voorschieten": "Ja, met bankafschrift",
    "restant": {
      "waarde": "Wordt afgelost op de hypotheek",
      "detail": "Is het restant hoger dan EUR 2.500, dan verlaagt ING de bij het afsluiten vastgestelde marktwaarde van de woning met dat bedrag. Ben je het daar niet mee eens, dan moet je een hogere waarde aantonen met een recent taxatierapport (waardepeildatum niet ouder dan zes maanden), een Calcasa Desktoptaxatie of een WOZ-beschikking."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur of kassabon",
        "detail": "Een offerte, orderbevestiging, koopovereenkomst of pro-formafactuur wordt niet geaccepteerd."
      },
      {
        "eis": "taal-en-valuta",
        "waarde": "NL, EN, FR of DU en euro's",
        "detail": "Facturen en kassabonnen moeten in het Nederlands, Engels, Frans of Duits zijn, met bedragen in euro's."
      },
      {
        "eis": "factuurdatum",
        "waarde": "Na de offertedatum",
        "detail": "Alleen facturen met een datum na de datum van je hypotheekofferte worden in behandeling genomen."
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht",
        "detail": "De woning moet in kwaliteit verbeteren en de verbetering moet vastzitten. Niet toegestaan: gereedschap, raamdecoratie zoals gordijnen en jaloezieen, en losse verlichting."
      }
    ],
    "declarabel": "Verbouwing van de woning zoals uitbouw of dakkapel, aanleg, onderhoud en inrichting van de tuin, vervanging van kozijnen, ramen en deuren, vloeren die onlosmakelijk met het huis verbonden zijn, ingebouwde verlichting, onderhoudsschilderwerk, op maat gemaakt zonnescherm, badkamer en keuken, asbestverwijdering en zonnepanelen. Voorwaarde bij verbouwing: de woning verbetert in kwaliteit en wordt meer waard, en de verbetering zit vast aan de woning. Niet: gereedschap, raamdecoratie zoals gordijnen en jaloezieen, en losse verlichting."
  },
  {
    "id": "munt",
    "naam": "MUNT Hypotheken",
    "pagina": "bouwdepot-munt.html",
    "looptijd": {
      "verbouw": 24,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 18,
      "nieuwbouw": 18,
      "eenmalig": false,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 42,
      "nieuwbouw": 42
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente, maar beperkt in duur",
      "detail": "De vergoeding is het gewogen gemiddelde van de rentes van je leningdelen. Bij bestaande bouw krijg je haar over de eerste 12 maanden, bij nieuwbouw en energiebesparende maatregelen over de eerste 24 maanden. MUNT verrekent de vergoeding maandelijks achteraf, dus je eerste incasso kan hoger zijn dan je verwacht.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 12,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "gelijk-aan-hypotheekrente",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": false,
      "detail": "Aanvragen via MijnHypotheekOnline voordat de lopende termijn afloopt; een aantal maanden wordt niet genoemd."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Goedgekeurde nota's worden binnen vijf werkdagen na ontvangst uitbetaald",
    "uitbetalingWerkdagen": 5,
    "voorschieten": "Ja, declaraties gaan naar jou",
    "restant": {
      "waarde": "Onder EUR 1.000 uitbetaald, daarboven afgelost",
      "detail": "Een restantbedrag lager dan EUR 1.000 wordt bij beeindiging uitgekeerd op je bankrekening. Is het hoger, dan gebruikt MUNT het volledige bedrag voor aflossing op de hypotheek. Komt het saldo tijdens de looptijd onder EUR 1.000, dan maakt MUNT het restant ook naar je over; bewaar de nota's van wat je ermee betaalt."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur",
        "detail": "Op basis van een offerte wordt niet uitbetaald. De factuur moet duidelijk tonen welk werk is uitgevoerd of welke zaken zijn gekocht."
      }
    ],
    "declarabel": "Kosten voor bouw of verbouwing, zoals facturen van aannemer of architect en bouwmaterialen. Een offerte volstaat niet: op basis daarvan wordt niet uitbetaald. De factuur moet duidelijk tonen welk werk is uitgevoerd of welke zaken zijn gekocht."
  },
  {
    "id": "florius",
    "naam": "Florius",
    "pagina": "bouwdepot-florius.html",
    "looptijd": {
      "verbouw": 18,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 6,
      "nieuwbouw": 12,
      "eenmalig": true,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 24,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente",
      "detail": "Bij meerdere leningdelen met verschillende rentes ontvang je een gewogen gemiddelde van die rentes. De vergoeding stopt na 18 maanden bij verbouwing van een bestaande woning en na 30 maanden bij nieuwbouw.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 18,
        "nieuwbouw": 30
      },
      "tarief": {
        "verbouw": "gelijk-aan-hypotheekrente",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": false,
      "detail": "Een keer aan te vragen via mijnFlorius; een termijn wordt niet genoemd."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Binnen 5 werkdagen volgens het stappenplan op de pagina; elders op dezelfde pagina noemt Florius een beoordeling binnen 2 werkdagen en bij akkoord directe uitbetaling",
    "uitbetalingWerkdagen": 5,
    "voorschieten": "Ja, de declaratie gaat naar jou",
    "restant": {
      "waarde": "Tot EUR 7.500 naar je eigen rekening",
      "detail": "Florius maakt het restbedrag over naar je bankrekening. Twee uitzonderingen: met NHG wordt het altijd afgelost op de lening, en blijft er meer dan EUR 7.500 over dan wordt het afgelost ongeacht NHG. Voor energiebesparende maatregelen en de Florius Verduurzaam Hypotheek kunnen andere regels gelden."
    },
    "eigenArbeid": "Niet vergoed",
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Volledige factuur of ordernota",
        "detail": "Je uploadt een foto of scan via mijnFlorius. Afgekeurd worden: offertes, handgeschreven bonnen, een onvolledige factuur, en een nota die alleen naar een offerte verwijst zonder eigen specificatie."
      },
      {
        "eis": "ouderdom",
        "waarde": "Niet ouder dan 6 maanden",
        "detail": "De factuur mag niet ouder zijn dan zes maanden."
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht",
        "detail": "Twee eisen: het gaat om kwaliteitsverbetering waardoor de woning in waarde stijgt, en de verbetering zit vast aan de woning en is bij verkoop niet te verwijderen."
      },
      {
        "eis": "factuurdatum",
        "waarde": "Na de offertedatum",
        "detail": "Een nota die ouder is dan de datum waarop de hypotheekofferte is uitgebracht, wordt afgekeurd."
      }
    ],
    "declarabel": "Bouwmaterialen, arbeidskosten, binnenhuisinrichting zoals keukenapparatuur en badkamerinrichting, tuinaanleg en energiebesparende maatregelen. Niet: meubilair en accessoires, zoals een bankstel, niet-ingebouwde verlichting en raamdecoratie, gereedschap zoals een boormachine of zaag, en zelf uitgevoerd werk."
  },
  {
    "id": "nn",
    "naam": "Nationale-Nederlanden",
    "pagina": "bouwdepot-nn.html",
    "looptijd": {
      "verbouw": 12,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 12,
      "nieuwbouw": 12,
      "eenmalig": true,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 24,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Ja, maar verschilt per depotsoort",
      "detail": "Bij het nieuwbouwdepot is de vergoeding gelijk aan de gemiddelde rente die je over je hypotheek betaalt. Bij het verbouwdepot ligt de vergoeding 1% lager dan die gemiddelde hypotheekrente. De vergoeding loopt 24 maanden bij nieuwbouw en 12 maanden bij verbouwing, en wordt automatisch verrekend met je maandbedrag. Over de automatische verlenging krijg je geen vergoeding meer.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 12,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "hypotheekrente-min-1",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": true,
      "detail": "Niet nodig: NN verlengt het depot op de einddatum automatisch met 12 maanden."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Verwerking duurt maximaal drie werkdagen; na goedkeuring wordt direct uitbetaald",
    "uitbetalingWerkdagen": 3,
    "voorschieten": "Ja, met betaalbewijs",
    "restant": {
      "waarde": "Wordt gebruikt om de hypotheek af te lossen",
      "detail": "Aan die aflossing zijn geen kosten verbonden. Heb je meerdere bouwdepots, dan worden die tegelijk gesloten; afzonderlijk sluiten kan niet. Beeindigen regel je zelf via mijn.nn of de NN App."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur of kassabon",
        "detail": "Een offerte, opdrachtbevestiging of koopovereenkomst wordt niet geaccepteerd."
      },
      {
        "eis": "ouderdom",
        "waarde": "Maximaal 6 maanden oud",
        "detail": "Het bewijsstuk mag bij declaratie niet ouder zijn dan zes maanden."
      },
      {
        "eis": "bestandsformaat",
        "waarde": "JPG, PNG of PDF",
        "detail": "Goed leesbaar, zonder schaduw of weerspiegeling."
      },
      {
        "eis": "factuurgegevens",
        "waarde": "KvK, btw en IBAN verplicht",
        "detail": "Een factuur moet naam en adres van de verkoper, KvK-nummer, btw-nummer, IBAN, gegevens van de koper, factuurnummer, datum, omschrijving, totaalbedrag en btw vermelden."
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht",
        "detail": "Losse spullen zoals meubilair of apparaten vallen er niet onder."
      }
    ],
    "declarabel": "Kosten voor bouw of verbouwing, zoals facturen van aannemer of architect en bouwmaterialen. Losse spullen zoals meubilair of apparaten vallen er niet onder."
  },
  {
    "id": "obvion",
    "naam": "Obvion",
    "pagina": "bouwdepot-obvion.html",
    "looptijd": {
      "verbouw": 24,
      "nieuwbouw": 36
    },
    "verlenging": {
      "verbouw": null,
      "nieuwbouw": null,
      "eenmalig": null,
      "duurOnbekend": true,
      "geen": false
    },
    "maximaal": {
      "verbouw": null,
      "nieuwbouw": null
    },
    "vergoeding": {
      "samenvatting": "Ja, maar hoogte en duur verschillen per hypotheekvorm",
      "detail": "Bij de Woon Hypotheek is de vergoeding gelijk aan je hypotheekrente en loopt die 12 maanden bij bestaande bouw. Bij nieuwbouw is dat 24 maanden voor hypotheekaanvragen vanaf 16 september 2024; voor aanvragen van daarvóór blijft het 12 maanden. Bij de Basis, Compact en Obvion Hypotheek ligt de vergoeding 1% lager en loopt die in beide gevallen 24 maanden.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 12,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "verschilt-per-product",
        "nieuwbouw": "verschilt-per-product"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": false,
      "detail": null
    },
    "opnamemethode": "declaratie",
    "uitbetaling": null,
    "uitbetalingWerkdagen": null,
    "voorschieten": "Ja, bij een verbouwing gaat de declaratie naar jou",
    "restant": {
      "waarde": "Tot EUR 2.500 naar je eigen rekening",
      "detail": "Blijft er minder dan EUR 2.500 over, dan betaalt Obvion dat aan je uit. Is het meer, dan wordt het verwerkt als extra vergoedingsvrije terugbetaling op je lening."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Kopiefactuur of kassabon, getekend voor akkoord",
        "detail": "Je tekent de kopie van de factuur voor akkoord met betaling en uploadt die via MijnObvion. Kassabonnen mogen ook. Alleen een offerte is niet genoeg."
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht",
        "detail": "Het moet gaan om zaken die aan de woning vastzitten en die de waarde verhogen, conform de verbouwingsspecificatie."
      },
      {
        "eis": "factuurgegevens",
        "waarde": "Bedrijfslogo, KvK en btw-nummer voorgedrukt",
        "detail": "De factuur heeft een bedrijfslogo met voorgedrukt de volledige bedrijfsgegevens, het KvK-nummer en het btw-nummer, en een specificatie van de goederen of werkzaamheden. Als specificatie mag je de offerte of aanneemovereenkomst meesturen."
      },
      {
        "eis": "taal-en-valuta",
        "waarde": "NL, EN of DU en euro's",
        "detail": "Facturen moeten in het Nederlands, Engels of Duits zijn, met het bedrag in euro's."
      }
    ],
    "declarabel": "Kosten voor zaken die aan de woning vastzitten, zoals een keuken, badkamer of nieuwe vloer. De facturen moeten overeenkomen met de verbouwingsspecificatie en waardevermeerderend zijn."
  },
  {
    "id": "sns",
    "naam": "SNS",
    "pagina": "bouwdepot-sns.html",
    "looptijd": {
      "verbouw": 24,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 12,
      "nieuwbouw": 12,
      "eenmalig": true,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 36,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente",
      "detail": "De vergoeding loopt over de hele looptijd, dus ook over een verlenging en daarmee tot 36 maanden. Daardoor betaal je per saldo alleen hypotheekrente over het geld dat al aan de bouw of verbouwing is uitgegeven. Bij de SNS Bespaarhypotheek wordt de depotrente maandelijks opnieuw bepaald op het gewogen gemiddelde van je hypotheekrentes.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 36,
        "nieuwbouw": 36
      },
      "tarief": {
        "verbouw": "gelijk-aan-hypotheekrente",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": false,
      "detail": "De automatische verlenging na het eerste jaar vraagt geen actie. De extra verlenging na twee jaar vraag je per e-mail aan via bouwdepot@asnbank.nl, met je bouwdepotnummer; een termijn noemt SNS niet."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": null,
    "uitbetalingWerkdagen": null,
    "voorschieten": "Ja, met een betaalbewijs",
    "restant": {
      "waarde": "Wordt afgelost op de hypotheek",
      "detail": "Zit er bij beeindiging nog geld in het depot, dan gebruikt SNS dat om een deel van de hypotheek mee af te lossen. Heb je niet alle werkzaamheden uitgevoerd, dan kan SNS de marktwaarde van je huis aanpassen; dat kan gevolgen hebben voor je tariefgroep en je rente."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur of kassabon",
        "detail": "Heb je zelf voorgeschoten, dan hoort daar een betaalbewijs bij: een kopie bankafschrift of de bon van de pinbetaling. Ongespecificeerde facturen voor diensten worden afgekeurd."
      },
      {
        "eis": "ouderdom",
        "waarde": "Niet ouder dan 6 maanden",
        "detail": "De factuur of kassabon mag niet ouder zijn dan zes maanden."
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht",
        "detail": "De materialen moeten aan de woning vastzitten en mogen niet roerend zijn."
      },
      {
        "eis": "factuurdatum",
        "waarde": "Met NHG: na de offertedatum",
        "detail": "Bij een NHG-hypotheek mag de factuurdatum niet ouder zijn dan de offertedatum van de hypotheekaanvraag."
      },
      {
        "eis": "taal-en-valuta",
        "waarde": "NL, EN of DU en euro's",
        "detail": "Ook buitenlandse facturen mogen, in het Nederlands, Engels of Duits en met het bedrag in euro's. KvK- en btw-nummer mogen een buitenlandse variant zijn."
      }
    ],
    "declarabel": "Arbeidsuren en materialen die zijn besteed aan de bouw, verbouwing of verbetering van de woning. De materialen moeten aan de woning vastzitten en mogen niet verhuisbaar zijn. Niet: een losse koelkast, tuinverlichting, vloerbedekking, behang, gereedschap, los laminaat of een laadpaal."
  },
  {
    "id": "asr",
    "naam": "a.s.r.",
    "pagina": "bouwdepot-asr.html",
    "looptijd": {
      "verbouw": 12,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 12,
      "nieuwbouw": 6,
      "eenmalig": true,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 24,
      "nieuwbouw": 30
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan de gemiddelde rente over je lening",
      "detail": "De vergoeding is even hoog als de rente die je gemiddeld over je lening betaalt. Zij loopt over de standaardlooptijd; verleng je het depot, dan vervalt de vergoeding over die verlenging.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 12,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "gelijk-aan-hypotheekrente",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": 2,
      "soort": "bericht-van-bank",
      "automatisch": false,
      "detail": "Ongeveer twee maanden voor de einddatum krijg je bericht van a.s.r.; je vraagt de verlenging daarna zelf aan."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Binnen maximaal 5 werkdagen aan je of de aannemer",
    "uitbetalingWerkdagen": 5,
    "voorschieten": "Ja, bij een verbouwing gaat het bedrag naar jou",
    "restant": {
      "waarde": "Wordt afgelost op de lening, zonder kosten",
      "detail": "Het overgebleven bedrag gaat als terugbetaling op de lening. Daarvoor betaal je geen kosten, en het telt niet mee voor het percentage dat je elk jaar boetevrij mag aflossen."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Rekening of kassabon",
        "detail": "Een offerte, orderbevestiging of koopovereenkomst wordt niet geaccepteerd. De rekening moet goed leesbaar zijn."
      },
      {
        "eis": "ouderdom",
        "waarde": "Maximaal 6 maanden voor de aanvraagdatum",
        "detail": "De factuurdatum mag niet meer dan zes maanden liggen voor de aanvraagdatum op het renteaanbod van je lening."
      },
      {
        "eis": "factuurgegevens",
        "waarde": "Btw-nummer, btw-bedrag of KvK-nummer",
        "detail": "Op de rekening staat een btw-nummer en/of een btw-bedrag of het KvK-nummer, en duidelijk welke werkzaamheden zijn uitgevoerd. De rekening is gericht aan jou of je partner, en bij meerdere pagina's dien je ze allemaal in."
      },
      {
        "eis": "taal-en-valuta",
        "waarde": "NL, EN of DU",
        "detail": "De rekening is geschreven in het Nederlands, Engels of Duits."
      }
    ],
    "declarabel": "Rekeningen van aannemers en leveranciers, voor zover zij horen bij het project waarvoor het depot is geopend. a.s.r. kijkt bij elke rekening of die leesbaar is, binnen het doel van het depot valt, uit het resterende saldo betaald kan worden en of je maandbedrag niet achterloopt."
  },
  {
    "id": "asn",
    "naam": "ASN Bank",
    "pagina": "bouwdepot-asn.html",
    "looptijd": {
      "verbouw": 24,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 12,
      "nieuwbouw": 12,
      "eenmalig": true,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 36,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente",
      "detail": "De vergoeding is gelijk aan je hypotheekrente en wordt verrekend met de rente die je betaalt; je betaalt dus alleen rente over wat al is opgenomen. Het percentage wordt vastgezet als de akte passeert en tijdens de looptijd niet aangepast. ASN noemt geen moment waarop de vergoeding binnen de standaardlooptijd van 24 maanden stopt, en publiceert ook niet wat er met de vergoeding gebeurt als je verlengt. Uitzondering: bij de Bespaarhypotheek wordt het percentage elke maand opnieuw vastgesteld op het gewogen gemiddelde van je hypotheek.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": true,
      "maanden": {
        "verbouw": 24,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "gelijk-aan-hypotheekrente",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": false,
      "detail": null
    },
    "opnamemethode": "declaratie",
    "uitbetaling": null,
    "uitbetalingWerkdagen": null,
    "voorschieten": "Ja, aan jezelf uitbetaald",
    "restant": {
      "waarde": "Wordt kosteloos afgelost op de hypotheek",
      "detail": "Eerst op het leningdeel dat voor verduurzaming bestemd is, daarna op de rest van de hypotheek. Je betaalt geen vergoeding voor die extra aflossing."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur, ingediend via de app of online bankieren",
        "detail": "Betaal je er energiebesparende, klimaatadaptieve of natuurinclusieve voorzieningen van, dan moet dat duidelijk op de rekening staan. ASN belt als iets onduidelijk is of als je iets declareert wat niet mag."
      }
    ],
    "declarabel": "Werk en materiaal dat na afloop vast aan de woning zit. Daaronder vallen onder meer sanitair en tegelwerk, inbouwapparatuur en vaste keukenkasten, bestrating en beplanting, riolering en leidingwerk, een uitbouw of dakkapel, de cv-installatie en een vloer die vastligt zoals parket of gietvloer. Ook het plaatsen zelf telt mee: installatie, puinafvoer, de huur van gereedschap, containers en steigers, en het inschakelen van vakmensen. Losse of meeneembare zaken vallen erbuiten; ASN noemt zwevend laminaat, gordijnen, decoratie en tuinverlichting als voorbeelden die niet mogen."
  },
  {
    "id": "argenta",
    "naam": "Argenta",
    "pagina": "bouwdepot-argenta.html",
    "looptijd": {
      "verbouw": 24,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 12,
      "nieuwbouw": 12,
      "eenmalig": false,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 36,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente",
      "detail": "Het rentetarief van het bouwdepot is gelijk aan het tarief dat je voor de hypotheek betaalt. Argenta vermeldt uitdrukkelijk dat de vergoeding na verlenging vervalt.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 24,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "gelijk-aan-hypotheekrente",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": false,
      "detail": null
    },
    "opnamemethode": "declaratie",
    "uitbetaling": null,
    "uitbetalingWerkdagen": null,
    "voorschieten": "Ja, je kiest de bestemming per declaratie",
    "restant": {
      "waarde": "Geldt als extra aflossing",
      "detail": "Blijft er na de verbouwing saldo in het depot staan, dan wordt dat als extra aflossing op de lening verwerkt."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur of kassabon",
        "detail": "Je uploadt de stukken in Mijn Leninginzicht. Argenta controleert ze en betaalt na goedkeuring uit aan je of aan je leverancier."
      },
      {
        "eis": "factuurdatum",
        "waarde": "Na de aanvraagdatum van de offerte",
        "detail": "De factuurdatum mag niet voor de aanvraagdatum van de offerte liggen."
      },
      {
        "eis": "taal-en-valuta",
        "waarde": "Bedragen in euro's",
        "detail": "De bedragen op facturen moeten in euro's zijn."
      }
    ],
    "declarabel": "Kosten die binnen je verbouwplan vallen en nog niet zijn voldaan: bedragen uit de verbouwingsspecificatie, uit de koop- of aannemingsovereenkomst, en het meerwerk met de kosten die daarbij horen. Past een rekening qua bedrag of werkzaamheden niet in dat plan, dan wordt zij niet betaald. Niet: losse zaken zoals gordijnen, inrichting zoals een bed, tv of vloerkleed, en tuininrichting zoals een tuinset, barbecue of losse planten in een pot."
  },
  {
    "id": "centraal-beheer",
    "naam": "Centraal Beheer",
    "pagina": "bouwdepot-centraal-beheer.html",
    "looptijd": {
      "verbouw": 24,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": null,
      "nieuwbouw": null,
      "eenmalig": null,
      "duurOnbekend": false,
      "geen": true
    },
    "maximaal": {
      "verbouw": 24,
      "nieuwbouw": 24
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente",
      "detail": "Je betaalt hypotheekrente over het hele depot en ontvangt vergoeding over wat er nog in staat, tegen hetzelfde percentage. Neem je geld op, dan daalt de vergoeding en stijgt je maandlast.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": false,
      "maanden": {
        "verbouw": 24,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "gelijk-aan-hypotheekrente",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": false,
      "detail": null
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Binnen 6 werkdagen als de declaratie aan de spelregels voldoet",
    "uitbetalingWerkdagen": 6,
    "voorschieten": null,
    "restant": {
      "waarde": "Wordt afgelost op de lening",
      "detail": "Na de standaardlooptijd van twee jaar beeindigt Centraal Beheer het depot en lost het resterende bedrag af op de lening. Eerder beeindigen kan per e-mail."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur of kassabon",
        "detail": "Een offerte wordt niet geaccepteerd: uit het stuk moet blijken dat er een aankoop is geweest of werkzaamheden zijn gedaan."
      },
      {
        "eis": "ouderdom",
        "waarde": "Maximaal 6 maanden voor de startdatum van de hypotheek",
        "detail": "De factuur of kassabon mag niet ouder zijn dan zes maanden voor de startdatum van de hypotheek."
      }
    ],
    "declarabel": "Wat na de verbouwing vast aan de woning zit, en alleen voor zover het in je verbouwplan of koop-aanneemovereenkomst staat. Verplaatsbare inrichting valt erbuiten."
  },
  {
    "id": "allianz",
    "naam": "Allianz",
    "pagina": "bouwdepot-allianz.html",
    "looptijd": {
      "verbouw": 12,
      "nieuwbouw": 24
    },
    "verlenging": {
      "verbouw": 6,
      "nieuwbouw": 6,
      "eenmalig": null,
      "duurOnbekend": false,
      "geen": false
    },
    "maximaal": {
      "verbouw": 18,
      "nieuwbouw": 30
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente",
      "detail": "Je ontvangt dezelfde vergoeding als de rente die je over de lening betaalt. Zodra je facturen indient ga je over dat bedrag hypotheekrente betalen, dus je maandlast stijgt naarmate de verbouwing vordert. Of de vergoeding doorloopt als je het depot verlengt, publiceert Allianz niet.",
      "model": "beperkt-in-duur",
      "naVerlengingOnbekend": true,
      "maanden": {
        "verbouw": 12,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "gelijk-aan-hypotheekrente",
        "nieuwbouw": "gelijk-aan-hypotheekrente"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "automatisch": false,
      "detail": "Allianz noemt geen termijn waarbinnen je de verlenging aanvraagt."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Binnen 7 werkdagen: 6 voor de beoordeling en na goedkeuring 1 voor de uitbetaling. Via allianz.mijnleninginzicht.nl gaat het sneller dan per e-mail.",
    "uitbetalingWerkdagen": 7,
    "voorschieten": null,
    "restant": {
      "waarde": "Wordt afgelost op de hypotheek",
      "detail": "Geef je aan dat de verbouwing klaar is en staat er nog geld in het depot, dan lost Allianz dat af op je hypotheek."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Kopie van een factuur, rekening of kassabon",
        "detail": "Een bestelbon of offerte wordt niet uitbetaald. Daarop bestaat een uitzondering: een bestelbon van IKEA voor zaken die vast aan de woning komen te zitten."
      },
      {
        "eis": "factuurdatum",
        "waarde": "De factuurdatum moet na de hypotheekaanvraag liggen",
        "detail": "Ligt de datum op de factuur, rekening of kassabon voor de aanvraagdatum van de hypotheek, dan kan Allianz niet uitbetalen."
      },
      {
        "eis": "taal-en-valuta",
        "waarde": "NL, EN of DU",
        "detail": "Facturen en bonnen moeten in het Nederlands, Engels of Duits zijn."
      }
    ],
    "declarabel": "Werk aan de woning zelf, zoals een keuken, badkamer of vloer, en de materialen die daarbij horen. Allianz noemt onder meer gehuurd gereedschap, verf en gipsplaten. Je kunt alleen declareren wat in je verbouwplan staat."
  }
];

export const BRON_BIJGEWERKT = "2026-10-14";
