# Review

Drie dingen: waar je op nakijkt, hoe je bevindingen indeelt, en wat er al
opgeleverd is.

---

## 1. Checklist vóór opleveren

Loop af wat van toepassing is. Sla je iets over, zeg dan wélk punt.

### Product en UX
- [ ] Snapt een nieuwe bezoeker de tool binnen vijf seconden — wat vul ik in, waar verschijnt het antwoord — zonder uitleg te lezen?
- [ ] Ziet het er professioneel en betrouwbaar uit? Rust en precisie, geen drukte.
- [ ] Volledig responsive: geen layoutproblemen op 375px, niets loopt over of valt weg.
- [ ] Is er structurele ruimte voor SEO-content en advertenties, zonder dat die het rekenwerk onderbreken?

### Code en scope
- [ ] Is de wijziging klein genoeg om te beoordelen? Eén onderwerp.
- [ ] Geen onnodige complexiteit toegevoegd: geen tweede manier om iets te doen dat al bestaat, geen bibliotheek voor wat in twintig regels kan.
- [ ] Zijn invoerfouten afgevangen? Leeg veld, nul, negatief bedrag, tekst in een getalveld, onrealistisch hoge invoer — de bezoeker krijgt een begrijpelijke melding, geen `NaN` en geen lege uitkomst.
- [ ] Past de wijziging bij het huidige blok in [roadmap.md](roadmap.md)?

### Altijd
- [ ] `npm test` slaagt.
- [ ] `npm run build` slaagt (die draait de tests en de generatoren).
- [ ] Geen gegenereerd bestand met de hand aangepast (`src/js/bankdata.generated.js`).
- [ ] Nieuwe of hernoemde pagina staat in `vite.config.js` én in `public/sitemap.xml`.
- [ ] Commentaar, teksten en commit zijn in het Nederlands.

### Bij wijzigingen aan de UI
- [ ] Zelf in de browser bekeken — desktop (1440px) én mobiel (375px).
- [ ] Kleur, maat en ruimte komen uit `src/styles/design-system.css`, geen losse waarden — ook niet in JavaScript.
- [ ] Aanraakzones minimaal 44 × 44px, contrast haalt WCAG AA.
- [ ] De uitkomst staat bovenaan, de uitleg eronder.
- [ ] Bedragen verspringen niet tijdens het typen.
- [ ] Voor-en-na met gemeten waarden vastgelegd in [demo/](demo/).

### Bij wijzigingen aan data of voorwaarden
- [ ] Elke gewijzigde waarde heeft een bron-URL en een controledatum.
- [ ] Niets gepubliceerd? Dan `null` met status `niet-gepubliceerd`, geen schatting.
- [ ] Elke `detail` komt overal mee, ook op de vergelijkingspagina.
- [ ] Geen kop die meer belooft dan de toelichting waarmaakt.
- [ ] Geen persoonlijke aanbeveling, geen "beste keuze".

### Bij wijzigingen die SEO of laadtijd raken
- [ ] Titel en metabeschrijving zijn uniek en beschrijven deze pagina.
- [ ] Eén `<h1>`, en de koppen lopen op zonder niveaus over te slaan.
- [ ] De inhoud staat in de HTML, niet alleen achter JavaScript.
- [ ] Verdieping via echte links naar echte pagina's.
- [ ] `lastmod` in de sitemap bijgewerkt.
- [ ] Geen nieuwe afhankelijkheid zonder afweging; wat je toevoegt laadt alleen op de pagina's die het gebruiken.
- [ ] De bundel van de gewijzigde pagina is niet zonder reden gegroeid.

---

## 2. Bevindingen indelen

Alles wat uit een review komt, krijgt één van deze drie. Zonder indeling wordt
elke opmerking even zwaar, en dan blijft er niets over dat écht moet.

| Categorie | Wat erin hoort | Wat ermee gebeurt |
|---|---|---|
| **Must fix** | Bugs, kapotte UI, verkeerde berekeningen, onjuiste of ongenuanceerde data | Blokkeert opleveren. Eerst dit |
| **Should fix** | UX-verbeteringen, opmaak, naamgeving, dubbele code | Mag mee als het klein is, anders naar de roadmap |
| **Okay to ship** | Voldoet aan de eisen | Opleveren en in het logboek zetten |

