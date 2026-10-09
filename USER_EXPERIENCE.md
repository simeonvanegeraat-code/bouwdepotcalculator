# USER_EXPERIENCE.md — BouwdepotCalculator.nl

**Versie:** 1.0 — voorstel ter goedkeuring  
**Datum:** 9 oktober 2026  
**Status:** Concept; nog geen toestemming om productie te veranderen  
**Gebaseerd op:** `PRODUCT_VISION.md` en `DESIGN_SYSTEM.md`

---

## 1. Het doel van de ervaring

BouwdepotCalculator.nl begint als een bijzondere, rustige, hoogwaardige website en verandert na een keuze in een effectieve financiële werkruimte. De gebruiker komt niet om onze animatie te bekijken: hij komt om te begrijpen wat nieuwbouw, een verbouwing of een bouwdepot financieel betekent.

**Productbelofte:** “Zie wat je woningplan kost, wanneer de kosten ontstaan en hoe jouw keuzes de uitkomst veranderen.”

**UX-noordster:** Bij ieder scherm moet de bezoeker begrijpen waar hij is, wat hij kan doen, en welk inzicht dat oplevert. Eerste inzicht zo snel mogelijk; complexiteit alleen toevoegen wanneer nodig.

De twee ontwerpwerelden blijven herkenbaar als één merk:
- **Publieke entree:** redactioneel minimalisme, hoogwaardige typografie en optionele, betekenisvolle 3D-storytelling.
- **Financiële werkruimte:** rustige premium-fintech, direct aanpassen van getallen, scenario's, grafieken, transparante aannames.

---

## 2. Drie principes die ontwerpbesluiten bepalen

1. **Directe toegang wint van een verplichte funnel.** Bezoekers die zoeken op “bouwdepot berekenen” komen direct bij hun rekentool; homepagebezoekers kunnen een route kiezen. Geen account, geen verplichte vragenlijst.
2. **Elke actie heeft een merkbaar effect.** Een gewijzigd bedrag past relevante cijfers, tijdlijnen of verklarende tekst direct aan. Geen knop “Bereken” als dat niet nodig is. Geen animatie om de animatie.
3. **Elke uitkomst legt zichzelf uit.** De bezoeker ziet bedragen, definitie, tijdseenheid, bruto/netto, gebruikte aannames, onzekerheden en bron wanneer relevant. Onbekende cijfers worden niet als feiten gepresenteerd.

---

## 3. Informatiearchitectuur

### Publieke navigatie

Voorgestelde hoofdnavigatie:

- **Nieuwbouw** — opent de nieuwbouwroute, met introductie en dashboard.
- **Verbouwen** — opent de verbouwroute.
- **Bouwdepot berekenen** — directe toegang tot de bestaande primaire rekentool.
- **Tools & uitleg** — overzicht met alle calculators, bankvoorwaarden en veelgestelde vragen.

De navigatie blijft op mobiel compact, zichtbaar en bedienbaar. Een bezoeker met een lopend bouwdepot vindt de depotplanner via Tools & uitleg en via relevante links op andere pagina's. Exacte menu-indeling volgt na prototypevalidatie.

### Logische structuur

```text
Homepage /
├── Nieuwbouwroute
│   ├── Eerste financiële inschatting
│   ├── Dashboard: woonlasten, tijdlijn en begroting
│   ├── Scenario's: oplevering, bouwkosten, rente
│   └── Bankvoorwaarden, uitleg en export
├── Verbouwroute
│   ├── Begroting maken
│   ├── Dashboard: kosten, financiering en maandlast
│   ├── Scenario's: meerwerk, eigen geld, rente
│   └── Specificatie, voorwaarden en export
├── Directe tools (oude vindbare URL's behouden)
│   ├── Bouwdepot berekenen
│   ├── Dubbele lasten / bouwrente / renteverlies
│   ├── Depotplanner en declaraties
│   └── Bestaande bank- en uitlegpagina's
└── Informatie: methodologie, over, contact, privacy
```

