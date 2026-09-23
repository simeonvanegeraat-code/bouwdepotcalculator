/**
 * Wat er van het gebruik wordt geteld, en wat nadrukkelijk niet.
 *
 * De site bestaat uit rekenmachines, maar tot nu toe wisten we alleen hoe vaak
 * een pagina werd geopend — niet of er ook iets mee gebeurde. Daardoor was
 * elke uitspraak over "deze tool werkt" een aanname. Vier mijlpalen maken dat
 * meetbaar: begint iemand, komt hij bij een uitkomst, neemt hij die mee, en
 * gaat hij door naar de volgende vraag.
 *
 * Er gaat geen enkele ingevulde waarde mee. Niet het depotbedrag, niet het
 * inkomen, niet de WOZ-waarde. Alleen dát een mijlpaal is bereikt en op welke
 * pagina. De homepage belooft "uw invoer blijft op dit apparaat"; die belofte
 * weegt zwaarder dan een fijnere meting.
 *
 * Vercel Web Analytics telt de rest al: paginaweergaven zijn de noemer onder
 * deze vier tellers.
 */

const TOOL = location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'home';

// Elke mijlpaal hoort één keer per bezoek te tellen. Anders meet je hoe vaak
// iemand een veld aanraakt in plaats van hoeveel mensen beginnen.
const gemeld = new Set();

function meld(naam, extra) {
    if (gemeld.has(naam)) return;
    gemeld.add(naam);
    try {
        window.va?.('event', { name: naam, data: { tool: TOOL, ...extra } });
    } catch (_) {
        // Analytics mag nooit een rekenpagina omleggen.
    }
}

/**
 * Het antwoord werd een echt bedrag.
 *
 * Pas kijken ná de eerste invoer: het gedeelde formuliergeheugen vult velden
 * voor, dus bij het laden staat er soms al een uitkomst waar de bezoeker niets
 * voor heeft gedaan. Die meetellen zou de trechter waardeloos maken.
 */
let kijker = null;

function volgUitkomst() {
    if (kijker || gemeld.has('uitkomst-bereikt')) return;

    const doelen = document.querySelectorAll('.bs-antwoord__bedrag, [data-bedrag]');
    if (!doelen.length) return;

    // "€ 0" is geen uitkomst; "€ 1.204" wel.
    const heeftBedrag = (el) => /[1-9]/.test((el.textContent || '').replace(/\D/g, ''));

    kijker = new MutationObserver(() => {
        for (const doel of doelen) {
            if (!heeftBedrag(doel)) continue;
            meld('uitkomst-bereikt');
            kijker.disconnect();
            return;
        }
    });

    for (const doel of doelen) {
        kijker.observe(doel, { childList: true, characterData: true, subtree: true });
    }
}

const opInvoer = (e) => {
    if (!e.target?.matches?.('input, select, textarea')) return;
    meld('rekenen-gestart');
    volgUitkomst();
};

document.addEventListener('input', opInvoer, true);
document.addEventListener('change', opInvoer, true);

document.addEventListener('click', (e) => {
    if (e.target?.closest?.('button[id^="btn-download"], #begroting-printen, #dp-printen')) {
        meld('rapport-meegenomen');
    }

    const link = e.target?.closest?.('a.bs-tool, a.bs-vervolgstap');
    if (link) {
        // Alleen waar hij heen gaat, niet waar hij vandaan komt met welke invoer.
        meld('vervolgstap', { naar: (link.getAttribute('href') || '').split('#')[0] || 'zelfde-pagina' });
    }
});
