/**
 * bouwrente-nieuwbouw.html: invoer lezen, de rekenkern aanroepen, de uitkomst
 * tonen.
 *
 * Hier staat geen rekenregel. Alle bedragen komen uit src/domain/bouwrente.js;
 * de uitkomst, de grafiek, de tabel en het afdrukoverzicht lezen dezelfde
 * maandregels.
 *
 * Het bedragveld heette in de vorige versie input-amount. Het gedeelde
 * formuliergeheugen kent dat id als "depotbedrag", waardoor een depot van een
 * andere pagina hier als grondprijs verscheen. Het veld heeft daarom een eigen
 * id gekregen; de hypotheekrente reist nog wel mee.
 */

import { bindReportButton, startRekenpagina } from '../js/rekenpagina.js';
import {
    leesGetal, leesPercentage, euro, maakVeldlezer, koppelBedragveld, koppelPercentageveld,
} from '../js/getallen.js';
import { berekenBouwrente } from '../domain/bouwrente.js';
import { tekenTijdlijn } from '../nieuwbouw/grafiek.js';

const bedrag = (leeg, exclusiefNul = false) => ({
    lezer: leesGetal, min: 0, max: 5000000, exclusiefNul, leeg,
    teLaag: exclusiefNul ? 'Vul een bedrag boven de nul in.' : 'Een bedrag onder de nul kan niet.',
    teHoog: 'Boven vijf miljoen euro rekent deze tool niet; controleer het bedrag.',
});
const maandveld = (leeg, min) => ({
    lezer: leesGetal, min, max: 36, exclusiefNul: min > 0, leeg,
    teLaag: min > 0 ? 'Vul minstens één maand in.' : 'Minder dan nul maanden kan niet.',
    teHoog: 'Deze rekentool rekent met periodes tot 36 maanden.',
});
const rente = (leeg, teHoog) => ({
    lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false, leeg,
    teLaag: 'Een percentage onder de nul bestaat niet.', teHoog,
});

