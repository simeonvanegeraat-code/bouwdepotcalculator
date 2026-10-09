# FEATURES.md — BouwdepotCalculator.nl

**Versie:** 1.0 — functionele productspecificatie  
**Datum:** 9 oktober 2026  
**Status:** Concept voor beoordeling; geen opdracht om direct code te wijzigen.  
**Hoort bij:** `PRODUCT_VISION.md`, `DESIGN_SYSTEM.md` en `USER_EXPERIENCE.md`.

---

## 1. Waar dit document voor dient

Dit bestand beschrijft **welke functies het platform moet hebben, wat ze precies doen en wanneer ze geslaagd zijn**. Het is de brug tussen de productvisie en de toekomstige technische specificaties.

- De homepage is een minimalistische, premium introductie met optionele 3D-storytelling.
- De echte productwaarde zit in de **interactieve financiële dashboards** voor nieuwbouw en verbouwen.
- Mensen die alleen `bouwdepot berekenen` zoeken, kunnen direct naar de bestaande calculator blijven gaan.
- Het doel is betrouwbaar inzicht, geen financiële productaanbeveling.
- Een functionaliteit is pas klaar als de rekenlogica, uitleg, mobiele weergave en foutafhandeling kloppen.

**Belangrijk voor Claude Code:** dit is de gewenste *productfunctionaliteit*, geen aanname dat elke functie al bestaat. Doe eerst een code-inventarisatie en leg de verschillen vast. Hergebruik alleen code waarvan de berekeningen en afhankelijkheden zijn gecontroleerd.

---

## 2. Functiehiërarchie en prioriteiten

| Code | Functie | Prioriteit | Eerste mijlpaal |
|---|---|---|---|
| HOME-01 | Homepage, routekeuze en rechtstreekse calculator-CTA | P0 | Homepageprototype |
| NB-01 | Nieuwbouw: maand-tot-maand woonlastentijdlijn | P0 | Nieuwbouwprototype |
| NB-02 | Nieuwbouw: bouwtermijnen en depotsaldo | P0 | Nieuwbouwprototype |
| FIN-01 | Duidelijke bruto hypotheekberekening | P0 | Nieuwbouwprototype |
| UX-01 | Direct aanpassen, uitleg en valide invoer | P0 | Elk prototype |
| SEO-01 | Bestaande calculators direct bereikbaar | P0 | Elke release |
| NB-03 | Vertraging- en meerwerkscenario's | P1 | Nieuwbouwprototype v2 |
| VB-01 | Verbouwbegroting per onderdeel | P1 | Verbouwprototype |
| VB-02 | Financieringsgat en indicatieve extra woonlasten | P1 | Verbouwprototype |
| BANK-01 | Bronverifieerbare voorwaarden per bank | P1 | Behoud, dan integratie |
| EXP-01 | Printbaar of exporteerbaar overzicht | P1 | Per dashboardroute |
| DEP-01 | Planner voor een lopend bouwdepot | P2 | Latere fase |
| UX-02 | Gedeelde, lokaal bewaarde invoer | P2 | Na state-model |
| TAX-01 | Netto-effecten / fiscale berekeningen | P2 | Alleen na validatie |
| ADV-01 | Meer geavanceerde scenariomodellen | P3 | Na gebruikersonderzoek |

**P0** = noodzakelijk voor een overtuigend, betrouwbaar eerste product.  
**P1** = productdiepte en onderscheid.  
**P2/P3** = waardevol, maar geen reden om de eerste release uit te stellen.

Een P0-prototype mag alleen als demonstratie worden getoond zolang financiële logica niet gevalideerd is. Publicatie vergt gecontroleerde berekeningen.

---

## 3. Gedeelde rekenprincipes

### 3.1 Begrippen die strikt gescheiden blijven

