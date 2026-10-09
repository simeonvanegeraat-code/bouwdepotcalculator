# Archief

Documentatie van vóór 9 oktober 2026. **Naslag, geen instructie.**

Op 9 oktober 2026 is de productrichting van BouwdepotCalculator.nl vervangen
door acht kerndocumenten in de repo-root. Alles in deze map beschrijft hoe het
dáárvoor was. Het staat er nog om drie redenen: de meetgegevens zijn echt, de
fouten zijn duur betaald, en de financiële en juridische redeneringen zijn nog
steeds geldig.

**Neem hier geen ontwerp- of werkafspraken uit over.** Bij tegenspraak met de
kerndocumenten winnen die laatste. Bij tegenspraak over hoe de site *nu* werkt
wint de code.

## Wat is waardoor vervangen

| Gearchiveerd | Vervangen door |
|---|---|
| `plannen/PRODUCTPLAN.md` | `PRODUCT_VISION.md` |
| `plannen/ONTWERPPLAN.md`, `plannen/ONTWERPPLAN-HIERARCHIE.md` | `DESIGN_SYSTEM.md` |
| `plannen/KWALITEITSPLAN.md` | `FEATURES.md` §18 (Definition of Done) |
| `plannen/ADSENSE-PLAN.md`, `plannen/ADSENSE-AANVRAAG-PLAN.md` | `SEO_ADSENSE.md` |
| `roadmap-2026-07-tot-09.md` | `ROADMAP.md` |
| `context/bedrijf.md` | `PRODUCT_VISION.md` §1–3 |
| `context/ontwerpreferenties.md` | `DESIGN_SYSTEM.md` |
| `spec/*` | `FEATURES.md` |

## Wat hier bewaard blijft omdat het nog waarde heeft

**`plannen/MARKT-EN-ADSENSE-ONDERZOEK.md`** — het onderzoek van 22 september
2026 met de gemeten staat van de site: 29 van de 31 pagina's leverden in zeven
maanden 33 kliks op, de homepage was goed voor 92 procent van alle kliks. Dat
zijn echte metingen en ze vormen het vertrekpunt voor de nulmeting in mijlpaal
0 van `ROADMAP.md`. `SEO_ADSENSE.md` §8 corrigeert wél de conclusies van het
oudere `ADSENSE-PLAN.md`; neem die niet over.

**`plannen/CONCURRENTIE-EN-OORDEEL.md`** — wat andere aanbieders doen en waar
dit product bewust van afwijkt.

**`plannen/REGELS-HERZIENING.md`** — de telling van 9 oktober 2026: 157 regels
over zes plekken verspreid, waarvan er zes aantoonbaar in de weg stonden. Het
uniciteitscriterium van 55 procent is daar ingetrokken omdat het een
zelfverzonnen en zelfvernietigende maatstaf bleek.

**`spec/invoervelden.md`** — de meting en herziening van de invoerkolom, inclusief
waarom een waarde tegen het eind van zijn regel hoort te staan en waarom
`field-sizing: content` hier bewust niet gebruikt wordt.

**`spec/schema-opruimen.md`** — de regel wanneer een veld in de
vergelijkingstabel hoort: publiceert minstens één aanbieder het, dan is blanco
informatief; publiceert niemand het, dan vergelijkt blanco niets. Die regel
wordt nog steeds toegepast en staat verder nergens.

## Wat níet is gearchiveerd

Deze blijven in gebruik en staan dus niet hier:

- `context/JURIDISCHE-CHECK.md` — de AFM-grens is een harde juridische
  randvoorwaarde, geen historische analyse. Verhuisd van `plannen/` naar
  `context/`.
- `context/techniek.md`, `context/componenten.md`, `context/beslissingen.md`
- `customers/` — de bezoekersreizen en de echte meldingen van bezoekers
- `routines/` — terugkerende taken met een vast stappenplan
- `demo/` — voor-en-na bewijs van interfacewerk
- `review.md` — het logboek van opgeleverd werk
