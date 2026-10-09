# PRODUCT_VISION.md — BouwdepotCalculator.nl

**Versie:** 1.0 — concept ter goedkeuring door de eigenaar  
**Datum:** 9 oktober 2026  
**Status:** Nieuwe productvisie. Vervangt de productrichting van `plannen/PRODUCTPLAN.md` pas na expliciete goedkeuring.  
**Domein:** https://www.bouwdepotcalculator.nl/

---

## 1. De missie

**BouwdepotCalculator.nl maakt de financiële gevolgen van nieuwbouw en verbouwen begrijpelijk, zichtbaar en interactief.**

Wij bouwen geen verzameling losse formulieren, geen hypotheekadvieswebsite en geen kopie van BerekenHet.nl. We bouwen een onafhankelijke financiële *werkruimte* waarin bezoekers hun eigen plannen kunnen doorrekenen, scenario's kunnen vergelijken en grip krijgen op hun budget en maandlasten.

**De centrale belofte:** *Zie niet alleen wat iets kost, maar begrijp wanneer je betaalt, waarom en wat er verandert als je plannen veranderen.*

De website combineert:
1. **Ontdekken:** een onderscheidende, minimalistische homepage met verfijnde 3D-storytelling.
2. **Kiezen:** een heldere route naar de eigen situatie, zonder onnodige vragen.
3. **Begrijpen:** een premium-fintech-dashboard dat op basis van invoer direct berekeningen en visualisaties toont.
4. **Handelen:** bruikbare begrotingen, tijdlijnen, scenario's en exporteerbare overzichten.

De gebruiker moet in minder dan een minuut een nuttig eerste inzicht kunnen krijgen. Verdere details zijn optioneel.

---

## 2. Voor wie bouwen we?

### A. Nieuwbouwkoper (primaire productroute)

Iemand koopt of overweegt een nieuwbouwwoning en wil financiële controle tijdens de gehele bouwperiode.

Vragen:
- Wat betaal ik per maand vóór, tijdens en na de bouw?
- Wanneer heb ik dubbele woonlasten?
- Hoe werken bouwtermijnen, hypotheekrente en de eventuele depotvergoeding samen?
- Hoeveel budget heb ik nodig voor meerwerk, vloer, keuken, tuin en inrichting?
- Welke maand is financieel het zwaarst?
- Wat gebeurt er bij twee, drie of zes maanden vertraging?
- Wat moet ik reserveren en wanneer?
- Welke regels gelden bij mijn eigen geldverstrekker?

**Gewenste uitkomst:** een maandelijkse woonlastentijdlijn, een totale budgetindicatie en enkele scenario's met duidelijke aannames.

### B. Verbouwer / uitbreider (primaire productroute)

Een huiseigenaar die wil verbouwen, verduurzamen of uitbreiden en moet bepalen wat betaalbaar en financierbaar is.

Vragen:
- Wat kost mijn plan per onderdeel?
- Welke kosten betaal ik zelf en welke mogen mogelijk uit het bouwdepot?
- Wat wordt de nieuwe maandlast?
- Wat verandert er bij een hoger budget of een andere rente?
- Wat is de waarde na verbouwing en welk financieringsgat is er mogelijk?
- Wat moet ik aanleveren voor een declaratie?

**Gewenste uitkomst:** een aanpasbare verbouwbegroting met financieringsscenario's en een bruikbare specificatie.

### C. Bezoeker met een lopend bouwdepot (secundaire route)

Heeft al een bouwdepot en zoekt praktische duidelijkheid over einddatum, uitbetalingen, declaraties, voorwaarden en resterend budget.

**Gewenste uitkomst:** een praktische depotplanner en toegankelijke, gecontroleerde informatie per bank.

### D. Bezoeker met één snelle vraag (belangrijke SEO-route)

Komt via Google op bijvoorbeeld 'bouwdepot berekenen' of 'dubbele lasten nieuwbouw'. Deze bezoeker wil **direct** rekenen, zonder verplicht een onboarding door te lopen.

**Productregel:** routekeuze is uitnodigend, nooit verplicht. Bestaande deep links en rekentools moeten direct blijven functioneren.

---

## 3. Positionering en onderscheid

