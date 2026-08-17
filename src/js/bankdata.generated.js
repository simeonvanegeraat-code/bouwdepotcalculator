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
    "opnamemethode": "declaratie",
    "uitbetaling": "Meestal binnen 5 werkdagen",
    "voorschieten": null,
    "restant": "Gaat van de lening af",
    "eigenArbeid": null
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
    "opnamemethode": "zelf-betalen",
    "uitbetaling": "Direct - je betaalt zelf vanuit het depot via Online Bankieren of de Rabo App",
    "voorschieten": "Niet nodig",
    "restant": "Wordt standaard afgelost op de lening",
    "eigenArbeid": null
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
    "opnamemethode": "declaratie",
    "uitbetaling": "Binnen vijf werkdagen bij een digitale declaratie die aan de voorwaarden voldoet",
    "voorschieten": "Ja, met bankafschrift",
    "restant": "Wordt afgelost op de hypotheek",
    "eigenArbeid": null
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
    "opnamemethode": "declaratie",
    "uitbetaling": "Goedgekeurde nota's worden binnen vijf werkdagen na ontvangst uitbetaald",
    "voorschieten": null,
    "restant": "Onder EUR 1.000 uitbetaald, daarboven afgelost",
    "eigenArbeid": null
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
    "opnamemethode": "declaratie",
    "uitbetaling": "Binnen vijf werkdagen na goedkeuring",
    "voorschieten": null,
    "restant": null,
    "eigenArbeid": null
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
    "opnamemethode": "declaratie",
    "uitbetaling": "Verwerking duurt maximaal drie werkdagen; na goedkeuring wordt direct uitbetaald",
    "voorschieten": "Ja, met betaalbewijs",
    "restant": "Wordt gebruikt om de hypotheek af te lossen",
    "eigenArbeid": null
  }
];

export const BRON_BIJGEWERKT = "2026-08-16";