- **Hypotheekhoofdsom:** schuld waarop contractuele rente en aflossingsafspraken betrekking hebben.
- **Bouwdepot:** bestedingssaldo voor bouw-/verbouwkosten, meestal onderdeel van de hypotheekfinanciering.
- **Opname uit bouwdepot:** vermindert het depotsaldo, niet automatisch de hypotheekhoofdsom.
- **Hypotheekrente:** afhankelijk van leningdelen, contracten en renteberekeningsmethode.
- **Depotvergoeding:** alleen wanneer toepasselijk, afhankelijk van geldverstrekker en voorwaarden.
- **Aflossing:** apart van rente tonen; bij sommige constructies begint deze volgens contract al tijdens de bouw.
- **Oude woonlast:** huur of kosten van bestaande woning; niet stilzwijgend gelijkstellen aan uitsluitend hypotheekrente.
- **Bruto/netto:** netto uitsluitend bij aantoonbare, expliciet beschreven fiscale aannames.
- **Kasuitstroom versus kosten:** een aflossing is wel een betaling, maar economisch niet hetzelfde als rentekosten.

Nooit het volledige depotsaldo als *extra lening* boven op de hypotheek tellen zonder aantoonbare contractuele reden.

### 3.2 Rekenuitvoer heeft altijd metadata

Iedere berekening moet opleveren:
1. Uitkomst met valuta, periode en aanduiding bruto/netto.
2. Invoer en expliciete aannames.
3. Inzicht in de componenten waaruit de uitkomst bestaat.
4. Relevante onzekerheden en gevallen waarin de bank of adviseur doorslaggevend is.
5. Een stabiele manier om dezelfde invoer opnieuw door te rekenen.

### 3.3 Rekenkern en presentatielaag

Nieuwe of hergebruikte berekeningen worden als **pure, zelfstandig testbare functies** aangeboden. De UI levert gevalideerde waarden aan en formatteert het resultaat. Geen financiële logica in grafiekcode of CSS-gebaseerde presentatietrucs.

Bij tijdlijnen:
- Reken met kalendermaanden en expliciete betaalmomenten.
- Vermeld of bedragen voor begin, einde of gemiddelde maandstand gelden.
- Maak een echte datumverschuiving, niet standaard `maanden × één vast bedrag`.
- Rond voor weergave af, niet tussentijds in de rekenkern.
- Leg de dag-/maandrenteconventie vast per model en bron.

### 3.4 Fouten en uitzonderingen

Test minimaal: lege invoer, nulrente, negatieve bedragen, renteverhoging, meerdere leningdelen, gedeeltelijke depottoekenning, nul bouwtermijnen, vertraagde oplevering, termijn buiten de depotlooptijd, ontbrekende bankwaarde en niet-sluitende termijnschema's.

Toon nooit `NaN`, `Infinity`, stilzwijgend nul als ontbrekend gegeven of een totaal dat niet aansluit op de onderdelen.

---

## 4. HOME-01 — Homepage en routekeuze

### Gebruikersdoel
In enkele seconden begrijpen wat de site doet, vertrouwen krijgen en zonder zoeken de juiste route vinden.

### Zichtbare onderdelen
- Herkenbare propositie en rustige typografie.
- Eén memorabel 3D-element of geoptimaliseerde visuele vervanging.
- Route **Ik koop nieuwbouw**.
- Route **Ik ga verbouwen / uitbreiden**.
- Directe actie **Bouwdepot berekenen**.
- Vindbare toegang tot informatie voor mensen met een lopend bouwdepot.
- Bewijs van betrouwbaarheid: onafhankelijke positie, methode, bronnen en privacy.

### Gedrag
- Scrollanimatie mag het begrip ondersteunen, maar nooit klikken blokkeren.
- Routeknoppen werken ook zonder JavaScript/3D waar praktisch.
- Bestaande directe tool-URL's blijven werken.
- De homepage is geen verplicht toegangsscherm.

### Acceptatie
Navigatie toetsen op desktop en mobiel, toetsenbord, verminderde beweging, uitgeschakelde 3D en trage verbinding.

---

## 5. NB-01 — Nieuwbouw: financiële tijdlijn

### Gebruikersvraag
**'Wat betaal ik in elke maand van het bouwproces en wanneer is mijn zwaarste maand?'**

