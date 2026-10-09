# TECHNICAL_ARCHITECTURE.md — BouwdepotCalculator.nl

**Versie:** 1.0 — concept voor technische review  
**Datum:** 9 oktober 2026  
**Status:** Richtinggevend document, géén toestemming voor wijzigingen in productie.  
**Samen lezen met:** `PRODUCT_VISION.md`, `DESIGN_SYSTEM.md`, `USER_EXPERIENCE.md`, `FEATURES.md`.

## 1. Architectuurbesluit

**Behoud de bestaande statische Vite multi-page-architectuur als uitgangspunt.** Bouw de nieuwe visuele ervaring en dashboards aanvankelijk als afzonderlijke, geïsoleerde onderdelen naast bestaande calculators. Migreer niet automatisch naar Next.js, React of een SPA omdat een interface moderner moet ogen.

De vormgeving mag radicaal veranderen; de betrouwbare berekeningen, indexeerbare routes en broncontroles blijven intact. Een framework is alleen gerechtvaardigd na een aantoonbare vergelijking van onderhoudbaarheid, performance, testbaarheid, deployment en SEO.

**Architectuurdoelen, op volgorde:**
1. Financiële juistheid, uitlegbaarheid en herhaalbare tests.
2. Geen verlies van bestaande Google-landingspagina's of URL's.
3. Kwalitatief hoogwaardig mobiel en desktop UX.
4. Snelle laadtijden, ook zonder 3D-ondersteuning.
5. Beperkt aantal afhankelijkheden en overzichtelijke code.
6. Veilige afzonderlijke releases met eenvoudige rollback.

## 2. Gecontroleerde startsituatie

Op basis van de bestaande GitHub-repository `simeonvanegeraat-code/bouwdepotcalculator` (branch `main`), bekeken op 9 oktober 2026:

| Onderdeel | Aanwezig / waargenomen | Technische betekenis |
|---|---|---|
| Front-end | Statische HTML-pagina's en losse JavaScript-modules | Geschikt voor SEO en selectieve interactie |
| Build | Vite (`package.json` gebruikt Vite `^5.4.0`) | Multi-page-build via `vite.config.js` |
| Deploy | Vercel volgens repo-documentatie | Preview-deploys te benutten; configuratie verifiëren |
| Homepage | `index.html` | Bevat huidige editoriale `bs-`-componenten en verwijst naar calculator |
| Styling | `src/styles/broadsheet.css` | Actuele stijllaag volgens componentdocumentatie |
| Calculators | Onder meer `bouwdepot-berekenen.html`, `nieuwbouw.html`, `dubbele-lasten-nieuwbouw.html` | Bestaande URL's beschermen |
| Begroting | `verbouwbegroting.html` | Herbruikbare functionaliteit na audit |
| Bankdata | `data/bouwdepot-voorwaarden.json`, generators | Verifieerbare data; niet rechtstreeks in generated-bestanden wijzigen |
| Navigatie | `data/navigatie.json` + `scripts/build-header.mjs` | Header niet rechtstreeks in elke HTML-pagina wijzigen |
| Tests | `node --test` via `npm test` | Bestaande tests zijn een veiligheidsnet, niet voldoende als UI-test |
| Documentatie | 53 Markdown-bestanden bij inventarisatie | Tegenstrijdige/verouderde instructies moeten worden geïsoleerd |

**Onjuistheden in huidige documentatie die eerst worden opgelost:** `CLAUDE.md` en `review.md` verwijzen nog naar `src/styles/design-system.css`; volgens `context/componenten.md` en `README.md` is de actieve stylesheet `src/styles/broadsheet.css`. `CLAUDE.md` noemt oude workflowconventies; `roadmap.md` bevat inmiddels afgeronde mijlpalen als actuele focus. Verifieer dit opnieuw tegen de checkout voordat je bestanden verwijdert of hernoemt.

