import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Dit vertelt Vite dat de root van je project DEZE map is
  root: '.', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Hier zeggen we: pak de index.html uit de huidige map (__dirname)
        main: resolve(__dirname, 'index.html'),
        nieuwbouw: resolve(__dirname, 'nieuwbouw.html'),
      },
    },
  },
});