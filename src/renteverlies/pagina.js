/**
 * renteverlies-bouwdepot.html: invoer lezen, de rekenkern aanroepen, de
 * uitkomst tonen.
 *
 * Hier staat geen rekenregel. Alle bedragen komen uit
 * src/domain/renteverlies.js; de uitkomst, de grafiek, de tabel en het
 * afdrukoverzicht lezen dezelfde maandregels.
 *
 * De veld-id's zijn die van de vorige versie van de pagina. Het gedeelde
 * formuliergeheugen (src/js/shared-form-memory.js) herkent depotbedrag, rente
 * en vergoeding daaraan.
 */

import { bindReportButton, startRekenpagina } from '../js/rekenpagina.js';
import { opBankwissel, vergoedingsTarief } from '../js/bankkeuze.js';
import {
    leesGetal, leesPercentage, toonGetal, euro, maakVeldlezer, koppelBedragveld, koppelPercentageveld,
} from '../js/getallen.js';
import { OPNAMEPATRONEN } from '../domain/bouwdepot.js';
import { berekenRenteverlies, REKENMODELLEN } from '../domain/renteverlies.js';
import { tekenTijdlijn } from '../nieuwbouw/grafiek.js';

const GRENZEN = {
    'input-renteverlies-depot': {
        lezer: leesGetal, min: 0, max: 1000000, exclusiefNul: true,
        leeg: 'Vul het bedrag van je bouwdepot in.',
        teLaag: 'Vul een depotbedrag boven de nul in.',
        teHoog: 'Boven een miljoen euro is geen bouwdepot meer; controleer het bedrag.',
    },
    'input-renteverlies-hypotheek': {
        lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
        leeg: 'Vul je hypotheekrente in.',
        teLaag: 'Een rente onder de nul procent bestaat niet; vul een positief percentage in.',
        teHoog: 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.',
    },
    // Nul mag: er zijn aanbieders die niets vergoeden.
    'input-renteverlies-vergoeding': {
        lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
        leeg: 'Vul de depotvergoeding in, of nul als je aanbieder niets vergoedt.',
        teLaag: 'Een vergoeding onder de nul procent bestaat niet.',
        teHoog: 'Boven de 20 procent vergoedt geen enkele aanbieder; controleer het percentage.',
    },
    'input-renteverlies-maanden': {
        lezer: leesGetal, min: 1, max: 36, exclusiefNul: true,
        leeg: 'Vul in hoeveel maanden de bouw duurt.',
        teLaag: 'Een bouwperiode begint bij één maand.',
        teHoog: 'Deze rekentool rekent met bouwperiodes tot 36 maanden.',
    },
    // Nul is hier een geldig antwoord: een aanbieder die niets vergoedt,
    // vergoedt ook nul maanden lang.
    'input-renteverlies-vergoedingsduur': {
        lezer: leesGetal, min: 0, max: 60, exclusiefNul: false,
        leeg: 'Vul in hoeveel maanden de vergoeding doorloopt, of nul.',
        teLaag: 'Een vergoedingsduur onder nul maanden bestaat niet.',
        teHoog: 'Vul hooguit 60 maanden in.',
    },
};