**Positionering:** onafhankelijke financiële rekensoftware voor de bouw- en verbouwfase van een woning.

We concurreren niet op het grootste aantal tools. We concurreren op:
- **Samenhang:** een invoerwaarde kan, na toestemming van de bezoeker, relevant blijven in meerdere tools.
- **Tijd:** niet alleen het eindbedrag, maar vooral de maand-tot-maandontwikkeling.
- **Scenario's:** bezoekers onderzoeken 'wat als'-vragen met directe visuele feedback.
- **Controleerbaarheid:** aannames, rekenmethoden, brondata en onzekerheden zijn zichtbaar.
- **Bankspecifieke informatie:** gedateerde, verifieerbare voorwaarden waar de bron dat toelaat.
- **Praktische resultaten:** exporteerbare begrotingen, overzichten en planningen.
- **Ontwerpkwaliteit:** een aantrekkelijke eerste indruk gecombineerd met een uitzonderlijk bruikbare werkomgeving.

AI-chatbots kunnen algemene antwoorden geven. Onze meerwaarde zit in **een duurzame, zelf te bedienen interface**, waarin meerdere afhankelijke variabelen tegelijkertijd zichtbaar zijn. We claimen niet dat AI deze berekeningen niet kan uitvoeren.

---

## 4. Twee visuele werelden, één herkenbaar merk

### Wereld 1 — De publieke homepage: minimalistisch, redactioneel, indrukwekkend

**Stijlrichting:** modern minimalisme (C), met verfijnde premium uitstraling (A).

Kenmerken:
- Veel ademruimte, scherpe compositie, hoogwaardige typografie.
- Warme, lichte ondergrond: ivoor / gebroken wit.
- Donkere tekst: antraciet / diep blauwgroen.
- Hooguit enkele ingetogen accentkleuren.
- Eén karakteristiek 3D-element als visueel hoofdonderwerp.
- Animatie maakt het product begrijpelijk; ze mag nooit decoratie zonder functie worden.
- Duidelijke routekeuze en minstens één direct zichtbare ingang naar 'Bouwdepot berekenen'.
- Op mobiel werkt de kernnavigatie ook zonder animatie.

**3D-conceptrichting (voor ontwerpvalidatie, nog niet definitief):**
Een abstract architectonisch huis of bouwvolume ontstaat tijdens het scrollen uit lagen. De lagen visualiseren grond, bouwtermijnen, financiering, bouwdepot en uiteindelijke woonlasten. De gebruiker ziet de relatie tussen een fysiek bouwproces en geldstromen.

**Belangrijke grens:** niet de gehele homepage afhankelijk maken van WebGL of een 3D-library. Gebruik een lichte poster/fallback, progressieve enhancement, lazy loading en `prefers-reduced-motion`. Geen zware animatie op het kritieke renderpad. Geen verplichte scroll-animatie om informatie of keuzes te kunnen bereiken.

### Wereld 2 — De persoonlijke financiële werkruimte: premium fintech

Na een gekozen route komt de bezoeker in een **dashboardachtige toolomgeving**:
- Rustige lichte basis, consistente kaarten en duidelijke informatiehiërarchie.
- Diepgroen / blauwgroen, saliegroen, neutrale grijstinten en zeer spaarzaam champagne.
- Bedragen krijgen de meeste visuele nadruk; duidelijke labeling bruto/netto en periode.
- Grafieken, tijdlijnen, budgetbalken en scenariokaarten.
- Invoervelden, numerieke velden en sliders waar zinvol, direct gekoppeld aan uitkomsten.
- Stapsgewijze uitbreiding: basis eerst; geavanceerde velden optioneel.
- Geen overdreven gamification, geen overdaad aan gradients, glassmorphism of zwevende panelen.
- Gegevens opnieuw gebruiken tussen modules waar technisch verantwoord.
- Alle belangrijke inzichten ook als tekst en tabel, niet alleen als grafiek.

**De overgang is bewust:** de homepage wekt nieuwsgierigheid; het dashboard geeft overzicht en controle.

### Voorlopig palet (ontwerpvoorstel, geen harde beslissing)