**Nog te verifiëren vóór implementatie:** alle `src/js/`-modules en afhankelijkheden, daadwerkelijke workflow/build-output, deployed URL's, `vercel.json`, `robots.txt`, sitemap, eventuele consent-implementatie, alle opslagkeys en geldende rekenformules. Deze architectuur presenteert die zaken niet als al getest.

## 3. Voorgestelde applicatie-indeling

De bestaande URLs zijn het publieke contract. Onderstaande structuur is een **doelindeling**, niet een opdracht om bestanden onmiddellijk te verplaatsen:

```text
/
├── index.html                       # Editorial homepage / routekeuze
├── bouwdepot-berekenen.html          # Bestaande directe rekentool
├── nieuwbouw.html                   # Bestaande indexeerbare route
├── verbouwbegroting.html            # Bestaande indexeerbare route
├── ...                              # Alle overige bestaande pagina's
├── nieuwbouw-dashboard.html         # Nieuw, alleen na URL/SEO-review
├── verbouw-dashboard.html           # Nieuw, alleen na URL/SEO-review
├── src/
│   ├── styles/
│   │   ├── broadsheet.css           # Legacy; niet blind vervangen
│   │   └── next/                    # Nieuwe tokens, basis, layout, tools
│   ├── js/                          # Bestaande modules blijven bestaan
│   ├── domain/                      # Pure, geteste financiële functies
│   ├── dashboard/                   # UI, state, grafieken en selectors
│   ├── homepage/                    # Hero, routekeuze, progressive 3D
│   └── shared/                      # Formatters, validatie, utilities
├── data/                            # Brongecontroleerde bankgegevens
├── scripts/                         # Bestaande codegeneratie
├── tests/                           # Bestaande + nieuwe modeltests
└── public/                          # Robots, sitemap, ads.txt, assets
```

Plaats de nieuwe interface aanvankelijk onder een nieuwe CSS-scope of apart entrypoint. Vermijd globale CSS die alle huidige pagina's onbedoeld aanpast. Gebruik echte links naar indexeerbare pagina's. Nieuwe dashboard-URL's worden pas definitief na een URL- en contentstrategie.

## 4. Architectuurgrenzen

### 4.1 Domeinlaag (`src/domain/`)

Bevat pure functies zonder DOM, browserstorage, UI-dependencies of netwerkcalls. Bijvoorbeeld:

- `calculateLoanSchedule(input)` → betalingsschema, rente, aflossing, restschuld.
- `calculateDepotSchedule(input)` → geplande opnames, maandstanden, ongedekte bedragen.
- `calculateHousingCashflow(input)` → woonlasten per maand, componenten en totaal.
- `compareScenarios(baseline, alternative)` → verschillen over dezelfde tijdshorizon.
- `calculateRenovationBudget(input)` → kosten, reserveringen, financieringsbehoefte.

**Dit zijn voorgestelde API's, geen bevestigde bestaande functies.** Bestaande rekenlogica eerst inventariseren en via adapters hergebruiken of gecontroleerd extraheren. Niet tijdens het restylen herschrijven.

Elke module documenteert wat de bedragen voorstellen (kasstroom, rente, aflossing, saldo), welke afronding geldt, de kalenderconventie en welke aannames contractafhankelijk zijn. Berekeningen volgen de eisen in `FEATURES.md`.

### 4.2 Presentatielaag

Verantwoordelijk voor invoer, labels, grafieken, scenariovergelijking, foutmeldingen en export. Grafieken mogen **nooit** eigen financiële formules implementeren; zij lezen dezelfde maandregels als een onderliggende tabel.

### 4.3 Data- en bronlaag

`data/bouwdepot-voorwaarden.json` blijft handmatig gecontroleerde brondata met waarde, toelichting en controledatum. Bestaande generatoren blijven leidend. `src/js/bankdata.generated.js` en gegenereerde HTML-fragmenten niet handmatig aanpassen. Een ontbrekende bankwaarde blijft onbekend en wordt niet behandeld als nul.

### 4.4 Staat en persistentie

Maak één expliciet en versieerbaar gegevensmodel per gebruikersroute, bijvoorbeeld:

```js
const exampleProject = {
  schemaVersion: 1,
  route: 'nieuwbouw',
  loanParts: [],
  constructionPayments: [],
  currentHousing: null,
  handoverDate: null,
  chosenLenderId: null,
  assumptions: {},
};
```

Dit is een concept, géén bestaand schema en geen standaardinvulling met persoonsgegevens. Houd UI-state gescheiden van rekeninput; gebruik afgeleide waarden, geen dubbele bedragen op meerdere plaatsen.

Inventariseer vóór invoering alle bestaande `localStorage`-sleutels. Bepaal expliciet wat tijdelijk in geheugen blijft en wat lokaal bewaard mag worden. Nooit gebruikersinvoer stilzwijgend naar analytics of externe diensten sturen. Geef de bezoeker controle over wissen; geen account of database vereist.

## 5. Nieuwe homepage en 3D-animatie

**3D is progressive enhancement, geen fundering van de pagina.** De HTML met titel, tekst en routeknoppen is direct beschikbaar zonder 3D-script. De initiële weergave heeft een statische illustratie/poster.

Technische beslisvolgorde:

1. Ontwerp een sterk statisch beeld van een abstract bouwvolume.
2. Test of een beperkte CSS/SVG/scrollanimatie dezelfde beleving kan geven.
3. Bouw alleen indien aantoonbaar meerwaarde een geïsoleerde 3D-prototypevariant (bijvoorbeeld Three.js of een GLTF-runtime).
4. Vergelijk daadwerkelijk laadtijd, dataverbruik, toegankelijkheid en renderprestaties op een gangbaar mobiel apparaat.
5. Kies pas dan een implementatie en leg die vast in `DESIGN_SYSTEM.md`.

Voorwaarden:
- Gebruik lazy loading en laad 3D niet op andere rekentoolpagina's.
- `prefers-reduced-motion: reduce`: geen geforceerde scrollcamera of beweging.
- Bij afwezige WebGL, batterij-/performanceproblemen of fout: statische versie zonder functieverlies.
- Geen essentiële informatie die alleen tijdens scroll-/camera-animatie verschijnt.
- Voorkom layout shifts door vooraf gereserveerde aspect-ratio's.
- Laat inputrespons en navigatie zwaarder wegen dan visueel spektakel.
- Assetformaten en animation budget worden gemeten, niet vooraf als succes verondersteld.

## 6. Dashboard-engineering

### Layout

Een dashboard bestaat uit:
1. Contexthoofd met route, projectnaam als optionele lokale invoer en indicatie/uitgangspunten.
2. Kernuitkomsten: hoogste woonlast, indicatieve maandlast, budgetruimte.
3. Grafiek/tijdlijn met vaste definities en een tabelalternatief.
4. Invoer en scenario-instellingen, gegroepeerd naar relevantie.
5. Uitleg, aannames, bronverwijzingen, export en verwijzingen naar gerelateerde tools.

De precieze verdeling en desktop/mobile-compositie volgen uit `DESIGN_SYSTEM.md` en `USER_EXPERIENCE.md`, niet uit een globale JS-library.

### Rendering

Begin met semantische HTML en kleine modules. Gebruik CSS voor responsiviteit en een lichte visualisatielaag voor grafieken. Voeg een grafiekdependency alleen toe na vergelijking van toegankelijkheid, bundelgrootte, onderhoud en printbaarheid. Gebruik een SVG-grafiek waar die duidelijk en voldoende is.

### Inputkwaliteit

- Ondersteun Nederlandse presentatie (`Intl.NumberFormat('nl-NL')`), maar normaliseer invoer centraal.
- Valideer lege waarden, null/undefined, negatieve bedragen, datums en grenzen.
- Voorkom races en dubbele berekeningen; synchroniseer de presentatie van invoer, tekst en grafiek.
- Geef elk resultaat een beschrijvende titel en zichtbare eenheden.

## 7. SEO en routes als technische randvoorwaarde

