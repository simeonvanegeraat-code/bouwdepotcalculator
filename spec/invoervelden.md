# Spec: de invoerkolom

**Datum:** 02-09-2026
**Status:** in uitvoering — richting A gekozen op 02-09-2026
**Roadmap:** blok 2, UI/UX van de calculator

## Het probleem

De founder meldt dat de invoer op `bouwdepot-berekenen.html` goedkoop aanvoelt.
Hieronder staat wat daar concreet aan is, uitgelezen uit de live pagina op 2
september 2026 en vergeleken met drie andere sites. Geen indruk, gemeten
waarden.

### Wat er nu staat

| | Onze invoer |
|---|---|
| Veldhoogte | 52px |
| Invoertekst | 20px / gewicht 500, tabular |
| Label | **11px / 600, KAPITAAL, +0,1em spatiëring** |
| Rand | 1px `#d8e2d8`, radius 5px |
| Keuzelijsten | **2 systeemlijsten** (`appearance: auto`) |
| Vinkje | **systeemvinkje** (`appearance: auto`) |
| Schuifregelaars | 3 |
| Snelkeuzes | 10 chips, 11px KAPITAAL |

### Wat drie anderen doen

Alle drie gemeten op dezelfde manier, op 2 september 2026.

| | Wise | NerdWallet | ABN AMRO | **Wij** |
|---|---|---|---|---|
| Veldhoogte | 72px | 56px | 56px | **52px** |
| Invoertekst | 22px/600, hoofdbedrag 40px/400 | 16px/400 | 16px/400 | 20px/500 |
| Label | 14px/600, gewone zinsvorm | 13px/400, gewone zinsvorm | (aria) | **11px/600 KAPITAAL** |
| Systeemlijsten | **0** (5 eigen) | **0** | **0** (1 eigen) | **2** |
| Schuifregelaars | 0 | 0 | 0 | **3** |
| Radius | 0px | 0–2px | 8px | 5px |

Twee dingen springen eruit. **Niemand gebruikt een systeemlijst.** En **niemand
zet het label in kapitalen**: een veldlabel is iets wat je leest voordat je
typt, dus het krijgt leesmaat, geen chromemaat.

### De zes concrete gebreken, op volgorde van hoe hard ze aankomen

**1. Bedragen in invoervelden zijn niet opgemaakt.** Het veld toont `25000`.
Twee centimeter erboven staat op hetzelfde scherm `€ 16.936`, en de knop
eronder zegt `25.000`. Het rentelveld doet het wél goed (`3,80`). Zo staan
Nederlandse en kale notatie naast elkaar in één kolom.

Dit is niet één pagina. Over zeven rekenpagina's zijn **zeventien bedragvelden
en niet één is opgemaakt**: 400000, 350000, 300000, 360000, 87500, 150000. Een
veld met `400000` erin naast een uitkomst van `€ 1.204` is het duidelijkste
signaal dat hier geen afwerking op zit.

**2. Twee systeemlijsten en een systeemvinkje.** `Hypotheekvorm` en de
bankkeuze zijn kale `<select>`-elementen: het besturingssysteem tekent de pijl,
de tekst en de focusring. Naast velden die tot op de pixel zijn ingericht valt
dat op als het enige stuk dat niemand heeft aangeraakt. Bij de bankkeuze loopt
de langste optie (`Nog niet bekend of een andere aanbieder`) bovendien tegen de
pijl aan.

**3. Vier verschillende patronen in vier opeenvolgende velden.** Bedrag krijgt
veld + schuif + vier chips (204px hoog). Rente krijgt veld + schuif (148px).
Looptijd krijgt **alleen** een schuif, met de waarde klein en grijs rechtsboven
(77px). Hypotheekvorm krijgt een lijst. Vier vragen, vier bedieningen. Dat
maakt de kolom onrustig zonder dat de bezoeker er iets voor terugkrijgt.

**4. De labels zijn chrome geworden.** 11px kapitaal met spatiëring is de maat
die deze richting gebruikt voor stempels, kruimelpaden en kolomkoppen — dingen
die je overslaat. Voor `BEDRAG BOUWDEPOT` is dat te klein en te schreeuwerig
tegelijk.

