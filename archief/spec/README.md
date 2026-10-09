# Spec

Een spec per stuk werk, geschreven voordat er code is. Doel: vooraf vastleggen
wat af betekent, zodat achteraf niet de uitkomst tot doel wordt verklaard.

## Een spec is gereedschap, geen verplichting

Dit stond tot 9 oktober 2026 als regel: een spec vóór elk stuk werk. Dat leverde
vier specs op die op akkoord wachtten, waarvan de oudste uit augustus. Drie
daarvan zijn nooit gebouwd — geschreven, nooit besloten, plankwerk.

Sindsdien geldt: **we bouwen en laten zien.** Schrijf een spec alleen als hij
jou helpt, en dat is in de praktijk bij één soort werk zo: als je er zelf niet
uitkomt en er een keuze gemaakt moet worden die niet van jou is. Dan zet je twee
of drie richtingen naast elkaar in [../demo/](../demo/) en laat je kiezen. Dat
werkte bij [invoervelden.md](invoervelden.md).

## Houdbaarheid

**Een spec die twee weken op akkoord wacht, gaat weg of wordt alsnog beslist.**
Hij kost niets zichtbaars, maar hij suggereert dat er een plan is waar geen plan
is — en dat is erger dan een lege map.

## Werkwijze

1. Kopieer [template.md](template.md) naar `spec/<korte-naam>.md`.
2. Zet de keuze erin die gemaakt moet worden, niet de hele oplossing.
3. Werk hem bij als er onderweg iets verandert; een spec die niet meer klopt is
   erger dan geen spec.
4. Verwijs vanuit het logboek in `review.md` naar de spec als het werk klaar is.

## Bestaande specs

- [header.md](header.md) — één header uit één bron, met de rekenhulpen achter een
  popover-paneel. Status: **opgeleverd 30-09**.
- [nieuwbouw-rekentool.md](nieuwbouw-rekentool.md) — de vier nieuwbouwtools
  worden er één, zodat de bezoeker geen getallen meer tussen schermen
  overtypt. Status: **voorstel**, vier open vragen.
- [invoervelden.md](invoervelden.md) — de invoerkolom van de rekenpagina's,
  gemeten en vergeleken met drie andere sites. Status: **voorstel**, wacht op
  akkoord.
- [meeneemdocument.md](meeneemdocument.md) — het document dat de bezoeker
  afdrukt of opslaat, als product in plaats van als bijproduct. Status:
  **voorstel**, wacht op akkoord.
- [deelafbeelding.md](deelafbeelding.md) — de afbeelding die verschijnt als
  iemand een link deelt. Status: **voorstel**, wacht op akkoord.
- [homepage-als-introductie.md](homepage-als-introductie.md) — de homepage wordt
  een introductie, de rekenmachine krijgt een eigen pagina. Status: opgeleverd
  31-08, alle vier de open vragen beslist.
- [afdrukdocument.md](afdrukdocument.md) — één afdrukdocument voor alle tools in
  plaats van jsPDF. Status: opgeleverd 22-08. Wordt opgevolgd door
  [meeneemdocument.md](meeneemdocument.md).
- [verbouwbegroting.md](verbouwbegroting.md) en [homepage.md](homepage.md) —
  ouder werk, opgeleverd.

De volgorde volgt verder uit het bovenste blok van
[../roadmap.md](../roadmap-2026-07-tot-09.md).
