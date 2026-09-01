# Roadmap

**Bijgewerkt:** 31 augustus 2026

**Huidig doel:** de bestaande codebase van bouwdepotcalculator.nl herzien en
verbeteren, zodat hij professioneler en beter geordend is en klaar voor groei via
SEO en AdSense.

Eén regel voor volgorde: **wat de bezoeker sneller aan zijn antwoord helpt gaat
voor.** SEO volgt daaruit; het gaat er niet aan vooraf.

---

## Focus deze week

Vier blokken, in deze volgorde. De AdSense-aanvraag gaat er aan het eind van de
week achteraan.

### 1. Audit en opruimen — een geordend fundament

Rommel eerst, anders bouwen we het volgende blok bovenop iets wat we niet
overzien. Wat de meting laat zien (19-08-2026):

| Bevinding | Omvang | Status |
|---|---|---|
| `src/styles/main.css` werd door geen enkele pagina geladen | 3.658 regels, 60% van alle CSS | **verwijderd 19-08** |
| Vier stylesheets met elk een beschreven taak | design-system, pagina, calculator, stappenplan | **in orde** |
| `reporting.js` trok jsPDF en html2canvas mee | ±590 kB JS voor één downloadknop | **opgelost 22-08:** eigen afdrukdocument via het printvenster, `jspdf` uit package.json. Nagemeten 01-09: de keten is 11 kB en geen van beide pakketten zit er nog in |
| `src/js/main.js` bediende zes pagina's uit één bestand | 1.794 regels | **opgelost**, 01-09 — opgesplitst in een module per pagina; `main.js` bestaat niet meer. Rekencode per pagina van 53,3 kB naar 5,7 tot 13,2 kB |
| Grafiekcode die nooit draaide (`Chart` werd nergens geladen) | twee functies, achter een stille guard | **opgelost 19-08:** eigen SVG, `chart.js` verwijderd |
| Zeven planningsdocumenten los in de repo-root | naast 32 HTML-pagina's | **opgelost**, 01-09 — verhuisd naar `plannen/` met een index die per document noemt wat achterloopt op de code. Root van elf naar vier markdownbestanden |

Klaar wanneer: dode CSS en dode code weg of aantoonbaar in gebruik, elke
stylesheet heeft één beschreven taak, en per bestand is duidelijk welke pagina's
het gebruiken.

**Stand 01-09-2026.** Vier stylesheets zijn er nog één: `broadsheet.css`.
`main.css` (3.658 dode regels), `design-system.css`, `pagina.css` en
`calculator.css` zijn verwijderd. `main.js` is opgesplitst in een module per
rekenpagina en bestaat niet meer.

Wat het opruimen elke keer blootlegde, en wat de les is: **een klasse die alleen
in JavaScript of in een toestand voorkomt, verliest zijn opmaak zonder dat iets
faalt.** Eerst was dat de selectie op de homepageknoppen (`.selected` stond
alleen in main.css), later de bankkeuze, het printdocument, het uitgeschakelde
veld op renteverlies, het tekort op leenruimte en het formuleblok. Draai het
script dat élke klasse uit de HTML én de JavaScript-modules naast de stylesheet
legt vóór je een bestand weghaalt, niet erna.

### 2. UI/UX van de calculator — het moet te vertrouwen zijn

**Stand 31-08-2026.** De homepage is een introductie geworden en de rekenmachine
heeft een eigen pagina: `bouwdepot-berekenen.html`. Beide staan in de nieuwe
ontwerptaal uit [ONTWERPPLAN.md](plannen/ONTWERPPLAN.md) §3, met de tokens in
`src/styles/broadsheet.css`. Zie [spec/homepage-als-introductie.md](spec/homepage-als-introductie.md).

Wat daar nu op volgt, in deze volgorde:

1. De andere 29 pagina's naar `broadsheet.css`. Tot dat af is staan er twee
   ontwerptalen naast elkaar op de site. Volgorde: eerst het gereedschap, want
   dat is het product; daarna de vergelijking, dan de uitleg, dan het beleid.
2. Zodra alles over is verhuist `broadsheet.css` naar `design-system.css` en
   verdwijnen `design-system.css`, `pagina.css` en `calculator.css` in hun
   huidige vorm. Dan houden we ook één set lettergewichten over: nu bewaakt
   `tests/typografie.test.mjs` er twee, 400/600/700 voor de oude richting en
   400/500/600 voor de broadsheet.

