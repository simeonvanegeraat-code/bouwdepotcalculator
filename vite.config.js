import { defineConfig } from 'vite';
import { resolve } from 'path';

// De ingangen volgen de bestaande HTML-pagina's. Komt er een pagina bij, voeg
// hem hier toe, anders belandt hij niet in de build.
export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        depotplanner: resolve(__dirname, 'depotplanner.html'),
        verbouwbegroting: resolve(__dirname, 'verbouwbegroting.html'),
        bouwdepotDeclaratieAfgewezen: resolve(__dirname, 'bouwdepot-declaratie-afgewezen.html'),
        bouwdepotBerekenen: resolve(__dirname, 'bouwdepot-berekenen.html'),
        bouwdepotAbnAmro: resolve(__dirname, 'bouwdepot-abn-amro.html'),
        bouwdepotFlorius: resolve(__dirname, 'bouwdepot-florius.html'),
        bouwdepotIng: resolve(__dirname, 'bouwdepot-ing.html'),
        bouwdepotMunt: resolve(__dirname, 'bouwdepot-munt.html'),
        bouwdepotNn: resolve(__dirname, 'bouwdepot-nn.html'),
        bouwdepotAsr: resolve(__dirname, 'bouwdepot-asr.html'),
        bouwdepotAsn: resolve(__dirname, 'bouwdepot-asn.html'),
        bouwdepotArgenta: resolve(__dirname, 'bouwdepot-argenta.html'),
        bouwdepotCentraalBeheer: resolve(__dirname, 'bouwdepot-centraal-beheer.html'),
        bouwdepotAllianz: resolve(__dirname, 'bouwdepot-allianz.html'),
        bouwdepotObvion: resolve(__dirname, 'bouwdepot-obvion.html'),
        bouwdepotSns: resolve(__dirname, 'bouwdepot-sns.html'),
        bouwdepotRabobank: resolve(__dirname, 'bouwdepot-rabobank.html'),
        bouwdepotVoorwaardenVergelijken: resolve(__dirname, 'bouwdepot-voorwaarden-vergelijken.html'),
        bouwrenteNieuwbouw: resolve(__dirname, 'bouwrente-nieuwbouw.html'),
        contact: resolve(__dirname, 'contact.html'),
        cookies: resolve(__dirname, 'cookies.html'),
        dubbeleLastenNieuwbouw: resolve(__dirname, 'dubbele-lasten-nieuwbouw.html'),
        hypotheekrenteaftrekGids: resolve(__dirname, 'hypotheekrenteaftrek-gids.html'),
        main: resolve(__dirname, 'index.html'),
        methodologie: resolve(__dirname, 'methodologie.html'),
        nieuwbouw: resolve(__dirname, 'nieuwbouw.html'),
        overOns: resolve(__dirname, 'over-ons.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        renteverliesBouwdepot: resolve(__dirname, 'renteverlies-bouwdepot.html'),
        stappenplan: resolve(__dirname, 'stappenplan.html'),
        voorwaarden: resolve(__dirname, 'voorwaarden.html'),
      },
    },
  },
});
