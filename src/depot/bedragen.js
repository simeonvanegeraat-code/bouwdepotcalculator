/**
 * De bedragentabel op bouwdepot-berekenen.html: kies een rente, en de tabel
 * rekent elke rij opnieuw uit.
 *
 * De tabel staat al uitgerekend in de HTML, bij 3,80% rente. Zonder dit script
 * is hij dus gewoon te lezen; met dit script beweegt hij mee met de schuif en
 * het invoerveld ernaast. De cijfers komen uit src/domain/bedragentabel.js, en
 * tests/bedragentabel.test.mjs bewaakt dat de HTML daarmee klopt.
 *
 * Een klik op een bedrag zet dat bedrag, met de gekozen rente, in de rekentool
 * erboven. Zonder script is het een gewone link met het bedrag in het adres.
 */

import { bedragentabel, UITGELICHT, STANDAARD, RENTEGRENZEN, TABELVORMEN } from '../domain/bedragentabel.js';
import { leesPercentage, toonGetal, euro } from '../js/getallen.js';

const sectie = document.querySelector('[data-bedragen]');

if (sectie) {
    const veld = sectie.querySelector('#bt-rente');
    const schuif = sectie.querySelector('#bt-schuif');
    const fout = sectie.querySelector('#fout-bt-rente');
    const rijen = sectie.querySelector('[data-bt-rijen]');
    const zinnen = sectie.querySelector('[data-bt-zinnen]');
    const knop = sectie.querySelector('[data-bt-bouw]');
    const tabel = sectie.querySelector('table');
    const noot = sectie.querySelector('[data-bt-bouwnoot]');
    const renteTekst = sectie.querySelectorAll('[data-bt-rentetekst]');
    const vormKeuze = sectie.querySelector('#bt-vorm');
    const vormTekst = sectie.querySelectorAll('[data-bt-vormtekst]');
    const kopLast = sectie.querySelector('[data-bt-koplast]');
    const vormNoot = sectie.querySelector('[data-bt-vormnoot]');

    const procent = (r) => `${toonGetal(r, 2)}%`;
    const rond = (n) => euro.format(Math.round(n));

    let rente = STANDAARD.rentePercent;
    let vorm = STANDAARD.vorm;

    const teken = () => {
        const tabeldata = bedragentabel({ rentePercent: rente, vorm });
        const lineair = vorm === 'lineair';
        rijen.innerHTML = tabeldata.map((r) => `<tr>
            <th scope="row"><a href="bouwdepot-berekenen.html?bedrag=${r.bedrag}" data-bt-bedrag="${r.bedrag}">${rond(r.bedrag)}</a></th>
            <td>${rond(r.maandlast)}</td>
            <td>${rond(r.renteLooptijd)}</td>
            <td data-bt-kolom="bouw">${rond(r.eersteTijdens)}</td>
            <td data-bt-kolom="bouw">${rond(r.hoogsteTijdens)}</td>
        </tr>`).join('');
        zinnen.innerHTML = tabeldata.filter((r) => UITGELICHT.includes(r.bedrag)).map((r) =>
            (lineair
                ? `<li>Een bouwdepot van <strong>${rond(r.bedrag)}</strong> kost bij ${procent(rente)} rente en lineair aflossen <strong>${rond(r.maandlast)} bruto in de eerste maand</strong> na de verbouwing. Dat daalt elke maand; na vijftien jaar is het ${rond(r.naVijftienJaar)}. Over ${STANDAARD.looptijdJaren} jaar betaal je ${rond(r.renteLooptijd)} aan rente.</li>`
                : `<li>Een bouwdepot van <strong>${rond(r.bedrag)}</strong> kost bij ${procent(rente)} rente <strong>${rond(r.maandlast)} bruto per maand</strong>. Over ${STANDAARD.looptijdJaren} jaar betaal je ${rond(r.renteLooptijd)} aan rente.</li>`)).join('');
        for (const el of renteTekst) el.textContent = procent(rente);
        for (const el of vormTekst) el.textContent = TABELVORMEN[vorm];
        kopLast.textContent = lineair ? 'Eerste maand na de verbouwing' : 'Per maand, na de verbouwing';
        vormNoot.hidden = !lineair;
    };

    const zet = (waarde, bron) => {
        const binnen = Number.isFinite(waarde) && waarde >= RENTEGRENZEN.min && waarde <= RENTEGRENZEN.max;
        fout.textContent = binnen ? '' : `Vul een rente in tussen ${toonGetal(RENTEGRENZEN.min, 0)}% en ${toonGetal(RENTEGRENZEN.max, 0)}%.`;
        veld.setAttribute('aria-invalid', String(!binnen));
        if (!binnen) return;
        rente = waarde;
        if (bron !== 'veld') veld.value = toonGetal(rente, 2);
        if (bron !== 'schuif') schuif.value = String(rente);
        teken();
    };

    vormKeuze.addEventListener('change', () => { vorm = vormKeuze.value in TABELVORMEN ? vormKeuze.value : STANDAARD.vorm; teken(); });
    schuif.addEventListener('input', () => zet(Number(schuif.value), 'schuif'));
    veld.addEventListener('input', () => zet(leesPercentage(veld.value), 'veld'));
    veld.addEventListener('blur', () => { if (veld.getAttribute('aria-invalid') !== 'true') veld.value = toonGetal(rente, 2); });

    // De lasten tijdens de verbouwing: twee kolommen erbij, met de aannames.
    knop.addEventListener('click', () => {
        const aan = knop.getAttribute('aria-pressed') !== 'true';
        knop.setAttribute('aria-pressed', String(aan));
        knop.textContent = aan ? 'Verberg de lasten tijdens de verbouwing' : 'Toon ook de lasten tijdens de verbouwing';
        tabel.toggleAttribute('data-bt-met-bouw', aan);
        noot.hidden = !aan;
    });

    // Een bedrag overnemen in de rekentool erboven, zonder de pagina te herladen.
    rijen.addEventListener('click', (e) => {
        const link = e.target.closest('[data-bt-bedrag]');
        const bedragVeld = document.getElementById('input-amount');
        const renteVeld = document.getElementById('input-interest');
        if (!link || !bedragVeld || !renteVeld) return;
        e.preventDefault();
        bedragVeld.value = toonGetal(Number(link.dataset.btBedrag), 0);
        renteVeld.value = toonGetal(rente, 2);
        for (const v of [bedragVeld, renteVeld]) v.dispatchEvent(new Event('input', { bubbles: true }));
        // De rekentool erboven kent dezelfde vormen; neem de keuze mee.
        const vormVeld = document.getElementById('input-vorm');
        if (vormVeld && vormVeld.value !== vorm) {
            vormVeld.value = vorm;
            vormVeld.dispatchEvent(new Event('change', { bubbles: true }));
        }
        document.getElementById('uitkomst')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