| # | Pagina | Stand |
|---|---|---|
| — | `index.html` | **om**, 31-08 |
| — | `bouwdepot-berekenen.html` | **nieuw**, 31-08 |
| 1 | `maandlasten-bouwdepot.html` | **om**, 31-08 |
| 2 | `leenruimte.html` | **om**, 31-08 |
| 3 | `verbouwbegroting.html` | **om**, 31-08 — via `scripts/build-begroting.mjs` |
| 4 | `nieuwbouw.html` | **om**, 31-08 |
| 5 | `depotplanner.html` | **om**, 01-09 |
| 6 | `belasting.html` | **om**, 01-09 |
| 7 | `renteverlies-bouwdepot.html` | **om**, 01-09 |
| 8 | `dubbele-lasten-nieuwbouw.html` | **om**, 01-09 |
| 9 | `bouwrente-nieuwbouw.html` | **om**, 01-09 |
| 10 | `stappenplan.html` + `adviesgesprek-checklist.html` | **om**, 01-09 — `stappenplan.css` verwijderd |
| 11 | `bouwdepot-voorwaarden-vergelijken.html` + acht bankpagina's | **om**, 01-09 — via `scripts/build-voorwaarden.mjs` |
| 12 | `kennisbank`, `bouwdepot-fouten`, `hypotheekrenteaftrek-gids`, `bouwdepot-declaratie-afgewezen`, `methodologie` | **om**, 01-09 — vgl-blok uit design-system.css verwijderd |
| 13 | `over-ons`, `contact`, `privacy`, `cookies`, `voorwaarden` | **om**, 01-09 — hiermee staan alle 32 paginas op `body class=bs` |

Het patroon per pagina, en dat is niet vrijblijvend:

- Markup naar `bs-`-klassen met **exact dezelfde element-ids**, zodat de
  rekenmodule niet meegaat en de logica onaangeroerd blijft.
- De oude versie uit git halen (`git show HEAD:<pagina> > _oud.html`) en naast
  de nieuwe meten op 375 en 1440. **Gooi dat bestand weg vóór je `npm test`
  draait**: `tests/deelkaart.test.mjs` scant alle HTML in de root en ziet een
  kopie als een tweede pagina met dezelfde titel.
- **Wis localStorage vóór het meten.** Pagina's die invoer onthouden — de
  begroting klapt ingevulde categorieën vanzelf open — geven anders een
  paginahoogte die over jouw eigen testinvoer gaat en niet over het ontwerp.
  Dat scheelde bij de begroting 1200px en leek een verslechtering.
- Uitkomsten bij gelijke invoer vergelijken, niet alleen de opmaak bekijken.
- **Tel `<div>` tegen `</div>` in het hele bestand.** Een omzetting die een
  wikkel opent zonder afsluiter, of een losse afsluiter laat staan, levert geldige
  HTML op die de browser stilzwijgend repareert — en dan valt een sectie buiten
  zijn breedtebegrenzing zonder dat iets faalt. Dit gebeurde op drie pagina's
  tegelijk voordat ik erop ging tellen.
- **Tel de kinderen van `.bs-reken__grid`: dat moeten er drie zijn** (uitkomst,
  invoer, acties). Raakt de invoerkolom bij het omzetten ín de uitkomstkolom
  genest, dan valt het raster terug op één kolom. Op mobiel ziet dat er precies
  hetzelfde uit en geen enkele test merkt het; op breed scherm staat de invoer
  dan opeens onder de uitkomst in plaats van ernaast.
- Nieuwe componenten in [context/componenten.md](context/componenten.md), met
  erbij waar ze **niet** voor zijn.

**Afgerond op 1 september 2026.** Alle 32 pagina's dragen `<body class="bs">` en
laden alleen `broadsheet.css`. `design-system.css`, `pagina.css` en
`calculator.css` zijn verwijderd; de klassen die JavaScript schrijft
(`.bs-verloop__*`, `.bs-tabel`, `.bs-term-*`, `.bs-stickybalk`) heten in
dezelfde beweging `bs-` en staan daarmee eindelijk onder de bewaking van
`tests/componenten.test.mjs`.

**Eén les om te onthouden voor een volgende migratie van deze omvang.** Een
klasse die alleen in JavaScript of in een toestand voorkomt, verliest zijn
opmaak zonder dat iets faalt. De bankkeuze, het printdocument, het
uitgeschakelde veld op renteverlies, het tekort op leenruimte en het
formuleblok stonden alle vijf een tijd lang zonder stijl live, omdat je ze pas
ziet als je klikt of afdrukt. Ze kwamen boven met een script dat élke klasse uit
de HTML én uit de JavaScript-bestanden vergelijkt met wat de stylesheet
definieert. Draai zoiets vóór je een stylesheet weghaalt, niet erna.

**Let op: de plandocumenten lopen achter op de code.** De hiërarchiefout uit
[ONTWERPPLAN-HIERARCHIE.md](plannen/ONTWERPPLAN-HIERARCHIE.md) is al gerepareerd, en de
homepage-cijfers uit [ONTWERPPLAN.md](plannen/ONTWERPPLAN.md) kloppen niet meer. De
actuele meting staat in
[demo/2026-08-19-nulmeting-homepage.md](demo/2026-08-19-nulmeting-homepage.md):
5 secties in plaats van 29, en 0,3 scherm tot de uitkomst in plaats van 3,1.
Meet zelf voordat je iets uit een plandocument overneemt.

