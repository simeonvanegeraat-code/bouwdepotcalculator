# ROADMAP.md — BouwdepotCalculator.nl

**Versie:** 1.0 — uitvoeringsplan ter goedkeuring  
**Datum:** 9 oktober 2026  
**Status:** Concept; geen toestemming om productie, `main`, domein of advertentieconfiguratie aan te passen.  
**Gebaseerd op:** `PRODUCT_VISION.md`, `DESIGN_SYSTEM.md`, `USER_EXPERIENCE.md`, `FEATURES.md`, `TECHNICAL_ARCHITECTURE.md`, `SEO_ADSENSE.md`.

---

## 1. Het resultaat waar we naartoe werken

BouwdepotCalculator.nl krijgt twee samenhangende ervaringen:

1. Een **minimalistische, redactionele homepage** met een betekenisvolle 3D-bouwanimatie, premium typografie en een directe route naar de relevante rekentool.
2. Een **rustig premium-fintech-dashboard** voor nieuwbouw en verbouwen, met maand-tot-maandbedragen, grafieken, begrotingen en scenario's.

De bestaande calculators, bankdata, belangrijke URL's en bewezen SEO-waarde gaan **niet** verloren. We verbeteren het product, niet alleen het uiterlijk.

**Kernregel:** eerst de productrichting aantonen met een werkend prototype, dan pas gecontroleerd migreren. Geen zesde ronde van kleine cosmetische verbeteringen aan de bestaande homepage.

## 2. Werkafspraken voor Claude Code

- Werk **per mijlpaal**, met een concreet eindresultaat dat de eigenaar kan beoordelen. Binnen zo'n mijlpaal mag Claude meerdere samenhangende bestanden aanpassen. De oude regel “altijd zo klein mogelijk” is **niet** leidend bij dit redesign.
- Gebruik een aparte branch, bijvoorbeeld `redesign/experience-v1`. Laat `main` en productie ongemoeid tot expliciete toestemming.
- Lees de actuele code voordat je architectuurbesluiten neemt. Documentatie kan verouderd zijn. Bij tegenspraak heeft de actuele code voorrang als beschrijving van wat *nu* bestaat; deze nieuwe kernbestanden zijn leidend voor wat we *willen bouwen*.
- Begin iedere mijlpaal met een korte aanpak: doel, bestanden, risico's en verwachte demo. Voer vervolgens de afgesproken mijlpaal daadwerkelijk uit, zonder opnieuw in een eindeloze planningsronde te blijven hangen.
- Maak visuele voor-en-na-bewijzen op desktop en mobiel en toon echte interacties. Een gewijzigde CSS-regel is geen bewijs van beter ontwerp.
- Draai tests en builds waar toepasbaar; voeg gerichte regressietests toe voor wijzigingen in de rekenkern.
- Nooit financiële waarden verzinnen of een ontbrekend bronveld als `0` tonen.
- Geen automatische frameworkmigratie, databaselaag of zware 3D-bibliotheek zonder gemotiveerd voorstel en benchmark.
- **Geen commit, push, merge of deployment zonder expliciete toestemming** van de eigenaar. Een lokale werkbranch mag worden voorbereid als de omgeving dat toelaat, maar voor acties met externe impact eerst toestemming vragen.

## 3. Mijlpaal 0 — Vastleggen en nulmeting

**Doel:** weten wat er live staat, wat al werkt en hoe succes gemeten wordt.

### Werk

1. Controleer de repositorystructuur: Vite-multipage, HTML-routes, `src/js`, `src/styles/broadsheet.css`, `data/`, generatoren en tests.
2. Maak een inventaris van calculators, formules, exports, gegenereerde bestanden, URL's en gebruikte browseropslag.
3. Breng tegenstrijdigheden in oude instructies en plandocumenten in kaart; geef per bestand aan: behouden, actueel maken of archiveren.
4. Registreer de huidige homepage en drie kritieke calculators met screenshots op ongeveer 1440px en 375px; leg de belangrijke interacties vast.
5. Leg technische nulwaarden vast: productiebundels, Core Web Vitals of reproduceerbare labmetingen, consolefouten, toegankelijkheid en teststatus.
6. Maak een **SEO-baseline** met Search Console-gegevens per URL en zoekopdracht, idealiter afgelopen 28 en 90 dagen. Als deze niet rechtstreeks toegankelijk zijn: vraag om export in plaats van cijfers te gokken.
7. Noteer de actuele AdSense-status afzonderlijk; de eerdere afwijzing uit augustus is geen bewijs van de status vandaag.

### Oplevering

