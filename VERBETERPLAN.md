# Verbeterplan BouwdepotCalculator.nl

**Datum:** 11 oktober 2026, stand bijgewerkt op 21 oktober 2026
**Status:** goedgekeurd door de eigenaar op 11 oktober 2026
**Basis:** audit van de site, concurrentie-onderzoek, wijzigingsgeschiedenis van de bankdata en Search Console (9 juli t/m 8 oktober 2026)

Dit plan vervangt de volgorde in `ROADMAP.md` niet vanzelf. Die roadmap ging over de herbouw; dit plan gaat over wat daarna komt. Keurt de eigenaar dit plan goed, dan hoort de roadmap ernaar te verwijzen of te worden bijgewerkt, zodat er geen twee plannen naast elkaar bestaan.

**De volgorde ligt niet vast.** De fasen hieronder zijn een voorkeursvolgorde, geen afspraak. De eigenaar kiest per keer wat er gebouwd wordt, ook als dat buiten de volgorde of buiten het plan valt; dat is tot nu toe ook zo gegaan. Wat wel vaststaat: na elk stuk werk wordt de tabel hieronder bijgewerkt, zodat dit document blijft kloppen met de site. Werk dat niet in een fase past, komt onder "Buiten de fasen gebouwd".

## Stand op 21 oktober 2026

