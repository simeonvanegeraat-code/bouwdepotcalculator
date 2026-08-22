# De voettekst als vangnet, 22 augustus 2026

De kopnavigatie noemt op 28 van de 31 pagina's geen enkele rekentool. De
voettekst is daarmee het enige site-brede vangnet, en die noemde vier van de
elf tools.

Wie via Google rechtstreeks op een subpagina landt — waarschijnlijk het
grootste deel van het verkeer — kon `nieuwbouw`, `belasting`, `renteverlies`,
`bouwrente` en `dubbele lasten` van daaruit niet bereiken. Het `stappenplan` en
de `adviesgesprek-checklist` stonden op geen enkele pagina, ook niet in de
voettekst: die waren alleen via een zoekmachine te vinden.

## Gemeten, mobiel (375 × 812)

| Meting | Voor | Na |
|---|---|---|
| Links in de voettekst | 13 | **21** |
| Rekentools bereikbaar (van 11) | 4 | **11** |
| Aanraakhoogte per link | 24px | **44px** |
| Kolommen | 1 rij die omloopt | **2** |
| Voethoogte | 274px | **766px** |
| Paginahoogte | 8,56 schermen | **9,17** |

## Gemeten, desktop (1440 × 900)

| Meting | Voor | Na |
|---|---|---|
| Kolommen | 1 rij die omloopt | **4** |
| Voethoogte | — | 454px |
| Tekstoverloop | — | geen |

## Wat het kostte, en waarom dat mag

De pagina wordt 0,61 scherm langer op mobiel. Dat is de duurste meting in deze
wijziging en tegelijk de goedkoopste plek om ruimte te gebruiken: de voettekst
staat onder alles en duwt geen inhoud weg.

Eerste opzet was één kolom. Die werd 1186px hoog, ruim anderhalf scherm. Met
`minmax(9rem, 1fr)` passen er op 375px twee kolommen en zakt dat naar 766px.
Op schermen vanaf 760px staat het vast op vier, anders maakt `auto-fit` er vijf
en blijft de vijfde leeg.

## Wat er nog meer uit kwam

- `depotplanner.html` en `leenruimte.html` misten de link naar het
  cookiebeleid. Er waren drie verschillende voetteksten in omloop; nu één.
- De aanraakhoogte haalt met `min-height: var(--ds-tap)` precies de 44px uit de
  kwaliteitslat. Als losse regel in een kolom is daar ruimte voor; op één
  omlopende rij bleef die op 24px steken.
- `.voet__links` is verwijderd: geen enkele pagina gebruikt hem nog.
