# Spec: het vergelijkingsschema opruimen

**Datum:** 30-09-2026
**Status:** opgeleverd 30-09-2026
**Roadmap:** voorwaarde voor het uitbreiden naar meer geldverstrekkers

## Het probleem

De vergelijking moet groeien van 8 naar meer aanbieders — er zijn er 32 tot
ruim 40 in Nederland. Maar het schema schaalt slecht: van de negentien velden
dragen er zeven de vergelijking en staan er zeven vrijwel altijd leeg.

Gemeten op 30-09-2026 over de acht aanbieders:

| Veld | Gepubliceerd door |
|---|---:|
| `eigenArbeid` | **0 van 8** |
| `minPerOpname` | **0 van 8** |
| `geverifieerdDoor` | **0 van 8** |
| `minimumDepot` | 1 van 8 |
| `maxPerOpname` | 1 van 8 |
| `bewijsstuk` | 2 van 8 |
| `verlengingAanvragen` | 2 van 8 |

De vergelijkingspagina toont nu 44 keer "niet gepubliceerd", de acht
aanbiederpagina's samen 45 keer. Bij 32 aanbieders wordt dat het vierdubbele.

## De grens die we trekken

`over-ons.html` zegt dat "niet gepubliceerd" een bewuste keuze is, en dat
blijft zo. Maar er is een verschil dat je kunt meten:

- **Publiceert minstens één aanbieder het? Dan is blanco informatief.** Het
  zegt dat díe aanbieder minder open is dan de ander. Dat is een echte
  vergelijking en die houden we, ook als zeven van de acht leeg zijn.
- **Publiceert niemand het? Dan vergelijkt blanco niets.** Acht identieke lege
  cellen zeggen niets over de aanbieders — ze zeggen dat de vraag niet te
  beantwoorden was. Dat hoort één keer als zin op de pagina, niet acht keer als
  gat in een tabel.

Naar die grens gaan er drie velden uit en blijven er vier staan.

## Wat we bouwen

**Weg uit de tabel en de aanbiederpagina's:** de rijen *Eigen arbeid
declarabel* en *Minimum per opname*. Dat zijn 2 × 8 cellen op de
vergelijkingspagina en 2 × 8 op de aanbiederpagina's.

**Weg uit de data:** `geverifieerdDoor`. Dat veld wordt nergens gerenderd — het
is dode data.

**Ervoor in de plaats, één zin.** De aanbiederpagina's dragen nu de zin "Van
deze aanbieder zijn N gegevens niet publiek terug te vinden", die telt over
`maxPerOpname`, `minPerOpname`, `restant` en `eigenArbeid`. Twee van die vier
verdwijnen, dus die telling klopt straks niet meer.

Hij wordt vervangen door wat het werkelijk is — geen eigenschap van deze
aanbieder, maar een gat in de hele markt:

> Geen enkele aanbieder in deze vergelijking publiceert of u eigen arbeid mag
> declareren, of er een minimumbedrag per declaratie geldt. Vraag dat na bij uw
> adviseur voordat u tekent.

Dat is informatiever dan zestien lege cellen én het houdt de openstaande vraag
uit [../customers/signalen.md](../customers/signalen.md) zichtbaar.

## Wat we niet bouwen

- **`minimumDepot`, `maxPerOpname`, `bewijsstuk` en `verlengingAanvragen`
  blijven.** Daar publiceert minstens één aanbieder wel, dus blanco vergelijkt
  iets. Ze weghalen zou nuance kosten.
- **Geen schattingen.** Een veld dat verdwijnt wordt niet ingevuld met een
  aanname; het verdwijnt omdat niemand het publiceert.
- **Geen nieuwe aanbieders.** Dat is het volgende stuk werk en het wacht op dit.

## Klaar wanneer

- [ ] De rijen *Eigen arbeid* en *Minimum per opname* staan niet meer op de
      vergelijkingspagina en niet meer op de acht aanbiederpagina's
- [ ] `geverifieerdDoor` staat niet meer in `data/bouwdepot-voorwaarden.json`
- [ ] De marktbrede zin staat er één keer per aanbiederpagina
- [ ] Het aantal keer "niet gepubliceerd" is meetbaar gedaald
- [ ] De uniciteit van de aanbiederpagina's is meetbaar gestegen ten opzichte
      van de 25–39% van 22-09
- [ ] `tests/nuance.test.mjs` blijft groen: elke waarde die blijft, houdt zijn
      toelichting
- [ ] `npm run build` slaagt

## Raakt

| Wat | Hoe |
|---|---|
| `scripts/build-voorwaarden.mjs` | twee rijen eruit, de telzin vervangen |
| `data/bouwdepot-voorwaarden.json` | `geverifieerdDoor` eruit |
| `bouwdepot-voorwaarden-vergelijken.html` + 8 aanbiederpagina's | gegenereerd, dus vanzelf |
| `tests/` | mogelijk een test die de verdwenen velden noemt |

## Risico

**Nuance kan sneuvelen.** Dit is de site waar een echte bezoeker meldde dat een
toelichting ontbrak. `tests/nuance.test.mjs` bewaakt dat elke waarde zijn
`detail` meeneemt; die moet groen blijven.

**De transparantiebelofte.** Minder "niet gepubliceerd" mag niet betekenen dat
we minder open zijn. Vandaar dat de drie verdwenen velden expliciet benoemd
blijven in een zin, in plaats van stilletjes te verdwijnen.

**Terugkomen bij meer aanbieders.** Publiceert aanbieder nummer 12 wél iets
over eigen arbeid, dan moet het veld terug. De regel is niet "dit veld bestaat
niet" maar "nu publiceert niemand het". Dat hoort in het commentaar bij de
generator te staan.

## Open vragen

Geen.
