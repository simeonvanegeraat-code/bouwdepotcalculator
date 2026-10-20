/**
 * De schermcode van bouwdepot-voorwaarden-vergelijken.html.
 *
 * De generator (scripts/build-voorwaarden.mjs) zet de hele vergelijking in de
 * HTML: de balken voor verbouwing en per aanbieder alle voorwaarden, open. Dit
 * script voegt toe wat alleen met JavaScript kan:
 *
 *   - de uitklap dicht en een knop om hem te openen (een #anker opent die rij);
 *   - wisselen naar nieuwbouw, waarbij de balken meeschuiven;
 *   - filters op manier van opnemen en kassabon;
 *   - je eigen bouwduur als lijn door alle balken, met per rij of het past;
 *   - in de uitklap het renteverlies bij die aanbieder voor jouw bedrag.
 *
 * Geen rangorde: de volgorde blijft op naam, met je eigen bank (bankkeuze.js)
 * bovenaan. Bedrag, rente en bouwduur blijven in het geheugen van deze pagina
 * en worden nergens opgeslagen of verstuurd.
 */

import { BANKEN } from '../js/bankdata.generated.js';
import { opBankwissel } from '../js/bankkeuze.js';
import { PAST, past, looptijd, renteverliesBijAanbieder } from '../domain/voorwaarden.js';
import { balk, procent, SCHAAL } from '../js/voorwaarden-balk.js';

const $ = (id) => document.getElementById(id);
const EURO = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 });
const euro = (n) => EURO.format(Math.round(n));
const getal = (s) => Number(String(s).trim().replace(/\s|€|%/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));

const tabel = document.querySelector('.ul-tl');
const tbody = tabel?.querySelector('tbody');
const BANK = Object.fromEntries(BANKEN.map((b) => [b.id, b]));

const st = { soort: 'verbouw', bouw: null, opname: '', kassabon: false, depot: 50000, rente: 3.8 };
let schaal = SCHAAL;

/* ------------------------------------------------------------ rijen */

const rijen = [...document.querySelectorAll('tr.ul-tl__rij')].map((tr) => {
    const bank = BANK[tr.dataset.bank];
    const detail = document.getElementById(`detail-${tr.dataset.bank}`);
    return { bank, tr, detail, q: (s) => tr.querySelector(s) };
}).filter((r) => r.bank && r.detail);

const kassabon = (bank) => /kassabon/i.test(bank.eisen.find((e) => e.eis === 'soort-bewijs')?.waarde || '');

function zetLabel(lab, l, maanden) {
    lab.dataset.lang = l.lang;
    lab.dataset.midden = l.midden;
    lab.dataset.kort = l.kort;
    lab.dataset.maanden = maanden;
}

function werkRijBij({ bank, tr, q }) {
    const g = balk(bank, st.soort);
    const met = q('.ul-tl__seg--met'), zonder = q('.ul-tl__seg--zonder');
    met.style.width = procent(g.met, schaal);
    zonder.style.left = procent(g.met, schaal);
    zonder.style.width = procent(g.rest, schaal);
    zonder.classList.toggle('ul-tl__seg--onbekend', g.onbekend);
    zetLabel(met.firstElementChild, g.labels.met, g.met);
    zetLabel(zonder.firstElementChild, g.labels.rest, g.rest);

    const open = q('.ul-tl__seg--open');
    open.hidden = !g.open;
    open.style.left = procent(g.eind, schaal);
    const tick = q('.ul-tl__tick');
    tick.hidden = g.tick == null;
    if (g.tick != null) tick.style.left = procent(g.tick, schaal);
    const totaal = q('.ul-tl__totaal');
    totaal.textContent = g.totaal;
    totaal.style.left = g.open ? `calc(${procent(g.eind, schaal)} + 2.5rem)` : procent(g.eind, schaal);

    const lijn = q('.ul-tl__lijn'), chip = q('.ul-tl__past');
    let zin = g.zin;
    if (st.bouw) {
        const p = past(bank, st.soort, st.bouw);
        const tekst = p === 'past-niet' ? `Past niet: het depot sluit na ${looptijd(bank, st.soort).max} mnd` : PAST[p];
        lijn.hidden = false;
        lijn.style.left = procent(st.bouw, schaal);
        chip.hidden = false;
        chip.className = `ul-tl__past ul-tl__past--${p}`;
        chip.textContent = tekst;
        tr.classList.toggle('is-past-niet', p === 'past-niet');
        zin += ` Bij ${st.bouw} maanden bouwen: ${tekst.toLowerCase()}.`;
    } else {
        lijn.hidden = true;
        chip.hidden = true;
        tr.classList.remove('is-past-niet');
    }
    q('.ul-tl__looptijd').textContent = g.onderschrift;
    q('.ul-tl__zin').textContent = zin;
}

