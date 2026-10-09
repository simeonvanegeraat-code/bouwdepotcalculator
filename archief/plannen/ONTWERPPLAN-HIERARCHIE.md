# Verbeterplan: hiërarchie, vorm en techniek

Opgesteld 17 augustus 2026. Alle waarden hieronder zijn gemeten in de browser op
1440 breed, niet geschat.

## 1. Wat er werkelijk aan de hand is

De aanleiding was "de H1 voelt te klein". Meten wees iets anders uit: er zijn
**twee hero-patronen** die uit elkaar zijn gelopen.

| patroon | pagina's | H1 | H2 |
|---|---|---|---|
| `.ds-sectiekop` + `.ds-heading` | 20 tekstpagina's | 40px | 30px |
| `.aanhef` + naakte `<h1>` | 9 rekenpagina's | **30px** | **40px** |

De tekstpagina's zijn dus correct. Op de rekenpagina's — de productpagina's, waar
het geld zit — is de paginatitel even groot als een sectiekop en een kwart
kleiner dan de `.ds-heading` eronder.

De oorzaak is één regel die buiten het systeem om werkt:

```css
.aanhef h1 { font-size: var(--ds-t-title); ... }
```

`--ds-t-title` is de sectiemaat. Er is een `--ds-t-heading` (40px) die de rest
van de site gebruikt, en zelfs een `--ds-t-display` (56px) die **nergens** wordt
gebruikt. De hero van de belangrijkste pagina's greep naar de kleinste van de
drie.

### Overige bevindingen

2. **Gat in de schaal.** Onder de hero-H1 springt het van 30px naar 13px
   (`.ds-caption`). Er is niets op 17 of 20, terwijl `--ds-t-lead` (20px)
   bestaat en vijftien keer elders wordt gebruikt. Gevolg: "Indicatie zonder
   registratie" — een verkoopargument — staat er als kleine lettertjes.

3. **Header zonder rangorde.** Wordmark 15px/640 en navigatie 15px/530, alle
   vijf in dezelfde accentkleur `#0E5F58`. Vier navigatie-items concurreren op
   gelijke voet met de merknaam.

4. **Dode markup.** `Bouwdepot<span>Calculator</span>.nl` — die span heeft
   dezelfde kleur en hetzelfde gewicht als zijn ouder en doet dus niets. Er zat
   een bedoeling in die nooit is uitgevoerd.

5. **Dode CSS.** `.ds-display` en `--ds-t-display` zijn gedefinieerd en worden
   in geen enkele pagina gebruikt.

6. **Koprangorde overgeslagen.** `verbouwbegroting.html` gaat van `h1` naar
   `h3`; de categoriekoppen missen een niveau. Enige pagina van de 29.

7. **Hero krap.** 24px lucht boven de eyebrow, waardoor die tegen de header
   plakt. Voor de ingang van de site te weinig.

8. **Eyebrow dubbelt, één keer.** Van de tien eyebrows overlappen er drie met
   hun eigen H1, maar bij twee daarvan voegt "Stap 1 / Stap 2 van uw verbouwing"
   positie-informatie toe die de kop niet geeft. Alleen op de homepage is
   "Bouwdepot berekenen" boven "Wat kost uw bouwdepot per maand?" werkelijk
   leeg.

## 2. Is dit de beste aanpak, en past het op de techniek van 2026?

Gemeten in de doelbrowser: `text-wrap: balance` en `pretty`, container queries,
`light-dark()`, `:has()`, cascade layers, `scrollbar-gutter`, `field-sizing`,
`interpolate-size`, view transitions en OKLCH worden **allemaal** ondersteund.
De vraag is dus niet wat kan, maar wat verdient het.

De beste techniek is hier grotendeels **het weghalen van een uitzondering**, niet
het toevoegen van een voorziening. De schaal die de site nodig heeft bestaat al
en werkt op twintig pagina's; negen pagina's moeten erbij aansluiten. Elke
nieuwe abstractie zou dat probleem verhullen in plaats van oplossen.

### Wat wel wordt toegevoegd

- **`text-wrap: pretty`** op lopende tekst. `balance` staat al op de koppen;
  `pretty` voorkomt weduwen en een rafelige laatste regel in alinea's. Echte
  typografische winst voor één regel CSS.
- **`scrollbar-gutter: stable`** op de wortel. De site heeft korte pagina's
  (contact) en lange (begroting); nu verschuift de layout horizontaal bij
  navigatie tussen die twee.
- ~~**Cross-document view transitions.**~~ Wel geprobeerd, weer verwijderd. Zie
  §4: elke klik zette een onopgevangen `AbortError` in de console.

### Wat bewust níet wordt gedaan

- **Container queries.** `.reken__grid` staat altijd in `.ds-wrap` en nergens
  anders. Een container query zou hier indirectie toevoegen met exact nul
  visueel verschil. Wel de juiste keuze zodra een component op twee
  verschillende breedtes hergebruikt wordt.