| Rol | Kleur |
|---|---|
| Achtergrond | `#F7F5F0` |
| Hoofdaccent | `#183B35` |
| Zachte accentkleur | `#9BB8A8` |
| Donkere tekst | `#26353B` |
| Zeldzame highlight | `#CFAD7D` |

Het definitieve designsysteem wordt vastgelegd in `DESIGN_SYSTEM.md` na beoordeling van visuele prototypes.

---

## 5. Gewenste gebruikersstroom

```text
Google / directe bezoeker / verwijzende website
             |
             v
Minimalistische homepage met één sterk 3D-verhaal
             |
      +------+-------------------------+
      |      |                         |
   Nieuwbouw Verbouwen / uitbreiden  Snel berekenen
      |      |                         |
      v      v                         v
Dashboard   Dashboard              Bestaande SEO-tool
nieuwbouw   verbouwen               zonder verplichte onboarding
      |      |
      +------+-------------------------+
             |
     Budget, tijdlijn, scenario's,
     bankvoorwaarden en exports
```

Een aparte, eenvoudige route voor een lopend bouwdepot blijft bereikbaar via navigatie en contextuele links.

**UX-principes:**
1. Snel antwoord, optioneel meer diepte.
2. Bij elke invoer: meteen zichtbare gevolgen.
3. Geen verplicht account of betaalmuur.
4. Geen verplichte routekeuze voor organische bezoekers die al op een tool landen.
5. Begrijpelijke Nederlandse taal, zonder onnodig financieel jargon.
6. Voorbeeldaannames zijn duidelijk gemarkeerd en eenvoudig aanpasbaar.
7. Elke wezenlijke uitkomst is verifieerbaar met formule, eenheden en uitgangspunten.

---

## 6. Productmogelijkheden

### 6.1 Nieuwbouw — financieel dashboard

**Belangrijkste kandidaat voor het eerste echte dashboardprototype.**

Modules:
- Tijdlijn: grond, bouwtermijnen, oplevering, oude woonlasten en nieuwe woonlasten.
- Maandlasten: hypotheek, eventuele depotrentevergoeding, oude huur/hypotheek en overige ingevoerde posten.
- Budget: meerwerk, keuken, vloer, tuin en reserveringen.
- Scenario's: vertraging, gewijzigde rente, extra meerwerk, andere opleverdatum.
- Hoogste-maandlast-indicator en indicatieve benodigde buffer.
- Onderbouwing van berekeningen; exporteerbaar overzicht.

**Financiële nuance:** een bouwdepot is geen zelfstandige hypotheek bovenop de hele lening. Onderscheid lening, opgenomen termijnen, depotsaldo, rente en eventuele vergoeding nauwkeurig. Netto-maandlasten alleen met expliciete fiscale aannames; anders bruto aangeven. Een vertraging heeft niet noodzakelijk voor alle huishoudens hetzelfde financiële effect.

### 6.2 Verbouwen — begroting en financieringsscenario's

Modules:
- Kostenposten toevoegen per ruimte / werkzaamheid.
- Onderscheid offertes, schattingen, eigen geld en mogelijk financierbare posten.
- Onzekerheidsmarge en onvoorziene kosten.
- Indicatieve waarde-/financieringsruimte, afzonderlijk van de inkomens-/acceptatietoets.
- Nieuwe bruto-maandlast onder duidelijk vermelde uitgangspunten.
- Relevante bankvoorwaarden en exporteerbare specificatie.

### 6.3 Lopend bouwdepot

Modules:
- Start/einddatum en resterende looptijd.
- Declaratieplanning en checklist.
- Resterend depotsaldo en relevante beperkingen.
- Verlengingsvoorwaarden en bronverwijzingen per geldverstrekker.

### 6.4 Directe calculators en uitleg

Bestaande calculator-URL's, gidsen, bankpagina's en zoekresultaatpagina's blijven direct toegankelijk. De nieuwe dashboards vervangen de zoeklandingspagina's **niet automatisch**; ze vormen een aanvullende, verbonden ervaring.

---

## 7. Welke functionaliteit maakt de site waardevol?

