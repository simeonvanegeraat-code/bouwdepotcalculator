# Techniek

**Bijgewerkt:** 19 augustus 2026

## Stack

Statische multi-page site. Vite bundelt, verder geen framework: geen React,
geen router, geen server. Elke pagina is een eigen HTML-bestand met een eigen
ingang in vite.config.js. Afhankelijkheden zijn chart.js (grafieken) en jspdf
(rapport downloaden). Deploy via Vercel (vercel.json).

## Datastroom

    data/bouwdepot-voorwaarden.json     <- handwerk, bron en datum per gegeven
            |
            +- scripts/build-bankdata.mjs     -> src/js/bankdata.generated.js
            +- scripts/build-voorwaarden.mjs  -> vergelijkingspagina
            +- scripts/build-declaratie.mjs   -> declaratiepagina
            +- scripts/build-begroting.mjs    -> begrotingspagina
                    |
                    +- tests/  bewaken dat de pagina's de data trouw blijven

De JSON is geschreven om te vergelijken en te verantwoorden: elk veld heeft een
detailtekst en een bron. De calculators hebben alleen de harde getallen nodig,
dus build-bankdata.mjs maakt daar een compacte browsermodule van. Dat script
leidt niets af en verzint niets: wat de aanbieder niet publiceert blijft null.

Nooit met de hand aanpassen: src/js/bankdata.generated.js en de gegenereerde
fragmenten in de HTML-pagina's.

## Tests

node --test over tests/. Ze bewaken data-integriteit, niet UI.

| Test | Bewaakt |
|---|---|
| nuance.test.mjs | Elke toelichting komt overal mee; geen kop belooft meer dan de bron |
| hub-volledigheid.test.mjs | Elk feit staat voor elke aanbieder op de vergelijkingspagina |
| kerncijfers.test.mjs | Getallen in de paginateksten kloppen met de data |
| aantal-aanbieders.test.mjs | Elke vermelding van het aantal aanbieders klopt |
| vergoedingsduur.test.mjs | Tarieven en looptijden spreken elkaar niet tegen |
| rapportvelden.test.mjs | Elk rapportveld heeft een Nederlands label |
| fiscal-rules.test.mjs | De fiscale regels van 2026 |

npm run build draait de tests eerst. Een falende test blokkeert de build met
opzet: verkeerde data is erger dan geen build.

## Bronbewaking

.github/workflows/voorwaarden-check.yml draait elke maandag 07:00 UTC en
vergelijkt de bronpagina's van de aanbieders met data/bronnen-snapshot.json.
De workflow werkt de data niet automatisch bij; hij opent alleen een issue.
Zie ../routines/bronnen-controleren.md.

## Ontwerpsysteem

src/styles/design-system.css bevat de tokens: kleur, typeschaal, ruimte op
4/8pt. Pagina's consumeren tokens en definieren niets zelf. Het palet is diep
teal op warm papier, bewust geen bankkleur.
