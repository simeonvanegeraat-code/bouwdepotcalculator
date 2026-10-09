# SEO_ADSENSE.md — BouwdepotCalculator.nl

**Versie:** 1.0 — concept voor goedkeuring  
**Datum:** 9 oktober 2026  
**Doel:** een meetbare, duurzame strategie voor organisch verkeer en Google AdSense zonder de productkwaliteit of bestaande Google-posities te ondermijnen.  
**Samenhang:** `PRODUCT_VISION.md`, `DESIGN_SYSTEM.md`, `USER_EXPERIENCE.md`, `FEATURES.md`, `TECHNICAL_ARCHITECTURE.md`.

---

## 1. Commercieel uitgangspunt

BouwdepotCalculator.nl moet onafhankelijk en gratis bruikbaar blijven. Het primaire verdienmodel is **Google AdSense**, maar advertenties mogen de financiële kernfunctionaliteit niet verstoren. We optimaliseren eerst voor nuttige antwoorden en herhaalbare gebruikswaarde, dan voor organische vindbaarheid en vervolgens voor advertentie-opbrengst.

Het onderscheidend vermogen is niet het aantal artikelen of calculators, maar de combinatie van:
- inzichtelijke, controleerbare financiële berekeningen;
- interactieve maand-tot-maandtijdlijnen en scenario's;
- betrouwbare brongegevens over geldverstrekkers;
- praktische uitleg bij echte problemen rond nieuwbouw, verbouwen en bouwdepots.

De minimalistische homepage met 3D-verhaal is een merk- en conversiemiddel. De specifieke SEO-landingspagina's blijven belangrijke, direct bruikbare ingangen.

## 2. Nulmeting: bekend versus onbekend

**Bekend uit gedeelde Search Console-screenshots van oktober 2026:**
- Het domein genereert organisch Google-verkeer: de gebruiker meldt circa 10–15 klikken per dag.
- Een getoonde periode van ongeveer drie maanden liet 943 klikken zien.
- Een zoekfilter rond 'bouwdepot...' liet voor 28 dagen 82 klikken, circa 10,3% CTR en gemiddelde positie 3,2 zien.
- De positie en CTR gelden voor het **geselecteerde filter**, niet voor de gehele site.

**Nog te verifiëren via export uit Search Console:**
- klikken, vertoningen, CTR en positie per URL én zoekopdracht over 3/6/12 maanden;
- geïndexeerde en uitgesloten URL's en de actuele redenen;
- verdeling apparaat, land en zoekintentie;
- zoekopdrachten met hoge vertoningen en lage CTR;
- pagina's waarop klikken toenemen of afnemen;
- daadwerkelijke AdSense-goedkeuringsstatus en meldingen;
- analytics-gebruik: instroom, toolstart, berekening voltooid, overstap naar dashboard, terugkerende bezoeken.

**Niet doen:** uit enkele screenshots volledige groeitrends, advertentie-RPM, crawlbudget of conversieratio's afleiden.

### Baselinebestand

Maak vóór de redesign een gedateerde export en snapshot. Sla bij voorkeur geaggregeerde, privacyvriendelijke cijfers op in een projectdocument, niet in de publieke gebruikersinterface. Vergelijk 28-dagenperiodes met voorafgaande periodes én vergelijkbare seizoensperiodes waar beschikbaar. Houd rekening met nieuwe versus oude pagina's.

## 3. SEO-informatiearchitectuur

### 3.1 Drie lagen

**Laag A — Directe rekentools met specifieke zoekintentie:**
- `bouwdepot-berekenen.html`
- `nieuwbouw.html`
- `dubbele-lasten-nieuwbouw.html`
- `bouwrente-nieuwbouw.html`
- `verbouwbegroting.html`
- `depotplanner.html`
- plus de overige bestaande calculators, na complete route-inventarisatie.

**Laag B — Inhoudelijke uitleg en vraaggestuurde gidsen:** uitleg van bouwdepot, financiële lasten tijdens bouw, declaraties, rente en begrippen; inhoud moet de vraag beantwoorden en aantoonbare meerwaarde bieden boven een getalsom of herschreven standaardtekst.

