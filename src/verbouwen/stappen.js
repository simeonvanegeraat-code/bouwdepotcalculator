/**
 * Stap voor stap invullen op verbouwbegroting.html: start, wat ga je doen, de
 * bedragen per onderdeel, reserve, financiering, rente, overzicht.
 *
 * Een laag over de rekentool, geen tweede rekentool. Elk scherm schrijft naar
 * de velden van de begroting en de leenruimte; rekenen, opslaan en de
 * specificatie doet src/verbouwen/pagina.js zoals altijd. Wat hier wel gebeurt:
 * bepalen welk scherm er staat, alleen vragen wat de bezoeker gaat doen, en op
 * het overzicht samenvatten wat er is ingevuld en wat nog een aanname is.
 *
 * De schermen komen uit scripts/verbouw-stappen.mjs, de regels staan zonder DOM
 * in stappenlogica.js, het wisselen is gedeeld met de nieuwbouwroute.
 */

import { euro, koppelBedragveld, koppelPercentageveld, leesGetal, leesPercentage, toonGetal } from '../js/getallen.js';
import { maakSchermwissel } from '../js/schermwissel.js';
import { opBankwissel } from '../js/bankkeuze.js';
import {
    controleerGeld, controleerPosten, controleerRente, controleerReserve, schermvolgorde, volgende, voortgang, vorige,
} from './stappenlogica.js';

