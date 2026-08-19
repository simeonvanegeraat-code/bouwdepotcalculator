# Routine: nieuwe pagina

Vier plekken. Vergeet je er een, dan bestaat de pagina wel maar vindt niemand
hem, of komt hij niet eens in de build.

## Stappen

1. **HTML-bestand** in de repo-root, met een sprekende bestandsnaam in het
   Nederlands. De naam wordt de URL en verandert later niet meer zonder
   redirect.
2. **Ingang in `vite.config.js`** onder `rollupOptions.input`. Zonder deze regel
   belandt de pagina niet in `dist/`.
3. **`<url>` in `public/sitemap.xml`**, met de datum van vandaag als `lastmod`.
4. **Interne links** vanaf de pagina's waar hij thuishoort. Een pagina zonder
   inkomende links wordt zelden gecrawld, ook al staat hij in de sitemap.

## Voordat je hem klaar noemt

- Eigen titel en metabeschrijving, die deze pagina beschrijven en geen andere.
- Een `<h1>`, koppen lopen op zonder niveaus over te slaan.
- Vorm uit `src/styles/design-system.css`, geen losse kleuren of maten.
- De uitkomst of het antwoord staat bovenaan, uitleg eronder.
- Draag de pagina eigen informatie? Zo niet, waarom bestaat hij dan.
- Checklist in [../review.md](../review.md) afgelopen.

```bash
npm run build
```
