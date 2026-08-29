# De tools rekenden met veertig euro, 29 augustus 2026

Bij het één voor één doorlopen van de rekentools met de vraag "krijgt de
bezoeker waarvoor hij kwam" kwam er iets ernstigers uit dan verwacht.

## Wat er misging

Op de homepage het depotbedrag intypen zoals elke Nederlander dat doet:

| Ingetypt | Wat de tool ervan maakte | Wat de bezoeker zag |
|---|---|---|
| `40.000` | **€ 40** | € 0 per maand, samenvatting "Bouwdepot bedrag € 40" |
| `3,8` bij rente | leeg | € 0 per maand |

Geen foutmelding, geen rode rand. Niet "het werkt niet" — dat merk je — maar een
compleet, geloofwaardig ogend antwoord op een bedrag dat de bezoeker nooit heeft
ingevuld. Op de pagina die 217 van de 882 klikken binnenhaalt.

De oorzaak: `<input type="number">`. Daarin leest de browser de punt als
decimaalteken, dus `40.000` is voor hem veertig komma nul nul nul. Het veld geldt
dan als geldig, dus de bestaande foutafhandeling sloeg niet aan.

Die foutafhandeling werkte verder prima: `2000000` gaf *"Boven een miljoen euro
is geen bouwdepot meer"*, `-5000` gaf *"Vul een bedrag boven de nul in"*, `abc`
gaf *"Vul het bedrag van uw bouwdepot in"*. Alleen de Nederlandse schrijfwijze
glipte erdoor.

## Wat er is veranderd

**Twee lezers in plaats van één.** `leesGetal` bestond al voor de begroting: daar
is de punt duizendscheiding. Voor percentages klopt dat niet — die liggen tussen
nul en twintig, dus daar kan een punt niets anders zijn dan een decimaalteken.
Vandaar `leesPercentage`. Dat onderscheid is geen theorie: bij een eerdere ronde
is `leesGetal` op een renteveld losgelaten, waarna "3.80" als 380 procent werd
gelezen en de piekmaandlast naar € 159.533 schoot.

**32 velden omgezet** van `type="number"` naar `type="text"` met de juiste
`inputmode`, over negen pagina's. Maandvelden bleven `number`: daar bestaat geen
Nederlandse schrijfwijze voor en het spinnetje is er handig.

**37 leesaanroepen** omgezet naar de juiste lezer: 28 in `main.js`, 9 in
`leenruimte.js`, `depotplanner.js` en `bouwrente.js`.

**Negen standaardwaarden** van `3.80` naar `3,80`. Anders leert de site de
bezoeker zelf de verkeerde schrijfwijze aan.

## Wat ik onderweg zelf stukmaakte

Het gedeelde geheugen dat waarden tussen pagina's meeneemt las de velden met een
kale `Number()`. Nu die velden tekst waren, sloeg het `100.000` op als **100**.
Wie op de ene pagina een ton invulde, kreeg op de volgende honderd euro terug.

Gevonden door na de omzetting in `localStorage` te kijken, niet door te klikken.
`shared-form-memory.js` gebruikt nu per sleutel dezelfde lezer, en schrijft
percentages terug met een komma.

## Nagemeten, alle tien de tools

Elke pagina met kale notatie, Nederlandse notatie, en met euroteken en
procentteken erbij. Overal dezelfde uitkomst:

| Pagina | Kaal | Nederlands | Gelijk |
|---|---|---|---|
| index | € 186 | € 186 | ja |
| maandlasten-bouwdepot | € 1.458 | € 1.458 | ja |
| nieuwbouw | € 3.884 | € 3.884 | ja |
| belasting | € 14 | € 14 | ja |
| renteverlies-bouwdepot | € 2.750 | € 2.750 | ja |
| bouwrente-nieuwbouw | € 5.000 | € 5.000 | ja |
| dubbele-lasten-nieuwbouw | € 3.450 | € 3.450 | ja |
| leenruimte | € 60.000 | € 60.000 | ja |
| depotplanner | 18 maanden | 18 maanden | ja |
| verbouwbegroting | was al goed | — | — |

Doorgifte tussen pagina's getoetst: `100.000` en `4,25` op maandlasten kwamen op
renteverlies aan als 100000 en 4,25, met uitkomst € 2.750.

En de bestaande grenzen doen het nog: 2000000 en 99% geven nog steeds hun eigen
melding.

## Tweede bevinding: een zin die niet klopte

Met de renteaftrek aan stond er nog steeds *"Bij annuïteiten blijft dit bedrag de
hele looptijd gelijk."* Dat geldt voor de bruto last. Het getal eronder was op
dat moment de netto last, en die blijft juist niet gelijk: het rentedeel daalt,
dus de aftrek daalt mee, dus de netto last **stijgt** door de jaren. De zin
beloofde het omgekeerde van wat er gebeurt.

## Wat goed bleek

- **Leenruimte** waarschuwt drie keer dat dit een waardetoets is en geen
  inkomenstoets, de eerste keer op 0,33 scherm.
- **Depotplanner** meldt eerlijk "geen datum — Rabobank publiceert geen
  verlenging" in plaats van iets te verzinnen.
- **Nieuwbouw** is exemplarisch bij een fout termijnschema: *"90% (moet 100%
  zijn)"* plus *"Er ontbreekt nog 10%. Pas het termijnschema aan voor een
  uitkomst."*
