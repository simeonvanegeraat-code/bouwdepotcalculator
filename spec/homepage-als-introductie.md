# Spec: homepage als introductie, rekenmachine op een eigen pagina

**Datum:** 31-08-2026
**Status:** in uitvoering
**Roadmap:** blok 2 — UI/UX van de calculator, en blok 3 — SEO-fundament

## Het probleem

De homepage ís de rekenmachine. Voor wie binnenkomt met "wat kost mijn bouwdepot
per maand" werkt dat goed: de uitkomst staat op 375px na 0,42 scherm in beeld
([demo/2026-08-19-nulmeting-homepage.md](../demo/2026-08-19-nulmeting-homepage.md)).
Dat is niet wat we willen veranderen.

Het probleem zit ernaast. De site heeft zeven rekenhulpen en 31 pagina's, en de
homepage introduceert daar niets van. Wie een andere vraag heeft — "mag dit uit
mijn depot", "hoe lang heb ik", "wat doet dit bij nieuwbouw" — landt op een
invoerformulier voor een berekening die hij niet zocht. De enige verwijzing naar
de rest is de gereedschapsbalk en het blok "Waar staat u nu?" op 2,3 scherm
diepte.

**Niet gemeten:** of bezoekers daadwerkelijk afhaken. Er is geen bounce- of
scrollmeting per instap. De aanleiding is een beoordeling van de pagina, geen
cijfer. Wat wél gemeten is, staat hierboven en in de demo-map.

## Voor welke bezoeker

Beide reizen, maar de winst zit bij de nieuwbouwkoper. Die krijgt het depot er
automatisch bij en heeft uitvoeringsvragen — termijnen, dubbele lasten,
declaraties — en niet in de eerste plaats een maandlastvraag. Zie
[customers/reis-nieuwbouwkoper.md](../customers/reis-nieuwbouwkoper.md).
De verbouwer, die wél komt om te rekenen, mag er geen last van krijgen: voor hem
moet de rekenmachine één klik weg zijn en verder onveranderd werken.

## Wat we bouwen

Twee pagina's in plaats van één, in de ontwerptaal van New Form Capital
("editorial broadsheet in a green room") met ons eigen teal als accent. Beide
zijn eerst als preview gebouwd en beoordeeld; die previews zijn bij oplevering
verwijderd omdat ze een tweede kopie van de tokens droegen. De keuze voor deze
richting is vastgelegd in
[demo/2026-08-31-stijlrichtingen.html](../demo/2026-08-31-stijlrichtingen.html).

### `index.html` — introductie

Typografische kop, daarnaast de uitkomst als rekening op papier die meerekent
met een schuifregelaar. Eén primaire actie: **Start berekenen**. Daaronder het
volledige gereedschap, en de onderbouwing van onze onafhankelijkheid.

### `bouwdepot-berekenen.html` — de rekenmachine

De huidige homepage-inhoud, ongewijzigd in gedrag. Deze slug en niet
`maandlasten.html`: `maandlasten-bouwdepot.html` bestaat al en beantwoordt een
andere vraag (rente over de hele lening minus de vergoeding over het depot),
en "bouwdepot berekenen" is de zoekterm waar de huidige homepagetitel op staat.

### Wat waar naartoe gaat

| Nu op `index.html` | Gaat naar | Waarom |
|---|---|---|
| `.reken` — H1, calculator, bankstrook | rekenpagina | Dit ís de tool |
| `#kiezen` "Waar staat u nu?" | homepage | Wordt het gereedschapsrooster |
| "Acht banken, acht verschillende bouwdepots" (kerncijfers) | homepage | Dit is het bewijs bij "onafhankelijk, en dat is te controleren" |
| "Hoe deze berekening werkt" | rekenpagina | Hoort bij de berekening |
| "Vragen over het bouwdepot" | rekenpagina | Vragen van iemand die aan het rekenen is |
| `.melding` onafhankelijkheid + bronnen | beide | Homepage in de donkere sectie, rekenpagina in de voet |

De kerncijfers blijven bewust op `index.html` staan, want
`tests/kerncijfers.test.mjs` toetst ze daar. Verplaatsen zou de test moeten
volgen; laten staan is inhoudelijk beter én verandert niets aan de test.

## Wat we niet bouwen

- **Geen redirect.** `/` blijft bestaan en krijgt andere inhoud. Er is niets om
  heen te wijzen.
- **Geen nieuwe rekenlogica.** `initVerbouwCalculator()` in `src/js/main.js`
  verhuist niet en verandert niet; alleen de pagina waarop hij draait.
- **Niet de andere 29 pagina's herstijlen.** Dit is een aparte stap en een
  aparte spec. Tot die tijd staan er twee ontwerptalen naast elkaar op de site;
  zie het risico hieronder.
- **Geen inlog, geen accounts, geen opslag op een server.** Ongewijzigd.
- **Geen AdSense-blokken plaatsen.** Wel de ruimte ervoor open houden.

## Klaar wanneer

- [x] `bouwdepot-berekenen.html` bestaat, staat in `vite.config.js` en in
      `public/sitemap.xml`, en heeft een eigen `canonical`
- [x] De rekenmachine op die pagina geeft bij gelijke invoer exact dezelfde
      uitkomsten als de huidige homepage — gecontroleerd op minimaal
      € 25.000 / 3,80% / 30 jaar, annuïteiten én lineair
- [x] `og:title`, `og:description` en `og:url` gelijk aan `<title>`,
      `description` en `canonical` op beide pagina's — `tests/deelkaart.test.mjs`
      groen
- [x] `npm test` groen, inclusief `kerncijfers`, `nuance`, `typografie` en
      `componenten`
