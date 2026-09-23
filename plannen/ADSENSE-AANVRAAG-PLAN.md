# Plan: opnieuw aanvragen bij AdSense

**Datum:** 22 september 2026
**Onderbouwing:** [MARKT-EN-ADSENSE-ONDERZOEK.md](MARKT-EN-ADSENSE-ONDERZOEK.md)
**Doorlooptijd:** elf werkdagen, daarna indienen

> Dit is een uitvoeringsplan, geen analyse. Elk blok heeft een eigen
> acceptatiecriterium. Kom je er niet doorheen, dan dien je niet in — een
> aanvraag zonder wezenlijke verandering kost je een beoordelingsronde.

---

## 1. Het criterium

Niet "genoeg pagina's" en niet "genoeg woorden". Eén toets:

> **Kan elke overgebleven pagina uitleggen welke zoekopdracht hij bedient en
> waarom hij die verdient te winnen?**

Nu kan dat voor twee van de 31 pagina's. Na dit plan voor alle 23.

De onderbouwing staat in het onderzoek, maar de kern in één zin: Google hanteert
het uitgangspunt dat losse pagina's het kwaliteitsgemiddelde van het domein
erven. Negenentwintig pagina's met samen 33 klikken trekken dus ook de goede
pagina's omlaag. **Daarom ruimen we op in plaats van bij te bouwen.**

---

## 2. Wat Google feitelijk beoordeelt

Uit de primaire bronnen, als afvinklijst:

| Eis | Bron | Nu |
|---|---|---|
| Originele content van hoge kwaliteit | Deelnamevereisten | deels |
| **Er bestaat een doelgroep voor** | Deelnamevereisten | 29 pagina's: nee |
| Makkelijke, gebruiksvriendelijke navigatie | Sitegereedheid | ja |
| Unieke, interessante content per pagina | Sitegereedheid | 8 bankpagina's: nee |
| Overweeg een reactiemogelijkheid | Sitegereedheid | **nee** |
| Geen doorway-achtige, sterk gelijkende pagina's | Spambeleid | risico |
| Geen ongeorigineel op schaal | Spambeleid | risico |
| Gecertificeerde CMP voor de EER | AdSense CMP-eis | **ja, in orde** |
| `ads.txt` correct | AdSense | **ja** |
| Snippet op alle pagina's | AdSense | **ja, 32/32** |

De onderste drie zijn al goed. De rest is dit plan.

---

## 3. Blok A — Identiteit en vertrouwen

**Dag 1 · ongeveer twee uur · blokkeert niets anders**

Dit staat open sinds 14 augustus. Op een site over hypotheeklasten is een
privé-gmailadres als enig contactpunt een concreet vertrouwensgat, en twee van
die vermeldingen staan in structured data die Google rechtstreeks uitleest.

| Taak | Waar | Wie |
|---|---|---|
| `info@bouwdepotcalculator.nl` aanmaken | TransIP, gratis bij het domein | **jij** |
| Adres vervangen, 6 voorkomens | `contact.html` (3×, waarvan 2 in JSON-LD), `over-ons.html` (1×, JSON-LD), `privacy.html` (2×) | ik |
| Achternaam toevoegen | `over-ons`, `contact`, `privacy` én de `Person`-schema die nu `"name": "Simeon"` zegt | ik, na jouw akkoord |
| KvK-nummer tonen, als je er een hebt | `over-ons`, `voorwaarden` | **jij beslist** |
| Reactiemogelijkheid per pagina | één regel onderaan elke inhoudelijke pagina: *"Klopt hier iets niet?"* met `mailto:` en de paginanaam in het onderwerp | ik |

Die laatste is klein maar staat letterlijk in Google's eigen sitegereedheidspagina
als aanbeveling. Het past bovendien bij wat de site al is: het
Rabobank-signaal uit [signalen.md](../customers/signalen.md) kwam van een
bezoeker die een fout meldde. Dit maakt dat kanaal zichtbaar in plaats van
verstopt op de contactpagina.

**Acceptatie:** geen enkel gmailadres meer in de HTML of de structured data; op
elke inhoudelijke pagina staat een zichtbare meldmogelijkheid.

---

## 4. Blok B — Het paginabestand halveren

**Dag 2 tot en met 5 · het zwaarste AdSense-signaal**

Negen samenvoegingen. Per stuk: de unieke inhoud als sectie in de doelpagina
plaatsen, de oude URL 301'en in [vercel.json](../vercel.json), de ingang uit
`vite.config.js` halen, de `<url>` uit `public/sitemap.xml` halen, en de interne
links omleggen.