const procent = (waarde) => `${waarde.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const maanden = (n) => (n === 1 ? '1 maand' : `${n} maanden`);
const metTeken = (bedrag) => (bedrag < -0.5 ? `− ${euro.format(-bedrag)}` : euro.format(bedrag));

const PATROONUITLEG = {
    gelijk: 'Het depot daalt in gelijke stappen: elke maand een even grote rekening.',
    vroeg: 'De grootste rekeningen komen eerst. Het depot is snel grotendeels leeg, dus er staat weinig geld stil.',
    laat: 'De grootste rekeningen komen aan het eind. Het depot blijft lang vol, dus er staat veel geld lang stil.',
};

function initRenteverlies() {
    const el = (id) => document.getElementById(id);
    const veld = {
        depot: el('input-renteverlies-depot'), rente: el('input-renteverlies-hypotheek'),
        vergoeding: el('input-renteverlies-vergoeding'), duur: el('input-renteverlies-maanden'),
        loopt: el('input-renteverlies-vergoedingsduur'), patroon: el('input-renteverlies-pattern'),
        model: el('input-renteverlies-model'),
    };
    const schuif = el('range-renteverlies-maanden');
    const leesVeld = maakVeldlezer(GRENZEN);
    const printknop = el('btn-download-renteverlies');
    bindReportButton(printknop);

    koppelBedragveld(veld.depot);
    for (const v of [veld.rente, veld.vergoeding]) koppelPercentageveld(v);
    for (const [sleutel, naam] of Object.entries(OPNAMEPATRONEN)) veld.patroon.add(new Option(naam, sleutel));
    for (const [sleutel, naam] of Object.entries(REKENMODELLEN)) veld.model.add(new Option(naam, sleutel));

    const uit = {
        bedrag: el('res-renteverlies-netto'), zin: el('res-zin'), oorzaak: el('res-oorzaak'),
        maand: el('res-renteverlies-maand'), rente: el('res-renteverlies-hypotheek'), renteNoot: el('res-rente-noot'),
        vergoeding: el('res-renteverlies-vergoeding'), vergoedingNoot: el('res-vergoeding-noot'),
        opgenomen: el('res-rente-opgenomen'),
        modelNoot: el('renteverlies-model-note'), duurNoot: el('renteverlies-duur-note'), patroonNoot: el('renteverlies-pattern-note'),
        blokVergoeding: el('blok-vergoeding'),
        samenvatting: el('res-samenvatting'), grafiek: el('verloop-grafiek'), tabel: el('details-table-body'),
        aannames: el('res-aannames'), vast: el('wr-vast'), vastBedrag: el('wr-vast-bedrag'),
    };
    let laatsteGrafiek = null;
    const tekenGrafiek = () => { if (laatsteGrafiek) tekenTijdlijn(uit.grafiek, laatsteGrafiek); };

    function toonGeenUitkomst() {
        uit.bedrag.firstChild.textContent = '–';
        uit.zin.dataset.status = 'afwijkend';
        uit.zin.textContent = 'Pas de gemarkeerde velden aan voor een uitkomst.';
        uit.oorzaak.textContent = '';
        for (const e of [uit.maand, uit.rente, uit.vergoeding, uit.opgenomen]) e.firstChild.textContent = '–';
        uit.samenvatting.textContent = 'Zolang de invoer niet klopt, tonen we geen grafiek: een half ingevuld formulier levert een bedrag op dat er hetzelfde uitziet als een goed bedrag.';
        uit.grafiek.innerHTML = '';
        uit.tabel.innerHTML = '';
        uit.aannames.innerHTML = '';
        uit.vast.classList.remove('is-zichtbaar');
        laatsteGrafiek = null;
        delete printknop.dataset.report;
    }

    function reken() {
        const model = veld.model.value;
        const metVergoeding = model === 'vergoeding';
        uit.blokVergoeding.hidden = !metVergoeding;
        uit.patroonNoot.textContent = PATROONUITLEG[veld.patroon.value] ?? '';
        uit.modelNoot.textContent = metVergoeding
            ? 'Je betaalt hypotheekrente over het volledige depot en ontvangt een vergoeding over het deel dat nog niet is opgenomen.'
            : 'Je betaalt alleen rente over het opgenomen deel en ontvangt geen depotvergoeding. Stilstaand geld kost dan niets. Wel blijft de depottermijn belangrijk: loopt die af, dan wordt het restant meestal op je hypotheek afgelost.';

        // Vergoeding en vergoedingsduur doen alleen mee in het vergoedingsmodel;
        // een leeg of fout veld daar mag het andere model niet tegenhouden.
        const gelezen = {
            depot: leesVeld(veld.depot), rentePercent: leesVeld(veld.rente), maanden: leesVeld(veld.duur),
            vergoedingPercent: metVergoeding ? leesVeld(veld.vergoeding) : 0,
            vergoedingMaanden: metVergoeding ? leesVeld(veld.loopt) : 0,
        };
        if (Object.values(gelezen).some((w) => w === null)) { toonGeenUitkomst(); return; }

        const invoer = {
            ...gelezen, maanden: Math.round(gelezen.maanden), vergoedingMaanden: Math.round(gelezen.vergoedingMaanden),
            patroon: veld.patroon.value, model,
        };
        const t = berekenRenteverlies(invoer);
        const n = invoer.maanden;
        const zonder = t.maandenZonderVergoeding;

        /* Het ene bedrag, en waar het vandaan komt. */
        uit.bedrag.firstChild.textContent = metTeken(t.renteverlies);
        delete uit.zin.dataset.status;
        if (!metVergoeding) {
            uit.zin.textContent = 'Bij dit rekenmodel betaal je geen rente over wat nog in depot staat. Stilstaand geld kost je dus niets.';
            uit.oorzaak.textContent = `De ${euro.format(t.rente)} rente die je in deze ${maanden(n)} betaalt gaat over wat je al hebt opgenomen.`;
        } else if (Math.abs(t.renteverlies) < 0.5) {
            uit.zin.textContent = `Je vergoeding is gelijk aan je hypotheekrente en loopt de hele ${maanden(n)} door. Stilstaand geld kost je dan niets.`;
            uit.oorzaak.textContent = `Per saldo betaal je ${euro.format(t.perSaldo)}: de rente over wat je al hebt opgenomen.`;
        } else if (t.renteverlies < 0) {
            uit.zin.textContent = `Je vergoeding is hoger dan je hypotheekrente: over ${maanden(n)} ontvang je ${euro.format(-t.renteverlies)} meer dan je over het stilstaande geld betaalt. Controleer of je voorwaarden dat toestaan.`;
            uit.oorzaak.textContent = '';
        } else {
            uit.zin.textContent = `Zoveel betaal je in ${maanden(n)} aan rente over geld dat nog in je depot staat, na aftrek van de vergoeding.`;
            uit.oorzaak.textContent = [
                t.doorLagerTarief > 0.5 ? `${euro.format(t.doorLagerTarief)} doordat de vergoeding (${procent(invoer.vergoedingPercent)}) lager is dan je rente (${procent(invoer.rentePercent)}).` : '',
                t.doorGestopteVergoeding > 0.5 ? `${euro.format(t.doorGestopteVergoeding)} doordat de vergoeding in de laatste ${maanden(zonder)} niet meer loopt.` : '',
            ].filter(Boolean).join(' ');
        }

        // Rente en verlies zijn de bedragen waar het om gaat; de vergoeding
        // ertussen neemt op het scherm het afrondingsverschil op.
        const stilstaand = Math.round(t.renteStilstaand), verlies = Math.round(t.renteverlies);
        uit.maand.firstChild.textContent = metTeken(t.perMaand);
        uit.rente.firstChild.textContent = euro.format(stilstaand);
        uit.renteNoot.textContent = metVergoeding ? `over gemiddeld ${euro.format(t.gemiddeldInDepot * invoer.depot)} dat nog in depot stond` : 'in dit rekenmodel reken je bank daar geen rente over';
        uit.vergoeding.firstChild.textContent = euro.format(stilstaand - verlies);
        uit.vergoedingNoot.textContent = !metVergoeding ? 'dit rekenmodel kent geen vergoeding'
            : zonder > 0 ? `over de eerste ${maanden(t.invoer.vergoedingMaanden)}; daarna niets meer` : `over de hele ${maanden(n)}`;
        uit.opgenomen.firstChild.textContent = euro.format(t.renteOpgenomen);
        uit.vastBedrag.textContent = metTeken(t.renteverlies);

        uit.duurNoot.textContent = zonder > 0
            ? `Vanaf maand ${t.invoer.vergoedingMaanden + 1} ontvang je geen vergoeding meer over wat er nog staat. Dat is ${zonder} van je ${n} maanden.`
            : 'De vergoeding loopt in dit scenario door tot het einde van je bouwperiode.';

        /* Grafiek en de zin eronder. De staaf is wat je per saldo betaalt: onder
           de rente over opgenomen geld, daarboven het renteverlies. */
        const duurste = t.regels.reduce((h, x) => (x.verlies > h.verlies + 1e-9 ? x : h), t.regels[0]);
        const samenvatting = !metVergoeding || t.renteverlies < 0.5
            ? `Je betaalt per saldo ${euro.format(t.regels[0].perSaldo)} in maand 1 en ${euro.format(t.regels.at(-1).perSaldo)} in maand ${n}: de rente over wat je hebt opgenomen. Er is geen renteverlies.`
            : `Het renteverlies is het grootst in maand ${duurste.maand}: ${euro.format(duurste.verlies)}. `
                + (zonder > 0 ? `Vanaf maand ${t.invoer.vergoedingMaanden + 1} stopt de vergoeding en kost het hele saldo de volle rente. ` : '')
                + `Over ${maanden(n)} samen: ${euro.format(t.renteverlies)}.`;
        uit.samenvatting.textContent = samenvatting;
        const grafiekregels = t.regels.map((x) => ({ maand: x.maand, woonlast: x.renteOpgenomen, hypotheek: Math.max(0, x.verlies), totaal: x.renteOpgenomen + Math.max(0, x.verlies) }));
        const stopNa = zonder > 0 ? t.invoer.vergoedingMaanden : n;
        laatsteGrafiek = {
            regels: grafiekregels, piek: t.renteverlies > 0.5 ? grafiekregels[duurste.maand - 1] : null,
            oplevermaand: stopNa, eindeOverlap: stopNa, merkTekst: 'vergoeding stopt',
            omschrijving: `Staafgrafiek per maand van de rente over opgenomen geld en het renteverlies over stilstaand geld, over ${maanden(n)}. ${samenvatting}`,
        };
        tekenGrafiek();

        /* Tabel: dezelfde regels als de grafiek. */
        uit.tabel.innerHTML = t.regels.map((x) => `<tr${x.maand === t.invoer.vergoedingMaanden && zonder > 0 ? ' data-grens' : ''}>
            <td>${x.maand}</td><td>${euro.format(x.saldo)}</td>
            <td>${euro.format(x.renteStilstaand)}</td>
            <td>${x.vergoeding > 0.005 ? `− ${euro.format(x.vergoeding)}` : '–'}</td>
            <td>${metTeken(x.verlies)}</td>
            <td>${euro.format(x.renteOpgenomen)}</td></tr>`).join('');

        /* Aannames: de invoer waarmee is gerekend, leesbaar terug. */
        uit.aannames.innerHTML = [
            ['Bouwdepot', euro.format(invoer.depot)],
            ['Rekenmodel', REKENMODELLEN[model].toLowerCase()],
            ['Hypotheekrente', procent(invoer.rentePercent)],
            ['Depotvergoeding', metVergoeding ? procent(invoer.vergoedingPercent) : 'niet van toepassing'],
            ['Bouwperiode', maanden(n)],
            ['Vergoeding loopt', metVergoeding ? maanden(t.invoer.vergoedingMaanden) : 'niet van toepassing'],
            ['Opnemen', OPNAMEPATRONEN[invoer.patroon].toLowerCase()],
            ['Gemiddeld nog in depot', `${toonGetal(Math.round(t.gemiddeldInDepot * 100))}% van het bedrag`],
        ].map(([naam, waarde]) => `<dt>${naam}</dt><dd>${waarde}</dd>`).join('');

        /* Afdrukoverzicht: dezelfde maandregels, als ruwe getallen. */
        printknop.dataset.report = JSON.stringify({
            toolId: 'renteverlies-bouwdepot',
            toolTitle: 'Renteverlies op het bouwdepot',
            generatedAt: new Date().toISOString(),
            inputs: {
                depotAmount: invoer.depot,
                rekenmodel: REKENMODELLEN[model],
                mortgageRate: invoer.rentePercent,
                depotCompensationRate: metVergoeding ? invoer.vergoedingPercent : null,
                months: n,
                compensationMonths: metVergoeding ? t.invoer.vergoedingMaanden : null,
                opnamePattern: OPNAMEPATRONEN[invoer.patroon],
            },
            results: {
                totalIndicativeRenteverlies: t.renteverlies,
                averageMonthlyEffect: t.perMaand,
                interestOnIdle: t.renteStilstaand,
                totalCompensation: t.vergoeding,
                interestOnDrawn: t.renteOpgenomen,
            },
            conclusion: `${uit.zin.textContent} ${uit.oorzaak.textContent}`.trim(),
            interpretation: samenvatting,
            tables: [{
                title: 'Maand voor maand',
                columns: [
                    { key: 'maand', label: 'Mnd', type: 'text' },
                    { key: 'saldo', label: 'Depot eind maand', type: 'currency' },
                    { key: 'renteStilstaand', label: 'Rente over stilstaand geld', type: 'currency' },
                    { key: 'vergoeding', label: 'Depotvergoeding', type: 'currency' },
                    { key: 'verlies', label: 'Renteverlies', type: 'currency' },
                    { key: 'renteOpgenomen', label: 'Rente over opgenomen geld', type: 'currency' },
                ],
                rows: t.regels.map(({ maand, saldo, renteStilstaand, vergoeding, verlies, renteOpgenomen }) => ({ maand, saldo, renteStilstaand, vergoeding, verlies, renteOpgenomen })),
            }],
            assumptions: 'Indicatieve berekening per maand, vóór belasting. Vaste rentepercentages, rente over het volle depotbedrag (zonder aflossing) en het gekozen opnamepatroon. Werkelijke bankboekingen, opnamedata en voorwaarden kunnen afwijken.',
        });
    }

    /* -------------------------------- binden -------------------------------- */

    for (const v of [veld.depot, veld.rente, veld.vergoeding, veld.loopt]) v.addEventListener('input', reken);
    for (const v of [veld.patroon, veld.model]) v.addEventListener('change', reken);
    schuif.addEventListener('input', () => { veld.duur.value = schuif.value; reken(); });
    veld.duur.addEventListener('input', () => {
        const getal = leesGetal(veld.duur.value);
        if (getal !== null) schuif.value = getal;
        reken();
    });

    for (const knop of document.querySelectorAll('[data-voorbeeld]')) {
        knop.addEventListener('click', () => {
            const d = knop.dataset;
            veld.model.value = d.model;
            veld.rente.value = procent(Number(d.rente)).replace('%', '');
            veld.vergoeding.value = procent(Number(d.vergoeding)).replace('%', '');
            veld.duur.value = d.maanden;
            schuif.value = d.maanden;
            veld.loopt.value = d.loopt;
            reken();
        });
    }

    // Wie zijn bank kiest, hoeft het rekenmodel en de vergoedingsduur niet zelf
    // op te zoeken; dat zijn juist de twee dingen die niemand uit zijn hoofd
    // weet en die de uitkomst het sterkst bepalen. Beide blijven daarna met de
    // hand aan te passen: de bezoeker kent zijn eigen offerte beter dan wij.
    const bankNoot = el('bank-noot');
    opBankwissel((bank) => {
        if (bank) {
            veld.model.value = bank.vergoeding.model === 'rente-alleen-over-opgenomen' ? 'opname' : 'vergoeding';
            const duur = bank.vergoeding.maanden.verbouw;
            if (typeof duur === 'number' && duur > 0) veld.loopt.value = duur;
            // Publiceert de aanbieder het vergoedingsniveau, dan vullen we het
            // in; anders blijft het percentage van de bezoeker staan.
            const tarief = vergoedingsTarief(bank, leesPercentage(veld.rente.value) || 0);
            if (tarief != null) veld.vergoeding.value = procent(tarief).replace('%', '');
            bankNoot.textContent = veld.model.value === 'opname'
                ? `${bank.naam} rekent alleen rente over wat je hebt opgenomen.`
                : `Ingevuld voor ${bank.naam} bij een verbouwing: vergoeding ${typeof duur === 'number' ? `${maanden(duur)} lang` : 'zonder gepubliceerde duur'}${tarief == null ? '. Het percentage publiceert deze aanbieder niet; vul dat uit je offerte in' : ''}. Je kunt elk veld aanpassen.`;
        } else {
            bankNoot.textContent = '';
        }
        reken();
    });

    // De grafiek wordt op de werkelijke breedte getekend; verandert die, dan opnieuw.
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

startRekenpagina(initRenteverlies);
