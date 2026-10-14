# Verbeterplan BouwdepotCalculator.nl

**Datum:** 11 oktober 2026, stand bijgewerkt op 13 oktober 2026
**Status:** goedgekeurd door de eigenaar op 11 oktober 2026
**Basis:** audit van de site, concurrentie-onderzoek, wijzigingsgeschiedenis van de bankdata en Search Console (9 juli t/m 8 oktober 2026)

Dit plan vervangt de volgorde in `ROADMAP.md` niet vanzelf. Die roadmap ging over de herbouw; dit plan gaat over wat daarna komt. Keurt de eigenaar dit plan goed, dan hoort de roadmap ernaar te verwijzen of te worden bijgewerkt, zodat er geen twee plannen naast elkaar bestaan.

**De volgorde ligt niet vast.** De fasen hieronder zijn een voorkeursvolgorde, geen afspraak. De eigenaar kiest per keer wat er gebouwd wordt, ook als dat buiten de volgorde of buiten het plan valt; dat is tot nu toe ook zo gegaan. Wat wel vaststaat: na elk stuk werk wordt de tabel hieronder bijgewerkt, zodat dit document blijft kloppen met de site. Werk dat niet in een fase past, komt onder "Buiten de fasen gebouwd".

## Stand op 13 oktober 2026

| Fase | Stand | Wat er nog ligt |
|---|---|---|
| 0. Meten en beschermen | Grotendeels klaar | De positie van de homepage op "bouwdepot berekenen" volgen tot 25 oktober (0.3) en de vier pagina's "gevonden, niet geïndexeerd" opzoeken (0.5). Beide bij de eigenaar |
| 1. "Bouwdepot berekenen" winnen | Klaar | Niets. 1.2 is vervallen: de homepage blijft zoals hij is; het voorstel blijft het noodplan als de positie zakt |
| 2. Nieuwbouw naar de eerste pagina | Grotendeels klaar | 2.1 is live als route in stappen (zie hieronder). Open: een uitgewerkt voorbeeld met bedragen (2.2) en de pagina's bouwrente en dubbele lasten laten doorverwijzen naar het hele plan (2.3). 2.4, het eigen verhaal, is door de eigenaar afgewezen |
| 3. "Hoeveel bouwdepot kan ik krijgen" | Open | Alles. Begint met de keuze van 3.2: eigen pagina of een sterker deel van de verbouwbegroting. `/leenruimte.html` komt nu direct bij de rekentool uit, zonder startscherm |
| 4. Vertrouwen | Deels | 4.3 is gedaan: de privacy- en cookiepagina noemen alle lokale opslag. Open: "Over ons" (4.1), de juridische vraag over naam en adres (4.2) en de voettekst (4.4) |
| 5. Bankdata beheersbaar houden | Open | Alles. De data is laatst met de hand gecontroleerd op 19 augustus 2026. De wekelijkse bronbewaking draait en commit zelf naar `main` |
| 6. Kwaliteit | Open | Alles. 6.1 en 6.5 wegen zwaarder dan toen het plan werd geschreven: de 3D-bouwplaats laadt nu ook op de telefoon (138 kB gezipt, na het tonen van de pagina) |
| 7. AdSense | Wacht | Pas opnieuw aanvragen als fase 1 en 2 geïndexeerd zijn en de klikken per dag aantoonbaar gestegen zijn |

### Wat er in fase 1 en 2 live staat

- **Rekenpagina:** bedragentabel met renteschuif en keuze annuïtair of lineair (1.3); de tekst onder de tool herschreven met vier gezochte vragen (1.4).
- **Nieuwbouw in stappen (2.1):** startscherm, vijf vragen, dan het overzicht. Meerwerk en meegefinancierde rente zitten in de stappen. Op het overzicht een samenvatting in plaats van het formulier, en "Nog te controleren" voor de depotrente en het termijnschema. Het termijnschema heeft een eigen scherm met percentages over de aanneemsom zonder meerwerk. Invoer blijft 90 dagen op het apparaat en kan als link worden gekopieerd.
- **Bouwplaats:** een 3D-scene die per stap meegroeit, ook op de telefoon.

