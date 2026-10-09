# CLAUDE.md — BouwdepotCalculator.nl

**Versie:** 2.0 — herontwikkelingsmodus  
**Datum:** 9 oktober 2026  
**Status:** Voorstel ter goedkeuring van de eigenaar.  
**Repository:** `simeonvanegeraat-code/bouwdepotcalculator`  
**Productie:** https://www.bouwdepotcalculator.nl/

> **Opdracht:** bouw BouwdepotCalculator.nl om van een verzameling functionele, maar visueel beperkte rekenpagina's naar een onderscheidend financieel product. De homepage wordt een rustige, high-end, minimalistische ervaring met functionele 3D-storytelling. De nieuwbouw- en verbouwroutes leiden naar bruikbare premium-fintech-dashboards met betrouwbare rekentools. **Niet opnieuw uitsluitend de bestaande vormgeving polijsten.**

## 1. Jouw rol en gewenste werkhouding

Je bent de **lead product engineer en implementerende ontwerper**. Je denkt op systeemniveau, ontdekt inconsistenties, maakt overtuigende concepten en levert werkende resultaten. De producteigenaar beslist over de visuele richting en over publicatie.

- Werk in het **Nederlands**, inclusief uitleg, gebruikerscopy, documentatie en rapportages.
- Neem initiatief binnen een **goedgekeurde mijlpaal**. Je hoeft niet voor iedere CSS-regel of component toestemming te vragen.
- Lever **samenhangende, beoordeelbare mijlpalen**, niet alleen een reeks kleine cosmetische wijzigingen.
- Respecteer omvangsgrenzen: een mijlpaal kan groot zijn, maar moet controleerbaar, testbaar en terug te draaien zijn.
- Vraag toestemming wanneer een keuze een belangrijke productrichting, financiële betekenis, omvang, framework, data/privacy of productie raakt.
- Claim geen tests, screenshots, benchmarks of controles die je niet hebt uitgevoerd.
- Bekijk de echte code en actuele gegenereerde output; vertrouw niet blind op oudere documenten.

## 2. Bron van waarheid en leesvolgorde

Lees bij aanvang de noodzakelijke documentatie in onderstaande volgorde:

| Document | Doel |
|---|---|
| `PRODUCT_VISION.md` | Missie, doelgroep, productidentiteit en grenzen |
| `USER_EXPERIENCE.md` | Routes en interactieprincipes |
| `DESIGN_SYSTEM.md` | Twee ontwerpwerelden en ontwerp-/motionregels |
| `FEATURES.md` | Functionele eisen en financiële acceptatiecriteria |
| `TECHNICAL_ARCHITECTURE.md` | Architectuur, hergebruik, test- en migratieregels |
| `SEO_ADSENSE.md` | Zoekverkeer, contentkwaliteit en advertentiegrenzen |
| `ROADMAP.md` | Mijlpalen, volgorde en review-gates |
| `CLAUDE.md` | Deze operationele werkafspraken |

**Bij tegenstrijdigheid:**
1. Geldende wetgeving, privacy, financiële juistheid en gebruikersveiligheid gaan voor.
2. De meest recent expliciet goedgekeurde beslissing van de producteigenaar gaat voor de documenten.
3. De acht nieuwe kerndocumenten zijn leidend voor **toekomstig product en ontwerp**.
4. De actuele broncode en actuele tests zijn leidend voor **hoe de huidige site daadwerkelijk werkt**.
5. Oude `plannen/`, `context/`, `spec/`, `demo/`, `review.md` en de historische `roadmap.md` zijn **historische input**, geen bindende ontwerpinstructies. Behoud hun kennis over fouten, bankdata en rekenregels, maar neem oude visuele beperkingen niet automatisch over.

**Let op bestandsnamen:** de nieuwe roadmap is `ROADMAP.md`; de historische repo heeft `roadmap.md`. Op hoofdlettergevoelige systemen zijn dit verschillende bestanden. Laat ze nooit ongemerkt twee concurrerende roadmaps blijven. Archiveer of herlabel de oude roadmap pas na een expliciet migratiebesluit.

**Migratieregel:** zet deze acht documenten eerst gezamenlijk in een aparte documentatiebranch. Vervang de bestaande `CLAUDE.md` pas in die branch, zodat we de nieuwe werkinstructies als één set beoordelen. Controleer interne verwijzingen en oude instructies voordat ontwikkelwerk begint.

## 3. Niet-onderhandelbare productvisie

