# Spec: één document om mee te nemen

**Datum:** 22-08-2026
**Status:** opgeleverd
**Roadmap:** UI/UX van de rekenmachines

## Het probleem

De site leverde hetzelfde ding — een overzicht dat de bezoeker meeneemt naar
zijn adviseur of aannemer — op drie verschillende manieren, met drie
verschillende resultaten.

| Waar | Hoe | Resultaat |
|---|---|---|
| 7 rekenpagina's | jsPDF, met de hand getekend | Label vet, waarde op de volgende regel ingesprongen. Zes gegevens werden twaalf regels losse lijst. Geen tabellen mogelijk |
| verbouwbegroting | eigen printdocument + `window.print()` | Echte tabel, letter van de site, kolommen recht uitgelijnd |
| depotplanner | het scherm afdrukken | Wat toevallig niet door een printregel verborgen werd |

De founder zag het verschil zelf en vroeg de twee te vergelijken. Gemeten:
op de homepage stonden zeven gegevens als veertien regels onder elkaar; op de
verbouwbegroting stonden dezelfde soort gegevens in een tabel van zeven rijen
met de bedragen recht onder elkaar.

Daarnaast: jsPDF is 359 kB en werd lui geladen, dus die download viel precies op
het moment dat de bezoeker op de knop had gedrukt en stond te wachten.

## Voor welke bezoeker

Beide. De verbouwer neemt de specificatie mee naar zijn aannemer, de
nieuwbouwkoper neemt het maandlastenoverzicht mee naar zijn hypotheekadviseur.

## Wat we bouwen

Eén module, `src/js/afdrukdocument.js`, die van het rapport dat `reporting.js`
al samenstelt hetzelfde document maakt als de verbouwbegroting: kop met datum en
domein, een tabel met "Uw invoer" en "Uitkomst", eventuele meegestuurde tabellen,
en onderaan conclusie, interpretatie, aannames en de voorwaardentekst.

De knop opent het printvenster van de browser. Daar kiest de bezoeker zelf
printer of "Opslaan als PDF"; de documenttitel wordt tijdelijk gezet zodat
Chrome een bruikbare bestandsnaam voorstelt in plaats van de paginatitel.

Waarom dit beter is dan een PDF blijven tekenen:

- de browser zet de tabel, wij hoeven geen kolombreedtes te berekenen;
- de tekst blijft selecteerbaar en voorleesbaar, een getekende PDF is dat niet;
- het document erft de letter en de tokens van de site;
- geen 359 kB download op het moment dat iemand staat te wachten;
- er is nog maar één plek waar een overzicht ontstaat.

Wat de bezoeker inlevert: hij ziet een printvenster in plaats van een bestand
dat meteen in zijn downloadmap valt. Dat is één klik extra, en in ruil daarvoor
kiest hij zelf tussen papier en PDF.

## Wat we niet bouwen

- Geen serverzijdige PDF. Dat vraagt een backend die deze site niet heeft.
- Geen eigen printvoorbeeld in de pagina. Het printvenster van de browser is dat
  al, en beter dan wat wij zouden namaken.
- De depotplanner blijft voorlopig het scherm afdrukken. Die levert geen
  bedragen maar een reeks datums; dat is een eigen ontwerp en een eigen stuk
  werk.

## Klaar wanneer

- [x] Alle zeven rekenpagina's leveren hetzelfde document als de verbouwbegroting
- [x] Een meegestuurde tabel (het maandverloop van nieuwbouw) komt mee als tabel
- [x] `jspdf` staat niet meer in `package.json`
- [x] De pagina zelf staat niet op papier: kop, kruimelpad, voettekst en de
      rekenkolom vallen weg
- [x] Wie na een klik gewoon Ctrl+P drukt krijgt het scherm, niet een oud document
- [x] De knop past op 375px op één regel en is 44px hoog
- [x] `npm test` en `npm run build` slagen

## Raakt

`src/js/afdrukdocument.js` (nieuw), `src/js/reporting.js`, `src/js/main.js`,
`src/js/bouwrente.js`, `src/styles/calculator.css`, `tests/rapportvelden.test.mjs`,
`package.json`, en de zeven pagina's met een overzichtsknop.

## Risico

Het printvenster is per browser anders. In Chrome heet de PDF-optie "Opslaan als
PDF" en staat hij in dezelfde keuzelijst als de printers; in Safari zit hij
achter een knop linksonder. De knoptekst noemt daarom beide handelingen.

Tweede risico: `afterprint` wordt niet door elke browser gestuurd. Daarom ruimt
`drukAf()` na een seconde ook zelf op, zodat de pagina nooit onzichtbaar
blijft.

## Open vragen

Of de depotplanner hetzelfde document moet krijgen. Dat vraagt een eigen ontwerp
voor een tijdlijn op papier.