**Laag C — Brongegevens en geldverstrekkervergelijking:** bankvoorwaarden, nuances, herkomst, controledatum en praktische toepasbaarheid. Gebruik geen conclusies die de bron niet dekt.

### 3.2 Nieuwe dashboards

De nieuwbouw- en verbouwdashboards zijn productbestemmingen, geen vervanging van alle bestaande zoekpagina's. Elke directe calculator moet op zijn eigen URL bruikbaar blijven. Verwijs vanuit de uitkomst naar het relevante dashboard als verdieping.

De homepage moet het merk, de belangrijkste routes en de rekenmogelijkheden duidelijk uitleggen in zichtbare HTML. Laat de primaire inhoud en navigatie niet alleen via 3D, canvas, scrolltriggers of client-side rendering beschikbaar zijn.

## 4. Onderzoeksagenda voor nieuwe zoekvragen

Onderzoek, **zonder onbevestigde zoekvolumes te presenteren**, onder meer:

| Thema | Mogelijke vraag | Productantwoord |
|---|---|---|
| Nieuwbouw | dubbele lasten nieuwbouw berekenen | maand-tot-maandoverzicht |
| Nieuwbouw | bouwtermijnen nieuwbouw berekenen | depot- en geldstroomtijdlijn |
| Nieuwbouw | extra kosten nieuwbouwwoning | interactieve meerwerk-/opleveringsbegroting |
| Nieuwbouw | bouwvertraging kosten | scenariovergelijking |
| Verbouwen | verbouwing begroting maken | begroting per onderdeel |
| Verbouwen | uitbouw financieren | indicatief financieringsgat en maandlast |
| Bouwdepot | bouwdepot kosten per maand | directe calculator |
| Bouwdepot | bouwdepot rentevergoeding | uitleg gekoppeld aan bankvoorwaarden |
| Bouwdepot | bouwdepot factuur afgewezen | stappen, uitzonderingen en bronverwijzingen |

**Prioriteringsmethodiek:** (1) Search Console-bewijs, (2) duidelijk probleem en zoekintentie, (3) vermogen om unieke interactieve waarde te leveren, (4) inhoudelijk correct te onderhouden, (5) natuurlijke verbinding met andere modules. Google Trends en keywordtools mogen aanvullend zijn, maar zijn geen bewijs voor concrete omzet.

Geen generieke stads-, bedrag- of bankvarianten massaal genereren met vrijwel dezelfde tekst. Een aparte URL moet aantoonbaar een andere gebruikersvraag, dataset of betekenisvolle functie bedienen.

## 5. On-page SEO en inhoudelijke kwaliteit

Voor iedere belangrijke landingspagina:
1. Eén begrijpelijke H1 die de zoekvraag beschrijft.
2. In de eerste sectie een direct bruikbaar antwoord, calculator of overzicht.
3. Heldere inleiding: wat wordt berekend en wat niet?
4. Betekenisvolle, unieke uitleg die op specifieke gevallen ingaat.
5. Verifieerbare bronnen en onderhoudsdatum waar feiten of voorwaarden veranderlijk zijn.
6. Formules, aannames en beperkingen bij financiële uitkomsten.
7. Logische interne links naar verdieping en gerelateerde tools.
8. Unieke title, description en juiste canonical; geen keyword stuffing.
9. Leesbare semantische HTML, zodat basale inhoud zonder JavaScript beschikbaar blijft.
10. Indien toepasbaar: gestructureerde gegevens alleen als ze werkelijk overeenkomen met zichtbare inhoud en Google's regels.

**Bewijslast:** geen fictieve expertise, reviews, waarderingen, keurmerken of 'officiële' partnerships suggereren. De auteur, het doel en de methodologie mogen zichtbaar zijn maar zijn geen vervanging voor inhoudelijke kwaliteit.

## 6. Migratie zonder onnodig SEO-verlies