Dit is een conceptuele informatiearchitectuur, niet een opdracht om bestaande URL's te veranderen. De precieze routes worden in de technische fase bepaald.

---

## 4. Homepage: eerste indruk en 3D-verhaal

### Eerste scherm: begrijpen én verlangen door te klikken

Zonder scrollen moet een nieuwe bezoeker zien:
- Wat de site doet: inzicht in kosten van nieuwbouw, verbouwen en bouwdepot.
- Welke actie hij kan nemen: **Nieuwbouw plannen**, **Verbouwing berekenen**, **Bouwdepot direct berekenen**.
- Dat er achter de entree een bruikbare rekentool zit, geen marketingpagina.

**Voorlopige voorbeeldcopy:**

> Jouw woningplannen. Financieel helder.
>
> Ontdek wat nieuwbouw of verbouwen je kost, wanneer je betaalt en wat er verandert als je plannen veranderen.

CTA's: `Ik koop nieuwbouw`, `Ik ga verbouwen`, plus een duidelijk zichtbare tekstlink `Direct bouwdepot berekenen`.

### Het 3D-element

Een abstract architectonisch bouwvolume / huis ondersteunt het verhaal, niet andersom. Visuele scènes kunnen bij scrollen vloeiend overgaan van fundering naar bouwfasen, geldstromen en gereed huis. Exacte vorm nog niet vastleggen: eerst ontwerpvarianten beoordelen.

**Gedragsregels:**
- Content blijft leesbaar terwijl het model beweegt; geen tekst onder 3D verbergen.
- Scroll blijft normale scroll; geen verplichte scroll-jacking of lange blokkades.
- De bezoeker mag na 2 seconden al een route kiezen zonder de animatie af te kijken.
- 3D is optioneel en progressief geladen; de kerninhoud staat in HTML.
- Voor `prefers-reduced-motion`, slechte verbindingen en apparaten zonder geschikte grafische ondersteuning komt een hoogwaardige statische of minimaal geanimeerde fallback.
- De animatie laadt niet op directe calculators als deze daarvoor geen waarde heeft.

### Verder op de homepage

Na de hero, in deze volgorde:
1. **Kies jouw situatie:** twee grote heldere keuzes, nieuwbouw en verbouwen, met korte uitleg; een link voor lopend bouwdepot.
2. **Voorbeeld van inzicht:** een compacte, echte voorbeeldgrafiek of vergelijking die laat zien wat de dashboards opleveren; geen verzonnen uitkomst zonder label “voorbeeld”.
3. **Waarom dit werkt:** aanpasbaar, onafhankelijke data, tijdlijn, transparante aannames.
4. **Directe populaire tools:** concrete links die bestaande SEO-pagina's ontsluiten.
5. **Vertrouwen:** methodologie, datum van financiële aannames, afbakening “informatie, geen persoonlijk advies”.

De homepage is géén muur van tekst en ook geen leeg kunstwerk. Iedere sectie heeft één functie.

---

## 5. Nieuwbouwroute: van onzekerheid naar tijdlijn

### Stap N1 — Keuze bevestigen, direct waarde leveren

Na `Ik koop nieuwbouw` verschijnt een rustige route-intro: “Ontdek hoe jouw woonlasten veranderen vóór, tijdens en na de bouw.” Daarna maximaal enkele kernvragen voor een eerste ruwe berekening.

**Minimale eerste invoer (voorstel):**
- Totale hypotheek / relevante leningdelen, met helptekst.
- Hypotheekrente en hypotheekvorm / looptijd indien vereist door de berekening.
- Huidige maandelijkse woonlast.
- Indicatieve bouwstart en opleverdatum / bouwduur.

Niet alle bank- of bouwtermijnvragen in de eerste stap plaatsen. Gebruik expliciet gemarkeerde illustratieve defaults waar passend. Het is duidelijk wat niet is meegenomen.

### Stap N2 — Eerste antwoord: de financiële tijdlijn