- `audit/BASELINE.md` met feitelijke nulmeting en onzekerheden.
- `audit/FEATURE_GAP_MATRIX.md`: bestaat / bestaat maar moet veranderen / ontbreekt.
- Screenshots en een compact overzicht van technische risico's.

### Klaar wanneer

De eigenaar kan zien **wat wordt beschermd**, wat ontbreekt en waar het redesign kan beginnen. Er is nog geen productiecode vervangen.

---

## 4. Mijlpaal 1 — Visuele concepten en definitieve richting

**Doel:** eerst de ervaring ontwerpen, niet meteen de bestaande vormgeving patchen.

### Werk

1. Ontwerp drie bewust verschillende hero-varianten binnen de gekozen identiteit **C + A**: luxe minimalistische homepage, premium financiële uitstraling, rustige kleuren.
2. Onderzoek ten minste twee 3D-concepten: **architectonisch huis in bouwlagen** en een **abstracte vertaling van bouwkosten/geldstromen**.
3. Maak van minstens één variant een browserprototype met echte scroll- en klikinteractie. Een statische moodboardafbeelding is onvoldoende om het gedrag te beoordelen.
4. Ontwerp daarnaast één eerste dashboardweergave met relevante bedragen, financiële tijdlijn, invoerpaneel en scenariokaart.
5. Bekijk desktop en mobiel. Bespreek wat indrukwekkend is, wat te druk is en hoe direct de primaire CTA zichtbaar blijft.

### Oplevering

- Drie visuele concepten, met expliciete verschillen.
- Een klik-/scrollbaar homepageprototype.
- Een eerste dashboardprototype.
- Een aangescherpt `DESIGN_SYSTEM.md` met gekozen richting en tokens.

### Beslismoment — **GO/NO-GO ontwerp**

De eigenaar kiest expliciet één richting. **Zonder akkoord wordt de vormgeving niet automatisch over de rest van de site uitgerold.**

### Klaar wanneer

De homepage voelt merkbaar nieuw ten opzichte van de huidige broadsheet-stijl; de eerste dashboardweergave voelt als financieel gereedschap, niet als marketingpagina.

---

## 5. Mijlpaal 2 — Homepage en 3D-beleving in de ontwikkelomgeving

**Doel:** één hoogwaardige ingang bouwen zonder bestaande landingspagina's te blokkeren.

### Werk

- Bouw een nieuwe homepagecompositie op de ontwikkelbranch.
- Plaats een werkend 3D- of lichtgewicht scrollprototype dat het bouwproces betekenisvol visualiseert.
- Maak de keuze **Nieuwbouw**, **Verbouwen / uitbreiden** en **Bouwdepot berekenen** zichtbaar en direct aanklikbaar.
- Maak een duidelijke ingang voor een lopend bouwdepot via menu of relevante context.
- Waarborg dat navigatie werkt zonder WebGL en bij `prefers-reduced-motion`; bied een lichte fallback.
- Lazy-load de animatie waar passend. Voorkom dat de kritieke tekst, knoppen en eerste render op 3D wachten.
- Houd bestaande canonicals, titels, relevante HTML-inhoud en routes in het oog; verander de zoekintentie van `/` niet ondoordacht.

### Oplevering

Een werkende homepage in preview, met voor-en-na-screenshots en korte technische meetresultaten.

### Klaar wanneer

- Op 375px en desktop zijn de hoofdroutes goed bereikbaar.
- De homepage zonder 3D volledig functioneert.
- Toetsenbord en reduced motion bruikbaar blijven.
- Prestaties zijn gemeten tegen de baseline en regressies zijn uitgelegd of opgelost.

**Niet doen:** nu al alle 32 pagina's een nieuwe stijl geven.

---

## 6. Mijlpaal 3 — Nieuwbouwdashboard: één overtuigende volledige ervaring

**Doel:** laten zien waarom BouwdepotCalculator méér is dan losse calculators of een AI-antwoord.

### Werk

1. Ontwerp een compact invoerpaneel voor hypotheek, rente, bouwduur, oude woonlasten en relevante bouwtermijnen.
2. Isoleer en controleer bestaande rekenfuncties; test annuïtair/lineair/aflossingsvrij voor de daadwerkelijk ondersteunde gevallen.
3. Bouw een maand-tot-maandtijdlijn met minimaal hypotheekbetaling, oude woonlast en (indien geldig) depotvergoeding.
4. Toon depotverloop op basis van een expliciet termijnschema.
5. Bouw een leesbare grafiek **én** tabel met dezelfde getallen.
6. Voeg één betrouwbaar scenario toe: **oplevering later** of **extra meerwerk**. Maak duidelijk welke aannames daarbij veranderen.
7. Voeg uitleg toe over bruto/netto, contractafhankelijkheid en wat niet in de uitkomst zit.
8. Maak alle kernfuncties mobiel bruikbaar.