**5. Het euroteken en het procentteken hangen los.** De `€` staat klein en grijs
links; de `%` wordt door de uitlijning naar de uiterste rechterrand geduwd, met
een gat van honderden pixels tussen `3,80` en `%`. Ze horen bij het getal, niet
bij de rand van het veld.

**6. De schuifregelaar oogt als speelgoed.** Een teal bol van 24px met een
zwarte ring van 2px op een lijn van 2px. Geen begin- en eindwaarde, geen
maatverdeling, en zwevend in de witruimte onder het veld. Van de drie
vergeleken sites gebruikt er geen enkele een schuifregelaar in een
geldberekening.

## Voor welke bezoeker

Beide reizen. Dit is de eerste handeling die iemand op de site verricht; als die
onafgewerkt aanvoelt, kleurt dat het vertrouwen in het antwoord dat eruit komt.
Zie [../customers/](../customers/).

## Wat we bouwen

**A. Bedragen opmaken tijdens het gebruik.** Bij het verlaten van het veld
wordt `87500` getoond als `87.500`; bij het aanklikken verdwijnt de opmaak weer
zodat typen niet wordt onderbroken. Dat patroon draait al in het termijnschema
van de nieuwbouwpagina sinds 19 augustus, en `leesGetal` en `toonGetal` in
`src/js/getallen.js` doen het werk al. Dit is de kleinste wijziging met het
grootste effect.

**B. Eén eigen keuzelijst in plaats van de systeemlijst.** Een knop met de
gekozen waarde en een eigen chevron, die een lijst opent. Toetsenbord en
schermlezer via `role="listbox"`. Vervangt de negen systeemlijsten op de site.
Het systeemvinkje krijgt dezelfde behandeling.

**C. Labels naar leesmaat.** 14px, gewicht 500, gewone zinsvorm, in de
inktkleur. De kapitaaltjes blijven waar ze horen: stempels, kolomkoppen,
kruimelpaden.

**D. Eén patroon per soort vraag.** Een bedrag krijgt een veld met snelkeuzes.
Een percentage krijgt een veld. Een looptijd krijgt een veld met snelkeuzes,
niet alleen een schuif. De schuifregelaar wordt een hulpmiddel náást het veld
en nooit de enige manier om een waarde te zetten.

**E. Het teken bij het getal.** `€` direct links van het bedrag en `%` direct
rechts ervan, allebei in dezelfde maat als het getal maar gedempt. Niet tegen
de rand van het veld geduwd.

**F. De schuif als liniaal.** Dunner spoor, kleinere greep zonder de zwarte
ring, en begin- en eindwaarde eronder in microtekst — zodat zichtbaar is wat het
bereik is.

## Wat we niet bouwen

- **Geen bibliotheek voor formulieren of keuzelijsten.** Een eigen lijst is
  zo'n zeventig regels; een pakket kost laadtijd op elke rekenpagina.
- **Geen zwevende labels** die in het veld staan en omhoog springen bij focus.
  Ze zien er slim uit en zijn slecht leesbaar bij ingevulde waarden.
- **Geen validatie tijdens het typen.** De meldingen blijven zoals ze zijn: bij
  het verlaten van het veld. Typen onderbreken is het patroon dat op 29 augustus
  juist is weggehaald.
- **Geen andere kleuren.** Dit gaat over vorm en afwerking, niet over het palet.
- **Niet de schuifregelaars weghalen.** Ze helpen bij het verkennen van een
  bereik; ze mogen alleen niet het enige zijn.

## Klaar wanneer

- [ ] Alle zeventien bedragvelden op de zeven rekenpagina's tonen Nederlandse
      notatie bij het verlaten van het veld, en kale cijfers zolang je typt.
- [ ] Een bedrag dat via een snelkeuze wordt gezet, ziet er hetzelfde uit als
      een bedrag dat is ingetypt.
- [ ] Geen enkele pagina bevat nog een zichtbare `<select>` of een
      systeemvinkje. Gecontroleerd met een telling over alle 32 pagina's.
