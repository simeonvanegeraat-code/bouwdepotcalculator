# Componenten

Wat er bestaat, waar het voor is, en waar het bewust niet voor is.

De tokens staan in `src/styles/design-system.css` en documenteren zichzelf: een
regel die `--ds-tap: 44px` heet zegt al wat hij is. Componenten niet. De CSS
vertelt je hoe `.bankmelding` eruitziet, maar niet dat de amberkleur "let op"
betekent en dat je hem dus niet moet pakken voor een gewone mededeling. Dat gat
vult dit bestand.

**Kijk hier eerst voordat je een nieuwe klasse maakt.** Er zijn er ruim 150, verspreid
over vijf stylesheets en ruim 2.200 regels. De kans dat wat je nodig hebt er al
staat is groot: `.alleen-print` is een keer opnieuw uitgevonden terwijl hij er
al was.

`tests/componenten.test.mjs` faalt zodra er een component in de CSS staat die
hier ontbreekt.

---

## 1. Basis — `design-system.css`

Geladen door 31 pagina's. Dit is de woordenschat van de oude richting; zie ook §5.

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
| `.toolbalk` | Tweede kopregel met de acht rekenhulpen bij naam. Vanaf 640px; daaronder dekt het uitklapmenu ze af. Noemt de dingen zelf, geen categorielabels |
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
| `.tijdlijn` | Fasen die elkaar opvolgen. **Let op de naambotsing, zie §6** |
| `.fase-blok` | Blok binnen die tijdlijn |
| `.cat` | Uitklapbare categorie. **Let op de naambotsing, zie §6** |

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
| `.cat` | Uitklapbare categorie. De samenvattingsregel is de knop: naam, aantal posten en subtotaal. **Naambotsing, zie §6** |
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
| `.stap` | Aanvinkbaar controlepunt met een ruim raakvlak. **Naambotsing, zie §6** |
| `.dossier` | Dossiermatrix |
| `.scenariovel` | Invulbaar scenariovel op de advieschecklist |

---

## 5. De broadsheet-richting — `broadsheet.css`

Geladen door `bouwdepot-berekenen.html`, en straks door de homepage. Dit is de
nieuwe ontwerptaal uit [ONTWERPPLAN.md](../ONTWERPPLAN.md) §3.

**Waarom dit náást `design-system.css` staat en niet erin.** Dat bestand wordt
door alle 31 pagina's geladen; de tokens erin omzetten zou 29 pagina's in één
klap herstijlen die er niet op gebouwd zijn. Dit is de migratiedoos: pagina's
stappen er één voor één op over met `<body class="bs">`, en zodra ze er allemaal
op staan verhuist dit naar `design-system.css`.

Zolang die migratie loopt bestaan er twee tokenverzamelingen naast elkaar. Dat
is bewust en tijdelijk. Wat gelijk moet blijven is de accentkleur: `--bs-accent`
en `--ds-accent` zijn allebei `#0E5F58`.

**De prefix is `bs-` en dat is geen netheid maar noodzaak:** `.kop` en `.voet`
bestaan al in `pagina.css`. Twee betekenissen voor dezelfde klasse is een fout
die zich pas maanden later meldt.

### Raamwerk

| Component | Waarvoor |
|---|---|
| `.bs` | Zet de tokens op `<body>`. Zonder deze klasse doet niets het |
| `.bs-wrap` | Breedtebegrenzing, 1400px. Ruimer dan `.ds-wrap`: de broadsheet leeft van marge |
| `.bs-micro` | Kapitaaltjes op 11px. Doet hier het werk dat elders een kader doet. **Niet voor lopende tekst** |
| `.bs-kop` / `.bs-merk` / `.bs-staafjes` | Paginakop. De staafjes zijn de menuknop: een staafdiagram, want het is een rekensite |
| `.bs-kruimel` | Kruimelpad |
| `.bs-sectie` / `.bs-sectiekop` / `.bs-titel` | Sectieraamwerk |
| `.bs-kolommen` | Drie kolommen tekst onder een streep. Voor uitleg, niet voor tools |
| `.bs-donker` | Omgekeerde sectie op perszwart. Eén per pagina, anders verliest hij zijn functie |
| `.bs-band` | De accentband onderaan. De handtekening van de pagina |
| `.bs-voet` | Paginavoet |

### Actie en invoer

