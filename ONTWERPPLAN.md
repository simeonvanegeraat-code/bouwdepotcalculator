# Herontwerp BouwdepotCalculator.nl

**Datum:** 14 augustus 2026
**Bijgewerkt:** 31 augustus 2026 — §3 en de fasen 2 en 3 herschreven. De richting
is niet langer "Apple design" maar een redactionele broadsheet, en de homepage
wordt juist géén calculator meer. Wat er stond en waarom het is veranderd staat
in die paragrafen zelf; het is niet stilletjes overschreven.

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

## 3. De ontwerptaal: een redactionele broadsheet

*Herschreven 31-08-2026. Hier stond "Wat Apple design concreet betekent" met de
drie principes clarity, deference en depth. Die principes waren niet fout — ze
staan nog steeds boven `design-system.css` — maar ze zijn te algemeen om een
scherm mee te ontwerpen. Elk rustig, terughoudend systeem voldoet eraan, en dat
is precies waarom de site er als "in elkaar gezet" uitzag in plaats van
ontworpen: er viel niets uit af te leiden.*

De richting is nu concreet en heeft een naam. Hij komt van
[New Form Capital](https://www.newformcap.com) via styles.refero.design, en luidt
daar: *editorial broadsheet in a green room.*

Waarom deze: het is een fintech die er als een gedrukte financiële krant uitziet
en niet als een dashboard. Dat is precies onze positie — wij zijn geen bank en
we willen er ook niet naar lijken, maar we moeten wel serieus genoeg ogen dat
iemand er zijn hypotheeklasten op durft te baseren. Een broadsheet doet dat met
typografie in plaats van met chroom.

### De regels

| | |
|---|---|
| Doek | warm bone white `#fafffa`, nooit zuiver wit |
| Inkt | perszwart `#121613` met een groene inslag |
| Accent | **ons teal `#0E5F58`** — één chromatische noot, verder niets |
| Typografie | Inter, gewichten 400 / 500 / 600. Hiërarchie komt uit maat, niet uit vet |
| Kopmaat | tot 84px op de homepage, met `letter-spacing: -.04em` |
| Bodymaat | nooit boven 18px; het gat tussen 18 en de display doet het werk |
| Microtypografie | kapitaaltjes op 11px met `+.1em` spatiëring doen het werk van kaders |
| Diepte | haarlijnen en oppervlakcontrast. Schaduw alleen op de primaire actie, en getint met het accent |
| Raster | 8pt met 4pt onderverdeling, ongewijzigd |
| Aanraakzone | 44 × 44px, ongewijzigd |
| Beweging | doelgericht en traag; alles is `transform` of `opacity` |

### Waar wij van de bron afwijken, en waarom

**Kleur.** New Form gebruikt een fel groen `#2bee4b`. Wij houden ons eigen teal.
De structuur is overtuigend, die kleur is dat voor een hypotheekpagina niet.

**Beeld.** New Form zet grijswaardenfotografie tussen de regels van de kop. Wij
hebben geen fotobibliotheek en het kwaliteitsplan zegt: beeld maken we als eigen
SVG. Onze fotografie is het getal. De uitkomst verschijnt daarom als een
**rekening op papier** — wit blad, haarlijnen, gescheurde onderrand, een
markeerstreep over het totaal.

Dat blad gedraagt zich per pagina anders, en dat verschil is opzettelijk:

- **Op de homepage** zweeft het, kantelt het naar de muis en print het zichzelf
  uit. Daar is het een plaatje van wat je krijgt.
- **Op een rekenpagina** staat het stil. Daar *ís* het de uitkomst, en een bedrag
  dat wiebelt terwijl je het probeert af te lezen is een grap ten koste van de
  bezoeker.

### Het kleurprobleem — opgelost, en het blijft opgelost

De oude hoofdkleur stond in de CSS omschreven als `/* Donkerblauw (Rabo-achtig) */`.
Dat is precies verkeerd voor een site die zijn waarde ontleent aan **onafhankelijk**
zijn van banken: je leent visueel vertrouwen van een partij die je vergelijkt.

Teal `#0E5F58` is sindsdien de accentkleur en blijft dat. Onder de Nederlandse
geldverstrekkers is oranje, blauw en groen-geel allemaal bezet; teal is
onderscheidend en rustig genoeg voor cijfers.

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

### Fase 2 — De calculator krijgt een eigen pagina

*Herschreven 31-08-2026. Hier stond "de homepage wordt de calculator". Dat is
gebeurd en het werkte: de uitkomst staat op 375px na 0,42 scherm in beeld, waar
het 3,1 scherm was. De harde eis is dus gehaald en blijft staan — hij verhuist
alleen mee naar de nieuwe pagina.*

De reden om het om te draaien staat in
[spec/homepage-als-introductie.md](spec/homepage-als-introductie.md): de site
heeft zeven rekenhulpen en 31 pagina's, en wie binnenkomt met een andere vraag
dan "wat kost dit per maand" landt op een invoerformulier dat hij niet zocht.

- De rekenmachine verhuist naar `bouwdepot-berekenen.html`, ongewijzigd in gedrag
- **Invoer en resultaat samen in beeld** op mobiel blijft de harde eis, en de
  0,42 scherm mag niet slechter worden
- Het resultaat is de rekening op papier uit §3, stilstaand
- Elke pagina die nu voor de berekening naar `/` linkt, gaat hierheen

### Fase 3 — De homepage wordt de introductie

Wat fase 3 eerst "een dashboard om tools te kiezen" noemde, is nu de homepage
zelf. Dat is beter dan een aparte keuzepagina: `calculators.html` was de minst
bekeken pagina van de site en werd nooit geïndexeerd, precies omdat niemand een
tussenscherm opzoekt.

De opbouw:

1. Typografische kop met de vraag waar de site over gaat
2. Ernaast de rekening, die meerekent met een schuifregelaar — één beweging en de
   bezoeker weet dat hier iets te doen valt
3. Eén primaire actie: **Start berekenen**
4. Het volledige gereedschap in een rooster
5. De onderbouwing van onze onafhankelijkheid, met de kerncijfers uit de dataset

De vier situaties uit het oude fase 3 blijven bestaan als ingangen in dat
rooster: ik oriënteer me nog, ik ga verbouwen, ik koop nieuwbouw, mijn depot
loopt al.

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

| Fase | Wat | Stand op 31-08-2026 |
|---|---|---|
| 1 | Ontwerpsysteem en tokens | **Klaar**, en herzien naar de broadsheet uit §3 |
| 2 | Calculator op een eigen pagina | In uitvoering — `bouwdepot-berekenen.html` |
| 3 | Homepage als introductie | Volgt direct op fase 2 |
| 4 | Tekst herverdelen | Grotendeels meegenomen in 2 en 3 |
| 5 | Beeld, grafieken, ritme | Open. De rekening uit §3 is de eerste stap |
| 6 | Vergelijkingspagina's visueel | Open |

De volgorde binnen fase 2 en 3 luistert nauw, en niet om ontwerpredenen: de
AdSense-aanvraag staat eind deze week. Een halve migratie is slechter dan geen —
dan bestaat de rekenpagina wel, maar linkt de rest van de site er niet naartoe.
Dus **eerst de rekenpagina compleet en overal gelinkt, daarna pas de homepage.**

Beide zijn eerst als preview gebouwd en bekeken voordat er iets aan de echte
site veranderde. Die previews zijn bij oplevering verwijderd: ze droegen een
tweede kopie van de tokens, en dat is precies hoe twee versies stil uit elkaar
gaan lopen. Wat blijft staan is
[demo/2026-08-31-stijlrichtingen.html](demo/2026-08-31-stijlrichtingen.html) —
de drie kandidaat-richtingen naast elkaar, en daarmee de enige vastlegging van
waaróm het deze richting is geworden.

En dit keer kijk ik eerst hoe het eruitziet voordat ik zeg dat het goed is.