**Standaardregel: behoud bestaande URLs.** De geplande ontwerpverbetering is geen reden om iedere URL te hernoemen, de hele routing te vervangen of indexeerbare tekst achter een canvas te zetten.

Vóór een release:
- Exporteer route-inventaris, sitemap, canonicals, indexeerbare titles/H1, interne links en top-landingspagina's.
- Bepaal per bestaande URL: behouden, inhoud verbeteren of alleen met onderbouwde reden verplaatsen.
- Neem oude route- en querycombinaties op in regressietests.
- Test 200-status, geen onbedoelde `noindex`, robotsregels, canonical, mobiel laden en output zonder 3D.
- Gebruik bij noodzakelijke permanente verhuizing een server-side 301/308 naar het meest relevante nieuwe doel; vermijd redirectketens.
- Werk sitemap, interne links en canonical mee bij en monitor na livegang Search Console.
- Houd productie en preview strikt gescheiden en voorkom indexatie van voorlopige kopieën.

**Niet beloven:** dat elke huidige ranking gegarandeerd behouden blijft. Zelfs een zorgvuldig uitgevoerde redesign kan schommelingen veroorzaken. Daarom gefaseerd publiceren en monitoren.

## 7. Technische SEO en prestaties

De live-ervaring moet snel en volledig bruikbaar zijn **zonder dat 3D geladen is**.

- Statische indexeerbare tekst voor primaire content.
- 3D/animatie progressief laden, met lichtgewicht poster en `prefers-reduced-motion`.
- Geen scroll-jacking en geen animatie die content of primaire CTA verbergt.
- Responsief op mobiel met voldoende contrast en goed leesbare invoer.
- Correcte labels, toetsenbordnavigatie en tekstuele grafiekalternatieven.
- Monitor Core Web Vitals via echte gebruiksdata waar voldoende verkeer bestaat; hanteer gangbare richtwaarden (LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1 op het 75e percentiel) als streefwaarden, geen harde garantie.
- Meet de extra netwerkbytes en JS/3D-last van de nieuwe homepage vergeleken met de baseline.

## 8. AdSense: reële toelatingscriteria

Google beschrijft **originele inhoud van hoge kwaliteit** en naleving van programmabeleid als belangrijke deelnamevereisten. Er is geen publiek vastgelegd minimum van 20 geïndexeerde pagina's of vast bezoekersaantal dat automatisch goedkeuring geeft.

Controleer vóór aanvraag of herbeoordeling:
- de site gebruikt eigen, nuttige inhoud en werkende functionaliteit;
- navigatie, interne links en mobiel gebruik in orde zijn;
- geen beleidsstrijdige, misleidende, gekopieerde of dunne pagina's domineren;
- privacy- en contactinformatie kloppen;
- de eigenaar de website kan verifiëren en technische AdSense-inrichting klopt;
- het account en de exacte afwijzingsmelding zijn gecontroleerd;
- toestemming en advertentie-inrichting conform actuele vereisten zijn geregeld.

**Actuele officiële bronnen:**
- AdSense eligibility: https://support.google.com/adsense/answer/9724?hl=nl
- Google publisher consent requirements: https://support.google.com/adsense/answer/13554116?hl=nl
- CMP / privacy messaging: https://support.google.com/adsense/answer/7670013?hl=nl

### Correctie op oud projectplan

Het oudere `plannen/ADSENSE-PLAN.md` stelde onder andere dat 20+ geïndexeerde pagina's vereist zouden zijn en dat goedkeuring daarna een formaliteit wordt. **Behandel dat niet als feit of huidig beleid.** Ook de diagnose 'crawlbudget is de oorzaak' mag niet als bewezen worden overgenomen op basis van oude screenshots. Controleer in de actuele Search Console en AdSense-interface welke problemen daadwerkelijk zijn gemeld.

## 9. Privacy, toestemming en advertenties in Nederland/EER

Google vereist voor publishers die gepersonaliseerde advertenties tonen aan bezoekers in de EER, het VK en Zwitserland een **door Google gecertificeerde CMP met IAB TCF-integratie**. Controleer bovendien welke toestemming voor cookies en verwerking wettelijk en volgens Google's beleid nodig is. Een zelf ontworpen cookiebanner is niet automatisch toereikend.