| Component | Waarvoor |
|---|---|
| `.bs-knop` | Primaire actie. Enige plek met diepte, en die schaduw is getint met het accent. Varianten: `--spook` op donkere grond (**niet op licht: de rand verdwijnt**), `--licht` secundair op licht |
| `.bs-beloften` | Rij korte beloften met een accentblokje ervoor |
| `.bs-veld__kop` / `.bs-veld__naam` / `.bs-veld__waarde` / `.bs-veld__fout` | Label, huidige waarde en foutmelding bij een invoerveld |
| `.bs-omhulsel` | Invoerveld met een voor- of achtervoegsel (`€`, `%`) |
| `.bs-select` / `.bs-schuif` | Keuzelijst en schuifregelaar |
| `.bs-chips` / `.bs-chip` | Voorkeuzeknoppen. Stand staat in `aria-pressed`, **niet in een eigen klasse** |
| `.bs-keuzevak` | Aanvinkoptie met toelichting |
| `.bs-veldrij` | Twee velden naast elkaar vanaf 560px |
| `.bs-kort` | Kort getalveld in de veldkop, naast het label. Voor een maat die je zowel wilt typen als slepen |
| `.bs-hulp` | Hulptekst onder een invoerveld. Legt dít veld uit. **Niet voor waarschuwingen** — die horen in `.bs-melding` met de accentrand |
| `.bs-notitie` | Kanttekening bij de uitkomst: wat het getal niet zegt |
| `.bs-vervolgstap` | De volgende vraag, onder de uitkomstkolom. **Bewust een kale tekstregel en geen knop:** een tweede knop maakt van de uitkomst een keuzemenu |
| `.bs-uitklap` / `.bs-uitklap__knop` | Uitklapblok. De knopvariant bestaat omdat `main.js` dat blok zelf schakelt en geen `<details>` aanstuurt |

### De uitkomst

| Component | Waarvoor |
|---|---|
| `.bs-blad` | De uitkomst als rekening op papier, met gescheurde onderrand. Variant `--zwevend` ademt, kantelt en print zichzelf uit; **alleen op de homepage**, want daar is het blad een illustratie en niet het antwoord. **Geen nabootsing van een bankafschrift:** het draagt onze naam en het woord "indicatie" |
| `.bs-blad__stempel` | Het label rechtsboven op het blad |
| `.bs-antwoord` / `.bs-antwoord__bedrag` | Het antwoord, met de markeerstift eronder. Die streep is een achtergrondverloop en geen pseudo-element, zodat er één techniek is voor markeren |
| `.bs-verhouding` | Balk met de verdeling rente/aflossing |
| `.bs-uitsplitsing` | Regels onder het antwoord. Regels met `hidden` worden expliciet verborgen, want `display:flex` wint anders van dat attribuut |
| `.bs-bank` / `.bs-bank__feiten` | Bankstrook. **De `.detail`-tekst rendert altijd mee**; `tests/nuance.test.mjs` faalt als dat niet gebeurt |
| `.bs-melding` | Let-op-blok met een accentrand links. Voor nuance, niet voor een gewone mededeling. Variant `--let-op` maakt die rand amber, voor een waarschuwing die alleen in bepaalde situaties speelt |
| `.bs-kengetal` | Eén afgeleide waarde met zijn naam ernaast, in een uitklapblok. **Voor wat het antwoord verklaart, niet voor het antwoord zelf** |
| `.bs-voorbehoud` | Kleine tekst met het voorbehoud |

### De homepage

| Component | Waarvoor |
|---|---|
| `.bs-muur` | De typografische muur: op de homepage ís de kop de pagina. **Alleen daar** — een rekenpagina heeft een korte kop nodig, geen wand |
| `.bs-toneel` / `.bs-kantel` | Perspectief en muiskanteling om het zwevende blad. Drie geneste lagen omdat twee transforms op één element elkaar overschrijven |
| `.bs-regelaar` | De schuif onder het blad. Rekent één voorbeeld door, bewust niet de hele calculator |
| `.bs-kern` | Drie kerncijfers uit de dataset op de donkere sectie. **De getallen staan met de hand in de HTML** en `tests/kerncijfers.test.mjs` bewaakt dat ze bij `data/bouwdepot-voorwaarden.json` blijven kloppen |

### De begroting

| Component | Waarvoor |
|---|---|
| `.bs-cat` | Uitklapbare categorie met posten. Dichtgeklapt is de begroting een keuzelijst van zes regels in plaats van vierendertig velden. **Ook een haak:** `begroting.js` zoekt hierop |
| `.bs-post` | Eén begrotingspost: naam, merkje, bedrag en prioriteit. Variant `--eigen-geld` markeert wat doorgaans niet uit het depot mag |
| `.bs-merkje` | Klein label bij een post. `--depot` en `--eigen` komen uit de data; `--eigenbank` zet `begroting.js` erbij als de gekozen bank die post expliciet noemt. **Alleen die laatste krijgt de volle accentkleur** |
| `.bs-alleen-print` / `.bs-spec__…` | De specificatie die alleen op papier verschijnt. Op het scherm is het formulier het gereedschap; op papier is een ingevuld formulier geen document |
| `.bs-proza` | Leestekst met een prettige regellengte, voor uitleg zonder kolommen |

