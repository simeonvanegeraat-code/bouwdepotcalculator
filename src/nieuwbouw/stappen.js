/**
 * Stap voor stap invullen op nieuwbouw.html: start, vijf vragen, overzicht.
 *
 * Dit is een laag over de rekentool, geen tweede rekentool. De stappen vragen
 * een handvol gegevens en zetten die in het formulier van het overzicht; rekenen doet
 * src/nieuwbouw/pagina.js zoals altijd. Wat hier wel gebeurt: bepalen welk
 * scherm er staat, de invoer onthouden op dit apparaat, een link maken waar de
 * invoer in zit, en de bouwplaats laten meegroeien.
 *
 * De toestand staat op de body (data-nb); de stijl in nieuwbouw.css doet de
 * rest. De regels zelf staan zonder DOM in stappenlogica.js.
 */

import { koppelBedragveld, koppelPercentageveld, leesGetal, leesPercentage, toonGetal, euro } from '../js/getallen.js';
import { maakSchemascherm } from './schemascherm.js';
import { SLEUTEL, STANDAARD, STAPPEN, bewaarTekst, controleerStap, eersteOpenStap, leesBewaard, naarAdres, uitAdres } from './stappenlogica.js';

// De bouwplaats telt van 0 (lege kavel) tot 5 (bewoond): elke stap zet er een deel bij.
// De standen zijn rustpunten: wanden staan (2), verdieping erop (3), dak dicht (3,75), ramen erin (4,1).
const KRAANSTAND = { start: 0.1, 1: 1.0, 2: 2.0, 3: 3.0, 4: 3.75, 5: 4.1, klaar: 5 };
const VOORBEELD = { von: 500000, grond: 150000, meerwerk: 0, eigen: 0, rente: 3.8, vorm: 'annuiteit', maanden: 12, woonlast: 1200, overlap: 2 };