- [x] Elke pagina die nu naar `/` linkt voor de berekening, linkt naar de
      rekenpagina; de merklink in de kop blijft naar `/` wijzen
- [x] De gereedschapsbalk noemt de rekenpagina
- [x] Homepage op 375px: de knop "Start berekenen" staat in beeld zonder
      scrollen
- [x] Rekenpagina op 375px: invoer en uitkomst samen in beeld, niet slechter
      dan de huidige 0,42 scherm tot de uitkomst
- [x] `context/componenten.md` bijgewerkt met de nieuwe componenten
- [x] Beweging staat uit bij `prefers-reduced-motion`
- [x] Voor-en-na meting in `demo/`, en een regel in het logboek van `review.md`

## Raakt

**Nieuw**
`bouwdepot-berekenen.html`, `src/styles/broadsheet.css`, `src/js/homepage.js`,
`src/js/annuiteit.js`.

*Afwijking van het plan:* de tokens gaan niet in `design-system.css` maar in een
eigen `broadsheet.css`. Dat bestand wordt door alle 31 pagina's geladen; de
tokens daarin omzetten zou in één klap 29 pagina's herstijlen die er niet op
gebouwd zijn. `broadsheet.css` is de migratiedoos en verhuist naar
`design-system.css` zodra alle pagina's over zijn.

**Gewijzigd**
`index.html` (volledig herschreven), `vite.config.js` (ingang),
`public/sitemap.xml` (url + lastmod), `context/componenten.md` (§4),
`tests/componenten.test.mjs` (bewaakt nu ook broadsheet.css),
`ONTWERPPLAN.md` (§3 en de fasen 2 en 3), `review.md`, `roadmap.md`, en de
interne links in alle 31 pagina's.

**Interne links** — 31 pagina's linken naar `/`. Uit te zoeken per link of hij
"naar huis" bedoelt (blijft `/`) of "ga rekenen" (wordt de rekenpagina).

**Tests** — `kerncijfers` en `deelkaart` lezen `index.html` en moeten groen
blijven. `typografie` telt lettergewichten: zie het risico.

**`src/js/main.js`** — toch aangeraakt, maar niet in gedrag. De
annuïteitenformule stond er drie keer letterlijk in en zou voor de homepage een
vierde keer zijn overgetikt; hij staat nu in `src/js/annuiteit.js` en main.js
roept hem aan. Uitkomsten voor en na gecontroleerd op € 25.000 / 3,80% / 30
jaar: identiek.

**Ongewijzigd** — `data/`, `scripts/`, de andere 29 pagina's.

## Risico

**SEO, en dit is de grootste.** De homepage staat op "bouwdepot berekenen". Die
inhoud verhuist naar een URL zonder geschiedenis. Wat dat opvangt: de H1 op de
homepage blijft dezelfde vraag stellen, er staat een werkende voorbeeldberekening
op, en er wijst een prominente link naar de rekenpagina. Waaraan we het merken:
Search Console, posities op "bouwdepot berekenen" en "bouwdepot calculator",
vier weken volgen. Waar we op terug kunnen vallen: de calculator terugzetten
onder de introductie op dezelfde pagina.

**De AdSense-aanvraag staat eind deze week.** Een half afgemaakte migratie is
slechter dan geen migratie: dan bestaat de rekenpagina wel, maar linkt de rest
van de site er niet naartoe. De volgorde is daarom: rekenpagina eerst compleet
en gelinkt, homepage daarna. Niet andersom.

**Twee ontwerptalen naast elkaar.** Na deze stap zien twee van de 31 pagina's er
anders uit dan de rest. Dat is zichtbaar en het voelt onaf. De keuze is: dit
accepteren als tussenstand, of de herstijling van alle pagina's in deze stap
trekken — en dat is een veelvoud aan werk vlak voor de aanvraag.

**Lettergewichten.** `tests/typografie.test.mjs` staat drie gewichten toe en de
site gebruikt nu 400/600/700. De New Form-richting gebruikt 400/500/600. Er moet
er dus één weg, waarschijnlijk de 700 op de grote getallen. Dat raakt elke
pagina, niet alleen deze twee.

**Nuance.** De bankstrook met `detail`-teksten verhuist mee naar de rekenpagina.
`tests/nuance.test.mjs` bewaakt dat die nuance nergens wegvalt; die test moet
groen blijven zonder hem aan te passen.

## Open vragen

1. ~~**Slug.**~~ **Beslist 02-09: blijft `bouwdepot-berekenen.html`.** Bevat het
   zoekwoord en dekt de zoekintentie; korter maken zou dat opgeven voor een
   nettere link.
2. ~~**Herstijling van de rest.**~~ **Beantwoord 01-09.** Alle 32 pagina's zijn
   om; de drie oude stylesheets zijn verwijderd.
3. ~~**De claim "echt".**~~ **Beslist 02-09: blijft staan.** De kop is "Wat kost
   uw bouwdepot echt, per maand?". Onderbouwing: de site rekent posten mee die
   elders wegvallen -- de depotvergoeding en de dubbele lasten. Wie de kop later
   wil verdedigen heeft daar dus iets voor; hij staat alleen nog niet op de
   homepage zelf uitgelegd.
4. ~~**FAQ-markup.**~~ **Beantwoord 01-09.** `index.html` was de enige van de
   32 pagina's zonder JSON-LD en heeft nu `WebSite` en `Organization`. Geen
   `FAQPage`: de drie koppen op de homepage zijn geen vragen maar uitspraken
   over onafhankelijkheid, en een markering die niet met de zichtbare tekst
   overeenkomt is een handmatige maatregel waard.
