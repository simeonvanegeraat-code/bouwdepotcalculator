# Titels en metabeschrijvingen ingekort, 22 augustus 2026

## Waarom, en waarom niet alleen om de lengte

Uit het prestatierapport van Search Console blijkt iets dat zwaarder weegt dan
te lange titels: **de site staat hoog en wordt niet aangeklikt.**

| Zoekopdracht | Positie | CTR | Vertoningen |
|---|---|---|---|
| wat kost een bouwdepot | 3,0 | 3,7% | 242 |
| bouwdepot kosten | 3,0 | 3,8% | 78 |
| kosten bouwdepot | 3,8 | 4,2% | 336 |
| wat kost een bouwdepot van 30.000 euro | 3,9 | 4,5% | 154 |
| wat kost een bouwdepot van 100.000 per maand | 4,3 | **2,0%** | 200 |
| wat kost een bouwdepot van 50.000 | 4,5 | 2,8% | 215 |

Op positie 3 hoort een doorklikratio van ruwweg 10 tot 15 procent. Ter
vergelijking: op "bouwdepot berekenen" haalt de site **6,8% op positie 4,2**,
goed voor 217 van de 882 klikken. Daar werkt de titel wel.

Norm: Google kapt af op pixelbreedte, ongeveer 600px op desktop en 480px op
mobiel, wat neerkomt op 50 tot 60 tekens met het belangrijkste woord binnen de
eerste 50. Beschrijvingen ongeveer 920px, dus 150 tot 160 tekens.

## Gemeten, voor en na

| Meting | Voor | Na |
|---|---|---|
| Titels langer dan 60 tekens | **21** van 31 | **0** |
| Beschrijvingen langer dan 160 tekens | **18** van 31 | **0** |
| Titels die eindigen op `\| BouwdepotCalculator.nl` | 13 | 4 |
| Unieke titels | 31 | 31 |
| Unieke beschrijvingen | 31 | 31 |
| Langste titel | 93 (`bouwdepot-nn`) | 60 |
| Langste beschrijving | 191 (`bouwdepot-nn`) | 155 |

## Wat bewust niet is aangeraakt

**De titel van de homepage.** `Bouwdepot berekenen | Wat kost het per maand?`
levert 217 klikken op met 6,8% op het belangrijkste zoekwoord van de site. Aan
een winnaar kom je niet. De beschrijving daar is wél herschreven: die ging over
de tool ("invoer en uitkomst in één scherm") terwijl de zoeker een bedrag wil.

**De vier juridische pagina's** houden hun merksuffix. Die titels zijn kort
(32–58) en het merk helpt ze juist herkennen.

**"maandlasten bouwdepot berekenen"** staat voluit in de titel van
`maandlasten-bouwdepot.html`. Dat is een zoekopdracht die 24 klikken oplevert;
die woordvolgorde is niet ingekort.

## Drie fouten in mijn eerste voorstel

Alle drie gevonden door het voorstel na te tellen voordat het werd uitgevoerd.

1. **`Bouwdepot voorwaarden vergelijken: 8 geldverstrekkers`** met een dubbele
   punt haalt het aantal uit de greep van `tests/aantal-aanbieders.test.mjs`.
   Die test herkent een totaal aan "van de", "alle" of een haakje ervoor. Met
   een dubbele punt was de pagina stilletjes uit de bewaking gevallen. Het
   haakje is gebleven.
2. **`Bouwdepot MUNT`** verloor de merknaam; het is MUNT Hypotheken. Met
   "voorwaarden en declareren" in plaats van "voorwaarden, looptijd en
   declareren" past de volledige naam alsnog.
3. **Per pagina andere formuleringen** voor de acht aanbieders kan niet: die
   komen uit één sjabloon in `build-voorwaarden.mjs`. Met "looptijd" erin loopt
   Nationale-Nederlanden op 67 tekens en MUNT Hypotheken op 61. Eén sjabloon
   zonder "looptijd" past voor alle acht; het woord staat nog wel in de
   beschrijving.

## Wat een mens moet beoordelen

De doorklikratio is pas over twee tot vier weken te meten, en alleen op de acht
geïndexeerde pagina's. De verwachting is dat de "wat kost een bouwdepot"-vragen
stijgen omdat de beschrijving van de homepage nu een bedrag belooft in plaats
van een tool beschrijft. Dat is een hypothese, geen uitkomst.
