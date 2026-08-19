# Roadmap

**Bijgewerkt:** 19 augustus 2026

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
| `reporting.js` trekt jsPDF en html2canvas mee op de homepage | ±590 kB JS voor één downloadknop | open |
| `src/js/main.js` bedient zes pagina's uit één bestand | 1.794 regels | open |
| Grafiekcode die nooit draaide (`Chart` werd nergens geladen) | twee functies, achter een stille guard | **opgelost 19-08:** eigen SVG, `chart.js` verwijderd |
| Zeven planningsdocumenten los in de repo-root | naast 31 HTML-pagina's | open |

Klaar wanneer: dode CSS en dode code weg of aantoonbaar in gebruik, elke
stylesheet heeft één beschreven taak, en per bestand is duidelijk welke pagina's
het gebruiken.

**Wat het opruimen blootlegde:** de knoppen op de homepage geven geen zichtbare
selectie meer. `main.js` zet de klasse `.selected`, maar die werd alleen in
main.css gestyled; het ontwerpsysteem gebruikt `.ds-chip[aria-pressed="true"]` en
dat attribuut zet niemand. Must fix, en het eerste dat we bij de homepage
oppakken.

### 2. UI/UX van de calculator — het moet te vertrouwen zijn

**Let op: de plandocumenten lopen achter op de code.** De hiërarchiefout uit
[ONTWERPPLAN-HIERARCHIE.md](ONTWERPPLAN-HIERARCHIE.md) is al gerepareerd, en de
homepage-cijfers uit [ONTWERPPLAN.md](ONTWERPPLAN.md) kloppen niet meer. De
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
[CONCURRENTIE-EN-OORDEEL.md](CONCURRENTIE-EN-OORDEEL.md). Zoekdata toetst het
achteraf; zie [routines/search-console.md](routines/search-console.md).

### 5. AdSense aanvragen — eind van de week

Na blok 1 t/m 4. De diagnose van de eerdere afwijzing en de checklist staan in
[ADSENSE-PLAN.md](ADSENSE-PLAN.md); loop die af vóór de aanvraag.

---

## Hierna

- **Beeld en ritme.** Nul afbeeldingen is de reden dat alle secties op elkaar
  lijken. Eigen SVG-diagrammen van het depotproces.
- **Aanbiederpagina's onderscheidend maken.** Acht pagina's die volgens
  [PRODUCTPLAN.md](PRODUCTPLAN.md) 3 tot 5 procent unieke woordenschat hebben —
  die meting is gedaan toen het er zes waren, dus doe hem opnieuw.
- **Een ingang op moment in plaats van op tool.** "Waar sta je" — oriënteren,
  verbouwen, nieuwbouw, lopend depot. Uit [KWALITEITSPLAN.md](KWALITEITSPLAN.md).
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
| Concurreren op aantal calculators | BerekenHet heeft er zestig. Wij zijn het diepst op één onderwerp, zie [CONCURRENTIE-EN-OORDEEL.md](CONCURRENTIE-EN-OORDEEL.md) |
| Data automatisch bijwerken vanaf bronpagina's | Een verkeerde cel is erger dan een verouderde cel. De wekelijkse controle meldt alleen |
| Tekst toevoegen om het woordaantal | Google gebruikt woordaantal niet direct, en het schaadt de bezoeker |
| Persoonlijke aanbevelingen doen | Maakt de site AFM-vergunningplichtig |
