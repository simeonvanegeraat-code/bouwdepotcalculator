# Herontwerp BouwdepotCalculator.nl

**Datum:** 14 augustus 2026
**Aanleiding:** de site voelt als lange stukken tekst in plaats van een bruikbaar hulpmiddel.
Dat gevoel klopt, en het is meetbaar.

---

## 1. Eerst: wat ik fout heb gedaan

Voordat ik een plan maak, hoor ik te benoemen waar ik de verkeerde kant op heb gestuurd.

### Ik heb voor de beoordelaar ontworpen, niet voor de bezoeker

Mijn hele analyse ging over AdSense-goedkeuring. Daardoor werd "meer zichtbare tekst"
automatisch "beter". Ik heb de accordeons opengeklapt en **44% extra tekst op de homepage
zichtbaar gemaakt — en dat als winst gepresenteerd.**

Voor een menselijke bezoeker is dat precies verkeerd. De vorige ontwikkelaar die die
secties inklapte had gelijk over de UX; hij had alleen ongelijk over de zichtbaarheid voor
een reviewer. Het juiste antwoord was nooit "alle tekst tonen" maar **"minder tekst hebben"**.

### Ik heb de site groter en dichter gemaakt, niet beter

Zeven nieuwe pagina's toegevoegd, allemaal tabellen met proza eromheen. Ik heb "993 woorden
op de hubpagina" als resultaat gemeld. Woordaantal is geen kwaliteitsmaat en Google gebruikt
het niet eens direct.

### Ik heb de site nooit bekeken

Dit is de ernstigste. Ik heb dagenlang over kwaliteit geadviseerd zonder één keer te zien
hoe de site eruitziet. Ik leidde ontwerpkwaliteit af uit woordentellingen en HTML-structuur.
Toen ik eindelijk mat, bleek het beeld heel anders dan mijn aannames.

### Wat de meting laat zien

| Meting | Desktop | Mobiel |
|---|---|---|
| Paginahoogte homepage | 4.471px | **9.153px** |
| Schermen scrollen | 6,2 | **11,3** |
| Scrollen tot het eerste invoerveld | — | 1,3 scherm |
| **Scrollen tot het resultaat** | — | **3,1 scherm** |
| Secties in `<main>` | **29** | |
| Paragrafen | **61** | |
| Afbeeldingen | **0** | |

Geen enkele paragraaf is te lang (maximaal 39 woorden). Het probleem is niet de tekstlengte,
het zijn **29 secties die er allemaal hetzelfde uitzien**, verticaal opgestapeld zonder ritme,
hiërarchie of rustpunt. En nul beeld.

De doodsteek: **al je verkeer zoekt op "bouwdepot berekenen"** — 826 klikken, vrijwel
allemaal op rekenintentie. Ze willen een getal. Ze moeten drie schermen scrollen voordat ze
het zien.

---

## 2. Wat de site zou moeten zijn

> **Nu:** een artikel over bouwdepots waar ergens een rekentool in staat.
> **Nodig:** een rekentool die antwoord geeft, met verdieping erachter.

Wie komt hier? Iemand die op het punt staat een bouwdepot af te sluiten, of er middenin zit.
Die persoon heeft een concrete, gespannen, tijdgebonden vraag:

- Wat kost dit me per maand?
- Kan ik deze verbouwing betalen?
- Hoeveel tijd heb ik nog?
- Accepteert mijn bank deze factuur?
- Waarom is mijn declaratie afgewezen?

Dat zijn geen leesvragen, dat zijn **rekenvragen en opzoekvragen**. De site moet ze in
seconden beantwoorden en pas daarna diepte aanbieden.

### Het ontwerpprincipe

**Antwoord eerst, diepte op verzoek.**

Elke pagina begint met de uitkomst, niet met een inleiding. Uitleg staat eronder of erachter,
en is opgedeeld in herkenbaar verschillende blokken in plaats van eindeloos dezelfde kaart.

---

## 3. Wat "Apple design" concreet betekent

Het is geen stijl die je erover heen legt. Het zijn drie principes uit Apples eigen
richtlijnen, en ze zijn allemaal direct van toepassing:

**Clarity — helderheid.** Eén ding per scherm. De belangrijkste informatie is het grootst.
Ruime witruimte doet het hiërarchiewerk, niet lijnen en kaders.

**Deference — de interface wijkt.** De UI dient de inhoud en concurreert er nooit mee. Op
deze site is de inhoud *het getal*. Alles wat daar aandacht van afleidt, moet weg of terug.

**Depth — diepte.** Lagen en beweging tonen hiërarchie. Wat nu ontbreekt: alles ligt plat op
één niveau, 29 kaarten naast elkaar in belang.

Concrete regels die daaruit volgen:

| | |
|---|---|
| Raster | 8pt met 4pt onderverdeling |
| Minimale aanraakzone | 44 × 44px |
| Typografie | grote sprongen in de schaal, niet 16/18/20 maar 15/17/22/34/56 |
| Kleur | semantische tokens, terughoudend palet, één accent |
| Beweging | doelgericht: iets verplaatst of onthult zich, geen versiering |