**Implementatie-afspraken:**
- Kies en configureer een geschikte gecertificeerde CMP; controleer werking in EER-context.
- Laat advertentie- en analytics-tags de consentstatus correct respecteren.
- Bezoekers moeten een begrijpelijke keuze kunnen maken en deze kunnen wijzigen.
- Privacybeleid en cookie-uitleg moeten overeenkomen met daadwerkelijke scripts en lokale opslag.
- Vraag geen persoonsgegevens in een rekenformulier die niet nodig zijn voor de berekening.
- Voorkom dat financieel gevoelige invoer in analytics-events, advertentieparameters of URL's terechtkomt.

De juridische en platformcontrole moet vóór livegang worden geactualiseerd; dit document is geen vervanging voor juridisch advies.

## 10. Advertentieplaatsing zonder schade aan rekentools

**Voorgestelde aanpak na goedkeuring:**
- Op informatieve pagina's: beperkt aantal logisch geplaatste advertenties tussen inhoudsblokken.
- Op calculators: advertenties naast of onder de daadwerkelijke taak, niet tussen veld en uitkomst.
- In dashboards: geen advertentie over grafiek, sticky resultaat, invoer of export.
- Geen opdringerige interstitials, misleidende advertentieknoppen of onverwachte layoutverschuiving.
- Reserveer indien passend ruimte voor advertenties om CLS te beperken.
- Test mobiel afzonderlijk en volg Google-beleid voor advertentieplaatsing.

Eerst de ervaring vastleggen zonder advertenties, daarna advertentieruimte ontwerpen en op werkelijke impact meten.

## 11. Inkomstenmodel: scenario's, geen beloftes

**Definitie:** pagina-RPM = (geschatte advertentie-inkomsten / paginaweergaven) × 1.000.

Onderstaande cijfers zijn **rekenvoorbeelden**, geen actuele markttarieven of prognose voor dit domein. Neem 30 dagen per maand aan.

| Paginaweergaven per dag | €3 pagina-RPM | €8 pagina-RPM |
|---:|---:|---:|
| 100 | €9/maand | €24/maand |
| 500 | €45/maand | €120/maand |
| 1.000 | €90/maand | €240/maand |
| 3.000 | €270/maand | €720/maand |

**Belangrijk:** Google Search-klikken zijn niet hetzelfde als paginaweergaven. Niet elke bezoeker bekijkt meerdere pagina's of ontvangt advertenties. RPM varieert met land, seizoen, apparaat, type advertentie, consent en vraag van adverteerders.

Het oorspronkelijke inkomensdoel kan als eerste ambitie worden geformuleerd, bijvoorbeeld structureel circa €1/dag. Dat wordt pas een KPI als er voldoende meetgegevens en een werkende AdSense-inrichting bestaan.

## 12. KPI's en meetplan

### Verkeer en vindbaarheid
- Zoekklikken en vertoningen per relevante pagina en zoekintentie.
- CTR en gemiddelde positie met segmentatie, nooit alleen sitebreed.
- Indexatie van primaire routes; nieuwe crawlfouten en redirectproblemen.
- Verandering in organische landingspagina's na een release.

### Productkwaliteit
- Percentage bezoeken dat een calculator start (alleen geaggregeerd).
- Percentage starts met een geldige uitkomst.
- Gebruik van scenariovergelijkingen en exports.
- Overgang tussen specifieke rekenpagina en dashboard.
- Prestatiemetrieken en technische foutpercentages.

### AdSense (wanneer beschikbaar)
- Pageviews en advertentie-impressies.
- Werkelijke pagina-RPM, inkomsten per sessie en consentverdeling waar geoorloofd.
- UX-veranderingen bij advertentieplaatsingen.

**Privacy-afspraak:** geen ingevoerde hypotheekbedragen, huisadressen of persoonlijke scenario's onnodig naar analytics versturen. Meet gebeurtenissen zoals `calculator_started`, `result_shown`, `scenario_compared` met veilige generieke metadata en consent waar nodig.

