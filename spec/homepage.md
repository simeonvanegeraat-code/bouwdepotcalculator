# Spec: homepage herzien

**Datum:** 19-08-2026
**Status:** must fix opgeleverd 19-08-2026, should fix nog open
**Roadmap:** blok 2, UI/UX van de calculator

Gebaseerd op een volledige inspectie van `index.html` (398 regels), het
homepage-deel van `src/js/main.js` en het gedrag in de browser op 1280 en 375px.
Alles hieronder is gemeten of gelezen, niet vermoed.

---

## Must fix

### 1. Negatieve en absurde invoer geeft onzin als antwoord

> **Opgelost 19-08.** `min`/`max` op beide velden, plus `.ds-veld__fout` in het ontwerpsysteem en validatie in `calculate()`. Bij ongeldige invoer verschijnt een melding en blijft de uitkomst op nul staan.
`input-amount` en `input-interest` hebben geen `min`, `max` of `required`. Wat
dat oplevert, gemeten in de browser:

| Invoer | Uitkomst op het scherm |
|---|---|
| bedrag leeg | € 0 |
| bedrag −50.000 | **€ −233 per maand**, totale rente **€ −33.872** |
| bedrag 999.999.999 | € 4.659.574 per maand, zonder waarschuwing |
| rente −5% | € 30 per maand, totale rente € −14.273 |

Een negatieve maandlast op een site die "absolute financiële helderheid"
belooft. `parseFloat(...) || 0` vangt alleen leeg af, niet onzinnig.

**Gebouwd:** `min="0" max="1000000"` op het bedrag en `min="0" max="20"` op de
rente — bewust ruimer dan de schuifregelaars ernaast, zodat een groot maar echt
bouwdepot niet geweigerd wordt. Nul procent rente blijft toegestaan, want
renteloos lenen bestaat; nul euro depot niet. Bij een ongeldige waarde verschijnt
een melding onder het veld, krijgt het veld `aria-invalid`, en blijft de uitkomst
op nul in plaats van een onmogelijk bedrag te tonen.

### 2. "Zes banken" terwijl het er acht zijn

> **Opgelost 19-08.** kop gecorrigeerd naar acht, en een extra test bewaakt nu koppen. Bewezen door de oude kop terug te zetten: de test faalde.
`index.html:260` heeft de kop *"Zes banken, zes verschillende bouwdepots"*,
terwijl het cijfer in dezelfde sectie **7/8** zegt. De sectie spreekt zichzelf
tegen op het scherm.

`tests/aantal-aanbieders.test.mjs` vangt dit niet: het patroon matcht op
"aanbieders" en "geldverstrekkers", niet op "banken". Dit is de enige plek in de
hele site met die formulering.

**Voorstel:** kop corrigeren én het testpatroon uitbreiden met "banken", zodat
dit niet opnieuw kan.

### 3. FAQ-structured data die niet op de pagina staat

> **Opgelost 19-08.** de drie vragen staan als eigen sectie op de pagina, met exact de tekst uit de markup.
De `FAQPage`-markup bevat drie vragen. **Geen van drieën staat als zichtbare
tekst op de pagina** — gecontroleerd tegen `document.body.innerText`. Google
vereist dat FAQ-inhoud zichtbaar is voor de bezoeker; markup zonder zichtbare
tegenhanger geldt als misleidende structured data.

Extra scherp nu de AdSense-aanvraag deze week de deur uit gaat.

**Voorstel:** óf de drie vragen zichtbaar op de pagina zetten (ze passen goed
onder "Hoe deze berekening werkt"), óf de markup verwijderen.

---

## Should fix

### 4. Drie van de vier navigatie-items staan buiten beeld op mobiel
De navigatie is 430px breed in een strook van 157px, met `overflow-x: auto` en
geen enkele visuele hint dat er meer is. Buiten beeld vallen *Voorwaarden per
bank*, *Uitleg* en *Over ons* — waaronder de pagina die de unieke data draagt.

### 5. Aanraakzones onder de 44px
Navigatielinks **24px** en keuzechips **38px**.

De schuifregelaars en getalvelden halen 44px wél — die staan goed. (Een eerdere
telling van 26 te kleine elementen was misleidend: die bevatte inline tekstlinks
in lopende tekst, waarvoor de 44px-eis niet geldt, en de checkbox, die een label
van volle breedte als klikvlak heeft.)

### 6. Geen og:- of twitter:-tags
De homepage heeft geen enkele social-tag, terwijl `public/og-1200x630.png`
klaarstaat en ongebruikt is. Een gedeelde link in WhatsApp of op LinkedIn toont
nu niets.

### 7. Invoer staat 1,6 scherm onder de uitkomst
Je ziet een antwoord op 0,3 scherm en kunt pas op 1,6 scherm je eigen bedrag
typen. Voor bezoekers die op rekenintentie binnenkomen is dat de verkeerde
volgorde. Zie [../demo/2026-08-19-nulmeting-homepage.md](../demo/2026-08-19-nulmeting-homepage.md).

### 8. Kopgewicht 660 tegenover 400 bij de referenties
Zie [../context/ontwerpreferenties.md](../context/ontwerpreferenties.md).

---

## Kleiner grut

- `sticky-result-bar` heeft `aria-live="polite"` en werkt bij elke toetsaanslag
  bij: een schermlezer leest elk tussenbedrag voor.
- De verhoudingsbalk staat op `aria-hidden="true"`, inclusief de bedragen voor
  rente en aflossing die alleen daar staan.
- Geen skiplink naar de inhoud.
- 13 inline `style`-attributen, waaronder `display:none` dat JS omzet.
- Het `Organization`-schema noemt `firenature23@gmail.com` als
  klantcontact — op een financiële site leest een privé-gmailadres als
  onprofessioneel, en het staat ook in de broncode voor scrapers.
- `<meta name="author" content="Simeon">` en `"founder": "Simeon"` zonder
  achternaam of kwalificatie. Voor een geldonderwerp is dat dun.

---

## Wat al goed is

Belangrijk om niet weg te bouwen: geen horizontale overloop in `main`,
koprangorde zonder sprongen, correcte `lang`, canonical, en meta-description.
Vijf secties in `<main>` in plaats van de 29 uit het oude plandocument. De
uitkomst staat bovenaan met een uitsplitsing die klopt, en de bankstrook toont
de voorwaarden van de gekozen geldverstrekker naast het bedrag.

---

## Klaar wanneer

- [x] Onzinnige invoer levert een melding op, geen negatief bedrag.
- [x] Elk getal over aanbieders klopt met de data, bewaakt door een test.
- [x] Structured data en zichtbare inhoud komen overeen.
- [ ] Alle navigatie is bereikbaar op 375px.
- [ ] Schuifregelaars en chips halen 44px.
- [ ] Invoer staat vóór of naast de uitkomst, niet eronder.
- [ ] Voor-en-na gemeten in `demo/`.