/** Kies per label de lange, middelste of korte tekst, naar de breedte die het stuk krijgt. */
const meetlat = document.createElement('canvas').getContext('2d');
function passend() {
    if (!meetlat) return;
    meetlat.font = '11px "IBM Plex Mono", monospace';
    for (const { q } of rijen) {
        const spoor = q('.ul-tl__spoor');
        const perMaand = spoor.clientWidth / schaal;
        for (const lab of spoor.querySelectorAll('.ul-tl__lab')) {
            // De eindbreedte uitrekenen, niet meten: de balk kan nog bewegen.
            const ruimte = Number(lab.dataset.maanden) * perMaand - 16;
            const past = (t) => meetlat.measureText(t).width <= ruimte;
            lab.textContent = [lab.dataset.lang, lab.dataset.midden, lab.dataset.kort].find(past) || '';
        }
    }
}

/* ------------------------------------------------------------ uitklap */

function zetOpen({ tr, detail }, open) {
    const knop = tr.querySelector('.ul-tl__open');
    knop.setAttribute('aria-expanded', String(open));
    knop.firstElementChild.textContent = open ? '−' : '+';
    detail.hidden = !open || tr.hidden;
    detail.classList.toggle('is-open', open);
}

function rekenBlok(bank) {
    return `<p class="ul-tl__reken-kop">Wat kost stilstaand geld bij ${bank.naam}?</p>
        <div class="ul-tl__reken-in">
            <div class="wr-veld"><label for="d-${bank.id}">Bedrag in depot</label><div class="wr-veld__in"><span aria-hidden="true">&euro;</span><input type="text" class="tl-depot" id="d-${bank.id}" inputmode="numeric" autocomplete="off" value="${st.depot}"></div></div>
            <div class="wr-veld"><label for="r-${bank.id}">Hypotheekrente</label><div class="wr-veld__in"><input type="text" class="tl-rente" id="r-${bank.id}" inputmode="decimal" autocomplete="off" value="${PCT.format(st.rente)}"><span aria-hidden="true">%</span></div></div>
        </div>
        <p class="ul-tl__reken-uit" aria-live="polite"></p>`;
}

function rekenUitkomst(bank) {
    if (!st.bouw) return 'Vul bovenaan in hoe lang je bouw duurt, dan rekenen we het hier uit.';
    if (!(st.depot >= 1000 && st.depot <= 2000000) || !(st.rente >= 0 && st.rente <= 15)) {
        return 'Vul een bedrag tussen € 1.000 en € 2.000.000 en een rente tussen 0 en 15% in.';
    }
    const r = renteverliesBijAanbieder(bank, { soort: st.soort, depot: st.depot, rentePercent: st.rente, maanden: st.bouw });
    const kop = `Bij ${euro(st.depot)}, ${PCT.format(st.rente)}% en ${st.bouw} maanden bouwen`;
    if (r.status === 'past-niet') return `${kop}: niet uit te rekenen. ${r.reden}; wat er dan nog in staat, gaat meestal van je lening af.`;
    if (r.reden) return `${kop}: niet uit te rekenen. ${r.reden}; vraag die na in je offerte.`;
    const bedrag = Math.round(r.van) === Math.round(r.tot)
        ? `<strong>${euro(r.tot)}</strong>`
        : `tussen <strong>${euro(r.van)}</strong> en <strong>${euro(r.tot)}</strong>, afhankelijk van of de vergoeding in de verlenging doorloopt`;
    return `${kop} is je renteverlies ${bedrag}: de rente over geld dat nog in je depot staat, min de vergoeding die je erover krijgt. We gaan uit van gelijkmatige opnames en een vaste rente. <a href="renteverlies-bouwdepot.html">Per maand bekijken</a>.`;
}

function werkRekenBij() {
    for (const { bank, detail } of rijen) {
        const uit = detail.querySelector('.ul-tl__reken-uit');
        if (uit) uit.innerHTML = rekenUitkomst(bank);
    }
}

/* ------------------------------------------------------------ teken */