### Minimale invoer
- Hypotheekbedrag of leningdelen, rente per leningdeel en hypotheekvorm.
- Passeerdatum / start financieringsperiode.
- Verwachte opleverdatum.
- Huidige maandelijkse woonlasten en einddatum daarvan.
- Relevante bouwtermijnen met datum en bedrag, of een transparant voorbeeldschema.
- Eventuele depotvergoeding: alleen op basis van gekozen, verifieerbare regels of expliciete handmatige aanname.

Niet alle velden hoeven op het eerste scherm. Werk met goede, als **voorbeeld** gelabelde uitgangswaarden en progressieve verdieping.

### Verplichte uitvoer
- Grafiek per maand van totale **bruto kasuitstroom voor woonlasten**.
- Uitsplitsing in oude woonlasten, hypotheekrente, aflossing en depotvergoeding waar van toepassing.
- Periode met overlap/dubbele lasten duidelijk gemarkeerd.
- Maand met hoogste geraamde betaling.
- Som over gekozen periode, apart van een typische maandlast.
- Een tabel die dezelfde getallen bevat als de grafiek.
- Duidelijke grenzen: niet inbegrepen kosten worden benoemd.

### Regels
- De hypotheekbetaling wordt gebaseerd op daadwerkelijke leninggegevens, niet simpelweg `depot × rente`.
- Nieuwe bouwtermijnen veranderen het **depotverloop** en daarmee eventueel de **vergoeding**, niet automatisch de contractuele hoofdsom.
- Als een gebruiker alleen een grove inschatting wil, toon dat expliciet als indicatief model.
- Niet suggereren dat een 'zwaarste maand' een voorspelling of gegarandeerde bankafschrijving is.

### Acceptatie
Bij één veranderde bouwtermijndatum moeten grafiek, maandtabel, banksaldo en eventuele vergoeding coherent meeveranderen. Een verzwaarde maandlast mag niet door afronding in de grafiek afwijken van de tabel.

---

## 6. NB-02 — Bouwtermijnen en depotsaldo

### Gebruikersvraag
**'Wanneer gaat er geld uit mijn bouwdepot en wat blijft er over?'**

### Invoer
- Depotstartsaldo.
- Termijnbedrag of termijnpercentage.
- Verwachte datum van iedere opname.
- Eventueel extra meerwerk / kosten die aantoonbaar uit depot gaan.

### Uitvoer
- Tijdlijn met geplande opnames.
- Resterend saldo na iedere opname.
- Waarschuwing wanneer geplande opnames het beschikbare saldo overschrijden.
- Signaal bij opname ná verwachte depotvervaldatum, mits die datum betrouwbaar beschikbaar is.

### Regels
- Nooit negatieve depotbalans als normale situatie presenteren.
- Verschil tussen gepland en werkelijk opgenomen bedrag kunnen aangeven in latere fase.
- Onzekere data duidelijk labelen.
- Bij onbekende bankvoorwaarden geen verzonnen uitbetalings- of verlengingsregels.

---

## 7. FIN-01 — Hypotheekbetalingen en leningsdelen

### Minimale ondersteuning
- Annuïtair: betaling passend bij restschuld, rente per periode en resterende looptijd.
- Lineair: rente over restschuld plus contractuele periodieke aflossing.
- Aflossingsvrij: rente en eventueel anders overeengekomen betalingen afzonderlijk.
- Bij nul rente moet de berekening correct blijven.
- Meerdere leningdelen zijn wenselijk zodra het eerste model betrouwbaar werkt.

### Bij iedere lening
- Bruto betaling, rentedeel, aflossingsdeel.
- Overblijvende schuld.
- Hypotheekvorm en looptijd.
- Timing van start, eventuele betalingsvrijstelling en contractspecifieke afwijkingen.

**Geen contractgegevens?** Toon standaard een gelabeld rekenvoorbeeld; presenteer geen bankspecifieke zekerheid.

---

## 8. NB-03 — Scenario's: vertraging en meerwerk

### Gebruikersvraag
**'Wat als de oplevering langer duurt of ons meerwerk duurder wordt?'**

