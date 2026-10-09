# Spec: één nieuwbouwrekentool

**Datum:** 23-09-2026 · bijgewerkt na de samenvoeging van maandlasten-bouwdepot
**Status:** voorstel
**Roadmap:** volgt op blok B uit [ADSENSE-AANVRAAG-PLAN.md](../plannen/ADSENSE-AANVRAAG-PLAN.md); onderbouwing in [MARKT-EN-ADSENSE-ONDERZOEK.md](../plannen/MARKT-EN-ADSENSE-ONDERZOEK.md)

## Het probleem

`nieuwbouw.html` is na de homepage de best bekeken pagina van de site:
**5.922 vertoningen in zeven maanden, 79 klikken.** Dat is 1,3% — niet omdat de
snippet faalt, maar omdat de pagina op positie 25 tot 60 staat voor de
zoekopdrachten waar hij op mee zou moeten doen.

Daar liggen twee clusters omheen die niemand met een berekening bedient:

| Cluster | Vertoningen | Positie |
|---|---:|---:|
| Dubbele lasten nieuwbouw | ≈ 1.727 | 38–53 |
| Bouwrente / grondrente | ≈ 1.008 | 25–59 |

Op `dubbele lasten nieuwbouw` staan acht resultaten op pagina 1 — Funda,
Vereniging Eigen Huis, IkBenFrits, Tweakers, Heijmans, Linck, ASN, Knab — en
**geen enkele rekent iets uit.** Google stelt er zelf "voorbeeld berekening
dubbele lasten nieuwbouw" bij voor. Op `bouwrente berekenen` rekenen alleen
BerekenHet en IkBenFrits.

### Het echte gebrek: vier tools die elkaar nodig hebben en niet praten

Dit is de kern, en het is meetbaar. De vier nieuwbouwtools vragen dezelfde
gegevens meerdere keren, en erger: ze vragen de bezoeker om een getal in te
typen dat een van de andere tools net heeft uitgerekend.

| Gegeven | nieuwbouw | bouwrente | dubbele lasten | renteverlies |
|---|:--:|:--:|:--:|:--:|
| Hypotheekrente | ✓ | ✓ | | ✓ |
| Bouwduur / bouwperiode | ✓ | ✓ | ✓ | ✓ |
| Huidige woonlast | ✓ | | ✓ | |
| Depotvergoeding / afslag | ✓ | | | ✓ |
| **Renteverlies bouwdepot** | | | **invoerveld** | **uitkomst** |

Die laatste regel is het bewijs. `dubbele-lasten-nieuwbouw` heeft een invoerveld
"Renteverlies bouwdepot" — precies het bedrag dat `renteverlies-bouwdepot`
berekent. De bezoeker moet het daar ophalen en hier overtypen. En het
depotbedrag dat `renteverlies` nodig heeft, leidt `nieuwbouw` af uit
grondkosten plus aanneemsom.

**De samenvoeging gaat dus niet over minder pagina's. Hij gaat erover dat de
bezoeker nu met de hand getallen tussen vier schermen draagt.**

### En wat we niet vragen

Gemeten op 22-09-2026 aan de tool *Hypotheek maandlasten tijdens de bouw* van
BerekenHet (26 jaar oud, 314 rekentools, 25 miljoen berekeningen per jaar). Zij
vragen vijf dingen die wij nergens vragen:

- direct betaalbare bouwkosten, apart van de resterende aanneemsom
- meerwerk, als eigen bedrag
- soort meerwerk (afwerking / badkamer-keuken / combinatie)
- de periode vóór de bouw start
- hypotheekvorm en een optioneel tweede leningdeel met eigen rente

Zonder die eerste vier klopt de uitkomst niet voor iemand met meerwerk of een
dode periode vóór bouwstart — en dat is de meerderheid van de nieuwbouwkopers.

Hun bouwtool heeft wel maar **zes beoordelingen**. Voor BerekenHet is dit een
zijpad. Dat is onze opening.

## Voor welke bezoeker

De **nieuwbouwkoper**, zie [reis-nieuwbouwkoper.md](../../customers/reis-nieuwbouwkoper.md).
Zijn vraag is niet "wat kost een bouwdepot" maar "wat wordt mijn zwaarste maand
en kan ik die dragen".

De verbouwer raakt de renteverliesberekening ook, maar die komt binnen via de
homepage en `bouwdepot-berekenen`. Voor hem verandert er niets.

## Wat we bouwen

Eén tool op `nieuwbouw.html`: **één invoerset, vier antwoorden.**

De bezoeker vult zijn project één keer in en ziet daarna, zonder een getal over
te typen:

1. **Zijn zwaarste maand** — welke maand het hardst drukt, en met hoeveel
2. **Zijn bouwrente** — totaal en per maand, met of zonder meefinanciering
3. **Zijn dubbele lasten** — de overlapperiode als bedrag en als totaal
4. **Zijn renteverlies** — betaalde hypotheekrente min ontvangen depotvergoeding

De invoer wordt in stappen aangeboden, niet als één muur van vijftien velden:
eerst wat iedereen weet (grond, aanneemsom, rente, bouwduur), daarna wat niet
iedereen heeft (meerwerk, termijnschema, tweede leningdeel). Wie de tweede stap
overslaat krijgt een bruikbare uitkomst met de aanname zichtbaar erbij.

De vier ontbrekende invoervelden van BerekenHet komen erbij: direct betaalbare
bouwkosten, meerwerk met soort, en de periode vóór bouwstart.

## Wat we niet bouwen

- **Geen aanbeveling.** Geen "deze bank past het beste", geen koppeling van de
  uitkomst aan een aanbieder. Zie [JURIDISCHE-CHECK.md](../../context/JURIDISCHE-CHECK.md) §2.
