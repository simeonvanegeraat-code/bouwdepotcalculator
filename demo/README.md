# Demo

Voor-en-na bewijs van UI-werk. Reden dat deze map bestaat: er is eerder
dagenlang over ontwerpkwaliteit geoordeeld zonder de site ooit te bekijken.
Ontwerpkwaliteit werd afgeleid uit woordentellingen en HTML-structuur, en toen
er eindelijk gemeten werd bleek het beeld heel anders.

Dus: geen enkele UI-verandering geldt als klaar zonder een meting hier.

## Werkwijze

1. Meet voor de wijziging. Draai `npm run dev`, open de pagina op 1440 breed en
   op 375 breed.
2. Leg de waarden vast in `demo/<datum>-<onderwerp>.md`, met screenshots
   ernaast.
3. Wijzig.
4. Meet opnieuw op dezelfde breedtes en vul de na-kolom in.
5. Verwijs ernaar vanuit het logboek in [../review.md](../review.md).

## Wat je minimaal meet

| Meting | Waarom |
|---|---|
| Paginahoogte in px, desktop en mobiel | Zegt meer over rommel dan woordaantal |
| Schermen scrollen tot het eerste invoerveld | De bezoeker komt om te rekenen |
| Schermen scrollen tot de uitkomst | De harde eis is nul op mobiel |
| Aantal secties in `<main>` | 29 gelijkvormige secties was de kern van het probleem |
| Grootte van H1 en H2 in px | De hierarchie liep op de rekenpagina's om |

Meet in de browser, schat niet. Waarden zonder breedte erbij zijn onbruikbaar.

## Formaat

    # <onderwerp>, <datum>

    | Meting | Voor | Na | Doel |
    |---|---|---|---|
    | Paginahoogte mobiel | 9153px | ... | ... |

    Screenshots: voor-mobiel.png, na-mobiel.png

## Nulmeting

De cijfers uit ONTWERPPLAN.md van 14 augustus 2026 gelden als nulmeting voor de
homepage: 4.471px desktop, 9.153px mobiel, 11,3 schermen scrollen op mobiel,
3,1 schermen tot de uitkomst, 29 secties in `<main>`, 61 paragrafen, 0
afbeeldingen.