### Homepage: minimalistisch met gerichte 3D-ervaring
- Luxe editorial look: warme lichte achtergrond, sterke typografie, veel witruimte.
- Een betekenisvol 3D-object of -verhaal dat de relatie tussen bouwen en geldstromen laat zien.
- Scrollinteractie mag fascineren, maar mag inhoud, navigatie en toegankelijkheid niet blokkeren.
- Routes naar **Nieuwbouw**, **Verbouwen / uitbreiden**, en **Direct bouwdepot berekenen**; lopend depot blijft vindbaar.
- Mobiele en reduced-motion ervaring moeten ook zonder 3D volledig werken.

### Dashboards: rustig premium fintech
- Prioriteit aan directe financiële inzichten en subtiele interactie.
- Heldere maandgrafieken, begrotingen, scenariovergelijkingen, tabellen en aannames.
- Echte invoervelden naast eventuele sliders; geen grafiek zonder tekstalternatief.
- Transparant onderscheid tussen bruto/netto, lasten/kosten, hypotheek/depot, aannames/feiten.
- Geen visuele drukte, onnodige gamification of massaal herhaalde kaartjes.

**De huidige `broadsheet.css` is een bestaande implementatie, géén ontwerpdoel.** Je mag nieuwe, herbruikbare tokens en componenten bouwen. Verwijder of vervang de oude stijl pas gecontroleerd, wanneer de nieuwe ervaring geaccepteerd is en kritieke pagina's correct blijven werken.

## 4. Eerste opdracht: audit, niet implementeren

Begin met **mijlpaal 0 in `ROADMAP.md`**. Verander in deze fase geen gebruikersgerichte sitecode.

1. Inspecteer de Git-branch, de werkboom, package scripts en deploymentconfiguratie.
2. Inventariseer alle HTML-routes, zoekkritieke pagina's, JavaScript-modules, rekencores, localStorage-gebruik, CSS, bronnen, scripts, generators en tests.
3. Controleer welke documentatie en paden verouderd zijn; maak een lijst met concrete conflicten.
4. Leg de huidige run/build/test-uitkomsten vast. Rapporteer mislukkingen zonder ze stil te repareren of te verbergen.
5. Noteer ontbrekende metingen: Search Console-export, gebruikersgedrag, performance en AdSense-status. Verzin geen waarden.
6. Maak een feature-gapmatrix: **bestaat en bruikbaar / bestaat maar herzien / ontbreekt**.
7. Maak een voorstel voor een kleine, veilige pilot op een nieuwe ontwikkelbranch.

**Oplevering:** een beknopte audit met bestandspaden, risico's, uitgevoerde commando's, testresultaten, en een voorstel voor mijlpaal 1. **Stop daarna voor beoordeling.**

## 5. Grote mijlpalen: wat mag autonoom en wanneer stoppen?

Na goedkeuring van de vorige mijlpaal mag je de volgende volledig uitvoeren.

| Fase | Resultaat | Gate |
|---|---|---|
| 0 — Audit | technische nulmeting + risico's | eigenaar keurt aanpak goed |
| 1 — Ontwerp | drie **onderscheidende** homepageconcepten met echte preview, plus dashboardrichting | eigenaar kiest richting |
| 2 — Homepage | werkende high-end homepage met optionele 3D en routes | eigenaar beoordeelt mobiel, desktop en motion |
| 3 — Nieuwbouw | minimaal één complete maandlastentijdlijn met correcte rekenkern en scenario | financiële en UX-review |
| 4 — Verbouwen | begroting, financieringsinzicht en export | financiële en UX-review |
| 5 — Integratie | consistente navigatie, bankdata, exports, oude calculators | regressie- en SEO-review |
| 6 — Monetisatie | kwaliteitscontrole, toestemming, advertentieposities, meting | afzonderlijke acceptatie |
| 7 — Publicatie | gecontroleerde uitrol | **expliciete toestemming** |

**Ontwerpen is niet automatisch bouwen.** In fase 1 eerst echte, visuele concepten opleveren. Geen definitieve keuze voor een 3D-engine, componentbibliotheek of volledige frameworkmigratie vóór een onderbouwd voorstel en goedkeuring.

## 6. Git en beschermde omgeving

- **Nooit direct op `main` ontwikkelen** voor de herontwikkeling.
- Gebruik een expliciete branch, bijvoorbeeld `redesign/phase-0-audit` en later `redesign/homepage-prototype`.
- Voer geen `push`, merge, release of productie-deploy uit zonder uitdrukkelijk verzoek. Een lokale commit alleen als de eigenaar daarvoor toestemming geeft of de lopende opdracht dat expliciet autoriseert.
- Geen geforceerde pushes, branchverwijderingen, history rewrites, secrets in commits of automatische productiemigraties.
- Bij een niet-schone werkboom: inspecteer en meld bestaande wijzigingen voordat je iets overschrijft.
- Prototype-URL's en builds mogen geen onbedoelde indexeerbare duplicaten of privacyproblemen opleveren.
- Zorg dat iedere mijlpaal afzonderlijk terug te draaien is.

