# CLAUDE.md — werkinstructie voor BouwdepotCalculator.nl

Het startpunt voor elke sessie: wat we bouwen, hoe we samenwerken, welke lat
geldt, en welke regels niet onderhandelbaar zijn. Alles in het Nederlands, net
als de rest van deze repo.

---

## 1. Het product in het kort

| | |
|---|---|
| **Product** | Bouwdepotcalculator.nl — bereken de kosten en de maandelijkse rente van een bouwdepot, met nadruk op nieuwbouwwoningen |
| **Koper** | Nieuwbouwkopers en huiseigenaren die financiële helderheid zoeken |
| **Pijn** | Onzekerheid en gebrek aan overzicht over de maandlasten tijdens de bouw |
| **Belofte** | Absolute financiële helderheid, via professioneel en makkelijk te gebruiken gereedschap en informatie |
| **Verdienmodel** | Google AdSense. De aanvraag staat gepland voor het eind van deze week; snelheid en SEO zijn daarmee blijvende randvoorwaarden, geen bijzaak |
| **Doel nu** | De codebase herzien voor betere UI/UX, de tool helderder maken, en een stevig SEO-fundament leggen |
| **Niet in scope** | Geen inlogsysteem. Geen gebruikersaccounts. Geen opslag van persoonsgegevens op een server |

Er zijn twee reizen die wezenlijk verschillen — zie [customers/](customers/).
Verbouwers kiezen vooraf en rekenen. Nieuwbouwkopers krijgen het depot er
automatisch bij en hebben vooral uitvoeringsvragen.

---

## 2. Zo werken we samen

Je werkt samen met een founder/operator. Die leest mee en beslist.

**Klein en te overzien.** Eén onderwerp per wijziging. Liever drie wijzigingen
die elk in twee minuten te beoordelen zijn dan één die een halve avond kost.

**Raakt het productgedrag? Eerst het plan.** Verandert er iets aan wat de
bezoeker ziet, invoert of terugkrijgt: leg eerst kort voor wat je gaat doen en
waarom, en begin daarna pas. Voor een tekstcorrectie, een stijlaanpassing of een
bugfix is dat niet nodig — doe die gewoon.

**Blijf binnen de opdracht.** Zie je onderweg een tweede probleem, meld het en
maak eerst af waar je mee bezig was. Niet stilletjes meenemen.

**Volg de bestaande stijl.** Kijk hoe het naastgelegen bestand het doet:
Nederlandse namen, vier spaties inspringen, commentaar dat uitlegt waaróm. Je
wijziging hoort niet op te vallen tussen de rest.

**Draai de checks die ertoe doen.** Minimaal `npm test`; bij iets dat de build of
de data raakt `npm run build`. Bij UI: zelf in de browser kijken, op 1440 én op
375 breed.

**Sluit af met drie dingen:** wat er veranderd is, waarmee je het getest hebt, en
wat een mens nog moet beoordelen. Dat laatste is geen formaliteit — noem het echt
als je ergens onzeker over bent of iets hebt aangenomen.

**Commit of push alleen als erom gevraagd wordt.**

---

## 3. Harde regels

Deze komen uit fouten die al een keer gemaakt zijn.

**Data verzin je niet.** Elke waarde in `data/bouwdepot-voorwaarden.json` komt
van de officiële publieke pagina van de aanbieder, met bron en datum. Publiceert
een aanbieder iets niet, dan `null` met status `niet-gepubliceerd` — nooit een
schatting. Een verouderde cel is beter dan een verkeerde cel.

**Nuance mag niet verdwijnen.** Heeft een veld een `detail`, dan rendert dat
overal mee, ook in een krappe tabel. `tests/nuance.test.mjs` faalt als dat niet
gebeurt. Dit is de fout die een echte gebruiker meldde; zie
[customers/signalen.md](customers/signalen.md).

**Geen advies, alleen informatie.** Geen persoonlijke aanbeveling, geen "beste
bank voor jou", geen bezoekersgegevens naar een geldverstrekker. Zodra we dat wel
doen is het AFM-vergunningplichtig. Zie
[JURIDISCHE-CHECK.md](JURIDISCHE-CHECK.md).

**Antwoord eerst, diepte op verzoek.** Elke pagina begint met de uitkomst, niet
met een inleiding. Tekstvolume is geen kwaliteitsmaat en is dat nooit geweest.

**Tekst staat in de HTML.** Verdieping bereik je via echte links naar echte
pagina's, niet alleen achter JavaScript of in tabbladen.

**Ontwerp via tokens.** Kleur, maat en ruimte komen uit
`src/styles/design-system.css`. Geen losse hexwaarden of pixelmaten in
paginabestanden of in JavaScript. We imiteren geen bank: de site ontleent zijn
waarde aan onafhankelijkheid.

**Meten, niet aannemen.** Bekijk een verandering in de browser voordat je zegt
dat hij goed is. Zie [review.md](review.md) en [demo/](demo/).

---

## 4. De kwaliteitslat

Vier eisen aan het product, en één aan de code. Allemaal toetsbaar; de checklist
staat in [review.md](review.md).