- Bestaande indexeerbare `.html`-routes blijven werken.
- Verwijder geen calculator of kennisartikel zonder voorafgaande URL-mapping en redirectplan.
- Nieuwe inhoud bevat servergeleverd/statisch HTML voor titel, samenvatting, methodologie en nuttige links; belangrijke uitleg is niet uitsluitend client-side.
- Controleer canonical, meta, robots, sitemap, interne links en OG-tags per publieke URL.
- Maak geen duplicaatpagina's die hetzelfde zoekdoel dienen zonder onderscheid en canonicalstrategie.
- Meet wijzigingen op URL- en queryniveau. Een mooie homepage is geen bewijs van betere organische prestaties.

De specifieke SEO- en AdSense-processen worden uitgewerkt in `SEO_ADSENSE.md`.

## 8. AdSense, privacy en consent

Houd advertenties technisch gescheiden van invoervelden, betalingsschema's en essentiële grafiekinformatie. Reserveer stabiele advertentieruimte waar relevant om visuele verschuivingen te beperken. Laat financiële resultaten niet afhangen van advertentiecode.

**Consent en beleid:** verifieer de huidige implementatie en toepasselijke vereisten voordat advertentie- of analysetags worden gewijzigd. De bestaande scriptverwijzing in `index.html` is géén bewijs dat toestemming, beleid of goedkeuring volledig geregeld zijn. Maak geen aannames over AdSense-goedkeuring of RPM.

## 9. Validatie- en teststrategie

### Niveau 1 — Bestaande regressietests

Draai `npm test` en `npm run build` op een schone checkout vóór en na wijzigingen. Documenteer eventuele bekende fouten als baseline; tests nooit uitzetten om een redesign door te krijgen.

### Niveau 2 — Domeintests

Maak onafhankelijke gouden rekenvoorbeelden voor annuïtair, lineair en rente-only, nulrente, leningdelen, bouwtermijnen, depotsaldo, vergoedingen en vertraging. Controleer bedragen met onafhankelijke handberekeningen, betrouwbare rekenmodellen of officiële bankcontractvoorbeelden waar relevant. Test bron-nuance en ontbrekende waarden.

### Niveau 3 — End-to-end/UI

Test daadwerkelijke invoer → berekening → grafiek → tabel → print, inclusief:
- breedtes 375, 768 en 1440 px;
- toetsenbord, focus, foutmeldingen, contrast;
- reduced motion, uitgeschakelde/defecte 3D;
- afdrukweergave en mobiele grafieken;
- routekeuze en directe calculatorlinks.

Overweeg Playwright voor browserregressie als onderdeel van de proefmijlpaal. Bestaande `node --test`-checks bewaken volgens de oudere documentatie vooral data en markup en vervangen geen browserproeven.

### Niveau 4 — Performance

Meet Core Web Vitals, met nadruk op LCP, INP en CLS. Streef naar gangbare goede drempels: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 bij 75e percentiel van echte gebruikersdata. Gebruik laboratoriumtests voor het prototype, maar claim niet dat daarmee field performance bewezen is.

## 10. Samenwerking met Claude Code

**Normale modus:** kleine wijzigingen voor onderhoud.  
**Nieuwe, expliciet goedgekeurde redesignmodus:** grotere, samenhangende mijlpalen op een geïsoleerde branch. De oude regel *'altijd kleine wijzigingen en bestaande stijl volgen'* geldt niet voor de nieuwe ontwerpvernieuwing; veiligheid en review wel.

Verplicht uitvoeringsprotocol:
1. **Audit:** welke bestaande bestanden en functies raken het voorstel? Welk deel is gegenereerd? Welke tests bestaan?
2. **Plan:** voorstel met UX-doel, technische keuzes, URL-effect, risico's en acceptatiecriteria.
3. **Prototype:** implementeer alleen de afgesproken mijlpaal, op een eigen branch.
4. **Verificatie:** run tests en build; inspecteer echte browserweergaven mobiel en desktop.
5. **Rapport:** wat is veranderd, wat is getest, wat is onzeker en welke beslissing is nodig?
6. **Review:** geen merge, push naar productie of deployment zonder expliciete toestemming.

