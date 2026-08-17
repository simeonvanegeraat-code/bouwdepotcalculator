# Productplan BouwdepotCalculator.nl

**Datum:** 16 augustus 2026
**Doel:** vastleggen wat we bouwen, wat op welke pagina komt, en toetsen of we
daarmee beter zijn dan de concurrentie.

---

## 1. Het eindproduct in één zin

> De site die je van **verbouwplan naar goedgekeurde declaratie** brengt, met
> bij elke stap de voorwaarden van jouw eigen geldverstrekker erbij.

Niet: een verzameling rekenmachines. Wel: een traject waarin elke stap iets
oplevert dat je houdt en kunt gebruiken.

### Twee principes die alles sturen

**1. Elke tool levert een document op, geen getal.**

Een rekenmachine geeft een uitkomst en dan vertrek je. Een tool die een
begroting, een specificatie of een planning oplevert, houd je bij je en deel
je met je aannemer of adviseur. Concurrenten geven getallen; wij geven
werkstukken.

**2. Je bankkeuze loopt door de hele site mee.**

Wij hebben als enige geverifieerde voorwaarden per geldverstrekker. Die staan
nu op één pagina. Ze horen in élke tool: kies eenmaal je bank en de
maandlastberekening weet dat ING geen depotvergoeding kent, de begroting weet
welke posten jouw bank accepteert, en de planner weet dat je 24 plus 12
maanden hebt en vier maanden vooraf moet verlengen.

Dat is de grote zet. Onze unieke data zit nu in een naslagwerk; hij hoort in
het gereedschap.

---

## 2. Wat er op welke pagina komt

### Ingang

**`index.html` — Start hier**

Blijft de snelle maandlastberekening, want daar komt vrijwel al het verkeer op
binnen. Toevoegen: de **bankkeuze** die de rest van de site personaliseert, en
een duidelijke routekeuze naar de vier hoofdtaken.

### Spoor verbouwen — vier taken in volgorde

**`verbouwbegroting.html` — Wat gaat het kosten?** *(nieuw)*

De stap die nu volledig ontbreekt en die logisch vóór alle andere komt.

- Posten opbouwen per ruimte of onderdeel, met kengetallen als startpunt
- Onderscheid noodzakelijk / gewenst, zodat schrappen later makkelijk is
- Expliciete onzekerheidsmarge
- **Per post: accepteert jouw bank dit?** — uit onze eigen data
- Levert op: totaalbedrag én een **verbouwingsspecificatie** in de vorm die
  geldverstrekkers vragen

**`leenruimte.html` — Kan ik dit lenen?** *(uit het uitklapblok halen)*

Staat nu verstopt op de homepage achter "Ook waarderuimte en eigen geld
toetsen". Wordt een eigen pagina.

- Waarde na verbouwing, huidige hypotheek, eigen geld, kosten buiten depot
- De 100%-regel, het financieringsgat, wat er aan eigen geld nodig is
- Nadrukkelijk: dit is een waardetoets, geen inkomenstoets
- Neemt het bedrag over uit de begroting

**`index.html` — Wat kost dat per maand?** *(bestaat)*

**`bouwdepot-declaratie-afgewezen.html` — Hoe krijg ik het uitbetaald?** *(bestaat)*

### Spoor nieuwbouw

**`nieuwbouw.html` — Het hele bouwverloop** *(bestaat, wordt uitgebreid)*

Absorbeert `bouwrente-nieuwbouw.html` en `dubbele-lasten-nieuwbouw.html`. Die
zijn als losse tool te dun: de een is één vermenigvuldiging, de ander telt vier
getallen op. Als onderdeel van het bouwverloop zijn ze wel zinvol.

Uitbreiden met wat BerekenHet wel vraagt en wij niet:

- Onderscheid tussen direct betaalbare en later vervallende bouwkosten
- Meerwerk als aparte post, met soort
- Maanden vóór bouwstart, want die dode periode kost ook geld
- Een tweede leningdeel met een eigen rentepercentage

**`depotplanner.html` — Ik heb een lopend depot** *(nieuw)*

