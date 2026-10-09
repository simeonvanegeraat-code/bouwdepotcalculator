# Spec: één header die de rekentools vindbaar maakt

**Datum:** 30-09-2026
**Status:** opgeleverd 30-09-2026, zie [../demo/2026-09-30-header.md](../../demo/2026-09-30-header.md)
**Roadmap:** losstaand; volgt uit de vindbaarheidsmeting van 30-09-2026

## Het probleem

De header is de plek waar bezoekers de rekentools moeten vinden. Nu vinden ze
er niets.

Gemeten op de live site, 30 september 2026:

| Bevinding | Omvang |
|---|---|
| Onder 760px staan alle links behalve één op `display: none` | **zonder vervanging** |
| Verschillende navigatie per pagina | zes pagina's, zes varianten |
| Het label "Uitleg" staat twee keer in dezelfde kop | `bouwdepot-berekenen`, `nieuwbouw`, `verbouwbegroting` |
| Kopieën van de header | 26 HTML-bestanden + 3 generatoren |
| Links naar de elf rekentools | **nul** |

De regel die het veroorzaakt:

```css
@media (max-width: 760px) { .bs-kop__rechts a:not(.bs-menu) { display: none; } }
```

Verbergen zonder vervanging. Op 375px toont de kop precies één link, "Uitleg".
De `bs-staafjes` ernaast lijkt een menuknop maar is een decoratief logomerkje
met `aria-hidden="true"`.

De dubbele "Uitleg" is een regressie van de kennisbank-samenvoeging op
23-09-2026: het navigatielabel werd hernoemd naar "Uitleg" terwijl drie
pagina's al een `#uitleg`-anker met datzelfde woord hadden.

En de drie generatoren dragen elk hun eigen `NAV`-constante, die inmiddels uit
elkaar lopen: `build-begroting.mjs` heeft een item extra.

## Voor welke bezoeker

Beide reizen, zie [../customers/](../customers/). De verbouwer komt binnen op
rekenintentie en moet van de ene berekening naar de andere kunnen. De
nieuwbouwkoper komt terug met uitvoeringsvragen en moet de depotplanner en de
declaratiegids kunnen vinden.

Mobiel is de maatstaf: daar is het gat nu totaal.

## Wat we bouwen

### Eén bron

`data/navigatie.json` beschrijft de header: de drie hoofditems en de
rekenhulpen, gegroepeerd op de vraag van de bezoeker. `scripts/build-header.mjs`
schrijft die header in alle HTML-pagina's. De drie bestaande generatoren lezen
dezelfde bron, zodat ze niet meer uit elkaar kunnen lopen.

Vanaf dan kost een navigatiewijziging één bestand in plaats van negenentwintig.

### De header zelf

Links het woordmerk. Rechts drie dingen, op elke pagina hetzelfde:

- **Rekenhulpen** — knop die het paneel opent
- **Voorwaarden per bank**
- **Uitleg**

Geen on-page-ankers meer in de kop. Die horen bij de pagina, niet bij de
sitenavigatie — dat is precies wat "Uitleg" twee betekenissen gaf.

### Het paneel

Gegroepeerd op wat de bezoeker wil weten, niet op onze bestandsnamen. Elk item
met één regel uitleg eronder:

| Groep | Tools |
|---|---|
| Wat kost het per maand? | bouwdepot berekenen · maandlast tijdens de bouw |
| Wat kost de verbouwing, en kan ik dat lenen? | verbouwbegroting · leenruimte |
| Nieuwbouw | zwaarste maand · bouwrente · dubbele lasten · renteverlies |
| Ik heb al een depot | depotplanner · declaratie afgewezen |
| Belasting | hypotheekrenteaftrek |

De vier nieuwbouwtools staan nu los, omdat ze los bestaan. Gaan ze later op in
één tool volgens [nieuwbouw-rekentool.md](nieuwbouw-rekentool.md), dan is dat
één wijziging in `navigatie.json`.

### De techniek

