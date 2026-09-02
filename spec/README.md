# Spec

Een spec per stuk werk, geschreven voordat er code is. Doel: vooraf vastleggen
wat af betekent, zodat achteraf niet de uitkomst tot doel wordt verklaard.

## Wanneer wel

- Een nieuwe pagina of tool.
- Een herziening die meerdere pagina's raakt.
- Een wijziging aan het datamodel.

## Wanneer niet

Een tekstcorrectie, een bugfix, of een losse stijlaanpassing. Die gaan direct
naar de code en langs [../review.md](../review.md).

## Werkwijze

1. Kopieer [template.md](template.md) naar `spec/<korte-naam>.md`.
2. Vul hem in en leg hem voor voordat je begint.
3. Werk hem bij als er onderweg iets verandert; een spec die niet meer klopt is
   erger dan geen spec.
4. Verwijs vanuit het logboek in `review.md` naar de spec als het werk klaar is.

## Bestaande specs

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
[../roadmap.md](../roadmap.md).
