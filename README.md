# BouwdepotCalculator.nl

Een statische site die uitrekent wat een bouwdepot kost en wat het per maand
betekent, met de voorwaarden van dertien geldverstrekkers ernaast. Geen
framework, geen inlog, geen persoonsgegevens op een server.

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

`npm run dev` start Vite op poort 5173. `npm test` draait `node --test` over
`tests/`. `npm run build` draait eerst de tests, dan de generatoren, dan Vite —
een falende test blokkeert de build met opzet.

## Waar staat wat

| | |
|---|---|
| `*.html` | 31 pagina's, elk een eigen Vite-ingang |
| `src/js/` | Logica per pagina plus gedeelde modules |
| `src/styles/` | `broadsheet.css`, de huidige stylesheet |
| `data/` | Geverifieerde brondata, met bron en controledatum per waarde |
| `scripts/` | Generatoren die HTML en JS uit `data/` schrijven |
| `tests/` | 84 tests; bewaken feiten, rekenkern en stille fouten |
| `public/` | robots.txt, sitemap.xml, ads.txt, favicons |
| `archief/` | Documentatie van vóór 9 oktober 2026; naslag, geen instructie |

## Meewerken

Sinds **9 oktober 2026** gelden acht kerndocumenten in de repo-root. Lees ze in
deze volgorde:

| Document | Waarvoor |
|---|---|
| [PRODUCT_VISION.md](PRODUCT_VISION.md) | Missie, doelgroepen, productidentiteit en grenzen |
| [USER_EXPERIENCE.md](USER_EXPERIENCE.md) | Routes en interactieprincipes |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | De twee ontwerpwerelden, tokens en motionregels |
| [FEATURES.md](FEATURES.md) | Functionele eisen en financiële acceptatiecriteria |
| [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) | Architectuur, hergebruik, test- en migratieregels |
| [SEO_ADSENSE.md](SEO_ADSENSE.md) | Zoekverkeer, contentkwaliteit en advertentiegrenzen |
| [ROADMAP.md](ROADMAP.md) | Mijlpalen, volgorde en review-gates |
| [CLAUDE.md](CLAUDE.md) | Operationele werkafspraken voor de code-agent |

Daarnaast blijven in gebruik: [review.md](review.md) als logboek van opgeleverd
werk, [context/](context/) voor achtergrond die niet uit de code te lezen is,
[customers/](customers/) voor de bezoekersreizen en echte meldingen,
[routines/](routines/) voor terugkerende taken, en [demo/](demo/) voor
voor-en-na bewijs van interfacewerk.

**Let op bij tegenspraak:** de acht kerndocumenten zijn leidend voor wat we
*willen bouwen*; de actuele code en tests zijn leidend voor hoe de site *nu
werkt*. Alles in [archief/](archief/) is historische input — bewaar de kennis
over fouten, bankdata en rekenregels, maar neem er geen ontwerpbeslissingen uit
over.