### Het kleurprobleem

De huidige hoofdkleur staat in de CSS met de opmerking `/* Donkerblauw (Rabo-achtig) */`.
Dat is precies verkeerd voor een site die zijn waarde ontleent aan **onafhankelijk** zijn van
banken. Je leent visueel vertrouwen van een partij die je vergelijkt, en het oogt bovendien
gedateerd.

De site heeft een eigen identiteit nodig: rustig, precies, financieel-serieus zonder
bank-imitatie.

---

## 4. Het plan

### Fase 1 — Ontwerpsysteem (fundament)

Zonder tokens wordt elk scherm weer maatwerk. Eerst dus de basis:

- **Type-schaal** met echte sprongen, geoptimaliseerd voor cijfers (tabular numerals voor
  bedragen, zodat ze niet verspringen tijdens het typen)
- **Spatiëringsschaal** op 4/8pt
- **Kleurtokens**, semantisch benoemd, met donkere modus vanaf het begin
- **Componenten**: invoerveld, resultaatkaart, keuzekaart, tabel, notitie, verdiepingsblok
- Alles in `src/styles/` als tokens, zodat pagina's ze consumeren in plaats van herdefiniëren

### Fase 2 — De homepage wordt de calculator

Het belangrijkste scherm van de site.

- **Invoer en resultaat samen in beeld** op mobiel, zonder scrollen. Dat is de harde eis.
- Het resultaat is groot, rustig, en verandert live tijdens het typen
- Geen hero-tekst boven de calculator; de titel mag klein zijn want de bezoeker weet al
  waarom hij hier is
- Daaronder pas: keuze om te verdiepen
- Doel: **van 3,1 schermen naar 0 schermen** tot het antwoord

### Fase 3 — Een echt dashboard om tools te kiezen

Wat je vroeg en wat ontbreekt. Nu is `calculators.html` een lijst met links; het is de
minst bekeken pagina van de site en werd nooit geïndexeerd.

Een keuzescherm dat werkt zoals mensen denken: **niet "welke tool wil je" maar "waar sta je"**.

- Ik oriënteer me nog
- Ik ga verbouwen
- Ik koop nieuwbouw
- Ik heb al een bouwdepot en loop ergens tegenaan

Per situatie de bijbehorende tools en antwoorden, visueel onderscheiden.

### Fase 4 — Tekst opruimen en herverdelen

De 29 secties op de homepage terug naar circa 6. Wat weg moet van de homepage is niet
weggegooid maar verhuisd naar de pagina waar het thuishoort en waar het beter tot zijn recht
komt.

Dit verbetert het AdSense-verhaal juist, in plaats van het te schaden. Zie §5.

### Fase 5 — Beeld en ritme

Nul afbeeldingen is de reden dat alles op elkaar lijkt. Nodig:

- Diagrammen van het depotproces (eigen SVG, past bij de tokens)
- Grafieken bij de rekenuitkomsten — een maandlastverloop zegt meer dan een tabel
- Visuele afwisseling tussen secties: niet steeds dezelfde witte kaart

### Fase 6 — De vergelijkingspagina's herzien

Ik heb ze als tabel plus proza gebouwd. Beter: een vergelijking waarin je **verschillen ziet
in plaats van leest** — visuele looptijdbalken, duidelijke markering waar een aanbieder
afwijkt.

---

## 5. Botst dit met de AdSense-aanpak?

Eerlijke vraag, want ik heb eerder het tegenovergestelde bepleit.

**Nee — en mijn eerdere redenering was op dit punt te kort door de bocht.** Wat de site de
afwijzing opleverde, was niet te weinig tekst. Het was dat 14 van de 20 pagina's nooit
gecrawld werden, omdat ze geen eigen informatie droegen. Dat probleem is opgelost met de
voorwaardendataset, niet met woordaantallen.

Google beoordeelt bruikbaarheid, niet tekstvolume. Een site waar bezoekers hun antwoord snel
vinden, presteert op elke maatstaf beter — ook op de maatstaven die AdSense hanteert.

Twee dingen blijven wel gelden en houd ik vast:

- Tekst blijft in de HTML staan, niet alleen achter JavaScript
- Verdieping blijft bereikbaar via echte links naar echte pagina's, niet in tabbladen die
  Google niet als aparte pagina ziet

---

## 6. Volgorde en verwachting

| Fase | Wat | Beslismoment |
|---|---|---|
| 1 | Ontwerpsysteem en tokens | Je ziet het palet en de typografie voordat er iets omgaat |
| 2 | Homepage als calculator | Grootste winst, meest zichtbaar |
| 3 | Dashboard voor toolkeuze | |
| 4 | Tekst herverdelen | |
| 5 | Beeld, grafieken, ritme | |
| 6 | Vergelijkingspagina's visueel | |

Ik stel voor om te beginnen met een **visueel voorstel van fase 1 en 2** dat je kunt bekijken
voordat er iets aan de echte site verandert. Dan zie je de richting en kun je bijsturen
zonder risico.

En dit keer kijk ik eerst hoe het eruitziet voordat ik zeg dat het goed is.