Een nieuwe feature moet minstens één van deze vragen positief beantwoorden:
- Begrijpt de bezoeker een financieel gevolg beter?
- Kan de bezoeker er een concrete keuze of handeling mee voorbereiden?
- Kan hij een scenario onderzoeken dat lastig is in een statisch artikel?
- Kan hij een bruikbaar resultaat bewaren of meenemen?
- Wordt een betrouwbaar gegeven uit een andere module hergebruikt?

Een functie die alleen een pagina langer of mooier maakt, zonder gebruikswaarde, krijgt geen prioriteit.

**Belangrijk:** een 3D-homepage is een onderscheidende introductie, maar niet de kern van de waardepropositie. De interactieve rekenomgeving is het product.

---

## 8. Verdienmodel, bereik en SEO

**Primair verdienmodel:** Google AdSense, zodra de website voldoet aan toepasselijke beleids-, inhouds- en privacyvereisten. Toelating en opbrengst zijn niet gegarandeerd.

**Groeistrategie:**
- Bestaande organische zoekposities en bestaande pagina's beschermen.
- Gerichte zoekpagina's maken rond specifieke problemen en rekenvragen.
- Geen dunne, massaal gegenereerde SEO-content.
- Hoge inhoudelijke kwaliteit, met duidelijke auteurschap-, bron- en update-informatie.
- Interne links tussen uitleg, directe calculator en relevante dashboardmodules.
- Geen advertenties in invoervelden, over cruciale uitkomsten of in storende overlays.
- Meten: organische klikken en vertoningen per URL/query, gebruik van tools, betrokkenheid en technische prestaties.

**Migratieprincipe:** bestaande slugs, canonicals, interne links en indexeerbare HTML zijn assets. URL-wijzigingen alleen met concreet doel, correcte redirects, sitemapcontrole en SEO-review.

---

## 9. Betrouwbaarheid, juridische grenzen en privacy

- Geen persoonlijke aanbevelingen over specifieke banken of hypotheekproducten; alleen informatie en berekeningen. Laat juridische kwalificaties toetsen wanneer functies of commerciële relaties veranderen.
- Bankinformatie heeft bron-URL, datum, eventuele voorwaarden en zichtbare nuance.
- Geen ontbrekende financiële bronwaarden invullen met aannames alsof het feiten zijn.
- Berekeningen met tests, grensgevallen en voorbeeldaannames.
- Nederlandse bedragen, datums en getalnotatie gebruiken.
- Zonder account bruikbaar.
- Standaard geen persoonlijke invoer naar een eigen backend versturen; lokaal bewaren alleen waar passend, duidelijk uitgelegd en te wissen.
- Een export bevat alleen gegevens die de bezoeker zelf heeft ingevoerd of expliciet gekozen.
- Toegankelijkheid: toetsenbord, semantische HTML, contrast, `prefers-reduced-motion`, tekstalternatieven en bruikbaarheid zonder 3D.
- Performance: vooral op mobiel, meetbaar met Core Web Vitals.

---

## 10. Bestaand project: wat absoluut behouden blijft

De huidige repository is geen wegwerpproject.

**Behouden en controleren:**
- Statische/Vite-opzet zolang die past; geen frameworkmigratie zonder aantoonbaar voordeel.
- Bestaande rekenlogica en tests, na controle tegen de nieuwe gebruikssituaties.
- Bankvoorwaarden, brongegevens, nuance en controlescripts.
- Bestaande geïndexeerde routes en inhoud met bewezen relevantie.
- Privacy-, juridische en methodologische pagina's, waar nodig geactualiseerd.
- Geen wijziging van `main` of productie voordat een prototype is beoordeeld.

**Vrij om opnieuw te ontwerpen:**
- Homepagecompositie, typografie, navigatie en animaties.
- Dashboard-UI en grafiekpresentatie.
- Gedeelde componenten en visuele tokens.
- Verbindingslaag tussen calculators.
- Documentatiestructuur en instructies voor Claude Code.

Vermijd automatische brede herschrijvingen van financiële formules enkel om CSS of een UI-framework te veranderen.

---

## 11. Niet-doelen (nu)