De bezoeker ziet onmiddellijk:
- **Bruto nieuwe hypotheeklast** (nauwkeurig gedefinieerd).
- **Indicatieve gecombineerde woonlast gedurende overlap**, indien onderbouwd met ingevoerde gegevens.
- **Maand-tot-maand-grafiek** over de bouwperiode.
- **Hoogste maandlast** en wanneer deze optreedt.
- Een toelichting “Dit is meegenomen / Dit ontbreekt nog”.

Bij nieuwbouw is de rentevergoeding over een bouwdepot afhankelijk van voorwaarden, opnames en beschikbaar saldo. De website mag dit niet reduceren tot een onnauwkeurige universele regel. Netto-last alleen apart en met expliciete fiscale aannames.

### Stap N3 — Dashboard verdiepen

Voorgestelde secties/tabs (exact patroon te prototypen):
- `Overzicht` — hoofdgetallen en belangrijkste inzichten.
- `Maandlasten` — tijdlijn en uitsplitsing per maand.
- `Budget & meerwerk` — posten en buffer.
- `Scenario's` — vertraging, gewijzigde bouwsom, rente.
- `Bouwdepot & bank` — relevante gedateerde voorwaarden.

Gegevens die de gebruiker invult, komen waar relevant terug in andere modules. Wijzigingen moeten duidelijk zichtbaar zijn en niet stilzwijgend bestaande informatie overschrijven.

### Stap N4 — Scenario's vergelijken

Een bezoeker kan bijvoorbeeld `Basis` vergelijken met `Oplevering 3 maanden later` of `€ 15.000 extra meerwerk`.

**UI-vereisten:**
- Beschrijf wat er veranderd is.
- Toon verschil in maandlast, piekbelasting en eventueel totaal.
- Laat oude en nieuwe grafiek herkenbaar vergelijken.
- Maak onderscheid tussen extra kosten, verschoven kosten en onzekerheden.
- Bied herstel naar basis en vergelijking verwijderen.

### Stap N5 — Uitkomst meenemen

Print of exporteer een begrijpelijk overzicht met bedragen, invoerwaarden, peildatum, aannames en eventuele bankbronnen. Geen persoonlijk advies of geclaimde zekerheid. Geen account nodig.

---

## 6. Verbouwroute: van ideeën naar financierbaar plan

### Stap V1 — Eerst begrijpen wat het project is

Een snelle keuze, bijvoorbeeld `Aanbouw`, `Badkamer`, `Keuken`, `Verduurzamen` of `Anders`, kan helpen om relevante kostenposten te tonen. De gebruiker kan altijd een volledig eigen begroting maken.

### Stap V2 — Begroting opbouwen

Groepering per ruimte/activiteit met:
- Naam en bedrag.
- Status `offerte`, `eigen schatting` of `nog onbekend`.
- Onvoorziene kosten als aparte, instelbare post.
- Onderscheid tussen `mogelijk via depot` en `waarschijnlijk eigen geld`, met zichtbaar voorbehoud en bankspecifieke voorwaarden waar beschikbaar.

**Belangrijk:** de website doet nooit alsof een algemene regel per definitie door de bank wordt geaccepteerd.

### Stap V3 — Financieel dashboard

Laat zien:
- Verwacht totaal en onzekerheidsmarge.
- Eigen geld tegenover mogelijke financiering.
- Indicatieve maandlast van de gekozen financieringsvariant.
- Waar de grootste budgetrisico's zitten.

Een waardetoets voor financieringsruimte is niet hetzelfde als een volledige hypotheekacceptatie of inkomenstoets. Dit onderscheid krijgt een zichtbare uitleg.

### Stap V4 — Scenario en specificatie

De gebruiker kan bijvoorbeeld kostenposten schrappen, hogere offertes invoeren of meer eigen geld inzetten. Vervolgens een printbare begrotingsspecificatie maken.

---

## 7. Directe zoekbezoeker: nooit blokkeren

Een bezoeker die via Google binnenkomt op `bouwdepot-berekenen.html`, `dubbele-lasten-nieuwbouw.html` of een bankpagina blijft die inhoud direct krijgen. Geen automatische redirect naar de homepage en geen verplichte bezoekerstype-keuze.

