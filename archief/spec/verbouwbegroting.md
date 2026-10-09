# Spec: verbouwbegroting onder de loep

**Datum:** 19-08-2026
**Status:** alle zes stappen uitgevoerd 19-08-2026
**Roadmap:** blok 2 en 4 van de weekfocus, en punt 1 uit de bouwvolgorde van
[PRODUCTPLAN.md](../plannen/PRODUCTPLAN.md)

Zes stappen. Stap 1 tot en met 5 zijn uitgevoerd en staan hieronder met wat er
gemeten is; stap 6 is de uitvoering.

---

## Wat ik nu al weet

Een oppervlakkige scan, zodat dit plan over de echte pagina gaat:

| | |
|---|---|
| Omvang | 60 kB HTML, 11 secties, 274 regels in `src/js/begroting.js` |
| Posten | 34, in 6 categorieën, uit `data/verbouwposten.json` |
| Per post | `id`, `naam`, `vastAanWoning`, `genoemdDoor`, `toelichting` |
| Invoer | een bedrag per post, plus één veld voor onvoorzien |
| Uitvoer | totaal, plus een printbare specificatie (`id="specificatie"`) |
| Testdekking | **geen enkele test raakt de begroting of de posten** |

Twee dingen vallen nu al op, en die neem ik mee als hypothese, niet als conclusie:

1. **De data bevat geen enkel bedrag.** Geen kengetal, geen richtprijs, geen
   bandbreedte. `PRODUCTPLAN.md` beschrijft juist "posten opbouwen per ruimte of
   onderdeel, **met kengetallen als startpunt**". De bezoeker begint dus met 34
   lege velden en moet elk bedrag zelf weten.
2. **26 van de 34 posten zitten vast aan de woning, 8 niet.** Dat onderscheid
   bepaalt of een bank de post accepteert, en het is het enige stuk eigen data
   dat deze pagina heeft.

---

## Stap 1 — Bevindingen (uitgevoerd 19-08)

De pagina is er beter aan toe dan verwacht. Wat goed staat en niet gesloopt mag
worden:

- **De specificatie klopt.** Alleen ingevulde posten, met prioriteit, "betaald
  uit" en bedrag. De bedragen komen exact overeen met het scherm.
- **Geen prijzen is een besluit, geen gat.** Staat zo in de modulekop van
  `begroting.js`, en het volgt uit de regel dat we niets tonen zonder bron. Mijn
  hypothese dat hier kengetallen ontbraken was dus verkeerd.
- **De doorgifte naar de maandlast werkt echt.** `?bedrag=` wordt op de homepage
  uitgelezen; dat is geen loze link.
- Alle 34 velden hebben een toegankelijke naam en halen 44px. Bankkeuze staat op
  de pagina, prioriteit per post ook.

### Must fix

**1. De getalnotatie, op 34 velden tegelijk.** Gemeten:

| Getypt | Uitkomst |
|---|---|
| `20000` | € 22.000 |
| `20.000` | **€ 22** |
| `20 000` | veld wordt leeggegooid |
| `€ 20.000` | veld wordt leeggegooid |
| `20000,50` | veld wordt leeggegooid |

Dezelfde fout als in het termijnschema van de nieuwbouwpagina, maar hier over 34
velden. Wie zijn offerte overtypt als "20.000" ziet zijn totaal duizendvoudig
kelderen zonder dat er iets misgaat op het scherm.

**2. Negatieve bedragen.** `-5000` telt als nul, maar het veld blijft -5000 tonen.
Geen melding.

### Should fix

**3. Onrealistisch hoge invoer.** 999.999.999 wordt gewoon doorgerekend.

**4. De twee splitsingen sluiten niet op elkaar aan.** Noodzakelijk (€ 25.000)
plus gewenst (€ 12.000) is € 37.000, terwijl het totaal € 40.200 is. Het verschil
is de reserve, die in geen van beide zit. Dat klopt rekenkundig maar staat
nergens uitgelegd.

