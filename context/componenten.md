# Componenten

Wat er bestaat, waar het voor is, en waar het bewust niet voor is.

De tokens staan bovenaan `src/styles/broadsheet.css` en documenteren zichzelf:
een regel die `--bs-tap: 44px` heet zegt al wat hij is. Componenten niet. De CSS
vertelt je hoe `.bs-melding` eruitziet, maar niet dat de amberkleur "let op"
betekent en dat je hem dus niet moet pakken voor een gewone mededeling. Dat gat
vult dit bestand.

**Kijk hier eerst voordat je een nieuwe klasse maakt.** De kans dat wat je nodig
hebt er al staat is groot: `.alleen-print` is een keer opnieuw uitgevonden
terwijl hij er al was.

`tests/componenten.test.mjs` faalt zodra er een component in de CSS staat die
hier ontbreekt.

---

## 1. De broadsheet-richting — `broadsheet.css`

De ontwerptaal uit [ONTWERPPLAN.md](../plannen/ONTWERPPLAN.md) §3, en sinds 1 september
2026 de enige. Alle 32 pagina's laden dit bestand en dragen `<body class="bs">`.

`design-system.css`, `pagina.css` en `calculator.css` bestaan niet meer. Ze
staan nog wel in de geschiedenis: `git show 0bfe773:src/styles/design-system.css`
laat de laatste versie zien.

**De prefix `bs-` blijft.** Hij ontstond omdat `.kop` en `.voet` in twee
betekenissen naast elkaar bestonden, en dat gevaar is weg. Hem nu overal
weghalen zou 32 pagina's aanraken zonder dat er iets aan verandert, en dat is
precies het soort wijziging waarbij fouten insluipen die geen test ziet.

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

Deze namen stonden zonder prefix en genest onder `.bs`, omdat `calculator.css`
ze ook definieerde en beide bestanden tegelijk in gebruik waren. Dat bestand is
weg, dus ze heten nu `bs-` zoals al het andere. Dat is niet alleen netter: door
die nesting zag `tests/componenten.test.mjs` ze niet, en waren juist de
onderdelen die niemand in de HTML tegenkomt onbewaakt.

| Component | Geschreven door | Waarvoor |
|---|---|---|
| `.bs-stickybalk` | `stickybalk.js` | De zwevende uitkomstbalk. Verschijnt zodra `.bs-blad` uit beeld scrolt; elke rekenpagina krijgt hem zonder eigen markup |
| `.bs-verloop` / `.bs-verloop__*` | `staafgrafiek.js` | Maandverloop als eigen SVG. De kleuren staan in de CSS en niet in het JavaScript, zodat ze de tokens volgen |
| `.bs-tabel` / `.bs-tabelwikkel` | `main.js` | Maand-tot-maandtabel, met de kolomrollen `.bs-kolom-bedrag`, `.bs-kolom-gedempt`, `.bs-kolom-vergoeding` en `.bs-kolom-netto` erin. De wikkel laat hem binnen zijn eigen kader scrollen; **een brede tabel mag de pagina niet horizontaal laten schuiven** |
| `.bs-term-rij` / `.bs-term-kop` | `main.js` | Het termijnschema. Kopregel en rijen delen één raster, anders lopen ze niet gelijk. De velden erin heten `.bs-term-bedrag`, `.bs-term-percentage`, `.bs-term-omschrijving` en `.bs-term-maand` |
| `.bs-term-veldnaam` | `main.js` | Veldnaam per invoerveld. **Alleen zichtbaar onder 640px**, waar de kolomkoppen wegvallen |
| `.bs-terms-kop` / `.bs-terms-totaal` | `main.js` | Kop boven het schema en de teller van de toegewezen percentages. `data-status="afwijkend"` maakt die teller amber |
| `.bs-icoonveld` | `main.js` | Veld met een euro- of procentteken erin. Variant `.pct` zet het teken rechts |
| `.bs-verwijder` | `main.js` | Termijn verwijderen. 44px, want dat is de minimale aanraakzone |

### Rekenpagina en gereedschap

| Component | Waarvoor |
|---|---|
| `.bs-reken` / `.bs-reken__grid` | Kop, uitkomst, invoer. Uitkomst staat ook in de DOM boven de invoer |
| `.bs-invoer` | De invoerkolom |
| `.bs-reken__na` | Derde blok in het raster: printactie en voorbehoud, ná de invoer |
| `.bs-aannames` | Uitklapblok met de uitgangspunten van de berekening |
| `.bs-rooster` / `.bs-tool` | Gereedschapsrooster met haarlijnen als raster, geen losse kaarten. Variant `--inline` voor één tool tussen de invoervelden |

