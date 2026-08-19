# Routine: publiceren

De site staat op Vercel en volgt de main-branch. Publiceren is dus: mergen. Wat
je daarvoor doet telt.

## Stappen

1. Volledige build lokaal:

```bash
npm run build
```

   Die draait eerst de tests en dan de generatoren. Slaagt hij niet, dan gaat er
   niets naar main.

2. Bekijk de gebouwde site, niet alleen de dev-server:

```bash
npm run preview
```

3. Loop [../review.md](../review.md) af voor het soort wijziging dat je hebt
   gedaan.
4. Is er inhoud gewijzigd? Werk dan `lastmod` in `public/sitemap.xml` bij voor
   de geraakte pagina's.
5. Commit in het Nederlands, gebiedende wijs, beschrijvend voor de bezoeker.
6. Merge naar main. Vercel bouwt zelf.
7. Controleer de live pagina na de deploy.
8. Noteer het in het logboek onderaan `review.md`.

## Niet doen

- Publiceren met een overgeslagen of uitgezette test.
- `dist/` committen; die map staat in `.gitignore`.
- Data bijwerken zonder bron en datum, ook niet "even snel".