## 13. SEO- en inkomstenexperimenten

Laat Claude voorstellen formuleren als hypothese met meetperiode en stopcriteria. Voorbeelden:
1. Nieuwe, duidelijkere title/intro op een pagina met hoge vertoningen maar relatief lage CTR.
2. Van specifieke calculator naar uitgebreid dashboard linken bij de uitkomst.
3. Een nieuwe unieke tool bouwen voor een querycluster met aantoonbare vraag.
4. Twee advertentieposities vergelijken **nadat** de site is goedgekeurd en er genoeg verkeer is.

Verander niet tegelijk de titel, layout, URL, inhoud en interne links van alle pagina's: dan is effect nauwelijks te duiden.

## 14. Gefaseerde uitvoer

**Fase 0 — Meten:** Search Console- en analytics-baseline maken, actuele AdSense-status opvragen, huidige technische SEO controleren.

**Fase 1 — Ontwerp en prototype:** nieuwe homepage en één nieuwbouwdashboard op preview; geen productie-URL's veranderen.

**Fase 2 — Financiële waarde:** rekenkwaliteit, onderscheidende tijdlijn en scenariofunctie afronden, unieke inhoud en bronnen verifiëren.

**Fase 3 — Gecontroleerde release:** tests, Core Web Vitals, indexeerbare HTML, sitemap, canonical en interne links controleren; gefaseerd publiceren.

**Fase 4 — AdSense:** inhoud en beleid nalopen, CMP en technische inrichting controleren, (her)aanvragen waar relevant en echte opbrengsten meten.

**Fase 5 — Groei:** prioriteiten sturen op Search Console-vragen en gebruik van het product; advertenties alleen opschalen bij gezonde UX.

## 15. Acceptatiecriteria voor Claude Code

- [ ] Baseline is gedateerd en gescheiden van aannames.
- [ ] Huidige routes en canonicals zijn geïnventariseerd.
- [ ] Kritieke rekenpagina's zijn rechtstreeks bruikbaar.
- [ ] De nieuwe homepage bevat relevante crawlbare tekst zonder afhankelijkheid van 3D.
- [ ] Ontwerp- en routerwijzigingen hebben SEO-regressiechecks.
- [ ] Nieuwe inhoud is uniek en heeft aantoonbare gebruikerswaarde.
- [ ] Financiële bronclaims zijn verifieerbaar en gedateerd.
- [ ] CMP, scripts, privacybeleid en AdSense-inrichting zijn nagekeken.
- [ ] Ads verdringen geen invoervelden, uitkomsten of mobiele navigatie.
- [ ] Geen ongegronde claims van gegarandeerde rankings, indexatie of AdSense-goedkeuring.
- [ ] Publicatie alleen na menselijke review en toestemming.

---

## 16. Bronnen en wijzigingsdiscipline

Officiële Google-documentatie is leidend voor productbeleid en zoekrichtlijnen. Controleer bronnen opnieuw vlak vóór publicatie, omdat Google beleid en functionaliteit kan wijzigen:

- Google AdSense — deelnamevereisten: https://support.google.com/adsense/answer/9724?hl=nl
- Google AdSense — CMP-vereisten: https://support.google.com/adsense/answer/13554116?hl=nl
- Google AdSense — CMP en toestemmingsbeheer: https://support.google.com/adsense/answer/7670013?hl=nl
- Google Search Central — documentatie: https://developers.google.com/search/docs
- Google Search Central — websiteverhuizingen en URL-migraties: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes

Besluiten over SEO of AdSense worden vastgelegd met **wat is gemeten, welke bron gebruikt is en op welke datum**. Verouderde projectanalyses zijn naslagmateriaal, niet automatisch actuele instructies.

**Kernbesluit:** eerst een beter, eerlijker en meetbaar nuttig product; organisch verkeer beschermen; daarna advertenties gecontroleerd laten bijdragen aan inkomsten.
