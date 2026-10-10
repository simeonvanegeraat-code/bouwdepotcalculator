/**
 * De kleine rekensom voor verbouwen op de homepage: wat kost een bouwdepot per
 * maand extra, en hoe verdeelt dat zich over dertig jaar in rente en aflossing.
 *
 * Zonder dit script staat de som stil in de HTML, met het voorbeeld van
 * € 20.000 tegen 3,80%. Het script laat de bezoeker het bedrag en de rente
 * veranderen en rekent dan opnieuw.
 *
 * Hier staat geen rekenregel: het betaalschema komt uit
 * src/domain/hypotheek.js, hetzelfde schema waar bouwdepot-berekenen.html mee
 * rekent. tests/homepage-verbouw.test.mjs bewaakt dat de stilstaande bedragen
 * in index.html daarmee kloppen.
 */

import { leningschema } from '../domain/hypotheek.js';
import { leesGetal, leesPercentage, toonGetal } from '../js/getallen.js';
import { euro } from './voorbeeld.js';

/** De aannames van het voorbeeld; alleen bedrag en rente zijn aan te passen. */
export const VERBOUWVOORBEELD = Object.freeze({ bedrag: 20000, rentePercent: 3.8, looptijdJaren: 30 });

/** Alles wat de som toont, als getallen. Annuïtair, vaste rente. */
export function verbouwsom(invoer = {}) {
    const a = { ...VERBOUWVOORBEELD, ...invoer };
    const maanden = a.looptijdJaren * 12;
    const schema = leningschema({ hoofdsom: a.bedrag, maandrente: a.rentePercent / 100 / 12, looptijdMaanden: maanden, vorm: 'annuiteit' }, maanden);
    const som = (lijst, veld) => lijst.reduce((s, r) => s + r[veld], 0);

    // Per jaar: welk deel van wat je betaalt is rente.
    const jaren = Array.from({ length: a.looptijdJaren }, (_, i) => {
        const deel = schema.slice(i * 12, i * 12 + 12);
        const rente = som(deel, 'rente'), betaald = som(deel, 'betaling');
        return { jaar: i + 1, rente, aflossing: betaald - rente, renteDeel: betaald > 0 ? rente / betaald : 0 };
    });

    const maand = Math.round(schema[0].betaling);
    // Het rentedeel is de harde grootheid; de aflossing is wat er van de
    // afgeronde termijn overblijft, zodat de twee samen het bedrag zijn.
    const rente = Math.round(schema[0].rente);
    const renteLaat = Math.round(jaren.at(-1).rente / 12);
    const totaalRente = Math.round(som(schema, 'rente'));
    return {
        invoer: a,
        jaren,
        maandExact: schema[0].betaling,
        maand,
        rente,
        aflossing: Math.max(0, maand - rente),
        renteLaat,
        aflossingLaat: Math.max(0, maand - renteLaat),
        totaalRente,
        totaal: Math.round(a.bedrag) + totaalRente,
    };
}