### Financieel-serieus om te zien
Iemand die hier zijn hypotheeklasten uitrekent moet het gevoel hebben dat het
klopt. Dat komt van rust en precisie: ruime witruimte, één accentkleur, bedragen
in tabular numerals zodat ze niet verspringen tijdens het typen. Niet van kaders,
kleuren of drukte.

### In vijf seconden te snappen
Een nieuwe bezoeker moet binnen vijf seconden zien wát hij invult en wáár het
antwoord verschijnt, zonder uitleg te lezen. De toets is letterlijk: laat iemand
vijf seconden naar de pagina kijken en vraag wat hij denkt te moeten doen.
Twijfelt hij, dan is het scherm nog niet af.

### Mobiel is de maatstaf, niet het randgeval
Ontwerp op 375px breed en verbreed daarna. De harde eis op de homepage: invoer én
uitkomst in beeld zonder scrollen. De nulmeting was 3,1 schermen scrollen tot de
uitkomst; zie [demo/](demo/). Aanraakzones minimaal 44 × 44px.

### Snel, want daar hangt het verdienmodel aan
De site is statisch en heeft geen framework. Zo houden. Elke nieuwe
afhankelijkheid kost laadtijd en moet die verdienen: weeg hem expliciet en laad
hem alleen op de pagina's die hem gebruiken. Geen bibliotheek meebundelen voor
iets wat in twintig regels eigen code kan. Beeld maken we als eigen SVG, passend
bij de tokens.

### En de code zelf
Schoon en te onderhouden: geen dode code laten staan, geen tweede manier
introduceren om iets te doen dat al ergens gebeurt, geen gegenereerd bestand met
de hand aanpassen. Wat je nu bouwt moet over drie maanden nog te volgen zijn.

---

## 5. Commando's

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

- `npm run dev` — Vite op poort 5173. Ook via de preview-tool
  (`.claude/launch.json`, configuratie `vite`).
- `npm test` — `node --test` over `tests/`. Bewaakt data-integriteit, niet UI.
- `npm run build` — draait eerst de tests, dan de generatoren, dan Vite. Een
  falende test blokkeert de build met opzet.
- `npm run check:voorwaarden` — vergelijkt de bronpagina's van de aanbieders met
  `data/bronnen-snapshot.json`. Werkt niets automatisch bij; meldt alleen.

---

## 6. Waar staat wat

```
*.html                 31 pagina's, elk een eigen Vite-ingang
src/js/                logica per pagina + gedeelde modules
src/styles/            design-system.css is de bron van waarheid voor vorm
data/                  geverifieerde brondata (handwerk, met bronvermelding)
scripts/build-*.mjs    genereren HTML-fragmenten en JS uit data/
tests/                 node:test, bewaakt dat pagina's de data trouw blijven
public/                robots.txt, sitemap.xml, ads.txt, favicons, og-image
dist/                  build-uitvoer, niet in git
```

`src/js/bankdata.generated.js` is **gegenereerd**. Nooit met de hand aanpassen —
wijzig `data/bouwdepot-voorwaarden.json` en draai `npm run build:voorwaarden`.

### Een pagina toevoegen

1. Het HTML-bestand in de repo-root.
2. Een ingang in `vite.config.js` — anders komt de pagina niet in de build.
3. Een `<url>` in `public/sitemap.xml`.
4. Interne links vanaf de pagina's waar hij thuishoort.

Volledige routine: [routines/nieuwe-pagina.md](routines/nieuwe-pagina.md).

---

## 7. De werkmap

| Bestand of map | Waarvoor |
|---|---|
| [roadmap.md](roadmap.md) | Wat nu, wat hierna, wat later. Eén bron voor volgorde |
| [review.md](review.md) | Wanneer werk af is, plus het logboek van opgeleverd werk |
| [context/](context/) | Bedrijfscontext, techniek, en waarom keuzes zijn gemaakt |
| [context/componenten.md](context/componenten.md) | Welke 109 componenten er zijn en waar ze niet voor zijn. Kijk hier vóór je een klasse maakt |
| [customers/](customers/) | De twee reizen en wat echte bezoekers melden |
| [spec/](spec/) | Eén bestand per stuk werk, geschreven vóór de code |
| [demo/](demo/) | Voor-en-na bewijs van UI-werk, met gemeten waarden |
| [routines/](routines/) | Terugkerende taken met een vast stappenplan |

De inhoudelijke plannen staan in de bestaande documenten en blijven daar:
`PRODUCTPLAN.md`, `ONTWERPPLAN.md`, `ONTWERPPLAN-HIERARCHIE.md`,
`KWALITEITSPLAN.md`, `ADSENSE-PLAN.md`, `JURIDISCHE-CHECK.md`,
`CONCURRENTIE-EN-OORDEEL.md`. De werkmap verwijst ernaar en herhaalt ze niet.

---

## 8. Conventies

- **Nederlands** overal: code-commentaar, tests, commits, documentatie.
- **Commits** in gebiedende wijs, en ze beschrijven wat er verandert voor de
  bezoeker: "Haal de leenruimte uit het uitklapblok en maak er een eigen pagina
  van" — niet "fix css".
- **Commentaar legt uit waaróm**, niet wat er staat. De bestaande bestanden laten
  het bedoelde niveau zien.