- [ ] De eigen keuzelijst werkt met toetsenbord (pijltjes, Enter, Escape) en
      meldt zijn stand aan een schermlezer.
- [ ] De langste optie past in het veld zonder tegen de chevron te lopen.
- [ ] Veldlabels staan op 14px in gewone zinsvorm; kapitaaltjes komen in de
      invoerkolom niet meer voor behalve op de snelkeuzes.
- [ ] Elk soort vraag heeft één bediening, en die is op alle rekenpagina's
      gelijk. Nagelopen door de invoerkolommen van de elf rekenpagina's naast
      elkaar te leggen.
- [ ] De uitkomsten zijn ongewijzigd. Per pagina één waarde gecontroleerd tegen
      de huidige: 116, 1.204, 3.530, 1.250, 218, 2.750, 2.000, 60.000.
- [ ] Op 375px past invoer en uitkomst nog steeds in beeld zoals nu; de kolom
      wordt niet hoger dan hij was.
- [ ] Geen horizontale overloop op 320, 375 en 414px.

## Raakt

- `src/styles/broadsheet.css` — `.bs-omhulsel`, `.bs-veld__naam`, `.bs-select`,
  `.bs-schuif`, `.bs-keuzevak`, `.bs-chip`
- `src/js/getallen.js` — mogelijk een gedeelde koppelfunctie voor "opmaken bij
  verlaten, kaal bij focus"
- een nieuwe module voor de keuzelijst
- `src/js/bankkeuze.js` — schrijft zelf een `<select>`
- de elf rekenpagina's plus de drie generatoren in `scripts/`
- `context/componenten.md`

## Risico

**Dat opgemaakte bedragen verkeerd worden gelezen.** Dit is al een keer
misgegaan: op 29 augustus las het gedeelde geheugen `100.000` als `100` en gaf
dat door aan andere pagina's. `leesGetal` is daarna gemaakt en `tests/getallen.test.mjs`
bewaakt het, maar elke plek die een veldwaarde leest moet langs die functie.
**Dit is het punt waarop deze wijziging stuk kan gaan, en het moet met alle vijf
de schrijfwijzen per veld getoetst worden.**

**Dat een eigen keuzelijst minder toegankelijk wordt dan de systeemlijst.** Een
`<select>` doet toetsenbord, schermlezer en het mobiele wiel gratis. Een eigen
lijst moet dat allemaal zelf. Als het niet volledig lukt, is de systeemlijst
beter dan een mooie lijst die niemand met een toetsenbord kan bedienen.

**Dat de kolom hoger wordt.** Grotere labels en begin- en eindwaarden onder de
schuif kosten hoogte, en op 375px is de eis dat invoer en uitkomst in beeld
blijven. Meten, niet aannemen.

## Wat er al staat, 02-09-2026

Richting **A · Lijnen** uit [../demo/2026-09-02-invoervelden.html](../demo/2026-09-02-invoervelden.html)
is gekozen, en de invoer staat sindsdien links met de rekening rechts.

Gedaan: punt A (bedragen opgemaakt), C (labels op leesmaat), E (het teken bij
het getal), F (de schuif als liniaal), plus de velden van doos naar liniaal en
de snelkeuzes van knop naar tekst.

Nog te doen: punt B (de eigen keuzelijst en het eigen vinkje, want die vragen
JavaScript en toetsenbordwerk) en punt D (één bediening per soort vraag — de
looptijd heeft nog steeds alleen een schuif en geen veld om in te typen).

## Open vragen

1. ~~**Volgorde.**~~ **Beslist 02-09: A eerst, de rest als ontwerpronde.**
   Punt A bleek het opvallendste: zeventien velden toonden "400000" naast een
   uitkomst van "€ 1.204".
2. **De schuifregelaars.** Van de drie vergeleken sites gebruikt er geen enkele
   een schuif bij een geldbedrag. Wij hebben er dertien. Houden als hulpmiddel,
   of alleen bij looptijd en periodes waar een bereik echt betekenis heeft?
   Beslissing: founder.
