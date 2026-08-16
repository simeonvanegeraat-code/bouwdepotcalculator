# Kwaliteit en bezoekersbehoefte: audit en plan

**Datum:** 16 augustus 2026
**Aanleiding:** een gebruiker met een lopend bouwdepot bij Rabobank meldde dat
"Max. per declaratie € 5.000" niet klopte met zijn praktijk. Terechte vraag
daarna: als dit misgaat, klopt de rest dan wel?

---

## 1. Het eerlijke antwoord op "klopt de rest wel?"

Ik heb alle 37 datacellen nagelopen. Twee bevindingen, en de tweede is
belangrijker dan de eerste.

### Geen verzinsels

Elke waarde is terug te voeren op een bron. Er staat nergens een geschat of
verzonnen getal. Dat was ook het geval bij de Rabobank-fout: € 5.000 stond
werkelijk in de bron.

### Maar dezelfde presentatiefout staat er nog 16 keer

De fout was niet het getal, maar dat de **nuance verdween tussen data en
pagina**. In de JSON stond "limiet verhoogbaar"; op de vergelijkingspagina
stond alleen "€ 5.000".

Dat patroon herhaalt zich:

| Veld | Aanbieders met verborgen nuance |
|---|---|
| Vergoeding over depot | **alle 6** |
| Restant bij beëindiging | 5 van 6 |
| Verlenging | 5 van 6 |

**19 van de 37 cellen hebben een toelichting die de kale waarde nuanceert. 16
daarvan zijn onzichtbaar op de vergelijkingspagina.**

### Eén kop is niet alleen onvolledig maar onjuist

ABN AMRO staat er met *"Ja, gedurende de looptijd"*. De onderliggende data
zegt: bij verlenging stopt de vergoeding de laatste 6 maanden, en bij
nieuwbouw houdt hij na 30 maanden op. "Gedurende de looptijd" is dus niet waar.

Dat is dezelfde fout als bij Rabobank, op de belangrijkste kolom van de site.

---

## 2. Wat de oorzaak is, en de echte oplossing

De oorzaak is niet slordigheid bij het opzoeken maar een **ontwerpfout in het
datamodel**: een veld heeft één waarde en optioneel een toelichting, en de
presentatie mag zelf kiezen of die toelichting meekomt. Zodra een tabel of
kaart krap wordt, sneuvelt de toelichting.

Drie structurele maatregelen:

1. **De toelichting is niet optioneel in de weergave.** Heeft een veld een
   `detail`, dan rendert dat overal mee. Een test faalt als dat niet gebeurt.
2. **Elk gegeven krijgt een soort.** Een productvoorwaarde, een
   app-instelling en een praktijkervaring zijn verschillende dingen en horen
   niet in dezelfde kolom. Dat was precies de Rabobank-fout.
3. **Elk gegeven krijgt een eigen bron**, niet één bron per aanbieder. Nu kan
   ik bij twijfel niet nagaan wélke pagina een specifieke cel onderbouwt.

---

## 3. Wat een bezoeker werkelijk nodig heeft

Hier zit een grotere fout, en die is strategisch.

### De site is gebouwd voor het verkeerde moment

De vergelijking gaat uit van iemand die een bank kiest op depotvoorwaarden.
Dat gebeurt vrijwel nooit. **Je krijgt een bouwdepot bij de hypotheek die je
adviseur heeft geregeld.** De keuze is al gemaakt voordat iemand deze site
vindt.

De melding die dit onderzoek startte is daar zelf het bewijs van: iemand met
een lopend depot, met een vraag over gebruik, niet over keuze.

### Wat mensen wél vragen

Uit forums, bank-FAQ's en zoekgedrag komen steeds dezelfde vragen, en die
gaan allemaal over de periode **tijdens en na** het depot:

- Waarom is mijn declaratie afgewezen?
- Wat moet er precies op een factuur staan?
- Mag ik iets voorschieten en later declareren?
- Hoe lang duurt uitbetaling, en wat als ze de declaratie kwijt zijn?
- Hoeveel tijd heb ik nog en wat kost verlengen?
- Wat gebeurt er met het geld dat overblijft?
- Wat als de bank mijn depot vroegtijdig beëindigt?

Dat zijn geen rekenvragen en geen keuzevragen. Het zijn **uitvoeringsvragen**.

### Wat daarvoor ontbreekt

Precies de gegevens die bepalen of een declaratie slaagt:

| Gegeven | Voorbeeld dat we misten |
|---|---|
| Minimumbedrag per declaratie | ASN hanteert € 250 |
| Maximale ouderdom bewijsstuk | ASN en NN: 6 maanden |
| Voorschot toegestaan? Tot welk bedrag? | ASN: maximaal € 5.000 |
| Gemengde factuur met niet-toegestane posten | ASN: doorstrepen en aftrekken |
| Wat als de factuur wordt afgewezen | nergens behandeld |
| Eigen arbeid | bij 6 van 6 onbekend |

Van die zes gegevens staat er nu vrijwel niets in de vergelijking, terwijl ze
bepalender zijn voor de dagelijkse praktijk dan de looptijd.

---

## 4. Wat de site zou moeten zijn

> **Nu:** een vergelijking om een bank te kiezen, met calculators ernaast.
> **Nodig:** een gids om het depot te gebruiken dat u al hebt, met de
> vergelijking als naslag erachter.

De calculators blijven waardevol — daar komt het verkeer op binnen. Maar wie
eenmaal binnen is, heeft een andere vraag dan het zoekwoord suggereert.

---

## 5. Plan

### Fase A — De datakwaliteit repareren (eerst, want vertrouwen)

- Toelichting verplicht meerenderen; test die faalt bij verlies van nuance
- Elk gegeven een `soort`: productvoorwaarde, app-instelling of praktijk
- Elk gegeven een eigen bron-URL in plaats van één per aanbieder
- De onjuiste ABN-kop corrigeren
- Alle zes de aanbieders opnieuw nalopen op de zes ontbrekende velden

### Fase B — De uitvoeringsvragen beantwoorden

Nieuwe pagina's die de werkelijke vragen adresseren:

- **Declaratie afgewezen: de tien meest voorkomende redenen** en wat u dan doet
- **Wat moet er op de factuur staan** — per aanbieder, met de eisen naast elkaar
- **Voorschieten en achteraf declareren** — mag het, tot welk bedrag
- **Uw depot loopt af** — verlengen, wat het kost, wat er met het restant gebeurt
- **Depot vroegtijdig beëindigd** — waarom dat gebeurt en wat uw opties zijn

### Fase C — De site herordenen rond het moment

De ingang wordt niet "welke bank" maar "waar staat u":

1. Ik oriënteer me nog → calculators
2. Ik heb een offerte → vergelijking en voorwaarden
3. **Ik heb een lopend depot → uitvoeringsgids** (nu vrijwel afwezig)
4. Mijn depot loopt af → verlengen en restant

### Fase D — Praktijkervaring als bron

Ervaringen van mensen met een lopend depot zijn informatie die nergens
gepubliceerd staat. Met bronvermelding "gemeld door een gebruiker, geverifieerd
op datum" wordt dat een onderscheidende laag die geen enkele bank biedt.

---

## 6. Waar ik mee begin

Fase A, en daarbinnen de systeemfix eerst: nuance kan niet meer verdwijnen,
en een test bewaakt dat. Daarna de onjuiste ABN-kop en de ontbrekende velden.

Reden voor die volgorde: zolang de presentatie nuance kan laten vallen, is
elke nieuwe cel die ik toevoeg een nieuwe kans op dezelfde fout.
