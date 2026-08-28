# De homepage voelde als één tool, 22 augustus 2026

De founder: *"als we kijken naar de hoofdpagina voelt het nog niet als een
volwassen website"*, en daarna scherper: *"hoe zorg je dat je ook een
homepagegevoel krijgt, dat de site meer is dan één tool"*.

Eerste poging was een voorstel op basis van onze eigen documenten. Dat werd
terecht afgewezen: te voorzichtig. Daarna vijf sites doorgemeten met dezelfde
meetlat, op 1440 × 900.

## De meting die het verklaarde

| Site | Gewichten | Groottes | Koppen 1e scherm | Echte bestemmingen 1e scherm |
|---|---|---|---|---|
| Rabobank | 2 | 10 | 9 | **38** |
| NerdWallet | 7 (300–900) | 16 | 1 | 15 |
| Independer | 3 | 9 | 4 | **11** |
| Wise | 4 (400–900) | 22 | 1 | — |
| **Wij, voor** | **12** | **13** | 2 | **4** |
| **Wij, na** | **3** | **9** | 1 | **9** |

Van die vier bestemmingen waren er drie geen bestemming: `/`, `#kiezen` en `#`.

## Wat er is veranderd

**Lettergewichten van twaalf naar drie.** Er stonden er acht tussen 520 en 700:
520, 540, 560, 570, 580, 600, 620, 640, 650, 660, 680, 690. Losse verschillen
die je niet ziet en samen als ruis lezen. Nu 400 tekst, 600 koppen, 700 alleen
de grote getallen — 66 declaraties aangepast over vier stylesheets.

**Lettergroottes van dertien naar negen.** Drie losse maten bleken glyphs (`+`,
`−`, `×`) en staan nu in `em`, relatief aan hun omgeving in plaats van als
schaalstap. De vierde, een badge van 11px, gebruikt nu `--ds-t-caption`.

**Een gereedschapsbalk met de zeven rekenhulpen bij naam.** Verbouwbegroting ·
Leenruimte · Maandlasten · Nieuwbouwplanning · Depotplanner · Belastingvoordeel ·
Voorwaarden per bank. Op alle 31 pagina's, vanaf 640px.

**Drie feiten onder de belofteregel.** Bron en controledatum per gegeven, geen
registratie, wij verkopen niets. Independer zet daar marketingclaims; wij hebben
hardere.

**De lead gaat over de site.** Was *"Indicatie zonder registratie · uw invoer
blijft op dit apparaat"* — een privacynotitie op de duurste regel. Nu *"De
voorwaarden van acht geldverstrekkers, doorgerekend voor uw eigen situatie."*
De privacybelofte staat bij de andere feiten.

**De H1 is niet aangeraakt.** Die staat op positie 4,2 voor "bouwdepot
berekenen" met 217 van de 882 klikken.

## Mobiel: bewust niets in het eerste scherm

De balk en de feitenregel verschijnen pas vanaf 640px. Op 375px is het eerste
scherm van de bezoeker die om een bedrag kwam, en daar was 25px speling boven de
stickybalk.

| Meting op 375 × 812 | Voor | Na |
|---|---|---|
| Hoogte van de kop | 56px | 57px |
| Onderkant uitkomstkaart | 705px | 734px |
| Speling tot de vouw | 25px | **78px** |

De speling nam toe doordat de stickybalk sinds diezelfde dag pas verschijnt als
de kaart uit beeld is.

## Onderweg gevonden

`.kop nav { display: flex }` is specifieker dan `.toolbalk` en dwong de balk ook
op mobiel zichtbaar: de kop werd 226px hoog en de uitkomst zakte 91px voorbij de
vouw. Die zes selectors waren altijd al bedoeld voor de hoofdnavigatie en heten
nu `.kop__inner nav`.

## Wat een mens nog moet beoordelen

- De belofteregel loopt op 375px over drie regels (87px). Korter kan, maar zegt
  dan minder.
- Koppen in het eerste scherm gingen van 2 naar 1 doordat de hero groeide.
  Independer heeft er vier.
