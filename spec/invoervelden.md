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
