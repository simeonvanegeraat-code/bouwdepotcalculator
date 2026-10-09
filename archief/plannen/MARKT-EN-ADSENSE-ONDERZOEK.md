# Markt, concurrentie en AdSense: het volledige onderzoek

**Datum:** 22 september 2026
**Aanleiding:** tweede AdSense-afwijzing, opnieuw "content van weinig waarde"
**Vervangt:** [ADSENSE-PLAN.md](ADSENSE-PLAN.md), waarvan de kernaanname weerlegd is

> Alles hieronder is gemeten of geciteerd uit een primaire bron. Waar ik schat,
> staat het er expliciet bij, met de methode. Wat we niet weten staat in §9.

---

## 1. Het oordeel in vijf regels

De site is technisch foutloos, heeft geen strafmaatregel, en staat **eerste op
zijn belangrijkste zoekopdracht** — boven Rabobank, ING, ABN AMRO, Independer en
De Hypotheker. Dat is een uitzonderlijk bezit voor een domein van zeven maanden.

En tegelijk: **29 van de 31 geïndexeerde pagina's leveren samen 33 klikken in
zeven maanden.** Dat is wat Google "content van weinig waarde" noemt. Niet omdat
die pagina's slecht geschreven zijn, maar omdat ze geen zoekopdracht hebben die
ze kunnen winnen.

De AdSense-afwijzing en het SEO-probleem zijn hetzelfde probleem. En het
verdienmodel waar dit alles voor gebeurt heeft een plafond van ongeveer
**€ 50 tot € 150 per maand**. Dat laatste is de belangrijkste uitkomst van dit
onderzoek.

---

## 2. Wat AdSense werkelijk beoordeelt

Geciteerd uit de officiële documentatie, niet uit blogs.

### De deelnamevereisten