| Fase | Stand | Wat er nog ligt |
|---|---|---|
| 0. Meten en beschermen | Grotendeels klaar | De positie van de homepage op "bouwdepot berekenen" volgen tot 25 oktober (0.3) en de vier pagina's "gevonden, niet geïndexeerd" opzoeken (0.5). Beide bij de eigenaar |
| 1. "Bouwdepot berekenen" winnen | Klaar | Niets. 1.2 is vervallen: de homepage blijft zoals hij is; het voorstel blijft het noodplan als de positie zakt |
| 2. Nieuwbouw naar de eerste pagina | Gebouwd, nog niet live | 2.1 is live. 2.2 en 2.3 zijn gebouwd op `redesign/nieuwbouw-voorbeeld` (21 en 22 oktober): een doorgerekend voorbeeld op nieuwbouw.html, ook zichtbaar op het startscherm; een antwoord met bedragen bovenaan bouwrente en dubbele lasten; op dubbele lasten de drie voorbeelden naast elkaar. Daarna de positie volgen. 2.4 is door de eigenaar afgewezen |
| 3. "Hoeveel bouwdepot kan ik krijgen" | Live (op productie gezien op 21 oktober) | Open: 3.3, en de positie volgen. In Search Console de URL-inspectie doen en indexering aanvragen: het adres was tot kort geleden een doorverwijzing |
| 4. Vertrouwen | Deels | 4.3 gedaan. 4.4 gebouwd, nog niet live: de voettekst komt nu uit `data/navigatie.json`, overal gelijk en met de gebruiksvoorwaarden. De privacypagina noemt nu ook wat er in een gekopieerde link staat. Open: "Over ons" (4.1) en de juridische vraag over naam en adres (4.2) |
| 5. Bankdata beheersbaar houden | Deels | Alle dertien aanbieders zijn op 14–17 oktober met de hand bij de bron gecontroleerd. 5.4 (aanbiederpagina's niet uitbreiden) is niet gevolgd: er kwamen vijf pagina's bij. Zie stap 3 hieronder |
| 6. Kwaliteit | Deels | 6.4 gebouwd: `favicon.ico`. Gevonden en hersteld: op een telefoon verborg de compacte maandtabel de uitkomstkolom op renteverlies, hypotheekrenteaftrek, dubbele lasten en bouwrente. Open: 6.1, 6.2, 6.3, 6.5 |
| 7. AdSense | Wacht | 7.2 gecontroleerd: de dialoog opent voor een Nederlandse bezoeker, maar de eerste laag heeft geen weigerknop. Door de eigenaar geparkeerd op 22 oktober; zie stap 4 hieronder |

## Volgorde na de AdSense-analyse van 21 oktober 2026

De vraag was of er pagina's, tools of vormgeving bij moeten na twee afwijzingen met "content van weinig waarde". Het antwoord: geen nieuwe pagina's en geen nieuwe tool. Twee dingen ontbreken op bestaande pagina's:

- De nieuwbouwpagina's hebben geen doorgerekend voorbeeld dat je ziet zonder iets in te vullen, terwijl 447 van de 2.469 nieuwbouwvertoningen erom vragen.
- 14 van de 32 pagina's (dertien aanbieders en de vergelijking) bestaan voor tweederde of meer uit tekst die elders op de site ook staat. Gemeten met reeksen van vijf woorden: 17–37% eigen tekst.

Deze volgorde vervangt geen fase hierboven, maar zegt welke onderdelen eerst gaan.

| Stap | Wat | Fase | Stand |
|---|---|---|---|
| 1 | Doorgerekend voorbeeld op nieuwbouw.html: grafiek, één uitgewerkte maand, maandtabel. Bewaakt door `tests/nieuwbouw-voorbeeld.test.mjs` | 2.2 | Gebouwd, niet live |
| 2 | Bouwrente en dubbele lasten, voor "bouwrente berekenen" en "voorbeeld berekening dubbele lasten nieuwbouw". Niet hetzelfde patroon als stap 1: deze rekentools tonen bij binnenkomst al een uitkomst, dus een los voorbeeld zou die herhalen. Wel: het antwoord met bedragen bovenaan, de kosten van meefinancieren als bedrag, en de drie voorbeeldknoppen van dubbele lasten doorgerekend in één tabel. Bewaakt door `tests/bouwrente-voorbeeld.test.mjs` en `tests/dubbelelasten-voorbeeld.test.mjs` | 2.3 | Gebouwd, niet live |
| 3 | Minder sjabloon: in `scripts/build-voorwaarden.mjs` de secties schrappen die op alle dertien aanbiederpagina's gelijk zijn ("Hoe dit zich verhoudt", "Rekenen met deze voorwaarden", "Zelf navragen"); "maand voor maand" vervangen door de tijdlijnrij van die bank. Renteverlies opgaan in bouwdepot berekenen met een 301 en een SEO-plan | 5.4, besluit 14 oktober | Open |
| 4 | Randvoorwaarden. De eigenaar zet in AdSense de knop "Niet toestemmen" aan en kijkt of je na een keuze die keuze kunt wijzigen. Daarnaast de juridische vraag uit 4.2. Voettekst, favicon en privacyzin zijn gebouwd | 4.2, 4.4, 6.4, 7.2 | Deels. De weigerknop is op 22 oktober door de eigenaar geparkeerd; vóór een nieuwe AdSense-aanvraag oppakken |
| 5 | Meten, dan pas aanvragen: Search Console-export zes weken na livegang van 1–3. Aanvragen als elke indexeerbare pagina een zoekvraag kan noemen en de nieuwbouwvragen richting pagina 1 bewegen | 7.3, 7.4 | Wacht |

Bewust niet: een pagina voor "bouwdepot aanvragen" (positie 68; dat is de procedure van de bank), een fiscale rekentool voor het depotjaar (`renteaftrek.js` kent het depot niet; 204 vertoningen), en iets voor declareren of looptijd (samen ruim 200 vertoningen, al gedekt door declaratiegids, depotplanner en tijdlijn).

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

#### Ontwikkelplan fase 3 (17 oktober 2026)

**Onderzoek.**
- De zoekvragen zijn "hoeveel bouwdepot kan ik krijgen" (232 vertoningen, positie 25), "bouwdepot hoeveel" (105, positie 15) en "hoeveel bouwdepot kan je krijgen" (93, positie 32,5). `/leenruimte.html` had 143 vertoningen voordat het werd doorgestuurd.
- De pagina's die nu bovenaan staan, rekenen niet zelf: ze noemen woningwaarde en inkomen en verwijzen naar een adviseur.
- De huidige tool in de verbouwbegroting doet alleen de waardetoets. Op de eigenlijke vraag, "hoeveel kan ik lenen", geeft hij dus geen antwoord.

**Wat de wet bepaalt.** Bron: Tijdelijke regeling hypothecair krediet, versie die geldt vanaf 1-1-2026, wetten.overheid.nl/BWBR0032503.

- **Inkomenstoets (art. 3):**
  - Toegestane jaarlast = toetsinkomen × percentage uit bijlage 1. Tabel 1 geldt onder de AOW-leeftijd, tabel 2 erboven.
  - Bij twee aanvragers telt het gezamenlijke inkomen (lid 6).
  - De last wordt berekend als annuïteit over 30 jaar, met maandelijks achteraf betalen.
  - Toetsrente: bij een rentevaste periode van 10 jaar of langer de geoffreerde rente, anders de AFM-rente of de geoffreerde rente als die hoger is. De AFM-rente is minimaal 5%; in het vierde kwartaal van 2026 is ze 5%.
  - Studieschuld: het termijnbedrag gaat gebruteerd van de last af (art. 3a, tabel met bruteringsfactoren).
- **Wat een aanbieder buiten de last mag laten (art. 3 lid 8 en art. 4):**
  - het bedrag bij het energielabel (€ 0 tot € 40.000);
  - voor energiebesparende voorzieningen bij een bestaande woning nog eens € 20.000 (label E-G), € 15.000 (C-D) of € 10.000 (A-A++). Zonder label is dat € 10.000;
  - voor een alleenstaande met meer dan € 30.000 toetsinkomen tot € 17.000.
  - Het zijn bevoegdheden ("kan"), geen plichten.
- **Waardetoets (art. 5):** maximaal 100% van de woningwaarde. Voor de kosten van energiebesparende voorzieningen mag het tot 106%.

**Model.**
- Maximale hypotheek op inkomen = contante waarde van de toegestane maandlast (30 jaar, toetsrente), plus de bedragen die buiten de last mogen blijven.
- Maximale hypotheek op waarde = waarde na verbouwing, plus de energiebesparende kosten tot 106%.
- Extra te lenen = het kleinste van de twee, min de huidige hypotheek, en nooit minder dan nul.
- **Vereenvoudigingen, op de pagina benoemd:**
  - het bestaande leningdeel telt ook als annuïteit over 30 jaar (lid 3 staat dat toe);
  - andere leningen dan de studieschuld zitten er niet in;
  - boven € 125.000 geldt het percentage van de laatste rij.

**Pagina.**
- **Adres:** `/leenruimte.html` komt terug als eigen pagina. Google kent het adres al, en het is de naam in het menu. De doorverwijzingen van `maximale-bouwdepot.html`, `eigen-geld-bouwdepot.html` en `?plan=haalbaarheid` gaan erheen.
- **Kop en titel:**
  - titel: "Hoeveel bouwdepot kan ik krijgen? Reken je leenruimte uit";
  - H1: "Hoeveel bouwdepot kun je krijgen?".
- **Opbouw:** een rekenpagina in de werkruimte-stijl, zonder startscherm.
  - **Invoer in drie groepen:** inkomen, woning en hypotheek, verbouwing. Studieschuld en AOW staan onder "Meer".
  - **Uitkomst:** het extra bedrag, welke toets de grens bepaalt, een balk met beide grenzen en de huidige hypotheek, en de extra maandlast.
  - **"Zo is het gerekend":** elke stap met het percentage uit de wet.
  - **Verder:** "Nog te controleren", Excel en "link kopiëren".
- **Tekst onder de tool:**
  - vier korte antwoorden op de gezochte vragen, met bedragen uit de rekenkern;
  - één voorbehoud.
- **De verbouwbegroting** houdt haar waardetoets als onderdeel van de route, en verwijst voor de inkomenstoets naar de nieuwe pagina.

**Werk, in volgorde.**
1. De tabellen uit de wettekst vastleggen in `src/domain/trhk-2026.js`, met bron en datum. Een test bewaakt de opbouw en controleert steekproeven.
2. De rekenkern `src/domain/leenruimte.js`, met handberekende tests: nulgevallen, grenzen, partner, AOW, studieschuld, energielabel en 106%.
3. Pagina, schermcode en stijl.
4. Aansluiten:
   - menu (`data/navigatie.json`), homepage, verbouwbegroting en bouwdepot berekenen;
   - doorverwijzingen in `vercel.json`, Vite-ingang en sitemap.
5. Controle in de browser op 375 en 1040 px, de build en het opleveringsrapport. Pas na akkoord live.

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