### Afvinklijsten

Kwamen uit `stappenplan.css`, dat alleen `stappenplan.html` en
`adviesgesprek-checklist.html` bediende. Dat bestand is met de omzetting van
die twee pagina's verwijderd.

| Component | Waarvoor |
|---|---|
| `.bs-voortgang` / `.bs-spoor` | Hoeveel punten er af zijn. `checklist.js` zoekt het spoor op klasse en de vulling op id `plan-progress-bar`; hernoemen betekent het JavaScript meenemen |
| `.bs-fasen` / `.bs-fase` | De fasen van een plan. De titel erin is een kale `h2`, kleiner dan `.bs-titel`; **zet er geen `.bs-titel` op**, dan wordt een fase net zo zwaar als een sectiekop |
| `.bs-punt` | Aanvinkbaar controlepunt, minimaal 44px hoog. **Heet niet `.bs-stap`** — die naam is van de tijdlijn op de depotplanner en betekent iets anders |
| `.bs-dossier` / `.bs-dossier__moment` | Wat u op welk moment bewaart. Vier kolommen vanaf 1000px |
| `.bs-vel` / `.bs-vel__rij` / `.bs-invul` | Invulvel om af te drukken en met een pen in te vullen. Alleen voor wat de bezoeker zélf noteert, niet voor uitkomsten die wij berekenen |

### De vergelijking van bouwdepotvoorwaarden

Kwamen als `vgl-*` uit `design-system.css` en worden geschreven door
`scripts/build-voorwaarden.mjs`. Die negen pagina's zijn gegenereerd: pas het
script aan, nooit de HTML.

| Component | Waarvoor |
|---|---|
| `.bs-vgl` / `.bs-vgl__item` | Alle aanbieders onder elkaar, één zwarte haarlijn per aanbieder. Geen kaarten en geen schaduw: de pagina moet vergelijkbaar ogen, niet gerangschikt |
| `.bs-controle` | Wanneer wij de voorwaarden bij de bron hebben nagekeken. Variant `--verlopen` als die controle over tijd is. **Hoort altijd zichtbaar te blijven**; een gegeven zonder datum is niet controleerbaar |
| `.bs-balken` / `.bs-balk` | Looptijd als balk. **Alle balken delen één schaal** — zonder dat zegt de lengte niets. Massief zwart is de looptijd waar u recht op heeft, gearceerd accent de verlenging, en het wegvagende uiteinde `--open` betekent: verlenging mogelijk, duur niet gepubliceerd |
| `.bs-schaal` / `.bs-legenda` | De as onder de balken en de uitleg van de drie soorten vulling |
| `.bs-feiten` / `.bs-feit` | De feiten per aanbieder. Een `detail` in de data rendert hier als `<small>` mee; `tests/nuance.test.mjs` faalt als dat wegvalt. Variant `--proza` voor een veld dat uit lopende tekst bestaat |
| `.bs-leeg` | **Ontbrekende gegevens blijven zichtbaar leeg.** Nooit invullen met een schatting: dat een aanbieder iets niet publiceert is zelf het antwoord |
| `.bs-detail` | Alle voorwaarden van één aanbieder als definitielijst. Geen tabel: het zijn label-waardeparen, geen matrix |
| `.bs-punten` | Opsomming met een vierkant accentblokje. Voor losse constateringen, niet voor stappen die op volgorde staan |
| `.bs-bronnen` | De bronlinks onderaan een aanbiederpagina. Volledige URL's, zodat te zien is waar een gegeven vandaan komt |
| `.bs-acties` | Rij knoppen die een sectie afsluit. Werkt op bone en op de zwarte band; heette eerder `.bs-donker__acties` |

### Redactionele pagina's

Kwamen uit `pagina.css`. Voor leespagina's: kennisbank, de foutenpagina, de
aftrekgids, de methodologie en de gegenereerde declaratiepagina.