### Oplevering

- Een functioneel dashboard met echte input-output-interactie.
- Gedocumenteerde rekenkern en onafhankelijke testvoorbeelden.
- Voorbeeldscenario's met gecontroleerde uitkomsten.
- Screenshots en korte interactiedemo op mobiel en desktop.

### Beslismoment — **GO/NO-GO productkwaliteit**

De eigenaar beoordeelt niet alleen of het mooi is, maar of hij hiermee zijn financiële situatie daadwerkelijk beter begrijpt.

### Klaar wanneer

Een wijziging in bouwtermijnen, hypotheekrente of opleverdatum consistent doorwerkt in alle relevante bedragen, grafieken en tabellen; grensgevallen geven geen misleidende uitkomsten.

---

## 7. Mijlpaal 4 — Verbouwdashboard

**Doel:** dezelfde premium productervaring aanbieden aan mensen die willen verbouwen of uitbreiden.

### Werk

- Hergebruik gecontroleerde logica uit `verbouwbegroting.html` en relevante financieringscalculators.
- Bouw een begroting met wijzigbare kostenposten, categorieën, eigen geld en reservering voor onvoorziene kosten.
- Toon indicatieve financieringsbehoefte en bruto maandlastverschil, duidelijk gescheiden van inkomens- en bankacceptatie.
- Integreer verifieerbare voorwaarden per geldverstrekker waar van toepassing.
- Voeg een printbaar of exporteerbaar resultaat toe.
- Hergebruik dashboardcomponenten van de nieuwbouwroute; voorkom een tweede, afwijkend ontwerpsysteem.

### Oplevering

Een volledig bruikbare verbouwroute met begroting, relevante inzichten en mobiele weergave.

### Klaar wanneer

Alle subtotalen consistent zijn, scenario's transparant zijn en onbekende bankvoorwaarden niet als feiten verschijnen.

---

## 8. Mijlpaal 5 — Integratie met bestaande website

**Doel:** het nieuwe product verbinden met de bestaande waarde zonder SEO- of functieverlies.

### Werk

1. Behoud bestaande `.html`-URL's waar mogelijk; bepaal per pagina of ze worden gekoppeld, visueel vernieuwd of inhoudelijk behouden.
2. Maak nieuwe dashboards bereikbaar vanuit relevante calculators en informatiepagina's, zonder verplichte onboarding.
3. Sluit herbruikbare bankdata en planningsinformatie aan met bronvermelding en nuance.
4. Werk navigatie, footer, methodepagina en interne links bij.
5. Laat generatoren hun eigen uitvoer beheren; wijzig gegenereerde HTML/JS niet met de hand.
6. Controleer dat de website als geheel één herkenbare identiteit heeft, ook als niet elke secundaire pagina een uitgebreid dashboard krijgt.

### Oplevering

Een lijst met oude en nieuwe routes, regressieresultaten en de gecontroleerde integratie op preview.

### Klaar wanneer

Alle bestaande belangrijke instappunten blijven werken; rekenresultaten zijn aantoonbaar niet stilzwijgend veranderd.

---

## 9. Mijlpaal 6 — SEO, inhoud en AdSense-geschiktheid

**Doel:** het vernieuwde product duurzaam vindbaar en geschikt voor het aangevraagde verdienmodel maken.

### Werk

- Vergelijk kritieke pagina's met de nulmeting: titels, canonicals, indexeerbare inhoud, interne links, sitemaps, robots, redirects en structured data voor zover geldig.
- Controleer of de dashboards inhoudelijk iets bijdragen aan specifieke zoekintenties en niet alleen dezelfde tooltekst herhalen.
- Controleer methodologie, bronvermeldingen, auteurs-/contactinformatie en daadwerkelijke inhoudskwaliteit.
- Verifieer de actuele AdSense-status en het toepasselijke beleid; neem geen minimumaantal indexpagina's als harde Google-eis aan.
- Controleer privacyinformatie, toestemmingsmanagement en Europese CMP-vereisten voor de gebruikte advertentieopzet.
- Bepaal advertentieplekken die geen invoer, uitkomsten of navigatie hinderen.
- Meet laadtijd en Core Web Vitals op de uiteindelijke pagina's.

### Oplevering

`audit/SEO_RELEASE_CHECK.md` en een concreet, actueel AdSense-actieoverzicht.

### Klaar wanneer

