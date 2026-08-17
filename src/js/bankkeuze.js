/**
 * De bankkeuze die door de hele site meeloopt.
 *
 * De geverifieerde voorwaarden per geldverstrekker stonden alleen op de
 * vergelijkingspagina. Dat maakt er naslag van, terwijl het gereedschap is: wie
 * weet bij welke bank zijn hypotheek loopt, hoort dat in elke berekening terug
 * te zien. De maandlastberekening weet dan dat ING geen depotvergoeding kent,
 * en de planner weet hoeveel maanden er zijn.
 *
 * De keuze staat in localStorage en gaat nergens heen. Zonder keuze blijft
 * elke pagina werken zoals hij zonder deze module werkt; niets is verplicht.
 *
 * Gebruik in een pagina:
 *
 *   <div data-bankkeuze></div>              plaatst de keuzebalk
 *   <span data-bank-veld="maximaalVerbouw"></span>   vult zich met de waarde
 *   <span data-bank-naam></span>            de naam, of "uw geldverstrekker"
 *   <div data-bank-toont="geenVergoeding">  alleen zichtbaar bij die banken
 *
 * En in JavaScript:
 *
 *   import { huidigeBank, opBankwissel } from './bankkeuze.js';
 *   opBankwissel((bank) => { ... });   // vuurt ook direct bij het laden
 */

import { BANKEN } from './bankdata.generated.js';

const SLEUTEL = 'bouwdepot-bank-v1';

const lees = () => {
    try { return localStorage.getItem(SLEUTEL) || ''; } catch (_) { return ''; }
};

const schrijf = (id) => {
    try {
        if (id) localStorage.setItem(SLEUTEL, id);
        else localStorage.removeItem(SLEUTEL);
    } catch (_) {}
};

/** De gekozen bank, of null als er niets gekozen is. */
export const huidigeBank = () => BANKEN.find((b) => b.id === lees()) || null;

const luisteraars = new Set();

/** Roept cb aan bij elke wissel, en meteen bij het aanmelden. */
export function opBankwissel(cb) {
    luisteraars.add(cb);
    cb(huidigeBank());
    return () => luisteraars.delete(cb);
}

/**
 * De depotvergoeding in procenten, gegeven de hypotheekrente die de bezoeker
 * heeft ingevuld. Geeft null terug wanneer de aanbieder het niveau niet
 * publiceert; dan hoort de tool het ingevulde percentage te laten staan in
 * plaats van er een te verzinnen.
 */
export function vergoedingsTarief(bank, hypotheekrente, soort = 'verbouw') {
    const tarief = bank?.vergoeding?.tarief?.[soort];
    if (tarief === 'geen') return 0;
    if (tarief === 'gelijk-aan-hypotheekrente') return hypotheekrente;
    if (tarief === 'hypotheekrente-min-1') return Math.max(0, hypotheekrente - 1);
    return null;
}

/* ------------------------------------------------------------------ tekst */

const maanden = (n) => (typeof n === 'number' ? `${n} maanden` : 'niet gepubliceerd');

/**
 * De waarden die een pagina met data-bank-veld kan opvragen. Alles wat de
 * aanbieder niet publiceert komt hier als "niet gepubliceerd" uit, nooit als
 * een aanname.
 */
function velden(bank) {
    if (!bank) return {};
    const v = bank.vergoeding;
    return {
        naam: bank.naam,
        looptijdVerbouw: maanden(bank.looptijd.verbouw),
        looptijdNieuwbouw: maanden(bank.looptijd.nieuwbouw),
        maximaalVerbouw: bank.verlenging.duurOnbekend
            ? `${bank.looptijd.verbouw} maanden, verlenging mogelijk`
            : maanden(bank.maximaal.verbouw),
        maximaalNieuwbouw: bank.verlenging.duurOnbekend
            ? `${bank.looptijd.nieuwbouw} maanden, verlenging mogelijk`
            : maanden(bank.maximaal.nieuwbouw),
        vergoeding: v.samenvatting || 'niet gepubliceerd',
        vergoedingDetail: v.detail || '',
        vergoedingVerbouw: v.model === 'rente-alleen-over-opgenomen' ? 'niet van toepassing' : maanden(v.maanden.verbouw),
        vergoedingNieuwbouw: v.model === 'rente-alleen-over-opgenomen' ? 'niet van toepassing' : maanden(v.maanden.nieuwbouw),
        opnamemethode: bank.opnamemethode === 'zelf-betalen'
            ? 'U betaalt zelf vanuit het depot'
            : bank.opnamemethode === 'declaratie' ? 'U declareert met een factuur' : 'niet gepubliceerd',
        uitbetaling: bank.uitbetaling || 'niet gepubliceerd',
        voorschieten: bank.voorschieten || 'niet gepubliceerd',
        restant: bank.restant || 'niet gepubliceerd',
    };
}