- **Geen acceptatietoets.** De tool kent inkomen, verplichtingen en taxatie niet
  en zegt niets over of de bank meegaat.
- **Geen account, geen serveropslag.** Invoer blijft op het apparaat.
- **Geen tweede hypotheekdeel in de eerste versie.** BerekenHet heeft het, maar
  het verdubbelt de invoer en de meeste nieuwbouwkopers hebben één leningdeel.
  Pas toevoegen als de events laten zien dat mensen erom vragen.
- **Geen nieuwe afhankelijkheid.** De vier bestaande modules worden
  samengevoegd, er komt geen bibliotheek bij.

## Klaar wanneer

- [ ] Eén pagina, één invoerset; geen enkel veld wordt twee keer gevraagd
- [ ] Het invoerveld "Renteverlies bouwdepot" bestaat niet meer — dat getal
      wordt berekend, niet gevraagd
- [ ] De vier ontbrekende invoervelden van BerekenHet zitten erin: direct
      betaalbare bouwkosten, meerwerk, soort meerwerk, periode vóór bouwstart
- [ ] Elke overgeslagen invoer toont zijn aanname op het scherm, niet alleen in
      de methodologie
- [ ] Op 375px staan invoer en de eerste uitkomst samen in beeld, of de
      stickybalk vangt het op
- [ ] Geen horizontale overloop op 375px (meten met `scrollWidth`)
- [ ] De vijfsecondentoets: iemand die de pagina vijf seconden ziet, kan zeggen
      wat hij invult en waar het antwoord verschijnt
- [ ] `npm test` groen, inclusief `tests/nuance.test.mjs`
- [ ] Geen dubbele id's; beide bestaande rekenmodules zijn opgegaan, niet
      naast elkaar blijven staan
- [ ] `bouwrente-nieuwbouw.html`, `dubbele-lasten-nieuwbouw.html` en
      `renteverlies-bouwdepot.html` zijn weg, met 301 naar de juiste sectie
- [ ] Voor-en-na gemeten en vastgelegd in [demo/](../demo/)
- [ ] Events op de tool, zodat we over twee weken weten of mensen hem afmaken

## Raakt

| Wat | Hoe |
|---|---|
| `nieuwbouw.html` | wordt de tool |
| `bouwrente-nieuwbouw.html`, `dubbele-lasten-nieuwbouw.html`, `renteverlies-bouwdepot.html` | verdwijnen |
| `src/js/nieuwbouwcalc.js` | absorbeert `bouwrente.js`, `dubbelelasten.js`, `renteverlies.js` |
| `vite.config.js`, `public/sitemap.xml`, `vercel.json` | drie ingangen eruit, drie redirects erbij |
| `src/styles/broadsheet.css` | alleen als de gefaseerde invoer een eigen vorm nodig heeft |
| `tests/` | `kerncijfers.test.mjs` noemt `nieuwbouw.html`; controleren of de termijnclaim blijft kloppen |
| `scripts/build-*.mjs` | navigatie- en vervolgkaarten die naar de drie pagina's wijzen |

**26 → 23 pagina's.** Dit is de laatste samenvoeging uit blok B; daarmee is het
doel van 23 gehaald.

## Risico

**Dit is de op één na best bekeken pagina van de site.** 5.922 vertoningen zijn
niet niks en een herbouw kan ze kwijtraken. Daarom: URL blijft, `h1` en titel
blijven herkenbaar, en de bestaande secties verdwijnen niet zonder dat hun
inhoud terugkomt.

**Vijftien invoervelden verjagen mensen.** Dat is de echte ontwerpvraag en niet
op te lossen met een langer formulier. Vandaar de gefaseerde invoer. Gaat dat
mis, dan merken we het aan de events: veel starts, weinig voltooiingen. Zonder
die events kunnen we het niet zien — daarom staat het bij "klaar wanneer".

**Nuance kan sneuvelen.** `renteverlies-bouwdepot` vraagt nu expliciet hoe de
geldverstrekker rekent en wanneer het depot wordt opgenomen. Dat zijn geen
franje: ze bepalen de uitkomst. Als ze bij het samenvoegen wegvallen onder het
mom van eenvoud, geven we een preciezer ogend antwoord dat minder waar is.
`tests/nuance.test.mjs` dekt dit niet — dat bewaakt de bankdata, niet de
rekeninvoer.

**Het wordt een aanbeveling zonder dat we het merken.** Zodra de uitkomst een
bank noemt of een keuze voorstelt, verandert de juridische kwalificatie.
Filteren en sorteren mag; concluderen niet.

## Open vragen

1. **Eén pagina of één pagina met ankers?** Vier antwoorden op één scherm kan te
   veel zijn. Alternatief: één invoerset, en de vier uitkomsten als tabbladen of
   secties met ankerlinks — maar dan moet de tekst wel in de HTML blijven staan,
   niet achter JavaScript.
2. **Wat wordt de titel?** Nu "Nieuwbouw bouwdepot berekenen | Wat wordt uw
   zwaarste maand?" (60 tekens, precies op de grens). Er moet "dubbele lasten"
   of "bouwrente" in willen we die clusters pakken, maar er past niets meer bij.
   Mogelijk twee `h2`-secties die die termen dragen in plaats van de titel.
3. **Volgorde van de vier antwoorden.** Zwaarste maand is de belofte van de
   pagina, maar dubbele lasten heeft het meeste zoekvolume. Wie gaat voorop?
4. **Eerst de events of eerst de tool?** Ik zou de events eerst doen — twintig
   regels — zodat de nulmeting er al ligt voordat de tool verandert. Anders
   hebben we straks alleen een "na" en geen "voor".