### Scenario's
1. Basisscenario.
2. Vertraagde oplevering met zelf gekozen aantal maanden.
3. Extra meerwerk of afwijking van de begroting.
4. Later optioneel: gewijzigde rente, alternatieve oude-woning-einddatum of andere opnameplanning.

### Verplichte uitvoer
- Vergelijking maandlasten per scenario.
- Verschil in cumulatieve kasuitstroom over **dezelfde vergelijkingsperiode**.
- Eventuele verschoven bouwtermijnen afzonderlijk benoemen.
- Begrijpelijke indicatie van de benodigde cashbuffer, met methode.

### Waarschuwing
**Vertraging ≠ vertraging × huidige huur.** Het extra effect hangt af van oude woonlasten, nieuwe hypotheeklasten, depotvergoeding, opleveringsmoment, contractafspraken en gewijzigde betalingsmomenten. Een eenvoudige benadering mag alleen expliciet als zodanig worden gelabeld.

---

## 9. VB-01 — Verbouwbegroting

### Gebruikersvraag
**'Wat gaat mijn verbouwing kosten en welk deel moet ik zelf betalen?'**

### Minimale invoer
- Kostenposten met omschrijving, categorie en bedrag.
- Indicatie **offerte** of **eigen schatting**.
- Eigen geld en gewenst financieringsbedrag.
- Aanpasbare reservering voor onvoorziene kosten.

### Uitvoer
- Totaal, subtotalen, reservering en verschil met beschikbaar budget.
- Visualisatie per categorie, met tekstuele tabel.
- Apart gemarkeerde, **mogelijk** uit depot betaalbare posten; bankvoorwaarden blijven leidend.
- Aanpasbare of te verwijderen posten.
- Printbaar overzicht.

### Regels
- Kostprijsranges zijn geen harde marktprijzen zonder bron en datum.
- Geen automatische claim dat een post declarabel is voor elke geldverstrekker.
- Een procentuele opslag heeft een expliciete grondslag (bijvoorbeeld op geoffreerde plus geschatte posten).

---

## 10. VB-02 — Indicatieve financiering en nieuwe maandlast

### Gebruikersvraag
**'Welk bedrag moet ik mogelijk lenen en wat betekent dat voor mijn maandlast?'**

### Invoer
- Begrotingstotaal.
- Eigen geld.
- Huidige hypotheek, relevante woningwaarde en eventueel verwachte waarde na verbouwing.
- Nieuw gewenste financiering, rente en hypotheekvorm.

### Uitvoer
- Resterende financieringsbehoefte.
- Indicatieve waardegerelateerde ruimte en mogelijk financieringsgat.
- Afzonderlijk bruto maandlastverschil van een nieuw leningdeel.
- Duidelijke waarschuwing dat inkomen, leennormen, taxatie, bankacceptatie en andere kosten **niet** met een simpele waardetoets zijn bewezen.

### Regels
Nooit de uitkomst presenteren als 'dit mag jij lenen'. Nooit een persoonlijke bankaanbeveling doen.

---

## 11. BANK-01 — Bankgegevens en onafhankelijke vergelijking

### Bestaand bezit
De repository bevat gestructureerde aanbiedergegevens, een generator, broncontroles en tests om details niet te laten verdwijnen.

### Functionele eisen
- Gebruiker kan een bank kiezen waar dat werkelijk relevant is.
- Een veld heeft waarde, bron, controledatum en toelichting, of ontbreekt zichtbaar.
- Nuance blijft in overzicht, dashboard én export behouden.
- Een datum of percentage uit een bron mag niet zonder toets worden toegepast op elk contract.
- Brongegevens gelden nooit als persoonlijk advies.
- Wijzigingen aan bankdata volgen de bestaande gecontroleerde bron- en testprocedure.

### Acceptatie
Een bewust ontbrekende waarde wordt als onbekend getoond, nooit vervangen door 0 of een verzonnen 'gemiddelde bankvoorwaarde'.

---

## 12. DEP-01 — Lopend bouwdepot

### Minimale functies
- Startdatum, verwachte vervaldatum en huidig saldo.
- Openstaande en geplande declaraties.
- Waarschuwingen rond looptijd en verlenging indien bronregels bekend.
- Praktische checklist met documentvereisten.
- Printbaar overzicht.