/**
 * Eigenschappen waar een pagina een blok aan kan ophangen. Bewust afgeleid uit
 * het model in de data en niet uit de prozatekst, zodat een herformulering van
 * een detailtekst niet stilletjes een blok laat verdwijnen.
 */
function heeft(bank, eigenschap) {
    if (!bank) return false;
    switch (eigenschap) {
        case 'gekozen': return true;
        case 'geenVergoeding': return bank.vergoeding.model === 'rente-alleen-over-opgenomen';
        case 'welVergoeding': return bank.vergoeding.model === 'beperkt-in-duur';
        case 'vergoedingStoptEerder': {
            const m = bank.vergoeding.maanden.verbouw;
            const max = bank.maximaal.verbouw ?? bank.looptijd.verbouw;
            return bank.vergoeding.model === 'beperkt-in-duur' && typeof m === 'number' && typeof max === 'number' && m < max;
        }
        case 'zelfBetalen': return bank.opnamemethode === 'zelf-betalen';
        case 'declaratie': return bank.opnamemethode === 'declaratie';
        default: return false;
    }
}

/* ------------------------------------------------------------- toepassen */

function pasToe(bank) {
    for (const el of document.querySelectorAll('[data-bank-veld]')) {
        const waarde = velden(bank)[el.dataset.bankVeld];
        el.textContent = bank ? (waarde ?? '—') : '—';
        el.classList.toggle('bank-veld--leeg', !bank);
    }

    for (const el of document.querySelectorAll('[data-bank-naam]')) {
        el.textContent = bank ? bank.naam : 'uw geldverstrekker';
    }

    for (const el of document.querySelectorAll('[data-bank-toont]')) {
        el.hidden = !heeft(bank, el.dataset.bankToont);
    }

    for (const el of document.querySelectorAll('[data-bank-link]')) {
        el.hidden = !bank;
        if (bank) el.href = bank.pagina;
    }

    for (const kiezer of document.querySelectorAll('.bankkeuze__kiezer')) {
        kiezer.value = bank ? bank.id : '';
    }

    for (const cb of luisteraars) {
        try { cb(bank); } catch (fout) { console.error('bankwissel', fout); }
    }
}

/* -------------------------------------------------------------- keuzebalk */

const houders = document.querySelectorAll('[data-bankkeuze]');

houders.forEach((houder, i) => {
    const id = `bankkeuze-${i}`;
    houder.classList.add('bankkeuze');
    houder.innerHTML = `
        <label class="bankkeuze__label" for="${id}">Bij welke geldverstrekker loopt uw hypotheek?</label>
        <select class="ds-invoer bankkeuze__kiezer" id="${id}">
            <option value="">Nog niet bekend of een andere aanbieder</option>
            ${BANKEN.map((b) => `<option value="${b.id}">${b.naam}</option>`).join('')}
        </select>
        <p class="ds-caption bankkeuze__uitleg">
            Uw keuze blijft op dit apparaat en vult de voorwaarden van die aanbieder in op deze site.
            <a class="bankkeuze__meer" data-bank-link href="#" hidden>Alle voorwaarden van <span data-bank-naam></span></a>
        </p>`;
    houder.querySelector('select').addEventListener('change', (e) => {
        schrijf(e.target.value);
        pasToe(huidigeBank());
    });
});

// Ook zonder keuzebalk mag een pagina data-bank-velden gebruiken; die vullen
// zich dan met de keuze die elders op de site gemaakt is.
pasToe(huidigeBank());