Voor wie er middenin zit. Geen rekenmachine maar een agenda.

- Invoer: depotbedrag, startdatum, bank, wat er al is opgenomen
- Levert op: einddatum, resterende tijd, **uiterste datum om verlenging aan te
  vragen**, en wat er met het restant gebeurt — allemaal uit de bankdata
- Een declaratieplanning die je kunt printen

### Naslag

| Pagina | Status |
|---|---|
| `bouwdepot-voorwaarden-vergelijken.html` | bestaat, sterk |
| 6 aanbiederpagina's | bestaan, **moeten onderscheidender** |
| `bouwdepot-declaratie-afgewezen.html` | bestaat, nieuw |
| `begrippenlijst.html` | **ontbreekt** |

De aanbiederpagina's hebben nu 3 tot 5 procent unieke woordenschat. Ze moeten
per aanbieder een eigen verhaal krijgen: waar wijkt deze bank af van de rest,
wat betekent dat in de praktijk, welke fout maken klanten hier het vaakst.

### Redactioneel en vertrouwen

Blijven zoals ze zijn: kennisbank, stappenplan, foutengids, renteaftrekgids,
advieschecklist, over-ons, methodologie, contact, juridisch.

---

## 3. Toets: zijn we dan beter dan de concurrentie?

Per gebied, eerlijk.

| Gebied | Wij straks | BerekenHet | IkBenFrits | Oordeel |
|---|---|---|---|---|
| Begroting opbouwen | volwaardige tool met bankfilter | niet aanwezig | niet aanwezig | **wij** |
| Verbouwingsspecificatie | genereren uit de begroting | niet aanwezig | statische download | **wij** |
| Voorwaarden per bank | 6 aanbieders, bron en datum | niet aanwezig | niet aanwezig | **wij** |
| Declaratie afgewezen | per aanbieder | niet aanwezig | niet aanwezig | **wij** |
| Depotplanner | met bankspecifieke datums | niet aanwezig | niet aanwezig | **wij** |
| Maandlast tijdens bouw | na uitbreiding gelijkwaardig | rijker model | basaal | **gelijk** |
| Leenruimte | eigen pagina | aanwezig | aanwezig met tool | **gelijk** |
| Begrippenlijst | nieuw | hypotheekwoordenboek | niet aanwezig | **gelijk** |
| Aantal calculators | ongeveer acht | zestig | één | **zij** |
| Eén complete gids | verdeeld over pagina's | niet aanwezig | 2.500 woorden | **zij** |

### Waar we bewust níet op concurreren

BerekenHet heeft zestig calculators over het hele woondomein. Dat halen we
nooit in en dat moeten we ook niet willen. Zij zijn breed; wij zijn het
diepste op één onderwerp. Wie "hypotheek berekenen" zoekt hoort bij hen, wie
"bouwdepot" zoekt hoort bij ons.

### De conclusie van de toets

Op vijf van de tien gebieden zijn we straks duidelijk beter, en dat zijn juist
de gebieden waar niemand anders zit. Op drie zijn we gelijkwaardig. Op twee
verliezen we, en één daarvan is een bewuste keuze.

Dat is een verdedigbare positie, mits we de vijf sterke gebieden echt afmaken
in plaats van half.

---

## 4. Bouwvolgorde

1. **Verbouwbegroting** — grootste gat, staat vooraan in de reis, voedt alles
2. **Verbouwingsspecificatie** — rolt uit de begroting, uniek in de markt
3. **Leenruimte als eigen pagina** — bestaande logica, alleen zichtbaar maken
4. **Bankkeuze door de site heen** — maakt onze data overal bruikbaar
5. **Depotplanner** — bedient de nieuwbouwkant en wie al een depot heeft
6. **Nieuwbouwplanner verrijken** — tweede leningdeel, meerwerk, dode periode
7. **Opruimen** — bouwrente en dubbele lasten opnemen in de nieuwbouwplanner
8. **Aanbiederpagina's onderscheidend maken**
9. **Begrippenlijst**

De eerste twee samen vormen één samenhangend product en zijn het meest
onderscheidend. Daar begin ik.
