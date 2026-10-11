/**
 * Het scherm waar je het termijnschema van je bouwer invult: één regel per
 * termijn, in dezelfde rust als de stappen ervoor.
 *
 * De percentages hier zijn die van je aannemingsovereenkomst: een deel van de
 * aanneemsom zónder meerwerk (koopsom min grond). Meerwerk dat je
 * meefinanciert loopt met de termijnen mee, of krijgt eigen betaalmomenten.
 * De rekentool kent maar één soort termijn, een deel van aanneemsom plus
 * meerwerk; het omrekenen daarheen en terug staat in stappenlogica.js
 * (naarTermijnen, uitTermijnen), met tests.
 *
 * Rekent zelf niets uit. Bij "Toon mijn overzicht" gaan de termijnen terug naar
 * wie het scherm opende; de rekentool neemt ze over via nieuwbouw:zet-schema.
 */

import { euro, leesGetal, leesPercentage, toonGetal } from '../js/getallen.js';
import { MAX_TERMIJNEN, controleerSchemaInvoer, naarTermijnen, schemaTotaal, uitTermijnen } from './stappenlogica.js';

const rond2 = (n) => Math.round(n * 100) / 100;
const procent = (n) => `${toonGetal(rond2(n), Number.isInteger(rond2(n)) ? 0 : 2)}%`;

/**
 * @param {HTMLFormElement} formulier
 * @param {object} haken
 * @param {() => number} haken.bouwduur        de bouwduur in maanden, zoals nu ingevuld
 * @param {(termijnen: object[]|null) => void} haken.klaar  het schema, of null voor het voorbeeld
 * @param {() => void} haken.terug             sluiten zonder iets te wijzigen
 */
