# Routine: bronnen controleren

**Wanneer:** elke maandag. De workflow
`.github/workflows/voorwaarden-check.yml` draait om 07:00 UTC en opent een
issue als een bronpagina is gewijzigd. Geen issue betekent geen werk.

**Uitgangspunt:** de workflow past niets aan. Bijwerken is mensenwerk, want een
verkeerde cel is erger dan een verouderde cel.

## Stappen

1. Lees het issue: welke aanbieder, welke pagina, wat is er veranderd.
2. Open de bronpagina zelf. Vertrouw de diff niet als samenvatting; een
   gewijzigde pagina kan ook alleen een cookiebanner zijn.
3. Raakt de wijziging een veld in `data/bouwdepot-voorwaarden.json`?
   - **Nee** - alleen de snapshot verversen, data ongemoeid laten.
   - **Ja** - ga door.
4. Pas de waarde aan, en in dezelfde beweging de `detail` en de bron-URL. Een
   waarde zonder actuele toelichting is een halve wijziging.
5. Is het nieuwe gegeven niet gepubliceerd? Dan `null` met status
   `niet-gepubliceerd`. Nooit een schatting, ook niet als de oude waarde
   waarschijnlijk nog klopt.
6. Werk `_laatstBijgewerkt` bij.
7. Draai:

```bash
npm run build
```

8. Faalt een test, lees hem: hij bewaakt meestal dat een paginatekst nog een
   oud getal noemt. Herstel de tekst, niet de test.
9. Loop de checklist "wijzigingen aan data" in [../review.md](../review.md) af.
10. Sluit het issue met wat je hebt aangepast en waarom.

## Handmatig draaien

```bash
npm run check:voorwaarden
```
