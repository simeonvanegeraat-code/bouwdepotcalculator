# De zwevende balk op alle rekenpagina's, 22 augustus 2026

De harde mobiele eis is dat invoer en uitkomst samen in beeld staan. Op 375px
haalde alleen de homepage dat, en dan nog niet letterlijk: het uitkomstblok
staat daar boven de invoervelden, en de zwevende balk nam het bedrag mee naar
beneden.

Die balk stond op **één** van de tien rekenpagina's.

## Gemeten voor de wijziging (375 × 812)

| Pagina | Uitkomstblok eindigt op | Balk | Haalt de eis |
|---|---|---|---|
| `index.html` | 705px | ja | ja |
| `maandlasten-bouwdepot.html` | 978px | nee | **nee, 166px voorbij de vouw** |
| acht andere rekenpagina's | vergelijkbaar | nee | nee |

## Na

Nieuwe module `src/js/stickybalk.js`, met een scripttag op de tien pagina's die
een `.ds-uitkomst` hebben. Geen eigen markup en geen eigen regel code per
pagina: de module leest de uitkomstkaart uit en spiegelt wat erin staat.

| | Voor | Na |
|---|---|---|
| Rekenpagina's met de balk | 1 van 10 | **10 van 10** |
| Regels code per pagina om hem te vullen | ~23 in `main.js` | **0** |
| Balk zichtbaar terwijl de uitkomst in beeld is | altijd | **nee** |
| Speling boven de vouw op de homepage | 25px | **107px** |
| Balk bij een lege uitkomst ("—", "€ 0") | n.v.t. | **blijft weg** |

De winst van 25 naar 107px komt doordat de balk niet meer permanent 66px
onderaan het scherm inneemt. Op de homepage was dat het verschil tussen een
uitkomstblok dat net paste en een dat tegen de balk aan zat.

## Gecontroleerd

- **Spiegelen:** op `maandlasten-bouwdepot` een depotbedrag gewijzigd; kaart ging
  van € 1.204 naar € 1.154 en de balk volgde vanzelf. Op `verbouwbegroting` drie
  posten ingevuld: € 66.000 in beide.
- **Wisselend label:** op de homepage de renteaftrek aangezet; label ging van
  "Bruto maandlast" naar "Netto maandlast na renteaftrek", gelijk met de kaart.
- **Geen dubbele balk:** de homepage had de balk in de HTML staan. Die is weg;
  er staat er precies één.
- **Lege uitkomst:** de depotplanner opent met "—" tot er een geldverstrekker is
  gekozen. Drie nieuwe tests in `tests/stickybalk.test.mjs` bewaken die regel en
  het inkorten van het label. 63 tests, build slaagt.

## Wat ik níét heb kunnen controleren

De balk verschijnt via een `IntersectionObserver`. In het browserpaneel vuren
`IntersectionObserver`, `scroll` én `requestAnimationFrame` **nul keer** — de
pagina schildert daar niet tijdens een script. Ik heb dat apart gemeten met een
verse waarnemer op dezelfde pagina.

Wat ik wél heb aangetoond: de CSS werkt (klasse `is-zichtbaar` forceren geeft
`display: flex`, balk 256 × 66px op de juiste plek), de beginstand wordt zonder
waarnemer gezet, en de inhoud klopt.

**Iemand moet dit op een echte telefoon nakijken:** open
`maandlasten-bouwdepot.html`, scroll naar de invoervelden, en kijk of de pil
verschijnt zodra het bedrag uit beeld gaat — en weer verdwijnt als je terugscrolt.
