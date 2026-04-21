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
        nieuwbouw: resolve(__dirname, 'nieuwbouw.html'),
        bouwrenteNieuwbouw: resolve(__dirname, 'bouwrente-nieuwbouw.html'),
        belasting: resolve(__dirname, 'belasting.html'),
        stappenplan: resolve(__dirname, 'stappenplan.html'), // Toegevoegd voor AdSense content
        kennisbank: resolve(__dirname, 'kennisbank.html'),
        overOns: resolve(__dirname, 'over-ons.html'),
        hypotheekrenteaftrekGids: resolve(__dirname, 'hypotheekrenteaftrek-gids.html'),
        bouwdepotFouten: resolve(__dirname, 'bouwdepot-fouten.html'),
        adviesgesprekChecklist: resolve(__dirname, 'adviesgesprek-checklist.html'),
        
        // Juridische & Contact pagina's
        contact: resolve(__dirname, 'contact.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        voorwaarden: resolve(__dirname, 'voorwaarden.html'),
        cookies: resolve(__dirname, 'cookies.html'),
      },
    },
  },
});
