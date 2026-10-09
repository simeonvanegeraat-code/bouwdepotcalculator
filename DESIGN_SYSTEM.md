# DESIGN_SYSTEM.md — BouwdepotCalculator.nl

**Versie:** 1.0 — ontwerpvoorstel ter goedkeuring  
**Datum:** 9 oktober 2026  
**Status:** Concept; geen opdracht om productie direct te wijzigen  
**Onderliggend document:** `PRODUCT_VISION.md`

---

## 1. Ontwerpambitie

BouwdepotCalculator.nl krijgt **één herkenbare merkidentiteit, met twee bewust verschillende omgevingen**:

1. **Ontdekken — editorial minimalism:** een elegante homepage met uitgesproken typografie, veel lucht, een betekenisvolle 3D-visualisatie en duidelijke bezoekerskeuzes.
2. **Berekenen — premium fintech:** een rustige, precieze, interactieve werkruimte met invoervelden, geldstromen, tijdlijnen en scenario's.

De homepage mag een emotionele indruk achterlaten; de tools moeten vooral betrouwbaar, helder en efficiënt zijn. De overgang voelt als van een mooie cover naar een professioneel instrument, niet als twee losstaande merken.

**Design north star:** *Visueel indrukwekkend bij binnenkomst. Financieel glashelder tijdens gebruik.*

### Wat we nadrukkelijk niet willen

- Een saaie banksite, generiek SaaS-template of verzameling identieke kaarten.
- Een druk crypto-dashboard met neonkleuren, glaseffecten en tientallen cijfers.
- Bewegende decoratie die tekst verbergt, de scroll blokkeert of gebruikers dwingt te wachten.
- Een 3D-demo die een slechte calculator moet compenseren.
- De bestaande `broadsheet.css` als visuele verplichting voor het nieuwe ontwerp.
- Nodeloos animatiewerk op de rekenschermen.

---

## 2. Brand foundation

**Karakter:** onafhankelijk, volwassen, warm, verfijnd, begrijpelijk, analytisch.

**Stem:** duidelijk Nederlands, helder zonder marketinghype; waar nodig nauwkeurig met termen als 'indicatie', 'bruto', 'netto', 'per maand' en 'op basis van'.

**Merkgevoel:** de rust van een luxe architectuurpublicatie gecombineerd met de precisie van moderne financiële software.

**Visuele beeldtaal:** architectuur, bouwlagen, ruimte, tijd, budgetlijnen en gecureerde 3D-objecten. Geen willekeurige stockfoto's van lachende hypotheekklanten.

### Eén consistente rode draad

- Dezelfde typografische familie, accenten, iconen en cijfernotatie op alle routes.
- Homepage: aanzienlijk ruimere composities en grotere koppen.
- Dashboard: dezelfde stijl maar compacter, met meer informatiedichtheid.
- De 3D-vormtaal mag in het dashboard terugkomen als subtiele icoon/illustratie, maar niet als zware permanente 3D-scene.

---

## 3. Design tokens (voorlopig, eerst testen)

Maak een nieuwe, eigen namespace (`--ui-*`) in een **aparte prototype-stylesheet**. Mutatie van bestaande productiestijlen pas na goedkeuring.

### 3.1 Kleuren

| Token | Voorstel | Functie |
|---|---|---|
| `--ui-canvas` | `#F7F5F0` | warme, rustige achtergrond |
| `--ui-surface` | `#FFFFFF` | calculatorpanelen en tabellen |
| `--ui-forest` | `#183B35` | primair accent / donkere panelen |
| `--ui-ink` | `#26353B` | primaire tekst |
| `--ui-muted` | `#65736F` | secundaire tekst, na contrasttest |
| `--ui-sage` | `#9BB8A8` | zachte accentvlakken en datavulling |
| `--ui-champagne` | `#CFAD7D` | uitzonderlijke premium-accenten, nooit cruciale betekenis alleen via kleur |
| `--ui-line` | `#DCE2DD` | subtiele kaders, lijnen en grids |
| `--ui-info` | `#245B79` | informatieve status |
| `--ui-warning` | `#916124` | waarschuwingen, met neutrale achtergrond en icoon |
| `--ui-danger` | `#A34242` | fouten / tekort, met tekstlabel |
| `--ui-positive` | `#26765A` | positief / binnen budget, met tekstlabel |