- **`@layer`.** Cascade layers retroactief invoeren verandert de precedentie in
  drie stylesheets tegelijk. Het gevonden specificiteitsprobleem (§4) is met
  `:where()` op één regel opgelost; dat is de kleinste ingreep die het verhelpt.
  Layers blijven de juiste keuze zodra er een tweede zo'n conflict opduikt.
- **`light-dark()`.** Zou de themacode halveren, maar het contrast in donkere
  modus is eerder deze week gemeten en gerepareerd. Herschrijven riskeert die
  regressie voor nul zichtbare winst.
- **OKLCH.** Perceptueel netter, maar vereist het opnieuw verifiëren van elk
  contrastpaar in het palet. Onverantwoord voor een verandering die niemand ziet.

## 3. De ingrepen

**Eén schaal over 29 pagina's**

1. `.aanhef h1` gaat van `--ds-t-title` naar `--ds-t-heading`, met het gewicht
   en de letterspatiëring die bij die maat horen. 30 → 40px.
2. De elf `h2.ds-heading` worden `h2.ds-title`. 40 → 30px. Daarmee geldt op elke
   pagina: H1 groter dan H2.
3. De `p.ds-caption` in elke hero wordt `p.ds-lead`. 13 → 20px, en het gat in de
   schaal is dicht.
4. `.aanhef` krijgt `max-width` in `ch` zodat de kop over twee regels valt en
   `text-wrap: balance` iets te balanceren heeft.
5. `.ds-display` en `--ds-t-display` verdwijnen.

**Header**

6. Wordmark naar 17px; de span krijgt de inktkleur, zodat "Bouwdepot" teal is en
   "Calculator.nl" donker. De wordmark krijgt structuur zonder HTML-wijziging.
7. Navigatie naar `--ds-ink-muted`, accentkleur alleen bij hover en op de
   actieve pagina.

**Ruimte en vorm**

8. Lucht boven de hero van 24 naar 48px vanaf tabletbreedte.
9. Homepage-eyebrow verdwijnt.

**Fout**

10. Categoriekoppen in de begroting van `h3` naar `h2`.

**Platform**

11. `text-wrap: pretty`, `scrollbar-gutter: stable`, view transitions.

## 4. Wat het nalopen aan het licht bracht

Vier dingen die pas bij meten bleken, waarvan één de eigenlijke oorzaak van de
hele klacht.

**De header was niet te luid ontworpen, hij was kapot.** `.ds a:not(.ds-knop)`
heeft specificiteit (0,2,1) en verslaat daarmee `.merk` (0,1,0), `.kop nav a`
(0,1,2), `.voet__links a` en `.ds-keuze` (`color: inherit`). Vier componenten
zetten netjes hun eigen linkkleur en geen enkele kwam aan: de hele site stond in
accentkleur, inclusief alle kaarttitels. Dat verklaart het "te luide" gevoel
beter dan enige maatvoering. Opgelost door de globale regel in `:where()` te
zetten, waarmee zijn specificiteit nul wordt en hij een standaard is in plaats
van een voorschrift.

**Een `ch`-maat op de verkeerde plek.** Ik zette `max-width: 30ch` op `.aanhef`,
waar `ch` tegen de basistekst van 17px rekent en niet tegen de kop van 40px.
Effectieve maat ongeveer 285px, waardoor de kop over drie regels viel in plaats
van twee. De maat hoort op de kop zelf.

**Mijn eigen h3-naar-h2 sloopte de specificatie.** `bouwSpecificatie()` zocht de
categorienaam met `querySelector('h3')`. Na het repareren van de niveausprong gaf
dat null en crashte het printdocument. Nu `:is(h2, h3)`, zodat een volgende
niveauwijziging het niet opnieuw breekt.

**View transitions afgevoerd.** Elke klik gaf een onopgevangen `AbortError:
Transition was skipped`, ook zonder reduced-motion en zonder onderbroken
navigatie. Een console-fout per paginawissel is te duur voor een verfraaiing op
een site die op beoordeling wacht.

Verder een valse alarmbel die het vermelden waard is: mijn eerste overlooptest
meldde negentien pagina's met horizontale overloop, telkens exact vijftien pixels.
Dat was de schuifbalkgoot die ik zelf net had gereserveerd. Een test die de goot
meerekent, meet zijn eigen ingreep.

## 5. Uitkomst

| element | voor | na |
|---|---|---|
| H1 rekenpagina | 30px, één regel over 1016px | 40px, twee regels over 647px |
| H2 sectie | 40px | 30px |
| onderregel hero | 13px | 20px |
| verhouding bedrag tot H1 | 2,3× | 1,7× |
| lucht boven hero | 24px | 48px |
| navigatie | accentkleur | inkt-gedempt, accent bij hover |
| woordmerk | 15px, geheel accent | 17px, accent alleen op "Calculator" |

Nagelopen: H1 groter dan elke H2 op alle 29 pagina's, op 375, 768 en 1280.
Contrast van elk gewijzigd element in licht (laagste 4,82) en donker (laagste
5,59), 42 elementen, geen tekorten. Geen echte horizontale overloop. Console
schoon bij een werkelijke navigatie. Bouw en de 18 tests groen.
