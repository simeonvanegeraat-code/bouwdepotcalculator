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
        belasting: resolve(__dirname, 'belasting.html'),
        stappenplan: resolve(__dirname, 'stappenplan.html'), // Toegevoegd voor AdSense content
        
        // Juridische & Contact pagina's
        contact: resolve(__dirname, 'contact.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        voorwaarden: resolve(__dirname, 'voorwaarden.html'),
        cookies: resolve(__dirname, 'cookies.html'),
      },
    },
  },
});