3. **Referenties.** Ik heb Wise, NerdWallet en ABN AMRO gemeten; Independer en
   rabobank.nl waren niet bereikbaar vanaf hier. Zijn er sites waarvan de
   invoer jou wél bevalt? Twee voorbeelden maken de richting concreter dan mijn
   oordeel.

---

## Hermeting 02-10-2026: wat de samenvoeging heeft aangericht

De founder meldt dat `bouwdepot-berekenen.html` "niet gelijk en niet mooi" is.
Dat klopt, en het is sinds 2 september erger geworden: op 30 september is de
maandlasten-rekenmachine aan deze pagina toegevoegd. Er staan nu **twee
invoerkolommen onder elkaar die nooit naast elkaar zijn ontworpen**.

Gemeten op 375px, 2 oktober 2026.

### Elf velden, zeven vormen

| Veld | Bediening | Hoogte | Foutplek |
|---|---|---:|---|
| Bedrag bouwdepot | veld + schuif + 4 chips | 195px | ja |
| Hypotheekrente *(kolom 1)* | veld + schuif | 136px | ja |
| Looptijd | **alleen schuif**, waarde alleen-lezen | 68px | nee |
| Hypotheekvorm | systeemlijst | 85px | nee |
| Renteaftrek | systeemvinkje | 75px | nee |
| Totale hypotheek | veld | 78px | nee |
| Waarvan bouwdepot | veld | 78px | nee |
| Hypotheekrente *(kolom 2)* | veld | 78px | nee |
| Depotvergoeding | veld | 119px | nee |
| Bouwperiode | **kortveld `type=number`** + schuif | 76px | nee |
| Wanneer neemt u op? | systeemlijst | 126px | nee |
| Extra woonlasten | veld | 119px | nee |

**Hypotheekrente staat twee keer op één pagina, in twee vormen van 136px en
78px.** Dezelfde vraag, dezelfde eenheid, twee bedieningen. Dat is het
letterlijkste "niet gelijk" dat er is.

**De Bouwperiode-waarde staat op 14px** (`.bs-veld__waarde`) terwijl elke andere
waarde op 28px staat (`--bs-t-invoer`). Halve grootte voor hetzelfde soort
getal. Diezelfde kopsleuf draagt bij Looptijd een alleen-lezen span en bij
Bouwperiode een typbaar `type=number`-veld met spinknoppen.

### De oorzaak: er is geen veldcomponent

`class="bs-veld"` komt op **geen enkele pagina** voor. Er zijn losse deelklassen
(`bs-veld__kop`, `__naam`, `__waarde`, `__fout`) maar geen omhulsel dat ze bij
elkaar houdt. Elk veld is een kale `<div>` die met de hand opnieuw wordt
samengesteld. Niets dwingt een vorm af, dus lopen ze uiteen — precies zoals de
header in 26 bestanden uiteenliep tot er zes navigaties waren.

### Site-breed

| Meting | Waarde |
|---|---|
| Invoervelden (`.bs-omhulsel`) | **69** |
| Velden met een foutplek | **4** |
| `type="number"` | **40** |
| `type="text" inputmode="…"` | **74** |
| Zichtbare systeemlijsten | **42** (34 in de begroting) |

Vijfenzestig van de negenenzestig velden hebben geen plek om een melding te
tonen. En er zijn twee manieren om een getal te vragen, waarvan de minderheid de
slechtste is: `type=number` geeft spinknoppen, verandert bij scrollen en
accepteert de Nederlandse komma niet overal.

De spec hierboven noemde "negen systeemlijsten". Dat waren er toen al meer en
het zijn er nu 42.

### Wat er visueel misgaat

De liniaal is 343px breed; de waarde eindigt op 206px. **Er staat 137px leegte
rechts van elk bedrag** — veertig procent van de regel. Het getal hangt in het
midden zonder ergens aan vast te zitten. Dat is een direct gevolg van de
vaste 9ch-kolom van 2 september: die loste het verspringen op, maar maakte de
waarde los van de regel waar hij op staat.