### Buiten de fasen gebouwd

| Onderdeel | Stand |
|---|---|
| Verbouwroute in stappen | Live. Aanvinken wat je gaat doen, dan alleen daarvan de bedragen; daarna reserve, financiering en rente. De schermen komen uit `data/verbouwposten.json`. Met een getekende doorsnede van een huis |
| Excel-download | Live. Leeg begrotingstemplate, de ingevulde begroting en de maandtabel van nieuwbouw, gemaakt op het apparaat van de bezoeker (`src/js/xlsx.js`, zonder bibliotheek). In Excel nagerekend |
| Deelafbeelding | Live. Elke pagina deelt met `og-1200x630.png`; het vorige bestand was leeg |
| Toetsenbord op de telefoon | Live. Na een schermwissel opent het toetsenbord niet vanzelf; Enter gaat naar het volgende veld |
| Controle van de rekentools | Gedaan op 14 oktober: één situatie door alle rekenkernen. Ze spreken elkaar niet tegen; vastgelegd in `tests/consistentie.test.mjs`. Besluit: bouwrente en dubbele lasten blijven als losse ingang, renteverlies gaat later op in bouwdepot berekenen |
| Bouwdepot berekenen | Live op 14 oktober: een instelling voor een vergoeding die na een vast aantal maanden stopt (in de gedeelde rekenkern, dus ook beschikbaar voor nieuwbouw), "Nog te controleren", Excel en link kopiëren. Geen startscherm: wie via Google komt wil direct rekenen |
| Verbouwroute: tijdens de verbouwing | Klaar om live te gaan: de route vraagt de duur van de verbouwing en toont op het overzicht wat de extra lening per maand kost terwijl er verbouwd wordt, met dezelfde berekening als bouwdepot berekenen. De link naar bouwdepot berekenen neemt bedrag, rente en duur mee |
| Printoverzicht | Hersteld: het was op zes rekentools kapot sinds de ombouw |
| Schrijfregels | Vastgelegd in `CLAUDE.md`, sectie 9. Nog niet toegepast op de andere rekenpagina's |

### Geparkeerd

Op 13 oktober besproken en door de eigenaar geparkeerd tot de site zelf staat zoals gewenst: meer downloadbare templates. Voorkeur van Claude: een declaratielogboek voor de periode dat het depot loopt (per factuur ingediend en uitbetaald, restsaldo, eisen van de gekozen bank), daarna een meerwerklijst voor nieuwbouw, offertes vergelijken voor een verbouwing, en voorbeeldbrieven aan de bank. Gegenereerd bij de build met `src/js/xlsx.js`, zonder aparte pagina per template en zonder e-mailadres te vragen.

### Wat niet gecontroleerd is

Dit kon niet vanuit de ontwikkelomgeving en ligt bij de eigenaar: hoe de animaties bewegen (bouwplaats, huis, dak op het termijnschema), of de bouwplaats op een echte telefoon soepel loopt, of het toetsenbord daar dicht blijft, de kaart van een gedeelde link in WhatsApp en LinkedIn, en alles uit 6.2. Google ziet bij het renderen van nieuwbouw en verbouwen nu eerst het startscherm; beide pagina's trokken nauwelijks zoekverkeer, maar de positie is het volgen waard.

## 1. Waar we staan