export function maakSchemascherm(formulier, { bouwduur, klaar, terug }) {
    const deel = (naam) => formulier.querySelector(`[data-sc-${naam}]`);
    const lijst = deel('lijst'), totaalregel = deel('totaal'), fout = formulier.querySelector('[data-st-fout]');
    const meerwerkvak = deel('meerwerk'), meerwerklijst = deel('meerwerklijst'), meerwerktotaal = deel('meerwerktotaal');
    const stapel = deel('stapel'), dak = deel('dak'), stapeltekst = deel('stapeltekst');
    // basis: de aanneemsom uit de overeenkomst (koopsom min grond); meerwerk komt daar bovenop.
    let m = { rijen: [], apart: false, meerwerkRijen: [] }, basis = 0, meerwerk = 0;
    const soort = () => formulier.querySelector('input[name="sc-soort"]:checked').value;
    const invoer = () => ({ ...m, basis, meerwerk });

    const afgeleid = (r) => {
        if (r.percent === null) return '';
        return soort() === 'bedrag' ? `is ${procent(r.percent)}` : `is ${euro.format((r.percent / 100) * basis)}`;
    };

    /* --- het bouwwerkje rechts: elke termijn een laag, het dak erop bij 100% --- */

    function tekenStapel() {
        const termijnen = naarTermijnen(invoer()).map((t) => ({ ...t, percent: t.percent > 0 ? t.percent : 0, maand: t.maand ?? 99 }))
            .filter((t) => t.percent > 0).sort((a, b) => a.maand - b.maand);
        const som = termijnen.reduce((s, t) => s + t.percent, 0);
        const schaal = Math.max(100, som);
        // Bestaande lagen hergebruiken: dan groeit of krimpt een laag in plaats van te verspringen.
        while (stapel.children.length > termijnen.length) stapel.lastElementChild.remove();
        while (stapel.children.length < termijnen.length) stapel.append(Object.assign(document.createElement('div'), { className: 'nb-stapel__laag' }));
        termijnen.forEach((t, i) => {
            const laag = stapel.children[i];
            laag.style.height = `${(t.percent / schaal) * 100}%`;
            laag.dataset.soort = t.soort ?? (i % 2 ? 'b' : 'a');
            // Een dunne laag heeft geen plek voor tekst.
            laag.textContent = t.percent / schaal > 0.07 ? (t.maand === 99 ? 'maand ?' : `maand ${t.maand}`) : '';
        });
        const af = controleerSchemaInvoer(invoer(), bouwduur()) === '';
        dak.classList.toggle('is-erop', af);
        stapeltekst.textContent = af ? 'Het schema is rond.' : som > 100.05 ? 'Er is meer verdeeld dan er is.' : 'Elke termijn is een laag. Bij 100% gaat het dak erop.';
    }

    function werkTotaalBij() {
        const { totaal, rest } = schemaTotaal(m.rijen);
        const bedrag = (p) => euro.format((Math.abs(p) / 100) * basis);
        totaalregel.dataset.status = Math.abs(rest) <= 0.1 ? 'goed' : 'open';
        totaalregel.innerHTML = Math.abs(rest) <= 0.1 ? `Samen <strong>100%</strong><span> · de hele aanneemsom van ${euro.format(basis)}</span>`
            : rest > 0 ? `Samen <strong>${procent(totaal)}</strong><span> · nog ${procent(rest)} (${bedrag(rest)}) te verdelen</span>`
            : `Samen <strong>${procent(totaal)}</strong><span> · ${procent(-rest)} (${bedrag(rest)}) te veel</span>`;
        if (m.apart) {
            const som = m.meerwerkRijen.reduce((s, r) => s + (r.bedrag > 0 ? r.bedrag : 0), 0);
            const over = meerwerk - som;
            meerwerktotaal.dataset.status = Math.abs(over) <= 1 ? 'goed' : 'open';
            meerwerktotaal.innerHTML = Math.abs(over) <= 1 ? `Samen <strong>${euro.format(meerwerk)}</strong><span> · al je meerwerk</span>`
                : over > 0 ? `Samen <strong>${euro.format(som)}</strong><span> · nog ${euro.format(over)} te verdelen</span>`
                : `Samen <strong>${euro.format(som)}</strong><span> · ${euro.format(-over)} te veel</span>`;
        }
        const vol = m.rijen.length + (m.apart ? m.meerwerkRijen.length : 0) >= MAX_TERMIJNEN;
        deel('erbij').disabled = vol;
        deel('meerwerkerbij').disabled = vol;
        tekenStapel();
    }

    const rijHtml = (id, nr, kop, metBedrag, voorbeeld) => `
        <p class="nb-termijn__nr">${kop}</p>
        <button type="button" class="nb-termijn__weg" aria-label="${kop} verwijderen" title="${kop} verwijderen">&times;</button>
        <div class="nb-veld nb-termijn__naam">
            <label for="${id}-naam-${nr}">Omschrijving</label>
            <div class="wr-veld__in"><input type="text" id="${id}-naam-${nr}" maxlength="60" autocomplete="off" placeholder="${voorbeeld}"></div>
        </div>
        <div class="nb-veld">
            <label for="${id}-maand-${nr}">Bouwmaand</label>
            <div class="wr-veld__in"><input type="text" id="${id}-maand-${nr}" inputmode="numeric" autocomplete="off"></div>
        </div>
        <div class="nb-veld">
            <label for="${id}-deel-${nr}">${metBedrag ? 'Bedrag' : 'Percentage'}</label>
            <div class="wr-veld__in">${metBedrag ? '<span aria-hidden="true">&euro;</span>' : ''}<input type="text" id="${id}-deel-${nr}" inputmode="decimal" autocomplete="off" aria-describedby="${id}-afgeleid-${nr}">${metBedrag ? '' : '<span aria-hidden="true">%</span>'}</div>
            <p class="wr-hulp" id="${id}-afgeleid-${nr}"></p>
        </div>`;

    function teken() {
        const metBedrag = soort() === 'bedrag';
        lijst.innerHTML = '';
        m.rijen.forEach((r, i) => {
            const li = document.createElement('li');
            li.className = 'nb-termijn';
            li.innerHTML = rijHtml('sc', i + 1, `Termijn ${i + 1}`, metBedrag, 'Bijvoorbeeld: ruwe begane grondvloer');
            const [naam, maand, waarde] = li.querySelectorAll('input');
            const hulp = li.querySelector('.wr-hulp');
            naam.value = r.naam;
            maand.value = r.maand === null ? '' : String(r.maand);
            waarde.value = r.percent === null ? '' : metBedrag ? toonGetal(Math.round((r.percent / 100) * basis)) : toonGetal(rond2(r.percent), Number.isInteger(rond2(r.percent)) ? 0 : 2);
            hulp.textContent = afgeleid(r);
            naam.addEventListener('input', () => { r.naam = naam.value; });
            maand.addEventListener('input', () => { r.maand = leesGetal(maand.value); tekenStapel(); });
            waarde.addEventListener('input', () => {
                // Een bedrag wordt een deel van de aanneemsom: daar rekent de tool mee.
                const n = metBedrag ? leesGetal(waarde.value) : leesPercentage(waarde.value);
                r.percent = n === null ? null : metBedrag ? (basis > 0 ? (n / basis) * 100 : null) : n;
                hulp.textContent = afgeleid(r);
                werkTotaalBij();
            });
            li.querySelector('.nb-termijn__weg').addEventListener('click', () => {
                m.rijen.splice(i, 1);
                teken();
                (lijst.querySelector('input') ?? deel('erbij')).focus();
            });
            lijst.append(li);
        });

        // Meerwerk: alleen als je het meefinanciert, en alleen regels als het apart betaald wordt.
        meerwerkvak.hidden = !(meerwerk > 0);
        deel('meerwerkbedrag').textContent = euro.format(meerwerk);
        formulier.querySelector(`input[name="sc-meerwerk"][value="${m.apart ? 'apart' : 'mee'}"]`).checked = true;
        deel('meerwerkapart').hidden = !m.apart;
        meerwerklijst.innerHTML = '';
        m.meerwerkRijen.forEach((r, i) => {
            const li = document.createElement('li');
            li.className = 'nb-termijn';
            li.innerHTML = rijHtml('scm', i + 1, `Meerwerk ${i + 1}`, true, 'Bijvoorbeeld: keuken');
            const [naam, maand, waarde] = li.querySelectorAll('input');
            naam.value = r.naam;
            maand.value = r.maand === null ? '' : String(r.maand);
            waarde.value = r.bedrag === null ? '' : toonGetal(Math.round(r.bedrag));
            naam.addEventListener('input', () => { r.naam = naam.value; });
            maand.addEventListener('input', () => { r.maand = leesGetal(maand.value); tekenStapel(); });
            waarde.addEventListener('input', () => { r.bedrag = leesGetal(waarde.value); werkTotaalBij(); });
            li.querySelector('.nb-termijn__weg').addEventListener('click', () => {
                m.meerwerkRijen.splice(i, 1);
                teken();
                (meerwerklijst.querySelector('input') ?? deel('meerwerkerbij')).focus();
            });
            meerwerklijst.append(li);
        });
        werkTotaalBij();
    }

    deel('erbij').addEventListener('click', () => {
        m.rijen.push({ naam: '', maand: null, percent: null });
        teken();
        lijst.lastElementChild.querySelector('input').focus();
    });
    deel('meerwerkerbij').addEventListener('click', () => {
        m.meerwerkRijen.push({ naam: '', maand: null, bedrag: null });
        teken();
        meerwerklijst.lastElementChild.querySelector('input').focus();
    });
    for (const keuze of formulier.querySelectorAll('input[name="sc-soort"]')) keuze.addEventListener('change', teken);
    for (const keuze of formulier.querySelectorAll('input[name="sc-meerwerk"]')) {
        keuze.addEventListener('change', () => {
            m.apart = keuze.value === 'apart';
            // Eén regel om mee te beginnen, met het hele bedrag; de maand vul je zelf in.
            if (m.apart && m.meerwerkRijen.length === 0) m.meerwerkRijen.push({ naam: '', maand: null, bedrag: meerwerk });
            teken();
        });
    }

    formulier.addEventListener('submit', (e) => {
        e.preventDefault();
        const melding = controleerSchemaInvoer(invoer(), bouwduur());
        fout.textContent = melding;
        if (melding) return;
        klaar(naarTermijnen(invoer()));
    });
    deel('terug').addEventListener('click', terug);
    deel('voorbeeld').addEventListener('click', () => klaar(null));

    return {
        /**
         * Zet het scherm klaar met het schema waar de rekentool nu mee rekent.
         * @param {{schema: object[], basis: number, meerwerk: number}} stand
         */
        open(stand) {
            basis = stand.basis;
            meerwerk = stand.meerwerk;
            m = uitTermijnen(stand.schema, basis, meerwerk);
            deel('aanneemsom').textContent = euro.format(basis);
            deel('bouwduur').textContent = String(bouwduur());
            fout.textContent = '';
            teken();
        },
    };
}