### Grenzen
Geen automatische bankkoppeling of aanname dat de ingevoerde stand automatisch actueel is.

---

## 13. EXP-01 — Resultaten opslaan, afdrukken en delen

### Eerste versie
- Browser-printstylesheet en een nette PDF via afdrukken.
- Overzicht met invoer, bedragen, datum van berekening en aannames.
- Grafieken hebben een leesbare tabelvariant.
- Financiële disclaimers zijn specifiek en kort.

### Later, alleen indien nodig
- JSON-export of downloadbaar scenario-overzicht.
- Lokaal opslaan zonder account.
- Deelbare links alleen met expliciete afweging van privacygevoelige URL-parameters.

**Geen backend-opslag of login toevoegen** om een export te kunnen maken.

---

## 14. UX-01/UX-02 — Interactie en gegevens tussen tools

### Gemeenschappelijke interacties
- Wijzigen van een veld werkt zichtbaar door in uitkomsten.
- Inline validatie met begrijpelijke foutmelding.
- Directe invoer **naast** sliders; sliders zijn nooit de enige bediening.
- Toegankelijke labels, valuta/notatie `nl-NL`, focusstatus en toetsenbordbediening.
- Toelichting op wat wel/niet meegenomen is.

### Bewaarstrategie (nog te detailleren)
- Een expliciet gekozen route (nieuwbouw/verbouwen) mag tijdelijk context geven.
- Financiële invoer blijft standaard op het apparaat en wordt niet ongevraagd verzonden.
- Maak onderscheid tussen sessiestatus en permanent lokaal bewaren.
- Eén duidelijk bedieningspunt om bewaarde gegevens te wissen.
- Geen verborgen synchronisatie tussen tools waardoor een oud bedrag onverklaarbaar opduikt.

Een nieuw gedeeld datamodel pas invoeren nadat de sleutels en eigenaarschap van bestaande `localStorage`-velden zijn geïnventariseerd.

---

## 15. SEO-01 — Directe calculators en informatiepagina's

Behoud het bestaande gebruik:
- `bouwdepot-berekenen.html`
- `nieuwbouw.html`
- `dubbele-lasten-nieuwbouw.html`
- `bouwrente-nieuwbouw.html`
- `verbouwbegroting.html`
- `depotplanner.html`
- `bouwdepot-voorwaarden-vergelijken.html`

Dit zijn **bestaande routes**, geen opdracht ze te hernoemen. Inventariseer daarnaast alle andere actieve pagina's en URL's.

### Regels
- Directe zoeklandingspagina's beantwoorden hun specifieke vraag vóór ze een dashboard aanraden.
- Geen verplichte onboarding.
- Relevante interne links naar andere tools en dashboards.
- Bestaande indexeerbare uitleg en canonicals beschermen.
- Bij verplaatsingen of samensmeltingen: expliciete migratiespecificatie, redirects en controle in Search Console.

---

## 16. Volgorde waarin Claude de functies mag ontwikkelen

### Mijlpaal A — Productinventarisatie (geen UI-herschrijving)
1. Breng bestaande pagina's, rekenmodules, tests, exports en localStorage-sleutels in kaart.
2. Vergelijk de werkelijke code met dit document.
3. Markeer: **bestaat en bruikbaar / bestaat maar moet veranderen / ontbreekt**.
4. Zoek inconsistenties in documentatie; maak een voorstel tot opschonen.
5. Leg financiële contractafhankelijke onzekerheden vast.

**Resultaat:** een compacte *feature gap matrix* met bestandspaden.

### Mijlpaal B — Nieuwbouwprototype
1. Maak op een aparte branch een dashboardmock met representatieve gegevens.
2. Koppel de gekeurde hypotheek- en bouwdepotrekenkern.
3. Bouw NB-01 en NB-02 inclusief grafiek, maandtabel en invoer.
4. Voeg minimaal één betrouwbaar scenario toe.
5. Test uitkomsten, toegankelijkheid en mobiel.

