# De vervolgstap staat bij de uitkomst, 22 augustus 2026

De volgende vraag stond op elke rekenpagina pas in de lopende tekst, ver onder
het antwoord. Op `maandlasten-bouwdepot.html` stond de link naar de begroting op
6,08 van de 8,26 schermen: voorbij het punt waarop iemand met zijn antwoord al
weg is.

Nieuw element `.vervolgstap`: één tekstregel onderaan de uitkomstkolom, met een
dunne bovenlijn. Eén per pagina.

## Gemeten, mobiel (375 × 812)

| Pagina | Vervolgstap naar | Stond op | Staat nu op |
|---|---|---|---|
| `maandlasten-bouwdepot.html` | verbouwbegroting | 6,08 schermen | **1,28** |
| `nieuwbouw.html` | depotplanner | 6,60 schermen | **1,16** |
| `depotplanner.html` | declaratie afgewezen | 4,95 schermen | **1,19** |
| `leenruimte.html` | maandlasten | bestond niet | **1,51** |

## Wat het kost aan ruimte

| | |
|---|---|
| Hoogte van de regel | 65px (89px op de depotplanner, langere zin) |
| Eerste scherm mobiel | onaangeroerd — de regel staat onder de uitkomstkaart, buiten de vouw |
| Kolomverschil desktop, `maandlasten` | 286px → **221px**, de kolommen worden gelijker |

## Waarom een tekstregel en geen knop of kader

Gemeten op de homepage: de stickybalk met het bedrag staat vast met zijn
bovenrand op 730px, dus de werkelijke vouw op 375 × 812 is 730 en niet 812. Het
uitkomstblok eindigt daar op 705px — **25px speling**.

| Variant | Groei | Past binnen 730px |
|---|---|---|
| Kader (`.melding`) | +134px | nee, 109px eronder |
| Kale tekstregel | +60px | nee, 35px eronder |

Vandaar dat de homepage géén vervolgstap krijgt: er is geen ruimte, en het blok
`#kiezen` op 2,8 schermen doet dat werk al met vier kaarten.

Inhoudelijk telt hetzelfde argument: een tweede knop onder de printknop maakt van
de uitkomst een keuzemenu. Dan is het bedrag niet meer het antwoord maar één van
de dingen die je kunt doen.

## Welke pagina's er bewust geen kregen

| Pagina | Waarom niet |
|---|---|
| `index.html` | Heeft `#kiezen` met vier routes op 2,8 schermen. En 25px speling |
| `verbouwbegroting.html` | Heeft al een primaire knop "Wat kost dit per maand?" in `.uitkomst-acties` |
| `bouwrente-nieuwbouw.html` | Had al een kruimelpadlink (0,09) én een vervolgkaart (4,33) naar nieuwbouw. Een derde is drukte |
| `dubbele-lasten-nieuwbouw.html` | Idem, kaart op 4,71 |
| `belasting.html`, `renteverlies-bouwdepot.html` | Eindpunt van hun reis. Een vervolgstap verzinnen is een reis verzinnen |

Op de eerste twee is er wél iets op te merken, maar dat is een andere wijziging:
de begroting stuurt door naar de maandlast terwijl volgens
[reis-verbouwer.md](../customers/reis-verbouwer.md) de leenruimte ertussen hoort.