### De depotplanner

Geen rekenmachine maar een agenda. `depotplanner.js` schrijft deze onderdelen en
bedient alleen deze pagina, dus de klassen konden meteen mee naar `bs-`.

| Component | Waarvoor |
|---|---|
| `.bs-segment` | Keuze tussen twee opties, in plaats van een keuzelijst. **Ook een haak:** de module leest `.bs-segment [data-modus]` |
| `.bs-posten` / `.bs-postrij` / `.bs-postkop` | De posten die nog uit het depot betaald moeten worden. Zonder die lijst rekent de pagina alleen passeerdatum plus looptijd uit, en dat weet de bezoeker al uit zijn akte |
| `.bs-tijdlijn` / `.bs-stap` | Fasen die elkaar opvolgen, met de datum als anker. `--geweest` dempt wat achter je ligt, `--letop` markeert het moment waarop je iets moet regelen, `--zonder-datum` wanneer een aanbieder niets publiceert |
| `.bs-plan-eisen` | Wat de gekozen bank bij een declaratie wil zien. In dezelfde tabel markeert `bs-rij--letop` een regel die na de uiterste indiendatum valt; **amber betekent waarschuwing**, niet "opvallend" |
| `.bs-knop-in-tekst` | Een knop die als link in een alinea meeloopt |

### Onderdelen die JavaScript zelf schrijft

Deze klassen staan zowel in `calculator.css` als in `broadsheet.css`, en dat is
bewust. `staafgrafiek.js` en `main.js` schrijven deze namen in de HTML, en die
modules bedienen zowel omgezette als nog niet omgezette pagina's. Hernoemen we
ze nu, dan staat de grafiek op `belasting.html` of de tabel op de depotplanner
zonder opmaak — en dat merkt geen enkele test.

In `broadsheet.css` staan ze genest onder `.bs`, waardoor
`tests/componenten.test.mjs` ze niet uitleest. **Deze tabel is dus de enige
bewaking die ze hebben; houd hem bij.** Bij de laatste gebruiker gaan ze in één
keer om en verdwijnt de dubbeling.

| Component | Geschreven door | Waarvoor |
|---|---|---|
| `.verloop` / `.verloop__*` | `staafgrafiek.js` | Maandverloop als eigen SVG. De kleuren staan in de CSS en niet in het JavaScript, zodat ze de tokens volgen |
| `.details-table` / `.details-table-wrapper` | `main.js` | Maand-tot-maandtabel, met de kolomrollen `col-amount`, `col-gedempt`, `col-vergoeding` en `netto-column` erin. De wrapper laat hem binnen zijn eigen kader scrollen; een brede tabel mag de pagina niet horizontaal laten schuiven |
| `.term-row` / `.term-kop` / `.term-*-input` | `main.js` | Het termijnschema. Kopregel en rijen delen één raster, anders lopen ze niet gelijk |
| `.term-veldnaam` | `main.js` | Veldnaam per invoerveld. **Alleen zichtbaar onder 640px**, waar de kolomkoppen wegvallen |
| `.terms-totaal` | `main.js` | Teller van de toegewezen percentages. `data-status="afwijkend"` maakt hem amber |
| `.input-icon-wrapper` / `.icon` | `main.js` | Veld met een euro- of procentteken erin |
| `.btn-remove` | `main.js` | Termijn verwijderen. 44px, want dat is de minimale aanraakzone |

### Rekenpagina en gereedschap

| Component | Waarvoor |
|---|---|
| `.bs-reken` / `.bs-reken__grid` | Kop, uitkomst, invoer. Uitkomst staat ook in de DOM boven de invoer |
| `.bs-invoer` | De invoerkolom |
| `.bs-reken__na` | Derde blok in het raster: printactie en voorbehoud, ná de invoer |
| `.bs-aannames` | Uitklapblok met de uitgangspunten van de berekening |
| `.bs-rooster` / `.bs-tool` | Gereedschapsrooster met haarlijnen als raster, geen losse kaarten. Variant `--inline` voor één tool tussen de invoervelden |

---

## 6. Naambotsingen

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
