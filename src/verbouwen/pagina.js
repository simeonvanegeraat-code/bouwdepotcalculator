/**
 * De verbouwpagina: begroting, financieringscheck en specificatie.
 *
 * Bewust zonder voorgevulde prijzen: verbouwkosten verschillen te sterk per
 * woning en regio om een bedrag te publiceren dat we niet kunnen onderbouwen.
 * De waarde van deze pagina zit in wat een prijslijst niet biedt:
 *
 *   1. de splitsing tussen wat uit het bouwdepot mag en wat uit eigen geld moet
 *   2. het onderscheid noodzakelijk / gewenst, zodat schrappen later makkelijk is
 *   3. de vraag erna: past het binnen de woningwaarde, en wat kost het per maand
 *   4. een specificatie om mee te nemen naar adviseur of geldverstrekker
 *
 * Hier staat geen rekenregel. De optelling gebeurt in src/js/begrotingrekenen.js,
 * de waardetoets en de maandlast in src/domain/verbouwing.js; op beide zit een
 * test. Dit bestand leest velden, meldt wat er niet klopt en toont de uitkomst.
 *
 * De begroting en de financieringscheck horen bij elkaar: zodra er posten zijn
 * ingevuld neemt de check het depotbedrag en de eigen posten over. Wie alleen
 * de check wil gebruiken (het anker #leenruimte is een eigen ingang vanuit
 * zoekmachines) vult die twee bedragen zelf in.
 *
 * Alles blijft in localStorage op het apparaat van de bezoeker, onder dezelfde
 * sleutels als de vorige versie van de pagina.
 */

import { startRekenpagina } from '../js/rekenpagina.js';
import { huidigeBank, opBankwissel } from '../js/bankkeuze.js';
import {
    leesGetal, leesPercentage, toonGetal, euro, maakVeldlezer, koppelBedragveld, koppelPercentageveld,
} from '../js/getallen.js';
import { berekenBegroting } from '../js/begrotingrekenen.js';
import { berekenLeenruimte, maandlastExtraLening } from '../domain/verbouwing.js';

const SLEUTEL_BEGROTING = 'bouwdepot-begroting-v1';
const SLEUTEL_LEENRUIMTE = 'bouwdepot-leenruimte-v1';
// Een miljard aan verbouwing bestaat niet; boven deze grens is het een
// typefout en niet een begroting. We rekenen er niet mee en zeggen het.
const MAX_PER_POST = 5000000;
const LOOPTIJD_JAREN = 30;

const BEDRAG = (leeg, max = 5000000) => ({
    lezer: leesGetal, min: 0, max, exclusiefNul: false,
    leeg, teLaag: 'Een bedrag onder de nul bestaat niet.',
    teHoog: 'Dit bedrag is hoger dan waar deze tool mee rekent; controleer het.',
});

const GRENZEN = {
    // Dertig procent is de bovengrens: boven die marge is het geen reserve meer
    // maar een tweede begroting.
    'in-onvoorzien': {
        lezer: leesGetal, min: 0, max: 30, exclusiefNul: false,
        leeg: 'Vul een percentage in, of nul als je geen reserve aanhoudt.',
        teLaag: 'Een reserve onder de nul procent bestaat niet.',
        teHoog: 'Boven de 30 procent is het geen reserve meer; controleer het percentage.',
    },
    'lr-bedrag': { ...BEDRAG('Vul het bedrag in dat je wilt lenen.', 1000000), exclusiefNul: true, teLaag: 'Vul een bedrag boven de nul in.' },
    'lr-buiten-depot': BEDRAG('Vul de kosten buiten het depot in, of nul.', 1000000),
    'lr-hypotheek': BEDRAG('Vul je huidige hypotheek in, of nul als je die niet hebt.'),
    'lr-waarde': { ...BEDRAG('Vul de woningwaarde na verbouwing in.'), exclusiefNul: true, teLaag: 'Vul een woningwaarde boven de nul in.' },
    'lr-eigen-geld': BEDRAG('Vul je eigen geld in, of nul als je dat niet inzet.', 1000000),
    'input-interest': {
        lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
        leeg: 'Vul een hypotheekrente in om de maandlast te schatten.',
        teLaag: 'Een rente onder de nul procent bestaat niet.',
        teHoog: 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.',
    },
};

