# Beslissingen

Genomen besluiten met hun reden, zodat ze niet elke maand opnieuw ter tafel
komen. Nieuwste bovenaan.

---

### 19-08-2026 - AdSense-aanvraag volgt op de kwaliteitsronde, niet andersom

AdSense is belangrijk en de aanvraag gaat eind deze week de deur uit, maar pas
na de vier blokken uit de weekfocus. Reden: ontwerpen voor een beoordelaar in
plaats van voor de bezoeker heeft eerder tot verkeerde keuzes geleid, zie het
besluit van 14-08 hieronder. De volgorde is dus kwaliteit eerst, aanvraag daarna
- niet omdat AdSense onbelangrijk is, maar omdat dat de kans van slagen bepaalt.

### 18-08-2026 - De vergelijking groeit alleen met dezelfde brondiscipline

Obvion en SNS erbij, wat het totaal op acht brengt. Voorwaarde: elke cel heeft
een eigen bron-URL en controledatum, anders komt de aanbieder er niet bij. Een
test bewaakt dat elke vermelding van het aantal klopt met de data.

### 16-08-2026 - Nuance is niet optioneel in de weergave

Aanleiding: een gebruiker meldde dat "Max. per declaratie EUR 5.000" bij
Rabobank niet klopte met zijn praktijk. Het bedrag stond goed in de data; de
toelichting "limiet zelf verhoogbaar" was onderweg gesneuveld. Datzelfde
patroon bleek er nog zestien keer in te zitten.

Besluit: heeft een veld een detail, dan rendert dat overal mee, en
tests/nuance.test.mjs faalt als dat niet gebeurt. De oorzaak was een
ontwerpfout in het datamodel, geen slordigheid, dus is de fix structureel.

### 16-08-2026 - Elke tool levert een document op, geen getal

Een rekenmachine geeft een uitkomst en dan vertrek je. Een begroting, een
specificatie of een planning houd je bij je en deel je met je aannemer of
adviseur. Concurrenten geven getallen.

### 16-08-2026 - De bankkeuze loopt door de hele site

Onze unieke data zat in een naslagwerk; hij hoort in het gereedschap. Kies
eenmaal je bank, en de maandlast, de begroting en de planner rekenen ermee.

### 14-08-2026 - Eigen kleur, geen bankkleur

De hoofdkleur stond in de CSS omschreven als "Rabo-achtig". Voor een site die
zijn waarde ontleent aan onafhankelijkheid is een bank imiteren precies
verkeerd. Vervangen door diep teal op warm papier: onderscheidend tussen de
Nederlandse geldverstrekkers en rustig genoeg voor financiele cijfers.

### 14-08-2026 - Antwoord eerst, diepte op verzoek

Correctie op een eerdere koers. Er was 44 procent extra tekst zichtbaar gemaakt
op de homepage en dat was als winst gepresenteerd, omdat er voor de
AdSense-beoordelaar werd ontworpen. Het juiste antwoord was nooit "alle tekst
tonen" maar "minder tekst hebben". Woordaantal is geen kwaliteitsmaat.

### 14-08-2026 - Data wordt nooit automatisch bijgewerkt

De wekelijkse controle meldt wijzigingen in bronpagina's en opent een issue,
maar past niets aan. Een verkeerde cel is erger dan een verouderde cel.

### 14-08-2026 - Informeren, niet adviseren

Een feitelijke, gedateerde vergelijkingstabel met bronvermelding is informeren
en niet vergunningplichtig. Geen persoonlijke aanbeveling en geen
bezoekersgegevens naar een geldverstrekker: bij een van beide verandert de
juridische kwalificatie en is een AFM-vergunning nodig. Volledige onderbouwing
in JURIDISCHE-CHECK.md.