De release technisch en inhoudelijk te verdedigen is; er zijn geen bekende kritieke SEO-regressies of privacyproblemen.

---

## 10. Mijlpaal 7 — Release en nazorg

**Doel:** veilig publiceren, kunnen terugdraaien en objectief beoordelen of de vernieuwing helpt.

### Vóór release

- `npm test` en `npm run build` succesvol.
- Financiële regressietests inclusief grensgevallen succesvol.
- Visuele beoordeling op 375px en 1440px; waar mogelijk aanvullende apparaten.
- Browserconsole, toetsenbord, reduced motion en foutafhandeling gecontroleerd.
- URL/canonical/sitemap/robots/redirect-check uitgevoerd.
- Herstelpad naar laatste stabiele productieversie getest of duidelijk gedocumenteerd.
- **Expliciet akkoord van eigenaar** voor merge en deployment.

### Na release

- Controleer kritieke calculators en routes direct op productie.
- Volg Search Console en technische fouten in de daaropvolgende weken.
- Vergelijk klikken en vertoningen per belangrijke URL met de baseline; houd rekening met tijdvertraging, seizoenseffecten en schommelingen.
- Meet daadwerkelijk gebruik van de nieuwe routes en dashboards, voor zover privacyvriendelijk mogelijk.
- Verander niet blind meerdere dingen tegelijk wanneer cijfers schommelen.

### Oplevering

Een beknopt releaseverslag met meetresultaten, bekende beperkingen en eventuele follow-ups.

---

## 11. Later: uitbreidingen na aantoonbaar gebruik

Mogelijke vervolgstappen, niet noodzakelijk voor de eerste release:

- Betere lokale scenario-opslag zonder account.
- Een geïntegreerde dossier-/depotplanner voor lopende bouwdepots.
- Meer bankspecifieke controles en verifieerbare gegevens.
- Verfijnde netto-lastensimulaties na fiscale en juridische validatie.
- Extra contenttools uitsluitend waar echte zoekvraag én bruikbaarheid zijn aangetoond.
- Productverbeteringen op basis van funnelgegevens en echte gebruikersfeedback.

Geen functies toevoegen alleen omdat ze visueel indrukwekkend of eenvoudig te genereren zijn.

## 12. Prioriteit bij beperkte tijd

Wanneer capaciteit beperkt is, geldt:

1. **Visuele richting bewijzen** (mijlpaal 1).
2. **Nieuwe homepage zonder SEO-schade** (mijlpaal 2).
3. **Eén werkend, betrouwbaar nieuwbouwdashboard** (mijlpaal 3).
4. Pas daarna verbouwen, breed uitrollen en extra functies.

Deze volgorde is bewust: een nieuw kleurtje over dertig pagina's verandert het product niet. Een sterke homepage met een echt bruikbaar dashboard wel.

## 13. Verplichte overdracht na elke mijlpaal

Claude levert aan de eigenaar steeds hetzelfde compacte overzicht:

```text
Mijlpaal:
Gerealiseerd:
Gewijzigde bestanden:
Wat je kunt bekijken in de preview:
Belangrijkste ontwerpkeuzes:
Rekenkundige controles en uitkomsten:
Tests / build / toegankelijkheid / prestaties:
SEO-effect of risico:
Wat nog ontbreekt:
Beslissing nodig van eigenaar:
```

Maak expliciet onderscheid tussen **gebouwd**, **getest**, **visueel beoordeeld** en **live**. Noem iets pas af wanneer het bijbehorende acceptatiecriterium gehaald is.

## 14. Startopdracht voor Claude Code — alleen na goedkeuring van documentatie

> Lees `PRODUCT_VISION.md`, `DESIGN_SYSTEM.md`, `USER_EXPERIENCE.md`, `FEATURES.md`, `TECHNICAL_ARCHITECTURE.md`, `SEO_ADSENSE.md`, `ROADMAP.md` en de nieuwe `CLAUDE.md`. Inspecteer vervolgens de actuele repository. Start uitsluitend met **mijlpaal 0**, rapporteer werkelijke codebevindingen en tegenstrijdigheden in de oude documentatie, en maak een onderbouwd voorstel voor mijlpaal 1. Wijzig niets aan productie of `main`. Begin niet alvast met een brede CSS-migratie. Vraag pas om ontwerpbeslissingen nadat je alternatieven duidelijk hebt gepresenteerd.

**Samenvatting:** we bouwen niet alles ineens, maar we bouwen wél per fase een volledig, overtuigend onderdeel. Financiële juistheid, SEO-behoud en eigen ontwerpkeuzes zijn voorwaarden — geen bijzaak.