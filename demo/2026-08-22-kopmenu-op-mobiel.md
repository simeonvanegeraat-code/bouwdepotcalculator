# Het kopmenu op mobiel, 22 augustus 2026

De founder meldde dat je in de kopbalk horizontaal moest vegen. Nagemeten op
375px was het erger dan dat.

## Voor

| Meting | Waarde |
|---|---|
| Breedte die de navigatie nodig heeft | 380px |
| Breedte naast het woordmerk | **157px** |
| Onbereikbaar zonder vegen | **223px, 59% van het menu** |
| Volledig zichtbaar | alleen "Bereken" |
| Volledig buiten beeld | "Uitleg" en "Over ons" |
| Vensterbreedte waarbij de rij past | **598px** |

Er was ook geen enkele aanwijzing dát er meer stond: `scrollbar-width: none`
verborg de schuifbalk en er was geen schaduwrand. Elk telefoonscherm is
375–430px, dus dit gold voor alle mobiele bezoekers.

## Na

Onder 640px klapt de navigatie achter een knop met het woord **Menu**. Daarboven
verandert er niets.

| Meting | Voor | Na |
|---|---|---|
| Overloop van de navigatie op 375px | 223px | **0** |
| Bereikbare menu-items op een telefoon | 1 van 4 | **4 van 4** |
| Aanraakzone van de knop | n.v.t. | **83 × 44px** |
| Aanraakzone per item in het paneel | 24px hoog | **44px** |
| Hoogte van de kopbalk | 56px | **56px, ongewijzigd** |
| JavaScript in de kop | 0 regels | **0 regels** |

Het paneel is 206 × 194px, rechts uitgelijnd onder de knop, en valt binnen het
scherm. Getoetst op alle drie de menuvarianten: de homepage ("Wat past bij
mij"), de gewone pagina's ("Bereken"), en de begrotingsgroep ("Begroting").

## Waarom het paneel náást het uitklapblok staat en niet erin

De eerste opzet zette de links in het `<details>`-element, met opmaak die ze op
desktop weer zichtbaar maakte. Dat werkte in een losse proef, maar niet in de
kopbalk: **een gesloten `<details>` draagt nul breedte bij aan zijn ouder**, ook
als de inhoud met CSS zichtbaar is gemaakt. In de flexbalk werd de navigatie
daardoor 0px breed en liepen de links 160px buiten het scherm.

Gemeten in de opbouw die het wel doet: navigatie 380px, rechterrand op 1220px
binnen een venster van 1440.

De opbouw is nu:

```html
<nav>
  <details class="kop__menu"><summary>Menu</summary></details>
  <div class="kop__paneel"> ...links... </div>
</nav>
```

Het paneel is een gewone `div` die normaal meet; het uitklapblok stuurt hem aan
met `.kop__menu[open] ~ .kop__paneel`. Op desktop staat het uitklapblok op
`display: none` en is het paneel een gewone rij.

## Wat er niet in zit

Buiten het paneel tikken sluit het niet — daar is `<details>` niet voor
gemaakt en dat zou JavaScript vragen. Opnieuw op de knop tikken sluit hem, en
naar een andere pagina gaan ook. Dat is de prijs voor nul regels script in de
kopbalk.

## Los hiervan

*Wat* er in het menu staat is niet veranderd. Het voorstel om de twee reizen
("Verbouwen", "Nieuwbouw") als ingang te nemen is plan D en wacht op de data uit
Search Console. Het mechanisme werkt voor elke set items.
