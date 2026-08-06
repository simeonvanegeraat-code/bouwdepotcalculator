import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // De root van het project
  root: '.', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Core pagina
        main: resolve(__dirname, 'index.html'),
        // Juridische & Contact pagina's
        contact: resolve(__dirname, 'contact.html'),
        privacy: resolve(__dirname, 'privacy.html')
      },
    },
  },
});
