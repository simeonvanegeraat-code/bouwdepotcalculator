# AdSense-goedkeuring: diagnose en plan (v3)

**Datum:** 14 augustus 2026 · derde herziening, na de indexeringsdetails
**Site:** https://www.bouwdepotcalculator.nl · domein sinds 6 februari 2026
**AdSense-status:** "Vereist aandacht — Content van weinig waarde"

---

## 1. De doorbraak: die 14 pagina's zijn nooit gecrawld

Bij alle 14 niet-geïndexeerde pagina's staat **"Laatst gecrawld: N.v.t."**

Dat is fundamenteel iets anders dan afgekeurd. Google heeft die pagina's in zes maanden
**nog geen enkele keer opgehaald.** Er ligt dus geen kwaliteitsoordeel over — er ligt
helemaal niets over.

### Ik heb alle voor de hand liggende oorzaken uitgesloten

| Mogelijke oorzaak | Gecontroleerd | Uitkomst |
|---|---|---|
| `noindex` op die pagina's | alle 20 pagina's | Alle `index,follow` ✅ |
| Geblokkeerd in robots.txt | `robots.txt` | `Allow: /` ✅ |
| Ontbreken in sitemap | `sitemap.xml` | Alle 14 staan erin ✅ |
| HTTP-fouten | alle 20 URL's live getest | Alle 200 OK ✅ |
| Slechte interne links | link-analyse over de hele site | **Uitstekend** ✅ |

Die laatste is het meest sprekend:

| Pagina | Interne links | Vanaf geïndexeerde pagina's | Ooit gecrawld |
|---|---|---|---|
| `calculators.html` | **73** (meer dan de homepage!) | 5 van 5 | **nooit** |
| `over-ons.html` | 43 | 5 van 5 | **nooit** |
| `contact.html` | 42 | 5 van 5 | **nooit** |
| `maandlasten-bouwdepot.html` | 35 | 5 van 5 | **nooit** |
| `bouwrente-nieuwbouw.html` | 30 | 5 van 5 | **nooit** |
| `index.html` | 71 | — | geïndexeerd |

`calculators.html` is de best gelinkte pagina van de hele site en Google heeft hem nooit
aangeraakt. Er is technisch niets mis. Dit is geen bouwfout.

### Wat er dan wel aan de hand is: uithongering van het crawlbudget

Kijk naar de crawldatums van de 5 pagina's die wél in de index staan:

| Pagina | Laatst gecrawld |
|---|---|
| `belasting.html` | 24 juni |
| `stappenplan.html` | 19 juli |
| `kennisbank.html` | 28 juli |
| `nieuwbouw.html` | 30 juli |
| `/` | 5 augustus |

**Google crawlt deze site ongeveer één pagina per week.** Dat is een uitzonderlijk laag
tempo. En dat magere budget gaat volledig op aan het opnieuw ophalen van de 5 pagina's
die het al kent. De andere 14 komen simpelweg nooit aan de beurt.

Vandaar de vlakke lijn op 5/14 sinds 16 mei. Het is geen oordeel — het is een wachtrij
die nooit vordert.

---

## 2. Twee mogelijke oorzaken, en één test die ze uit elkaar haalt

Waarom is dat crawlbudget zo laag? Er zijn twee verklaringen en ze sluiten elkaar niet uit:

**A. Te weinig autoriteit.** Domein van 6 maanden oud, vrijwel zeker nauwelijks externe
links. Google plant crawls grotendeels op basis van linksignalen. Weinig links → weinig
crawl.

**B. Lage voorspelde waarde.** Google besluit vooraf dat het de moeite niet loont om
pagina 6 t/m 20 op te halen, omdat de eerste 5 al laten zien wat de site te bieden heeft.
Dit sluit aan bij de dunne, gedeelde woordenschat die ik eerder mat.

Eén nuance die richting A wijst: je 5 geïndexeerde pagina's **presteren gewoon goed**.
826 klikken, 3.065 vertoningen op "bouwdepot berekenen", positie ~11. Als Google de site
inhoudelijk waardeloos vond, zou dat niet zo zijn. De content die Google kent, doet het
prima.

### De test die het antwoord geeft — en die je vandaag kunt doen

Search Console → **URL-inspectie** → plak een URL → **"Indexering aanvragen"**.

Dat omzeilt het crawlbudget volledig; je zet de pagina met de hand vooraan in de rij.
Quotum is ongeveer 10–15 per dag, dus de 14 pagina's kosten je twee dagen en in totaal
zo'n 20 minuten werk.