De **Popover API**: Baseline 2025, 92,51% wereldwijd, Chrome 114+, Safari 17+,
Firefox 125+, iOS Safari 17+. Die geeft top-layer, licht-wegklikken, Escape en
focusbeheer zonder één regel JavaScript.

CSS anchor positioning is afgevallen: "limited availability", Firefox en Safari
ondersteunen het niet. Het paneel wordt daarom met gewone CSS geplaatst — op
mobiel schermvullend, op desktop uitgelijnd onder de knop.

Alle links staan **echt in de HTML**. Popover regelt alleen zichtbaarheid.

### Wat er gebeurt zonder popover-ondersteuning

Die 7,5% is waar "perfect" zich bewijst. Met
`@supports not selector(:popover-open)` verdwijnt de knop en verschijnt in
plaats daarvan een gewone link naar het gereedschapsoverzicht op de homepage.
Geen JavaScript, geen kapot paneel, en nooit meer een navigatie die zomaar weg
is.

## Wat we niet bouwen

- **Geen JavaScript.** Lukt het niet zonder, dan is het ontwerp verkeerd.
- **Geen zoekveld, geen megamenu met beeld.** Rust en precisie; elf regels tekst
  met een zin eronder is genoeg.
- **De voettekst blijft zoals hij is.** Die heeft hetzelfde kopieerprobleem,
  maar dat is een tweede onderwerp.
- **Geen nieuwe afhankelijkheid.**

## Klaar wanneer

- [ ] Alle 26 pagina's hebben exact dezelfde header, uit één bron
- [ ] Op 375px zijn alle elf rekentools bereikbaar vanuit de kop
- [ ] Het woord "Uitleg" staat nog maar één keer per pagina in de kop
- [ ] Geen on-page-ankers meer in de header
- [ ] Het paneel opent en sluit zonder JavaScript; Escape werkt; klikken buiten
      het paneel sluit het
- [ ] Zonder popover-ondersteuning verschijnt een werkende link, geen leeg gat
- [ ] Aanraakzones minimaal 44 × 44px
- [ ] Geen horizontale overloop op 375px, gemeten met `scrollWidth`
- [ ] Toetsenbord: tabvolgorde klopt, focus zichtbaar, focus keert terug naar de
      knop bij sluiten
- [ ] `npm test` groen, `npm run build` slaagt
- [ ] Een navigatiewijziging kost één bestand
- [ ] Voor en na vastgelegd in [../demo/](../demo/)

## Raakt

| Wat | Hoe |
|---|---|
| `data/navigatie.json` | nieuw, de bron |
| `scripts/build-header.mjs` | nieuw, schrijft de header in alle pagina's |
| alle 26 `*.html` | header vervangen |
| `scripts/build-voorwaarden.mjs`, `build-declaratie.mjs`, `build-begroting.mjs` | hun eigen `NAV` vervalt |
| `src/styles/broadsheet.css` | `.bs-kop` uitgebreid, de verbergregel eruit |
| `package.json` | `build:header` in de buildketen |
| `tests/` | nieuwe test die bewaakt dat de headers gelijk blijven |

## Risico

**De header staat op elke pagina, dus een fout staat overal.** Daarom een test
die afdwingt dat alle 26 headers byte-voor-byte gelijk zijn, en de bouw draait
vóór de tests.

**Het paneel mag de vijfsecondentoets niet schaden.** Het is dicht bij het
laden; wie niets aanraakt ziet precies wat hij nu ziet, alleen met een knop erbij
in plaats van drie verdwenen links.

**Popover rendert zonder ondersteuning zichtbaar.** Een paneel met elf links dat
altijd openstaat zou erger zijn dan het huidige probleem. Vandaar de
`@supports`-tak, en die moet getest worden door hem te forceren.

**Gegenereerde pagina's.** Na dit werk zijn alle HTML-bestanden gedeeltelijk
gegenereerd. Dat moet in `CLAUDE.md` bij de regel over gegenereerde bestanden.

## Open vragen

Geen meer. Het bouwstapje en het tonen van vier losse nieuwbouwtools zijn op
30-09-2026 besloten.
