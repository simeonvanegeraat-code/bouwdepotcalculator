# BouwdepotCalculator.nl

Een statische site die uitrekent wat een bouwdepot kost en wat het per maand
betekent, met de voorwaarden van acht geldverstrekkers ernaast. Geen framework,
geen inlog, geen persoonsgegevens op een server.

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
| `*.html` | 32 pagina's, elk een eigen Vite-ingang |
| `src/js/` | Logica per pagina plus gedeelde modules |
| `src/styles/` | `broadsheet.css`, de enige stylesheet en de bron van waarheid voor vorm |
| `data/` | Geverifieerde brondata, met bron en controledatum per waarde |
| `scripts/` | Generatoren die HTML en JS uit `data/` schrijven |
| `tests/` | Bewaakt dat pagina's de data trouw blijven |
| `public/` | robots.txt, sitemap.xml, ads.txt, favicons |

## Meewerken

[CLAUDE.md](CLAUDE.md) is het startpunt: wat we bouwen, hoe we samenwerken,
welke lat geldt en welke regels niet onderhandelbaar zijn. Daarnaast:
[roadmap.md](roadmap.md) voor de volgorde, [review.md](review.md) voor wanneer
werk af is en wat er is opgeleverd, en [plannen/](plannen/) voor de
inhoudelijke analyses.