Binnen een week weet je welk probleem je hebt:

| Uitkomst na indexering aanvragen | Betekenis | Wat je dan doet |
|---|---|---|
| Pagina's worden **geïndexeerd** | Het was crawlbudget (A) | Autoriteit opbouwen — §4 fase 2 |
| **"Gecrawld — momenteel niet geïndexeerd"** | Kwaliteitsoordeel (B) | De dataset is verplicht — §4 fase 3 |

> Dit is de goedkoopste en meest informatieve actie die je kunt doen, en het is niet
> ondenkbaar dat het nooit gebeurd is. Doe dit eerst, vóór al het andere.

---

## 3. Correcties op mijn eerdere analyses

Voor de volledigheid, drie dingen die ik onderweg verkeerd had:

- **Identiteit is niet de blokkade.** Jij had gelijk: eudebtmap is goedgekeurd zonder
  volledige naam en zonder KvK. Toch doen (gratis vertrouwen), maar het houdt je niet tegen.
- **Publiek is geen probleem.** 826 klikken in 3 maanden is ruim voldoende.
- **De dichtgeklapte accordeons zijn niet de trigger.** De indexeringsgrafiek staat vlak
  sinds 16 mei, ruim vóór die commit. Wel repareren, maar het is bijzaak.

En nu ook: **"Google heeft je content beoordeeld en afgekeurd" was te stellig.** Google
heeft 14 van je pagina's nooit gezien. Dat is een aanzienlijk beter uitgangspunt.

---

## 4. Plan

### Fase 0 — Vandaag, 20 minuten

Indexering aanvragen voor alle 14 URL's via URL-inspectie:

```
adviesgesprek-checklist.html   bouwdepot-fouten.html
bouwrente-nieuwbouw.html       calculators.html
contact.html                   cookies.html
dubbele-lasten-nieuwbouw.html  hypotheekrenteaftrek-gids.html
maandlasten-bouwdepot.html     methodologie.html
over-ons.html                  privacy.html
renteverlies-bouwdepot.html    voorwaarden.html
```

Doe eerst de inhoudelijke pagina's (calculators, maandlasten, bouwrente,
dubbele-lasten, renteverlies, hypotheekrenteaftrek-gids, bouwdepot-fouten,
adviesgesprek-checklist), daarna de juridische. Noteer de datum — over een week kijk je
terug welke status ze kregen.

### Fase 1 — Week 1, ongeveer een dag

Technische hygiëne. Kleine dingen, maar ze moeten kloppen vóór je opnieuw aanvraagt.

- Accordeons openklappen. Nu zit **44%** van de homepagetekst en **37%** van
  `maandlasten-bouwdepot` achter dichte `<details>`. Terug naar `<section>`; alleen
  echte FAQ mag ingeklapt blijven.
- AdSense-snippet toevoegen aan de 9 pagina's waar het ontbreekt: `over-ons`, `contact`,
  `privacy`, `cookies`, `voorwaarden`, `methodologie`, `hypotheekrenteaftrek-gids`,
  `bouwdepot-fouten`, `adviesgesprek-checklist`.
- `<lastmod>` toevoegen aan `sitemap.xml` — geeft Google een crawlreden per URL.
- Volledige naam + woonplaats toevoegen.
- `info@bouwdepotcalculator.nl` in plaats van `firenature23@gmail.com` (9 voorkomens in
  6 bestanden). Gratis bij TransIP.
- "Persoonlijk hobbyproject" uit `over-ons.html`; die disclaimer hoort in `voorwaarden.html`.
- Controleren of de Google CMP-dialoog echt laadt voor EU-bezoekers.

### Fase 2 — Week 1–3: autoriteit (alleen als fase 0 uitwijst dat het crawlbudget is)

Het crawlbudget stijgt met externe signalen. Een handvol echte links is al genoeg om
uit de uithongering te komen.

- Bing Webmaster Tools aanmelden (5 minuten, extra crawlsignaal)
- Site aanmelden bij relevante NL-verzamelplaatsen voor verbouw- en woningtools
- Inhoudelijk bijdragen waar de doelgroep zit — Tweakers (Financiële zaken), Bouwinfo,
  verbouwgroepen, r/geldzaken — met je rekentool of tabel als bron. Alleen waar het een
  vraag echt beantwoordt.
- Vanaf eudebtmap linken naar bouwdepotcalculator (en andersom): je hebt zelf een
  goedgekeurd, geïndexeerd domein liggen. Gratis en direct.

### Fase 3 — Week 2–5: de dataset (nodig voor AdSense, hoe fase 0 ook uitpakt)