| Gegeven | Stand |
|---|---|
| Klikken uit Google | 949 in drie maanden, ongeveer tien per dag, stabiel |
| Vertoningen | 27.100, gemiddelde positie 12,5 |
| Aandeel van de homepage | 823 van de 949 klikken (87%) |
| Belangrijkste zoekvraag | "bouwdepot berekenen": 282 klikken, positie 3,4 |
| Geïndexeerd | 32 pagina's; 14 niet (6 doorverwijzingen, 4 dubbele adressen, 4 nog niet opgehaald) |
| AdSense | Afgewezen op 10 september 2026: "Content van weinig waarde". `ads.txt` is geautoriseerd |
| Bezoekstatistieken | Geen. Vercel Web Analytics kost geld en blijft uit zolang de site niets oplevert; het script is op 11 oktober van de pagina's gehaald |
| Bankdata | 13 aanbieders, bestaat sinds 14 augustus; ongeveer één correctieronde per maand; 4 aanbieders niet automatisch te bewaken |

### Wat het onderzoek liet zien

1. **Mensen komen om te rekenen.** Zoekvragen over berekenen en kosten leveren 418 van de 483 klikken waarvan de zoekvraag bekend is.
2. **Nieuwbouw is de grootste onbenutte vraag.** 2.469 vertoningen, 6 klikken, gemiddelde positie 30. Bij de concurrentie vond ik geen tool die het maandverloop tijdens de bouw doorrekent.
3. **Mensen zoeken op bedragen.** "Wat kost een bouwdepot van 30.000 / 50.000 / 100.000 per maand": 804 vertoningen op positie 4.
4. **Bankvoorwaarden trekken geen verkeer.** Dertien aanbiederpagina's leveren samen 24 klikken. De bank zelf staat erboven.
5. **Algemene uitleg is er al genoeg.** Banken, adviesketens en gegenereerde blogs vullen de zoekresultaten met dezelfde tekst.
6. **Tien bezoekers per dag is te weinig** voor het doel van één euro per dag, bij welke advertentieopbrengst ook. Het verkeer moet een veelvoud worden.

### Het risico van dit moment

De homepage scoort op "bouwdepot berekenen", niet de pagina die zo heet (positie 17). De nieuwe homepage is op 9 oktober live gegaan en is een overzichtspagina met een korte rekensom, geen rekenmachine meer. De Search Console-cijfers lopen tot 8 oktober. Of de positie standhoudt is dus nog niet te zien.

## 2. Richting

**De site is de plek waar je uitrekent wat een bouwdepot je per maand kost, met nieuwbouw als specialiteit.** Bankgegevens maken de berekening preciezer; ze zijn geen doel op zich. Er komen geen algemene artikelen.

Wat dit betekent voor keuzes:

- Een wijziging die de rekentools beter vindbaar of bruikbaar maakt gaat voor.
- Een nieuwe pagina komt er alleen als er aantoonbaar op gezocht wordt en wij er iets uitrekenen of tonen wat elders ontbreekt.
- De dataset groeit niet; liever minder velden die kloppen dan meer velden die verouderen.

## 3. Doelen en hoe we meten

Doelen zijn richtpunten, geen beloften. Google bepaalt posities, en verkeer volgt met vertraging.

| Doel | Nu | Richtpunt over drie maanden | Bron |
|---|---|---|---|
| Positie op "bouwdepot berekenen" | 3,4 | Top 3 behouden, daarna 1 of 2 | Search Console |
| Klikken per dag | ca. 10 | Aantoonbaar stijgende lijn | Search Console |
| Nieuwbouwvragen, gemiddelde positie | 29,6 | Eerste pagina (onder de 10) voor de drie grootste vragen | Search Console |
| Vragen met een bedrag, klikken | 20 | Verdubbeling | Search Console |
| Wat bezoekers op de site doen | onbekend | Blijft onbekend zolang er geen statistieken zijn; we sturen op Search Console | n.v.t. |

**Wekelijks, vaste dag:** positie en klikken van "bouwdepot berekenen" op de homepage, klikken per dag, en de nieuwbouwvragen. Vastleggen in een eenvoudige tabel, zodat een daling binnen een week zichtbaar is.

## 4. Het werk, in volgorde

### Fase 0 — Meten en beschermen (deze week)