| Wordt opgenomen in | Vert. | Doelpagina | Resultaat |
|---|---:|---|---|
| `bouwrente-nieuwbouw` | 275 | `nieuwbouw.html` | één nieuwbouwpagina van ±2.750 woorden mét de tool; het cluster telt samen ±2.700 vertoningen en heeft géén rekenconcurrent |
| `dubbele-lasten-nieuwbouw` | 76 | ↑ | |
| `renteverlies-bouwdepot` | 29 | ↑ | |
| `leenruimte` | 41 | `verbouwbegroting.html` | "wat kost het → kan ik het lenen" is één reis; stond al zo in [CONCURRENTIE-EN-OORDEEL.md](CONCURRENTIE-EN-OORDEEL.md) §5 |
| `belasting` | 98 | `hypotheekrenteaftrek-gids.html` | twee fiscale pagina's met samen nul klikken worden er één van ±1.460 woorden |
| `kennisbank` | 135 | `stappenplan.html` | de complete gids: wat het is, het traject, de fouten, het gesprek. ±3.550 woorden op de pagina met de op twee na hoogste vertoningen (896) |
| `bouwdepot-fouten` | 14 | ↑ | |
| `adviesgesprek-checklist` | 21 | ↑ | |
| `maandlasten-bouwdepot` | 458 | `bouwdepot-berekenen.html` | bijna-duplicaten; **richting is jouw keuze**, zie §8 |

**31 → 23 pagina's.** Daarvan 17 inhoudelijk, 6 juridisch/over.

Eén commit per samenvoeging, zodat je elke stap los kunt beoordelen en
terugdraaien.

**Acceptatie:** `npm run build` slaagt, geen interne link wijst naar een
verdwenen pagina (het auditscript controleert dit), elke verdwenen URL geeft een
301 naar zijn doel, en de sitemap telt 23 URL's.

**Risico en waarom het klein is:** je verliest geen rankings, want 301's dragen
ze over, en de samengevoegde pagina's staan op positie 25 tot 60 — daar valt
weinig te verliezen en veel te winnen door het signaal te bundelen.

---

## 5. Blok C — De acht aanbiederpagina's

**Dag 6 tot en met 9 · het tweede signaal**

Deze pagina's zijn voor 25 tot 39% uniek, tegen 78 tot 95% voor de redactionele.
Dat is het profiel dat het spambeleid *scaled content* noemt. Tegelijk hebben ze
de op één na beste CTR van de site (5,2%) en worden ze door AI geciteerd. Ze
moeten dus niet weg — ze moeten af.

De ingreep: **elke bankpagina krijgt een doorgerekend voorbeeld op basis van de
vergoedingsregel van díe aanbieder.** Geen tekst erbij, een berekening erbij.

Obvion bijvoorbeeld publiceert dat de Woon Hypotheek de volle hypotheekrente
vergoedt gedurende 12 maanden bij bestaande bouw en 24 bij nieuwbouw, en dat
Basis, Compact en Obvion Hypotheek 1% lager zitten met 24 maanden in beide
gevallen. Dat staat er nu als één zin. Het hoort er te staan als: bij een depot
van € 25.000 en 3,8% rente betaalt u dit, ontvangt u dat, en houdt u per
hypotheekvorm deze netto last over — met het verschil tussen de twee vormen
expliciet.

Dat is per aanbieder anders, want de regel is per aanbieder anders. Het is
bovendien **code op data die er al staat**, geen nieuw bronwerk en geen
telefoontjes.

Wat het oplevert: elke pagina krijgt tientallen regels die nergens anders kunnen
staan, en het beantwoordt de vraag waarmee bezoekers binnenkomen — "wat kost dit
bij mijn bank".

**Acceptatie:** elke aanbiederpagina boven 55% uniek, gemeten met hetzelfde
vijfwoordsscript als in het onderzoek. `tests/nuance.test.mjs` blijft groen.

**Wat we hier níet doen:** de lege cellen invullen. Die blijven "niet
gepubliceerd" tot je het bij de bron navraagt. En we gaan niet naar 15
aanbieders — breder worden terwijl elke pagina dun is, vermenigvuldigt precies
het signaal dat we wegnemen.

---

## 6. Blok D — De data actueel maken

**Dag 10 · ongeveer een halve dag**

Nieuwste controledatum in `data/bouwdepot-voorwaarden.json` is **19 augustus —
34 dagen oud**. Het hele waardevoorstel van deze site is "met bron en
controledatum". Een beoordelaar die de vergelijkingspagina opent en overal een
datum van vijf weken terug ziet, ziet een project dat stilstaat.

1. `npm run check:voorwaarden` draaien — die vergelijkt de bronpagina's met
   `data/bronnen-snapshot.json` en meldt wat er veranderd is
2. Gewijzigde waarden handmatig verifiëren bij de bron, met nieuwe controledatum
3. Ongewijzigde waarden alleen de controledatum verversen
4. `npm run build:voorwaarden` en `npm test`

**Acceptatie:** geen controledatum ouder dan zeven dagen bij indiening.

**Dit is structureel, niet eenmalig.** Zet er een terugkerende taak op — elke
maand — anders staat hier over vijf weken hetzelfde.

