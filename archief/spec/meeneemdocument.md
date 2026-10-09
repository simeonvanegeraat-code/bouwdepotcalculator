# Spec: het meeneemdocument als product

**Datum:** 02-09-2026
**Status:** voorstel
**Roadmap:** blok 2, UI/UX van de calculator

## Het probleem

Het document dat de bezoeker afdrukt of als PDF opslaat is het enige stuk van
deze site dat zijn huis verlaat. Hij neemt het mee naar een adviseur of een
aannemer, en het ligt daar naast offertes en hypotheekvoorstellen van partijen
met een ontwerpafdeling. Op dat moment is het document ons product en de site
alleen de weg ernaartoe.

Zo ziet het er nu uit, uitgelezen op `bouwdepot-berekenen.html`:

```
Bouwdepot maandlast berekening
Opgesteld op 2 september 2026 · bouwdepotcalculator.nl

UW INVOER
Bouwdepot bedrag        € 25.000
Hypotheekvorm           Annuïteiten
Hypotheekrente          3,80%
Looptijd                30 jaar
Belastingindicatie      Nee
Geldverstrekker         Niet opgegeven
UITKOMST
Bruto per maand         € 116

Conclusie / Interpretatie / Aannames
[voorbehoud]
```

Zes concrete gebreken, elk gemeten of uit de CSS af te lezen:

1. **Het antwoord is een tabelregel als alle andere.** "Bruto per maand € 116"
   staat op 14px, in hetzelfde ritme als "Looptijd 30 jaar". Op het scherm
   krijgt dat bedrag 42 tot 68px en een eigen kaart. Wie het papier op tafel
   legt moet zoeken naar het getal waar het hele gesprek over gaat.
2. **Geen enkele herkenning.** Geen woordmerk, geen accentkleur, geen stempel.
   Op het scherm is de uitkomst een rekening op papier met een kop, een stempel
   en een getande onderrand; op papier is het een tekstverwerkerdocument. De
   ontwerptaal houdt precies op waar de waarde zit.
3. **Geen paginameubilair.** Geen paginanummers, geen herhaalde kop op blad
   twee, geen voetregel met bron en datum. Het maandverloop van de
   nieuwbouwpagina is 26 rijen; dat loopt over twee bladen en het tweede blad
   is dan anoniem.
4. **Geen plek voor de eigen context van de bezoeker.** Wie dit meeneemt naar
   drie aannemers heeft drie identieke vellen. Er is geen regel voor een
   projectnaam of een eigen aantekening.
5. **Het voorbehoud staat als gelijke tussen de inhoud.** "Aannames" moet de
   lezer lezen; de juridische slotalinea hoeft hij alleen te kunnen vinden. Ze
   zien er nu hetzelfde uit.
6. **De printopmaak is nooit ontworpen, alleen overgezet.** Bij de omzetting
   naar `broadsheet.css` zijn de `bs-spec__*`-regels meegegaan zoals ze waren.
   Er is geen `@page`-marge, geen `print-color-adjust`, dus of het accent
   überhaupt meegedrukt wordt hangt van de browserinstelling af.

En: **de depotplanner doet niet mee.** Die drukt het scherm af, omdat hij
datums levert in plaats van bedragen en daar nooit een vorm voor is gemaakt.

## Voor welke bezoeker

Beide reizen, maar met verschillend gewicht. De verbouwer neemt het mee naar
een adviseur om te toetsen of zijn plan financierbaar is. De nieuwbouwkoper
neemt het mee naar een gesprek waarin het depot er al is en de vraag is wat het
kost. Zie [../customers/](../customers/).

## Wat we bouwen

**Eén document, drie lagen, in deze volgorde op het blad:**

1. **Kop met herkenning.** Woordmerk links, "Indicatie" als stempel rechts, en
   daaronder de titel van de berekening. Dezelfde onderdelen als het
   rekeningblad op het scherm, zodat wie het scherm heeft gezien het papier
   herkent. Eén zwarte lijn eronder.
2. **Het antwoord, groot.** Het bedrag waar de berekening op uitkomt in de
   antwoordmaat, met zijn label erboven in kapitaaltjes en de conclusiezin
   eronder. Dit is het eerste wat je ziet als het vel op tafel ligt.
3. **De onderbouwing.** Invoer en uitkomst als nu, maar met de invoer eerst en
   de uitsplitsing eronder — de lezer moet kunnen narekenen. Daarna
   interpretatie en aannames als leestekst.

**Paginameubilair.** Op elk blad een voetregel met de bron, de datum en
"blad *n* van *m*". Op blad twee en verder een smalle herhaalde kop met de
titel, zodat een los blad nog te plaatsen is.

**Een regel voor de bezoeker zelf.** Onder de kop een veld "Project" met een
stippellijn, in te vullen met een pen. Bewust niet digitaal: dat zou invoer zijn
die wij zouden moeten bewaren, en dat willen we niet.

