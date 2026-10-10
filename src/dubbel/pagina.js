/**
 * dubbele-lasten-nieuwbouw.html: invoer lezen, de rekenkern aanroepen, de
 * uitkomst tonen.
 *
 * Hier staat geen rekenregel. Alle bedragen komen uit
 * src/domain/dubbelelasten.js; de uitkomst, de grafiek, de tabel en het
 * afdrukoverzicht lezen dezelfde maandregels.
 *
 * De veld-id's zijn die van de vorige versie. Het gedeelde formuliergeheugen
 * (src/js/shared-form-memory.js) herkent de huidige woonlast daaraan.
 */

import { bindReportButton, startRekenpagina } from '../js/rekenpagina.js';
import { leesGetal, toonGetal, euro, maakVeldlezer, koppelBedragveld } from '../js/getallen.js';
import { berekenOverlap } from '../domain/dubbelelasten.js';
import { tekenTijdlijn } from '../nieuwbouw/grafiek.js';

const bedrag = (leeg, wat, exclusiefNul = false) => ({
    lezer: leesGetal, min: 0, max: 100000, exclusiefNul, leeg,
    teLaag: exclusiefNul ? 'Vul een bedrag boven de nul in.' : `Een ${wat} onder de nul bestaat niet.`,
    teHoog: 'Boven de honderdduizend euro per maand rekent deze tool niet.',
});

const GRENZEN = {
    'input-dubbel-current': bedrag('Vul je huidige woonlast in, of nul als je die niet hebt.', 'woonlast'),
    'input-dubbel-new-bruto': bedrag('Vul de maandlast van je nieuwe hypotheek in.', 'maandlast', true),
    'input-dubbel-vergoeding': bedrag('Vul de depotvergoeding per maand in, of nul.', 'vergoeding'),
    'input-dubbel-extra': bedrag('Vul je extra vaste lasten in, of nul als je die niet hebt.', 'kostenpost'),
    'input-dubbel-months': {
        lezer: leesGetal, min: 1, max: 36, exclusiefNul: true,
        leeg: 'Vul in hoeveel maanden de overlap duurt.',
        teLaag: 'Een overlap begint bij één maand.',
        teHoog: 'Deze rekentool rekent met een overlap tot 36 maanden.',
    },
    'input-dubbel-langer': {
        lezer: leesGetal, min: 0, max: 12, exclusiefNul: false,
        leeg: 'Vul in hoeveel maanden het langer duurt, of nul.',
        teLaag: 'Minder dan nul maanden kan niet.',
        teHoog: 'Deze rekentool rekent met hooguit twaalf maanden uitloop.',
    },
};

const maanden = (n) => (n === 1 ? '1 maand' : `${n} maanden`);
const SITUATIE = {
    huur: { naam: 'Huurwoning en nieuwbouw', oud: 'je huur', stopt: 'na je opzegtermijn', uitloop: 'Zeg je de huur later op, of schuift de oplevering?' },
    koop: { naam: 'Koopwoning en nieuwbouw', oud: 'je oude hypotheek', stopt: 'als de verkoop rond is', uitloop: 'Duurt de verkoop langer, of schuift de oplevering?' },
};

