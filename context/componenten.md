# Componenten

Wat er bestaat, waar het voor is, en waar het bewust niet voor is.

De tokens staan in `src/styles/design-system.css` en documenteren zichzelf: een
regel die `--ds-tap: 44px` heet zegt al wat hij is. Componenten niet. De CSS
vertelt je hoe `.bankmelding` eruitziet, maar niet dat de amberkleur "let op"
betekent en dat je hem dus niet moet pakken voor een gewone mededeling. Dat gat
vult dit bestand.

**Kijk hier eerst voordat je een nieuwe klasse maakt.** Er zijn er 109, verspreid
over vier stylesheets en ruim 1.800 regels. De kans dat wat je nodig hebt er al
staat is groot: `.alleen-print` is een keer opnieuw uitgevonden terwijl hij er
al was.

`tests/componenten.test.mjs` faalt zodra er een component in de CSS staat die
hier ontbreekt.

---

## 1. Basis — `design-system.css`

Geladen door alle 31 pagina's. Dit is de woordenschat; de rest bouwt erop voort.

### Structuur en tekst

| Component | Waarvoor |
|---|---|
| `.ds` | Staat op `<body>`. Draagt de basisinstellingen |
| `.ds-wrap` | Inhoudsbreedte met marge links en rechts. Elke sectie krijgt er een |
| `.ds-heading` | Kop binnen een blok |
| `.ds-title` | Sectietitel |
| `.ds-lead` | Introzin onder een titel |
| `.ds-eyebrow` | Kleine bovenkop. Vervangt een kopregel zonder er een te zijn, dus hij telt niet mee in de koprangorde |
| `.ds-small` | Kleinere tekst |
| `.ds-caption` | Bijschrift, kleinst leesbaar |
| `.ds-muted` | Gedempte tekstkleur |
| `.ds-sectie` | Sectie met verticaal ritme. Varianten geven een sectie een eigen achtergrond |
| `.ds-sectiekop` | Kopblok van een sectie: eyebrow, titel, lead |
| `.ds-op` | Opsomming |

### Oppervlakken

| Component | Waarvoor |
|---|---|
| `.ds-card` | Kaart met rand en schaduw |
| `.ds-sunk` | Verzonken vlak, rustiger dan een kaart |
| `.ds-uitkomst` | **De antwoordkaart.** Het belangrijkste element van de site. Elke rekenpagina heeft er precies één, en `stickybalk.js` leest hem uit |
| `.ds-uitsplitsing` | Regels onder het bedrag: label links, waarde rechts |

### Invoer

| Component | Waarvoor |
|---|---|
| `.ds-veld` | Veldgroep: label plus invoer |
| `.ds-invoer` | Het invoerveld zelf. Minstens 44px hoog |
| `.ds-schuif` | Schuifregelaar |
| `.ds-segment` | Segmentkeuze in plaats van een keuzelijst, bij twee opties |
| `.ds-knop` | Knop. Varianten voor primair en rustig |
| `.ds-chips` / `.ds-chip` | Snelkeuzes: klein, rond, direct. Selectie via `aria-pressed`, niet via een klasse |

### Keuzekaarten

| Component | Waarvoor |
|---|---|
| `.ds-keuzes` / `.ds-keuze` | Het keuzeblok op de homepage: waar sta je nu, en waar ga je heen |

### Vergelijking van geldverstrekkers

| Component | Waarvoor |
|---|---|
| `.vgl-lijst` / `.vgl-item` | De vergelijking, als lijst en niet als brede tabel |
| `.vgl-balken` / `.vgl-schaal` / `.vgl-legenda` | Looptijd als balk op een gedeelde schaal, met schaalaanduiding en legenda |
| `.vgl-feiten` | Feiten per aanbieder |
| `.vgl-leeg` | **Ontbrekende gegevens blijven zichtbaar leeg.** Nooit invullen met een schatting |
| `.vgl-merk` | Merkaanduiding van een aanbieder |
| `.vgl-controle` | Bron en controledatum |
| `.vgl-detail` | Detailpagina: definitielijst in plaats van tabel |

---

## 2. Paginameubilair — `pagina.css`

Geladen door alle 31 pagina's. Kop, voet en de bouwstenen van tekstpagina's.

### Raamwerk

