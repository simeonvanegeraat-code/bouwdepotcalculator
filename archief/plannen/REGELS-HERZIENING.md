# De regels herzien

**Datum:** 9 oktober 2026
**Status:** inventarisatie — elk oordeel hieronder is een voorstel, niet een besluit
**Aanleiding:** de founder merkt dat de regels het werk eerder remmen dan sturen

---

## 1. Wat er ligt

| Bron | Aantal |
|---|---:|
| `CLAUDE.md` — harde regels | 7 |
| `CLAUDE.md` — zo werken we samen | 7 |
| `CLAUDE.md` — de kwaliteitslat | 5 |
| `CLAUDE.md` — conventies | 3 |
| `review.md` — checklist vóór opleveren | 31 vinkjes |
| `tests/` | 19 bestanden, 92 tests |
| `plannen/ADSENSE-AANVRAAG-PLAN.md` — acceptatiecriteria | 4 |
| idem — "wat we bewust níet doen" | 4 |
| `routines/` | 4 stappenplannen |
| `spec/` — voorstellen die op akkoord wachten | 4 |
| **Totaal** | **157 regels en controles** |

Voor een statische site van één persoon die nog niets verdient.

## 2. De diagnose

**De regels zijn geschreven voor een probleem dat is opgelost.**

Zestien van de negentien testbestanden zijn gemaakt tussen 21 juli en 28
augustus. Dat was de opruimfase: 3.658 dode CSS-regels, zes uiteengelopen
navigaties, één JavaScript-bestand van 1.794 regels dat zes pagina's bediende.
Regels die wanorde tegenhouden zijn dán precies goed.

Die wanorde is weg. Het probleem nu is een ander: de site is schoon en vrijwel
niemand gebruikt hem. Negenentwintig van de eenendertig pagina's leverden in
zeven maanden drieëndertig kliks op. Regels die wanorde tegenhouden helpen daar
niet tegen, en een deel ervan houdt juist het werk tegen dat wél zou helpen.

Dat is geen verwijt aan de regels. Het is wat er gebeurt als regels geen
houdbaarheidsdatum hebben.

**Twee symptomen die dat bevestigen:**

- `roadmap.md` heet "één bron voor volgorde" en is 38 dagen oud. Er staat nog
  "Focus deze week" boven een week die vijf weken geleden eindigde, en als
  huidig doel "de bestaande codebase herzien". Dat doel is gehaald.
- Twee plekken schrijven voor dat kleur en maat uit `src/styles/design-system.css`
  komen. Dat bestand is op 1 september verwijderd.

---

## 3. De regels die in de weg staan

Zes stuks. Dit zijn de enige waar ik een echt bezwaar bij heb.

### 3.1 Het uniciteitscriterium van 55%

**Waar:** `plannen/ADSENSE-AANVRAAG-PLAN.md`, blok C.
**Wat:** elke aanbiederpagina moet boven 55% unieke vijfwoordsreeksen zitten.
**Stand:** dertien pagina's, gemiddeld 24%. Geen enkele haalt het.

Dit is op dit moment de enige blokkade voor de AdSense-aanvraag, en het is een
**zelfverzonnen maatstaf**. Google meet geen vijfwoordsreeksen. Het getal is
afgeleid uit "redactionele pagina's zitten op 78–95%", maar een datapagina deelt
legitiem zijn skelet: kop, navigatie, de vaste secties, de voettekst.

Erger: de maatstaf is **zelfvernietigend**. Elke aanbieder die erbij komt
verlaagt de score van alle andere, want het corpus waartegen gemeten wordt
groeit mee. Bij acht aanbieders was het 25–39%, bij dertien 16–29%. Zonder één
letter te veranderen.

**Voorstel: vervangen.** De vraag die ertoe doet is niet "hoeveel procent is
uniek" maar "staat hier iets dat nergens anders staat". Dat is toetsbaar: heeft
deze pagina een doorgerekend voorbeeld op basis van de regel van díe aanbieder,
ja of nee. Dat is wat blok C eigenlijk wil, en het is een vinkje in plaats van
een percentage dat met de omvang meebeweegt.

### 3.2 "Geen pagina's bijbouwen" tegenover de uitbreiding naar dertien

**Waar:** `plannen/ADSENSE-AANVRAAG-PLAN.md` §11.
**Wat:** geen pagina's bijbouwen, want een nieuwe pagina erft het
domeingemiddelde. En expliciet: niet naar vijftien aanbieders.

Dat is op 1 oktober precies gebeurd. Acht werden er dertien.

De regel was inhoudelijk goed — de meting laat zien dat hij gelijk had. Het
probleem is **waar hij stond**: in een plandocument van veertien pagina's dat
niemand per sessie leest. Een regel die alleen geldt als je hem toevallig
terugvindt, is geen regel.

**Voorstel: niet de regel aanpassen maar de plek.** Wat werkelijk bindend is
hoort in `CLAUDE.md` of in een test. De rest is advies en moet zich ook zo
noemen.

### 3.3 Zeven dagen tegenover drie maanden

**Waar:** `plannen/ADSENSE-AANVRAAG-PLAN.md` blok D zegt: geen controledatum
ouder dan zeven dagen bij indiening. `routines/bronnen-controleren.md` zegt:
termijn van drie tot zes maanden per aanbieder.

Die twee kunnen niet allebei. Met dertien aanbieders betekent de zevendagenregel
dat je vlak voor indienen dertien bronnen opnieuw naloopt — een dag werk, elke
keer dat je wilt indienen. De routine is gebouwd op de aanname dat dat niet
nodig is.

**Stand:** vijf van de dertien controledata zijn vijftig dagen oud.