function initDubbel() {
    const el = (id) => document.getElementById(id);
    const veld = {
        soort: el('input-dubbel-type'), huidig: el('input-dubbel-current'), nieuw: el('input-dubbel-new-bruto'),
        vergoeding: el('input-dubbel-vergoeding'), extra: el('input-dubbel-extra'), duur: el('input-dubbel-months'),
        langer: el('input-dubbel-langer'),
    };
    const schuifDuur = el('range-dubbel-months');
    const schuifLanger = el('range-dubbel-langer');
    const leesVeld = maakVeldlezer(GRENZEN);
    const printknop = el('btn-download-dubbel');
    bindReportButton(printknop);

    for (const v of [veld.huidig, veld.nieuw, veld.vergoeding, veld.extra]) koppelBedragveld(v);

    const uit = {
        bedrag: el('res-dubbel-monthly'), zin: el('res-dubbel-conclusion'), opbouw: el('res-opbouw'),
        bovenop: el('res-bovenop'), totaalBovenop: el('res-totaal-bovenop'), totaalBovenopNoot: el('res-totaal-bovenop-noot'),
        totaal: el('res-dubbel-total'), totaalNoot: el('res-dubbel-total-noot'), daarna: el('res-daarna'),
        soortNoot: el('dubbel-type-note'), uitloopKop: el('uitloop-kop'), scenario: el('res-scenario'),
        samenvatting: el('res-samenvatting'), grafiek: el('verloop-grafiek'), legendaBasis: el('legenda-basis'),
        tabel: el('details-table-body'), aannames: el('res-aannames'), vast: el('wr-vast'), vastBedrag: el('wr-vast-bedrag'),
    };
    let laatsteGrafiek = null;
    const tekenGrafiek = () => { if (laatsteGrafiek) tekenTijdlijn(uit.grafiek, laatsteGrafiek); };

    function toonGeenUitkomst() {
        uit.bedrag.firstChild.textContent = '–';
        uit.zin.dataset.status = 'afwijkend';
        uit.zin.textContent = 'Pas de gemarkeerde velden aan voor een uitkomst.';
        uit.opbouw.textContent = '';
        for (const e of [uit.bovenop, uit.totaalBovenop, uit.totaal, uit.daarna]) e.firstChild.textContent = '–';
        uit.scenario.textContent = '';
        uit.samenvatting.textContent = 'Zolang de invoer niet klopt, tonen we geen grafiek: een half ingevuld formulier levert een bedrag op dat er hetzelfde uitziet als een goed bedrag.';
        uit.grafiek.innerHTML = '';
        uit.tabel.innerHTML = '';
        uit.aannames.innerHTML = '';
        uit.vast.classList.remove('is-zichtbaar');
        laatsteGrafiek = null;
        delete printknop.dataset.report;
    }

    function reken() {
        const s = SITUATIE[veld.soort.value] ?? SITUATIE.huur;
        uit.soortNoot.textContent = `Je betaalt ${s.oud} door tot die stopt: ${s.stopt}.`;
        uit.uitloopKop.textContent = s.uitloop;

        const gelezen = {
            huidig: leesVeld(veld.huidig), nieuw: leesVeld(veld.nieuw), vergoeding: leesVeld(veld.vergoeding),
            extra: leesVeld(veld.extra), maanden: leesVeld(veld.duur), langer: leesVeld(veld.langer),
        };
        if (Object.values(gelezen).some((w) => w === null)) { toonGeenUitkomst(); return; }

        const invoer = { ...gelezen, maanden: Math.round(gelezen.maanden), langer: Math.round(gelezen.langer) };
        const basis = berekenOverlap({ ...invoer, langer: 0 });
        const t = invoer.langer > 0 ? berekenOverlap(invoer) : basis;

        /* Het ene bedrag, en waar het uit bestaat. */
        uit.bedrag.firstChild.textContent = euro.format(t.perMaand);
        delete uit.zin.dataset.status;
        uit.zin.textContent = `Zoveel betaal je per maand zolang ${s.oud} en je nieuwe hypotheek tegelijk lopen: ${maanden(t.duur)}.`;
        uit.opbouw.textContent = [
            `${euro.format(invoer.huidig)} ${s.oud.replace('je ', '')}`,
            `${euro.format(t.nieuwNaVergoeding)} nieuwe hypotheek${invoer.vergoeding > 0 ? ` na ${euro.format(invoer.vergoeding)} depotvergoeding` : ''}`,
            invoer.extra > 0 ? `${euro.format(invoer.extra)} extra lasten` : '',
        ].filter(Boolean).join(', ') + '.';

        uit.bovenop.firstChild.textContent = euro.format(t.bovenop);
        uit.totaalBovenop.firstChild.textContent = euro.format(t.totaalBovenop);
        uit.totaalBovenopNoot.textContent = `in ${maanden(t.duur)}, bovenop ${s.oud}`;
        uit.totaal.firstChild.textContent = euro.format(t.totaal);
        uit.totaalNoot.textContent = `alles bij elkaar, in ${maanden(t.duur)}`;
        uit.daarna.firstChild.textContent = euro.format(t.daarna);
        uit.vastBedrag.textContent = euro.format(t.perMaand);

        /* Het scenario: wat uitloop kost. */
        uit.scenario.textContent = invoer.langer > 0
            ? `${maanden(invoer.langer)[0].toUpperCase()}${maanden(invoer.langer).slice(1)} langer kost ${euro.format(t.uitloopKost)} extra: zoveel langer betaal je ${s.oud}${invoer.extra > 0 ? ' en de extra lasten' : ''} door. De overlap duurt dan ${maanden(t.duur)}.`
            : 'Schuif om te zien wat elke maand uitloop kost. De grafiek, de tabel en de bedragen hierboven rekenen mee.';

        /* Grafiek en de zin eronder. */
        const samenvatting = `Je betaalt ${maanden(t.duur)} lang ${euro.format(t.perMaand)} per maand. Vanaf maand ${t.duur + 1} betaal je alleen je nieuwe hypotheek: ${euro.format(t.daarna)}.`
            + (invoer.vergoeding > 0 ? ' De depotvergoeding is dan vervallen, omdat het depot leeg is.' : '');
        uit.samenvatting.textContent = samenvatting;
        // De basis over evenveel maanden, om als lijn onder het scenario te leggen.
        const basisRegels = invoer.langer > 0
            ? t.regels.map((r) => ({ totaal: r.maand <= basis.duur ? basis.perMaand : basis.daarna }))
            : null;
        laatsteGrafiek = {
            regels: t.regels.map((r) => ({ maand: r.maand, woonlast: r.huidig + r.extra, hypotheek: r.nieuw, totaal: r.totaal })),
            piek: null, oplevermaand: t.duur, eindeOverlap: t.duur, merkTekst: 'overlap stopt', basis: basisRegels,
            omschrijving: `Staafgrafiek van de maandlast over ${t.regels.length} maanden. ${samenvatting}`,
        };
        uit.legendaBasis.hidden = invoer.langer === 0;
        tekenGrafiek();

        /* Tabel: dezelfde regels als de grafiek. */
        const FASE = { overlap: 'Overlap', uitloop: 'Uitloop', na: 'Alleen nieuw' };
        uit.tabel.innerHTML = t.regels.map((r) => `<tr data-fase="${r.fase === 'na' ? 'na' : 'bouw'}"${r.maand === t.duur ? ' data-grens' : ''}>
            <td>${r.maand}</td><td>${FASE[r.fase]}</td>
            <td>${r.huidig ? euro.format(r.huidig) : '–'}</td>
            <td>${r.extra ? euro.format(r.extra) : '–'}</td>
            <td>${euro.format(r.nieuw)}</td>
            <td>${euro.format(r.totaal)}</td></tr>`).join('');

        /* Aannames: de invoer waarmee is gerekend, leesbaar terug. */
        uit.aannames.innerHTML = [
            ['Situatie', s.naam],
            ['Huidige woonlast', `${euro.format(invoer.huidig)} per maand`],
            ['Nieuwe hypotheek', `${euro.format(invoer.nieuw)} per maand`],
            ['Depotvergoeding', invoer.vergoeding > 0 ? `${euro.format(invoer.vergoeding)} per maand` : 'niet ingevuld'],
            ['Extra vaste lasten', invoer.extra > 0 ? `${euro.format(invoer.extra)} per maand` : 'geen'],
            ['Overlap', maanden(invoer.maanden) + (invoer.langer ? ` + ${maanden(invoer.langer)} uitloop` : '')],
        ].map(([naam, waarde]) => `<dt>${naam}</dt><dd>${waarde}</dd>`).join('');

        /* Afdrukoverzicht. Een lege waarde laat reporting.js weg. */
        printknop.dataset.report = JSON.stringify({
            toolId: 'dubbele-lasten-nieuwbouw',
            toolTitle: 'Dubbele lasten tijdens de nieuwbouw',
            generatedAt: new Date().toISOString(),
            inputs: {
                situationType: s.naam,
                currentHousingMonthly: invoer.huidig,
                newHousingMonthlyUsed: invoer.nieuw,
                monthlyCompensation: invoer.vergoeding || null,
                extraOverlapMonthly: invoer.extra || null,
                overlapMonths: invoer.maanden,
                overlapLonger: invoer.langer || null,
            },
            results: {
                totalDoubleMonthlyBurden: t.perMaand,
                extraOnTop: t.bovenop,
                extraOnTopTotal: t.totaalBovenop,
                totalOverlapCost: t.totaal,
                monthlyAfter: t.daarna,
            },
            conclusion: `${uit.zin.textContent} ${uit.opbouw.textContent}`,
            interpretation: samenvatting,
            tables: [{
                title: 'Maand voor maand',
                columns: [
                    { key: 'maand', label: 'Mnd', type: 'text' },
                    { key: 'huidig', label: 'Huidige woonlast', type: 'currency' },
                    { key: 'extra', label: 'Extra lasten', type: 'currency' },
                    { key: 'nieuw', label: 'Nieuwe hypotheek', type: 'currency' },
                    { key: 'totaal', label: 'Samen', type: 'currency' },
                ],
                rows: t.regels.map(({ maand, huidig, extra, nieuw, totaal }) => ({ maand, huidig, extra, nieuw, totaal })),
            }],
            assumptions: 'Indicatieve berekening met de vaste maandbedragen die je zelf hebt ingevuld. Er wordt niet gerekend aan rente, aflossing of belasting. Werkelijke maandlasten kunnen per maand verschillen door bouwtermijnen, oplevering en verhuisdatum.',
        });
    }

    /* -------------------------------- binden -------------------------------- */

    for (const v of [veld.huidig, veld.nieuw, veld.vergoeding, veld.extra]) v.addEventListener('input', reken);
    veld.soort.addEventListener('change', reken);
    const koppelSchuif = (invoerveld, schuif) => {
        schuif.addEventListener('input', () => { invoerveld.value = schuif.value; reken(); });
        invoerveld.addEventListener('input', () => {
            const getal = leesGetal(invoerveld.value);
            if (getal !== null) schuif.value = getal;
            reken();
        });
    };
    koppelSchuif(veld.duur, schuifDuur);
    koppelSchuif(veld.langer, schuifLanger);
    el('reset-scenario-btn').addEventListener('click', () => { veld.langer.value = '0'; schuifLanger.value = 0; reken(); });

    for (const knop of document.querySelectorAll('[data-voorbeeld]')) {
        knop.addEventListener('click', () => {
            const d = knop.dataset;
            veld.soort.value = d.soort;
            veld.huidig.value = toonGetal(Number(d.huidig));
            veld.nieuw.value = toonGetal(Number(d.nieuw));
            veld.vergoeding.value = toonGetal(Number(d.vergoeding));
            veld.extra.value = toonGetal(Number(d.extra));
            veld.duur.value = d.maanden;
            schuifDuur.value = d.maanden;
            veld.langer.value = '0';
            schuifLanger.value = 0;
            reken();
        });
    }

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

startRekenpagina(initDubbel);
