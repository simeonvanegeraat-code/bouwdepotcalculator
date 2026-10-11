/**
 * De nieuwbouwpagina: invoer lezen, de rekenkern aanroepen, de uitkomst tonen.
 *
 * Hier staat geen rekenregel. Alle bedragen komen uit src/domain/nieuwbouw.js;
 * de uitkomst, de grafiek, de tabel en het afdrukoverzicht lezen dezelfde
 * maandregels. Wat dit bestand wel doet: velden controleren, het termijnschema
 * bijhouden, en zeggen wat er mis is in plaats van een nul te tonen.
 *
 * De veld-id's zijn die van de vorige versie van de pagina. Het gedeelde
 * formuliergeheugen (src/js/shared-form-memory.js) herkent velden daaraan, dus
 * rente en woonlast reizen nog steeds mee van en naar de andere rekenpagina's.
 */

import { bindReportButton, startRekenpagina } from '../js/rekenpagina.js';
import {
    leesGetal, leesPercentage, euro, maakVeldlezer, koppelBedragveld, koppelPercentageveld,
} from '../js/getallen.js';
import { HYPOTHEEKVORMEN } from '../domain/hypotheek.js';
import {
    berekenTijdlijn, controleerSchema, standaardTermijnen, vergelijk,
} from '../domain/nieuwbouw.js';
import { BANKEN } from '../js/bankdata.generated.js';
import { tekenTijdlijn } from './grafiek.js';

const GRENZEN = {
    'input-land': {
        lezer: leesGetal, min: 0, max: 2000000, exclusiefNul: false,
        leeg: 'Vul in welk deel van de koopsom de grond is, of nul als je de grond al hebt.',
        teLaag: 'Grondkosten onder de nul bestaan niet.',
        teHoog: 'Boven twee miljoen euro rekent deze tool niet; controleer het bedrag.',
    },
    'input-von': {
        lezer: leesGetal, min: 0, max: 5000000, exclusiefNul: true,
        leeg: 'Vul de koopsom v.o.n. in.',
        teLaag: 'Vul een koopsom boven de nul in.',
        teHoog: 'Boven vijf miljoen euro rekent deze tool niet; controleer het bedrag.',
    },
    'input-meerwerk': {
        lezer: leesGetal, min: 0, max: 1000000, exclusiefNul: false,
        leeg: 'Vul het meerwerk in dat je meefinanciert, of nul.',
        teLaag: 'Meerwerk onder de nul bestaat niet; minderwerk trek je van de koopsom af.',
        teHoog: 'Boven een miljoen euro meerwerk rekent deze tool niet; controleer het bedrag.',
    },
    'input-eigen-geld': {
        lezer: leesGetal, min: 0, max: 5000000, exclusiefNul: false,
        leeg: 'Vul je eigen geld in, of nul als je alles leent.',
        teLaag: 'Eigen geld onder de nul bestaat niet.',
        teHoog: 'Boven vijf miljoen euro rekent deze tool niet; controleer het bedrag.',
    },
    'input-interest': {
        lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
        leeg: 'Vul je hypotheekrente in.',
        teLaag: 'Een rente onder de nul procent bestaat niet; vul een positief percentage in.',
        teHoog: 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.',
    },
    'input-depot-discount': {
        lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
        leeg: 'Vul in hoeveel lager de rente over je depot is.',
        teLaag: 'Minder dan nul procentpunt lager kan niet.',
        teHoog: 'Boven de 20 procent kort geen enkele aanbieder; controleer het percentage.',
    },
    'input-build-months': {
        lezer: leesGetal, min: 1, max: 36, exclusiefNul: true,
        leeg: 'Vul in hoeveel maanden de bouw duurt.',
        teLaag: 'Een bouwduur begint bij één maand.',
        teHoog: 'Deze rekentool rekent met bouwduren tot 36 maanden.',
    },
    'input-current-housing': {
        lezer: leesGetal, min: 0, max: 100000, exclusiefNul: false,
        leeg: 'Vul je huidige woonlast in, of nul als je die niet hebt.',
        teLaag: 'Een woonlast onder de nul bestaat niet.',
        teHoog: 'Boven de honderdduizend euro per maand rekent deze tool niet.',
    },
    'input-overlap': {
        lezer: leesGetal, min: 0, max: 12, exclusiefNul: false,
        leeg: 'Vul in hoeveel maanden je huidige woonlast doorloopt na oplevering, of nul.',
        teLaag: 'Minder dan nul maanden kan niet.',
        teHoog: 'Deze rekentool rekent met hooguit twaalf maanden overlap.',
    },
    'input-vertraging': {
        lezer: leesGetal, min: 0, max: 12, exclusiefNul: false,
        leeg: 'Vul in hoeveel maanden later de oplevering is, of nul.',
        teLaag: 'Minder dan nul maanden kan niet.',
        teHoog: 'Deze rekentool rekent met hooguit twaalf maanden vertraging.',
    },
};

