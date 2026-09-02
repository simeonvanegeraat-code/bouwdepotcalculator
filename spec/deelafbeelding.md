# Spec: de afbeelding bij een gedeelde link

**Datum:** 02-09-2026
**Status:** voorstel
**Roadmap:** blok 3, SEO-fundament

## Het probleem

`public/og-1200x630.png` is nul bytes en er staat op geen enkele van de 32
pagina's een `og:image`. Een link naar deze site in WhatsApp, LinkedIn of Slack
toont dus de titel, de omschrijving en het domein — en een leeg vlak of niets
waar bij andere partijen een beeld staat.

Dat is bekend sinds 22 augustus. Het bleef liggen omdat het tekenen van het
beeld makkelijk is en het *op schijf krijgen* niet: uit de browser komt geen
bestand, en we hebben geen stap die een afbeelding kan maken.

De deelkaarten zijn er verder wel: `tests/deelkaart.test.mjs` bewaakt op alle 32
pagina's `og:title`, `og:description`, `og:url` en `twitter:card`, inclusief de
lengtegrenzen. Alleen het beeld ontbreekt.

## Voor welke bezoeker

Beide, maar indirect. Dit gaat niet over wie op de pagina staat maar over wie
een link doorgestuurd krijgt van een partner, een aannemer of iemand op een
forum. Voor die persoon is de kaart het eerste en soms het enige wat hij ziet.

## Wat we bouwen

**Eén beeld voor de hele site, gemaakt in de bouwstap.**

`scripts/build-ogimage.mjs` schrijft `public/og-1200x630.png` uit een SVG die
dezelfde tokens gebruikt als de site: bone white doek, perszwart, één teal
accent, Inter. De inhoud:

- het woordmerk **BouwdepotCalculator.nl** linksboven, met de accentstreep
  eronder die ook in de kop van de site staat;
- de belofte in de kopmaat: **Wat kost uw bouwdepot, per maand?**;
- rechtsonder een klein rekeningblad met vier regels en een bedrag, hetzelfde
  motief als op de homepage;
- onderaan één regel kapitaaltjes: acht geldverstrekkers · bron en
  controledatum · geen advies.

Daarna krijgen alle 32 pagina's `og:image`, `og:image:width`, `og:image:height`
en `og:image:alt`, en gaat `twitter:card` van `summary` naar
`summary_large_image`. Dat laatste is de kaart die het beeld groot toont; met
`summary` blijft het een miniatuur.

**Hoe het beeld op schijf komt.** Dit is het stuk dat het vorige keer blokkeerde.
Drie routes, met wat ze kosten:

| Route | Kosten | Bezwaar |
|---|---|---|
| **`sharp` als bouwafhankelijkheid** (aanbevolen) | één npm-pakket, alleen bij het bouwen | Een afhankelijkheid erbij, maar hij gaat de browser niet in en kost dus nul laadtijd |
| Headless browser (Playwright) | ±300 MB aan browsers | Veel te zwaar voor één plaatje |
| Founder exporteert hem één keer | niets | Statisch bestand dat niemand meer aanraakt; bij een merkwijziging vergeet je hem |

`sharp` is een **bouwafhankelijkheid en geen paginagewicht.** CLAUDE.md zegt dat
elke nieuwe afhankelijkheid zijn laadtijd moet verdienen; deze zit niet in de
bundel en verandert geen enkele byte die de bezoeker binnenhaalt. Dat is een
ander soort keuze dan jsPDF of Chart.js, die wél meegingen naar de browser en
er daarom uit zijn gegaan.

## Wat we niet bouwen

- **Geen beeld per pagina.** Technisch kan het — de titel in de SVG vervangen
  per pagina — maar dat zijn 32 bestanden van elk ±80 kB in de repo, en de winst
  is klein. Wel zo opzetten dat het later kan zonder alles om te gooien.
- **Geen foto's.** Beeld maken we als eigen SVG uit de tokens; dat staat zo in
  CLAUDE.md en er is geen reden om er hier van af te wijken.
- **Geen cijfers in het beeld die kunnen verouderen.** Wel "acht
  geldverstrekkers" — dat getal wordt uit `data/bouwdepot-voorwaarden.json`
  gelezen en niet ingetypt, net als op de pagina's.
- **Geen dienst van derden** die de kaart op aanvraag genereert. Dat zou een
  extern verzoek zijn per gedeelde link.

## Klaar wanneer

- [ ] `npm run build` schrijft `public/og-1200x630.png`, precies 1200 × 630, en
      het bestand is niet nul bytes.
- [ ] Alle 32 pagina's hebben `og:image` met een absolute URL, plus `width`,
      `height` en `alt`.
- [ ] `twitter:card` staat op `summary_large_image`.
- [ ] `tests/deelkaart.test.mjs` krijgt er een controle bij: elke pagina heeft
      een `og:image`, en het bestand waar hij naar wijst bestaat en is groter
      dan nul bytes.
- [ ] Het aantal geldverstrekkers in het beeld komt uit de data, niet uit een
      string. Bij een negende aanbieder klopt het beeld na één build.
- [ ] Nagekeken in de kaartvoorbeeldtools van LinkedIn en Facebook, en met een
      echte gedeelde link in WhatsApp.
- [ ] Het beeld is leesbaar op de kleinste weergave die WhatsApp gebruikt.
- [ ] De bouwtijd loopt niet noemenswaardig op; nu 0,4 seconde voor Vite.

## Raakt

- `scripts/build-ogimage.mjs` — nieuw
- `package.json` — `sharp` bij de devDependencies, en de bouwstap
- `public/og-1200x630.png` — wordt gegenereerd; hoort dan in `.gitignore`, net
  als `dist/`
- alle 32 HTML-pagina's plus de drie generatoren in `scripts/`
- `tests/deelkaart.test.mjs`

## Risico

**Dat het bestand gegenereerd wordt maar niet meegaat naar productie.** Als
`public/og-1200x630.png` in `.gitignore` staat, moet de bouwstap op Vercel hem
maken. Doet hij dat niet, dan is er ineens géén afbeelding en zien we dat pas
als iemand een link deelt. Controle: na de eerste deploy de URL rechtstreeks
opvragen.

**Dat `sharp` niet bouwt op Vercel.** Het is een pakket met een binaire
component. Het draait daar gangbaar, maar dit moet op de eerste deploy
gecontroleerd worden en niet aangenomen.

**Dat het beeld iets belooft wat de pagina niet waarmaakt.** Een kaart met een
bedrag erop suggereert een uitkomst zonder invoer. Daarom een voorbeeldblad met
het woord "voorbeeld" erop, net als op de homepage.

## Open vragen

1. **De afhankelijkheid.** `sharp` erbij, of liever één keer met de hand
   exporteren en het bestand vastleggen? Beslissing: founder. Mijn voorstel is
   `sharp`, omdat een handgemaakt bestand bij de eerste merkwijziging stil
   verkeerd wordt.
2. **Wanneer.** Dit raakt hoe de site eruitziet in andermans tijdlijn, niet hoe
   hij werkt. De AdSense-aanvraag loopt en het
   [meeneemdocument](meeneemdocument.md) is inhoudelijk belangrijker. Volgorde:
   founder.