function teken() {
    schaal = Math.max(SCHAAL, Math.ceil((st.bouw || 0) / 6) * 6);
    document.documentElement.style.setProperty('--tl-stap', procent(6, schaal));

    for (const el of document.querySelectorAll('[data-soort]')) el.hidden = el.dataset.soort !== st.soort;

    const as = Array.from({ length: Math.floor(schaal / 6) + 1 }, (_, i) => i * 6)
        .map((m) => `<span style="left:${procent(m, schaal)}">${m}</span>`).join('') +
        (st.bouw ? `<span class="ul-tl__as-bouw" style="left:${procent(st.bouw, schaal)}">jouw bouw · ${st.bouw} mnd</span>` : '');
    for (const el of document.querySelectorAll('.ul-tl__as')) el.innerHTML = as;

    let zichtbaar = 0;
    const telling = { past: 0, verlengen: 0, 'verlengen-onbekend': 0, 'past-niet': 0 };
    for (const r of rijen) {
        const ok = (!st.opname || r.bank.opnamemethode === st.opname) && (!st.kassabon || kassabon(r.bank));
        r.tr.hidden = !ok;
        r.detail.hidden = !ok || !r.detail.classList.contains('is-open');
        werkRijBij(r);
        if (!ok) continue;
        zichtbaar++;
        if (st.bouw) telling[past(r.bank, st.soort, st.bouw)]++;
    }
    werkRekenBij();
    requestAnimationFrame(passend);

    const gefilterd = st.opname || st.kassabon;
    const wat = gefilterd ? `${zichtbaar} van ${rijen.length} aanbieders` : `${rijen.length} aanbieders`;
    $('tl-telling').textContent = st.bouw
        ? `${wat}. Bij ${st.bouw} maanden bouwen past het bij ${telling.past} zonder verlenging, bij ${telling.verlengen + telling['verlengen-onbekend']} alleen met verlenging en bij ${telling['past-niet']} niet.`
        : `${wat}, ${st.soort === 'verbouw' ? 'verbouwing' : 'nieuwbouw'}.`;
    $('tl-wis').hidden = !(gefilterd || st.bouw);
}

/* ------------------------------------------------------------ invoer */

function leesBouw() {
    const veld = $('tl-bouw'), fout = $('fout-tl-bouw');
    const ruw = veld.value.trim();
    if (!ruw) { st.bouw = null; fout.textContent = ''; veld.removeAttribute('aria-invalid'); return; }
    const n = getal(ruw);
    const goed = Number.isInteger(n) && n >= 1 && n <= 48;
    veld.setAttribute('aria-invalid', String(!goed));
    fout.textContent = goed ? '' : 'Vul een hele maand in, van 1 tot 48.';
    if (goed) { st.bouw = n; $('tl-schuif').value = n; }
}

function start() {
    const bediening = $('bediening');
    bediening.hidden = false;

    for (const r of rijen) {
        r.tr.querySelector('.ul-tl__open').hidden = false;
        r.detail.querySelector('[data-reken]').innerHTML = rekenBlok(r.bank);
        zetOpen(r, false);
    }
    tabel.classList.add('is-actief');

    bediening.addEventListener('input', (e) => {
        if (e.target.id === 'tl-schuif') $('tl-bouw').value = e.target.value;
        if (e.target.name === 'soort') st.soort = e.target.value;
        st.opname = $('tl-opname').value;
        st.kassabon = $('tl-kassabon').checked;
        leesBouw();
        teken();
    });

    $('tl-wis').addEventListener('click', () => {
        $('tl-bouw').value = ''; $('tl-opname').value = ''; $('tl-kassabon').checked = false;
        st.opname = ''; st.kassabon = false;
        leesBouw();
        teken();
    });

    tbody.addEventListener('click', (e) => {
        const knop = e.target.closest('.ul-tl__open');
        if (!knop) return;
        const r = rijen.find((x) => x.tr.contains(knop));
        zetOpen(r, knop.getAttribute('aria-expanded') !== 'true');
    });

    // Bedrag en rente in de uitklap gelden voor alle aanbieders tegelijk.
    tbody.addEventListener('input', (e) => {
        const t = e.target;
        if (!t.matches('.tl-depot, .tl-rente')) return;
        const klasse = t.matches('.tl-depot') ? '.tl-depot' : '.tl-rente';
        if (klasse === '.tl-depot') st.depot = getal(t.value); else st.rente = getal(t.value);
        for (const ander of tbody.querySelectorAll(klasse)) if (ander !== t) ander.value = t.value;
        werkRekenBij();
    });

    // Een link als #rabobank opent die aanbieder.
    const openAnker = () => {
        const r = rijen.find((x) => `#${x.bank.id}` === location.hash);
        if (r) zetOpen(r, true);
    };
    addEventListener('hashchange', openAnker);
    openAnker();

    // Je eigen geldverstrekker staat bovenaan, met een markering.
    opBankwissel((gekozen) => {
        const volgorde = [...rijen].sort((x, y) => x.bank.naam.localeCompare(y.bank.naam, 'nl'));
        if (gekozen) volgorde.sort((x, y) => (y.bank.id === gekozen.id) - (x.bank.id === gekozen.id));
        for (const r of volgorde) {
            r.tr.classList.toggle('is-mijn', r.bank.id === gekozen?.id);
            tbody.append(r.tr, r.detail);
        }
    });

    let wacht;
    addEventListener('resize', () => { clearTimeout(wacht); wacht = setTimeout(passend, 100); });
    teken();
}

if (tabel && tbody && rijen.length) start();