| Component | Waarvoor |
|---|---|
| `.bs-kernzin` | Eén zin die het onderwerp samenvat, direct onder de titel. **Het antwoord van de pagina**; alles eronder is toelichting. Eén per pagina |
| `.bs-vragen` / `.bs-vraag` | Genummerde vragen. Het nummer komt uit een CSS-teller, dus hernummeren gebeurt vanzelf als er een vraag tussenuit gaat |
| `.bs-scenarios` / `.bs-scenario` | Drie situaties naast elkaar. Op mobiel onder elkaar en nooit als brede tabel |
| `.bs-checklijst` | Voorbereidingslijst met een leeg vakje. **Niet aanklikbaar** — is er wél iets te onthouden, gebruik dan `.bs-punt` met een voortgangsbalk |
| `.bs-fouten` / `.bs-fout` | Genummerd probleem met zijn oplossing. Het nummer is amber, want het accent is op deze site de kleur van de uitkomst. Variant `--een` als het blok te hoog is om naast een ander te staan |
| `.bs-fasenrij` / `.bs-faseblok` | Drie periodes van een regeling naast elkaar. **Heet niet `.bs-tijdlijn`** — die naam is van de gedateerde stappenlijst op de depotplanner |
| `.bs-voorbeeld` / `.bs-uitkomstrij` | Uitgewerkte som. De uitkomstrij krijgt een zwarte lijn en het bedrag in het accent, zodat te zien is waar de rij op uitkomt |
| `.bs-welniet` | Twee lijsten naast elkaar: wat wel en wat niet |
| `.bs-wijzigingen` | Wijzigingenoverzicht, nieuwste bovenaan |
| `.bs-perbank` | Eén gegeven per aanbieder: naam, waarde, nuance eronder. Bewust geen tabel; het zijn losse antwoorden, geen matrix |

### Beleidspagina's en contact

| Component | Waarvoor |
|---|---|
| `.bs-beleid` | Genummerde artikelen op privacy, cookies en voorwaarden. Het nummer komt uit een CSS-teller, dus bij een artikel dat ertussenuit gaat klopt de nummering vanzelf weer |
| `.bs-beleidrijen` | Wat er wordt opgeslagen, als rijen. **Geen tabel** — zes kolommen dwingen op een telefoon tot horizontaal scrollen. Een tweede `dd` is de toelichting bij de eerste |
| `.bs-contactkaart` | Het e-mailadres, groot genoeg om vanaf een telefoon over te typen. Eén per site |
| `.bs-wissen` | De knop op privacy.html waarmee de bezoeker weghaalt wat de site op zijn apparaat bewaart. **Twee klikken**, want wie dertig posten op de begroting heeft ingevuld is die anders met één misklik kwijt. De bevestigingsstand gebruikt `.bs-knop--waarschuwing` |

### Toestanden die JavaScript zet

Deze zie je pas als je klikt, iets leegmaakt of afdrukt. Ze stonden in
`calculator.css` en `pagina.css`; toen die verdwenen was hun opmaak weg zonder
dat een test dat merkte.

| Component | Waarvoor |
|---|---|
| `.bs-bankkeuze` | De keuzebalk voor de eigen geldverstrekker. `bankkeuze.js` schrijft de markup op elke pagina met een `[data-bankkeuze]`-houder. Variant `.bs-bank-veld--leeg` voor een veld dat zijn waarde uit die keuze haalt terwijl er nog niets gekozen is: **gedempt en niet leeg**, want de bezoeker moet zien dat er iets komt |
| `.bs-tekort` | Een negatieve buffer. Rood, want dit is een signaal en geen getal |
| `.bs-formule` | De rekenregel achter een uitkomst, in een uitleg |
| `.bs-uit` | Een veld dat in het gekozen rekenmodel geen betekenis heeft. **Zichtbaar maar inactief** — weghalen zou de vraag oproepen waar het gebleven is |

---

## 2. Naambotsingen

**Op dit moment geen.** Er is nog één stylesheet, dus twee betekenissen voor
dezelfde klasse kunnen niet meer ontstaan door de volgorde van `<link>`-regels.

Deze sectie blijft staan omdat `tests/componenten.test.mjs` hem gebruikt: komt
er ooit een tweede stylesheet bij, dan hoort elke klasse die in allebei staat
hier beschreven te worden. Dat is hoe `.tijdlijn` en `.cat` gevonden werden,
die in `pagina.css` en `calculator.css` iets anders betekenden.

Wat wél oplet bij het kiezen van een naam: `.bs-stap` is de gedateerde
tijdlijnstap op de depotplanner en niet het controlepunt op het stappenplan (dat
is `.bs-punt`), en `.bs-tijdlijn` is diezelfde lijst en niet de drie periodes
naast elkaar (dat is `.bs-fasenrij`). Zulke botsingen ziet geen test.

---

## Wanneer maak je een nieuwe component?

1. Zoek eerst hierboven, en daarna met `grep` in de stylesheets.
2. Bestaat er iets dat het bijna doet? Voeg dan een variant toe (`--`), geen
   nieuwe klasse.
3. Nieuwe klasse? Zet hem bij de sectie waar hij hoort in `broadsheet.css`, met
   de `bs-`-prefix.
4. Zet hem in dit bestand, anders faalt de test.
5. Schrijf erbij waarvoor hij níét is. Dat is het deel dat de CSS niet kan
   zeggen, en het deel dat verdubbeling voorkomt.