---

## 7. Blok E — Eindcontrole en indienen

**Dag 11**

Vóór je op indienen drukt, deze lijst af, en bij elk "nee" niet indienen:

- [ ] Elke pagina beantwoordt de toets uit §1
- [ ] 23 pagina's, sitemap klopt, alle `lastmod` bijgewerkt
- [ ] `npm test` groen, `npm run build` slaagt
- [ ] Auditscript: geen dubbele titels, descriptions, canonicals; geen kapotte interne links
- [ ] Geen gmailadres meer, ook niet in structured data
- [ ] Achternaam zichtbaar op over-ons, contact, privacy én in de `Person`-schema
- [ ] Meldmogelijkheid op elke inhoudelijke pagina
- [ ] Elke aanbiederpagina boven 55% uniek
- [ ] Geen controledatum ouder dan zeven dagen
- [ ] CMP-dialoog laadt, getest in een privévenster
- [ ] `ads.txt` bereikbaar, snippet op alle 23 pagina's
- [ ] Site handmatig doorlopen op 375px én 1440px
- [ ] Geen handmatige maatregel in Search Console (was schoon op 22-09)

Daarna indienen. Beoordeling duurt doorgaans enkele dagen tot enkele weken.

**Tijdens het wachten niets aan de site veranderen** wat de structuur raakt. Wel
doorgaan met blok F hieronder.

---

## 8. Beslissingen die ik van jou nodig heb

Drie, en twee ervan blokkeren dag 1.

1. **Mag je volledige naam op de site?** Het is de goedkoopste
   vertrouwensverbetering die er is, en Google leest hem uit de `Person`-schema.
   Maar het is jouw naam, dus jouw keuze. Zo niet, dan doen we blok A zonder en
   accepteren we dat gat.
2. **Heb je een KvK-inschrijving?** Zo ja, tonen. Zo nee, dan laten we het weg —
   niet verzinnen. (Het onderzoek naar de vorige afwijzing concludeerde al dat
   dit geen blokkade is: eudebtmap werd goedgekeurd zonder.)
3. **`maandlasten-bouwdepot` of `bouwdepot-berekenen` als blijver?** De
   vertoningen zeggen de eerste (458 tegen 181), de nieuwere ontwerptaal zegt de
   tweede. Ik neig naar `bouwdepot-berekenen` als URL met de inhoud van beide,
   omdat de naam beter aansluit op de winnende zoekopdracht — maar 458
   vertoningen weggooien is niet niks, ook al leveren ze één klik op.

---

## 9. Blok F — Wat er ondertussen moet gebeuren

Los van AdSense, want dit is het werk dat er wél toe doet.

**Events op de calculators.** Twintig regels, geen nieuwe afhankelijkheid.
`window.va` staat al op elke pagina en wordt nergens aangeroepen. Je hebt 1.390
bezoekers gehad op een site die uit rekenmachines bestaat en je weet niet of er
één een berekening heeft afgemaakt. Dit kan tijdens het wachten.

**De vier ontbrekende invoervelden van BerekenHet** in `nieuwbouw.html`: soort
meerwerk, periode vóór bouwstart, tweede hypotheekdeel, korting op de
depotrente. Zonder die vier klopt de uitkomst niet voor wie meerwerk heeft.

---

## 10. Als het weer misgaat

Dan is dat geen ramp en ook geen reden om door te gaan met optimaliseren.

Uit het onderzoek: het plafond van AdSense op dit domein is **€ 50 tot € 150 per
maand** bij volledige dominantie van het onderwerp, en de markt groeit niet.
Spreek daarom nu een grens af: **nog twee aanvragen, daarna stoppen met er werk
voor te doen.** Display-advertenties worden dan een meevaller als ze ooit komen,
geen voorwaarde.

Wat dan overblijft is wat sowieso al de moeite waard is: een domein dat eerste
staat op "bouwdepot berekenen" boven Rabobank, ING en Independer, met verkeer
dat het afgelopen kwartaal twee derde van alles binnenhaalde wat de site ooit
had. Dat is het bezit. AdSense is er hooguit een bijproduct van.

---

## 11. Wat we bewust níet doen

Voor de duidelijkheid, want elk van deze vier is een voor de hand liggende
verleiding en ze maken het allemaal erger:

- **Geen pagina's bijbouwen.** Een nieuwe pagina erft het domeingemiddelde.
- **Geen tekst opvullen.** Woordaantal voorspelt niets: `renteverlies` heeft 893
  woorden en 29 vertoningen.
- **De AI-vermelding in `over-ons.html` blijft staan.** AI-gebruik is geen
  overtreding; *zonder waarde toevoegen* is de overtreding. We lossen het tweede
  op en verzwijgen het eerste niet.
- **Geen schattingen in lege datacellen.** "Niet gepubliceerd" blijft.