**Elke directe toolpagina biedt:**
- De relevante calculator of het antwoord bovenaan.
- Een heldere uitkomst en uitleg van de gebruikte aannames.
- Links naar verdiepende, *relevante* dashboards — niet een opdringerige overstap.
- Een zichtbare weg naar de rest van het platform.

Waar een nieuw dashboard een oude functie inhoudelijk vervangt, blijft de bestaande SEO-URL in principe behouden en krijgt hij de nieuwe interface. Niet twee concurrerende pagina's publiceren met nagenoeg dezelfde zoekintentie zonder bewuste contentstrategie.

---

## 8. Doorlopende ervaring: gegevens en toestanden

### Bewaren en meenemen

- Geen account nodig.
- Gegevens blijven standaard in de browser; geen stille overdracht naar externe systemen.
- Toon wanneer gegevens lokaal zijn bewaard, wat dat inhoudt en hoe gebruikers ze kunnen wissen.
- Geef bezoekers controle over wat wordt meegenomen naar de volgende tool.
- Sla geen bankinloggegevens, volledige documenten of andere onnodige gevoelige data op.

### Zichtbare toestanden van elke tool

Ontwerp expliciet voor:
1. **Leeg:** uitnodigende start met voorbeeld of duidelijk startveld.
2. **Geldig en ingevuld:** direct bijgewerkt resultaat.
3. **Onvolledig:** toon welke informatie nog ontbreekt; blijf bruikbaar.
4. **Ongeldig:** fout direct bij veld; geen `NaN`, stille nul of misleidend grafiekpunt.
5. **Onzeker:** markeer welke berekening indicatief is of waarvan broninformatie ontbreekt.
6. **Zeer afwijkend:** waarschuw bij onrealistische combinaties zonder blind te blokkeren.
7. **Print/export:** leesbare aparte opmaak zonder interactieve UI-ruis.

### Snelheid en interactie

- Wijzigingen in eenvoudige invoer worden direct verwerkt.
- Zware herberekeningen mogen een korte, begrijpelijke laadstatus tonen.
- Grafieken zijn aanvullend; de belangrijkste waarde moet ook leesbaar zijn zonder grafiek.
- Voorkom layoutverspringingen tijdens het typen en bij resultaatupdates.

---

## 9. Tekst, duidelijkheid en vertrouwen

Gebruik gewone taal, korte zinnen en goed te onderscheiden begrippen. Vermijd onnodige vaktermen, maar verberg ook geen complexe realiteit.

**Voorbeelden:**
- Wel: `Bruto hypotheeklast per maand`.
- Niet: `Jouw echte netto woonlast` wanneer fiscale gegevens ontbreken.
- Wel: `Geschatte maand met de hoogste lasten`.
- Niet: `Dit is je duurste maand` als de bouwtermijnen nog onbekend zijn.
- Wel: `De bank kan aanvullende voorwaarden stellen` met concrete bron en datum.
- Niet: `Dit bedrag wordt door je bank vergoed` zonder bewijs.

Financiële bronnen en methodologie zijn bereikbaar vanuit de relevante uitkomst, niet alleen vanuit een algemene juridische footer.

---

## 10. Mobiele gebruikerservaring en toegankelijkheid

De belangrijkste opdrachten moeten ook op 375px breed uitvoerbaar zijn:
- Eén duidelijke primaire handeling per toestand.
- Goed leesbare invoer, grote aanraakgebieden (minimaal circa 44×44px).
- Dashboard werkt als overzichtelijke verticale ervaring; geen verplicht horizontaal scrollen over de hele pagina.
- Grote grafieken krijgen compacte alternatieven en eventueel een expliciete detailweergave.
- Geen content die alleen na hover bereikbaar is.
- Semantische kopstructuur, labels, foutmeldingen en focusvolgorde.
- Toetsenbordbediening van alle essentiële functies.
- Onderdelen hebben bruikbaar gedrag zonder 3D en bij `prefers-reduced-motion`.