**Niet doen:** autonoom het hele platform herschrijven, blind alle CSS vervangen, rekenlogica refactoren tijdens visueel werk, stille technische migraties, of tegenstrijdige oude documentatie behandelen als actuele productbesluiten.

## 11. Implementatieroadmap op hoofdlijnen

**Fase 0: Nulmeting en isolatie**  
Maak inventarisatie van routes, rekenmodules, data, opslag, scripts, tests en bestaande SEO-prestaties. Zet branch en previewomgeving op; controleer de huidige build.

**Fase 1: Designbewijs**  
Maak homepageconcepten met dezelfde inhoud maar echt verschillende composities. Bouw en vergelijk statisch, CSS-animatie en waar zinvol geïsoleerd 3D. Kies op beeld én performance.

**Fase 2: Nieuwbouwdashboard**  
Ontwerp dashboard met representatieve data; extraheer/valideer domeinfuncties; bouw tijdlijn, scenario en getalsmatige onderbouwing; test alle toestanden.

**Fase 3: Verbouwdashboard**  
Integreer begroting en financiering met gedeelde dashboardcomponenten. Houd bankspecifieke regels traceerbaar.

**Fase 4: Integratie en SEO**  
Verbind nieuwe routes met bestaande pagina's, controleer canonicals, interne links en sitemap; voer regressie- en performancetests uit.

**Fase 5: Release en meten**  
Stapsgewijze uitrol en monitoring op betrouwbaarheid, gebruikersgedrag, SEO en AdSense-readiness. Volg richtinggevende productmetriek in plaats van alleen paginaweergaven.

Deze volgorde wordt een concrete uitvoeringsplanning in `ROADMAP.md`.

## 12. ADR's: beslissingen die niet stilzwijgend mogen veranderen

| ID | Besluit | Status |
|---|---|---|
| ADR-001 | Vite multi-page als uitgangspunt | Aangenomen, herzienbaar bij bewijs |
| ADR-002 | Geen verplichte SPA/frameworkmigratie | Aangenomen |
| ADR-003 | 3D uitsluitend als progressive enhancement | Aangenomen |
| ADR-004 | Financial domain apart van UI | Doelarchitectuur |
| ADR-005 | Directe SEO-calculators blijven bereikbaar | Harde eis |
| ADR-006 | Geen verplicht account/backend voor berekeningen | Harde eis |
| ADR-007 | Brondata handmatig gecontroleerd en generator leidend | Bestaand principe behouden |
| ADR-008 | Redesign alleen op previewbranch, gated release | Harde eis |
| ADR-009 | Definitieve 3D-library pas na prototypebesluit | Open |
| ADR-010 | Definitieve dashboardroute en opslagmodel | Open |

## 13. Definition of Done voor architectuurveranderingen

- [ ] Wijziging is verbonden aan een productvereiste uit `FEATURES.md`.
- [ ] Actuele code is geïnspecteerd en veranderde bestandspaden zijn opgesomd.
- [ ] Alle eerdere relevante tests en de build slagen, of afwijkingen zijn expliciet vastgelegd en niet verborgen.
- [ ] Nieuwe financiële code is onafhankelijk testbaar en tegen onafhankelijke voorbeelden gevalideerd.
- [ ] URL's, meta-informatie, generatoren, brondata en bestaande pagina's zijn gecontroleerd.
- [ ] Toegankelijkheid, mobiel gedrag en fallbacktoestanden zijn bekeken.
- [ ] Nieuw JS/CSS/3D-gewicht en de performance-impact zijn gemeten.
- [ ] Er is een preview en een werkbare rollbackroute.
- [ ] De eigenaar heeft het zichtbare resultaat en eventuele trade-offs beoordeeld.

---

**Architectuurprincipe in één zin:** behoud het betrouwbare en vindbare fundament; vernieuw de ervaring in geïsoleerde, testbare lagen en voeg alleen technologie toe wanneer die aantoonbaar meerwaarde oplevert.