| Component | Waarvoor |
|---|---|
| `.kop` | De bovenbalk. Blijft plakken bij scrollen |
| `.merk` | Het woordmerk. Mag de navigatie overstemmen |
| `.kruimel` | Kruimelpad. Valt weg bij printen |
| `.toolbalk` | Tweede kopregel met de zeven rekenhulpen bij naam. Vanaf 640px; daaronder dekt het uitklapmenu ze af. Noemt de dingen zelf, geen categorielabels |
| `.voet` | De voettekst. Sinds 22-08 het vangnet met alle elf tools |
| `.kern` | Kerncijfers bovenaan: antwoord eerst |
| `main::before` | Het meetraster bovenaan, dat halverwege het eerste scherm oplost in papier. Geen component om te gebruiken maar wel om te kennen: `main` is daardoor een eigen stapelcontext en `main > *` staat op `z-index: 1` |

### Tekstblokken

| Component | Waarvoor |
|---|---|
| `.uitleg` | Tekstblok |
| `.proza` | Leestekst met een prettige regellengte |
| `.kernzin` | Eén zin die het onderwerp samenvat |
| `.punten` | Puntenlijst |
| `.bronnen` | Bronvermeldingen |
| `.melding` | **Neutrale losse mededeling.** Kost op mobiel ongeveer 134px door de ruime binnenmarge; te zwaar voor een enkele regel |
| `.voorbeeld` | Uitgewerkt rekenvoorbeeld |
| `.wel-niet` | Twee lijsten naast elkaar: wat wel en wat niet |
| `.vragen` / `.vraag` | Genummerde vragen of stappen |
| `.scenarios` / `.scenario` | Scenario's naast elkaar. Op mobiel kaarten, geen brede tabel |
| `.checklijst` | Afvinkbare voorbereidingslijst |
| `.fouten` / `.fout` | Genummerde problemen, elk met een eigen oplossingsblok |
| `.tijdlijn` | Fasen die elkaar opvolgen. **Let op de naambotsing, zie §5** |
| `.fase-blok` | Blok binnen die tijdlijn |
| `.cat` | Uitklapbare categorie. **Let op de naambotsing, zie §5** |

### Bankkeuze

| Component | Waarvoor |
|---|---|
| `.bankkeuze` | De ene keuze die op elke rekenpagina terugkomt. Bewust rustig |
| `.bankstrook` | De voorwaarden van de gekozen bank, naast de uitkomst |
| `.bankmelding` | **Amber: dit betekent "let op".** Alleen voor waarschuwingen die bij bepaalde aanbieders horen. Niet gebruiken voor gewone tekst |
| `.per-bank` | Eenvoudige lijst van waarden per aanbieder |

### Gidsen en beleidspagina's

| Component | Waarvoor |
|---|---|
| `.redenen` / `.reden` | Declaratiegids: afwijzingsredenen |
| `.beleid` | Genummerde artikelen met leesbare regellengte |
| `.beleid-rijen` | Verwerkingen of opslag als rijen, niet als brede tabel |
| `.wijzigingen` | Wijzigingenoverzicht, nieuwste bovenaan |
| `.contactkaart` | Contactgegevens, prominent |

---

## 3. Rekenpagina's — `calculator.css`

Geladen door de tien rekenpagina's plus de depotplanner en de begroting.

### Raamwerk

| Component | Waarvoor |
|---|---|
| `.reken` | De rekensectie |
| `.aanhef` | De hero van een rekenpagina. De paginatitel moet hier groter zijn dan een sectietitel |
| `.beloften` | Drie feiten onder de belofteregel: bron en controledatum, geen registratie, wij verkopen niets. Vanaf 640px, want op mobiel is er 25px speling boven de stickybalk en deze regel kost er zestig |
| `.veldrij` | Rij invoervelden |
| `.prefix-veld` | Veld met een voorvoegsel, bijvoorbeeld een euroteken |
| `.input-icon-wrapper` | Veld met een icoon erin |
| `.ds-keuzevak` | Aanvinkbaar blok in plaats van een kaal vinkje: groter raakvlak |
| `.uitleg-details` | Uitklapbare verdieping onder de uitkomst |
| `.uitkomst-acties` | Knoppenrij onderin de antwoordkaart |
| `.vervolgstap` | **De volgende vraag, onderaan de uitkomstkolom.** Bewust een kale tekstregel en geen knop: een tweede knop maakt van de uitkomst een keuzemenu. Kost 60px waar een kader er 134 kost |
| `.sticky-result-bar` | De zwevende pil met het bedrag op mobiel. Wordt door `stickybalk.js` gemaakt, niet met de hand in HTML gezet |
| `.knop-in-tekst` | Een knop die als link in een alinea meeloopt |
| `.notitie` | Kleine kanttekening |
| `.is-tekort` | Tekort in rood. Een negatieve buffer is een signaal, geen getal |