function start() {
    const lichaam = document.body;
    const wortel = document.querySelector('[data-stappen]');
    if (!wortel || !lichaam.dataset.nb) return;
    const el = (id) => document.getElementById(id);
    const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // De velden van het overzicht; de stappen schrijven hierheen.
    const hoofd = {
        von: el('input-von'), grond: el('input-land'), meerwerk: el('input-meerwerk'), eigen: el('input-eigen-geld'),
        rente: el('input-interest'), vorm: el('input-vorm'), maanden: el('input-build-months'), schuif: el('range-build-months'),
        woonlast: el('input-current-housing'), overlap: el('input-overlap'),
        depot: el('input-depot-soort'), afslag: el('input-depot-discount'), mee: el('input-meefinancieren'),
    };
    const st = {
        von: el('st-von'), grond: el('st-grond'), meerwerk: el('st-meerwerk'), eigen: el('st-eigen'), rente: el('st-rente'), mee: el('st-mee'),
        maanden: el('st-maanden'), schuif: el('st-maanden-schuif'), woonlast: el('st-woonlast'), overlap: el('st-overlap'),
    };
    const melding = document.querySelector('[data-nb-voorbeeldmelding]');
    for (const v of [st.von, st.grond, st.meerwerk, st.eigen, st.woonlast]) koppelBedragveld(v);
    koppelPercentageveld(st.rente);

    /* ------------------------------ lezen en schrijven ------------------------------ */

    const heel = (tekst) => { const n = leesGetal(tekst); return n === null ? null : n; };

    function leesStappen() {
        // Een leeg veld bij meerwerk of eigen geld is nul: wie het niet heeft, vult niets in.
        const ofNul = (veld) => (veld.value.trim() === '' ? 0 : heel(veld.value));
        const w = {
            von: heel(st.von.value), grond: heel(st.grond.value), meerwerk: ofNul(st.meerwerk),
            eigen: ofNul(st.eigen),
            rente: leesPercentage(st.rente.value),
            vorm: wortel.querySelector('input[name="st-vorm"]:checked')?.value ?? STANDAARD.vorm,
            maanden: heel(st.maanden.value), woonlast: heel(st.woonlast.value), overlap: heel(st.overlap.value),
        };
        if (st.mee.checked) w.mee = 'mee';
        // De depotvergoeding vragen de stappen niet; wat op het overzicht is gekozen, blijft staan.
        if (hoofd.depot.value !== 'gelijk') w.depot = hoofd.depot.value;
        if (hoofd.depot.value === 'lager') w.afslag = leesPercentage(hoofd.afslag.value);
        return w;
    }

    function leesHoofd() {
        const w = {
            von: heel(hoofd.von.value), grond: heel(hoofd.grond.value), meerwerk: heel(hoofd.meerwerk.value),
            eigen: heel(hoofd.eigen.value), rente: leesPercentage(hoofd.rente.value), vorm: hoofd.vorm.value,
            maanden: heel(hoofd.maanden.value), woonlast: heel(hoofd.woonlast.value), overlap: heel(hoofd.overlap.value),
        };
        if (hoofd.depot.value !== 'gelijk') w.depot = hoofd.depot.value;
        if (hoofd.depot.value === 'lager') w.afslag = leesPercentage(hoofd.afslag.value);
        if (hoofd.mee.value === 'mee') w.mee = 'mee';
        return w;
    }

    function vulStappen(w) {
        st.von.value = toonGetal(w.von);
        st.grond.value = toonGetal(w.grond);
        st.meerwerk.value = w.meerwerk ? toonGetal(w.meerwerk) : '';
        st.eigen.value = w.eigen ? toonGetal(w.eigen) : '';
        st.mee.checked = w.mee === 'mee';
        st.rente.value = toonGetal(w.rente, 2);
        st.maanden.value = String(w.maanden);
        st.schuif.value = String(w.maanden);
        st.woonlast.value = toonGetal(w.woonlast);
        st.overlap.value = String(w.overlap);
        const keuze = wortel.querySelector(`input[name="st-vorm"][value="${w.vorm}"]`);
        if (keuze) keuze.checked = true;
        werkAfgeleidBij();
    }

    /**
     * Zet de invoer in het formulier van het overzicht en laat de rekentool
     * opnieuw rekenen. Bij eigen invoer gaan rente en woonlast ook naar het
     * gedeelde geheugen van de site; bij het voorbeeld niet, want dat zijn
     * jouw cijfers niet.
     */
    function schrijfHoofd(w, { eigenInvoer }) {
        hoofd.von.value = toonGetal(w.von);
        hoofd.grond.value = toonGetal(w.grond);
        hoofd.meerwerk.value = toonGetal(w.meerwerk ?? STANDAARD.meerwerk);
        hoofd.eigen.value = toonGetal(w.eigen);
        hoofd.rente.value = toonGetal(w.rente, 2);
        hoofd.vorm.value = w.vorm;
        hoofd.maanden.value = String(w.maanden);
        hoofd.woonlast.value = toonGetal(w.woonlast);
        hoofd.overlap.value = String(w.overlap);
        hoofd.depot.value = w.depot ?? 'gelijk';
        if (w.depot === 'lager') hoofd.afslag.value = toonGetal(w.afslag, 2);
        hoofd.mee.value = w.mee ?? 'zelf';

        const meld = (veld, soort) => veld.dispatchEvent(new Event(soort, { bubbles: true }));
        meld(hoofd.depot, 'change');
        meld(hoofd.mee, 'change');
        meld(hoofd.vorm, 'change');
        meld(hoofd.maanden, 'input');   // zet ook de schuif en het termijnschema
        meld(hoofd.von, 'input');       // rekent de bedragen van het schema om
        if (eigenInvoer) { meld(hoofd.rente, 'change'); meld(hoofd.woonlast, 'change'); }
        // Een bewaard eigen termijnschema gaat erachteraan; het voorbeeld rekent
        // met het voorbeeldschema. Wie de stappen opnieuw doorloopt houdt zijn schema.
        if (w.schema || !eigenInvoer) zetSchema(w.schema ?? null);
    }
    const zetSchema = (termijnen) => document.dispatchEvent(new CustomEvent('nieuwbouw:zet-schema', { detail: { termijnen } }));

    /* ------------------------------ onthouden ------------------------------ */

    // Welk scherm er staat. Het attribuut op de body loopt hier even op achter:
    // bij een overgang zet de browser het pas als hij het oude beeld heeft vastgelegd.
    let stand = lichaam.dataset.nb;
    // Bij het voorbeeld onthouden we niets.
    let voorbeeld = false;
    const zetVoorbeeld = (aan) => { voorbeeld = aan; melding.hidden = !aan; };

    function bewaar() {
        if (voorbeeld || stand !== 'klaar') return;
        const w = leesHoofd();
        if (eersteOpenStap(w) !== 0) return;
        try { localStorage.setItem(SLEUTEL, bewaarTekst(w, Date.now(), laatste?.eigenSchema ? laatste.schema : null)); } catch { /* zonder opslag werkt alles, alleen niet bij terugkomst */ }
    }
    // De laatste geslaagde berekening: daar komen het schema en de aanneemsom vandaan.
    let laatste = null;
    document.addEventListener('nieuwbouw:berekend', (e) => {
        if (e.detail.tijdlijn) laatste = e.detail;
        werkOverzichtBij(e.detail);
        if (e.detail.tijdlijn) bewaar();
    });

    const invoer = el('invoer');
    // Wie in het voorbeeld zelf een veld aanpast, is met zijn eigen cijfers bezig.
    invoer.addEventListener('input', (e) => { if (e.isTrusted && voorbeeld) { zetVoorbeeld(false); bewaar(); } });

    /* ------------------------------ het overzicht: samenvatting en aannames ------------------------------ */

    const samen = document.querySelector('[data-nb-samen]');
    const puntDepot = document.querySelector('[data-nb-depot]');
    const puntSchema = document.querySelector('[data-nb-schema]');
    const knopAanpassen = document.querySelector('[data-nb-aanpas=""]');
    const knopSchema = document.querySelector('[data-nb-schemaknop]');
    // Het schema waar de rekentool nu mee rekent, ook als dat geen uitkomst geeft.
    let schemaNu = null;
    const procent = (n) => `${toonGetal(n, 2)}%`;
    const maanden = (n) => (n === 1 ? '1 maand' : `${n} maanden`);

    function zetOpen(open) {
        lichaam.classList.toggle('nb-open', open);
        knopAanpassen.setAttribute('aria-expanded', String(open));
        knopAanpassen.textContent = open ? 'Klaar met aanpassen' : 'Aanpassen';
    }

    /** Na elke berekening: wat je hebt ingevuld, en waar de uitkomst een aanname voor gebruikt. */
    function werkOverzichtBij({ tijdlijn: t, termijnen = 0, eigenSchema = false, schema = null }) {
        const w = leesHoofd();
        if (schema) schemaNu = schema;
        knopSchema.textContent = eigenSchema ? 'Schema aanpassen' : 'Eigen schema invullen';
        if (!t) {
            // Zonder uitkomst valt er niets samen te vatten; dan moet het formulier in beeld.
            samen.innerHTML = '';
            puntSchema.innerHTML = eigenSchema ? `Je eigen schema: <strong>${termijnen} ${termijnen === 1 ? 'termijn' : 'termijnen'}</strong>. Past het nog bij je bouwduur?` : '';
            if (stand === 'klaar') zetOpen(true);
            return;
        }
        const rijen = [
            ['Koopsom v.o.n.', euro.format(w.von)],
            ['waarvan grond', euro.format(w.grond)],
            ...(w.meerwerk > 0 ? [['Meerwerk, meegefinancierd', euro.format(w.meerwerk)]] : []),
            ['Eigen geld', w.eigen > 0 ? euro.format(w.eigen) : 'geen'],
            ...(t.meegefinancierd > 0.5 ? [['Rente tijdens de bouw, meegefinancierd', euro.format(t.meegefinancierd)]] : []),
            ['Je hypotheek', euro.format(t.lening), 'is-som'],
            ['Hypotheekrente', `${procent(w.rente)}, ${w.vorm === 'lineair' ? 'lineair' : 'annuïtair'}`],
            ['Bouwduur', maanden(t.invoer.bouwduurMaanden)],
            ['Huidige woonlast', w.woonlast > 0 ? `${euro.format(w.woonlast)} per maand` : 'geen'],
            ...(w.woonlast > 0 ? [['loopt door na oplevering', maanden(w.overlap)]] : []),
        ];
        samen.innerHTML = rijen.map(([naam, waarde, klasse]) => `<dt${klasse ? ` class="${klasse}"` : ''}>${naam}</dt><dd${klasse ? ` class="${klasse}"` : ''}>${waarde}</dd>`).join('');

        puntDepot.innerHTML = w.depot === 'geen' ? 'Je hebt ingesteld: <strong>geen vergoeding</strong>.'
            : w.depot === 'lager' ? `Je hebt ingesteld: <strong>${procent(Math.max(0, w.rente - w.afslag))}</strong>, ${toonGetal(w.afslag, 2)} procentpunt onder je hypotheekrente.`
            : `Gerekend met een vergoeding <strong>gelijk aan je hypotheekrente</strong> (${procent(w.rente)}). Dat is bij de meeste aanbieders zo, niet bij alle.`;
        puntSchema.innerHTML = eigenSchema ? `Je eigen schema: <strong>${termijnen} ${termijnen === 1 ? 'termijn' : 'termijnen'}</strong>.`
            : `Gerekend met een <strong>voorbeeld van ${termijnen} termijnen</strong>, verdeeld over ${maanden(t.invoer.bouwduurMaanden)}. Jouw schema staat in je aannemingsovereenkomst.`;
    }

    document.addEventListener('click', (e) => {
        const knop = e.target.closest('[data-nb-aanpas]');
        if (!knop) return;
        const doel = knop.dataset.nbAanpas;
        if (!doel) { zetOpen(!lichaam.classList.contains('nb-open')); return; }
        // Vanuit "Nog te controleren": het formulier open, op de plek waar het om gaat.
        zetOpen(true);
        const vak = el('meer-instellingen');
        vak.open = true;
        vak.scrollIntoView({ block: 'start', behavior: stil ? 'auto' : 'smooth' });
        hoofd.depot.focus({ preventScroll: true });
    });

    /* ------------------------------ de bouwplaats ------------------------------ */

    let bouwplaats = null, bezigMetLaden = false;
    const zetZon = () => bouwplaats?.zetZon(Math.min(1, Math.max(0, (Number(st.schuif.value) - 6) / 24)));

    async function laadBouwplaats() {
        if (bouwplaats || bezigMetLaden || stand === 'klaar') return;
        // Alleen waar hij te zien is en de verbinding het toelaat: op een telefoon
        // staan de vragen er zonder beeld.
        if (!matchMedia('(min-width: 960px)').matches || navigator.connection?.saveData) return;
        bezigMetLaden = true;
        try {
            const proef = document.createElement('canvas');
            if (!(proef.getContext('webgl2') || proef.getContext('webgl'))) return;
            const { maakBouwplaats } = await import('./bouwplaats.js');
            const figuur = wortel.querySelector('.nb-bouw');
            bouwplaats = maakBouwplaats(figuur.querySelector('[data-bouwplaats]'));
            bouwplaats.zetVoortgang(KRAANSTAND[stand] ?? 0.1, true);
            zetZon();
            figuur.classList.add('is-geladen');
        } catch (fout) {
            console.warn('De bouwplaats kon niet geladen worden; de stappen werken zonder.', fout);
        } finally {
            bezigMetLaden = false;
        }
    }

    /* ------------------------------ de schermen ------------------------------ */

    const kop = el('reken-titel');
    kop.tabIndex = -1;

    function toon(naar, { direct = false } = {}) {
        stand = String(naar);
        const wissel = () => {
            lichaam.dataset.nb = stand;
            for (const f of wortel.querySelectorAll('form[data-scherm]')) f.hidden = f.dataset.scherm !== stand;
            // Het schemascherm heeft geen bouwplaats; die blijft staan waar hij stond.
            if (stand in KRAANSTAND) bouwplaats?.zetVoortgang(KRAANSTAND[stand], stil || direct);
        };
        // De focus gaat mee: naar het eerste veld van de stap, of naar de kop.
        const focus = () => {
            const scherm = wortel.querySelector(`form[data-scherm="${stand}"]`);
            (scherm?.querySelector('input:not([type=radio]):not([type=range])') ?? kop).focus({ preventScroll: true });
            scrollTo({ top: 0, behavior: stil ? 'auto' : 'smooth' });
        };
        if (direct) { wissel(); return; }
        if (stand in KRAANSTAND && stand !== 'klaar') laadBouwplaats();
        // Met een overgang wisselt de browser het scherm een beeld later; pas dan
        // staat het veld er om de focus te krijgen.
        if (document.startViewTransition && !stil) {
            const overgang = document.startViewTransition(wissel);
            overgang.updateCallbackDone.then(focus, focus);
            // Breekt de browser de overgang af (tabblad op de achtergrond, of een
            // tweede klik), dan is het scherm toch gewisseld; geen fout om te melden.
            overgang.ready.catch(() => {});
            overgang.finished.catch(() => {});
        } else { wissel(); focus(); }
    }

    for (const formulier of wortel.querySelectorAll('form[data-scherm]:not([data-scherm="schema"])')) {
        formulier.addEventListener('submit', (e) => {
            e.preventDefault();
            const stap = Number(formulier.dataset.scherm);
            const w = leesStappen();
            const fout = controleerStap(stap, w);
            formulier.querySelector('[data-st-fout]').textContent = fout;
            if (fout) return;
            if (stap < STAPPEN.length) { toon(stap + 1); return; }
            // Alle stappen nog eens: wie terugging en iets weghaalde, hoort dat hier.
            const open = eersteOpenStap(w);
            if (open) { toon(open); return; }
            zetVoorbeeld(false);
            schrijfHoofd(w, { eigenInvoer: true });
            toon('klaar');
            bewaar();
        });
    }

    document.addEventListener('click', (e) => {
        const naar = e.target.closest('[data-nb-naar]');
        if (naar) {
            // Vanaf het overzicht: begin met wat er nu staat, behalve bij het voorbeeld.
            if (stand === 'klaar' && !voorbeeld) {
                const w = leesHoofd();
                if (eersteOpenStap(w) === 0) vulStappen(w);
            }
            toon(naar.dataset.nbNaar);
            return;
        }
        if (e.target.closest('[data-nb-overzicht]')) {
            let w = null;
            try { w = leesBewaard(localStorage.getItem(SLEUTEL), Date.now()); } catch { /* geen opslag */ }
            if (!w) { toon(1); return; }
            zetVoorbeeld(false);
            schrijfHoofd(w, { eigenInvoer: true });
            toon('klaar');
            return;
        }
        if (e.target.closest('[data-nb-voorbeeld]')) {
            zetVoorbeeld(true);
            schrijfHoofd(VOORBEELD, { eigenInvoer: false });
            toon('klaar');
        }
    });

    /* ------------------------------ het termijnschema ------------------------------ */

    const schemascherm = maakSchemascherm(wortel.querySelector('form[data-scherm="schema"]'), {
        bouwduur: () => Math.round(leesGetal(hoofd.maanden.value) ?? STANDAARD.maanden),
        terug: () => toon('klaar'),
        klaar: (termijnen) => {
            // Wie een schema invult is met zijn eigen cijfers bezig, ook vanuit het voorbeeld.
            if (termijnen) zetVoorbeeld(false);
            zetSchema(termijnen);
            toon('klaar');
            bewaar();
        },
    });
    knopSchema.addEventListener('click', () => {
        // De overeenkomst rekent met de aanneemsom zonder meerwerk: koopsom min grond.
        const von = leesGetal(hoofd.von.value), grond = leesGetal(hoofd.grond.value);
        if (!schemaNu || von === null || grond === null || grond >= von) { zetOpen(true); return; }
        schemascherm.open({ schema: schemaNu, basis: von - grond, meerwerk: Math.max(0, leesGetal(hoofd.meerwerk.value) ?? 0) });
        toon('schema');
    });

    /* ------------------------------ afgeleide bedragen in de stappen ------------------------------ */

    function werkAfgeleidBij() {
        const w = leesStappen();
        const aanneemsom = w.von !== null && w.grond !== null && w.grond < w.von ? w.von - w.grond : null;
        wortel.querySelector('[data-st-aanneemsom]').textContent = aanneemsom === null ? '–' : euro.format(aanneemsom);
        const lening = w.von !== null && w.eigen !== null && w.meerwerk !== null ? w.von + w.meerwerk - w.eigen : null;
        wortel.querySelector('[data-st-lening]').textContent = lening === null || lening < 0 ? '–' : euro.format(lening);
        // Hoeveel rente er meegefinancierd wordt hangt af van het schema; dat bedrag rekent het overzicht uit.
        wortel.querySelector('[data-st-lening-noot]').textContent = st.mee.checked ? ' plus de rente tijdens de bouw; dat bedrag staat in je overzicht' : '';
    }
    for (const v of [st.von, st.grond, st.meerwerk, st.eigen]) v.addEventListener('input', werkAfgeleidBij);
    st.mee.addEventListener('change', werkAfgeleidBij);

    // De schuif van de bouwduur verzet de zon op de bouwplaats: een korte bouw
    // is een ochtend, een lange loopt tot de avond.
    st.schuif.addEventListener('input', () => { st.maanden.value = st.schuif.value; zetZon(); });
    st.maanden.addEventListener('input', () => {
        const n = leesGetal(st.maanden.value);
        if (n >= 1 && n <= 36) { st.schuif.value = String(n); zetZon(); }
    });

    /* ------------------------------ link kopiëren ------------------------------ */

    const kopieermelding = document.querySelector('[data-nb-kopieermelding]');
    document.querySelector('[data-nb-kopieer]').addEventListener('click', async () => {
        const w = leesHoofd();
        if (eersteOpenStap(w) !== 0) { kopieermelding.textContent = 'Vul eerst de gemarkeerde velden in; dan maken we de link.'; return; }
        const adres = `${location.origin}${location.pathname}?${naarAdres(w)}`;
        const uitleg = 'Je bedragen staan in de link zelf; een eigen termijnschema en het vertragingsscenario niet.';
        try {
            await navigator.clipboard.writeText(adres);
            kopieermelding.textContent = `Link gekopieerd. ${uitleg}`;
        } catch {
            kopieermelding.textContent = `Kopiëren lukte niet. Kopieer deze link zelf: ${adres} ${uitleg}`;
        }
    });

    /* ------------------------------ waar begin je ------------------------------ */

    const uitLink = uitAdres(location.search);
    let bewaard = null;
    try { bewaard = leesBewaard(localStorage.getItem(SLEUTEL), Date.now()); } catch { /* geen opslag */ }

    if (uitLink) {
        schrijfHoofd(uitLink, { eigenInvoer: true });
        vulStappen(uitLink);
        toon('klaar', { direct: true });
        bewaar();
        // De bedragen staan nu in het formulier; het adres mag weer schoon.
        history.replaceState(null, '', location.pathname + location.hash);
    } else if (bewaard) {
        // Ook wie terugkomt begint bij het startscherm, met zijn antwoorden al in
        // de stappen en een link naar het overzicht van de vorige keer.
        vulStappen(bewaard);
        document.querySelector('[data-nb-verder]').hidden = false;
        toon('start', { direct: true });
        (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(laadBouwplaats);
    } else {
        // Niets bruikbaars, ook als er wel iets stond: een link met onzin of
        // invoer van langer dan negentig dagen geleden.
        try { localStorage.removeItem(SLEUTEL); } catch { /* geen opslag */ }
        toon('start', { direct: true });
        (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(laadBouwplaats);
    }
}

// Na de rekentool: die registreert zich eerder op hetzelfde moment, dus het
// formulier van het overzicht staat klaar als de stappen erin gaan schrijven.
document.addEventListener('DOMContentLoaded', start);