Dit zijn **visuele voorstellen, geen geverifieerde WCAG-combinaties**. Controleer contrast voor elke combinatie en staat. Voor normale tekst minimaal WCAG AA 4,5:1, voor grote tekst en essentiële UI-graphics minimaal 3:1. Een licht saliegroen op wit is niet geschikt voor kleine essentiële tekst zonder verificatie.

**Gebruik:** ongeveer 75% lichte neutralen, 20% donkere neutralen/bosgroen, hoogstens 5% opvallende accenten. Dit is een ontwerpverhouding, geen mathematische eis.

### 3.2 Typografie

- Start met één zorgvuldig gekozen sans-serif voor de gehele interface (bijvoorbeeld **Inter** of **Manrope**); in prototypes vergelijken met een verfijnde display-font voor alleen editorial koppen. Definitieve fonts pas kiezen na daadwerkelijke rendercontrole en licentie-/performancecontrole.
- Grote editorial hero: desktop bij voorkeur `clamp(3.5rem, 7vw, 7rem)`; mobiel `clamp(2.5rem, 10vw, 4.25rem)`. Niet hard afdwingen als regels ongelukkig breken.
- Dashboard paginatitel: ongeveer 30–44px; sectiekop 20–28px; body 16–18px; hulplabel minimaal 13–14px waar leesbaar.
- Grote cijfers: `font-variant-numeric: tabular-nums;` voor alle dynamische geldbedragen.
- Regelhoogte: tekst ongeveer 1.5–1.65; display-koppen compacter.
- Niet alles in hoofdletters zetten. Kleine uppercase-eyebrows kunnen sporadisch als navigatiehint.
- Een bedrag wordt **altijd** gekoppeld aan zijn betekenis: `€ 1.850 / maand`, `bruto`, `indicatie`.

### 3.3 Layout, maatvoering en oppervlakken

- Contentbreedte editorial: tot circa 1320–1440px afhankelijk van compositie.
- Leesbreedte uitleg: ca. 65–75 tekens per regel.
- Dashboard contentbreedte: circa 1280–1440px.
- Spacing scale in rem: `0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3 / 4 / 6 / 8`.
- Dashboardpanelen: zachte radius ongeveer 12–20px. Hoofdpanelen liever lucht en typografie dan sterke shadows.
- Randen: 1px neutraal; schaduw subtiel en zelden nodig.
- Touch targets minimaal 44 × 44px waar praktisch; toetsenbordfocus altijd zichtbaar.
- Desktop dashboard: bij voorkeur een invoerzone en dominante resultaatzone, maar zonder rigide 50/50 verdeling.
- Mobiel: één kolom, direct inzicht, daarna instelbare details. Geen horizontale overflow voor de gehele pagina.

---

## 4. Homepage: experience specification

### 4.1 Eerste scherm

**Doel:** in enkele seconden weten waar de site over gaat en zin krijgen om verder te kijken.

Verplicht zichtbaar:
- Herkenbare merknaam.
- Één heldere belofte: financiële grip op bouwen en verbouwen.
- Primaire CTA's: `Ik koop nieuwbouw` en `Ik ga verbouwen`.
- Directe tekstlink/CTA: `Bouwdepot berekenen` voor organisch zoekverkeer.
- Een elegant, stil eerste beeld van het 3D-object, ook vóór het laden van 3D.

De hero mag niet volledig opgaan in het kunstwerk: boodschap en acties blijven dominant genoeg om te begrijpen. Geen autoplay met lange introductie.

### 4.2 3D-scrollstory (concept voor validatie)

**Conceptnaam: Van ontwerp naar woonlast.** Een eenvoudig architectonisch woonvolume ontvouwt zich in een aantal fasen. Het object is architectonisch en abstract, niet een fotorealistisch huis dat dure assets vereist.

| Fase | Visueel | Betekenis | Tekstactie |
|---|---|---|---|
| 0. Intro | rustig, compleet of deels abstract volume | droom / woning | kies route of ontdek verder |
| 1. Fundament | lagen schuiven langzaam uiteen | grond en startsituatie | wat ga je bouwen? |
| 2. Opbouw | bouwlagen verschijnen | bouwtermijnen, meerwerk | wanneer betaal je? |
| 3. Geldstroom | zachte lijnen / hooguit één klein cijferaccent | maandelijkse financiële gevolgen | bekijk je woonlasten |
| 4. Overdracht | camera stabiliseert, CTA op de voorgrond | van verhaal naar tool | open het juiste dashboard |