| # | Wat | Waarom | Wie |
|---|---|---|---|
| 0.1 | Besloten: Vercel Web Analytics blijft uit (betaald). Script en de passages in privacy en cookies zijn verwijderd | Geen kosten zolang er geen inkomsten zijn | Gedaan |
| 0.2 | Nulmeting vastleggen: zie `metingen/nulmeting-2026-10-08.md` | Vergelijkingspunt voor alles hierna | Gedaan |
| 0.3 | Positie van de homepage op "bouwdepot berekenen" dagelijks volgen tot 25 oktober | De nieuwe homepage is het grootste risico | Eigenaar kijkt, Claude analyseert |
| 0.4 | Openstaand werk afhandelen: eigen 404-pagina live; verrijkte aanbiederpagina's live of terugdraaien | Staat lokaal klaar | Eigenaar beslist |
| 0.5 | In Search Console de 4 pagina's "gevonden, niet geïndexeerd" opzoeken | Mogelijk nieuwe pagina's die Google nog niet heeft opgehaald | Eigenaar levert de lijst |

**Noodplan bij 0.3:** zakt de homepage merkbaar op "bouwdepot berekenen", dan komt de volledige rekentool terug bovenaan de homepage. Dat is klein werk: de rekenkern en het formulier bestaan.

### Fase 1 — "Bouwdepot berekenen" winnen (week 1 en 2)

Hier zit 87% van het verkeer en staan we al in de top tien. Kleine verbeteringen leveren hier het meest op.

| # | Wat | Onderbouwing |
|---|---|---|
| 1.1 | Homepage en rekenpagina naast elkaar leggen tegen de zoekvraag: titel, kop, eerste scherm, wat er te doen valt | Twee pagina's dingen naar dezelfde vraag; nu wint de pagina die er het minst op lijkt |
| 1.2 | Eén pagina kiezen als antwoord op "bouwdepot berekenen", en de andere daarnaar laten wijzen | Voorkomt dat ze elkaar in de weg zitten. Welke van de twee volgt uit 1.1 en uit de meting van 0.3 |
| 1.3 | Bedragentabel op de rekenpagina: wat kost een bouwdepot van 10.000 tot 150.000 per maand, bij een paar rentes | 804 vertoningen op letterlijk deze vragen. Uitgerekend met de bestaande rekenkern, met tests |
| 1.4 | Korte antwoorden op de vragen die mensen stellen ("wat kost een bouwdepot", "betaal je rente over een bouwdepot"), direct onder de tool | Staan nu op positie 2 tot 12 met weinig klikken |
| 1.5 | De oude pagina `maandlasten-bouwdepot.html` had 849 vertoningen en verwijst nu door naar een anker. Nagaan of dat deel van de rekenpagina die vraag nog beantwoordt | Verkeer dat bij de samenvoeging verloren kan zijn gegaan |

**Klaar wanneer:** de gekozen pagina beantwoordt de zoekvraag in het eerste scherm, de bedragentabel staat er met tests, en de wekelijkse meting laat geen daling zien.

### Fase 2 — Nieuwbouw naar de eerste pagina (week 2 tot 5)

De grootste groeikans, en het onderwerp waar de eigenaar zelf ervaring mee heeft.

| # | Wat | Onderbouwing |
|---|---|---|
| 2.1 | Eén doorlopend nieuwbouwplan: bouwrente, maandlast per maand, dubbele lasten en renteverlies in één berekening | Nu vier losse pagina's; de concurrentie heeft dit nergens |
| 2.2 | Een uitgewerkt voorbeeld van begin tot eind, met bedragen | "Bouwdepot nieuwbouw voorbeeld" 313 vertoningen, "voorbeeld berekening dubbele lasten nieuwbouw" 134 |
| 2.3 | De pagina's bouwrente en dubbele lasten behouden als ingang, elk met een eigen voorbeeld en een duidelijke stap naar het hele plan | "Bouwrente berekenen" 250 vertoningen op positie 23; "dubbele lasten nieuwbouw berekenen" 190 op positie 18 |
| 2.4 | Het eigen verhaal: de eigenaar kocht zelf nieuwbouw en miste dit overzicht. Kort, op de nieuwbouwpagina en bij "over ons" | Eigen ervaring weegt zwaar bij financiële onderwerpen en staat nu nergens |