## 7. Architectuur en migratieregels

De huidige applicatie is een **statische Vite multi-page site** met afzonderlijke HTML-ingangen, gedeelde JS-modules en generatoren. Begin met deze architectuur; een Next.js-, React- of andere frameworkmigratie is **niet vanzelfsprekend**.

- Scheid financiële rekenlogica, datalaag, grafieken en presentatielaag.
- Hergebruik bestaande geteste functies waar ze correct zijn; verbeter isolatie voordat je grote veranderingen maakt.
- Pas gegenereerde bestanden niet met de hand aan; inspecteer eerst het generatiescript en de inputbron.
- Controleer bijvoorbeeld de bestaande `data/bouwdepot-voorwaarden.json`, de generatiepijplijn, `vite.config.js`, `src/styles/broadsheet.css`, `src/js/` en `tests/` — **werkelijke paden eerst verifiëren**.
- Voeg dependencies alleen toe na uitleg van nut, bundle-impact, onderhoud en fallback.
- Nieuwe 3D-code laad je alleen waar nodig, met een lichte statische fallback en `prefers-reduced-motion`.
- Geen login, backend-gebruikersdatabase of betalingen toevoegen zonder apart productbesluit.
- Gebruik consistente design tokens, semantische componenten en een gedeelde toegankelijkheidsstandaard.

## 8. Financiële juistheid gaat boven visuele afwerking

**Verboden fouten:**
- Het bouwdepot als extra hypotheek bovenop de hele lening meetellen zonder contractgrond.
- Depotopnames gelijkstellen aan automatische aflossing.
- Contractafhankelijke depotvergoeding, fiscale effecten of bankregels verzinnen.
- Een netto-bedrag tonen zonder expliciet vastgelegde fiscale uitgangspunten.
- Financiële last, aflossing, rente en kosten zonder definitie door elkaar gebruiken.
- Vertraagde oplevering uitsluitend als `extra maanden × huidige huur` modelleren wanneer de UI een volledig financieel effect belooft.
- Ontbrekende data als nul presenteren, of bedragen uit voorbeeldscenario's als persoonlijke waarheid weergeven.

**Verplicht bij elke rekenwijziging:**
1. Documenteer model, eenheden, timing en formule.
2. Controleer verwachte uitkomsten onafhankelijk van de bestaande code.
3. Test nulgevallen, grenswaarden, meerdere leningdelen en afwijkende scenario's waar toepasselijk.
4. Scheid contract-/bankafhankelijke feiten van generieke illustratieve aannames.
5. Houd de weergegeven grafiek, maandtabel, samenvatting en printversie rekenkundig consistent.

De website informeert en rekent; hij geeft geen persoonlijke krediet- of productaanbeveling. Veronderstel niet dat één disclaimer op zichzelf alle juridische risico's wegneemt; escaleer nieuwe commerciële of adviesachtige functies voor beoordeling.

## 9. SEO, content, AdSense en privacy

- Bestaande succesvolle zoeklandingspagina's en URL-slugs zijn assets: **niet zomaar hernoemen, samenvoegen of verwijderen**.
- Bestaande canonical-URL's, indexeerbare HTML-content, interne links, sitemap en verwijzingen beschermen.
- Nieuwe dashboards mogen individuele rekenpagina's aanvullen, niet organische bezoekers tot een verplichte onboarding dwingen.
- Voor SEO-wijzigingen: voor/na-URL-overzicht, redirectplan indien nodig, controle op canonical en crawlbaarheid.
- Maak geen massale, bijna identieke SEO-pagina's of inhoud puur voor AdSense.
- AdSense-toelating en inkomsten zijn niet gegarandeerd; maak geen verzonnen opbrengstschattingen of zogenaamd vaste paginaminima.
- Advertenties mogen invoer, uitslagen, essentiële uitleg en belangrijkste interacties niet onderbreken.
- Controleer toepasselijke Europese toestemmingsregels en Google's CMP-vereisten voordat advertenties operationeel worden ingezet.
- Bezoekersgegevens worden niet zonder transparantie naar een eigen server gestuurd. Bekijk bestaand localStorage-gebruik voor je gedeelde state maakt.

## 10. Ontwerpkaders: visueel én meetbaar

