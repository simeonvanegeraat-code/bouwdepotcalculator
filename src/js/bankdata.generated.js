/**
 * GEGENEREERD BESTAND - niet met de hand aanpassen.
 * Bron: data/bouwdepot-voorwaarden.json
 * Opnieuw maken: node scripts/build-bankdata.mjs
 *
 * Laatst bijgewerkt volgens de bron: 2026-08-16
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
      "duurOnbekend": false
    },
    "maximaal": {
      "verbouw": 24,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Ja, maar niet de hele verlenging",
      "detail": "Tijdens de standaardlooptijd ontvangt u vergoeding. Verlengt u, dan krijgt u over de laatste 6 maanden geen rente meer. Bij nieuwbouw duurt de vergoeding maximaal 30 maanden, terwijl het depot tot 36 maanden kan lopen.",
      "model": "beperkt-in-duur",
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
      "detail": "Drie maanden voor de einddatum ontvangt u een brief over verlengen of beeindigen. Regelen kan via Internet Bankieren of met een formulier per post."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Meestal binnen 5 werkdagen",
    "voorschieten": null,
    "restant": {
      "waarde": "Gaat van de lening af",
      "detail": "Telt niet mee voor het bedrag dat je jaarlijks zonder extra kosten mag terugbetalen. Bij meerdere leningdelen bepaalt de bank de volgorde en kan die volgorde wijzigen."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur"
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht"
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
      "duurOnbekend": true
    },
    "maximaal": {
      "verbouw": null,
      "nieuwbouw": null
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente bij aanvang",
      "detail": "De depotrente wijzigt niet, ook niet als je hypotheekrente wijzigt. Na verlenging voorbij 2 jaar ontvang je geen rente meer.",
      "model": "beperkt-in-duur",
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
      "detail": null
    },
    "opnamemethode": "zelf-betalen",
    "uitbetaling": "Direct - je betaalt zelf vanuit het depot via Online Bankieren of de Rabo App",
    "voorschieten": "Niet nodig",
    "restant": {
      "waarde": "Wordt standaard afgelost op de lening",
      "detail": "Wil je het bedrag op je betaalrekening laten storten, dan is eerst een nieuwe inkomenstoets nodig via je adviseur."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Vooraf geen"
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht"
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
      "duurOnbekend": false
    },
    "maximaal": {
      "verbouw": 36,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Geen",
      "detail": "ING hanteert een afwijkend model: je betaalt alleen rente over het bedrag dat je al hebt opgenomen. Over het saldo dat nog in het depot staat betaal je geen rente en ontvang je ook geen rente. Voor de belastingaangifte vul je EUR 0,00 aan ontvangen rente in.",
      "model": "rente-alleen-over-opgenomen",
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
      "detail": "Aanvragen kan vanaf vier maanden voor de einddatum. Het verzoek wordt binnen vijf werkdagen afgehandeld."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Binnen vijf werkdagen bij een digitale declaratie die aan de voorwaarden voldoet",
    "voorschieten": "Ja, met bankafschrift",
    "restant": {
      "waarde": "Wordt afgelost op de hypotheek",
      "detail": "Is het restant hoger dan EUR 2.500, dan verlaagt ING de bij het afsluiten vastgestelde marktwaarde van de woning met dat bedrag. Ben je het daar niet mee eens, dan moet je een hogere waarde aantonen met een recent taxatierapport (waardepeildatum niet ouder dan zes maanden), een Calcasa Desktoptaxatie of een WOZ-beschikking."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur of kassabon"
      },
      {
        "eis": "taal-en-valuta",
        "waarde": "NL, EN, FR of DU en euro's"
      },
      {
        "eis": "factuurdatum",
        "waarde": "Na de offertedatum"
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht"
      }
    ],
    "declarabel": "Verbouwing van de woning zoals uitbouw of dakkapel, aanleg en inrichting van de tuin, vervanging van kozijnen, ramen en deuren, vloeren die onlosmakelijk met het huis verbonden zijn, ingebouwde verlichting, onderhoudsschilderwerk, op maat gemaakt zonnescherm, badkamer en keuken, asbestverwijdering en zonnepanelen. Voorwaarde bij verbouwing: de woning verbetert in kwaliteit en wordt meer waard, en de verbetering zit vast aan de woning. Niet: gereedschap, raamdecoratie zoals gordijnen en jaloezieen, en losse verlichting."
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
      "duurOnbekend": false
    },
    "maximaal": {
      "verbouw": 42,
      "nieuwbouw": 42
    },
    "vergoeding": {
      "samenvatting": "Ja, maar beperkt in duur",
      "detail": "Bij bestaande bouw over de eerste 12 maanden. Bij nieuwbouw en energiebesparende maatregelen over de eerste 24 maanden.",
      "model": "beperkt-in-duur",
      "maanden": {
        "verbouw": 12,
        "nieuwbouw": 24
      },
      "tarief": {
        "verbouw": "niet-gepubliceerd",
        "nieuwbouw": "niet-gepubliceerd"
      }
    },
    "verlengingAanvragen": {
      "maandenVoorEinde": null,
      "soort": null,
      "detail": "Aanvragen via MijnHypotheekOnline voordat de lopende termijn afloopt; een aantal maanden wordt niet genoemd."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Goedgekeurde nota's worden binnen vijf werkdagen na ontvangst uitbetaald",
    "voorschieten": null,
    "restant": {
      "waarde": "Onder EUR 1.000 uitbetaald, daarboven afgelost",
      "detail": "Een restantbedrag lager dan EUR 1.000 wordt bij beeindiging uitgekeerd op uw bankrekening. Is het hoger, dan gebruikt MUNT het volledige bedrag voor aflossing op de hypotheek."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur"
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
      "duurOnbekend": false
    },
    "maximaal": {
      "verbouw": 24,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Ja, gelijk aan je hypotheekrente",
      "detail": "Bij meerdere leningdelen met verschillende rentes ontvang je een gewogen gemiddelde van die rentes. De vergoeding stopt na 18 maanden bij verbouwing van een bestaande woning en na 30 maanden bij nieuwbouw.",
      "model": "beperkt-in-duur",
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
      "detail": "Een keer aan te vragen via mijnFlorius; een termijn wordt niet genoemd."
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Binnen vijf werkdagen na goedkeuring",
    "voorschieten": null,
    "restant": {
      "waarde": null,
      "detail": null
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Bon of rekening"
      }
    ],
    "declarabel": "Declareren op basis van een bon of rekening; je uploadt een foto of scan via mijnFlorius."
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
      "duurOnbekend": false
    },
    "maximaal": {
      "verbouw": 24,
      "nieuwbouw": 36
    },
    "vergoeding": {
      "samenvatting": "Ja, maar verschilt per depotsoort",
      "detail": "Bij het nieuwbouwdepot is de vergoeding gelijk aan de gemiddelde rente die je over je hypotheek betaalt. Bij het verbouwdepot ligt de vergoeding 1% lager dan die gemiddelde hypotheekrente. De vergoeding loopt 24 maanden bij nieuwbouw en 12 maanden bij verbouwing, en wordt automatisch verrekend met je maandbedrag.",
      "model": "beperkt-in-duur",
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
      "detail": null
    },
    "opnamemethode": "declaratie",
    "uitbetaling": "Verwerking duurt maximaal drie werkdagen; na goedkeuring wordt direct uitbetaald",
    "voorschieten": "Ja, met betaalbewijs",
    "restant": {
      "waarde": "Wordt gebruikt om de hypotheek af te lossen",
      "detail": "Aan die aflossing zijn geen kosten verbonden. Heeft u meerdere bouwdepots, dan worden die tegelijk gesloten; afzonderlijk sluiten kan niet. Beeindigen regelt u zelf via mijn.nn of de NN App."
    },
    "eigenArbeid": null,
    "eisen": [
      {
        "eis": "soort-bewijs",
        "waarde": "Factuur of kassabon"
      },
      {
        "eis": "ouderdom",
        "waarde": "Maximaal 6 maanden oud"
      },
      {
        "eis": "bestandsformaat",
        "waarde": "JPG, PNG of PDF"
      },
      {
        "eis": "factuurgegevens",
        "waarde": "KvK, btw en IBAN verplicht"
      },
      {
        "eis": "vast-aan-woning",
        "waarde": "Verplicht"
      }
    ],
    "declarabel": "Kosten voor bouw of verbouwing, zoals facturen van aannemer of architect en bouwmaterialen. Losse spullen zoals meubilair of apparaten vallen er niet onder."
  }
];

export const BRON_BIJGEWERKT = "2026-08-16";