> "Uw content moet origineel en van hoge kwaliteit zijn. Bovendien moet er een
> doelgroep voor bestaan."
> — [Deelnamevereisten voor AdSense](https://support.google.com/adsense/answer/9724?hl=nl)

Die laatste zin wordt vaak over het hoofd gezien. **Er moet een doelgroep
bestaan** — meetbaar. Bij 29 pagina's met samen 33 klikken is die doelgroep voor
die pagina's aantoonbaar afwezig.

### De sitegereedheidspagina

Drie vragen, waarvan er één relevant is en één een aanwijzing geeft die we niet
gebruiken:

> "Overweeg bezoekers een reactiemogelijkheid te bieden."
> — [Pagina's klaar voor AdSense](https://support.google.com/adsense/answer/7299563?hl=nl)

Google noemt een feedbackmogelijkheid expliciet. Wij hebben een contactpagina,
geen feedback op de pagina zelf. Klein, maar het staat er letterlijk.

Diezelfde pagina verwijst door naar het spambeleid van Google Zoeken. Dát is het
document waar het oordeel vandaan komt.

### Het spambeleid — de twee regels die ons raken

**Doorway abuse:**

> "Creating substantially similar pages that are closer to search results than a
> clearly defined, browseable hierarchy"

**Scaled content abuse:**

> "Scaled content abuse is when many pages are generated for the primary purpose
> of manipulating search rankings and not helping users. This abusive practice is
> typically focused on creating large amounts of unoriginal content that provides
> little to no value to users, **no matter how it's created**."

En, als eerste voorbeeld in die lijst:

> "Using generative AI tools or other similar tools to generate many pages
> without adding value for users"

Let op de nuance: AI-gebruik is niet de overtreding. *Zonder waarde toevoegen* is
de overtreding. [over-ons.html](../over-ons.html) vermeldt het AI-gebruik eerlijk
en dat moet zo blijven — maar in combinatie met acht aanbiederpagina's die voor
25 tot 39% uniek zijn, is dat optisch een ongelukkige combinatie.

### De zin die alles verklaart

> "Google generally applies a presumption that individual pages (including new
> pages) match the overall quality of other pages on the domain."
> — [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

*Contextnuance: deze zin staat in de paragraaf over het site reputation-beleid,
dus hij is niet bedoeld als algemene regel. Maar het principe dat hij beschrijft
— een domeinbreed kwaliteitsoordeel dat op losse pagina's drukt — is precies wat
onze cijfers laten zien.*

Als dat principe hier geldt, dan volgt er iets belangrijks uit: **een nieuwe
goede pagina erft het gemiddelde van de 29 zwakke.** Dat is het mechanisme
waarom bijbouwen niet werkt en opruimen wel.

---

## 3. De huidige staat, gemeten

### Search Console, 10 februari – 19 september 2026

| Maat | 12 maanden | Laatste 3 maanden |
|---|---:|---:|
| Klikken | 1.390 | 935 |
| Vertoningen | 39.500 | 25.400 |
| CTR | 3,5% | 3,7% |
| Gemiddelde positie | 13,3 | 12,4 |

**Twee derde van al het verkeer ooit kwam in het laatste kwartaal.** De site
groeit hard. Dat is de belangrijkste positieve bevinding en die is in het vorige
plan nooit opgemerkt.

### De verdeling per pagina — de kern van het probleem

| Pagina | Klikken | Vertoningen |
|---|---:|---:|
| `/` | **1.284** | 31.954 |
| `nieuwbouw.html` | 79 | 5.922 |
| *29 overige pagina's samen* | **33** | 4.523 |

De homepage haalt 92% van alle klikken. Tien pagina's staan op precies nul
klikken, waaronder `kennisbank` (135 vertoningen), `belasting` (98),
`leenruimte` (41) en `renteverlies-bouwdepot` (29 — en dat is met 893 woorden
een van de langste pagina's van de site).

**Woordaantal voorspelt niets.** `bouwrente-nieuwbouw` heeft 518 woorden en 275
vertoningen; `renteverlies` heeft 893 woorden en 29. Het gaat niet om lengte.

### Indexering

31 geïndexeerd, 11 niet. Van die 11: zes omleidingen, vier canonieke
alternatieven, één "gecrawld, niet geïndexeerd". Dat is een gezond beeld. **Het
indexeringsprobleem uit het vorige plan is volledig opgelost** — en het bleek
niet de oorzaak.

### Handmatige maatregelen

**Geen.** De site is niet gestraft. Hij rankt alleen niet.

### Core Web Vitals

*"Niet voldoende gebruiksgegevens in de afgelopen 90 dagen"* — voor mobiel én
desktop. Er is te weinig echt verkeer om gemeten te worden. Snelheid is dus geen
bekend probleem, maar ook geen bewezen sterkte.

### AI-verkeer

**9.360 vertoningen in AI-functies over drie maanden — 37% van alle
vertoningen.** De homepage pakt 8.539 daarvan. Maar ook de datapagina's
verschijnen er: Obvion 75, Rabobank 65, de vergelijkingstabel 55, Florius 38,
ING 32.

Dat is betekenisvol. **Je databestand wordt door AI geciteerd terwijl mensen er
niet op klikken.** De gedateerde, bronvermelde opzet is precies wat
AI-systemen waarderen. Het levert alleen geen inkomsten op, en het aandeel
groeit.

### Technische controle — foutloos

Alle 32 pagina's doorgelicht op: dubbele titels, dubbele descriptions, dubbele
canonicals, aantal `h1`-elementen, `lang`-attribuut, og-tags, structured data,
ontbrekende `alt`, en interne links naar niet-bestaande pagina's.

**Nul bevindingen.** Titels 43–60 tekens en uniek. Structured data met
`Organization`, `Person`, `Article`, `BreadcrumbList`, `WebSite`, `ContactPoint`.
76 tests groen, werkmap schoon.

Dit is beter uitgevoerd dan de meeste goedgekeurde AdSense-sites. **De afwijzing
is met zekerheid niet technisch.**

---

## 4. Wat er wél misgaat, op volgorde van zwaarte

### 4.1 De acht aanbiederpagina's — 25 tot 39% uniek

Gemeten met reeksen van vijf woorden, vergeleken met alle andere pagina's:

| Pagina | Uniek | Woorden |
|---|---:|---:|
| `bouwdepot-obvion` | **28%** | 498 |
| `bouwdepot-florius` | 25% | 656 |
| `bouwdepot-munt` | 30% | 606 |
| `bouwdepot-abn-amro` | 29% | 694 |
| `bouwdepot-sns` | 31% | 639 |
| `bouwdepot-nn` | 31% | 634 |
| `bouwdepot-ing` | 33% | 756 |
| `bouwdepot-rabobank` | 39% | 602 |
| *redactionele pagina's ter vergelijking* | *78–95%* | |

Obvion heeft ongeveer 140 woorden die alleen daar bestaan, en **tien regels die
"niet gepubliceerd" zeggen**. Sitebreed staat die tekst 42 keer op de
vergelijkingspagina.

De regel "niets gepubliceerd → geen schatting" is juist en blijft. Maar een cel
die "niet gepubliceerd" zegt is eerlijk én leeg. Voor een beoordelaar leest het
als een onaf werkblad.

**Tegelijk:** deze pagina's hebben de op één na beste CTR van de site (5,2%) en
worden door AI geciteerd. Ze zijn niet waardeloos — ze zijn onaf.

### 4.2 De 29 onzichtbare pagina's

Zie §3. Dit is het zwaarste AdSense-signaal en tegelijk het goedkoopst op te
lossen, omdat samenvoegen sneller is dan verbeteren.

### 4.3 Identiteit — onopgelost sinds 14 augustus

- [contact.html](../contact.html) noemt `firenature23@gmail.com` als enig
  contactpunt
- De `Person`-schema die Google rechtstreeks uitleest zegt `"name": "Simeon"` —
  geen achternaam
- Geen KvK-nummer

Fase 1 van het vorige plan zette dit op de lijst. Vijf weken later staat het er
nog. Op een site over hypotheeklasten is dit een concreet vertrouwensgat, en het
kost een uur.

### 4.4 De data veroudert

Nieuwste controledatum in `bouwdepot-voorwaarden.json`: **19 augustus 2026 —
34 dagen geleden.** Het hele waardevoorstel is "met bron en controledatum". Een
controledatum van vijf weken oud ondermijnt precies dat, en er is een
`npm run check:voorwaarden` die hier niet routinematig voor draait.

### 4.5 Er wordt niets gemeten

Vercel Analytics staat op elke pagina:

```html
<script>window.va = window.va || function () { ... };</script>
```

En `va()` wordt **nergens in de codebase aangeroepen.** Geen enkel event.

Je hebt 1.390 bezoekers gehad op een site die uit rekenmachines bestaat, en je
weet niet of één van hen ooit een berekening heeft afgemaakt. Elke
productbeslissing tot nu toe is genomen op zoekdata, blind voor wat er op de
site zelf gebeurt.

### 4.6 De homepage draagt alles

92% van het verkeer op één URL. Dat is geen fout, maar het is een
concentratierisico: één algoritmewijziging op één zoekopdracht en het verkeer
halveert.

---

## 5. De markt, gemeten

### Omvang

Zoekvolume is alleen betrouwbaar te schatten voor zoekopdrachten waar de site op
pagina 1 staat — daar benadert het aantal vertoningen het werkelijke volume.

| Zoekopdracht | Positie | Geschat per maand |
|---|---:|---:|
| bouwdepot berekenen | 9,9 | 751 |
| bouwdepot berekenen online | 8,2 | 168 |
| maandlasten bouwdepot berekenen | 10,6 | 136 |
| kosten bouwdepot | 6,9 | 61 |
| wat kost een bouwdepot | 7,9 | 45 |
| overige pagina-1-termen | | 61 |
| **Kern-rekencluster** | | **≈ 1.222** |

De site pakt daar nu ongeveer **190 klikken per maand** van. Daarnaast liggen de
nieuwbouwclusters (dubbele lasten ≈ 1.727 vertoningen, bouwrente ≈ 1.008) die
nu op positie 25–60 staan; hun werkelijke volume is een veelvoud van wat we zien,
maar niet betrouwbaar te schatten vanaf die diepte.

**Realistisch totaal adresseerbaar: enkele duizenden zoekopdrachten per maand.**

### Richting

Google Trends, "bouwdepot", Nederland, vijf jaar: **vlak met seizoenspieken.**
Geen structurele groei, geen verval. De markt is volwassen.

Gevolg: groei moet uit marktaandeel komen, niet uit de markt.

### Wat dat betekent voor AdSense

*Schatting, met de aannames erbij:*

| Scenario | Bezoeken/maand | Bij RPM € 10–20 |
|---|---:|---:|
| Nu | ≈ 310 | € 5 – 12 |
| Kerncluster gewonnen | ≈ 700 | € 12 – 30 |
| Volledige dominantie | 2.000 – 4.000 | **€ 50 – 150** |

Dat is het plafond. Niet door slechte uitvoering, maar door de omvang van het
onderwerp. **AdSense kan op dit domein nooit inkomen worden.**

---

## 6. De concurrentie

### BerekenHet.nl — de rekenkant

Gemeten op 22 september 2026, van hun eigen pagina:

- **26 jaar oud**, **314 rekentools**, **25 miljoen berekeningen per jaar**
- 60 rekentools alleen al voor Hypotheek & Wonen
- Advertentiestack met **210 partners**

Hun tool *Hypotheek maandlasten tijdens de bouw* vraagt om: grondprijs, direct
betaalbare bouwkosten, resterende aanneemsom, meerwerk, **soort meerwerk**
(vier categorieën), **periode vóór bouwstart**, resterende bouwduur,
hypotheekvorm, lening met rente, **optioneel een tweede hypotheekdeel met eigen
rente**, en korting op de depotrente. Ze rekenen maandlast, gemiddelde én
renteverlies.

Onze `nieuwbouw.html` vraagt: grond, aanneemsom, rente, afslag, bouwduur,
huidige woonlast. **We missen vier van hun invoervelden**, en precies die vier
bepalen of de uitkomst klopt voor iemand met meerwerk of een tweede leningdeel.

Maar: hun bouwtool heeft **zes beoordelingen**. Bij 25 miljoen berekeningen per
jaar is dat een zijpad voor hen. Dat is onze opening.

### De contentkant

Op `dubbele lasten nieuwbouw` (≈ 1.727 vertoningen) staan op pagina 1: Funda,
Vereniging Eigen Huis, IkBenFrits, Tweakers, Heijmans, Linck, ASN Bank, Knab.

**Acht resultaten. Geen enkele rekent iets uit.** En Google stelt er zelf
"voorbeeld berekening dubbele lasten nieuwbouw" bij voor.

Op `bouwrente berekenen` (≈ 1.008): Hypotheker, Van Bruggen, BerekenHet,
IkBenFrits, Independer. Twee daarvan rekenen.

### Waar we staan

Op `bouwdepot berekenen` staat de site **eerste**, met positie 2,7 over de
laatste zeven dagen. Boven Rabobank, De Hypotheker, ABN AMRO, ING, Viisi en
Independer.

### De conclusie uit deze drie observaties

**De site wint waar hij rekent en verliest waar hij schrijft.** Tegen Funda en
Vereniging Eigen Huis win je geen artikel — dat kost jaren autoriteit. Tegen een
markt zonder rekenmachine win je met een rekenmachine.

---

## 7. Wat er moet gebeuren

Vier fasen met een poort ertussen. De poorten zijn het punt: na elke fase kun je
stoppen met wat je geleerd hebt.

### Fase 0 — Meten en beslissen (week 1, niets bouwen)

| Wat | Waarom |
|---|---|
| Events op de calculators | Zonder dit bouw je blind. Twintig regels, geen afhankelijkheid |
| Contactgegevens en achternaam, ook in de `Person`-schema | Open sinds 14 augustus, kost een uur |
| `npm run check:voorwaarden` draaien en de data bijwerken | 34 dagen oud ondermijnt het hele waardevoorstel |

**Beslissing van de eigenaar:** is dit een klein bezit, een bedrijf in opbouw, of
iets om te verkopen? Die drie vragen verschillende kwartalen.

### Fase 1 — Opruimen (week 1–2, getimeboxt)

Niet om een beoordelaar te plezieren, maar omdat deze pagina's aantoonbaar dood
zijn. Met 301-redirects; [vercel.json](../vercel.json) doet dit al voor drie
eerdere samenvoegingen.

| Samenvoegen | Vert. | Doel |
|---|---:|---|
| `bouwrente-nieuwbouw` | 275 | `nieuwbouw.html` |
| `dubbele-lasten-nieuwbouw` | 76 | `nieuwbouw.html` |
| `renteverlies-bouwdepot` | 29 | `nieuwbouw.html` |
| `leenruimte` | 41 | `verbouwbegroting.html` |
| `belasting` | 98 | `hypotheekrenteaftrek-gids` |
| `kennisbank` | 135 | `stappenplan.html` |
| `bouwdepot-fouten` | 14 | `stappenplan.html` |
| `adviesgesprek-checklist` | 21 | `stappenplan.html` |
| `maandlasten-bouwdepot` | 458 | `bouwdepot-berekenen` *(richting te kiezen)* |

**31 → 23 pagina's**, elk met een taak. Rankings gaan via 301 mee.

### Fase 2 — Eén test (week 2–7)

Neem het beste cluster — dubbele lasten: 1.727 vertoningen, positie 33,5, en
**twaalf plaatsen gestegen** in 90 dagen — en maak dat onderdeel van
`nieuwbouw.html` echt goed, met de vier ontbrekende invoervelden van BerekenHet.

**Poort na zes weken:** bewoog de positie? Dan is de stelling "de markt wil een
berekening" gevalideerd en schaal je hem. Bewoog hij niet, dan kostte die kennis
zes weken in plaats van een kwartaal.

### Fase 3 — De aanbiederpagina's (na de poort)

Elke bankpagina een eigen doorgerekend voorbeeld op basis van díe aanbieders
vergoedingsregel. Obvion's regel (Woon = hypotheekrente 12/24 mnd,
Basis/Compact = 1% lager, 24 mnd) is werkelijk onderscheidend en staat er nu als
één zin. Dit is code op data die er al is — geen telefoontjes.

Pas daarna uitbreiden naar 15 aanbieders. Breder gaan terwijl elke pagina dun is,
vermenigvuldigt het sjabloonsignaal.

### Fase 4 — Opnieuw aanvragen

Na fase 1 en 3. Criterium is niet een aantal pagina's maar: **kan elke
overgebleven pagina uitleggen welke zoekopdracht hij bedient?**

---

## 8. Wat dit níet oplost

AdSense keurt hierna misschien goed en misschien niet. De beoordeling is
deels ondoorzichtig en niemand kan hem garanderen — ik ook niet. Wat wel
vaststaat: de site is dan materieel anders op precies de as die Google benoemde.

En zelfs bij goedkeuring blijft het plafond € 50–150 per maand. **Besteed
hier weken aan, geen maanden.** Het echte werk zit in fase 2 en 3.

---

## 9. Wat we niet weten

Eerlijk, want dit bepaalt hoeveel de rest waard is.

1. **Of iemand de calculators gebruikt.** Geen events. Grootste blinde vlek.
2. **Het echte volume van de nieuwbouwclusters.** Vanaf positie 25–60 is dat niet
   te schatten. Google Keyword Planner is gratis bij een Ads-account en zou dit
   in een uur oplossen.
3. **Of de tool-stelling klopt.** Drie SERP's is een hypothese, geen bevinding.
   Fase 2 toetst hem.
4. **Waarom de homepage zo hard stijgt.** Positie 9,9 over 12 maanden naar 2,7
   over 7 dagen. Zonder te weten waaróm, weten we niet wat we moeten beschermen.
5. **Wat de site waard is bij verkoop.** Een domein op positie 1 voor
   "bouwdepot berekenen" is meer waard voor een partij die via leads mag
   verdienen dan voor ons met AdSense. Niet onderzocht.