Niet letterlijk afdwingen dat alle invoer én alle resultaten tegelijk op het eerste mobiele scherm passen. Prioriteer het belangrijkste eerste inzicht en een herkenbare ingang naar de invoer; dit voorkomt onleesbare interfaces.

---

## 11. Advertenties en commerciële UX

AdSense is het primaire verdienmodel, maar mag de kernfunctie niet schaden.

- Geen advertenties tussen een veld en de bijbehorende uitkomst.
- Geen overlays die een berekening onderbreken.
- Geen advertenties die eruitzien als formulierknoppen of resultaten.
- Plaatsing pas na UX-ontwerp en na relevante privacy-/toestemmingscontrole.
- Ruimte voor advertenties kan in informatieve secties naast of onder tools worden ontworpen, maar kernfuncties blijven overzichtelijk.
- Geen onnatuurlijke extra klikken of pagina's uitsluitend voor advertentieweergaven.

---

## 12. Prototype- en acceptatiecriteria

### Prototype A — Homepage

Beoordeel met echte screenshots en werkende navigatie op desktop en mobiel:
- Binnen vijf seconden kan een nieuwe bezoeker zeggen wat het platform doet.
- Nieuwbouw, verbouwen en direct rekenen zijn zonder animatie te vinden.
- De 3D-scène voelt doelgericht en werkt ook met motion-reductie.
- Geen merkbare vertraging door niet-essentiële 3D op eerste render.
- De homepage heeft een coherent mobiel ontwerp.

### Prototype B — Nieuwbouwdashboard

- Eerste resultaat met weinig invoer.
- Mutatie van bedrag, rente of bouwduur past de juiste cijfers/visualisaties aan.
- Een scenario is duidelijk te vergelijken met een basisvariant.
- Bruto/netto en aannames kloppen met de gebruikte rekenlogica.
- Alle kerninzichten zijn zonder grafiek begrijpelijk.
- Geen data- of layoutverlies bij normaal gebruik op mobiel.

### Prototype C — Verbouwdashboard

- Invoer van posten, categorieën en onzekerheden werkt.
- Financieringsruimte en maandlast worden niet met elkaar verward.
- Bankspecifieke voorwaarden verschijnen uitsluitend indien voldoende geverifieerd.
- Export/print bevat reproduceerbare aannames.

**Stopconditie:** incorrecte financiële berekeningen, kapotte direct-entry SEO-pagina's, ontoegankelijke kernfuncties of een onbruikbare mobiele weergave blokkeren uitrol.

---

## 13. Wat Claude Code wel en niet mag beslissen

**Wel:** technische componentdetails voorstellen, bestaande code hergebruiken, alternatieven onderbouwen, prototypes maken, tests en screenshots verzamelen.

**Niet zonder goedkeuring:** de gekozen productroutes wijzigen, de 3D-metafoor definitief vastzetten, URLs wijzigen, financiële definities versimpelen, een frameworkmigratie uitvoeren, gebruikersdata naar een backend sturen, of productie aanpassen.

De implementatie start pas na goedkeuring van visuele prototypevoorstellen en een technische uitvoeringsspecificatie. Werk in een aparte branch, met duidelijke toetsbare mijlpalen.

---

## 14. Nog te valideren ontwerpvragen

1. Hoe letterlijk wordt het architectonische huis in de 3D-hero?
2. Heeft de homepage een lichte scroll-storytelling of een korter interactief hero-moment?
3. Welk dashboardpatroon werkt beter: zijmenu, tabs of een overzicht met ankersecties?
4. Wat is de kleinst mogelijke invoerset voor een financieel verantwoorde nieuwbouwtijdlijn?
5. Welke bestaande tools en bedragen kunnen veilig onderling worden verbonden?
6. Welke hoofd- en secundaire acties zijn aantoonbaar begrijpelijk voor echte gebruikers?

Deze vragen worden met prototypes en testgebruikers beantwoord, niet met losse stijlaanpassingen in productie.

**Samenvattende ontwerpregel:** *Verwonder aan de voordeur, geef controle achter de voordeur.*
