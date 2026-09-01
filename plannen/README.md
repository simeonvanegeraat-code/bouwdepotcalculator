# Plannen

De inhoudelijke analyses: waarom dit product bestaat, hoe het eruit hoort te
zien, wat het moet verdienen en wat er juridisch wel en niet mag. Je opent ze
niet elke sessie — daarvoor zijn [roadmap.md](../roadmap.md) en
[review.md](../review.md) — maar wel als je een keuze wilt terugvinden.

Ze stonden tot 1 september 2026 los in de repo-root, naast tweeëndertig
HTML-pagina's. De inhoud is niet veranderd, alleen de plek.

| Bestand | Waarvoor |
|---|---|
| [PRODUCTPLAN.md](PRODUCTPLAN.md) | Wat we bouwen en voor wie. De twee reizen, de scope, wat er bewust niet in zit |
| [ONTWERPPLAN.md](ONTWERPPLAN.md) | Hoe het eruitziet. §3 beschrijft de broadsheet-richting die sinds 1 september op alle pagina's staat |
| [ONTWERPPLAN-HIERARCHIE.md](ONTWERPPLAN-HIERARCHIE.md) | De koprangorde en waarom die eerder niet klopte |
| [KWALITEITSPLAN.md](KWALITEITSPLAN.md) | Wanneer een tool goed genoeg is om op te leveren |
| [ADSENSE-PLAN.md](ADSENSE-PLAN.md) | Het verdienmodel: wat AdSense eist en wat dat betekent voor laadtijd en inhoud |
| [JURIDISCHE-CHECK.md](JURIDISCHE-CHECK.md) | De AFM-grens. **Lees dit vóór je iets bouwt dat op een aanbeveling lijkt** |
| [CONCURRENTIE-EN-OORDEEL.md](CONCURRENTIE-EN-OORDEEL.md) | Wat anderen doen, en waar wij bewust van afwijken |

---

## Wat hierin achterloopt op de code

Deze documenten zijn analyses van een moment, geen levende specificatie. Ze
worden niet bij elke wijziging bijgewerkt. **Meet zelf voordat je een getal uit
een plandocument overneemt.** Wat er nu bekend is:

- **De nulmeting van de homepage in `ONTWERPPLAN.md`** is van 14 augustus 2026
  en klopt niet meer: 5 secties in plaats van 29, en 0,3 scherm tot de uitkomst
  in plaats van 3,1. De actuele meting staat in
  [demo/2026-08-19-nulmeting-homepage.md](../demo/2026-08-19-nulmeting-homepage.md).
- **De hiërarchiefout uit `ONTWERPPLAN-HIERARCHIE.md`** is gerepareerd. Het
  document beschrijft dus een probleem dat er niet meer is; de redenering
  erachter geldt nog wel.
- **`ONTWERPPLAN.md` §3** is op 31 augustus herschreven voor de
  broadsheet-richting en is daarmee het enige deel dat wél actueel is.

Wat wel blijft gelden zonder houdbaarheidsdatum: de AFM-grens in
`JURIDISCHE-CHECK.md` en de scope in `PRODUCTPLAN.md`. Die gaan over wat we
mogen en willen, niet over hoe de site er vandaag uitziet.