- Geen algemene hypotheekvergelijker die de hele markt probeert te dekken.
- Geen accountplatform, betaalde abonnementen of persoonsgegevensdatabase.
- Geen persoonlijk financieel advies.
- Geen onbeperkte set tools zonder duidelijke relatie met nieuwbouw, verbouwen of bouwdepot.
- Geen WebGL als verplichte functionaliteit.
- Geen volledige SEO-migratie of verandering van bestaande URL's om de code 'mooier' te maken.
- Geen AdSense-optimalisatie ten koste van de daadwerkelijke gebruikservaring.

---

## 12. Succescriteria en mijlpalen

### Prototype 1 — Eerste indruk en routekeuze
- Een overtuigend desktop- en mobiel ontwerp van de homepage.
- Een functioneel 3D-prototype óf een technisch onderbouwde lichtere alternatief.
- Duidelijke CTA's voor nieuwbouw, verbouwen en direct bouwdepot berekenen.
- Metingen van laadtijd, toegankelijkheid en scroll-/bewegingsgedrag.

### Prototype 2 — Werkend nieuwbouwdashboard
- Minstens één relevante maand-tot-maandberekening.
- Invoer aanpassen wijzigt de grafiek en de tekstuele uitkomst onmiddellijk.
- Eén vertraging-/meerkostenscenario dat valideerbaar is.
- Duidelijke aannames en een leesbare mobiele weergave.
- Tests voor de financiële logica.

### Prototype 3 — Verbouwroute
- Herbruikbare dashboardcomponenten.
- Begroting en financieringsinzichten met correcte definities.
- Eenvoudige export of printweergave.

### Release
- Bestaande zoeklandingspagina's blijven bruikbaar en vindbaar.
- Geen regressie van kritieke berekeningen.
- Mobiele performance en toegankelijkheid gecontroleerd.
- Inhoudelijke, privacy- en AdSense-checklist afgerond.
- Pas daarna uitrollen op productie.

**Uitgangswaarden:** Search Console-screenshots van oktober 2026 tonen bestaand organisch verkeer, maar zijn geen volledig analytisch nulrapport. Verzamel vóór uitrol een echte baseline van klikken, vertoningen, CTR, positie per pagina, prestaties en gebruik.

---

## 13. Besliskader voor nieuwe voorstellen

Stel bij elke grote ontwerp- of technische keuze deze vragen:
1. Helpt dit de bezoeker met een echte financiële vraag?
2. Past het bij de minimalistische homepage of de rustige fintech-werkruimte?
3. Wordt het financieel correcter en transparanter, of alleen indrukwekkender?
4. Bewaart het zoekverkeer, toegankelijkheid en mobiele snelheid?
5. Kunnen we het onafhankelijk testen en veilig terugdraaien?

**Bij conflicten:** financiële juistheid en vertrouwen > bruikbaarheid > vindbaarheid en performance > visueel spektakel.

Dit is geen opdracht aan Claude om direct alle pagina's te verbouwen. De volgende documenten (`DESIGN_SYSTEM.md`, `USER_EXPERIENCE.md`, `FEATURES.md`, `TECHNICAL_ARCHITECTURE.md`, `SEO_ADSENSE.md`, `ROADMAP.md` en `CLAUDE.md`) moeten deze visie vertalen naar een gecontroleerd uitvoeringsplan.

---

## 14. Open ontwerpbesluiten (bewust nog niet dichtgetimmerd)

- Definitieve 3D-metafoor: architectonisch huis, bouwlagen of financiële datavisualisatie.
- Keuze voor CSS/scroll-driven animation, pre-rendered animatie, Three.js of andere techniek: pas na prototype en performancebenchmark.
- Concrete dashboardnavigatie en informatiedichtheid.
- Exacte huisstijl, fontfamilies, kleurcontrast en motion-tokens.
- Welke onderdelen van de bankdata in elk dashboard verschijnen.
- Welke data tussen tools lokaal bewaard blijft en hoe de gebruiker die wist.

Deze vragen horen bij de ontwerp- en technische fase; ze mogen niet stilzwijgend door een code-agent worden ingevuld.

---

**Kernzin voor alle betrokkenen:**

> BouwdepotCalculator.nl verwelkomt bezoekers met een verfijnde, minimalistische 3D-ervaring en helpt hen daarna met een rustig, interactief financieel dashboard om de echte kosten van nieuwbouw en verbouwen te begrijpen.
