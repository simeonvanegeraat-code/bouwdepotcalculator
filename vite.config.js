import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Belangrijk: Dit vertelt Vite dat de root van je project DEZE map is
  root: '.', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Hier definiëren we de twee pagina's
        main: resolve(__dirname, 'index.html'),
        nieuwbouw: resolve(__dirname, 'nieuwbouw.html'),
      },
    },
  },
});