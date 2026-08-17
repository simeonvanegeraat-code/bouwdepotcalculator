/**
 * Verbouwbegroting.
 *
 * Bewust zonder voorgevulde prijzen: verbouwkosten verschillen te sterk per
 * woning en regio om een bedrag te publiceren dat we niet kunnen onderbouwen.
 * De waarde van deze tool zit in drie dingen die een prijslijst niet biedt:
 *
 *   1. de splitsing tussen wat uit het bouwdepot mag en wat uit eigen geld moet
 *   2. het onderscheid noodzakelijk / gewenst, zodat schrappen later makkelijk is
 *   3. een specificatie die u kunt meenemen naar adviseur of geldverstrekker
 *
 * Alles blijft in localStorage op het apparaat van de bezoeker.
 */

import { opBankwissel } from './bankkeuze.js';

const wortel = document.getElementById('begroting');

if (wortel) {
    const SLEUTEL = 'bouwdepot-begroting-v1';

    const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    const el = (id) => document.getElementById(id);

    const bedragVelden = Array.from(wortel.querySelectorAll('[data-post]'));
    const prioriteitVelden = Array.from(wortel.querySelectorAll('[data-prioriteit]'));
    const marge = el('in-onvoorzien');
    const margeWaarde = el('toon-onvoorzien');

    const uit = {
        totaal: el('res-totaal'),
        depot: el('res-depot'),
        eigen: el('res-eigen'),
        noodzakelijk: el('res-noodzakelijk'),
        gewenst: el('res-gewenst'),
        marge: el('res-marge'),
        aantal: el('res-aantal'),
        zin: el('res-zin'),
    };

    /* ---------------------------------------------------------------- opslag */

    const bewaar = () => {
        try {
            const staat = { marge: marge?.value, posten: {} };
            for (const veld of bedragVelden) {
                const prio = wortel.querySelector(`[data-prioriteit="${veld.dataset.post}"]`);
                if (veld.value) staat.posten[veld.dataset.post] = { bedrag: veld.value, prioriteit: prio?.value || 'noodzakelijk' };
            }
            localStorage.setItem(SLEUTEL, JSON.stringify(staat));
        } catch (_) {}
    };

    const herstel = () => {
        try {
            const staat = JSON.parse(localStorage.getItem(SLEUTEL) || '{}');
            if (staat.marge && marge) marge.value = staat.marge;
            for (const [id, p] of Object.entries(staat.posten || {})) {
                const veld = wortel.querySelector(`[data-post="${id}"]`);
                const prio = wortel.querySelector(`[data-prioriteit="${id}"]`);
                if (veld) veld.value = p.bedrag;
                if (prio && p.prioriteit) prio.value = p.prioriteit;
            }
        } catch (_) {}
    };

    /* ------------------------------------------------------------- berekenen */

    function bereken() {
        let depot = 0, eigen = 0, noodzakelijk = 0, gewenst = 0, aantal = 0;

        for (const veld of bedragVelden) {
            const bedrag = Math.max(0, Number(veld.value) || 0);
            const rij = veld.closest('.post');
            rij?.classList.toggle('post--gevuld', bedrag > 0);
            if (!bedrag) continue;

            aantal++;
            // Wat niet vast aan de woning zit, komt doorgaans niet uit het depot.
            if (veld.dataset.vast === 'true') depot += bedrag; else eigen += bedrag;

            const prio = wortel.querySelector(`[data-prioriteit="${veld.dataset.post}"]`);
            if (prio?.value === 'gewenst') gewenst += bedrag; else noodzakelijk += bedrag;
        }

        const margePct = Number(marge?.value) || 0;
        // De reserve hoort bij het werk aan de woning en telt dus mee in het depotdeel.
        const margeBedrag = Math.round(depot * (margePct / 100));
        const totaal = depot + eigen + margeBedrag;

        if (margeWaarde) margeWaarde.textContent = margePct + '%';
        uit.totaal.textContent = euro.format(totaal);
        uit.depot.textContent = euro.format(depot + margeBedrag);
        uit.eigen.textContent = euro.format(eigen);
        uit.noodzakelijk.textContent = euro.format(noodzakelijk);
        uit.gewenst.textContent = euro.format(gewenst);
        uit.marge.textContent = euro.format(margeBedrag);
        uit.aantal.textContent = aantal === 1 ? '1 post ingevuld' : `${aantal} posten ingevuld`;

        uit.zin.textContent = aantal === 0
            ? 'Vul hieronder in wat u verwacht uit te geven. Gebruik uw eigen offertes; wij vullen bewust geen prijzen voor u in.'
            : eigen > 0
                ? `Van dit bedrag komt ${euro.format(eigen)} naar verwachting niet uit het bouwdepot, omdat het niet vast aan de woning zit. Reken daar eigen geld voor.`
                : `Alle ingevulde posten zitten vast aan de woning en komen doorgaans in aanmerking voor het bouwdepot.`;

        // Doorgeven aan de maandlastberekening op de homepage.
        const doorreken = el('naar-maandlast');
        if (doorreken) doorreken.href = totaal > 0 ? `/?bedrag=${Math.round(depot + margeBedrag)}` : '/';

        bewaar();
    }

    /* --------------------------------------------------------------- binding */

    bedragVelden.forEach((v) => v.addEventListener('input', bereken));
    prioriteitVelden.forEach((v) => v.addEventListener('change', bereken));
    marge?.addEventListener('input', bereken);

    el('begroting-wissen')?.addEventListener('click', () => {
        bedragVelden.forEach((v) => { v.value = ''; });
        prioriteitVelden.forEach((v) => { v.value = 'noodzakelijk'; });
        if (marge) marge.value = 10;
        try { localStorage.removeItem(SLEUTEL); } catch (_) {}
        bereken();
    });

    el('begroting-printen')?.addEventListener('click', () => window.print());

    /* ------------------------------------------------------------- bankkeuze */

    // De data houdt per post bij welke aanbieders die post bij naam noemen. Dat
    // stond er al als opsomming van alle zes; wie zijn eigen bank kiest wil weten
    // welke regel over hem gaat. Markeren is bewust eenrichtingsverkeer: geen
    // markering betekent niet dat de bank de post afwijst, want vrijwel geen
    // aanbieder publiceert een volledige lijst.
    //
    // Drie van de zes aanbieders noemen geen enkele post bij naam. Een uitleg over
    // markeringen die dan nergens verschijnt is een loze belofte, dus de tekst
    // volgt het werkelijke aantal in plaats van de keuze.
    const bronnen = Array.from(wortel.querySelectorAll('[data-genoemd-door]'));
    const melding = el('begroting-bankmelding');
    const meldingTekst = el('begroting-bankmelding-tekst');

    opBankwissel((bank) => {
        let aantal = 0;

        for (const bron of bronnen) {
            const genoemd = !!bank && bron.dataset.genoemdDoor.split(' ').includes(bank.id);
            if (genoemd) aantal += 1;
            bron.closest('.post')?.classList.toggle('post--eigen-bank', genoemd);
            let merk = bron.parentElement.querySelector('.merkje--eigenbank');
            if (genoemd && !merk) {
                merk = document.createElement('span');
                merk.className = 'merkje merkje--eigenbank';
                merk.textContent = 'uw bank';
                bron.parentElement.querySelector('.post__merk')?.append(merk);
            } else if (!genoemd && merk) {
                merk.remove();
            }
        }

        if (!melding || !meldingTekst) return;
        melding.hidden = !bank;
        if (!bank) return;

        meldingTekst.textContent = aantal > 0
            ? `${bank.naam} noemt ${aantal} van deze posten in de eigen voorwaarden bij naam. Die staan hieronder gemarkeerd. Dat een post niet gemarkeerd is zegt niets over goedkeuring: geen enkele aanbieder publiceert een volledige lijst.`
            : `${bank.naam} publiceert geen lijst met posten die wel of niet uit het depot mogen, alleen de algemene regel dat het om verbeteringen moet gaan die vast aan de woning zitten. Hieronder is daarom niets voor uw bank gemarkeerd; vraag twijfelgevallen schriftelijk na en bewaar het antwoord.`;

        const link = document.createElement('a');
        link.href = bank.pagina;
        link.textContent = ` Voorwaarden van ${bank.naam}`;
        meldingTekst.append(link);
    });

    herstel();
    bereken();
}