### Uitkomsten tonen

| Component | Waarvoor |
|---|---|
| `.verhouding` | Balk die rente en aflossing tegen elkaar afzet |
| `.verloop` | Grafiek met het maandverloop. Eigen SVG, geen bibliotheek |
| `.details-table` / `.details-table-wrapper` | Maand-tot-maandtabel. De wrapper laat hem binnen zijn eigen kader scrollen |
| `.formule` | Formuleblok in de uitleg |
| `.fiscaal-kengetal` | Los kengetal in een uitklapblok |

### Termijnschema (nieuwbouw)

| Component | Waarvoor |
|---|---|
| `.terms-kop` / `.terms-totaal` | Kop en totaal van het schema |
| `.term-kop` / `.term-row` | Kopregel en rijen delen hetzelfde raster, anders lopen de koppen niet gelijk met de velden |
| `.term-month-input` | Maandveld |
| `.term-veldnaam` | Labeltje bij het veld, alleen zichtbaar in de kaartweergave op mobiel |
| `.btn-remove` | Verwijderknop. De kolom is 44px breed |

### Depotplanner

| Component | Waarvoor |
|---|---|
| `.posten` / `.post-kop` / `.post-rij` | De postenlijst. Kop en rij delen hetzelfde raster |
| `.plan-eisen` | Wat de bank bij een declaratie wil zien |
| `.tijdlijn` / `.stap` | De datumreeks als verticale lijn met stippen. **Naambotsingen, zie §5** |

### Verbouwbegroting

| Component | Waarvoor |
|---|---|
| `.budget` | Het budgetblok |
| `.cat` | Uitklapbare categorie. De samenvattingsregel is de knop: naam, aantal posten en subtotaal. **Naambotsing, zie §5** |
| `.post` | Eén kostenpost |
| `.merkje` | Label bij een post, bijvoorbeeld of hij uit het depot mag |
| `.alleen-print` | **Verschijnt alleen op papier.** Bestaat al; niet opnieuw maken. De begroting gebruikt hem voor de specificatie, `afdrukdocument.js` voor het overzicht |

---

## 4. Stappenplan — `stappenplan.css`

Geladen door `stappenplan.html` en `adviesgesprek-checklist.html`.

| Component | Waarvoor |
|---|---|
| `.voortgang` / `.plan-progress-track` | Voortgangsbalk |
| `.fasen` / `.fase` | De fasen van het plan |
| `.stap` | Aanvinkbaar controlepunt met een ruim raakvlak. **Naambotsing, zie §5** |
| `.dossier` | Dossiermatrix |
| `.scenariovel` | Invulbaar scenariovel op de advieschecklist |

---

## 5. Naambotsingen

Vijf klassen zijn in twee stylesheets gedefinieerd. Dat werkt nu, maar alleen
omdat de volgorde van de `<link>`-regels toevallig goed staat: `calculator.css`
komt na `pagina.css` en wint. Wie die volgorde omdraait, breekt twee pagina's.

| Klasse | Waar | Botst op |
|---|---|---|
| `.tijdlijn` | `pagina.css` + `calculator.css` | `depotplanner.html` laadt beide |
| `.cat`, `.cat__kop`, `.cat__posten` | `pagina.css` + `calculator.css` | `verbouwbegroting.html` laadt beide |
| `.stap` | `calculator.css` + `stappenplan.css` | geen: geen pagina laadt beide |

De eerste twee zijn echte overlappingen en verdienen een eigen naam. Nog niet
opgelost — gevonden bij het opstellen van deze lijst op 22 augustus 2026, buiten
de opdracht van dat moment gelaten.

---

## Wanneer maak je een nieuwe component?

1. Zoek eerst hierboven, en daarna met `grep` in de stylesheets.
2. Bestaat er iets dat het bijna doet? Voeg dan een variant toe (`--`), geen
   nieuwe klasse.
3. Nieuwe klasse? Zet hem in de smalste stylesheet die volstaat. Alleen wat
   overal geldt hoort in `design-system.css`.
4. Zet hem in dit bestand, anders faalt de test.
5. Schrijf erbij waarvoor hij níét is. Dat is het deel dat de CSS niet kan
   zeggen, en het deel dat verdubbeling voorkomt.
