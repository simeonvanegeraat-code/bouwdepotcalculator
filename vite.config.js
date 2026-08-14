import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // De root van het project
  root: '.', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Core pagina's
        main: resolve(__dirname, 'index.html'),
        calculators: resolve(__dirname, 'calculators.html'),
        maandlastenBouwdepot: resolve(__dirname, 'maandlasten-bouwdepot.html'),
        renteverliesBouwdepot: resolve(__dirname, 'renteverlies-bouwdepot.html'),
        dubbeleLastenNieuwbouw: resolve(__dirname, 'dubbele-lasten-nieuwbouw.html'),
        nieuwbouw: resolve(__dirname, 'nieuwbouw.html'),
        bouwrenteNieuwbouw: resolve(__dirname, 'bouwrente-nieuwbouw.html'),
        belasting: resolve(__dirname, 'belasting.html'),
        stappenplan: resolve(__dirname, 'stappenplan.html'), // Toegevoegd voor AdSense content
        kennisbank: resolve(__dirname, 'kennisbank.html'),
        methodologie: resolve(__dirname, 'methodologie.html'),
        overOns: resolve(__dirname, 'over-ons.html'),
        hypotheekrenteaftrekGids: resolve(__dirname, 'hypotheekrenteaftrek-gids.html'),
        bouwdepotFouten: resolve(__dirname, 'bouwdepot-fouten.html'),
        adviesgesprekChecklist: resolve(__dirname, 'adviesgesprek-checklist.html'),

        // Voorwaardenvergelijking (gegenereerd door scripts/build-voorwaarden.mjs)
        voorwaardenVergelijken: resolve(__dirname, 'bouwdepot-voorwaarden-vergelijken.html'),
        bouwdepotAbnAmro: resolve(__dirname, 'bouwdepot-abn-amro.html'),
        bouwdepotRabobank: resolve(__dirname, 'bouwdepot-rabobank.html'),
        bouwdepotIng: resolve(__dirname, 'bouwdepot-ing.html'),
        bouwdepotMunt: resolve(__dirname, 'bouwdepot-munt.html'),
        bouwdepotFlorius: resolve(__dirname, 'bouwdepot-florius.html'),
        bouwdepotNn: resolve(__dirname, 'bouwdepot-nn.html'),

        // Juridische & Contact pagina's
        contact: resolve(__dirname, 'contact.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        voorwaarden: resolve(__dirname, 'voorwaarden.html'),
        cookies: resolve(__dirname, 'cookies.html'),
      },
    },
  },
});