Daarnaast loopt de langste optie nog steeds tegen de chevron aan: "Gelijkmatig
opnemen (sta…" wordt afgekapt. Dat stond al als gebrek 2 in deze spec.

## Het plan, 02-10-2026

1. **Eén `.bs-veld`-component** met een vaste interne volgorde: naam → liniaal →
   foutplek → hulp → schuif → chips. Eén klasse, één vorm, elf pagina's. Dit is
   de enige wijziging die voorkomt dat het opnieuw uiteenloopt.
2. **De waarde verankeren aan de liniaal.** Keuze voor de founder: het teken
   links en het bedrag rechts tegen het eind (grootboekregel), óf de liniaal
   laten meekrimpen met de waarde. Nu zweeft hij ertussenin.
3. **Eén bediening per soort vraag.** Bedrag → veld + chips. Percentage → veld.
   Looptijd en periode → veld + schuif, nooit alleen een schuif en nooit op
   halve grootte. Keuze → lijst. Dit is punt D, nog open sinds 2 september.
4. **`appearance: base-select`** in plaats van een eigen keuzelijst. Dit is punt
   B, en het is sinds de vorige meting van karakter veranderd: de eigenschap
   laat een échte `<select>` volledig opmaken, inclusief de uitklaplijst, met
   behoud van toetsenbord, schermlezer en het mobiele wiel. Daarmee vervalt het
   risico dat in deze spec als eerste stond — dat een eigen lijst minder
   toegankelijk wordt dan de systeemlijst — want er komt geen eigen lijst.
   Het staat achter `@supports (appearance: base-select)`; waar het ontbreekt
   krijgt de bezoeker exact de lijst van vandaag.
5. **De 40 `type="number"` naar `type="text" inputmode="numeric"`**, gelijk aan
   de 74 die het al goed doen.
6. **Een foutplek op elk veld**, via de component, met `:user-invalid` voor de
   opmaak — niet `:invalid`, want dat kleurt een leeg verplicht veld rood
   voordat de bezoeker iets heeft getypt.

### Afgewezen na onderzoek

**`field-sizing: content`** (Baseline sinds juni 2026). Laat een veld meekrimpen
met zijn inhoud. Aantrekkelijk, maar het brengt precies het verspringen terug
dat de vaste 9ch-kolom op 2 september heeft weggenomen: het procentteken
schoof zeventien pixels op zodra je een cijfer wegliet. Niet doen.

### Nog na te trekken

De beschikbaarheid van `appearance: base-select` komt uit zoekresultaten die ik
niet meer tegen een primaire bron heb kunnen leggen (Chrome/Edge 135+, Safari
27 van september 2026, Firefox achter een vlag). **Natrekken op MDN en
caniuse voordat punt 4 gebouwd wordt.** De richting verandert er niet door: de
eigenschap is ontworpen als progressieve verbetering, dus de terugval is de
lijst van vandaag, ongeacht de exacte percentages.

## De preview van 03-10-2026

[../demo/2026-10-03-invoervelden.html](../demo/2026-10-03-invoervelden.html)
zet de huidige vorm naast drie richtingen. De vraag die daar wordt voorgelegd is
er precies één: **waar staat de waarde ten opzichte van de lijn eronder?**

Een lijn onder een getal betekent typografisch óf een grootboekregel (de lijn is
de kolom, de waarde staat tegen het eind) óf een onderstreping (de lijn is zo
breed als de waarde). Wat er vandaag staat is geen van beide — een
grootboekregel met de waarde in het midden geparkeerd. Dát is waarom het niet af
voelt, en niet de kleur of de maat.

| | A · Grootboekregel | B · Naam op de regel | C · Onderstreping |
|---|---|---|---|
| Lijn | volle kolom | volle kolom | zo breed als de waarde |
| Naam | erboven | links op de lijn | erboven |
| Kolomhoogte op 375px | 802px | **688px** | 797px |
| Rechterkant van de kolom | recht | recht | rafelig |
| Zwakte | naam en waarde ver uit elkaar op breed scherm | lange naam en lang bedrag vechten om één regel | rafelige rechterkant |

Alle drie gemeten op 375px met dezelfde vier velden en hetzelfde vinkje.

### Wat in alle drie gelijk is

Dit volgt niet uit de vorm maar uit de meting van 02-10, en zit daarom in elke
kolom:

1. één component met een vaste interne volgorde, zodat een veld niet meer van
   vorm kan verschillen van zijn buurman;
2. elke waarde op 28px, ook de looptijd;
3. elke hoeveelheid heeft een veld om in te typen, nooit alleen een schuif;
4. één gereserveerde regel per veld voor hulptekst óf foutmelding;
5. geen `type=number`, dus geen spinknoppen;
6. de keuzelijst op dezelfde liniaal, via `appearance: base-select`.

### Wat de preview zelf aan het licht bracht

**Een vaste eenheidsgoot is nodig.** In de eerste opzet eindigden drie waarden
onder elkaar op 324, 305 en 290px: de eenheid (`%`, `jaar`) duwde het getal naar
links. Daarmee was het probleem verplaatst in plaats van opgelost. Met een vaste
goot vóór en ná de waarde eindigen ze alle drie op dezelfde x. Een grootboek
heeft precies daarom een smalle eenheidskolom naast de bedragkolom.

**De schuifregelaar is 22px hoog en moet 44px zijn.** Dat geldt ook voor de
huidige site: de greep is klein, maar het vak eromheen is wat je met een duim
raakt. Kost 12px per schuif.

**De foutstand verschuift niets.** Met de gereserveerde regel blijft de
kolomhoogte in alle drie de richtingen gelijk of er nu een melding staat of
niet. Op de site verspringt hij bij 65 van de 69 velden.

### Beslissing

Open: A, B of C. Daarna pas bouwen — dit raakt elf pagina's en drie generatoren.

---

## Opgeleverd 03/04-10-2026 — richting A

Richting A gekozen door de founder op 3 oktober, met als reden dat B het mooist
is maar omvalt bij grote getallen. Dat is dezelfde zwakte die in de preview
stond.

### Wat er is gebeurd

**De regel.** `.bs-omhulsel` is een grootboekregel geworden: teken links, waarde
rechts tegen het eind, met twee vaste goten (`--bs-veld-voor`, `--bs-veld-na`).
Puur CSS, dus alle velden op acht pagina's gingen in één keer mee. De waarde
eindigde eerder op 206px van een lijn van 343px; nu op het eind van de lijn, op
elke breedte.

**De schuiven.** Van zestien naar zeven. Eruit bij elk bedrag en elk percentage:
`range-amount`, `range-interest` (bouwdepot), `range-amount`, `range-rate`
(bouwrente), `range-fiscal-interest`, `range-land`, `range-construction`,
`range-interest` (nieuwbouw), en `in-onvoorzien` (begroting). Wat blijft staat
bij een looptijd of een periode, waar een bereik betekenis heeft. De schuif op
de homepage blijft ook: dat is geen invoerveld maar een voorproefje zonder veld.
Open vraag 2 van deze spec is daarmee beantwoord.

**De spinknoppen.** Alle zes de `type="number"`-velden zijn `type="text"` met
`inputmode` geworden, en `.bs-kort` is overal verdwenen — ook uit de CSS en uit
`context/componenten.md`. Vijf ervan stonden als alleen-lezen waarde van 14px in
de veldkop; die staan nu op een eigen regel op 28px, net als elke andere waarde.

**Looptijd** had alleen een schuif. Nu een veld met `jaar` erachter, dezelfde
controle als bedrag en rente, en de schuif ernaast als hulpmiddel.

**De keuzelijst** gebruikt `appearance: base-select` waar de browser het kent,
met een eigen chevron. Geen zelfgebouwde lijst: punt B van deze spec is
daarmee anders opgelost dan bedacht, en het toegankelijkheidsrisico dat
bovenaan stond vervalt.

**De controle is gedeeld.** `maakVeldlezer` staat nu in `src/js/getallen.js` en
wordt door beide rekenmachines op `bouwdepot-berekenen.html` gebruikt. De
maandlasten-rekenmachine las haar zes velden met `|| 0`: wie zich vertypte kreeg
geen melding maar een nul, en dus een geloofwaardige maandlast over een bedrag
dat hij nooit heeft ingevuld. Die zes velden hebben nu grenzen, meldingen en een
gereserveerde foutplek.

### Gemeten na afloop

| | Voor | Na |
|---|---:|---:|
| Schuifregelaars | 16 | **7** |
| `type="number"` | 6 | **0** |
| `.bs-kort` | 5 | **0** |
| Foutplekken | 4 | **11** |
| Schuifhoogte | 22px | **44px** |

Uitkomsten ongewijzigd, per pagina één waarde gecontroleerd met een leeg
geheugen: 116, 1.204, 3.530, 1.750, 2.750, 218, 2.000. 85 tests groen, build
slaagt, geen horizontale overloop op 375px.

### Wat nog openstaat

**Acht rekenmachines zetten invoer nog stil om naar nul** — 29 plekken met
`leesGetal(...) || 0` of `parseInt(...) || `. Alleen de twee op
`bouwdepot-berekenen.html` zijn nu gedekt. De gedeelde `maakVeldlezer` ligt
klaar; wat per rekenmachine nog moet is een grenzentabel met Nederlandse
meldingen en een foutplek per veld. Dat is een eigen stuk werk.

**Het vinkje blijft een systeemvinkje**, opgemaakt met `accent-color` in het
merkgroen. Dat is hier bewust: het is dezelfde redenering als bij
`base-select` — native houden en opmaken. Zelf namaken zou het enige
handgebouwde besturingselement opleveren op een pagina waar we dat bij de
keuzelijst juist hebben afgeraden.

### Validatieronde 04-10-2026 — alle acht de rekenmachines

De openstaande post hierboven is weg. Alle acht de rekenmachines lezen hun
velden nu via `maakVeldlezer`, met grenzen en een Nederlandse melding per veld.

| Rekenmachine | Velden |
|---|---:|
| bouwdepot-berekenen (verbouw) | 3 |
| bouwdepot-berekenen (maandlasten) | 6 |
| bouwrente-nieuwbouw | 4 |
| nieuwbouw | 6 |
| renteverlies-bouwdepot | 5 |
| dubbele-lasten-nieuwbouw | 6 |
| hypotheekrenteaftrek-gids | 4 |
| leenruimte | 5 |
| verbouwbegroting (reserve) | 1 |
| depotplanner (depotbedrag) | 1 |

**Dekking: 77 van 77 invoervelden heeft een melding.** De 34 posten van de
begroting en de depotstand van de planner houden hun eigen controle: die wordt
afgezet tegen een ánder veld en niet tegen een vaste grens, en dat is niet in
een grenzentabel uit te drukken.

Drie regels die uit het werk volgden:

- **Nul is soms een geldig antwoord.** Een aanbieder die geen depotvergoeding
  betaalt, een koper zonder dubbele lasten, grond die al in bezit is. Die velden
  staan op `exclusiefNul: false`; leeglaten geeft wél een melding, want dan is
  onduidelijk of er nul bedoeld is.
- **Een veld dat niet zichtbaar is, krijgt geen melding.** De hypotheekrente op
  de bouwrentepagina wordt pas gelezen als de bezoeker aangeeft dat hij de
  bouwrente meefinanciert.
- **De schuif volgt het veld, niet andersom.** Op twee plekken werd het veld
  tijdens het typen overschreven met de geklemde waarde. Dat onderbreken is op
  29 augustus juist weggehaald; nu komt er een melding in plaats van een stille
  correctie.

Uitkomsten ongewijzigd, met een leeg geheugen per pagina gecontroleerd: 116,
1.204, 2.000, 3.530, 1.250, 2.750, 218, 60.000, 50.000. 85 tests groen, build
slaagt.

**Opgelet bij de begroting:** `verbouwbegroting.html` is gegenereerd. De
foutplekken voor de leenruimte en de reserve staan daarom in
`scripts/build-begroting.mjs`; met de hand toegevoegd verdwijnen ze bij de
eerstvolgende build. Dat is tijdens dit werk één keer gebeurd.