const procent = (waarde) => `${waarde.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

function initVerbouwen() {
    const el = (id) => document.getElementById(id);
    const wortel = el('begroting');
    const leesVeld = maakVeldlezer(GRENZEN);

    const bedragVelden = [...wortel.querySelectorAll('[data-post]')];
    const marge = el('in-onvoorzien');
    const prioriteitVan = (id) => wortel.querySelector(`[data-prioriteit="${id}"]`);

    /* ----------------------------------------------------------- eigen posten */

    // Posten die niet in de lijst staan. De bezoeker kiest zelf of ze vast aan
    // de woning zitten; dat is dezelfde vuistregel als bij de vaste posten.
    let eigenPosten = [];
    const eigenLijst = el('eigen-posten');

    function tekenEigenPosten() {
        eigenLijst.innerHTML = '';
        eigenPosten.forEach((post, i) => {
            const nr = i + 1;
            const rij = document.createElement('div');
            rij.className = 'wr-post wr-post--eigen';
            rij.innerHTML = `
                <div class="wr-post__naam">
                    <input type="text" data-eigen="naam" placeholder="Omschrijving" aria-label="Eigen post ${nr}: omschrijving" autocomplete="off">
                    <select data-eigen="vast" aria-label="Eigen post ${nr}: betaald uit">
                        <option value="true">Zit vast aan de woning: uit depot</option>
                        <option value="false">Los of mee te nemen: eigen geld</option>
                    </select>
                </div>
                <div class="wr-post__invoer">
                    <div class="wr-veld__in"><span aria-hidden="true">€</span><input type="text" data-eigen="bedrag" inputmode="decimal" placeholder="0" aria-label="Eigen post ${nr}: bedrag in euro" autocomplete="off"></div>
                    <select class="wr-post__prioriteit" data-eigen="prioriteit" aria-label="Eigen post ${nr}: prioriteit">
                        <option value="noodzakelijk">Noodzakelijk</option>
                        <option value="gewenst">Gewenst</option>
                    </select>
                    <button type="button" class="wr-termijn__weg" data-eigen="weg" aria-label="Eigen post ${nr} verwijderen" title="Eigen post ${nr} verwijderen">×</button>
                </div>
                <span class="wr-veld__fout wr-post__fout" role="alert"></span>`;
            const deel = (naam) => rij.querySelector(`[data-eigen="${naam}"]`);
            deel('naam').value = post.naam;
            deel('bedrag').value = post.bedrag;
            deel('vast').value = String(post.vast);
            deel('prioriteit').value = post.prioriteit;
            deel('naam').addEventListener('input', (e) => { post.naam = e.target.value; bereken(); });
            deel('bedrag').addEventListener('input', (e) => { post.bedrag = e.target.value; bereken(); });
            deel('vast').addEventListener('change', (e) => { post.vast = e.target.value === 'true'; bereken(); });
            deel('prioriteit').addEventListener('change', (e) => { post.prioriteit = e.target.value; bereken(); });
            deel('weg').addEventListener('click', () => { eigenPosten.splice(i, 1); tekenEigenPosten(); bereken(); });
            post.rij = rij;
            eigenLijst.append(rij);
        });
    }

    el('eigen-post-erbij').addEventListener('click', () => {
        eigenPosten.push({ naam: '', bedrag: '', vast: true, prioriteit: 'noodzakelijk' });
        tekenEigenPosten();
        eigenPosten.at(-1).rij.querySelector('[data-eigen="naam"]').focus();
        bereken();
    });

    /* ----------------------------------------------------------------- opslag */

    const lr = {
        bedrag: el('lr-bedrag'), buitenDepot: el('lr-buiten-depot'), hypotheek: el('lr-hypotheek'),
        waarde: el('lr-waarde'), eigenGeld: el('lr-eigen-geld'),
    };
    const rente = el('input-interest');
    const volg = el('lr-volg');
    const volgRij = el('lr-volg-rij');

    function bewaar() {
        try {
            const staat = { marge: marge.value, posten: {}, eigen: eigenPosten.map(({ naam, bedrag, vast, prioriteit }) => ({ naam, bedrag, vast, prioriteit })) };
            for (const veld of bedragVelden) {
                if (veld.value) staat.posten[veld.dataset.post] = { bedrag: veld.value, prioriteit: prioriteitVan(veld.dataset.post)?.value || 'noodzakelijk' };
            }
            localStorage.setItem(SLEUTEL_BEGROTING, JSON.stringify(staat));

            const check = { volg: volg.checked, aangeraakt: eigenCheck };
            for (const [naam, veld] of Object.entries(lr)) check[naam] = veld.value;
            localStorage.setItem(SLEUTEL_LEENRUIMTE, JSON.stringify(check));
        } catch (_) { /* opslag is een gemak, geen voorwaarde */ }
    }

    // De velden van de check staan voorgevuld met een voorbeeld. Zolang de
    // bezoeker daar niets aan heeft veranderd, heet de uitkomst ook zo: een
    // voorbeeldbedrag mag er niet uitzien als zijn eigen situatie.
    let eigenCheck = false;

    // De oude verbouwbegroting linkte hierheen met het depotbedrag in de URL.
    const uitUrl = new URLSearchParams(location.search).get('bedrag');

    function herstel() {
        try {
            const staat = JSON.parse(localStorage.getItem(SLEUTEL_BEGROTING) || '{}');
            if (staat.marge) marge.value = staat.marge;
            for (const [id, p] of Object.entries(staat.posten || {})) {
                const veld = wortel.querySelector(`[data-post="${id}"]`);
                if (veld) veld.value = p.bedrag;
                if (prioriteitVan(id) && p.prioriteit) prioriteitVan(id).value = p.prioriteit;
            }
            if (Array.isArray(staat.eigen)) {
                eigenPosten = staat.eigen.map((p) => ({ naam: String(p.naam ?? ''), bedrag: String(p.bedrag ?? ''), vast: p.vast !== false, prioriteit: p.prioriteit === 'gewenst' ? 'gewenst' : 'noodzakelijk' }));
            }

            const check = JSON.parse(localStorage.getItem(SLEUTEL_LEENRUIMTE) || '{}');
            // De vorige versie bewaarde ook onaangeraakte voorbeeldwaarden. Zonder
            // vlag telt opgeslagen invoer daarom alleen als eigen invoer wanneer
            // hij van het voorbeeld afwijkt.
            let wijktAf = false;
            for (const [naam, veld] of Object.entries(lr)) {
                if (!check[naam]) continue;
                if (leesGetal(check[naam]) !== leesGetal(veld.value)) wijktAf = true;
                veld.value = check[naam];
            }
            eigenCheck = check.aangeraakt ?? wijktAf;
            if (check.volg === false) volg.checked = false;
        } catch (_) { /* een kapotte opslag mag de pagina niet omleggen */ }
        if (uitUrl && Number(uitUrl) > 0) { lr.bedrag.value = uitUrl; volg.checked = false; eigenCheck = true; }
    }

    /* ----------------------------------------------------------------- lezen */

    /** Leest één bedragveld van de begroting en schrijft de melding erbij. */
    function leesPost(veld, rij) {
        const gelezen = leesGetal(veld.value);
        let melding = '';
        if (veld.value.trim() !== '' && gelezen === null) melding = 'Dit lezen we niet als bedrag.';
        else if (gelezen !== null && gelezen < 0) melding = 'Een bedrag onder nul bestaat niet.';
        else if (gelezen !== null && gelezen > MAX_PER_POST) melding = `Boven ${euro.format(MAX_PER_POST)} rekenen we niet mee; controleer het bedrag.`;
        const foutregel = rij?.querySelector('.wr-post__fout');
        if (foutregel) foutregel.textContent = melding;
        veld.setAttribute('aria-invalid', melding ? 'true' : 'false');
        const bedrag = melding ? 0 : Math.max(0, gelezen ?? 0);
        rij?.classList.toggle('is-gevuld', bedrag > 0);
        return bedrag;
    }

    /** Alle ingevulde posten, in de volgorde van de pagina, met hun categorie. */
    function verzamel() {
        const ingevuld = [];
        for (const veld of bedragVelden) {
            const rij = veld.closest('.wr-post');
            const bedrag = leesPost(veld, rij);
            if (!bedrag) continue;
            ingevuld.push({
                bedrag,
                vast: veld.dataset.vast === 'true',
                prioriteit: prioriteitVan(veld.dataset.post)?.value === 'gewenst' ? 'gewenst' : 'noodzakelijk',
                naam: rij.querySelector('label').textContent,
                cat: veld.closest('.wr-cat').dataset.cat,
            });
        }
        eigenPosten.forEach((post, i) => {
            const bedrag = leesPost(post.rij.querySelector('[data-eigen="bedrag"]'), post.rij);
            if (!bedrag) return;
            ingevuld.push({ bedrag, vast: post.vast, prioriteit: post.prioriteit, naam: post.naam.trim() || `Eigen post ${i + 1}`, cat: 'eigen' });
        });
        return ingevuld;
    }

    /* ------------------------------------------------------------- berekenen */

    const uit = {
        totaal: el('res-totaal'), zin: el('res-zin'), depot: el('res-depot'), eigen: el('res-eigen'),
        marge: el('res-marge'), margeNoot: el('res-marge-noot'), maand: el('res-maand'), maandNoot: el('res-maand-noot'),
        noodzakelijk: el('res-noodzakelijk'), gewenst: el('res-gewenst'), aantal: el('res-aantal'),
        vast: el('wr-vast'), vastBedrag: el('wr-vast-bedrag'),
    };
    const uitLr = {
        ruimte: el('lr-res-ruimte'), zin: el('lr-res-zin'), financierbaar: el('lr-res-financierbaar'),
        maand: el('lr-res-maand'), maandNoot: el('lr-res-maand-noot'), nodig: el('lr-res-nodig'), nodigNoot: el('lr-res-nodig-noot'),
        buffer: el('lr-res-buffer'), bufferNoot: el('lr-res-buffer-noot'), verhouding: el('lr-res-verhouding'),
        balkLening: el('lr-balk-lening'), balkRuimte: el('lr-balk-ruimte'),
    };
    const zet = (dd, tekst) => { dd.firstChild.textContent = tekst; };
    let herstelGedaan = false;

    function bereken() {
        const ingevuld = verzamel();

        // Subtotaal per categorie, uit dezelfde lijst zodat ze niet uit elkaar lopen.
        for (const doel of wortel.querySelectorAll('[data-subtotaal]')) {
            const eigen = ingevuld.filter((p) => p.cat === doel.dataset.subtotaal);
            const som = eigen.reduce((s, p) => s + p.bedrag, 0);
            doel.textContent = eigen.length ? `${euro.format(som)} in ${eigen.length === 1 ? '1 post' : `${eigen.length} posten`}` : '';
        }
        el('eigen-aantal').textContent = eigenPosten.length ? (eigenPosten.length === 1 ? '1 post' : `${eigenPosten.length} posten`) : 'zelf toevoegen';

        // Een onleesbare reserve werd ooit nul, en dan verdween de hele marge
        // uit de begroting zonder dat er iets op het scherm veranderde.
        const margePct = leesVeld(marge);
        if (margePct === null) return;
        const b = berekenBegroting(ingevuld, margePct);

        zet(uit.totaal, euro.format(b.totaal));
        zet(uit.depot, euro.format(b.depotMetMarge));
        zet(uit.eigen, euro.format(b.eigen));
        zet(uit.marge, euro.format(b.margeBedrag));
        uit.margeNoot.textContent = `${margePct}% over het depotdeel`;
        uit.noodzakelijk.textContent = euro.format(b.noodzakelijk);
        uit.gewenst.textContent = euro.format(b.gewenst);
        uit.aantal.textContent = b.aantal === 1 ? '1 post ingevuld' : `${b.aantal} posten ingevuld`;
        uit.zin.textContent = b.aantal === 0
            ? 'Vul in wat je verwacht uit te geven. Gebruik je eigen offertes; we vullen bewust geen prijzen voor je in.'
            : b.eigen > 0
                ? `Van dit bedrag komt ${euro.format(b.eigen)} naar verwachting niet uit het bouwdepot, omdat het niet vast aan de woning zit. Reken daar eigen geld voor.`
                : 'Alle ingevulde posten zitten vast aan de woning en komen doorgaans in aanmerking voor het bouwdepot.';
        uit.vastBedrag.textContent = b.aantal ? euro.format(b.totaal) : '';

        /* De financieringscheck neemt de begroting over zodra die er is. */
        volgRij.hidden = b.aantal === 0;
        const overnemen = b.aantal > 0 && volg.checked && b.depotMetMarge > 0;
        for (const [veld, waarde] of [[lr.bedrag, b.depotMetMarge], [lr.buitenDepot, b.eigen]]) {
            veld.readOnly = overnemen;
            veld.closest('.wr-veld__in').classList.toggle('is-overgenomen', overnemen);
            if (overnemen) veld.value = toonGetal(Math.round(waarde));
        }

        el('lr-stempel').textContent = eigenCheck || overnemen ? 'Waardetoets' : 'Voorbeeld';
        const check = berekenCheck();

        // Het ene getal dat de twee delen verbindt: wat het per maand doet.
        if (check && b.aantal > 0) {
            zet(uit.maand, euro.format(check.maand));
            uit.maandNoot.textContent = `bruto, over ${euro.format(check.financierbaar)} extra lening`;
        } else {
            zet(uit.maand, '–');
            uit.maandNoot.textContent = b.aantal > 0 ? 'vul hieronder de financiering in' : 'volgt uit je begroting en de financiering';
        }

        // Doorgeven aan de rekenpagina, zodat de reeks begroting -> maandlast doorloopt.
        const teLenen = check ? check.financierbaar : b.depotMetMarge;
        el('naar-maandlast').href = teLenen > 0 ? `bouwdepot-berekenen.html?bedrag=${Math.round(teLenen)}` : 'bouwdepot-berekenen.html';

        bouwSpecificatie(ingevuld, b, margePct, check);
        if (herstelGedaan) bewaar();
    }

    /** De waardetoets en de maandlast. Geeft null als de invoer niet klopt. */
    function berekenCheck() {
        const invoer = {
            bedrag: leesVeld(lr.bedrag), buitenDepot: leesVeld(lr.buitenDepot), hypotheek: leesVeld(lr.hypotheek),
            waarde: leesVeld(lr.waarde), eigenGeld: leesVeld(lr.eigenGeld),
        };
        const rentePct = leesVeld(rente);
        if (Object.values(invoer).some((w) => w === null)) {
            for (const dd of [uitLr.ruimte, uitLr.financierbaar, uitLr.maand, uitLr.nodig, uitLr.buffer]) zet(dd, '–');
            uitLr.zin.textContent = 'Pas de gemarkeerde velden aan voor een indicatie.';
            uitLr.verhouding.textContent = '';
            uitLr.balkLening.style.width = uitLr.balkRuimte.style.width = '0%';
            return null;
        }

        const r = berekenLeenruimte(invoer);
        const maand = rentePct === null ? null : maandlastExtraLening(r.financierbaar, rentePct, LOOPTIJD_JAREN);

        zet(uitLr.ruimte, euro.format(r.ruimte));
        zet(uitLr.financierbaar, euro.format(r.financierbaar));
        zet(uitLr.maand, maand === null ? '–' : euro.format(maand));
        uitLr.maandNoot.textContent = maand === null ? 'vul een rente in' : `bruto, ${procent(rentePct)}, ${LOOPTIJD_JAREN} jaar annuïtair`;
        zet(uitLr.nodig, euro.format(r.nodig));
        uitLr.nodigNoot.textContent = r.gat > 0
            ? `${euro.format(r.gat)} past niet binnen de waarde, plus ${euro.format(invoer.buitenDepot)} buiten het depot`
            : 'de kosten buiten het depot';
        zet(uitLr.buffer, r.buffer < 0 ? `− ${euro.format(Math.abs(r.buffer))}` : euro.format(r.buffer));
        uitLr.bufferNoot.textContent = r.buffer < 0 ? 'tekort aan eigen geld' : 'van je eigen geld blijft over';
        uitLr.buffer.classList.toggle('is-tekort', r.buffer < 0);

        const pctHyp = Math.min(100, (invoer.hypotheek / invoer.waarde) * 100);
        uitLr.balkLening.style.width = `${pctHyp.toFixed(1)}%`;
        uitLr.balkRuimte.style.width = `${Math.min(100 - pctHyp, (r.financierbaar / invoer.waarde) * 100).toFixed(1)}%`;
        uitLr.verhouding.textContent = `Samen ${Math.round(r.verhouding * 100)}% van de woningwaarde`;

        uitLr.zin.textContent = r.gat === 0
            ? r.buffer >= 0
                ? `Het bedrag past binnen de waarderuimte. Na de kosten buiten het depot blijft ${euro.format(r.buffer)} eigen geld over.`
                : `Het bedrag past binnen de waarderuimte, maar voor de kosten buiten het depot ontbreekt nog ${euro.format(Math.abs(r.buffer))}.`
            : r.buffer >= 0
                ? `Van het bedrag valt ${euro.format(r.gat)} buiten de waarderuimte. Met je eigen geld is dat te overbruggen; er blijft ${euro.format(r.buffer)} over.`
                : `Van het bedrag valt ${euro.format(r.gat)} buiten de waarderuimte. Daarvoor ontbreekt indicatief ${euro.format(Math.abs(r.buffer))} aan eigen geld.`;

        return maand === null ? null : { ...r, maand, rentePct, invoer };
    }

    /* ---------------------------------------------------------- specificatie */

    /**
     * Bouwt het document dat de bezoeker meeneemt naar adviseur of aannemer.
     *
     * Op papier is een ingevuld formulier geen specificatie: de lege posten en
     * de uitleg horen er niet in. Daarom een eigen opbouw, gevuld uit dezelfde
     * lijst als het scherm, met alleen de posten die een bedrag hebben.
     */
    const spec = el('specificatie');
    const catNaam = (id) => wortel.querySelector(`[data-cat="${id}"] h3`)?.textContent ?? id;
    const veilig = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function bouwSpecificatie(ingevuld, b, margePct, check) {
        if (!ingevuld.length) {
            spec.innerHTML = '<p>Er zijn nog geen bedragen ingevuld. Vul de begroting in en print daarna opnieuw.</p>';
            return;
        }
        const bank = huidigeBank();
        const nu = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }).format(new Date());

        const groepen = [...new Set(ingevuld.map((p) => p.cat))].map((cat) => `<tbody class="wr-spec__groep">
                <tr class="wr-spec__kopregel"><th colspan="4">${veilig(catNaam(cat))}</th></tr>
                ${ingevuld.filter((p) => p.cat === cat).map((p) => `<tr>
                    <td>${veilig(p.naam)}</td>
                    <td>${p.prioriteit === 'gewenst' ? 'Gewenst' : 'Noodzakelijk'}</td>
                    <td>${p.vast ? 'Bouwdepot' : 'Eigen geld'}</td>
                    <td class="wr-spec__bedrag">${euro.format(p.bedrag)}</td>
                </tr>`).join('')}
            </tbody>`).join('');

        const eisen = bank?.eisen?.length
            ? `<ul>${bank.eisen.map((e) => `<li><strong>${veilig(e.eis.replace(/-/g, ' '))}:</strong> ${veilig(e.waarde)}</li>`).join('')}</ul>`
            : '';

        const financiering = check ? `
                <h3>Financiering, indicatief</h3>
                <table class="wr-spec__tabel">
                    <tr><td>Huidige hypotheek</td><td class="wr-spec__bedrag">${euro.format(check.invoer.hypotheek)}</td></tr>
                    <tr><td>Woningwaarde na verbouwing (opgave)</td><td class="wr-spec__bedrag">${euro.format(check.invoer.waarde)}</td></tr>
                    <tr><td>Te lenen binnen de woningwaarde</td><td class="wr-spec__bedrag">${euro.format(check.financierbaar)}</td></tr>
                    <tr><td>Eigen geld nodig</td><td class="wr-spec__bedrag">${euro.format(check.nodig)}</td></tr>
                    <tr><td>Extra bruto maandlast (${procent(check.rentePct)}, ${LOOPTIJD_JAREN} jaar annuïtair)</td><td class="wr-spec__bedrag">${euro.format(check.maand)}</td></tr>
                </table>
                <p>Dit is een waardetoets, geen inkomenstoets en geen toezegging. De geldverstrekker beoordeelt inkomen, taxatie en verbouwingsplan.</p>` : '';

        spec.innerHTML = `
            <header class="wr-spec__kop">
                <h2>Verbouwingsspecificatie</h2>
                <p>Opgesteld op ${nu}${bank ? ` &middot; bouwdepot bij ${veilig(bank.naam)}` : ''}</p>
            </header>

            <table class="wr-spec__tabel">
                <thead><tr><th>Post</th><th>Prioriteit</th><th>Betaald uit</th><th class="wr-spec__bedrag">Bedrag</th></tr></thead>
                ${groepen}
                <tfoot>
                    ${b.margeBedrag > 0 ? `<tr><td colspan="3">Reserve voor onvoorzien (${margePct}% van het depotdeel)</td><td class="wr-spec__bedrag">${euro.format(b.margeBedrag)}</td></tr>` : ''}
                    <tr class="wr-spec__totaal"><td colspan="3">Totale verbouwkosten</td><td class="wr-spec__bedrag">${euro.format(b.totaal)}</td></tr>
                    <tr><td colspan="3">Waarvan naar verwachting uit het bouwdepot</td><td class="wr-spec__bedrag">${euro.format(b.depotMetMarge)}</td></tr>
                    <tr><td colspan="3">Waarvan uit eigen geld</td><td class="wr-spec__bedrag">${euro.format(b.eigen)}</td></tr>
                    <tr><td colspan="3">Noodzakelijk / gewenst</td><td class="wr-spec__bedrag">${euro.format(b.noodzakelijk)} / ${euro.format(b.gewenst)}</td></tr>
                </tfoot>
            </table>

            <div class="wr-spec__voet">
                ${financiering}
                <h3>Bij declareren aanleveren</h3>
                ${bank
                    ? `${eisen}<p>Opnemen bij ${veilig(bank.naam)}: ${bank.opnamemethode === 'zelf-betalen'
                        ? 'je betaalt zelf vanuit het depot.'
                        : 'je dient een bewijsstuk in, daarna volgt uitbetaling.'}${bank.uitbetaling ? ` Doorlooptijd: ${veilig(bank.uitbetaling.toLowerCase())}.` : ''}</p>`
                    : '<p>Geen geldverstrekker gekozen. Vraag bij je eigen aanbieder na welk bewijsstuk vereist is; een offerte of pro-formafactuur wordt vrijwel nergens geaccepteerd.</p>'}

                <h3>Waarop de verdeling berust</h3>
                <p>De kolom "betaald uit" volgt de vuistregel die vrijwel elke geldverstrekker hanteert: wat vast aan de woning zit komt in aanmerking voor het bouwdepot, wat je bij een verhuizing kunt meenemen niet. Dit is een indicatie op basis van publieke productinformatie en geen toezegging; je geldverstrekker beoordeelt je eigen verbouwingsplan. Bij eigen posten heeft de opsteller die keuze zelf gemaakt.</p>
                <p>Bedragen zijn door de opsteller zelf ingevuld en niet door BouwdepotCalculator.nl geschat of gecontroleerd. Opgesteld met bouwdepotcalculator.nl/verbouwbegroting.html.</p>
            </div>`;
    }

    /* --------------------------------------------------------------- binding */

    for (const v of bedragVelden) v.addEventListener('input', bereken);
    for (const v of wortel.querySelectorAll('[data-prioriteit]')) v.addEventListener('change', bereken);
    marge.addEventListener('input', bereken);
    for (const v of [...Object.values(lr), rente]) v.addEventListener('input', () => { eigenCheck = true; bereken(); });
    volg.addEventListener('change', bereken);

    el('begroting-wissen').addEventListener('click', () => {
        for (const v of bedragVelden) v.value = '';
        for (const v of wortel.querySelectorAll('[data-prioriteit]')) v.value = 'noodzakelijk';
        eigenPosten = [];
        tekenEigenPosten();
        marge.value = 10;
        try { localStorage.removeItem(SLEUTEL_BEGROTING); } catch (_) { /* niets te wissen */ }
        bereken();
    });
    el('begroting-printen').addEventListener('click', () => window.print());

    el('lr-praktijkcase').addEventListener('click', () => {
        volg.checked = false;
        eigenCheck = false;
        lr.bedrag.value = toonGetal(75000);
        lr.hypotheek.value = toonGetal(300000);
        lr.waarde.value = toonGetal(360000);
        lr.eigenGeld.value = toonGetal(25000);
        lr.buitenDepot.value = toonGetal(10000);
        bereken();
    });

    /* ------------------------------------------------------------- bankkeuze */

    // De data houdt per post bij welke aanbieders die post bij naam noemen.
    // Markeren is bewust eenrichtingsverkeer: geen markering betekent niet dat
    // de bank de post afwijst, want vrijwel geen aanbieder publiceert een
    // volledige lijst. De tekst volgt het werkelijke aantal, zodat er geen
    // uitleg over markeringen staat die nergens verschijnen.
    const bronnen = [...wortel.querySelectorAll('[data-genoemd-door]')];
    const melding = el('begroting-bankmelding');
    const meldingTekst = el('begroting-bankmelding-tekst');

    opBankwissel((bank) => {
        let aantal = 0;
        for (const post of bronnen) {
            const genoemd = !!bank && post.dataset.genoemdDoor.split(' ').includes(bank.id);
            if (genoemd) aantal += 1;
            let merk = post.querySelector('.wr-merkje--eigenbank');
            if (genoemd && !merk) {
                merk = document.createElement('span');
                merk.className = 'wr-merkje wr-merkje--eigenbank';
                merk.textContent = 'jouw bank';
                post.querySelector('.wr-post__merk').append(merk);
            } else if (!genoemd && merk) {
                merk.remove();
            }
        }

        // De specificatie noemt de gekozen aanbieder en zijn declaratie-eisen,
        // dus die moet mee wisselen. Alleen na het herstellen: bereken() slaat
        // ook op, en bij het aanmelden van deze luisteraar zijn de velden nog leeg.
        if (herstelGedaan) bereken();

        melding.hidden = !bank;
        if (!bank) return;
        meldingTekst.textContent = aantal > 0
            ? `${bank.naam} noemt ${aantal} van deze posten in de eigen voorwaarden bij naam. Die staan hieronder gemarkeerd. Dat een post niet gemarkeerd is zegt niets over goedkeuring: geen enkele aanbieder publiceert een volledige lijst.`
            : `${bank.naam} publiceert geen lijst met posten die wel of niet uit het depot mogen, alleen de algemene regel dat het om verbeteringen moet gaan die vast aan de woning zitten. Hieronder is daarom niets voor jouw bank gemarkeerd; vraag twijfelgevallen schriftelijk na en bewaar het antwoord.`;
        const link = document.createElement('a');
        link.href = bank.pagina;
        link.textContent = ` Voorwaarden van ${bank.naam}`;
        meldingTekst.append(link);
    });

    /* ----------------------------------------------------------------- start */

    herstel();
    tekenEigenPosten();
    herstelGedaan = true;

    for (const v of Object.values(lr)) koppelBedragveld(v);
    koppelPercentageveld(rente);

    // Wat is ingevuld, staat open. Anders komt iemand terug op een pagina die
    // leeg lijkt, terwijl zijn bedragen achter een dichtgeklapt blok zitten.
    for (const categorie of wortel.querySelectorAll('.wr-cat')) {
        const gevuld = [...categorie.querySelectorAll('[data-post]')].some((v) => v.value.trim() !== '');
        if (gevuld || (categorie.dataset.cat === 'eigen' && eigenPosten.length)) categorie.open = true;
    }

    // Op een smal scherm staat de begroting onder het totaal. De balk houdt het
    // bedrag in beeld zodra het totaal zelf uit beeld is gescrold.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([item]) => {
            uit.vast.classList.toggle('is-zichtbaar', !item.isIntersecting && uit.vastBedrag.textContent !== '');
        }).observe(uit.totaal);
    }

    bereken();
}

startRekenpagina(initVerbouwen);
