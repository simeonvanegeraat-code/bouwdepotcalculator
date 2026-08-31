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

import { huidigeBank, opBankwissel } from './bankkeuze.js';
import { leesGetal, toonGetal } from './getallen.js';
import { berekenBegroting } from './begrotingrekenen.js';

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
        margeSplit: el('res-marge-split'),
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
        // Een miljard aan verbouwing bestaat niet; boven deze grens is het een
        // typefout en niet een begroting. We rekenen er niet mee en zeggen het.
        const MAX_PER_POST = 5000000;
        let fouten = 0;
        // De lus hieronder leest de velden en meldt wat er niet klopt; het
        // optellen gebeurt in begrotingrekenen.js, waar een test op zit.
        const ingevuld = [];

        for (const veld of bedragVelden) {
            // leesGetal in plaats van Number: dit veld stond op type="number",
            // en daarin werd "20.000" gelezen als 20 en "EUR 20.000" helemaal
            // weggegooid. Wie zijn offerte overtypte zag zijn totaal kelderen
            // zonder dat er iets misging op het scherm.
            const gelezen = leesGetal(veld.value);
            const rij = veld.closest('.post');

            let melding = '';
            if (veld.value.trim() !== '' && gelezen === null) melding = 'Dit lezen wij niet als bedrag.';
            else if (gelezen !== null && gelezen < 0) melding = 'Een bedrag onder nul bestaat niet.';
            else if (gelezen !== null && gelezen > MAX_PER_POST) melding = `Boven ${euro.format(MAX_PER_POST)} rekenen wij niet mee; controleer het bedrag.`;

            const foutregel = rij?.querySelector('.post__fout');
            if (foutregel) foutregel.textContent = melding;
            veld.setAttribute('aria-invalid', melding ? 'true' : 'false');
            if (melding) fouten++;

            const bedrag = melding ? 0 : Math.max(0, gelezen ?? 0);
            rij?.classList.toggle('post--gevuld', bedrag > 0);
            if (!bedrag) continue;

            const prio = wortel.querySelector(`[data-prioriteit="${veld.dataset.post}"]`);
            ingevuld.push({
                bedrag,
                vast: veld.dataset.vast === 'true',
                prioriteit: prio?.value === 'gewenst' ? 'gewenst' : 'noodzakelijk',
            });
        }

        // Subtotaal per categorie, uit dezelfde lus zodat ze niet uit elkaar lopen.
        for (const sectie of wortel.querySelectorAll('.cat')) {
            const doel = sectie.querySelector('[data-subtotaal]');
            if (!doel) continue;
            let som = 0, gevuld = 0;
            for (const veld of sectie.querySelectorAll('[data-post]')) {
                const waarde = leesGetal(veld.value);
                if (waarde && waarde > 0 && waarde <= MAX_PER_POST) { som += waarde; gevuld++; }
            }
            doel.textContent = gevuld ? `${euro.format(som)} in ${gevuld === 1 ? '1 post' : gevuld + ' posten'}` : '';
        }

        const margePct = Number(marge?.value) || 0;
        const { depot, eigen, noodzakelijk, gewenst, margeBedrag, depotMetMarge, totaal, aantal } =
            berekenBegroting(ingevuld, margePct);

        if (margeWaarde) margeWaarde.textContent = margePct + '%';
        uit.totaal.textContent = euro.format(totaal);
        uit.depot.textContent = euro.format(depotMetMarge);
        uit.eigen.textContent = euro.format(eigen);
        uit.noodzakelijk.textContent = euro.format(noodzakelijk);
        uit.gewenst.textContent = euro.format(gewenst);
        uit.marge.textContent = euro.format(margeBedrag);
        if (uit.margeSplit) uit.margeSplit.textContent = euro.format(margeBedrag);
        uit.aantal.textContent = aantal === 1 ? '1 post ingevuld' : `${aantal} posten ingevuld`;

        uit.zin.textContent = aantal === 0
            ? 'Vul hieronder in wat u verwacht uit te geven. Gebruik uw eigen offertes; wij vullen bewust geen prijzen voor u in.'
            : eigen > 0
                ? `Van dit bedrag komt ${euro.format(eigen)} naar verwachting niet uit het bouwdepot, omdat het niet vast aan de woning zit. Reken daar eigen geld voor.`
                : `Alle ingevulde posten zitten vast aan de woning en komen doorgaans in aanmerking voor het bouwdepot.`;

        // Doorgeven aan de rekenpagina, zodat de reeks begroting -> maandlast doorloopt.
        const doorreken = el('naar-maandlast');
        if (doorreken) doorreken.href = totaal > 0 ? `bouwdepot-berekenen.html?bedrag=${Math.round(depot + margeBedrag)}` : 'bouwdepot-berekenen.html';

        bouwSpecificatie({ depot, eigen, noodzakelijk, gewenst, margeBedrag, margePct, totaal });

        bewaar();
    }

    /* ---------------------------------------------------------- specificatie */

    /**
     * Bouwt het document dat de bezoeker meeneemt naar adviseur of aannemer.
     *
     * Op papier is een ingevuld formulier geen specificatie: de lege posten, de
     * schuifbalk en de uitleg horen er niet in, en de indeling die op het scherm
     * werkt leest op papier niet als een stuk. Daarom een eigen opbouw, gevuld
     * uit dezelfde invoer, met alleen de posten die een bedrag hebben.
     */
    const spec = el('specificatie');

    function bouwSpecificatie(cijfers) {
        if (!spec) return;

        const bank = huidigeBank();
        const nu = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }).format(new Date());

        // Per categorie alleen de ingevulde posten, in de volgorde van de pagina.
        const blokken = Array.from(wortel.querySelectorAll('.cat')).map((cat) => {
            const regels = Array.from(cat.querySelectorAll('.post')).map((post) => {
                const veld = post.querySelector('[data-post]');
                // Ook hier leesGetal: de specificatie las de velden zelf uit en
                // maakte van "45.000" een bedrag van 45 euro, terwijl de totalen
                // eronder wel klopten. Scherm en document horen uit dezelfde bron
                // te komen.
                const bedrag = Math.max(0, leesGetal(veld?.value) ?? 0);
                if (!bedrag) return '';
                const prio = wortel.querySelector(`[data-prioriteit="${veld.dataset.post}"]`);
                return `<tr>
                    <td>${post.querySelector('label').textContent}</td>
                    <td>${prio?.value === 'gewenst' ? 'Gewenst' : 'Noodzakelijk'}</td>
                    <td>${veld.dataset.vast === 'true' ? 'Bouwdepot' : 'Eigen geld'}</td>
                    <td class="spec__bedrag">${euro.format(bedrag)}</td>
                </tr>`;
            }).filter(Boolean).join('');

            if (!regels) return '';
            return `<tbody class="spec__groep">
                <tr class="spec__kopregel"><th colspan="4">${cat.querySelector('.cat__kop :is(h2, h3)').textContent}</th></tr>
                ${regels}
            </tbody>`;
        }).filter(Boolean).join('');

        if (!blokken) {
            spec.innerHTML = `<p>Er zijn nog geen bedragen ingevuld. Vul de begroting in en print daarna opnieuw.</p>`;
            return;
        }

        const eisen = bank?.eisen?.length
            ? `<ul>${bank.eisen.map((e) => `<li><strong>${e.eis.replace(/-/g, ' ')}:</strong> ${e.waarde}</li>`).join('')}</ul>`
            : '';

        spec.innerHTML = `
            <header class="spec__kop">
                <h2>Verbouwingsspecificatie</h2>
                <p>Opgesteld op ${nu}${bank ? ` &middot; bouwdepot bij ${bank.naam}` : ''}</p>
            </header>

            <table class="spec__tabel">
                <thead><tr><th>Post</th><th>Prioriteit</th><th>Betaald uit</th><th class="spec__bedrag">Bedrag</th></tr></thead>
                ${blokken}
                <tfoot>
                    ${cijfers.margeBedrag > 0 ? `<tr><td colspan="3">Reserve voor onvoorzien (${cijfers.margePct}% van het depotdeel)</td><td class="spec__bedrag">${euro.format(cijfers.margeBedrag)}</td></tr>` : ''}
                    <tr class="spec__totaal"><td colspan="3">Totale verbouwkosten</td><td class="spec__bedrag">${euro.format(cijfers.totaal)}</td></tr>
                    <tr><td colspan="3">Waarvan naar verwachting uit het bouwdepot</td><td class="spec__bedrag">${euro.format(cijfers.depot + cijfers.margeBedrag)}</td></tr>
                    <tr><td colspan="3">Waarvan uit eigen geld</td><td class="spec__bedrag">${euro.format(cijfers.eigen)}</td></tr>
                    <tr><td colspan="3">Noodzakelijk / gewenst</td><td class="spec__bedrag">${euro.format(cijfers.noodzakelijk)} / ${euro.format(cijfers.gewenst)}</td></tr>
                </tfoot>
            </table>

            <div class="spec__voet">
                <h3>Bij declareren aanleveren</h3>
                ${bank
                    ? `${eisen}<p>Opnemen bij ${bank.naam}: ${bank.opnamemethode === 'zelf-betalen'
                        ? 'u betaalt zelf vanuit het depot.'
                        : 'u dient een bewijsstuk in, daarna volgt uitbetaling.'}${bank.uitbetaling ? ` Doorlooptijd: ${bank.uitbetaling.toLowerCase()}.` : ''}</p>`
                    : '<p>Geen geldverstrekker gekozen. Vraag bij uw eigen aanbieder na welk bewijsstuk vereist is; een offerte of pro-formafactuur wordt vrijwel nergens geaccepteerd.</p>'}

                <h3>Waarop de verdeling berust</h3>
                <p>De kolom "betaald uit" volgt de vuistregel die vrijwel elke geldverstrekker hanteert: wat vast aan de woning zit komt in aanmerking voor het bouwdepot, wat u bij een verhuizing kunt meenemen niet. Dit is een indicatie op basis van publieke productinformatie en geen toezegging; uw geldverstrekker beoordeelt uw eigen verbouwingsplan.</p>
                <p>Bedragen zijn door de opsteller zelf ingevuld en niet door BouwdepotCalculator.nl geschat of gecontroleerd. Opgesteld met bouwdepotcalculator.nl/verbouwbegroting.html.</p>
            </div>`;
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
    // Lang niet elke aanbieder noemt posten bij naam. Een uitleg over
    // markeringen die dan nergens verschijnt is een loze belofte, dus de tekst
    // volgt het werkelijke aantal in plaats van de keuze.
    const bronnen = Array.from(wortel.querySelectorAll('[data-genoemd-door]'));
    const melding = el('begroting-bankmelding');
    const meldingTekst = el('begroting-bankmelding-tekst');

    // bereken() schrijft de begroting weg. Zolang de opgeslagen invoer nog niet
    // is teruggezet mag dat niet gebeuren, anders overschrijft een lege pagina
    // wat de bezoeker eerder had ingevuld.
    let herstelGedaan = false;

    opBankwissel((bank) => {
        let aantal = 0;

        // Het attribuut zit sinds kort op de post zelf. Eerder hing het aan een
        // regel die vertelde welke aanbieders de post noemen, maar die noemde ook
        // banken waar de bezoeker niet zit: met Rabobank gekozen stond er bij tien
        // van de vijftien posten "Expliciet genoemd door ING". Dat leest als
        // relevantie voor een bank die niet de zijne is. Wat blijft is de badge,
        // want die gaat wel over zijn eigen situatie.
        for (const post of bronnen) {
            const genoemd = !!bank && post.dataset.genoemdDoor.split(' ').includes(bank.id);
            if (genoemd) aantal += 1;
            post.classList.toggle('post--eigen-bank', genoemd);
            let merk = post.querySelector('.merkje--eigenbank');
            if (genoemd && !merk) {
                merk = document.createElement('span');
                merk.className = 'merkje merkje--eigenbank';
                merk.textContent = 'uw bank';
                post.querySelector('.post__merk')?.append(merk);
            } else if (!genoemd && merk) {
                merk.remove();
            }
        }

        // De specificatie noemt de gekozen aanbieder en zijn declaratie-eisen, dus
        // die moet mee wisselen. Zonder deze herberekening bleef de bank staan die
        // gold toen er voor het laatst een bedrag werd getypt. Alleen na het
        // herstellen: bereken() slaat ook op, en bij het registreren van deze
        // luisteraar zijn de velden nog leeg.
        if (herstelGedaan) bereken();

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
    herstelGedaan = true;

    // Wat is ingevuld, staat open. Anders zou iemand terugkomen op een pagina
    // die leeg lijkt, terwijl zijn bedragen achter een dichtgeklapt blok zitten.
    for (const categorie of wortel.querySelectorAll('.cat')) {
        const gevuld = [...categorie.querySelectorAll('[data-post]')].some((v) => v.value.trim() !== '');
        if (gevuld) categorie.open = true;
    }

    bereken();
}