**Resultaat:** een overtuigende werkende gebruikerservaring, zonder productie te wijzigen.

### Mijlpaal C — Verbouwen
1. Ontwerp gedeelde componenten.
2. Hergebruik bestaande verbouwbegrotingslogica waar correct.
3. Bouw VB-01 en VB-02.
4. Voeg verifieerbare bankinformatie toe waar passend.

### Mijlpaal D — Integratie en publicatie
1. Verbind routes zonder oude Google-landingspagina's weg te nemen.
2. Doe regressietests op rekenuitkomsten.
3. Controleer SEO, toegankelijkheid en prestaties.
4. Publiceer pas na review en expliciete goedkeuring.

---

## 17. Functionele acceptatietests — voorbeelden

De volgende tests zijn **gedragsafspraken**, geen claims dat de repository ze al uitvoert.

| Test | Verwacht gedrag |
|---|---|
| Nul hypotheekrente bij annuïtaire looptijd | Geen deling door nul; correcte aflossing |
| Twee verschillende leningdelen | Rente, aflossing en betalingen per deel en totaal consistent |
| Bouwtermijn in een latere maand | Depotverloop verschuift; vergoeding wordt opnieuw bepaald indien relevant |
| Ontbrekende depotvergoeding bij gekozen bank | `Onbekend` of `niet van toepassing`, niet stilzwijgend 0 |
| Oplevering verschuift twee maanden | De gehele maandtabel en relevante overlapperiode rekenen opnieuw |
| Meerwerk overschrijdt budget | Duidelijke waarschuwing, geen negatieve balans als gewone status |
| Verbouwpost wordt verwijderd | Alle subtotalen, grafiek en export veranderen mee |
| Oude link vanuit Google | Opent onmiddellijk de bedoelde calculator |
| Zonder WebGL / verminderde beweging | Homepage en routes blijven volledig bruikbaar |
| Mobiel, 375px breed | Geen afgesneden bedragen, grafieken of onbereikbare acties |
| Printresultaat | Invoer, aannames, datum en bedragen blijven leesbaar |

Voor rekenkundige tests moeten gevalideerde rekenvoorbeelden worden vastgelegd met onafhankelijke verwachte waarden. Niet de bestaande implementatie gebruiken als enige bron van verwachte uitkomsten.

---

## 18. Definition of Done voor elke functie

Een functie is **niet klaar** totdat:
- [ ] De echte gebruikersvraag wordt beantwoord.
- [ ] De zichtbare uitkomst is gekoppeld aan expliciete invoer en aannames.
- [ ] Minstens de relevante positieve, negatieve en grensgevallen zijn getest.
- [ ] Rekenlogica los van de UI is testbaar.
- [ ] Mobiel en toetsenbordbediening werken.
- [ ] De uitkomst in een tekst/tabel te lezen is.
- [ ] Financieel-juridische nuance zichtbaar is waar nodig.
- [ ] Relevante brongegevens met datum zijn getoond of als ontbrekend gemarkeerd.
- [ ] Bestaande pagina's, links, calculators en SEO niet onbedoeld beschadigd zijn.
- [ ] Een mens de functie op preview heeft beoordeeld.

---

## 19. Wat dit document nadrukkelijk NIET doet

- Geen definitieve technische bibliotheken kiezen.
- Geen pixel-perfect schermontwerp voorschrijven.
- Geen juridische zekerheid of bankacceptatie claimen.
- Geen concrete tarieven, fiscale regels of bankvoorwaarden verzinnen.
- Geen totale frameworkmigratie eisen.
- Geen bevoegdheid geven om productiedata, `main` of domeinconfiguratie te wijzigen.

Technische implementatie hoort in `TECHNICAL_ARCHITECTURE.md`; SEO en monetisatie horen in `SEO_ADSENSE.md`; de volgorde van uitvoer in `ROADMAP.md`; gedragsregels voor de agent in `CLAUDE.md`.

**Samenvatting:** de homepage wekt interesse; het dashboard maakt echte financiële consequenties zichtbaar; betrouwbare calculators en brondata maken de uitkomsten bruikbaar.
