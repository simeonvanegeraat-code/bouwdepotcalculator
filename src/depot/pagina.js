/**
 * bouwdepot-berekenen.html: invoer lezen, de rekenkern aanroepen, de uitkomst
 * tonen.
 *
 * Hier staat geen rekenregel. Alle bedragen komen uit src/domain/bouwdepot.js;
 * de uitkomst, de grafiek, de tabel en het afdrukoverzicht lezen dezelfde
 * maandregels.
 *
 * De pagina had twee losse rekenblokken: de maandlast van het depotbedrag, en
 * de last tijdens de bouw met een geschat gemiddeld saldo. Dat is nu één
 * tijdlijn: tijdens de verbouwing betaal je minder omdat er vergoeding over het
 * depot komt, daarna de volle maandlast.
 *
 * De veld-id's van bedrag en rente zijn die van de vorige versie. Het gedeelde
 * formuliergeheugen (src/js/shared-form-memory.js) herkent velden daaraan, dus
 * die twee reizen nog steeds mee van en naar de andere rekenpagina's. De
 * woonlast heeft bewust een eigen id: die staat hier in een dichtgeklapt blok,
 * en een onthouden bedrag van een andere pagina zou de uitkomst ongemerkt
 * veranderen.
 */

import { bindReportButton, startRekenpagina } from '../js/rekenpagina.js';
import {
    leesGetal, leesPercentage, toonGetal, euro, maakVeldlezer, koppelBedragveld, koppelPercentageveld,
} from '../js/getallen.js';
import { setMemoryLockById } from '../js/shared-form-memory';
import { HYPOTHEEKVORMEN } from '../domain/hypotheek.js';
import { berekenDepot, OPNAMEPATRONEN } from '../domain/bouwdepot.js';
import { BANKEN } from '../js/bankdata.generated.js';
import { tekenTijdlijn } from '../nieuwbouw/grafiek.js';
import { naarAdres, uitAdres } from './adres.js';
import { geefDownload, XLSX_TYPE } from '../js/download.js';

const GRENZEN = {
    'input-amount': {
        lezer: leesGetal, min: 0, max: 1000000, exclusiefNul: true,
        leeg: 'Vul het bedrag van je bouwdepot in.',
        teLaag: 'Vul een bedrag boven de nul in.',
        teHoog: 'Boven een miljoen euro is geen bouwdepot meer; controleer het bedrag.',
    },
    'input-interest': {
        lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
        leeg: 'Vul je hypotheekrente in.',
        teLaag: 'Een rente onder de nul procent bestaat niet; vul een positief percentage in.',
        teHoog: 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.',
    },
    // Gelijk aan het bereik van de schuif ernaast.
    'input-depot-months': {
        lezer: leesGetal, min: 1, max: 36, exclusiefNul: true,
        leeg: 'Vul in hoeveel maanden de verbouwing duurt.',
        teLaag: 'Een verbouwing duurt minstens één maand.',
        teHoog: 'Deze rekentool rekent met verbouwingen tot 36 maanden.',
    },
    'input-duration': {
        lezer: leesGetal, min: 10, max: 30, exclusiefNul: true,
        leeg: 'Vul een looptijd in jaren in.',
        teLaag: 'Deze rekentool rekent met looptijden van 10 tot 30 jaar.',
        teHoog: 'Een hypotheek loopt maximaal 30 jaar.',
    },
    'input-depot-discount': {
        lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
        leeg: 'Vul in hoeveel lager de rente over je depot is.',
        teLaag: 'Minder dan nul procentpunt lager kan niet.',
        teHoog: 'Boven de 20 procent kort geen enkele aanbieder; controleer het percentage.',
    },
    'input-woning': {
        lezer: leesGetal, min: 0, max: 5000000, exclusiefNul: false,
        leeg: 'Vul de hypotheek voor de woning in, of nul.',
        teLaag: 'Een hypotheek onder de nul bestaat niet.',
        teHoog: 'Boven vijf miljoen euro rekent deze tool niet; controleer het bedrag.',
    },
    'input-woonlast-door': {
        lezer: leesGetal, min: 0, max: 100000, exclusiefNul: false,
        leeg: 'Vul de woonlast in die doorloopt, of nul.',
        teLaag: 'Een woonlast onder de nul bestaat niet.',
        teHoog: 'Boven de honderdduizend euro per maand rekent deze tool niet.',
    },
};