De scrollstory is **optioneel verrijkend**. Alle informatie en CTA's zijn ook via directe navigatie bereikbaar. De gebruiker hoeft niet de hele animatie te doorlopen om door te klikken. Vermijd een lange sticky-scroll die de bezoeker vasthoudt.

### 4.3 Secties onder de hero

1. Bezoekerskeuze: nieuwbouw / verbouwen / lopend bouwdepot.
2. Preview van de tools: een echte, lichte interactieve grafiek of maandlasten-miniatuur in plaats van een onleesbare dashboardmockup.
3. Waarom de site betrouwbaar is: transparante aannames, controleerbare broninformatie en onafhankelijkheid.
4. Gerichte interne links: populaire rekentools, vragen en bankvoorwaarden.
5. Heldere footer met methodologie, privacy, contact en auteurschap.

### 4.4 Overgang naar dashboards

Gebruik een korte, sobere overgang (bijvoorbeeld typografie die verplaatst of een kleur die doorloopt) in plaats van een lange page-transition. De dashboardpagina moet normaal te bookmarken, te indexeren en direct te openen zijn.

---

## 5. Dashboard: experience specification

### 5.1 Opzet

Desktopvisie:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Logo                 Nieuwbouw  Verbouwen  Rekenhulpen       Info    │
├─────────────────────────────────────────────────────────────────────┤
│ Nieuwbouw: jouw financiële overzicht              Scenario kiezen │
│ Kort uitgangspunt / laat aannames zien                             │
├─────────────────────────┬───────────────────────────────────────────┤
│ INVOER                  │ RESULTAAT                                 │
│ Hypotheek / depot       │ Grote bruto maandlast + maandlabel        │
│ Rente en vergoeding     │ Maand-op-maand woonlastentijdlijn          │
│ Bouwperiode             │ Piekmaand / financiële buffer             │
│ Huidige woonlasten      │ Legenda en scenario-verschil              │
├─────────────────────────┴───────────────────────────────────────────┤
│ Begroting / scenario's / bankspecifieke info / export              │
└─────────────────────────────────────────────────────────────────────┘
```

Dit is een **structuurconcept**, geen pixel-perfect ontwerp. De cijfers en grafiek moeten elkaar ondersteunen; gebruik geen lege KPI-kaarten om het dashboard voller te laten lijken.

### 5.2 Belangrijkste componenten

- **Resultaatkaart:** één uitkomst die de hoofdvraag beantwoordt, inclusief periode, bruto/netto en aannames.
- **Rekenveld:** numeriek invoerveld met valuta-/procentopmaak, heldere grenzen, consistente feedback.
- **Slider (optioneel):** nooit de enige invoermethode; altijd een gekoppeld exact invoerveld.
- **Maandlastentijdlijn:** tijd op horizontale as, euro's op verticale as; duidelijke omslagmomenten zoals sleuteloverdracht en einde oude woonlasten.
- **Budgetbalk:** gepland, uitgegeven, gereserveerd en restant duidelijk gescheiden.
- **Scenariokaart:** basis vs. alternatief met absolute én relatieve verschillen waar relevant.
- **Aannamespaneel:** laat definities, rente, looptijd, bankafhankelijkheden, niet-meegenomen kosten en peildata zien.
- **Export:** compacte print-/PDF-vriendelijke weergave met scenario, waarden en datum.
- **Bankinformatie:** bronnaam, gecontroleerd-op datum en zichtbare nuance; geen schijnprecisie.

### 5.3 Gedrag van interacties

- Invoer wijzigen werkt direct door in afhankelijke uitkomsten.
- Debounce alleen als berekening of rendering aantoonbaar duur is; normale lokale berekeningen direct.
- Geen knipperende cijfers, verspringende lay-out of onnodige telleranimaties.
- Grote verschillen mogen subtiel gemarkeerd worden zonder essentiële informatie uitsluitend via kleur te coderen.
- Bij ongeldige invoer: uitleg bij het veld; geen stilzwijgende nul of `NaN`.
- Scenario's tonen altijd uitgangssituatie en verschil. Een basisberekening is te herstellen.
- Mobiel houdt eerst hoofdresultaat en meest relevante bediening zichtbaar; complexe data heeft toegankelijke tabel-/lijstweergave.
- Optioneel lokaal bewaren wordt zichtbaar uitgelegd, zonder account, met mogelijkheid tot wissen.

---

## 6. Motion system en 3D: prestatie-eisen

### 6.1 Principes

- **Betekenis boven effect.** Beweging toont relaties, verandering, volgorde of aandacht.
- **Behoud controle.** Geen scrolljacking, geen verplichte tijdlijn, geen verplichte autoplay-sequentie.
- **Subtiele componentovergangen.** Doorgaans circa 150–300ms voor gewone UI; grotere editorial bewegingen zijn afhankelijk van context en gebruikersvoorkeur.
- **Geen animatie van financiële waarheid.** Een waarde moet onmiddellijk duidelijk zijn, zonder tellers die over het echte antwoord heen animeren.
- `prefers-reduced-motion: reduce`: stop of minimaliseer beweging; 3D wordt een stilstaand frame.

### 6.2 Techniek: nog geen bibliotheek vastpinnen

Eerst 3 prototypes vergelijken:

1. **CSS / SVG / scroll-driven** voor lichte geometrie en effecten.
2. **Vooraf gerenderde frames / korte geoptimaliseerde video** als betrouwbare en lichtere filmische optie.
3. **Echte WebGL / Three.js-scene** alleen wanneer echte diepte en camera-interactie aantoonbaar toegevoegde waarde hebben.

Beoordeel per optie: laadgewicht, CPU/GPU, mobiele vloeiendheid, toegankelijkheid, onderhoud, cross-browsergedrag en esthetiek. Kies de simpelste techniek die de ontwerpkwaliteit haalt.

### 6.3 Performancebudget voor prototypes

Streefwaarden op mobiele realistische throttling (meten, geen garanties):

- Core Web Vitals 'goed': **LCP ≤ 2,5 s**, **INP ≤ 200 ms**, **CLS ≤ 0,1** op relevante echte gebruikersdata waar beschikbaar.
- 3D mag niet bepalen of de bovenste CTA's zichtbaar worden.
- Geen onnodige zware dependency op calculatorpagina's.
- Lazy-load 3D waar passend, met statische poster en harde uitvaloptie.
- Test lage-end Android, mobiel Safari en desktop.
- Test de fallback zonder JS, zonder WebGL en met `prefers-reduced-motion`.

Niet optimaliseren naar een fictief 100/100-scorespel terwijl de daadwerkelijke bezoeker een haperende ervaring krijgt.

---

## 7. Datavisualisatie

**Stijl:** zo weinig mogelijk visuele ruis, duidelijke assen, goed leesbare periodes en directe labels.

- Begin de euro-as bij nul waar het anders visueel misleidend kan zijn, vooral bij kolomgrafieken.
- Verschillende geldstromen niet samenvoegen zonder hun definitie te vermelden.
- Toon tijdelijke overlap en omslagpunten in de maandlasten.
- Gebruik meerdere onderscheidende kanalen: lijnpatroon, labels, iconen en tekst, niet alleen kleur.
- Tooltip is aanvullend; kerninformatie moet zonder hover of touch-precisie te begrijpen zijn.
- Tabellen zijn toegankelijk en exporteerbaar waar mogelijk.
- Toets elke visualisatie aan het onderliggende financiële model; verkeerde interpretatie van bouwdepotsaldi is een release-blocker.

---

## 8. Accessibility en inhoudelijke vormgeving

- WCAG 2.2 AA als ontwerpdoel, met aantoonbare checks.
- Logische heading-hiërarchie, semantische knoppen, echte labels, toetsenbordnavigeerbaarheid.
- Focus states niet verwijderen voor esthetiek.
- Respecteer zoom tot 200% en smalle schermen zonder belangrijke informatieverlies.
- Typografie: begrijpelijk Nederlands, korte secties, uitleg waar jargon nodig is.
- Aannames nooit verstoppen achter een visueel effect; altijd expliciete route erheen.
- Foutmelding noemt wat mis is en hoe iemand het herstelt.
- Grafieken krijgen een tekstuele samenvatting en zo nodig een datatabel.
- Contrast wordt met echte tooltests geverifieerd; palet is voorlopig.

---

## 9. Component- en code-afspraken voor Claude Code

**Prototype-first, geen directe redesign van alle productiebestanden.**

1. Maak een aparte feature-branch of prototypeomgeving.
2. Ontwerp eerst een scherminventaris en visuele mockups voor homepage + nieuwbouwdashboard, met mobiele varianten.
3. Laat de eigenaar een richting goedkeuren vóór brede implementatie.
4. Implementeer met een afzonderlijke tokenlaag en componenten, zodat bestaande `bs-*`-klassen voorlopig onaangeraakt blijven.
5. Gebruik bestaande financiële logica bij voorkeur via adapters of modules; herschrijf niet tegelijk formules en het design.
6. Koppel pas na review andere routes aan de nieuwe componenten.
7. Hou alle bestaande URL's, indexeerbare HTML en kritieke metatags intact tenzij migratie expliciet is goedgekeurd.
8. Beoordeel de implementatie op daadwerkelijke screenshots van desktop (1440px) en mobiel (375px / 390px), plus interactieve toestanden.
9. Test `npm test` en `npm run build`; voeg e2e-tests toe voor kritieke interacties en visuele regressie waar mogelijk.
10. Maak voor elke mijlpaal een korte demo met wat wel en niet af is, performancecijfers en aannames.

**Niet doen:** stilzwijgend een nieuw framework kiezen, `main` overschrijven, bankdata wijzigen, tracking toevoegen, of productiebestanden massaal restylen voordat het prototype goedgekeurd is.

---

## 10. Reviewkader: wanneer voelt het goed?

De eigenaar beoordeelt met echte screenshots en een werkend prototype op vijf vragen:

1. **Eerste indruk:** oogt het als een uniek premium product, niet als een SaaS-template?
2. **Begrijpelijkheid:** zie ik binnen vijf seconden wat ik hier kan doen?
3. **Animatie:** trekt de 3D-scene nieuwsgierigheid zonder te hinderen?
4. **Controle:** kan ik met twee of drie invoerwijzigingen een financieel inzicht krijgen dat ik niet uit een gewoon artikel haal?
5. **Vertrouwen:** zijn labels, getallen, bronnen, onzekerheden en grenzen zichtbaar en correct?

Wanneer de eerste vraag goed scoort maar de overige onvoldoende, is het concept **niet klaar**.

### Acceptatie voor homepage-prototype

- Visueel onderscheidende hero.
- Werkende CTA's voor nieuwbouw en verbouwen plus directe calculatorlink.
- Effectieve statische/low-motion fallback.
- Mobiel geen kapotte layout, verborgen knoppen of haperende essentiële interacties.
- Aantoonbaar gemeten performance.

### Acceptatie voor dashboard-prototype

- Ten minste één reële en geteste financiële maandlastenberekening.
- Functionele input en direct bijgewerkte resultaatvisualisatie.
- Eén scenariovergelijking met duidelijk verschil.
- Aannames, bronnen en tijdseenheden navolgbaar.
- Functioneert met toetsenbord en op smal scherm.

---

## 11. Open besluiten — niet door de code-agent laten gokken

1. Definitieve 3D-metafoor: **bouwlagen/huis**, abstracte volumes of geldstromen.
2. Preciese typografische combinatie en licenties.
3. Uitwerking van licht/donker dashboard en contrastparen.
4. Wel of geen beperkte sticky-scroll in één homepage-sectie.
5. Welk eerste dashboard als hoofdprototype wordt uitgerold en welke meetbare vragen het beantwoordt.
6. Lokale opslag en overdracht van aannames tussen tools.
7. Welke grafiektechniek past het beste bij de bestaande statische Vite-opzet.

Bovenstaande punten worden met prototypes en een expliciete keuze opgelost. **Dit document is richtinggevend, niet een excuus om ontwerpbeslissingen ongezien te automatiseren.**

---

## 12. Kerninstructie

> Ontwerp de homepage als een luxe, minimalistische architectuurpublicatie die door een betekenisvolle 3D-scrollervaring uitnodigt tot verkennen. Ontwerp de calculators als een rustige, premium financiële werkruimte waarin de gebruiker direct kan zien en begrijpen wat een bouwdepot, verbouwing of nieuwbouwproject betekent voor budget en maandlasten. De visuele vrijheid is groot; financiële correctheid, toegankelijkheid, snelheid en bestaande SEO-waarde blijven harde grenzen.