**5. Geen subtotaal per categorie.** Zeven categorieblokken, nul subtotalen. Bij
34 velden weet je daardoor niet waar je staat.

**6. De tien procent onvoorzien staat er zonder herkomst.** De uitleg is goed
("sloopwerk legt vaak verborgen gebreken bloot") maar noemt niet dat tien procent
de gangbare vuistregel is, en dat het bij oudere panden hoger ligt.

---

## Stap 2 — Hoe anderen dit doen (uitgevoerd 19-08)

Volledig uitgewerkt in
[../context/concurrentie-verbouwbegroting.md](../context/concurrentie-verbouwbegroting.md).
De kern: er zijn twee modellen, een kostenschatter met prijsranges en een
offertetrechter. **Iedereen toont bedragen, niemand onderbouwt ze**, en het
tweede model draait op het doorsturen van persoonsgegevens — voor ons uitgesloten.

Wat we er wel van leren: zij vragen minder. Aanvinken is lichter dan 34 velden
invullen. Dat is een vormkwestie en kost ons geen enkel verzonnen cijfer.

---
## Stap 3 — Wat deze tool is

> Geen kostenschatter maar een **financierbaarheidsbegroting**: hij vertelt niet
> wat uw verbouwing kost — dat weet u uit uw eigen offertes — maar welk deel
> ervan uw bank gaat betalen, en wat u zelf moet meebrengen.

Dat onderscheid is de hele positie. Zie
[../context/concurrentie-verbouwbegroting.md](../context/concurrentie-verbouwbegroting.md):
iedereen toont bedragen, niemand onderbouwt ze, en de helft van de markt gebruikt
de calculator als offertetrechter. Wij hebben als enige de splitsing per post en
een specificatie om mee te nemen.

**Wat hij niet wordt:** geen prijzenlijst, geen offerteaanvraag, geen tweede
verbouwbegroting naast de depotplanner.

---

## Stap 4 — Het plan

Vier wijzigingen, in deze volgorde:

1. **Getalnotatie op alle 34 velden**, met `src/js/getallen.js` dat er al is —
   geen tweede manier. Inclusief melding bij negatief en bij onrealistisch hoog.
2. **Tests op de rekenkern.** Die zijn er nu niet, terwijl elke andere datastroom
   er wel een heeft. De splitsing depot/eigen en noodzakelijk/gewenst hoort
   vastgelegd te worden voordat er iets aan verandert.
3. **Subtotaal per categorie**, zodat je bij 34 velden ziet waar je staat.
4. **Twee tekstcorrecties:** de reserve benoemen bij de splitsing, en de
   herkomst van de tien procent erbij zetten.

Bewust niet: de pagina opknippen in stappen of posten pas op verzoek tonen. Dat
is een herontwerp, en de meting geeft er geen aanleiding toe zolang de
invoerfout er nog in zit.

---

## Stap 5 — Controle vóór uitvoering

- Elke bewering hierboven is in de browser gemeten, niet uit een plandocument
  overgenomen.
- Geen enkel voorstel voegt een bedrag toe dat we niet kunnen onderbouwen. De
  tien procent krijgt een herkomst, geen nieuw cijfer.
- Niets leest als advies: de splitsing beschrijft wat aanbieders doorgaans
  accepteren, met "doorgaans" en de bank erbij.
- Punt 1 hergebruikt bestaande code; punt 3 voegt geen nieuw component toe.

## Stap 6 — Uitvoering

In kleine stukken, elk met zijn eigen controle:

1. Getalnotatie en meldingen — must fix, blokkeert de rest.
2. Tests op de rekenkern.
3. Subtotaal per categorie.
4. De twee tekstcorrecties.

Na elk stuk: `npm run build`, en meten in de browser op 1440 en 375.

---

## Wat dit niet is

Geen prijzenlijst en geen offertetrechter. Geen tweede begroting naast de
depotplanner: die gaat over een lopend depot, deze over de fase ervoor.
