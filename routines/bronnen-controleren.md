# Routine: bronnen controleren

**Wanneer:** elke maandag. De workflow
`.github/workflows/voorwaarden-check.yml` draait om 07:00 UTC en opent een
issue als een bronpagina is gewijzigd of een controledatum is verlopen. Geen
issue betekent geen werk.

**Uitgangspunt:** de workflow past niets aan. Bijwerken is mensenwerk, want een
verkeerde cel is erger dan een verouderde cel.

> **De zwakke schakel is niet het script.** Op 2 oktober 2026 stonden de issues
> van 7 en 21 september nog open. De wijzigingen erin waren echt: Obvion had een
> datumvoorwaarde toegevoegd en onze Rabobank-tekst sprak de bron tegen. Drie
> weken lang stond er iets onjuists op de site terwijl de melding klaarlag.
> Zet de maandagcontrole in je agenda, of niemand doet het.

## Stappen

1. Lees het issue: welke aanbieder, welke pagina, wat is er veranderd.
2. Open de bronpagina zelf. Vertrouw de diff niet als samenvatting; een
   gewijzigde pagina kan ook alleen een cookiebanner zijn. Van de vier
   meldingen in september waren er twee meubilair en twee inhoudelijk.
3. Raakt de wijziging een veld in `data/bouwdepot-voorwaarden.json`?
   - **Nee** - alleen de snapshot verversen, data ongemoeid laten.
   - **Ja** - ga door.
4. Pas de waarde aan, en in dezelfde beweging de `detail` en de bron-URL. Een
   waarde zonder actuele toelichting is een halve wijziging.
5. Is het nieuwe gegeven niet gepubliceerd? Dan `null` met status
   `niet-gepubliceerd`. Nooit een schatting, ook niet als de oude waarde
   waarschijnlijk nog klopt.
6. Werk `gecontroleerd` bij voor die aanbieder.
7. Draai:

```bash
npm run build:voorwaarden && npm run build
```

   In die volgorde: `npm run build` draait de tests vóór de generatoren, dus
   anders toets je nieuwe data tegen oude HTML.
8. Faalt een test, lees hem: hij bewaakt meestal dat een paginatekst nog een
   oud getal noemt. Herstel de tekst, niet de test.
9. Loop de checklist "wijzigingen aan data" in [../review.md](../review.md) af.
10. Sluit het issue met wat je hebt aangepast en waarom.

## De drie blinde vlekken

Rabobank (HTTP 403), ING (time-out) en MUNT blokkeren geautomatiseerd ophalen.
De wekelijkse controle ziet daar dus nooit iets. Ze staan daarom op
`automatischTeControleren: false` en krijgen een termijn van **drie maanden** in
plaats van zes. Dat is het enige vangnet dat ze hebben.

Onbereikbare bronnen leveren bewust géén wekelijks issue op: dat zou elke
maandag dezelfde melding geven en die ga je negeren. Ze verschijnen in het
rapport zodra er een andere reden is om te kijken.

**ING is via de browser wel te lezen**, ook al haalt het script hem niet op. Een
handmatige controle is dus gewoon te doen.

## De vervalkalender

Loopt vanzelf via het wekelijkse issue, maar handig om te weten wanneer het
druk wordt:

| Vervalt | Aanbieders |
|---|---|
| 18 november 2026 | MUNT |
| 30 december 2026 | Rabobank, ING |
| 18 februari 2027 | ABN AMRO, Florius, Nationale-Nederlanden, SNS |
| 30 maart 2027 | Obvion |
| 2 april 2027 | a.s.r., ASN Bank, Argenta, Centraal Beheer |

Februari is de zwaarste maand: vier aanbieders tegelijk. Overweeg er een of twee
eerder te doen zodat het niet opstapelt.

## Een aanbieder toevoegen

**Wat het kost, gemeten op 2 oktober 2026:** per aanbieder ongeveer een half tot
heel uur bronwerk, als die aanbieder zijn voorwaarden in gewone HTML publiceert.

1. Lees de officiële bouwdepotpagina en vul het record in
   `data/bouwdepot-voorwaarden.json`. Kijk naar `a.s.r.` als voorbeeld van een
   volledig record.
2. Elke waarde komt van die pagina. Wat er niet staat krijgt `null` met status
   `niet-gepubliceerd`. Geen enkele uitzondering.
3. Draai `npm run build:voorwaarden && npm run build`.
4. De tests zeggen wat er nog mist. Ze bewaken onder meer dat de pagina in
   `vite.config.js` en `public/sitemap.xml` staat, dat elke telling op de site
   opnieuw klopt, en dat elk genoemd maandental in de data terug te vinden is.
5. Tellingen in paginateksten **opnieuw berekenen**, niet het telwoord
   vervangen. Bij de uitbreiding naar twaalf bleek daardoor dat de site al
   onjuist zei dat één aanbieder 1% minder vergoedt; dat zijn er twee.

### Wanneer je een aanbieder níet toevoegt

Als hij zijn voorwaarden niet in leesbare vorm publiceert. Allianz zet drie van
de elf velden op een gewone pagina en de rest in PDF's; Hypotrust zet de
antwoorden achter JavaScript-only uitklappers. Een aanbieder met drie gevulde
velden levert precies de halflege pagina op die
[../spec/schema-opruimen.md](../spec/schema-opruimen.md) heeft weggehaald.

Beter één aanbieder minder dan twaalf lege cellen erbij.

## Een veld toevoegen of weghalen

De regel uit [../spec/schema-opruimen.md](../spec/schema-opruimen.md):

- Publiceert **minstens één** aanbieder het? Dan hoort het in de tabel, ook als
  de rest leeg blijft. Blanco is dan informatie: die aanbieder is minder open.
- Publiceert **niemand** het? Dan hoort het niet in de tabel maar in de
  bevinding "Wat geen enkele aanbieder publiceert".

Komt er een aanbieder bij die wél iets over eigen arbeid publiceert, dan moet
dat veld dus terug.

## Handmatig draaien

```bash
npm run check:voorwaarden
```