**Voorstel: de zevendagenregel laten vallen.** Hij komt nergens uit een eis van
Google; hij komt uit de redenering dat een beoordelaar een oude datum als
stilstand leest. Dat is aannemelijk voor vijf weken, niet voor zeven dagen. Een
termijn van dertig dagen bij indiening is verdedigbaar en haalbaar.

### 3.4 De specs die op akkoord wachten

**Waar:** `spec/README.md`.
**Wat:** een spec per stuk werk, geschreven vóórdat er code is.

Vier specs staan op "voorstel, wacht op akkoord": `nieuwbouw-rekentool`,
`meeneemdocument`, `deelafbeelding` en tot deze week `invoervelden`. De oudste
staat er sinds eind augustus.

De regel werkt wél waarvoor hij bedoeld is — bij de invoervelden heeft de spec
plus de demo precies gedaan wat hij moest doen, en daar kwam een beslissing uit.
Maar drie van de vier zijn planken­werk geworden: geschreven, nooit besloten,
nooit gebouwd.

**Voorstel: een spec krijgt een vervaldatum.** Niet besloten binnen twee weken
betekent: weg of alsnog beslissen. Een spec die blijft liggen kost niets zichtbaars
maar hij suggereert dat er een plan is waar geen plan is.

### 3.5 De demo-eis bij elke UI-wijziging

**Waar:** `demo/README.md`: "geen enkele UI-verandering geldt als klaar zonder
een meting hier."

De reden is goed en staat erbij: er is ooit dagenlang over ontwerpkwaliteit
geoordeeld zonder de site te bekijken. Maar de eis geldt nu even zwaar voor een
schuifregelaar die twaalf pixels opschuift als voor een nieuwe ontwerprichting.

**Voorstel: beperken tot wat de vorm van een pagina verandert.** Voor de rest is
"zelf in de browser gekeken op 375 en 1440" genoeg, en dat staat al in
`review.md`.

### 3.6 Eén onderwerp per wijziging

**Waar:** `CLAUDE.md` §2.
**Wat:** liever drie wijzigingen van twee minuten dan één van een halve avond.

Deze is de afgelopen week drie keer gebroken. De invoerveldwijziging raakte
vijfentwintig bestanden in één commit. Er is niets misgegaan, en jij hebt er ook
niet om gevraagd hem op te knippen.

Een regel die herhaaldelijk wordt gebroken zonder gevolgen is erger dan geen
regel: hij went je eraan dat regels vrijblijvend zijn.

**Voorstel: kiezen.** Of hij geldt — en dan knip ik werk echt op, ook als dat
vijf commits betekent — of hij gaat eruit en we sturen op iets anders: dat elke
commit op zichzelf terug te draaien is.

---

## 4. De regels die hun plek hebben verdiend

Deze niet aankomen. Ze hebben aantoonbaar iets gevangen.

| Regel | Bewijs |
|---|---|
| **Data verzin je niet** | Het hele waardevoorstel. Zonder dit is de site een van de vele |
| **Nuance mag niet verdwijnen** (`nuance.test.mjs`) | Komt uit een echte melding van een bezoeker met een lopend depot |
| **Geen advies, alleen informatie** | AFM-vergunningplicht. Niet onderhandelbaar |
| **Meten, niet aannemen** | Heeft deze week vier van mijn eigen fouten gevangen, waaronder een villagrens uit 2025 en een afrondingsfout in 31% van de gevallen |
| **Antwoord eerst, diepte op verzoek** | Houdt de pagina's bruikbaar |
| **Mobiel is de maatstaf** | 375px eerst; de harde eis op de homepage |
| `aantal-aanbieders.test.mjs` | Ving mijn fout bij de uitbreiding naar dertien |
| `pagina-aangesloten.test.mjs` | Ving vier pagina's die niet in de build en niet in de sitemap stonden |
| `fiscal-rules.test.mjs` | Dwong me de villagrens tegen een bron te leggen in plaats van tegen mijn geheugen |
| **Raakt het productgedrag? Eerst het plan** | Werkte bij de invoervelden precies zoals bedoeld |

---

## 5. Wat er achter zit

Drie dingen die losstaan van welke regel dan ook.

**De regels wonen op zes plekken.** `CLAUDE.md`, `review.md`, `roadmap.md`,
`spec/`, `routines/`, `plannen/`, plus de tests. Bij een conflict — en er is er
minstens één, zie 3.3 — wint geen van beide, want niemand weet welke voorgaat.

**Geen enkele regel heeft een eigenaar of een vervaldatum.** Daarom staat er nog
een verwijzing naar een stylesheet die vijf weken geleden is verwijderd, en
daarom heeft het tot nu geduurd voordat iemand opmerkte dat de roadmap over een
afgeronde fase gaat.

**De regels sturen op zorgvuldigheid, niet op bereik.** Elke harde regel gaat
over juistheid, nuance of vorm. Geen enkele gaat over de vraag of iemand de
pagina vindt of gebruikt. Dat is precies het probleem dat nu op tafel ligt — en
er is geen regel die daarop stuurt.

---

## 6. Wat ik voorstel

Niet alle 157 regels langslopen. Zes beslissingen:

1. Het uniciteitscriterium vervangen door een vinkje per pagina (3.1)
2. Bindende regels verhuizen naar `CLAUDE.md` of een test; de rest advies noemen (3.2)
3. De zevendagenregel laten vallen, dertig dagen ervoor in de plaats (3.3)
4. Specs een vervaldatum van twee weken geven (3.4)
5. De demo-eis beperken tot vormwijzigingen (3.5)
6. "Eén onderwerp per wijziging" bevestigen of schrappen (3.6)

En twee dingen opruimen die geen beslissing nodig hebben: de verwijzing naar
`design-system.css` op twee plekken, en `roadmap.md` die over een afgeronde fase
gaat.