**Klaar wanneer:** een nieuwbouwkoper in één keer zijn hele bouwperiode kan doorrekenen, het voorbeeld klopt met de rekenkern (getest), en de drie grootste nieuwbouwvragen bewegen richting de eerste pagina.

**Financiële zorgvuldigheid:** dit raakt rekenkernen. Elke wijziging volgt sectie 8 van `CLAUDE.md`: model en formule documenteren, uitkomsten onafhankelijk narekenen, grafiek en tabel consistent houden.

### Fase 3 — "Hoeveel bouwdepot kan ik krijgen" (week 4 tot 6)

| # | Wat | Onderbouwing |
|---|---|---|
| 3.1 | De leenruimte-tool een eigen, vindbare ingang geven | Ruim 400 vertoningen op "hoeveel bouwdepot kan ik krijgen" en varianten, positie 25. De tool bestaat, maar zit in de verbouwbegroting |
| 3.2 | Beslissen: eigen pagina, of een sterker deel van de verbouwbegroting | Een eigen pagina betekent een eerdere samenvoeging terugdraaien (`leenruimte.html` verwijst nu door). Dat vraagt een bewuste SEO-keuze |
| 3.3 | "Bouwdepot aanvragen" (550 vertoningen, positie 68) bekijken: kunnen wij daar iets uitrekenen of tonen, of is dit een vraag voor de bank? | Alleen oppakken als we er echt iets aan toevoegen |

### Fase 4 — Vertrouwen (doorlopend, begint in week 1)

| # | Wat | Onderbouwing |
|---|---|---|
| 4.1 | "Over ons" herschrijven rond het eigen verhaal en de werkwijze | Zie 2.4 |
| 4.2 | Laten nagaan of een site met advertentie-inkomsten naam en adres moet vermelden | Juridische vraag; hoort bij iemand met die kennis, niet bij Claude |
| 4.3 | Privacypagina gelijktrekken met wat de site doet: alle lokale opslag, de bewaartermijn, en statistieken zodra die aanstaan | Nu beschrijft ze statistieken die niet verzameld worden en noemt ze niet alle opslag |
| 4.4 | Voettekst overal gelijk, met een link naar de voorwaarden | Staat nu op zes pagina's |

### Fase 5 — Bankdata beheersbaar houden (week 3, daarna vast ritme)

| # | Wat | Onderbouwing |
|---|---|---|
| 5.1 | Per veld beslissen: verandert dit een keuze of een planning? Zo niet, dan uit de dataset | Minder velden om te controleren; de rekentools gebruiken er maar een paar |
| 5.2 | Vast ritme: wekelijkse bronbewaking blijft; eens per kwartaal de vier aanbieders die niet automatisch te volgen zijn met de hand | Rabobank, ING, MUNT en Allianz blokkeren automatisch ophalen |
| 5.3 | Zichtbaar logboek per aanbieder: wat is er wanneer gewijzigd | Laat zien dat de gegevens onderhouden worden |
| 5.4 | Aanbiederpagina's bevriezen: bijhouden, niet uitbreiden | 24 klikken in drie maanden |
| 5.5 | De omzetting naar "je" uit de generatoren halen | Doet niets meer nu de dataset zelf "je" zegt |

### Fase 6 — Kwaliteit die nog niet gecontroleerd is (verspreid)

| # | Wat |
|---|---|
| 6.1 | Laadsnelheid meten met PageSpeed Insights op homepage, rekenpagina en nieuwbouw. Mijn eigen meting was niet betrouwbaar |
| 6.2 | Handmatig testen wat nog nergens is gedaan: afdrukken, toetsenbordbediening, Safari, een echte telefoon, 1440 px |
| 6.3 | Aanraakvlakken van links in lopende tekst vergroten waar ze onder de 40 px blijven |
| 6.4 | `favicon.ico` toevoegen; geeft nu een 404 |
| 6.5 | Het 3D-huis op stappenplan en verbouwpagina: 140 kB voor versiering. Meten of het de laadtijd schaadt en dan beslissen |