const GRENZEN = {
    'input-grond': bedrag('Vul de grondkosten in, of nul als je alleen over termijnen rente betaalt.'),
    'input-months': maandveld('Vul in over hoeveel maanden je rente over de grond betaalt.', 1),
    'input-termijnen': bedrag('Vul het bedrag van de vervallen termijnen in, of nul.'),
    'input-termijn-maanden': maandveld('Vul in hoeveel maanden die termijnen gemiddeld openstaan.', 1),
    'input-rate': rente('Vul het rentepercentage uit je overeenkomst in.', 'Boven de 20 procent rekent geen ontwikkelaar bouwrente; controleer het percentage.'),
    'input-na-tekenen': maandveld('Vul in hoeveel maanden er tussen tekenen en de notaris zitten, of nul.', 0),
    'input-mortgage-rate': rente('Vul je hypotheekrente in.', 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.'),
};

const procent = (waarde) => `${waarde.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const maanden = (n) => (n === 1 ? '1 maand' : `${n} maanden`);

function initBouwrente() {
    const el = (id) => document.getElementById(id);
    const veld = {
        grond: el('input-grond'), maandenGrond: el('input-months'), termijnen: el('input-termijnen'),
        maandenTermijnen: el('input-termijn-maanden'), rente: el('input-rate'), btw: el('input-btw'),
        naTekenen: el('input-na-tekenen'), financieren: el('input-financed'), hypotheekrente: el('input-mortgage-rate'),
    };
    const schuif = el('range-months');
    const leesVeld = maakVeldlezer(GRENZEN);
    const printknop = el('btn-download-bouwrente');
    bindReportButton(printknop);

    for (const v of [veld.grond, veld.termijnen]) koppelBedragveld(v);
    for (const v of [veld.rente, veld.hypotheekrente]) koppelPercentageveld(v);

    const uit = {
        bedrag: el('res-base'), bedragNoot: el('res-base-noot'), zin: el('res-bouwrente-conclusion'), opbouw: el('res-opbouw'),
        grond: el('res-grond'), grondNoot: el('res-grond-noot'), termijnen: el('res-termijnen'), termijnenNoot: el('res-termijnen-noot'),
        na: el('res-na'), naNoot: el('res-na-noot'), lening: el('res-financing'), leningNoot: el('res-financing-noot'), leningKop: el('dt-financing'),
        blokTermijn: el('veld-termijn-maanden'), blokHypotheek: el('mortgage-wrapper'),
        samenvatting: el('res-samenvatting'), grafiek: el('verloop-grafiek'), legendaTermijnen: el('legenda-termijnen'),
        tabel: el('details-table-body'), aannames: el('res-aannames'), vast: el('wr-vast'), vastBedrag: el('wr-vast-bedrag'),
    };
    let laatsteGrafiek = null;
    const tekenGrafiek = () => { if (laatsteGrafiek) tekenTijdlijn(uit.grafiek, laatsteGrafiek); };

    function toonGeenUitkomst(tekst = 'Pas de gemarkeerde velden aan voor een uitkomst.') {
        uit.bedrag.firstChild.textContent = '–';
        uit.zin.dataset.status = 'afwijkend';
        uit.zin.textContent = tekst;
        uit.opbouw.textContent = '';
        for (const e of [uit.grond, uit.termijnen, uit.na, uit.lening]) e.firstChild.textContent = '–';
        for (const e of [uit.grondNoot, uit.termijnenNoot, uit.naNoot, uit.leningNoot]) e.textContent = '';
        uit.samenvatting.textContent = 'Zolang de invoer niet klopt, tonen we geen grafiek: een half ingevuld formulier levert een bedrag op dat er hetzelfde uitziet als een goed bedrag.';
        uit.grafiek.innerHTML = '';
        uit.tabel.innerHTML = '';
        uit.aannames.innerHTML = '';
        uit.vast.classList.remove('is-zichtbaar');
        laatsteGrafiek = null;
        delete printknop.dataset.report;
    }

    function reken() {
        const financiert = veld.financieren.value === 'ja';
        uit.blokHypotheek.hidden = !financiert;

        // De maanden van de termijnen en de hypotheekrente doen alleen mee als
        // ze in beeld zijn; een leeg veld dat niet meedoet houdt niets tegen.
        const termijnen = leesVeld(veld.termijnen);
        const metTermijnen = termijnen !== null && termijnen > 0;
        uit.blokTermijn.hidden = !metTermijnen;
        const gelezen = {
            grond: leesVeld(veld.grond), maandenGrond: leesVeld(veld.maandenGrond), termijnen,
            maandenTermijnen: metTermijnen ? leesVeld(veld.maandenTermijnen) : 0,
            rentePercent: leesVeld(veld.rente), maandenNaTekenen: leesVeld(veld.naTekenen),
            hypotheekrentePercent: financiert ? leesVeld(veld.hypotheekrente) : 0,
        };
        if (Object.values(gelezen).some((w) => w === null)) { toonGeenUitkomst(); return; }
        if (gelezen.grond === 0 && !metTermijnen) { toonGeenUitkomst('Vul de grondkosten of het bedrag van de vervallen termijnen in.'); return; }

        const invoer = {
            ...gelezen,
            maandenGrond: Math.round(gelezen.maandenGrond), maandenTermijnen: Math.round(gelezen.maandenTermijnen),
            maandenNaTekenen: Math.round(gelezen.maandenNaTekenen),
            metBtw: veld.btw.checked, meefinancieren: financiert,
        };
        const t = berekenBouwrente(invoer);

        /* Het ene bedrag, en waar het uit bestaat. De twee delen worden exact
           afgerond; de btw is op het scherm wat er van het afgeronde totaal
           overblijft, zodat de regel optelt. */
        const totaal = Math.round(t.totaal), grond = Math.round(t.renteGrond), term = Math.round(t.renteTermijnen);
        uit.bedrag.firstChild.textContent = euro.format(totaal);
        uit.bedragNoot.textContent = invoer.metBtw ? 'inclusief btw, af te rekenen bij de notaris' : 'af te rekenen bij de notaris';
        delete uit.zin.dataset.status;
        uit.zin.textContent = `Zoveel rente rekent de ontwikkelaar bij ${procent(invoer.rentePercent)} tot aan de notaris.`;
        uit.opbouw.textContent = [
            grond > 0 ? `${euro.format(grond)} over de grond` : '',
            term > 0 ? `${euro.format(term)} over vervallen termijnen` : '',
            invoer.metBtw ? `${euro.format(totaal - grond - term)} btw` : '',
        ].filter(Boolean).join(', ') + '.';

        uit.grond.firstChild.textContent = euro.format(grond);
        uit.grondNoot.textContent = invoer.grond > 0 ? `${euro.format(invoer.grond)} over ${maanden(invoer.maandenGrond)}` : 'geen grondkosten ingevuld';
        uit.termijnen.firstChild.textContent = euro.format(term);
        uit.termijnenNoot.textContent = metTermijnen ? `${euro.format(invoer.termijnen)} over gemiddeld ${maanden(t.invoer.maandenTermijnen)}` : 'geen vervallen termijnen ingevuld';
        uit.na.firstChild.textContent = euro.format(t.naTekenen);
        uit.naNoot.textContent = t.invoer.maandenNaTekenen > 0
            ? `over de laatste ${maanden(t.invoer.maandenNaTekenen)}; de rest (${euro.format(t.voorTekenen)}) hoort fiscaal bij de koopsom`
            : 'alles valt vóór het tekenen en hoort fiscaal bij de koopsom';
        uit.leningKop.textContent = financiert ? 'Erbij per maand, als je meefinanciert' : 'Betaal je zelf';
        uit.lening.firstChild.textContent = financiert ? euro.format(t.extraMaandlast) : euro.format(totaal);
        uit.leningNoot.textContent = financiert
            ? `dertig jaar lang; daarover betaal je ${euro.format(t.renteOverLooptijd)} hypotheekrente`
            : 'in één keer bij de notaris, zonder extra maandlast';
        uit.vastBedrag.textContent = euro.format(totaal);

        /* Grafiek: wat er maand voor maand is opgelopen, tot de notaris. */
        const samenvatting = `De rente loopt ${maanden(t.duur)} op tot ${euro.format(t.totaal)} bij de notaris`
            + (t.invoer.maandenNaTekenen > 0 && t.tekenmaand > 0 ? `. Bij het tekenen, na maand ${t.tekenmaand}, stond de teller op ${euro.format(t.regels[t.tekenmaand - 1].totaal)}` : '')
            + (financiert ? `. Financier je het mee, dan betaal je in totaal ${euro.format(t.totaalMetFinanciering)} terug.` : '.');
        uit.samenvatting.textContent = samenvatting;
        laatsteGrafiek = {
            regels: t.regels.map((x) => ({ maand: x.maand, woonlast: x.grond, hypotheek: x.termijnen, totaal: x.totaal })),
            piek: null,
            // Geen streep als er na het tekenen niets meer loopt, of alles erna valt.
            oplevermaand: t.invoer.maandenNaTekenen > 0 && t.tekenmaand > 0 ? t.tekenmaand : t.duur,
            eindeOverlap: t.duur, merkTekst: 'je tekent',
            omschrijving: `Staafgrafiek van de opgelopen bouwrente per maand, over ${maanden(t.duur)}. ${samenvatting}`,
        };
        // De grafiek kent een tweede streep voor "woonlast stopt"; die hoort hier niet.
        laatsteGrafiek.eindeOverlap = laatsteGrafiek.oplevermaand;
        uit.legendaTermijnen.hidden = !metTermijnen;
        tekenGrafiek();

        /* Tabel: dezelfde regels als de grafiek. */
        uit.tabel.innerHTML = t.regels.map((x) => `<tr${x.maand === t.tekenmaand && t.invoer.maandenNaTekenen > 0 ? ' data-grens' : ''}>
            <td>${x.maand}</td><td>${euro.format(x.grond)}</td>
            <td>${x.termijnen > 0.005 ? euro.format(x.termijnen) : '–'}</td>
            <td>${euro.format(x.totaal)}</td></tr>`).join('');

        /* Aannames: de invoer waarmee is gerekend, leesbaar terug. */
        uit.aannames.innerHTML = [
            ['Rentepercentage', procent(invoer.rentePercent)],
            ['Grondkosten', invoer.grond > 0 ? `${euro.format(invoer.grond)}, ${maanden(invoer.maandenGrond)}` : 'geen'],
            ['Vervallen termijnen', metTermijnen ? `${euro.format(invoer.termijnen)}, gemiddeld ${maanden(t.invoer.maandenTermijnen)}` : 'geen'],
            ['Btw over de rente', invoer.metBtw ? '21%' : 'niet meegerekend'],
            ['Tussen tekenen en notaris', maanden(t.invoer.maandenNaTekenen)],
            ['Meefinancieren', financiert ? `ja, tegen ${procent(invoer.hypotheekrentePercent)} over 30 jaar` : 'nee, uit eigen geld'],
        ].map(([naam, waarde]) => `<dt>${naam}</dt><dd>${waarde}</dd>`).join('');

        /* Afdrukoverzicht. Een lege waarde laat reporting.js weg. */
        printknop.dataset.report = JSON.stringify({
            toolId: 'bouwrente-nieuwbouw',
            toolTitle: 'Bouwrente bij nieuwbouw',
            generatedAt: new Date().toISOString(),
            inputs: {
                rate: invoer.rentePercent,
                landCost: invoer.grond || null,
                months: invoer.maandenGrond,
                dueInstalments: metTermijnen ? invoer.termijnen : null,
                dueMonths: metTermijnen ? t.invoer.maandenTermijnen : null,
                vatOnInterest: invoer.metBtw,
                monthsAfterSigning: t.invoer.maandenNaTekenen,
                financed: financiert,
                mortgageRate: financiert ? invoer.hypotheekrentePercent : null,
            },
            results: {
                totalIndicativeBouwrente: t.totaal,
                interestOnLand: t.renteGrond,
                interestOnInstalments: metTermijnen ? t.renteTermijnen : null,
                vatAmount: invoer.metBtw ? t.btw : null,
                afterSigning: t.naTekenen,
                extraMonthly: financiert ? t.extraMaandlast : null,
                financingImpact: financiert ? t.renteOverLooptijd : null,
                totalIncludingFinancingImpact: financiert ? t.totaalMetFinanciering : null,
            },
            conclusion: `${uit.zin.textContent} ${uit.opbouw.textContent}`,
            interpretation: samenvatting,
            tables: [{
                title: 'Opgelopen rente, maand voor maand',
                columns: [
                    { key: 'maand', label: 'Mnd', type: 'text' },
                    { key: 'grond', label: 'Over de grond', type: 'currency' },
                    { key: 'termijnen', label: 'Over vervallen termijnen', type: 'currency' },
                    { key: 'totaal', label: 'Opgelopen', type: 'currency' },
                ],
                rows: t.regels,
            }],
            assumptions: 'Indicatieve berekening met enkelvoudige rente over hele maanden. De afrekening van de notaris volgt de exacte data en het werkelijke termijnverloop en is leidend. Het belastingeffect is niet uitgerekend.',
        });
    }

    /* -------------------------------- binden -------------------------------- */

    for (const v of [veld.grond, veld.termijnen, veld.maandenTermijnen, veld.rente, veld.naTekenen, veld.hypotheekrente]) v.addEventListener('input', reken);
    for (const v of [veld.btw, veld.financieren]) v.addEventListener('change', reken);
    schuif.addEventListener('input', () => { veld.maandenGrond.value = schuif.value; reken(); });
    veld.maandenGrond.addEventListener('input', () => {
        const getal = leesGetal(veld.maandenGrond.value);
        if (getal !== null) schuif.value = getal;
        reken();
    });

    if ('ResizeObserver' in window) {
        let breedte = 0;
        new ResizeObserver(([item]) => {
            const nieuw = Math.round(item.contentRect.width);
            if (nieuw === breedte) return;
            breedte = nieuw;
            tekenGrafiek();
        }).observe(uit.grafiek);
    }
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([item]) => {
            const heeftUitkomst = uit.vastBedrag.textContent.trim() !== '' && !uit.zin.dataset.status;
            uit.vast.classList.toggle('is-zichtbaar', !item.isIntersecting && heeftUitkomst);
        }).observe(el('uitkomst'));
    }

    reken();
}

startRekenpagina(initBouwrente);