**Het voorbehoud onderscheiden.** De juridische slotalinea in de kleinste maat,
met een dunne lijn erboven, los van de aannames.

**De depotplanner krijgt zijn eigen variant.** Zelfde kop, zelfde voet, maar in
plaats van een bedrag een tijdlijn: passeerdatum, einddatum, uiterste
declaratiedatum en de geplande posten met hun bedragen, in chronologische
volgorde. Het antwoord bovenaan is daar geen euro maar een datum — de dag
waarop het depot sluit.

## Wat we niet bouwen

- **Geen PDF-bibliotheek.** Dit gaat via het printvenster van de browser, zoals
  nu. jsPDF is er in augustus juist uitgehaald; 359 kB voor een downloadknop.
- **Geen logo of huisstijl-illustratie.** Het woordmerk is tekst en blijft
  tekst.
- **Geen invulbare PDF-velden.** De projectregel is een lijn om met een pen op
  te schrijven.
- **Geen tweede ontwerp per rekenpagina.** Eén document, met de depotplanner als
  enige uitzondering omdat die geen bedrag als antwoord heeft.
- **Geen e-mailen of opslaan bij ons.** Het document verlaat het apparaat van de
  bezoeker alleen via zijn eigen printer of PDF-opslag.

## Klaar wanneer

- [ ] Het antwoord staat op blad één in de antwoordmaat, minstens drie keer zo
      groot als een tabelregel, en is het eerste wat opvalt bij een blik van
      twee seconden op het uitgeprinte vel.
- [ ] Woordmerk en stempel staan op blad één; blad twee en verder dragen een
      herhaalde kop met de titel.
- [ ] Elk blad heeft een voetregel met bron, datum en "blad n van m".
- [ ] Alle elf rekenpagina's leveren hetzelfde document op, met dezelfde
      volgorde en dezelfde onderdelen. Nagelopen door alle elf knoppen te
      klikken en de uitvoer naast elkaar te leggen.
- [ ] De depotplanner levert zijn eigen variant en drukt niet meer het scherm af.
- [ ] Het maandverloop van de nieuwbouwpagina (26 rijen) breekt netjes over
      twee bladen: geen rij half afgesneden, kolomkop herhaald.
- [ ] Kleur is expliciet geregeld met `print-color-adjust`, en het document is
      ook zonder kleur leesbaar — getest met een grijswaardeninstelling.
- [ ] `@page` heeft een vastgelegde marge, zodat het niet per browser verschilt.
- [ ] Het voorbehoud is zichtbaar ondergeschikt aan de aannames.
- [ ] Bedragen blijven identiek aan het scherm. Per pagina één waarde
      gecontroleerd.

## Raakt

- `src/js/afdrukdocument.js` — de opbouw van het document
- `src/js/reporting.js` — mogelijk een veld erbij voor de projectregel
- `src/js/depotplanner.js` — de eigen variant
- `src/styles/broadsheet.css` — het `@media print`-blok en `.bs-spec__*`
- `context/componenten.md` — nieuwe onderdelen, met waar ze níét voor zijn
- `tests/rapportvelden.test.mjs` — bewaakt al dat elk veld een Nederlands label
  heeft; blijft gelden

## Risico

**Dat het document mooier wordt en minder bruikbaar.** De verleiding is een vel
dat er goed uitziet op het scherm van de ontwerper. De toets is of iemand die
het op tafel legt binnen twee seconden het bedrag ziet, niet of het elegant is.

**Dat kleur wegvalt.** Veel mensen printen in grijswaarden of hebben een lege
kleurcartridge. Elk onderscheid dat alleen op kleur rust, verdwijnt dan. Alles
moet ook zonder kleur werken.

**Dat het langer wordt dan één blad.** Nu past de eenvoudigste berekening op één
vel. Een grote kop en een projectregel kosten ruimte. Als de basisberekening
daardoor over twee bladen loopt, is dat een verslechtering; dat moet gemeten
worden en niet aangenomen.

**Dat de depotplanner een tweede ontwerptaal wordt.** Hij krijgt een andere
inhoud, niet een andere vorm. Kop, voet en typografie zijn identiek.

## Open vragen

1. **Papierformaat.** A4 is de aanname. Iemand die op Letter print krijgt andere
   marges. Vastleggen op A4, of allebei laten werken?
2. **De projectregel.** Eén regel "Project", of ook "Datum gesprek" en
   "Besproken met"? Meer regels maken het bruikbaarder als gespreksvel en
   drukker als overzicht. Beslissing: founder.
3. **Wanneer.** Dit is werk van een dag of meer, en de AdSense-aanvraag loopt.
   Nu doen, of na de uitslag? Beslissing: founder.