Wat er wél nog staat:

- **De volgorde van invoer en uitkomst.** De uitkomst staat op 0,3 scherm, het
  eerste invoerveld op 1,1 scherm. Je ziet dus een antwoord voordat je iets kunt
  invullen. Voor iemand die komt om te rekenen is dat omgekeerd.
- **Kopgewicht.** Onze koppen staan op 560 tot 690; de twee referentiesites
  zetten alles op 400 en laten grootte het werk doen. Zie
  [context/ontwerpreferenties.md](context/ontwerpreferenties.md). Dit is de
  wijziging met het meeste effect per regel code — en zichtbaar genoeg om eerst
  voor te leggen.

Klaar wanneer: invoer én uitkomst op mobiel in beeld zonder scrollen in de juiste
volgorde, de vijfsecondentoets gehaald, en het verschil gemeten vastgelegd in
[demo/](demo/).

### 3. Layout die SEO-content kan dragen

Niet meer tekst, maar een plek waar tekst terecht kan zonder het antwoord weg te
duwen. Nu staan er 29 gelijkvormige secties op de homepage; dat is geen structuur
maar een stapel.

Klaar wanneer: er een vast patroon is voor "antwoord boven, verdieping eronder"
dat elke pagina kan hergebruiken, met een duidelijke plek voor advertenties die
het rekenwerk niet onderbreekt.

### 4. Analyse: welke functie ontbreekt nog

Leg de huidige calculator naast de pijn en de belofte uit
[context/bedrijf.md](context/bedrijf.md) en de twee reizen in
[customers/](customers/). Waar belooft de site helderheid en levert hij een
getal? Levert een voorstel op, geen code.

Klaar wanneer: er een korte lijst ligt met ontbrekende functies, geordend naar
hoeveel onzekerheid ze bij de bezoeker wegnemen.

**Deze week zonder verse zoekdata.** De sitemap is op 19-08 ingediend en main is
net live; bruikbare Search Console-cijfers komen pas een week later. De analyse
leunt daarom op de tool zelf, op de twee reizen in [customers/](customers/) en op
[CONCURRENTIE-EN-OORDEEL.md](plannen/CONCURRENTIE-EN-OORDEEL.md). Zoekdata toetst het
achteraf; zie [routines/search-console.md](routines/search-console.md).

### 5. AdSense aanvragen — eind van de week

Na blok 1 t/m 4. De diagnose van de eerdere afwijzing en de checklist staan in
[ADSENSE-PLAN.md](plannen/ADSENSE-PLAN.md); loop die af vóór de aanvraag.

---

## Hierna

- **Beeld en ritme.** Nul afbeeldingen is de reden dat alle secties op elkaar
  lijken. Eigen SVG-diagrammen van het depotproces.
- **Aanbiederpagina's onderscheidend maken.** Acht pagina's die volgens
  [PRODUCTPLAN.md](plannen/PRODUCTPLAN.md) 3 tot 5 procent unieke woordenschat hebben —
  die meting is gedaan toen het er zes waren, dus doe hem opnieuw.
- **Een ingang op moment in plaats van op tool.** "Waar sta je" — oriënteren,
  verbouwen, nieuwbouw, lopend depot. Uit [KWALITEITSPLAN.md](plannen/KWALITEITSPLAN.md).
- **De vergelijkingspagina visueel maken.** Verschillen zie je in plaats van dat
  je ze leest.
- **Begrippenlijst.** Ontbreekt nog, en is een natuurlijke ingang voor zoekverkeer
  op losse termen.

---

## Later

- **Praktijkervaring als bron.** Meldingen van mensen met een lopend depot, met
  bronvermelding "gemeld door een gebruiker, geverifieerd op datum". Geen enkele
  bank biedt dat.
- **Meer aanbieders in de vergelijking.** Alleen als elke cel dezelfde
  brondiscipline haalt als de huidige acht.

---

## Niet doen

Om te voorkomen dat dit telkens opnieuw ter tafel komt:

| Niet | Waarom |
|---|---|
| Inlog of gebruikersauthenticatie | Buiten scope; alles werkt zonder registratie |
| Berekeningen opslaan in een database | Buiten scope; invoer blijft in de browser |
| Betaalintegraties | Buiten scope; het verdienmodel is AdSense |
| Concurreren op aantal calculators | BerekenHet heeft er zestig. Wij zijn het diepst op één onderwerp, zie [CONCURRENTIE-EN-OORDEEL.md](plannen/CONCURRENTIE-EN-OORDEEL.md) |
| Data automatisch bijwerken vanaf bronpagina's | Een verkeerde cel is erger dan een verouderde cel. De wekelijkse controle meldt alleen |
| Tekst toevoegen om het woordaantal | Google gebruikt woordaantal niet direct, en het schaadt de bezoeker |
| Persoonlijke aanbevelingen doen | Maakt de site AFM-vergunningplichtig |
