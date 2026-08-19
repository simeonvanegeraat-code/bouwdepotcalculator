# Routine: Search Console-data verwerken

**Wanneer:** wekelijks, zodra de founder een export uploadt.

**Eerste bruikbare week:** vanaf ongeveer 26 augustus 2026. De sitemap is op 19
augustus ingediend en main ging diezelfde dag live, dus de cijfers daarvóór gaan
over een andere site. Trek er tot die tijd geen conclusies uit.

## Stappen

1. Zet de export in `customers/` als `zoekdata-<jjjj-mm-dd>.csv` of `.md`.
2. Kijk naar drie dingen, in deze volgorde:
   - **Welke vragen stellen mensen?** Zoektermen zijn de enige plek waar de
     bezoeker letterlijk zijn eigen woorden gebruikt. Nieuwe terugkerende termen
     horen in [../customers/signalen.md](../customers/signalen.md).
   - **Welke pagina's worden gevonden en welke niet?** Een pagina met vertoningen
     maar zonder klikken heeft een titelprobleem. Een pagina zonder vertoningen
     heeft een indexeringsprobleem.
   - **Wordt er nu wél gecrawld?** Dat was het kernprobleem uit
     [../ADSENSE-PLAN.md](../ADSENSE-PLAN.md): veertien pagina's waren in zes
     maanden nooit opgehaald.
3. Zet wat je eruit haalt op één plek: nieuwe bezoekersvragen in `customers/`,
   werk dat eruit volgt in [../roadmap.md](../roadmap.md).

## Wat je er niet mee doet

- **Niet per week bijsturen.** Zoekdata schommelt; twee slechte dagen zijn geen
  signaal. Kijk naar de lijn over meerdere weken.
- **Geen pagina's maken voor termen zonder eigen antwoord.** Een pagina die
  bestaat omdat een term populair is en niet omdat we iets te melden hebben, is
  precies het soort pagina dat eerder nooit gecrawld werd.