Ook als alle 19 pagina's geïndexeerd raken, blijft de AdSense-beoordeling een aparte
kwaliteitstoets. Daarvoor is nodig wat eudebtmap wél heeft en deze site niet: **pagina's
die eigen data dragen in plaats van een herformulering van hetzelfde concept.**

Ter herinnering waarom eudebtmap werd goedgekeurd: 201 URL's, 27 landen × 4 talen, en
elke landpagina bevat Eurostat-cijfers die alleen daar staan. Ook zonder naam of KvK.
De data draagt het vertrouwen.

**Het bouwdepot-equivalent: voorwaarden per geldverstrekker.** Circa 15 aanbieders
(ABN AMRO, Rabobank, ING, Munt, NN, Florius, ASR, Obvion, Aegon, BLG, Regiobank, Vista,
Tulp, Attens, Lloyds) tegen ~8 kolommen:

| Kolom | Waarom dit onderscheidend is |
|---|---|
| Geldigheidsduur (verbouw / nieuwbouw) | 12 tot 36 maanden, sterk wisselend |
| Depotvergoeding | vaak gelijk aan de hypotheekrente, maar niet altijd |
| Facturen, of ook kasbonnen | grote praktische impact |
| Minimum declaratiebedrag | € 0 tot € 2.500 — bepaalt je hele werkwijze |
| Eigen arbeid toegestaan | groot verschil per bank |
| Wat gebeurt er met het restant | aflossen, uitkeren of keuze |
| Doorlooptijd uitbetaling | 5 tot 20 werkdagen |
| Verlengen mogelijk + kosten | vrijwel nergens vermeld |

Eén hubpagina met een sorteerbare vergelijkingstabel plus 15 aanbiederpagina's. Elke cel
met bronlink naar de officiële voorwaarden en een controledatum.

Niemand in Nederland heeft dit op één plek. Dat is precies waarom het werkt: het is
origineel, verifieerbaar, en het beantwoordt een echte vraag ("welke bank past bij mijn
verbouwing") die nu nergens goed beantwoord wordt. Dat het ook je AdSense-probleem
oplost, is bijvangst.

**Secundair, ná het bankenproject:** bedragpagina's op bewezen vraag. `wat kost een
bouwdepot van 50000` en `van 30.000 euro` hebben samen 342 vertoningen in je data. Een
set per bedrag (€ 10k tot € 100k) is legitiem — **mits elke pagina een echte voorberekende
tabel draagt** (maandlast bij 5 rentestanden × 2 hypotheekvormen × 3 looptijden) plus
bedragspecifieke uitleg. Verwissel je alleen getallen, dan zijn het doorway pages en
maak je het erger.

### Fase 4 — Opnieuw aanvragen

Criterium: **20+ geïndexeerde pagina's** in Search Console. Niet eerder indienen.

---

## 5. Waarom je nu niet meer hoeft te gokken

De grootste winst van deze data: je hebt een dagelijks scorebord.

> Indexeert Google Search je pagina's, dan vindt het kwaliteitsalgoritme ze de moeite
> waard. AdSense leunt op dezelfde signalen. Indexatie is je gratis voorspelling van de
> AdSense-uitkomst.

Zolang je op 5 geïndexeerde pagina's staat gaat AdSense niet goedkeuren, hoeveel
juridische pagina's of schema markup je ook toevoegt. Sta je op 20+, dan wordt het een
formaliteit.

**Doorlooptijd:** afhankelijk van wat fase 0 uitwijst.

| Uitkomst fase 0 | Verwachte doorlooptijd |
|---|---|
| Pagina's raken geïndexeerd → crawlbudget | 2 tot 4 weken |
| "Gecrawld, niet geïndexeerd" → kwaliteit | 5 tot 8 weken (fase 3 is dan verplicht) |

---

## 6. Wat ik nog van je wil weten

1. **Search Console → Links.** Hoeveel externe links heeft de site, en vanaf welke
   domeinen? Dit toetst hypothese A rechtstreeks. Verwachting: bijna niets.
2. **Heb je ooit "Indexering aanvragen" gebruikt** voor deze pagina's?
3. **Datum van de laatste AdSense-afwijzing**, en hoe vaak je een beoordeling hebt aangevraagd.
4. **Hoeveel tijd per week** heb je beschikbaar? Dat bepaalt het tempo van fase 3.

Meld hoe dan ook over ongeveer een week terug wat er met die 14 URL's is gebeurd. Dat is
het scharnierpunt van het hele plan.