const procent = (waarde) => `${waarde.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const maanden = (n) => (n === 1 ? '1 maand' : `${n} maanden`);

const PATROONUITLEG = {
    gelijk: 'Het depot daalt in gelijke stappen: elke maand een even grote rekening.',
    vroeg: 'De grootste rekeningen komen eerst, bijvoorbeeld een aanbetaling en de ruwbouw. Het depot is snel grotendeels leeg, dus je ontvangt minder vergoeding.',
    laat: 'De grootste rekeningen komen aan het eind, bijvoorbeeld bij de afbouw. Het depot blijft lang vol, dus je ontvangt meer vergoeding.',
};

function initDepot() {
    const el = (id) => document.getElementById(id);
    const veld = {
        bedrag: el('input-amount'), rente: el('input-interest'), duur: el('input-depot-months'),
        looptijd: el('input-duration'), vorm: el('input-vorm'), depotSoort: el('input-depot-soort'),
        afslag: el('input-depot-discount'), patroon: el('input-opnamepattern'),
        woning: el('input-woning'), woonlast: el('input-woonlast-door'), stopt: el('input-depot-stopt'),
    };
    const schuifDuur = el('range-depot-months');
    const schuifLooptijd = el('range-duration');
    const leesVeld = maakVeldlezer(GRENZEN);
    const printknop = el('btn-download');
    bindReportButton(printknop);

    // Een bewaarde link: de invoer staat in het adres. De verbouwbegroting linkt
    // hierheen met alleen het te lenen bedrag (?bedrag=); dat werkt ook zo.
    const params = new URLSearchParams(window.location.search);
    const uitLink = uitAdres(window.location.search);
    if (uitLink) {
        const zet = (v, k, opmaak) => { if (k in uitLink) v.value = opmaak(uitLink[k]); };
        zet(veld.bedrag, 'bedrag', (n) => toonGetal(Math.round(n)));
        zet(veld.rente, 'rente', (n) => toonGetal(n, 2));
        zet(veld.duur, 'maanden', String);
        zet(schuifDuur, 'maanden', String);
        zet(veld.looptijd, 'looptijd', String);
        zet(schuifLooptijd, 'looptijd', String);
        zet(veld.afslag, 'afslag', (n) => toonGetal(n, 2));
        zet(veld.stopt, 'stopt', String);
        zet(veld.woning, 'woning', (n) => toonGetal(Math.round(n)));
        zet(veld.woonlast, 'woonlast', (n) => toonGetal(Math.round(n)));
        if (uitLink.soort) veld.depotSoort.value = uitLink.soort;
        // Voorkomt dat de onthouden invoer de meegegeven bedragen overschrijft.
        setMemoryLockById('input-amount');
        if ('rente' in uitLink) setMemoryLockById('input-interest');
    }
    // Oude links naar de haalbaarheidscheck, die nu op de verbouwpagina staat.
    // In productie vangt vercel.json dit af; dit is er voor de ontwikkelserver.
    if (params.get('plan') === 'haalbaarheid') {
        window.location.replace('leenruimte.html');
        return;
    }

    for (const v of [veld.bedrag, veld.woning, veld.woonlast]) koppelBedragveld(v);
    for (const v of [veld.rente, veld.afslag]) koppelPercentageveld(v);
    for (const [sleutel, naam] of Object.entries(HYPOTHEEKVORMEN)) veld.vorm.add(new Option(naam, sleutel));
    for (const [sleutel, naam] of Object.entries(OPNAMEPATRONEN)) veld.patroon.add(new Option(naam, sleutel));
    if (uitLink?.vorm) veld.vorm.value = uitLink.vorm;
    if (uitLink?.patroon) veld.patroon.value = uitLink.patroon;
    const veldAfslag = el('veld-depot-discount');
    const veldStopt = el('veld-depot-stopt');
    // Zonder vergoeding valt er niets te stoppen.
    const toonAfslag = () => { veldAfslag.hidden = veld.depotSoort.value !== 'lager'; veldStopt.hidden = veld.depotSoort.value === 'geen'; };
    const punt = { rente: document.querySelector('[data-dp-punt="rente"]'), duur: document.querySelector('[data-dp-punt="duur"]') };
    let laatsteInvoer = null;

    const uit = {
        label: el('res-label'), bedrag: el('res-maandlast'), zin: el('res-zin'), verloop: el('res-verloop'),
        eerste: el('res-eerste'), eersteNoot: el('res-eerste-noot'),
        hoogste: el('res-hoogste'), hoogsteNoot: el('res-hoogste-noot'),
        renteBouw: el('res-rente-bouw'), renteBouwNoot: el('res-rente-bouw-noot'),
        renteLooptijd: el('res-rente-looptijd'), renteLooptijdNoot: el('res-rente-looptijd-noot'),
        lening: el('res-lening-regel'), patroon: el('res-patroon'), termijnmelding: el('res-termijnmelding'),
        samenvatting: el('res-samenvatting'), grafiek: el('verloop-grafiek'), legendaWoonlast: el('legenda-woonlast'),
        tabel: el('details-table-body'), maandtabel: el('maandtabel'), aannames: el('res-aannames'),
        vast: el('wr-vast'), vastBedrag: el('wr-vast-bedrag'), naarAftrek: el('naar-aftrek'),
    };
    let laatsteGrafiek = null;
    const tekenGrafiek = () => { if (laatsteGrafiek) tekenTijdlijn(uit.grafiek, laatsteGrafiek); };

    function toonGeenUitkomst() {
        uit.bedrag.firstChild.textContent = '–';
        uit.zin.dataset.status = 'afwijkend';
        uit.zin.textContent = 'Pas de gemarkeerde velden aan voor een uitkomst.';
        uit.verloop.textContent = '';
        for (const e of [uit.eerste, uit.hoogste, uit.renteBouw, uit.renteLooptijd]) e.firstChild.textContent = '–';
        for (const e of [uit.eersteNoot, uit.hoogsteNoot, uit.renteBouwNoot, uit.renteLooptijdNoot]) e.textContent = '';
        uit.lening.hidden = true;
        uit.termijnmelding.hidden = true;
        uit.samenvatting.textContent = 'Zolang de invoer niet klopt, tonen we geen grafiek: een half ingevuld formulier levert een bedrag op dat er hetzelfde uitziet als een goed bedrag.';
        uit.grafiek.innerHTML = '';
        uit.tabel.innerHTML = '';
        uit.aannames.innerHTML = '';
        uit.vast.classList.remove('is-zichtbaar');
        uit.naarAftrek.href = 'hypotheekrenteaftrek-gids.html';
        laatsteGrafiek = null;
        laatsteInvoer = null;
        delete printknop.dataset.report;
        punt.rente.textContent = '';
        punt.duur.textContent = '';
    }

    function reken() {
        uit.patroon.textContent = PATROONUITLEG[veld.patroon.value] ?? '';

        // De afslag doet alleen mee als de bezoeker "lager" heeft gekozen; anders
        // mag een leeg of fout afslagveld de berekening niet tegenhouden.
        const soort = veld.depotSoort.value;
        const rente = leesVeld(veld.rente);
        const afslag = soort === 'lager' ? leesVeld(veld.afslag) : soort === 'geen' ? rente : 0;
        const gelezen = {
            depot: leesVeld(veld.bedrag), rentePercent: rente, kortingDepotPercent: afslag,
            duurMaanden: leesVeld(veld.duur), looptijdJaren: leesVeld(veld.looptijd),
            woning: leesVeld(veld.woning), woonlast: leesVeld(veld.woonlast),
        };
        if (Object.values(gelezen).some((w) => w === null)) { toonGeenUitkomst(); return; }

        // Leeg betekent: de vergoeding loopt zolang er geld in het depot staat.
        const foutStopt = el('fout-depot-stopt');
        foutStopt.textContent = '';
        veld.stopt.removeAttribute('aria-invalid');
        let stopt = null;
        if (soort !== 'geen' && veld.stopt.value.trim() !== '') {
            stopt = leesGetal(veld.stopt.value);
            if (stopt === null || !Number.isInteger(stopt) || stopt < 1 || stopt > 36) {
                foutStopt.textContent = 'Vul een heel aantal maanden in, van 1 tot 36, of laat het veld leeg.';
                veld.stopt.setAttribute('aria-invalid', 'true');
                toonGeenUitkomst();
                return;
            }
        }

        const invoer = {
            ...gelezen,
            duurMaanden: Math.round(gelezen.duurMaanden),
            looptijdJaren: Math.round(gelezen.looptijdJaren),
            // Een afslag groter dan de rente is geen negatieve vergoeding maar geen vergoeding.
            kortingDepotPercent: Math.min(gelezen.kortingDepotPercent, gelezen.rentePercent),
            vorm: veld.vorm.value,
            patroon: veld.patroon.value,
            vergoedingMaanden: stopt,
        };
        const t = berekenDepot(invoer);
        laatsteInvoer = { ...invoer, soort };
        const { eerste, hoogsteTijdens, daarna, sommen } = t;
        const n = t.klaarMaand;
        const metWoning = invoer.woning > 0;
        const metWoonlast = invoer.woonlast > 0;
        const depotrente = invoer.rentePercent - invoer.kortingDepotPercent;

        /* Het ene bedrag, en waar het uit bestaat. Het rentedeel is de harde
           grootheid en wordt exact afgerond; de aflossing is wat er van de
           afgeronde termijn overblijft, zodat de twee samen het bedrag erboven zijn. */
        const bruto = Math.round(t.maandlastDaarna);
        const renteDeel = Math.round(daarna.rente);
        uit.label.textContent = metWoning ? 'Bruto maandlast van je hele hypotheek, na de verbouwing' : 'Bruto maandlast van je bouwdepot, na de verbouwing';
        uit.bedrag.firstChild.textContent = euro.format(bruto);
        delete uit.zin.dataset.status;
        uit.zin.textContent = invoer.vorm === 'aflossingsvrij'
            ? `Dat is alleen rente: je lost niets af, dus na ${invoer.looptijdJaren} jaar staat de schuld van ${euro.format(t.lening)} er nog.`
            : `In de eerste maand na de verbouwing is dat ${euro.format(renteDeel)} rente en ${euro.format(Math.max(0, bruto - renteDeel))} aflossing.`;
        uit.verloop.textContent = invoer.vorm === 'lineair'
            ? 'Bij lineair blijft de aflossing gelijk en daalt de rente, dus je last wordt daarna elke maand iets lager.'
            : invoer.vorm === 'annuiteit'
                ? 'Bij annuïteiten blijft dit bedrag de hele looptijd gelijk; alleen de verhouding schuift van rente naar aflossing.'
                : '';

        uit.eerste.firstChild.textContent = euro.format(eerste.totaal);
        uit.eersteNoot.textContent = (eerste.vergoeding > 0.5 ? `na ${euro.format(eerste.vergoeding)} depotvergoeding` : 'zonder depotvergoeding')
            + (metWoonlast ? `, met ${euro.format(invoer.woonlast)} doorlopende woonlast` : '');
        uit.hoogste.firstChild.textContent = euro.format(hoogsteTijdens.totaal);
        uit.hoogsteNoot.textContent = n === 1 ? 'de verbouwing duurt één maand' : `maand ${hoogsteTijdens.maand} van ${n}${metWoonlast ? ', met je doorlopende woonlast' : ''}`;
        uit.renteBouw.firstChild.textContent = euro.format(sommen.renteNaVergoeding);
        // De vergoeding is hier het verschil van de twee afgeronde bedragen
        // ernaast, zodat de regel optelt; los afgerond scheelt het soms een euro.
        const renteBouw = Math.round(sommen.rente);
        uit.renteBouwNoot.textContent = `tijdens de verbouwing: ${euro.format(renteBouw)} rente, ${euro.format(renteBouw - Math.round(sommen.renteNaVergoeding))} vergoeding`;
        uit.renteLooptijd.firstChild.textContent = euro.format(t.renteHeleLooptijd);
        uit.renteLooptijdNoot.textContent = `over ${invoer.looptijdJaren} jaar, zonder de depotvergoeding`;
        uit.vastBedrag.textContent = euro.format(bruto);

        uit.lening.hidden = !metWoning;
        if (metWoning) uit.lening.innerHTML = `Je leent in totaal <strong class="tnum">${euro.format(t.lening)}</strong>. Daarvan staat ${euro.format(invoer.depot)} bij de start in je bouwdepot.`;

        // Wie netto wil rekenen heeft zijn inkomen nodig; dat vraagt de
        // belastingcalculator. Die rekent met de hele hypotheek, want het
        // eigenwoningforfait gaat er maar één keer af. Het bedrag gaat daarom
        // alleen mee als hier ook de hele hypotheek staat; een los depot van
        // 25.000 zou daar een aftrek van bijna niets opleveren.
        uit.naarAftrek.href = `hypotheekrenteaftrek-gids.html?${metWoning ? `amount=${Math.round(t.lening)}&` : ''}interest=${invoer.rentePercent}`;

        /* Duurt de verbouwing langer dan de vergoeding bij een aantal aanbieders
           loopt? Het model laat de vergoeding doorlopen, dus dat hoort erbij gezegd. */
        const gestopt = depotrente > 0 ? BANKEN.filter((b) => {
            const duur = b.vergoeding?.maanden?.verbouw;
            return typeof duur === 'number' && duur > 0 && duur < n;
        }).length : 0;
        // Wie zelf heeft ingesteld wanneer de vergoeding stopt, heeft deze melding niet meer nodig.
        uit.termijnmelding.hidden = gestopt === 0 || stopt !== null;
        if (!uit.termijnmelding.hidden) {
            uit.termijnmelding.innerHTML = `Je verbouwing duurt ${n} maanden. Bij ${gestopt} van de ${BANKEN.length} aanbieders in onze vergelijking is de depotvergoeding dan al gestopt, terwijl deze berekening hem laat doorlopen. Je werkelijke last ligt in de laatste maanden dan hoger. Vul onder &lsquo;Meer instellingen&rsquo; in wanneer hij bij jouw bank stopt. <a href="bouwdepot-voorwaarden-vergelijken.html">Bekijk de termijn van jouw bank</a>.`;
        }

        /* Nog te controleren: wat de uitkomst over de vergoeding aanneemt. */
        punt.rente.innerHTML = soort === 'geen' ? 'Je hebt ingesteld: <strong>geen vergoeding</strong>.'
            : soort === 'lager' ? `Je hebt ingesteld: <strong>${procent(depotrente)}</strong>, ${toonGetal(invoer.kortingDepotPercent, 2)} procentpunt onder je hypotheekrente.`
            : `Gerekend met een vergoeding <strong>gelijk aan je hypotheekrente</strong> (${procent(invoer.rentePercent)}). Bij de meeste aanbieders is dat zo, niet bij alle.`;
        if (soort === 'geen') {
            punt.duur.textContent = 'Zonder vergoeding speelt dit niet.';
        } else if (stopt === null) {
            punt.duur.innerHTML = `Gerekend alsof de vergoeding <strong>de hele verbouwing doorloopt</strong>.${gestopt > 0 ? ` Bij ${gestopt} van de ${BANKEN.length} aanbieders in onze vergelijking stopt hij eerder dan na ${maanden(n)}.` : ''}`;
        } else if (stopt >= n) {
            punt.duur.innerHTML = `Je hebt ingesteld: de vergoeding stopt na <strong>${maanden(stopt)}</strong>. Je verbouwing is dan klaar, dus dat kost niets extra.`;
        } else {
            // Wat het stoppen kost: dezelfde berekening met een vergoeding die doorloopt.
            const doorlopend = berekenDepot({ ...invoer, vergoedingMaanden: null });
            const extra = sommen.renteNaVergoeding - doorlopend.sommen.renteNaVergoeding;
            punt.duur.innerHTML = `Je hebt ingesteld: de vergoeding stopt na <strong>${maanden(stopt)}</strong>. Dat kost je <strong>${euro.format(extra)}</strong> meer dan een vergoeding die de hele verbouwing doorloopt.`;
        }

        /* Grafiek en de zin eronder. */
        const laatste = t.regels[n - 1];
        const samenvatting = (n === 1
            ? `In de maand van de verbouwing betaal je ${euro.format(eerste.totaal)}. `
            : `Tijdens de verbouwing betaal je in maand 1 ${euro.format(eerste.totaal)} en in maand ${n} ${euro.format(laatste.totaal)}. `)
            + `Vanaf maand ${n + 1}, als het depot leeg is, betaal je ${euro.format(t.maandlastDaarna)} per maand`
            + (metWoonlast ? '; je doorlopende woonlast is dan gestopt.' : '.');
        uit.samenvatting.textContent = samenvatting;
        laatsteGrafiek = {
            regels: t.regels, piek: t.piek, oplevermaand: n, eindeOverlap: n, merkTekst: 'verbouwing klaar',
            omschrijving: `Staafgrafiek van de bruto maandlast over ${t.regels.length} maanden. ${samenvatting}`,
        };
        uit.legendaWoonlast.hidden = !metWoonlast;
        tekenGrafiek();

        /* Tabel: dezelfde regels als de grafiek. */
        uit.maandtabel.classList.toggle('is-zonder-woonlast', !metWoonlast);
        uit.tabel.innerHTML = t.regels.map((r) => {
            const fase = r.fase === 'bouw' ? 'Verbouwing' : 'Depot leeg';
            const grens = r.maand === n ? ' data-grens' : '';
            // Op een telefoon staan fase en opname niet in beeld; wat daar
            // bijzonder aan is krijgt dan een eigen regel onder de maand.
            const noot = [r.maand === n + 1 ? 'Depot leeg' : '', r.opname ? `${euro.format(r.opname)} uit depot` : ''].filter(Boolean).join(' · ');
            const nootRij = noot ? `<tr class="wr-tabel__noot" data-fase="${r.fase}"${grens}><td colspan="10">${noot}</td></tr>` : '';
            return `<tr data-fase="${r.fase}"${grens}${noot ? ' data-met-noot' : ''}>
                <td>${r.maand}</td><td>${fase}</td>
                <td>${r.opname ? euro.format(r.opname) : '–'}</td><td>${euro.format(r.depot)}</td>
                <td>${euro.format(r.rente)}</td><td>${euro.format(r.aflossing)}</td>
                <td>${r.vergoeding > 0.005 ? `− ${euro.format(r.vergoeding)}` : '–'}</td>
                <td>${euro.format(r.hypotheek)}</td><td>${r.woonlast ? euro.format(r.woonlast) : '–'}</td>
                <td>${euro.format(r.totaal)}</td></tr>${nootRij}`;
        }).join('');

        /* Aannames: de invoer waarmee is gerekend, leesbaar terug. */
        uit.aannames.innerHTML = [
            ['Bouwdepot', euro.format(invoer.depot)],
            ...(metWoning ? [['Hypotheek voor de woning zelf', euro.format(invoer.woning)], ['Samen geleend', euro.format(t.lening)]] : []),
            ['Hypotheekrente', procent(invoer.rentePercent)],
            ['Rente over het depot', depotrente > 0 ? procent(depotrente) : 'geen vergoeding'],
            ...(depotrente > 0 ? [['Vergoeding loopt', stopt === null ? 'zolang er geld in het depot staat' : maanden(stopt)]] : []),
            ['Hypotheekvorm', `${HYPOTHEEKVORMEN[invoer.vorm]}, ${invoer.looptijdJaren} jaar`],
            ['Duur van de verbouwing', maanden(n)],
            ['Opnemen', OPNAMEPATRONEN[invoer.patroon].toLowerCase()],
            ['Gemiddeld nog in depot', `${toonGetal(Math.round(t.gemiddeldInDepot * 100))}% van het bedrag`],
            ['Woonlast die doorloopt', metWoonlast ? `${euro.format(invoer.woonlast)} per maand` : 'niet ingevuld'],
        ].map(([naam, waarde]) => `<dt>${naam}</dt><dd>${waarde}</dd>`).join('');

        /* Afdrukoverzicht: dezelfde maandregels, als ruwe getallen. Een lege
           waarde laat reporting.js weg. */
        printknop.dataset.report = JSON.stringify({
            toolId: 'bouwdepot-maandlast',
            toolTitle: 'Bouwdepot: maandlast tijdens en na de verbouwing',
            generatedAt: new Date().toISOString(),
            inputs: {
                amount: invoer.depot,
                homeMortgage: metWoning ? invoer.woning : null,
                totalMortgage: metWoning ? t.lening : null,
                interestRate: invoer.rentePercent,
                depotCompensationRate: depotrente,
                mortgageType: HYPOTHEEKVORMEN[invoer.vorm],
                durationYears: invoer.looptijdJaren,
                renovationMonths: n,
                opnamePattern: OPNAMEPATRONEN[invoer.patroon],
                extraHousingCost: metWoonlast ? invoer.woonlast : null,
            },
            results: {
                grossMonthly: t.maandlastDaarna,
                monthlyFirst: eerste.totaal,
                monthlyPeakDuring: hoogsteTijdens.totaal,
                averageDuring: t.gemiddeldTijdens,
                totalInterestLoss: sommen.renteNaVergoeding,
                totalInterestTerm: t.renteHeleLooptijd,
            },
            conclusion: `Na de verbouwing betaal je ${euro.format(t.maandlastDaarna)} bruto per maand. ${uit.zin.textContent}`,
            interpretation: samenvatting,
            tables: [{
                title: 'Maand voor maand',
                columns: [
                    { key: 'maand', label: 'Mnd', type: 'text' },
                    { key: 'opname', label: 'Uit depot', type: 'currency' },
                    { key: 'depot', label: 'Depot eind maand', type: 'currency' },
                    { key: 'rente', label: 'Rente', type: 'currency' },
                    { key: 'aflossing', label: 'Aflossing', type: 'currency' },
                    { key: 'vergoeding', label: 'Depotvergoeding', type: 'currency' },
                    { key: 'hypotheek', label: 'Zelf te betalen', type: 'currency' },
                    ...(metWoonlast ? [
                        { key: 'woonlast', label: 'Doorlopende woonlast', type: 'currency' },
                        { key: 'totaal', label: 'Bruto totaal', type: 'currency' },
                    ] : []),
                ],
                rows: t.regels.map(({ maand, opname, depot, rente, aflossing, vergoeding, hypotheek, woonlast, totaal }) => ({ maand, opname, depot, rente, aflossing, vergoeding, hypotheek, woonlast, totaal })),
            }],
            assumptions: `Indicatieve berekening, bruto en zonder hypotheekrenteaftrek. Vaste rente, één leningdeel, het gekozen opnamepatroon en een vergoeding over het depot ${stopt === null ? 'zolang er saldo is' : `gedurende de eerste ${maanden(stopt)}`}. Werkelijke opnames, declaraties en bankvoorwaarden kunnen afwijken.`,
        });
    }

    /* -------------------------------- binden -------------------------------- */

    for (const v of [veld.bedrag, veld.rente, veld.afslag, veld.woning, veld.woonlast]) v.addEventListener('input', reken);
    for (const v of [veld.vorm, veld.patroon]) v.addEventListener('change', reken);
    veld.depotSoort.addEventListener('change', () => { toonAfslag(); reken(); });
    veld.stopt.addEventListener('input', reken);

    /* -------------------------- bewaren en controleren -------------------------- */

    // "Aanpassen" en "Instellen" bij Nog te controleren: open de instellingen op het juiste veld.
    for (const knop of document.querySelectorAll('[data-dp-aanpas]')) {
        knop.addEventListener('click', () => {
            el('depot-meer').open = true;
            const doel = el(knop.dataset.dpAanpas);
            doel.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            doel.focus({ preventScroll: true });
        });
    }

    // De maandtabel als werkblad voor Excel; hetzelfde rapport als de afdruk.
    el('btn-excel').addEventListener('click', async () => {
        if (!printknop.dataset.report) return;
        const rapport = JSON.parse(printknop.dataset.report);
        const [{ maandblad }, { maakXlsx }] = await Promise.all([import('../nieuwbouw/maandblad.js'), import('../js/xlsx.js')]);
        const invoer = [...uit.aannames.querySelectorAll('dt')].map((dt) => [dt.textContent, dt.nextElementSibling.textContent]);
        const blad = maandblad({ tabel: rapport.tables[0], toelichting: rapport.assumptions }, invoer, { titel: 'Bouwdepot: je maandlast, maand voor maand', pagina: 'bouwdepot-berekenen.html', blad: 'Bouwdepot' });
        geefDownload(maakXlsx(blad), 'bouwdepot-maandlast.xlsx', XLSX_TYPE);
    });

    // Een link met de invoer erin, om te bewaren of door te sturen.
    const kopieermelding = el('kopieer-melding');
    el('btn-kopieer').addEventListener('click', async () => {
        if (!laatsteInvoer) { kopieermelding.textContent = 'Vul eerst de gemarkeerde velden in; dan maken we de link.'; return; }
        const i = laatsteInvoer;
        const adres = `${location.origin}${location.pathname}?${naarAdres({
            bedrag: i.depot, rente: i.rentePercent, maanden: i.duurMaanden, looptijd: i.looptijdJaren, vorm: i.vorm,
            soort: i.soort === 'gelijk' ? null : i.soort, afslag: i.soort === 'lager' ? i.kortingDepotPercent : null,
            stopt: i.vergoedingMaanden, patroon: i.patroon === 'gelijk' ? null : i.patroon,
            woning: i.woning || null, woonlast: i.woonlast || null,
        })}`;
        try {
            await navigator.clipboard.writeText(adres);
            kopieermelding.textContent = 'Link gekopieerd. Je bedragen staan in de link zelf; wie hem krijgt, ziet dezelfde berekening.';
        } catch {
            kopieermelding.textContent = `Kopiëren lukte niet. Kopieer deze link zelf: ${adres}`;
        }
    });

    const koppelSchuif = (invoerveld, schuif) => {
        schuif.addEventListener('input', () => { invoerveld.value = schuif.value; reken(); });
        invoerveld.addEventListener('input', () => {
            const getal = leesGetal(invoerveld.value);
            if (getal !== null) schuif.value = getal;
            reken();
        });
    };
    koppelSchuif(veld.duur, schuifDuur);
    koppelSchuif(veld.looptijd, schuifLooptijd);

    for (const knop of document.querySelectorAll('[data-bedrag-keuze]')) {
        knop.addEventListener('click', () => {
            veld.bedrag.value = toonGetal(Number(knop.dataset.bedragKeuze));
            reken();
        });
    }

    // Op een telefoon is de tabel compact; deze knop zet alle kolommen terug,
    // en dan schuift de tabel opzij.
    const kolomknop = el('tabel-kolommen');
    kolomknop.addEventListener('click', () => {
        const volledig = uit.maandtabel.classList.toggle('is-volledig');
        kolomknop.textContent = volledig ? 'Compacte tabel' : 'Alle kolommen tonen';
        kolomknop.setAttribute('aria-pressed', String(volledig));
        el('tabel-uitleg').textContent = volledig ? 'Schuif de tabel opzij voor alle kolommen.' : 'Zelf te betalen is rente plus aflossing, min de depotvergoeding.';
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

    // Op een smal scherm staat de invoer onder de uitkomst. De balk houdt het
    // bedrag in beeld zodra de uitkomst zelf uit beeld is gescrold.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([item]) => {
            const heeftUitkomst = uit.vastBedrag.textContent.trim() !== '' && !uit.zin.dataset.status;
            uit.vast.classList.toggle('is-zichtbaar', !item.isIntersecting && heeftUitkomst);
        }).observe(el('uitkomst'));
    }

    toonAfslag();
    reken();
}

startRekenpagina(initDepot);