function start() {
    const lichaam = document.body;
    const wortel = document.querySelector('[data-stappen]');
    if (!wortel || !lichaam.dataset.nb) return;
    const el = (id) => document.getElementById(id);
    const q = (s) => document.querySelector(s);

    // De velden van de rekentool; de stappen schrijven hierheen.
    const hoofd = {
        post: (id) => el(`post-${id}`), reserve: el('in-onvoorzien'), hypotheek: el('lr-hypotheek'), waarde: el('lr-waarde'),
        eigen: el('lr-eigen-geld'), rente: el('input-interest'), totaal: el('lr-totaal'),
    };
    const st = { reserve: el('vb-reserve'), hypotheek: el('vb-hypotheek'), waarde: el('vb-waarde'), eigen: el('vb-eigen'), rente: el('vb-rente') };
    for (const v of [st.hypotheek, st.waarde, st.eigen]) koppelBedragveld(v);
    koppelPercentageveld(st.rente);
    const meld = (veld, soort = 'input') => veld.dispatchEvent(new Event(soort, { bubbles: true }));

    const schermen = [...wortel.querySelectorAll('form[data-scherm^="cat-"]')];
    const categorieen = schermen.map((f) => f.dataset.scherm.slice(4));
    const tegel = (cat) => wortel.querySelector(`[data-vb-cat="${cat}"]`);
    const gekozen = () => categorieen.filter((c) => tegel(c).checked);
    const volgorde = () => schermvolgorde(categorieen, gekozen());

    /* ------------------------------ het huis en de voortgang ------------------------------ */

    const balk = wortel.querySelector('[data-vb-voortgang]');
    function werkHuisBij() {
        for (const zone of wortel.querySelectorAll('[data-zone]')) zone.classList.toggle('is-aan', tegel(zone.dataset.zone)?.checked ?? false);
    }

    let stand = lichaam.dataset.nb;
    const { toon, stil } = maakSchermwissel({
        wortel,
        kop: el('reken-titel'),
        opStand: (s) => { stand = s; },
        inWissel: (s) => {
            balk.style.width = `${voortgang(volgorde(), s) * 100}%`;
            // Bij de bedragen van één onderdeel treedt de rest van het huis terug.
            const nu = s.startsWith('cat-') ? s.slice(4) : '';
            wortel.querySelector('.vb-huis').classList.toggle('heeft-nu', nu !== '');
            for (const zone of wortel.querySelectorAll('[data-zone]')) zone.classList.toggle('is-nu', zone.dataset.zone === nu);
        },
    });

    /* ------------------------------ wat ga je doen, en wat kost het ------------------------------ */

    const rijenVan = (formulier) => [...formulier.querySelectorAll('[data-vb-post]')].map((rij) => ({
        id: rij.dataset.vbPost, rij, kies: rij.querySelector('[data-vb-kies]'), bedrag: rij.querySelector('[data-vb-bedrag]'),
        vak: rij.querySelector('.vb-post__bedrag'), naam: rij.querySelector('.vb-post__kies span').textContent,
    }));

    for (const formulier of schermen) {
        for (const r of rijenVan(formulier)) {
            koppelBedragveld(r.bedrag);
            r.kies.addEventListener('change', () => {
                r.vak.hidden = !r.kies.checked;
                r.rij.classList.toggle('is-gekozen', r.kies.checked);
                if (r.kies.checked) r.bedrag.focus();
            });
        }
    }
    for (const c of categorieen) tegel(c).addEventListener('change', werkHuisBij);

    /** Zet in de stappen wat er al in de rekentool staat: eerder ingevuld, of zojuist op het overzicht. */
    function vulStappen() {
        for (const formulier of schermen) {
            let iets = false;
            for (const r of rijenVan(formulier)) {
                const n = leesGetal(hoofd.post(r.id).value);
                const heeft = n !== null && n > 0;
                r.kies.checked = heeft;
                r.vak.hidden = !heeft;
                r.rij.classList.toggle('is-gekozen', heeft);
                r.bedrag.value = heeft ? toonGetal(n) : '';
                iets ||= heeft;
            }
            tegel(formulier.dataset.scherm.slice(4)).checked = iets;
        }
        st.reserve.value = hoofd.reserve.value;
        werkHuisBij();
    }

    const heeftPosten = () => categorieen.some((c) => rijenVan(wortel.querySelector(`[data-scherm="cat-${c}"]`)).some((r) => (leesGetal(hoofd.post(r.id).value) ?? 0) > 0))
        || document.querySelectorAll('#eigen-posten .wr-post').length > 0;

    /* ------------------------------ wat de rekentool terugmeldt ------------------------------ */

    let laatste = null;
    const samen = q('[data-vb-samen]'), lijst = q('[data-vb-lijst]'), lijstAantal = q('[data-vb-lijst-aantal]');
    const waardepunt = q('[data-vb-waardepunt]'), bankpunt = q('[data-vb-bankpunt]');
    const voorbeeldmelding = q('[data-vb-voorbeeldmelding]');
    const veilig = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    let bank = null;

    function werkOverzichtBij() {
        if (!laatste) return;
        const { begroting: b, posten, check, margePct } = laatste;
        // De som op het scherm van de reserve.
        wortel.querySelector('[data-vb-totaal]').textContent = b.aantal ? euro.format(b.totaal) : '–';
        wortel.querySelector('[data-vb-totaal-noot]').textContent = b.margeBedrag > 0 ? `, waarvan ${euro.format(b.margeBedrag)} reserve` : '';

        const bedrag = (veld) => { const n = leesGetal(veld.value); return n === null ? '–' : euro.format(n); };
        const rijen = [
            ['Je verbouwing', b.aantal ? euro.format(b.totaal) : bedrag(hoofd.totaal), 'is-som'],
            ...(b.aantal ? [['waarvan uit het bouwdepot', euro.format(b.depotMetMarge)], ['waarvan uit eigen geld', euro.format(b.eigen)], ['Reserve voor onvoorzien', `${margePct}%`]] : []),
            ['Huidige hypotheek', bedrag(hoofd.hypotheek)],
            ['Woningwaarde na verbouwing', bedrag(hoofd.waarde)],
            ['Eigen geld', bedrag(hoofd.eigen)],
            ['Hypotheekrente', `${hoofd.rente.value.trim() || '–'}%`],
        ];
        samen.innerHTML = rijen.map(([naam, waarde, klasse]) => `<dt${klasse ? ` class="${klasse}"` : ''}>${naam}</dt><dd${klasse ? ` class="${klasse}"` : ''}>${waarde}</dd>`).join('');

        lijstAantal.textContent = posten.length === 1 ? '1 post' : `${posten.length} posten`;
        lijst.innerHTML = posten.length
            ? posten.map((p) => `<dt>${veilig(p.naam)} <span class="wr-merkje ${p.vast ? 'wr-merkje--depot">uit depot' : 'wr-merkje--eigen">eigen geld'}</span></dt><dd>${euro.format(p.bedrag)}</dd>`).join('')
            : '<dt>Nog geen posten ingevuld.</dt><dd></dd>';

        const waarde = leesGetal(hoofd.waarde.value);
        waardepunt.innerHTML = waarde === null ? 'Vul in wat je woning na de verbouwing waard is.'
            : `Je rekent met <strong>${euro.format(waarde)}</strong>. Alleen een taxatie zegt wat je woning na de verbouwing waard is; niet elke euro verbouwing wordt een euro waarde.`;
        bankpunt.innerHTML = bank
            ? `Gekozen: <strong>${veilig(bank.naam)}</strong>. De posten die deze aanbieder bij naam noemt staan gemarkeerd in je postenlijst; voor de rest geldt de vuistregel.`
            : 'De verdeling tussen depot en eigen geld volgt de vuistregel: wat vast aan de woning zit mag meestal, losse spullen niet. Kies je geldverstrekker om te zien welke posten die bij naam noemt.';

        // Het voorbeeld van de leenruimte mag er niet uitzien als eigen cijfers.
        voorbeeldmelding.hidden = el('lr-stempel').textContent !== 'Voorbeeld' || !check;
    }
    document.addEventListener('verbouwen:berekend', (e) => { laatste = e.detail; werkOverzichtBij(); });
    opBankwissel((b) => { bank = b; q('[data-vb-aanpas="bank"]').textContent = b ? 'Andere geldverstrekker kiezen' : 'Kies je geldverstrekker'; werkOverzichtBij(); });

    /* ------------------------------ de schermen ------------------------------ */

    const fout = (formulier, tekst) => { formulier.querySelector('[data-st-fout]').textContent = tekst; return tekst !== ''; };
    const ofNul = (veld) => (veld.value.trim() === '' ? 0 : leesGetal(veld.value));

    wortel.addEventListener('submit', (e) => {
        e.preventDefault();
        const formulier = e.target;
        const scherm = formulier.dataset.scherm;

        if (scherm === 'wat') {
            if (fout(formulier, gekozen().length ? '' : 'Vink minstens één onderdeel aan.')) return;
            // Wat niet meer is aangevinkt, doet niet meer mee in de begroting.
            for (const c of categorieen.filter((x) => !tegel(x).checked)) {
                for (const r of rijenVan(wortel.querySelector(`[data-scherm="cat-${c}"]`))) {
                    if (hoofd.post(r.id).value !== '') { hoofd.post(r.id).value = ''; meld(hoofd.post(r.id)); }
                    r.kies.checked = false; r.vak.hidden = true; r.bedrag.value = ''; r.rij.classList.remove('is-gekozen');
                }
            }
        } else if (scherm.startsWith('cat-')) {
            const rijen = rijenVan(formulier);
            if (fout(formulier, controleerPosten(rijen.map((r) => ({ naam: r.naam, gekozen: r.kies.checked, bedrag: leesGetal(r.bedrag.value) }))))) return;
            for (const r of rijen) hoofd.post(r.id).value = r.kies.checked ? toonGetal(leesGetal(r.bedrag.value)) : '';
            meld(hoofd.post(rijen[0].id));
            // Na het laatste onderdeel moet er iets te begroten zijn.
            if (volgende(volgorde(), scherm) === 'reserve' && fout(formulier, heeftPosten() ? '' : 'Vul bij minstens één onderdeel een bedrag in.')) return;
        } else if (scherm === 'reserve') {
            const pct = st.reserve.value.trim() === '' ? 10 : leesGetal(st.reserve.value);
            if (fout(formulier, controleerReserve(pct))) return;
            hoofd.reserve.value = String(pct);
            meld(hoofd.reserve);
        } else if (scherm === 'geld') {
            const w = { hypotheek: ofNul(st.hypotheek), waarde: leesGetal(st.waarde.value), eigen: ofNul(st.eigen) };
            if (fout(formulier, controleerGeld(w))) return;
            hoofd.hypotheek.value = toonGetal(w.hypotheek);
            hoofd.waarde.value = toonGetal(w.waarde);
            hoofd.eigen.value = toonGetal(w.eigen);
            meld(hoofd.waarde);
        } else if (scherm === 'rente') {
            const rente = leesPercentage(st.rente.value);
            if (fout(formulier, controleerRente(rente))) return;
            hoofd.rente.value = toonGetal(rente, 2);
            meld(hoofd.rente);
            meld(hoofd.rente, 'change');   // zodat de rente meereist naar de andere rekenpagina's
            // De leenruimte rekent met het totaal van de begroting, niet met een los bedrag.
            el('lr-volg-knop').click();
        }
        zetOpen(false);
        toon(volgende(volgorde(), scherm));
    });

    // De reserve rekent mee terwijl je typt, zodat het totaal op het scherm klopt.
    st.reserve.addEventListener('input', () => {
        const pct = st.reserve.value.trim() === '' ? 10 : leesGetal(st.reserve.value);
        if (controleerReserve(pct) === '') { hoofd.reserve.value = String(pct); meld(hoofd.reserve); }
    });

    /* ------------------------------ het overzicht: aanpassen ------------------------------ */

    const knopAanpassen = q('[data-vb-aanpas=""]'), knopPosten = q('[data-vb-posten]');
    function zetOpen(open) {
        lichaam.classList.toggle('nb-open', open);
        knopAanpassen.setAttribute('aria-expanded', String(open));
        knopAanpassen.textContent = open ? 'Klaar met aanpassen' : 'Aanpassen';
    }
    function zetPostenOpen(open) {
        lichaam.classList.toggle('vb-posten-open', open);
        knopPosten.setAttribute('aria-expanded', String(open));
    }
    q('[data-vb-posten-dicht]').addEventListener('click', () => { zetPostenOpen(false); q('.vb-lijst').scrollIntoView({ block: 'center', behavior: stil ? 'auto' : 'smooth' }); });

    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-vb-terug]')) { toon(vorige(volgorde(), stand)); return; }
        const naar = e.target.closest('[data-vb-naar]');
        if (naar) { vulStappen(); toon(naar.dataset.vbNaar); return; }
        if (e.target.closest('[data-vb-overzicht]')) { toon('klaar'); return; }
        if (e.target.closest('[data-vb-voorbeeld]')) {
            // Het voorbeeld van de leenruimte: één bedrag en een woning, zonder posten.
            el('lr-praktijkcase').click();
            toon('klaar');
            return;
        }
        if (e.target.closest('[data-vb-posten]')) { zetPostenOpen(true); el('begroting-posten').scrollIntoView({ block: 'start', behavior: stil ? 'auto' : 'smooth' }); return; }
        const knop = e.target.closest('[data-vb-aanpas]');
        if (!knop) return;
        const doel = knop.dataset.vbAanpas;
        if (!doel) { zetOpen(!lichaam.classList.contains('nb-open')); return; }
        if (doel === 'waarde') {
            zetOpen(true);
            hoofd.waarde.scrollIntoView({ block: 'center', behavior: stil ? 'auto' : 'smooth' });
            hoofd.waarde.focus({ preventScroll: true });
        } else {
            zetPostenOpen(true);
            const keuze = q('[data-bankkeuze]');
            keuze.scrollIntoView({ block: 'center', behavior: stil ? 'auto' : 'smooth' });
            keuze.querySelector('select, button, input')?.focus({ preventScroll: true });
        }
    });

    /* ------------------------------ waar begin je ------------------------------ */

    // De financiering staat in de rekentool voorgevuld met een voorbeeld. In de
    // stappen komt alleen terug wat de bezoeker zelf eerder heeft ingevuld.
    let eerder = {};
    try { eerder = JSON.parse(localStorage.getItem('bouwdepot-leenruimte-v1') || '{}'); } catch { /* geen opslag */ }
    if (eerder.aangeraakt) {
        st.hypotheek.value = hoofd.hypotheek.value;
        st.waarde.value = hoofd.waarde.value;
        st.eigen.value = hoofd.eigen.value;
        st.rente.value = hoofd.rente.value;
    }
    vulStappen();
    // De rekentool heeft al gerekend voordat de stappen meeluisterden; nog een
    // keer, zodat de samenvatting er staat. Er verandert geen invoer.
    meld(hoofd.reserve);

    if (stand === 'klaar') {
        // Rechtstreeks naar de rekentool (menu, of een bedrag in het adres): dan
        // staat het formulier open, zoals de pagina altijd begon.
        zetOpen(true);
        zetPostenOpen(true);
        toon('klaar', { direct: true });
    } else {
        q('[data-vb-verder]').hidden = !(heeftPosten() || eerder.aangeraakt);
        toon('start', { direct: true });
    }
}

// Na de rekentool: die registreert zich eerder op hetzelfde moment, dus de
// velden en de opgeslagen invoer staan klaar als de stappen ze lezen.
document.addEventListener('DOMContentLoaded', start);