### Fase 7 — AdSense (pas na fase 1 en 2)

| # | Wat | Onderbouwing |
|---|---|---|
| 7.1 | Advertentieposities ontwerpen: vaste vakken onder de uitkomst en tussen uitlegsecties, nooit tussen invoer en uitkomst | Er staan nu geen vakken; auto-advertenties kiezen zelf een plek |
| 7.2 | Controleren dat het Europese toestemmingsbericht in AdSense gepubliceerd is en voor een Nederlandse bezoeker opent | De koppeling laadt, maar de dialoog heb ik niet zien openen |
| 7.3 | Opnieuw aanvragen wanneer: de wijzigingen uit fase 1 en 2 zijn geïndexeerd, én de klikken per dag aantoonbaar gestegen zijn | Opnieuw aanvragen na alleen cosmetische wijzigingen helpt zelden |
| 7.4 | Vooraf afspreken wat we doen bij een tweede afwijzing | Zie sectie 6 |

## 5. Wat we niet doen

- **Geen algemene artikelen** over wat een bouwdepot is of hoe het werkt. Dat staat er al tientallen keren.
- **Geen extra aanbieders of aanbiederpagina's.**
- **Geen pagina per bedrag** ("bouwdepot van 30.000"). Eén tabel beantwoordt die vragen; losse pagina's zouden dun en bijna identiek zijn.
- **Geen nieuwe 3D of animatie** tot het verkeer groeit.
- **Geen opbrengstschattingen.** De opbrengst per bezoeker kennen we pas als er advertenties draaien.

## 6. Risico's en wat onzeker blijft

| Risico | Wat we weten | Wat we doen |
|---|---|---|
| De homepage verliest zijn positie | Nog niet te zien; cijfers lopen tot 8 oktober | Fase 0.3 met noodplan |
| AdSense wijst opnieuw af | Google licht "weinig waarde" niet toe en noemt geen minimum | Pas aanvragen bij groei. Bij afwijzing: bespreken of een ander advertentienetwerk of verdienmodel past bij de onafhankelijkheid van de site |
| Groei blijft uit | Posities reageren traag, vaak weken | Per fase meten; na fase 2 evalueren of de richting klopt |
| Motivatie | De eigenaar wil uren investeren als het iets oplevert | Na drie maanden een eerlijk moment: is het verkeer gegroeid? Zo niet, dan onderhoud terugbrengen tot het minimum |
| Bankdata veroudert | Vier aanbieders zonder automatisch vangnet | Fase 5.2 |
| Zoekvraag kleiner dan gedacht | Bij posities boven de 30 onderschatten vertoningen de vraag, maar hoeveel is onbekend | Eerst de vragen waar we al in de top twintig staan |

## 7. Beslissingen voor de eigenaar

1. **Akkoord met de richting** uit sectie 2: rekenen en nieuwbouw voorop, bankdata ondersteunend, geen algemene artikelen?
2. ~~Openstaand werk~~ Besloten: alles live gezet op 11 oktober.
3. ~~Vercel Analytics aanzetten of verwijderen~~ Besloten: uit, verwijderd.
4. **Fase 3.2:** mag een eerdere samenvoeging (leenruimte) worden teruggedraaid als de cijfers daarom vragen?
5. **Evaluatiemoment:** spreken we af om na drie maanden te beslissen over doorgaan of terugschalen?

## 8. Eerste stap na goedkeuring

Fase 0.2 en 1.1: de nulmeting vastleggen en de homepage en de rekenpagina naast elkaar leggen tegen "bouwdepot berekenen". Dat kost weinig, verandert nog niets aan de site, en bepaalt of het risico uit sectie 1 echt is.