Een verkeerde berekening of een dataveld dat zijn nuance verliest is altijd
**must fix**, ook als het onbeduidend lijkt. Daar hangt het vertrouwen aan, en
dat is het hele product.

---

## 3. Logboek

Nieuwste bovenaan. Eén regel per opgeleverd stuk werk: wat er veranderde, hoe
het is nagekeken, en wat er open bleef staan.

| Datum | Wat | Nagekeken met | Open gebleven |
|---|---|---|---|
| 22-08-2026 | Alle overzichten komen voortaan uit één document. De zeven rekenpagina's tekenden hun PDF met jsPDF — label vet, waarde eronder ingesprongen — en leveren nu hetzelfde tabeldocument als de verbouwbegroting, via het printvenster van de browser. Nieuwe module `src/js/afdrukdocument.js`; `jspdf` is uit `package.json` | Alle zeven knoppen doorlopen met `window.print` onderschept: kop, invoer, uitkomst en de slotsecties per pagina nagelopen. Nieuwbouw brengt het maandverloop mee als tabel van 14 rijen; dat lukte met jsPDF helemaal niet. Begroting en depotplanner opnieuw bekeken: ongewijzigd, op het kruimelpad na dat nu ook van papier valt. Knop op 375px één regel en 44px hoog. 60/60 tests (2 nieuwe), build slaagt, 0 consolefouten | De depotplanner drukt nog steeds het scherm af; die levert datums in plaats van bedragen en vraagt een eigen ontwerp. En in de specificatie van de begroting maakt `text-transform: capitalize` van "soort bewijs" nog "Soort Bewijs" |
| 19-08-2026 | Begroting: de regel "Expliciet genoemd door <bank>" van het scherm gehaald. Met Rabobank gekozen stond bij tien van de vijftien posten een andere bank, wat leest als relevantie voor een bank waar je niet zit | Drie banken doorlopen: Rabobank 5 badges, ING 12, SNS 0 met de juiste uitleg. Het gegeven blijft in de data en in `data-genoemd-door`, alleen niet meer zichtbaar. Dode stijl `.post__bron` opgeruimd. 59/59 tests, 0 consolefouten | De "uw bank"-badge blijft; het bewijs van andere aanbieders is er nog en kan later anders geformuleerd terugkomen |
| 19-08-2026 | Begroting: categorieën uitklapbaar gemaakt, en het bedragveld verbreed omdat het afkapte | Pagina van 10,3 naar 4,5 schermen op desktop. Ingevulde categorieën gaan vanzelf open na herladen; meerdere tegelijk open mogelijk. Bedragveld had 50px ruimte voor 53px tekst: "22000" was niet te lezen. Nu past "1.250.000" op desktop en mobiel, en "Noodzakelijk" past in de keuzelijst | Bij een schone start staan alle zes de categorieën dicht; of dat de vijfsecondentoets haalt is een keuze voor de founder |
| 19-08-2026 | Verbouwbegroting onder de loep: alle 34 bedragvelden lezen nu Nederlandse notatie, onmogelijke invoer krijgt een melding, subtotaal per categorie, reserve zichtbaar in de splitsing, en de rekenkern is als `begrotingrekenen.js` afgesplitst met 7 tests | Alle vijf schrijfwijzen van "20.000" geven nu € 22.000 (was: één van de vijf goed). Scherm en specificatie naast elkaar gelegd: € 89.700 op beide. 59/59 tests, 0 consolefouten, mobiel 375px | Ik bewerkte eerst de gegenereerde HTML met de hand; dat werd door de build overschreven. De wijziging hoort in `scripts/build-begroting.mjs` |
| 19-08-2026 | Drie opmaakpunten van de depotplanner: de twee bedragvelden staan weer op één lijn, de tijdlijn blijft verticaal op brede schermen, en de opnameregel leidt met het bedrag in plaats van het percentage | Gemeten met de echte cijfers: beide velden op 890px, "€ 142.374 van € 334.110 opgenomen · 43%" op 15px met het bedrag op gewicht 640, tijdlijn één kolom van 532px in plaats van drie van 200px. Mobiel 375px, 52/52 tests | `.alleen-print` bestond al voor de begroting; mijn tweede versie is weer verwijderd |
| 19-08-2026 | De bezoeker kiest zelf of hij het restant of het opgenomen bedrag invult. Bankapps tonen het restant, dus dat is nu de standaard; "Al opgenomen" vragen betekende dat iemand eerst zijn afschriften moest optellen | Vijf toestanden: wisselen van vraag rekent het veld om en laat de uitkomst gelijk (€ 30.000 blijft € 30.000). Grens per modus getest, keuze en posten overleven herladen. Mobiel 375px, segmentknoppen 44px. 52/52 tests, 0 consolefouten | Onderweg gevonden: teruggehaalde posten stonden wel in het geheugen maar werden niet getekend; `.ds-segment` stond nog op 38px en is naar 44px |
| 19-08-2026 | Depotplanner van aftelklok naar declaratieplan: postenlijst als invoer, uiterste indiendatum per aanbieder, saldoverloop, waarschuwing bij posten na de deadline, en de declaratie-eisen op het moment van indienen. Doorlooptijd rekenbaar gemaakt in de data (6 van 8 publiceren een aantal werkdagen) | Live doorlopen met drie posten: tabel, totalen en saldozin kloppen. Post na de deadline wordt gemarkeerd, tekort wordt benoemd, Obvion toont geen datum maar de reden. Agendabestand telt nu 6 gebeurtenissen incl. "Uiterlijk declareren". Mobiel 375px: kaartweergave, tabel scrolt binnen eigen kader, alles 44px. 52/52 tests | Onderweg gevonden en gerepareerd: "Vandaag invullen" vulde gisteren in door toISOString in onze tijdzone |
| 19-08-2026 | Depotplanner: de twee randgevallen gedicht. Een passeerdatum in de toekomst meldt "Nog niet gestart" met de openings- en einddatum in plaats van meer resterende maanden dan de termijn lang is; te veel of negatief opgenomen levert een melding op in plaats van stil afkappen | Vijf toestanden nagelopen: normaal, toekomstige datum, 80.000 van 50.000, negatief, en herstel. Tijdlijn en agendaknop blijven werken bij een toekomstige datum. Mobiel 375px, 41/41 tests, 0 consolefouten | De amberkleurige veldrand is geverifieerd met een vers element; de berekende stijl van een bestaand veld is in mijn browserpaneel niet betrouwbaar |
| 19-08-2026 | Depotplanner: de datums kunnen nu mee in een agendabestand (.ics), met een herinnering 30 dagen voor de momenten die om actie vragen. Nieuwe module `src/js/agenda.js` met 7 tests; uitgeschakelde knopstaat toegevoegd aan het ontwerpsysteem | Bestand onderschept zonder te downloaden: 4 gebeurtenissen, 2 herinneringen, datums gelijk aan de tijdlijn. Knop uit zonder bank of datum, aan zodra er datums zijn, weer uit als de datum wordt gewist. 41/41 tests, build slaagt, 0 consolefouten | De pagina had al een waarschuwing bij weinig tijd en veel saldo; mijn eerdere melding dat die ontbrak was onjuist |
| 19-08-2026 | Termijnschema bruikbaar gemaakt: Nederlandse getalnotatie wordt gelezen, kolomkoppen en veldnamen toegevoegd, geen uitkomst meer bij een schema dat niet klopt, alles naar 44px | Alle vijf schrijfwijzen van "87.500" geven nu dezelfde uitkomst (was: vier van de vijf fout). Blokkade en herstel getest bij 80%, 125% en een termijn na het bouweinde. Typen wordt niet meer onderbroken; opmaak volgt bij verlaten van het veld. Mobiel 375px: kaartweergave met eigen maandlabel. Nieuwe `tests/getallen.test.mjs`, 34/34 tests | `leesGetal` hoort alleen op vrije tekstvelden; op `type="number"`-velden leest hij "3.80" als 380 |
| 19-08-2026 | De fiscale grafiek op `belasting.html` ook omgezet; tekenwerk verhuisd naar de gedeelde module `src/js/staafgrafiek.js`; `chart.js` uit package.json en lockfile | Belasting: 30 staven = 30 tabelrijen, netto stijgt, voordeel daalt, geen bovenstuk zodra het voordeel negatief wordt (vanaf jaar 14). Nieuwbouw na de refactor opnieuw nagemeten op 12 en 24 mnd. Mobiel 375px en donkere modus. `npm run build`, 29/29 tests | Geen enkele verwijzing naar Chart meer in de codebase |
| 19-08-2026 | Nieuwbouw: het lege grafiekvlak vervangen door een eigen SVG-staafgrafiek uit de tokens; Chart.js-code en de arrays die hem voedden verwijderd | Meetkundig gecontroleerd op 3, 12, 24 en 36 maanden: staafaantal gelijk aan de tabel, niets buiten het tekenvlak, geen stapelfouten, eigen last stijgt monotoon. Mobiel 375px en donkere modus nagelopen. 0 hex-waarden in de SVG, 0 consolefouten, 29/29 tests | Nog te doen: hetzelfde voor `belasting.html` (fiscalChart), daarna kan `chart.js` uit package.json |
| 19-08-2026 | Rapportschema uitgebreid met tabellen (v1.2.0); de nieuwbouwpagina stuurt het maand-tot-maand verloop mee in de PDF, inclusief een kolom "incl. woonlast" die op het scherm ontbreekt | PDF onderschept zonder te downloaden: 26 rijen bij 24 mnd, gelijk aan het scherm. Paginawissel getest met 122 rijen: 4 pagina's, kolomkop 3x herhaald. Homepage (zonder tabel) onveranderd 1 pagina. 29/29 tests | Zes andere calculators kunnen nu ook een tabel meesturen; nog niet gedaan |
| 19-08-2026 | Nieuwbouw: het standaard termijnschema schaalt nu mee met de bouwduur in plaats van vast te staan op maand 1/3/6/9/12 | Browser op 1, 6, 12, 24 en 36 maanden: termijnen en piekmaand schuiven mee, depot loopt tot het einde van de bouw. Zelf ingevulde schema's blijven staan bij het wijzigen van de bouwduur. `npm run build`, 29/29 tests, 0 consolefouten | De maand-tot-maand tabel zit **niet** in de PDF-download; alleen samenvattende cijfers |
| 19-08-2026 | De drie must fixes van de homepage: invoervalidatie met melding, "Zes banken" naar acht plus een test die koppen bewaakt, en de FAQ-vragen zichtbaar op de pagina | Browser: negatief/leeg/nul/miljard/negatieve rente geven nu een melding en geen bedrag; 0% rente rekent gewoon door. Regressietest bewezen door de oude kop terug te zetten. `npm run build`, 29/29 tests, 0 consolefouten | Should fix 4 t/m 8 uit [spec/homepage.md](spec/homepage.md); pagina werd 0,9 scherm langer door de FAQ |
| 19-08-2026 | Selectie op de bedragknoppen hersteld via `aria-pressed` in plaats van de klasse `.selected`; jsPDF wordt pas bij de klik geladen | Browser: chip wit → teal met witte tekst, bedrag en uitkomst volgen mee. Build: homepage van 423 kB naar **74 kB** JS, jsPDF als losse chunk. `npm test` 28/28 | Volledige inspectie van de homepage staat in [spec/homepage.md](spec/homepage.md): 3 must fix, 5 should fix |
| 19-08-2026 | `src/styles/main.css` verwijderd (3.658 regels, door geen enkele pagina geladen); stale commentaar in `main.js` bijgewerkt | `npm run build`, `npm test` (28/28), homepage in de browser op 1280 en 375: 0 ongestyleerde knoppen, 0 consolefouten, geen verweesde CSS-variabelen | **Must fix:** selectie op de homepageknoppen is onzichtbaar (`.selected` had alleen styling in main.css) |
| 19-08-2026 | Nulmeting homepage en ontwerpreferenties vastgelegd; roadmap gecorrigeerd op twee achterhaalde aannames | Live site uitgelezen op 375px; rabobank.nl en belastingdienst.nl op 1280px | Zoekdata volgt rond 26-08 |
| 19-08-2026 | Werkmap ingericht: CLAUDE.md, roadmap, review, en de mappen context/customers/spec/demo/routines | `npm test` (28/28), links gecontroleerd; geen code geraakt | Eerste spec moet nog geschreven worden |