const procent = (waarde) => `${waarde.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const maanden = (n) => (n === 1 ? '1 maand' : `${n} maanden`);
const RANG = ['', 'eerste', 'tweede', 'derde', 'vierde', 'vijfde', 'zesde', 'zevende', 'achtste', 'negende', 'tiende', 'elfde', 'twaalfde'];
/** Een verschil met teken: "+ € 2.935" of "− € 120". */
const metTeken = (bedrag) => (Math.abs(bedrag) < 0.5 ? euro.format(0) : `${bedrag > 0 ? '+' : '−'} ${euro.format(Math.abs(bedrag))}`);

function initNieuwbouw() {
    const el = (id) => document.getElementById(id);
    const veld = {
        von: el('input-von'), grond: el('input-land'), meerwerk: el('input-meerwerk'), eigenGeld: el('input-eigen-geld'),
        rente: el('input-interest'), meefinancieren: el('input-meefinancieren'), depotSoort: el('input-depot-soort'),
        afslag: el('input-depot-discount'), bouwduur: el('input-build-months'), woonlast: el('input-current-housing'),
        overlap: el('input-overlap'), vertraging: el('input-vertraging'), vorm: el('input-vorm'),
    };
    const schuifBouwduur = el('range-build-months');
    const schuifVertraging = el('range-vertraging');
    const leesVeld = maakVeldlezer(GRENZEN);
    const printknop = el('btn-download');
    bindReportButton(printknop);

    for (const v of [veld.von, veld.grond, veld.meerwerk, veld.eigenGeld, veld.woonlast]) koppelBedragveld(v);
    const veldAfslag = el('veld-depot-discount');
    const toonAfslag = () => { veldAfslag.hidden = veld.depotSoort.value !== 'lager'; };
    for (const v of [veld.rente, veld.afslag]) koppelPercentageveld(v);
    for (const [sleutel, naam] of Object.entries(HYPOTHEEKVORMEN)) veld.vorm.add(new Option(naam, sleutel));

    /* ---------------------------- termijnschema ---------------------------- */

    const bouwduurNu = () => {
        const n = Math.round(leesGetal(veld.bouwduur.value) ?? 0);
        return n >= 1 && n <= 36 ? n : 12;
    };
    let termijnen = standaardTermijnen(bouwduurNu());
    // Zonder eigen schema volgt het voorbeeld de bouwduur. Een eigen schema
    // laten we met rust: het overschrijven omdat de bouwduur verandert is erger
    // dan een schema dat niet meer bij die duur past; dat laatste wordt gemeld.
    let zelfIngesteld = false;

    function volgBouwduur() {
        if (zelfIngesteld) return;
        termijnen = standaardTermijnen(bouwduurNu());
    }

    // Het scherm "Wanneer factureert je bouwer?" (src/nieuwbouw/schemascherm.js)
    // levert hier een heel schema aan; null betekent terug naar het voorbeeld.
    document.addEventListener('nieuwbouw:zet-schema', (e) => {
        const nieuw = e.detail?.termijnen;
        if (nieuw) {
            zelfIngesteld = true;
            // soort: 'meerwerk' markeert een betaalmoment van het meerwerk; de rekenkern
            // behandelt het als elke andere termijn, het scherm herkent het eraan.
            termijnen = nieuw.map((t) => ({ maand: t.maand, percent: t.percent, naam: t.naam, ...(t.soort ? { soort: t.soort } : {}) })).sort((a, b) => a.maand - b.maand);
        } else {
            zelfIngesteld = false;
            volgBouwduur();
        }
        reken();
    });

    /* ------------------------------- uitkomst ------------------------------- */

    const uit = {
        bedrag: el('res-peak-total'), zin: el('res-peak-month'), opbouw: el('res-opbouw'),
        eerste: el('res-eerste'), daarna: el('res-daarna'), bovenop: el('res-bovenop'), bovenopNoot: el('res-bovenop-noot'),
        rente: el('res-loss'), aanneemsom: el('res-aanneemsom'), termijnmelding: el('res-termijnmelding'), lening: el('res-lening'), leningNoot: el('res-lening-noot'), samenvatting: el('res-samenvatting'), verschil: el('res-verschil'),
        scenariotekst: el('res-scenario'), tabel: el('details-table-body'), grafiek: el('verloop-grafiek'),
        aannames: el('res-aannames'), vast: el('wr-vast'), vastBedrag: el('wr-vast-bedrag'),
        legendaBasis: el('legenda-basis'),
    };
    let laatsteGrafiek = null;

    function toonGeenUitkomst(klachten) {
        uit.lening.textContent = '–';
        uit.leningNoot.textContent = '';
        uit.termijnmelding.hidden = true;
        uit.bedrag.firstChild.textContent = '–';
        uit.zin.dataset.status = 'afwijkend';
        uit.zin.textContent = klachten.length
            ? `${klachten.join(' ')} Pas het termijnschema aan voor een uitkomst.`
            : 'Pas de gemarkeerde velden aan voor een uitkomst.';
        uit.opbouw.textContent = '';
        for (const e of [uit.eerste, uit.daarna, uit.bovenop, uit.rente]) e.firstChild.textContent = '–';
        uit.samenvatting.textContent = 'Zolang de invoer niet klopt, tonen we geen grafiek: een half schema levert een bedrag op dat er hetzelfde uitziet als een goed bedrag.';
        uit.grafiek.innerHTML = '';
        uit.tabel.innerHTML = '';
        uit.verschil.hidden = true;
        uit.scenariotekst.textContent = '';
        uit.vast.classList.remove('is-zichtbaar');
        laatsteGrafiek = null;
        delete printknop.dataset.report;
        document.dispatchEvent(new CustomEvent('nieuwbouw:berekend', { detail: { tijdlijn: null, termijnen: termijnen.length, eigenSchema: zelfIngesteld, schema: termijnen.map((x) => ({ ...x })) } }));
    }

    function faseTekst(t, r) {
        if (r.fase === 'bouw') return r.maand === t.oplevermaand ? 'de maand van oplevering' : `bouwmaand ${r.maand} van ${t.oplevermaand}`;
        return `de ${RANG[r.maand - t.oplevermaand] ?? `${r.maand - t.oplevermaand}e`} maand na oplevering`;
    }

    function tekenGrafiek() {
        if (laatsteGrafiek) tekenTijdlijn(uit.grafiek, laatsteGrafiek);
    }

    function reken() {
        const schema = controleerSchema(termijnen, bouwduurNu());

        // De afslag doet alleen mee als de bezoeker "lager" heeft gekozen; anders
        // mag een leeg of fout afslagveld de berekening niet tegenhouden.
        const soort = veld.depotSoort.value;
        const rente = leesVeld(veld.rente);
        const afslag = soort === 'lager' ? leesVeld(veld.afslag) : soort === 'geen' ? rente : 0;
        const gelezen = {
            von: leesVeld(veld.von), grond: leesVeld(veld.grond), meerwerk: leesVeld(veld.meerwerk), eigenGeld: leesVeld(veld.eigenGeld),
            rentePercent: rente, kortingDepotPercent: afslag, bouwduurMaanden: leesVeld(veld.bouwduur),
            huidigeWoonlast: leesVeld(veld.woonlast), overlapNaOplevering: leesVeld(veld.overlap),
            vertraging: leesVeld(veld.vertraging),
        };
        uit.aanneemsom.textContent = gelezen.von !== null && gelezen.grond !== null && gelezen.meerwerk !== null && gelezen.grond < gelezen.von
            ? euro.format(gelezen.von - gelezen.grond + gelezen.meerwerk) : '–';
        if (Object.values(gelezen).some((w) => w === null)) { toonGeenUitkomst([]); return; }
        // Twee combinaties die elk veld apart goedkeurt maar samen niet kunnen.
        const weiger = (id, v, tekst) => {
            el(id).textContent = tekst;
            v.setAttribute('aria-invalid', 'true');
            toonGeenUitkomst([]);
        };
        if (gelezen.grond >= gelezen.von) { weiger('fout-land', veld.grond, 'De grond kan niet evenveel of meer kosten dan de koopsom v.o.n.'); return; }
        if (gelezen.eigenGeld > gelezen.von + gelezen.meerwerk) { weiger('fout-eigen-geld', veld.eigenGeld, 'Je eigen geld is hoger dan koopsom en meerwerk samen; controleer het bedrag.'); return; }
        if (schema.klachten.length) { toonGeenUitkomst(schema.klachten); return; }

        const invoer = {
            grond: gelezen.grond,
            aanneemsom: gelezen.von - gelezen.grond + gelezen.meerwerk,
            eigenGeld: gelezen.eigenGeld,
            rentePercent: gelezen.rentePercent,
            kortingDepotPercent: gelezen.kortingDepotPercent,
            bouwduurMaanden: Math.round(gelezen.bouwduurMaanden),
            huidigeWoonlast: gelezen.huidigeWoonlast,
            overlapNaOplevering: Math.round(gelezen.overlapNaOplevering),
            renteMeefinancieren: veld.meefinancieren.value === 'mee',
            vorm: veld.vorm.value,
            termijnen,
        };
        const vertraging = Math.round(gelezen.vertraging);
        const v = vergelijk(invoer, { vertragingMaanden: vertraging });
        const t = vertraging > 0 ? v.scenario : v.basis;
        const { piek, sommen } = t;

        /* Wat er geleend wordt: afgeleid van de invoer, dus meteen terug te zien. */
        uit.lening.textContent = euro.format(t.lening);
        uit.leningNoot.textContent = t.lening === 0
            ? '. Je leent niets, dus er is geen hypotheeklast.'
            : `${t.meegefinancierd > 0.5 ? `, inclusief ${euro.format(t.meegefinancierd)} meegefinancierde rente` : ''}. Daarvan staat ${euro.format(t.depotBijStart)} bij de start in je bouwdepot.`;

        /* Het ene bedrag, en waar het uit bestaat. */
        uit.bedrag.firstChild.textContent = euro.format(piek.totaal);
        delete uit.zin.dataset.status;
        uit.zin.textContent = `Maand ${piek.maand}: ${faseTekst(t, piek)}.`;
        uit.opbouw.textContent = piek.woonlast > 0
            ? `${euro.format(piek.hypotheek)} nieuwe hypotheek${piek.vergoeding > 0.5 ? ' na depotvergoeding' : ''} plus ${euro.format(piek.woonlast)} huidige woonlast.`
            : `${euro.format(piek.hypotheek)} nieuwe hypotheek${piek.vergoeding > 0.5 ? ' na depotvergoeding' : ''}; je hebt geen huidige woonlast ingevuld.`;
        uit.eerste.firstChild.textContent = euro.format(t.regels[0].totaal);
        uit.daarna.firstChild.textContent = euro.format(t.maandlastDaarna);
        uit.bovenop.firstChild.textContent = euro.format(sommen.hypotheekTijdensDubbel);
        uit.bovenopNoot.textContent = `over de ${maanden(sommen.maandenDubbel)} tot je huidige woonlast stopt`;
        uit.rente.firstChild.textContent = euro.format(sommen.renteNaVergoeding);
        uit.vastBedrag.textContent = euro.format(piek.totaal);

        /* Loopt de bouw langer dan de vergoeding bij veel aanbieders duurt? Het
           model laat de vergoeding doorlopen, dus dat hoort erbij gezegd. */
        const gestopt = BANKEN.filter((b) => {
            const duur = b.vergoeding?.maanden?.nieuwbouw;
            return typeof duur === 'number' && duur > 0 && duur < t.oplevermaand;
        }).length;
        uit.termijnmelding.hidden = gestopt === 0;
        if (gestopt > 0) {
            uit.termijnmelding.innerHTML = `Je bouw loopt ${t.oplevermaand} maanden. Bij ${gestopt} van de ${BANKEN.length} aanbieders in onze vergelijking is de depotvergoeding dan al gestopt, terwijl deze berekening hem laat doorlopen. Je werkelijke last ligt in de laatste maanden dan hoger. <a href="bouwdepot-voorwaarden-vergelijken.html">Bekijk de termijn van jouw bank</a>.`;
        }

        /* Grafiek en de zin eronder. */
        const laatsteBouw = t.regels[t.oplevermaand - 1];
        const samenvatting = `Je betaalt in maand 1 ${euro.format(t.regels[0].totaal)} en in maand ${t.oplevermaand}, bij oplevering, ${euro.format(laatsteBouw.totaal)}. `
            + `De hoogste maand is maand ${piek.maand} met ${euro.format(piek.totaal)}. `
            + `Vanaf maand ${t.eindeOverlap + 1} betaal je ${euro.format(t.maandlastDaarna)} per maand.`;
        uit.samenvatting.textContent = samenvatting;
        laatsteGrafiek = {
            regels: t.regels, piek, oplevermaand: t.oplevermaand, eindeOverlap: t.eindeOverlap,
            basis: vertraging > 0 ? v.basis.regels : null,
            omschrijving: `Staafgrafiek van de bruto maandlast over ${t.regels.length} maanden. ${samenvatting}`,
        };
        uit.legendaBasis.hidden = vertraging === 0;
        tekenGrafiek();

        /* Scenario: wat verandert er bij een latere oplevering. */
        uit.verschil.hidden = vertraging === 0;
        if (vertraging > 0) {
            const d = v.verschil;
            el('ver-cumulatief').firstChild.textContent = metTeken(d.cumulatief);
            el('ver-cumulatief-noot').textContent = `over dezelfde ${v.horizon} maanden`;
            el('ver-woonlast').firstChild.textContent = metTeken(d.woonlast);
            el('ver-woonlast-noot').textContent = `${maanden(d.maandenDubbel)} langer je huidige woonlast`;
            el('ver-vergoeding').firstChild.textContent = metTeken(-d.vergoeding);
            el('ver-vergoeding-noot').textContent = 'extra depotvergoeding over wat langer in depot blijft';
            el('ver-piek').firstChild.textContent = metTeken(d.piek);
            el('ver-piek-noot').textContent = `de hoogste maand schuift van maand ${v.basis.piek.maand} naar maand ${v.scenario.piek.maand}`;
            const restdepot = v.scenario.regels[invoer.bouwduurMaanden - 1].depot;
            uit.scenariotekst.textContent = `${maanden(vertraging)[0].toUpperCase()}${maanden(vertraging).slice(1)} later opgeleverd kost in dit model ${euro.format(Math.abs(d.cumulatief))} ${d.cumulatief >= 0 ? 'meer' : 'minder'} over dezelfde ${v.horizon} maanden. `
                + `Dat is niet ${vertraging} keer je woonlast: in die maanden blijft er ${euro.format(restdepot)} in depot staan, en daarover loopt de vergoeding door.`;
        } else {
            uit.scenariotekst.textContent = 'Zet de oplevering een paar maanden later om te zien wat er verandert. De grafiek, de tabel en de bedragen hierboven rekenen mee.';
        }

        /* Tabel: dezelfde regels als de grafiek. */
        uit.tabel.innerHTML = t.regels.map((r) => {
            let fase = r.fase === 'bouw' ? (r.termijn ?? '') : r.fase === 'overlap' ? 'Na oplevering, nog dubbel' : 'Alleen de hypotheek';
            if (r.uitEigenGeld > 0.5) fase += ` (${euro.format(r.uitEigenGeld)} uit eigen geld)`;
            if (r.renteUitDepot > 0.5) fase += ` · ${euro.format(r.renteUitDepot)} rente uit depot`;
            const grens = r.maand === t.oplevermaand || r.maand === t.eindeOverlap ? ' data-grens' : '';
            // Op een telefoon staat de kolom met fase of termijn niet in beeld.
            // Wat daar bijzonder aan is krijgt dan een eigen regel onder de
            // maand: een betaalde termijn, de hoogste maand, een nieuwe fase.
            const eersteVanFase = r.fase !== 'bouw' && t.regels[r.maand - 2]?.fase !== r.fase;
            const noot = [r === piek ? 'Hoogste maand' : '', r.fase === 'bouw' || eersteVanFase ? fase : '',
                r.opname ? `${euro.format(r.opname)} uit depot` : ''].filter(Boolean).join(' · ');
            const klassen = (extra) => [r === piek ? 'is-piek' : '', extra].filter(Boolean).join(' ');
            const nootRij = noot ? `<tr class="${klassen('wr-tabel__noot')}" data-fase="${r.fase}"${grens}><td colspan="10">${noot}</td></tr>` : '';
            return `<tr data-fase="${r.fase}"${r === piek ? ' class="is-piek"' : ''}${grens}${noot ? ' data-met-noot' : ''}>
                <td>${r.maand}${r === piek ? '<span class="wr-tabel__lang"> (hoogste)</span>' : ''}</td><td>${fase}</td>
                <td>${r.opname ? euro.format(r.opname) : '–'}</td><td>${euro.format(r.depot)}</td>
                <td>${euro.format(r.rente)}</td><td>${euro.format(r.aflossing)}</td>
                <td>${r.vergoeding > 0.005 ? `− ${euro.format(r.vergoeding)}` : '–'}</td>
                <td>${euro.format(r.hypotheek)}</td><td>${r.woonlast ? euro.format(r.woonlast) : '–'}</td>
                <td>${euro.format(r.totaal)}</td></tr>${nootRij}`;
        }).join('');

        /* Aannames: de invoer waarmee is gerekend, leesbaar terug. */
        const depotrente = Math.max(0, invoer.rentePercent - invoer.kortingDepotPercent);
        uit.aannames.innerHTML = [
            ['Koopsom v.o.n.', euro.format(gelezen.von)],
            ['waarvan grond', euro.format(invoer.grond)],
            ['Meerwerk, meegefinancierd', gelezen.meerwerk ? euro.format(gelezen.meerwerk) : 'geen'],
            ['Aanneemsom met meerwerk', euro.format(invoer.aanneemsom)],
            ['Eigen geld', invoer.eigenGeld ? euro.format(invoer.eigenGeld) : 'geen'],
            ['Rente tijdens de bouw', invoer.renteMeefinancieren ? `meegefinancierd: ${euro.format(t.meegefinancierd)}` : 'betaal je zelf'],
            ['Hypotheek', euro.format(t.lening)],
            ['waarvan in depot bij de start', euro.format(t.depotBijStart)],
            ['Hypotheekvorm', `${HYPOTHEEKVORMEN[invoer.vorm]}, 30 jaar`],
            ['Hypotheekrente', procent(invoer.rentePercent)],
            ['Rente over het depot', depotrente > 0 ? procent(depotrente) : 'geen vergoeding'],
            ['Bouwduur', maanden(invoer.bouwduurMaanden) + (vertraging ? ` + ${maanden(vertraging)} vertraging` : '')],
            ['Huidige woonlast', invoer.huidigeWoonlast ? `${euro.format(invoer.huidigeWoonlast)} per maand` : 'niet ingevuld'],
            ['Loopt door na oplevering', maanden(invoer.overlapNaOplevering)],
            ['Bouwtermijnen', `${termijnen.length}${zelfIngesteld ? ', zelf ingesteld' : ', voorbeeldschema'}`],
        ].map(([naam, waarde]) => `<dt>${naam}</dt><dd>${waarde}</dd>`).join('');

        /* Afdrukoverzicht: dezelfde maandregels, als ruwe getallen. */
        printknop.dataset.report = JSON.stringify({
            toolTitle: 'Nieuwbouwplanning en zwaarste maand',
            generatedAt: new Date().toISOString(),
            inputs: {
                vonPrice: gelezen.von, landCost: invoer.grond, extraWork: gelezen.meerwerk, constructionCost: invoer.aanneemsom,
                availableOwnFunds: invoer.eigenGeld, interestFinanced: t.meegefinancierd,
                totalMortgage: t.lening, mortgageRate: invoer.rentePercent,
                depotRateDiscount: depotrente, mortgageType: HYPOTHEEKVORMEN[invoer.vorm],
                buildMonths: invoer.bouwduurMaanden, delayMonths: vertraging,
                currentHousingCost: invoer.huidigeWoonlast, overlapAfterDelivery: invoer.overlapNaOplevering,
                termsCount: termijnen.length,
            },
            results: {
                planningMainOutcome: 'Zwaarste maand, bruto',
                peakMonth: piek.maand, peakTotalMonthly: piek.totaal, monthlyAfter: t.maandlastDaarna,
                periodNetTotal: sommen.hypotheekTijdensDubbel, overlapTotal: sommen.woonlastTijdensDubbel,
                totalInterestLoss: sommen.renteNaVergoeding,
            },
            conclusion: `${uit.zin.textContent} ${uit.opbouw.textContent}`,
            interpretation: samenvatting,
            tables: [{
                title: 'Maand voor maand',
                columns: [
                    { key: 'maand', label: 'Mnd', type: 'text' },
                    { key: 'depot', label: 'Depot eind maand', type: 'currency' },
                    { key: 'rente', label: 'Rente', type: 'currency' },
                    { key: 'aflossing', label: 'Aflossing', type: 'currency' },
                    { key: 'vergoeding', label: 'Depotvergoeding', type: 'currency' },
                    { key: 'hypotheek', label: 'Hypotheek na vergoeding', type: 'currency' },
                    { key: 'woonlast', label: 'Huidige woonlast', type: 'currency' },
                    { key: 'totaal', label: 'Bruto totaal', type: 'currency' },
                ],
                rows: t.regels.map(({ maand, depot, rente, aflossing, vergoeding, hypotheek, woonlast, totaal }) => ({ maand, depot, rente, aflossing, vergoeding, hypotheek, woonlast, totaal })),
            }],
            assumptions: 'Indicatieve planning, bruto en zonder hypotheekrenteaftrek. Vaste rente, 30 jaar, de ingevoerde termijnen en een vergoeding over het depot zolang er saldo is. Werkelijke timing, declaraties en bankvoorwaarden kunnen afwijken.',
        });

        // Voor wat meekijkt met de uitkomst: de stappen onthouden hierop de
        // invoer (src/nieuwbouw/stappen.js). Dezelfde tijdlijn als grafiek en tabel.
        document.dispatchEvent(new CustomEvent('nieuwbouw:berekend', { detail: { tijdlijn: t, termijnen: termijnen.length, eigenSchema: zelfIngesteld, schema: termijnen.map((x) => ({ ...x })) } }));
    }

    /* -------------------------------- binden -------------------------------- */

    for (const v of [veld.eigenGeld, veld.rente, veld.afslag, veld.woonlast, veld.overlap]) v.addEventListener('input', reken);
    for (const v of [veld.von, veld.grond, veld.meerwerk]) v.addEventListener('input', reken);
    veld.meefinancieren.addEventListener('change', reken);
    veld.vorm.addEventListener('change', reken);
    veld.depotSoort.addEventListener('change', () => { toonAfslag(); reken(); });

    const koppelSchuif = (invoerveld, schuif, na) => {
        schuif.addEventListener('input', () => { invoerveld.value = schuif.value; na(); reken(); });
        invoerveld.addEventListener('input', () => {
            const n = leesGetal(invoerveld.value);
            if (n !== null) schuif.value = n;
            na(); reken();
        });
    };
    koppelSchuif(veld.bouwduur, schuifBouwduur, volgBouwduur);
    koppelSchuif(veld.vertraging, schuifVertraging, () => {});
    el('reset-scenario-btn').addEventListener('click', () => { veld.vertraging.value = '0'; schuifVertraging.value = 0; reken(); });


    // Op een telefoon is de tabel compact; deze knop zet alle kolommen terug,
    // en dan schuift de tabel opzij.
    const kolomknop = el('tabel-kolommen');
    kolomknop.addEventListener('click', () => {
        const volledig = el('maandtabel').classList.toggle('is-volledig');
        kolomknop.textContent = volledig ? 'Compacte tabel' : 'Alle kolommen tonen';
        kolomknop.setAttribute('aria-pressed', String(volledig));
        el('tabel-uitleg').textContent = volledig ? 'Schuif de tabel opzij voor alle kolommen.' : 'Totaal is je hypotheek plus je huidige woonlast.';
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

startRekenpagina(initNieuwbouw);