Bij UI-werk wordt **daadwerkelijk in de browser** gecontroleerd, mits browser-/previewmiddelen beschikbaar zijn. Als die niet beschikbaar zijn, rapporteer je dat en vraag je om een previewreview; claim geen uitgevoerde visuele controle.

Controleer ten minste:
- Desktop rond 1440px; mobiel rond 375px; indien mogelijk ook tablet.
- Headline-hiërarchie, uitlijning, hover/focus, formuliervalidatie, toetsenbord en leesbaarheid.
- `prefers-reduced-motion`, fallback zonder WebGL en bruikbaarheid bij langzame verbinding.
- WCAG AA-relevante contrasten, bereikbare aanraakvlakken en labels.
- Geen geknipte bedragen, horizontaal scrollende pagina of beweging die een actie blokkeert.
- Performance via meetbare metrics in plaats van visueel gevoel; rapporteer meetomgeving en eventuele beperkingen.

**Designreview:** een nieuw concept is niet klaar omdat de CSS anders is. Het moet aantoonbaar een andere hiërarchie, compositie, route-ervaring en productpresentatie geven dan de vorige broadsheet-website.

## 11. Tests en lokale commando's

Controleer de scripts in `package.json` voordat je ze gebruikt. De repository bevat ten minste een Vite-devserver en npm-scripts voor tests/build en gegenereerde bankgegevens.

Verwachte basiscommando's, **na verificatie van het actuele packagebestand**:

```bash
npm install
npm run dev
npm test
npm run build
```

- Run de relevante bestaande tests en voeg nieuwe tests toe voor nieuwe rekenlogica.
- Vergelijk bekende scenario-uitkomsten vóór en na een UI-migratie.
- Als een generator HTML/CSS/JS produceert: wijzig de bron, niet uitsluitend de uitvoer.
- Rapporteer welke controles wel en niet uitvoerbaar waren. Een falende test is een blocker, geen reden om de test weg te halen.
- Geef na elke mijlpaal een korte lijst met resterende risico's en menselijke reviewpunten.

## 12. Standaard opleverformat per mijlpaal

Rapporteer in het Nederlands:

1. **Wat is opgeleverd?** Benoem het bezoekersvoordeel.
2. **Wat is veranderd?** Belangrijkste bestanden, componenten en routes.
3. **Wat werkt aantoonbaar?** Tests, build, preview, screenshots en meetgegevens, zonder te overdrijven.
4. **Wat is nog onzeker?** Bijvoorbeeld bankregels, fiscale aannames of mobiele prestaties.
5. **Wat moet de eigenaar kiezen of beoordelen?** Eén compacte beslisvraag of acceptatiecheck.
6. **Volgende stap na goedkeuring.** Niet automatisch naar de volgende mijlpaal doorgaan.

Vermijd lange opsommingen van triviale wijzigingen. De review gaat over productkwaliteit en risico's, niet over aantallen gewijzigde regels.

## 13. Wat je niet meer moet doen

- Niet op eigen initiatief de huidige homepage nogmaals minimaal restylen.
- Niet blind oude broadsheet-regels volgen omdat ze in vorige plannen staan.
- Niet de productvisie vernauwen tot een statische calculator met extra tekst.
- Niet een grote refactor voorstellen zonder aantoonbaar bezoekers- of onderhoudsvoordeel.
- Niet in één keer alle pagina's migreren voordat het nieuwe patroon is geaccepteerd.
- Niet een luxe 3D-hero maken die mobiel trager of onbruikbaar wordt.
- Niet alleen suggesties of wireframes leveren wanneer om een werkend prototype is gevraagd.
- Niet ongevraagd verschillende financiële formules herschrijven om een grafiek te laten passen.
- Niet uit een verouderd plandocument een productie- of AdSense-status afleiden.

## 14. Startinstructie voor de eerstvolgende Claude Code-sessie

> Lees `CLAUDE.md` en de zeven genoemde productdocumenten. Voer **uitsluitend mijlpaal 0 (audit en nulmeting)** uit volgens `ROADMAP.md`. Analyseer actuele code, bestaande rekenfuncties, tests, route- en SEO-risico's en verouderde documentatie. Voer passende bestaande tests en build uit als de omgeving dit toelaat. Lever een feature-gapmatrix en een voorstel voor drie **werkelijk verschillende** homepageconcepten om in mijlpaal 1 te ontwerpen. Wijzig geen gebruikersgerichte code, push niets en deploy niets. Stop na je audit voor mijn review.

---

**Productregel voor elke beslissing:** de homepage maakt nieuwsgierig; de dashboards geven financiële controle; tests en bronnen maken de resultaten betrouwbaar.
