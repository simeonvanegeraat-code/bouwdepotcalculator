# Nulmeting homepage, 19 augustus 2026

Gemeten op de live site (https://www.bouwdepotcalculator.nl) op 375px breed,
kort nadat main live ging. Dit vervangt de nulmeting uit ONTWERPPLAN.md van 14
augustus: die cijfers zijn achterhaald door werk dat sindsdien is opgeleverd.

## Mobiel (375 × 812)

| Meting | 14-08 (ONTWERPPLAN) | 19-08 (gemeten) | Doel |
|---|---|---|---|
| Paginahoogte | 9.153px | **6.123px** | lager, maar geen doel op zichzelf |
| Schermen scrollen totaal | 11,3 | **7,5** | — |
| Schermen tot eerste invoerveld | 1,3 | **1,1** | **0** |
| Schermen tot de uitkomst | 3,1 | **0,3** | 0 |
| Secties in `<main>` | 29 | **5** | ~6 |
| Paragrafen in `<main>` | 61 | **30** | — |
| Afbeeldingen (`<img>`) | 0 | **0** | — |
| Decoratieve SVG-icoontjes | 0 | 6 | — |

## Wat dit betekent

Het grootste deel van fase 2 en 4 uit ONTWERPPLAN.md is al opgeleverd. Van 29
secties naar 5, en van 3,1 schermen naar 0,3 tot de uitkomst.

Wat er *niet* is opgelost: de pagina heeft nog steeds geen enkele echte
afbeelding. De zes die ik eerst telde zijn decoratieve SVG-icoontjes in knoppen
en keuzekaarten, geen illustraties. Het punt uit ONTWERPPLAN.md staat dus nog.

**Wat nog niet klopt: de volgorde van uitkomst en invoer.** De uitkomst staat
op 249px (0,3 scherm) en het eerste invoerveld op 856px (1,1 scherm). Je ziet dus
eerst een antwoord en moet daarna een scherm scrollen om je eigen cijfers in te
vullen. Voor een bezoeker die komt om te rekenen is dat de verkeerde volgorde:
hij wil invoeren en dan pas een uitkomst zien.

Dat is het enige harde punt dat overblijft uit de oorspronkelijke analyse, en het
is een kleiner probleem dan het document doet vermoeden.

## Typografie, vergeleken met de referenties

Gemeten op 1280px breed op rabobank.nl/particulieren en belastingdienst.nl.

| | Rabobank | Belastingdienst | Wij |
|---|---|---|---|
| H1 grootte | 60px | 34px | 30px |
| H1 gewicht | **400** | **400** | **660** |
| Body | 16px / 25,6 lh | 16px / 22 lh | 17px |
| Afbeeldingen op de homepage | 13 | 1 | 6 |

Beide referenties zetten hun koppen op gewicht 400 en laten de hiërarchie
volledig door grootte doen. Onze koppen staan op 560 tot 690. Zie
[../context/ontwerpreferenties.md](../context/ontwerpreferenties.md).

## Hoe opnieuw te meten

Browser op 375 breed, dan in de console:

    document.documentElement.scrollHeight
    document.querySelectorAll('main section').length
    document.querySelector('main input').getBoundingClientRect().top + scrollY
    document.querySelector('.reken__uitkomst').getBoundingClientRect().top + scrollY

Deel de laatste twee door `innerHeight` voor het aantal schermen.