const wortel = typeof document !== 'undefined' ? document.querySelector('[data-verbouw]') : null;
if (wortel) {
    const veldBedrag = wortel.querySelector('[data-vb-in="bedrag"]');
    const veldRente = wortel.querySelector('[data-vb-in="rente"]');
    const fout = wortel.querySelector('[data-vb-fout]');
    const staven = [...wortel.querySelectorAll('[data-vb-staaf]')];
    const zet = (naam, tekst) => { for (const e of wortel.querySelectorAll(`[data-vb="${naam}"]`)) e.textContent = tekst; };
    const lijst = wortel.querySelector('.hp-vb__staven');
    const jaarregel = wortel.querySelector('[data-vb-jaar]');
    let som = verbouwsom();

    function reken() {
        const bedrag = leesGetal(veldBedrag.value);
        const rentePct = leesPercentage(veldRente.value);
        const bedragFout = bedrag === null ? 'Vul een bedrag in, bijvoorbeeld 20.000.'
            : bedrag < 1000 ? 'Vul een bedrag van minstens € 1.000 in.'
            : bedrag > 1000000 ? 'Boven één miljoen euro: gebruik de volledige rekentool.'
            : '';
        const renteFout = rentePct === null ? 'Vul een rente in, bijvoorbeeld 3,8.'
            : rentePct < 0 || rentePct > 20 ? 'Vul een rente tussen 0 en 20 procent in.'
            : '';
        fout.textContent = bedragFout || renteFout;
        veldBedrag.setAttribute('aria-invalid', String(Boolean(bedragFout)));
        veldRente.setAttribute('aria-invalid', String(!bedragFout && Boolean(renteFout)));
        wortel.classList.toggle('is-ongeldig', Boolean(bedragFout || renteFout));
        if (bedragFout || renteFout) return;

        const s = verbouwsom({ bedrag, rentePercent: rentePct });
        som = s;
        zet('bedrag', euro.format(bedrag));
        zet('rentepct', `${toonGetal(rentePct, 2)}%`);
        for (const naam of ['maand', 'rente', 'aflossing', 'renteLaat', 'aflossingLaat', 'totaalRente', 'totaal']) zet(naam, euro.format(s[naam]));

        // De staven: per jaar welk deel van de maandlast rente is.
        staven.forEach((staaf, i) => {
            const j = s.jaren[i];
            staaf.style.setProperty('--rente', (j.renteDeel * 100).toFixed(1));
            staaf.title = `Jaar ${j.jaar}: ${euro.format(j.rente / 12)} rente en ${euro.format(j.aflossing / 12)} aflossing per maand`;
        });
        for (const link of wortel.querySelectorAll('[data-vb-link]')) link.href = `bouwdepot-berekenen.html?bedrag=${Math.round(bedrag)}`;
    }

    for (const veld of [veldBedrag, veldRente]) veld.addEventListener('input', reken);
    for (const knop of wortel.querySelectorAll('[data-vb-kies]')) {
        knop.addEventListener('click', () => { veldBedrag.value = toonGetal(Number(knop.dataset.vbKies)); reken(); });
    }
    wortel.querySelector('form')?.addEventListener('submit', (e) => { e.preventDefault(); reken(); });

    /* --- Een jaar aanwijzen: de staaf licht op, de bedragen staan eronder --- */

    let loop = 0;
    function wijsAan(index) {
        staven.forEach((staaf, i) => staaf.classList.toggle('is-licht', i === index));
        lijst.classList.toggle('is-aangewezen', index !== null);
        jaarregel.classList.toggle('is-jaar', index !== null);
        if (index === null) { jaarregel.textContent = 'jaar'; return; }
        // Per maand in dat jaar; de aflossing is wat er van de termijn overblijft.
        const rente = Math.round(som.jaren[index].rente / 12);
        jaarregel.textContent = `jaar ${index + 1}: ${euro.format(rente)} rente, ${euro.format(Math.max(0, som.maand - rente))} aflossing`;
    }
    const stopLoop = () => { clearInterval(loop); loop = 0; };

    /** Loopt een keer van jaar 1 naar jaar 30. */
    function loopLangs() {
        stopLoop();
        let i = 0;
        wijsAan(0);
        loop = setInterval(() => {
            i += 1;
            if (i >= staven.length) { stopLoop(); wijsAan(null); return; }
            wijsAan(i);
        }, 120);
    }

    // Met de muis of een vinger neemt de bezoeker het over.
    staven.forEach((staaf, i) => {
        const li = staaf.parentElement;
        li.addEventListener('pointerenter', () => { stopLoop(); wijsAan(i); });
        li.addEventListener('click', () => { stopLoop(); wijsAan(i); });
    });
    lijst.addEventListener('pointerleave', () => { if (!loop) wijsAan(null); });

    // De staven komen op als het blok in beeld is, en daarna lichten ze een
    // voor een op. Dat herhaalt zich elke keer dat het blok opnieuw in beeld
    // komt; wie een staaf aanwijst, of iets invult, onderbreekt het.
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        wortel.classList.add('is-wachtend');
        let wacht = 0;
        new IntersectionObserver(([item]) => {
            clearTimeout(wacht);
            if (!item.isIntersecting) { stopLoop(); wijsAan(null); return; }
            const eerste = wortel.classList.contains('is-wachtend');
            wortel.classList.remove('is-wachtend');
            wacht = setTimeout(loopLangs, eerste ? 1000 : 300);
        }, { threshold: 0.6 }).observe(lijst);
        for (const veld of [veldBedrag, veldRente]) veld.addEventListener('input', () => { stopLoop(); wijsAan(null); });
    }
}
