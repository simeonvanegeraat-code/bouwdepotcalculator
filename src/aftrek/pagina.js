/**
 * hypotheekrenteaftrek-gids.html: invoer lezen, de rekenkern aanroepen, de
 * uitkomst tonen.
 *
 * Hier staat geen belastingregel. Alle bedragen komen uit
 * src/domain/renteaftrek.js; de uitkomst, de grafiek, de tabel en het
 * afdrukoverzicht lezen dezelfde jaarregels.
 *
 * De veld-id's van bedrag, rente en hypotheekvorm zijn die van de vorige versie
 * van de pagina, en de hypotheekvorm houdt de waarden 'annuity' en 'linear'.
 * Het gedeelde formuliergeheugen (src/js/shared-form-memory.js) herkent velden
 * daaraan.
 */

import { bindReportButton, startRekenpagina } from '../js/rekenpagina.js';
import {
    leesGetal, leesPercentage, toonGetal, euro, maakVeldlezer, koppelBedragveld, koppelPercentageveld,
} from '../js/getallen.js';
import { setMemoryLockById } from '../js/shared-form-memory';
import { TAX_RULES_2026 } from '../js/fiscal-rules.js';
import { berekenAftrek } from '../domain/renteaftrek.js';
import { maakVerloop } from './verloop.js';

const bedragveld = (leeg, max, teHoog, exclusiefNul = false) => ({
    lezer: leesGetal, min: 0, max, exclusiefNul, leeg,
    teLaag: exclusiefNul ? 'Vul een bedrag boven de nul in.' : 'Een bedrag onder de nul kan niet.',
    teHoog,
});

const GRENZEN = {
    'fiscal-amount': bedragveld('Vul je hypotheekbedrag in.', 5000000, 'Boven vijf miljoen euro rekent deze tool niet; controleer het bedrag.', true),
    'fiscal-interest': {
        lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
        leeg: 'Vul je hypotheekrente in.',
        teLaag: 'Een rente onder de nul procent bestaat niet; vul een positief percentage in.',
        teHoog: 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.',
    },
    'fiscal-looptijd': {
        lezer: leesGetal, min: 1, max: 30, exclusiefNul: true,
        leeg: 'Vul in hoeveel jaar je hypotheek nog loopt.',
        teLaag: 'Vul minstens één jaar in.',
        teHoog: 'Hypotheekrente is hooguit dertig jaar aftrekbaar.',
    },
    // De WOZ-waarde bepaalt het eigenwoningforfait; nul zou dat op nul zetten
    // en het voordeel te rooskleurig maken.
    'fiscal-woz': bedragveld('Vul de WOZ-waarde van je woning in.', 10000000, 'Boven tien miljoen euro rekent deze tool niet; controleer de waarde.', true),
    'fiscal-income': bedragveld('Vul je bruto jaarinkomen in.', 2000000, 'Boven twee miljoen euro per jaar rekent deze tool niet.', true),
    'fiscal-income-partner': bedragveld('Vul het bruto jaarinkomen van je partner in, of nul.', 2000000, 'Boven twee miljoen euro per jaar rekent deze tool niet.'),
    'cost-advice': bedragveld('Vul de advies- en bemiddelingskosten in, of nul.', 100000, 'Controleer het bedrag: dit is meer dan een ton.'),
    'cost-notary': bedragveld('Vul de notariskosten voor de hypotheekakte in, of nul.', 100000, 'Controleer het bedrag: dit is meer dan een ton.'),
    'cost-valuation': bedragveld('Vul de taxatiekosten in, of nul.', 100000, 'Controleer het bedrag: dit is meer dan een ton.'),
    'cost-nhg': bedragveld('Vul de NHG-kosten in, of nul.', 100000, 'Controleer het bedrag: dit is meer dan een ton.'),
};

const VORMEN = { annuity: ['annuiteit', 'Annuïteiten'], linear: ['lineair', 'Lineair'] };
const procent = (breuk, decimalen = 2) => `${(breuk * 100).toLocaleString('nl-NL', { minimumFractionDigits: decimalen, maximumFractionDigits: decimalen })}%`;
const jaren = (n) => (n === 1 ? '1 jaar' : `${n} jaar`);

function initAftrek() {
    const el = (id) => document.getElementById(id);
    const veld = {
        bedrag: el('fiscal-amount'), rente: el('fiscal-interest'), vorm: el('fiscal-type'), looptijd: el('fiscal-looptijd'),
        woz: el('fiscal-woz'), inkomen: el('fiscal-income'), aow: el('fiscal-aow'),
        partner: el('fiscal-partner'), inkomenPartner: el('fiscal-income-partner'), aowPartner: el('fiscal-aow-partner'), verdeling: el('fiscal-verdeling'),
        advies: el('cost-advice'), notaris: el('cost-notary'), taxatie: el('cost-valuation'), nhg: el('cost-nhg'),
    };
    const kostenvelden = [veld.advies, veld.notaris, veld.taxatie, veld.nhg];
    const leesVeld = maakVeldlezer(GRENZEN);
    const printknop = el('btn-download-fiscal');
    bindReportButton(printknop);

    // bouwdepot-berekenen.html linkt hierheen met bedrag en rente in de URL.
    const params = new URLSearchParams(window.location.search);
    const uitUrl = (naam, doel, lezer) => {
        const waarde = lezer(params.get(naam) ?? '');
        if (waarde === null || !(waarde > 0)) return;
        doel.value = String(waarde).replace('.', ',');
        setMemoryLockById(doel.id);
    };
    uitUrl('amount', veld.bedrag, (s) => (Number.isFinite(Number(s)) && s !== '' ? Math.round(Number(s)) : null));
    uitUrl('interest', veld.rente, (s) => (Number.isFinite(Number(s)) && s !== '' ? Number(s) : null));

    for (const v of [veld.bedrag, veld.woz, veld.inkomen, veld.inkomenPartner, ...kostenvelden]) koppelBedragveld(v);
    koppelPercentageveld(veld.rente);

    const uit = {
        label: el('res-label'), bedrag: el('res-terug'), bedragEenheid: el('res-terug-eenheid'), zin: el('res-zin'), noot: el('res-noot'),
        dtNetto: el('dt-netto'), dtBruto: el('dt-bruto'), dtAnder: el('dt-ander'), verloopMicro: el('verloop-micro'),
        jaar: el('res-terug-jaar'), netto: el('res-netto-month'), bruto: el('res-bruto-month'),
        tarief: el('res-tarief'), tariefNoot: el('res-tarief-noot'),
        balkNetto: el('balk-netto'), balkTerug: el('balk-terug'), legNetto: el('leg-netto'), legTerug: el('leg-terug'), balk: el('res-balk'),
        eenmalig: el('rij-eenmalig'), eenmaligBedrag: el('res-eenmalig'),
        villa: el('villataks-alert'), partnerblok: el('blok-partner'), nhgHulp: el('hulp-nhg-bedrag'),
        samenvatting: el('res-samenvatting'), tabel: el('details-table-body'), aannames: el('res-aannames'),
        jaarKop: el('jaar-kop'), jaarBruto: el('jaar-bruto'), jaarTerug: el('jaar-terug'), jaarNetto: el('jaar-netto'), jaarRente: el('jaar-rente'),
        schuif: el('jaar-schuif'), speelknop: el('speel-knop'), legendaBij: el('legenda-bij'),
        vast: el('wr-vast'), vastBedrag: el('wr-vast-bedrag'), vastLabel: el('wr-vast-label'),
    };
    let laatste = null;
    // De bezoeker kiest of hij de bedragen per maand of per jaar ziet. De
    // rekenkern werkt in jaren; hier wordt alleen gedeeld.
    let perJaar = false;
    const deel = () => (perJaar ? 1 : 12);
    const eenheid = () => (perJaar ? 'per jaar' : 'per maand');

    /* ---------------------- het verloop over de jaren ---------------------- */

    function toonJaar(nr) {
        if (!laatste) return;
        const r = laatste.jaren[Math.min(nr, laatste.jaren.length) - 1];
        uit.schuif.value = r.jaar;
        uit.jaarKop.textContent = `Jaar ${r.jaar}`;
        uit.jaarBruto.textContent = euro.format(r.bruto / deel());
        uit.jaarTerug.textContent = r.voordeel >= 0 ? euro.format(r.voordeel / deel()) : `− ${euro.format(-r.voordeel / deel())}`;
        uit.jaarNetto.textContent = euro.format(r.netto / deel());
        uit.jaarRente.textContent = `${euro.format(r.rente)} rente in dat jaar, ${euro.format(r.forfait)} eigenwoningforfait.`;
    }

    const verloop = maakVerloop(el('verloop-grafiek'), {
        opKies: toonJaar,
        opStand: (speelt) => { uit.speelknop.textContent = speelt ? 'stop animatie' : 'speel opnieuw af'; },
    });
    uit.schuif.addEventListener('input', () => { verloop.kies(Number(uit.schuif.value)); toonJaar(Number(uit.schuif.value)); });
    uit.speelknop.hidden = !verloop.kanBewegen;
    uit.speelknop.addEventListener('click', () => { if (verloop.speelt) verloop.stop(); else verloop.speel(); });

    /* -------------------------------- rekenen ------------------------------- */

    function toonGeenUitkomst() {
        laatste = null;
        uit.bedrag.firstChild.textContent = '–';
        uit.zin.dataset.status = 'afwijkend';
        uit.zin.textContent = 'Pas de gemarkeerde velden aan voor een uitkomst.';
        uit.noot.textContent = '';
        for (const e of [uit.jaar, uit.netto, uit.bruto, uit.tarief]) e.firstChild.textContent = '–';
        uit.balk.hidden = true;
        uit.eenmalig.hidden = true;
        uit.villa.hidden = true;
        uit.samenvatting.textContent = 'Zolang de invoer niet klopt, tonen we geen grafiek: een half ingevuld formulier levert een bedrag op dat er hetzelfde uitziet als een goed bedrag.';
        verloop.leeg();
        uit.tabel.innerHTML = '';
        uit.aannames.innerHTML = '';
        for (const e of [uit.jaarBruto, uit.jaarTerug, uit.jaarNetto]) e.textContent = '–';
        uit.jaarRente.textContent = '';
        uit.vast.classList.remove('is-zichtbaar');
        delete printknop.dataset.report;
    }

    function reken() {
        const metPartner = veld.partner.checked;
        uit.partnerblok.hidden = !metPartner;

        const gelezen = {
            hypotheek: leesVeld(veld.bedrag), rentePercent: leesVeld(veld.rente), looptijdJaren: leesVeld(veld.looptijd),
            woz: leesVeld(veld.woz), inkomen: leesVeld(veld.inkomen),
            inkomenPartner: metPartner ? leesVeld(veld.inkomenPartner) : 0,
            advies: leesVeld(veld.advies), notaris: leesVeld(veld.notaris), taxatie: leesVeld(veld.taxatie), nhg: leesVeld(veld.nhg),
        };
        if (gelezen.hypotheek !== null) uit.nhgHulp.textContent = `Bij jouw hypotheek is 0,4% ${euro.format(gelezen.hypotheek * TAX_RULES_2026.nhgFeeRate)}.`;
        if (Object.values(gelezen).some((w) => w === null)) { toonGeenUitkomst(); return; }

        const eenmaligeKosten = gelezen.advies + gelezen.notaris + gelezen.taxatie + gelezen.nhg;
        const invoer = {
            hypotheek: gelezen.hypotheek, rentePercent: gelezen.rentePercent, looptijdJaren: Math.round(gelezen.looptijdJaren),
            vorm: VORMEN[veld.vorm.value]?.[0] ?? 'annuiteit',
            woz: gelezen.woz, inkomen: gelezen.inkomen, aow: veld.aow.checked,
            partner: metPartner, inkomenPartner: gelezen.inkomenPartner, aowPartner: metPartner && veld.aowPartner.checked,
            verdeling: veld.verdeling.value,
            eenmaligeKosten,
        };
        const t = berekenAftrek(invoer);
        laatste = t;
        const j1 = t.eerste;
        const n = t.jaren.length;
        const positief = j1.voordeel >= 0;
        // Koos de bezoeker zelf een verdeling, dan hoort erbij wat de gunstigste had opgeleverd.
        const gemist = metPartner && invoer.verdeling !== 'beste'
            ? berekenAftrek({ ...invoer, verdeling: 'beste' }).eerste.voordeel - j1.voordeel : 0;

        /* Het ene bedrag. Bruto en netto worden exact afgerond; wat je
           terugkrijgt is op het scherm hun verschil, zodat de regel optelt. */
        const bruto = Math.round(j1.bruto / deel()), netto = Math.round(j1.netto / deel());
        for (const e of document.querySelectorAll('[data-eenheid]')) e.textContent = eenheid();
        for (const e of document.querySelectorAll('[data-eenheid-kort]')) e.textContent = perJaar ? '/jaar' : '/mnd';
        uit.bedragEenheid.textContent = `${eenheid()}, jaar 1`;
        uit.dtNetto.textContent = perJaar ? 'Netto per jaar' : 'Netto maandlast';
        uit.dtBruto.textContent = perJaar ? 'Bruto per jaar' : 'Bruto maandlast';
        uit.dtAnder.textContent = perJaar ? 'Belastingvoordeel per maand' : 'Belastingvoordeel per jaar';
        uit.verloopMicro.textContent = `${perJaar ? 'Per jaar' : 'Per maand'}, regels van 2026`;
        uit.label.textContent = positief ? `Dit krijg je ${eenheid()} terug door hypotheekrenteaftrek` : `Dit betaal je ${eenheid()} aan belasting over je woning`;
        uit.bedrag.firstChild.textContent = euro.format(Math.abs(bruto - netto));
        delete uit.zin.dataset.status;
        uit.zin.textContent = positief
            ? `Je betaalt in het eerste jaar ${euro.format(j1.rente)} hypotheekrente. Daar gaat ${euro.format(j1.forfait)} eigenwoningforfait vanaf. Per saldo scheelt dat ${euro.format(j1.voordeel)} belasting per jaar${j1.extraKorting > 0.5 ? `, waarvan ${euro.format(j1.extraKorting)} doordat je meer algemene heffingskorting krijgt` : ''}.`
            : `Je betaalt in het eerste jaar ${euro.format(j1.rente)} hypotheekrente, minder dan je eigenwoningforfait van ${euro.format(j1.forfait)}. Van het verschil telt ${procent(1 - TAX_RULES_2026.hillenDeductionRate, 3)} bij je inkomen: dat kost ${euro.format(-j1.voordeel)} belasting per jaar.`;
        uit.noot.textContent = [
            j1.tariefsaanpassing > 0.5 ? `Je inkomen valt in de hoogste schijf: je rente telt daar voor ${procent(TAX_RULES_2026.maxMortgageDeductionRate)} en niet voor ${procent(TAX_RULES_2026.thirdRate)}, terwijl het forfait wel tegen ${procent(TAX_RULES_2026.thirdRate)} wordt belast.` : '',
            metPartner ? `Gerekend met de aftrek bij ${j1.bij}${invoer.verdeling === 'beste' ? ': dat is in jaar 1 de gunstigste verdeling' : ''}.` : '',
            gemist > 0.5 ? `De gunstigste verdeling zou ${euro.format(gemist)} per jaar meer opleveren.` : '',
            (j1.deelBijJou > 0 && invoer.aow) || (j1.deelBijJou < 1 && invoer.aowPartner) ? `Met de AOW-leeftijd is het tarief in de eerste schijf ${procent(TAX_RULES_2026.aowFirstRate)}.` : '',
        ].filter(Boolean).join(' ');

        const ander = j1.voordeel / (perJaar ? 12 : 1);
        uit.jaar.firstChild.textContent = positief ? euro.format(ander) : `− ${euro.format(-ander)}`;
        uit.netto.firstChild.textContent = euro.format(netto);
        uit.bruto.firstChild.textContent = euro.format(bruto);
        uit.tarief.firstChild.textContent = j1.rente > 0 && positief ? procent(t.effectiefTarief, 1) : 'n.v.t.';
        uit.tariefNoot.textContent = j1.rente > 0 && positief ? 'van elke euro rente in jaar 1, na het forfait en met de heffingskorting' : 'je krijgt per saldo niets terug';

        /* Van bruto naar netto, als balk. Alleen als er iets terugkomt. */
        uit.balk.hidden = !positief || bruto <= 0;
        if (positief && bruto > 0) {
            const terugDeel = klem01((bruto - netto) / bruto) * 100;
            uit.balkNetto.style.width = `${(100 - terugDeel).toFixed(1)}%`;
            uit.balkTerug.style.width = `${terugDeel.toFixed(1)}%`;
            uit.legNetto.textContent = euro.format(netto);
            uit.legTerug.textContent = euro.format(bruto - netto);
        }

        uit.eenmalig.hidden = eenmaligeKosten <= 0;
        if (eenmaligeKosten > 0) uit.eenmaligBedrag.textContent = `${euro.format(t.eenmaligVoordeel)} eenmalig terug over ${euro.format(eenmaligeKosten)} financieringskosten, in het jaar van afsluiten.`;
        uit.villa.hidden = invoer.woz <= TAX_RULES_2026.highValueThreshold;
        uit.vastLabel.textContent = positief ? `Terug ${eenheid()}` : `Extra belasting ${eenheid()}`;
        uit.vastBedrag.textContent = euro.format(Math.abs(bruto - netto));

        /* Het verloop. */
        const omslag = t.jaren.find((r) => r.voordeel < 0);
        const samenvatting = `In jaar 1 ${positief ? 'krijg je' : 'betaal je'} ${euro.format(Math.abs(j1.voordeel) / deel())} ${eenheid()} ${positief ? 'terug' : 'extra'} en betaal je netto ${euro.format(j1.netto / deel())}. `
            + (n > 1 ? `In jaar ${n} is dat ${t.laatste.voordeel >= 0 ? `${euro.format(t.laatste.voordeel / deel())} terug` : `${euro.format(-t.laatste.voordeel / deel())} extra`} en ${euro.format(t.laatste.netto / deel())} netto. ` : '')
            + (omslag && positief ? `Vanaf jaar ${omslag.jaar} is je rente lager dan je eigenwoningforfait en betaal je per saldo belasting over je woning. ` : '')
            + `Over de hele ${jaren(n)}: ${euro.format(t.totaalVoordeel)} belastingvoordeel op ${euro.format(t.totaalRente)} rente.`;
        uit.samenvatting.textContent = samenvatting;
        uit.schuif.max = n;
        uit.legendaBij.hidden = !omslag;
        verloop.zet(
            t.jaren.map((r) => ({ jaar: r.jaar, netto: r.netto / deel(), voordeel: r.voordeel / deel(), bruto: r.bruto / deel() })),
            `Staafgrafiek van wat je ${eenheid()} betaalt over ${jaren(n)}, per jaar gesplitst in netto en belastingvoordeel. ${samenvatting}`,
        );
        toonJaar(Math.min(Number(uit.schuif.value) || 1, n));

        /* Tabel: dezelfde regels als de grafiek. */
        uit.tabel.innerHTML = t.jaren.map((r) => `<tr>
            <td>${r.jaar}</td><td>${euro.format(r.rente)}</td>
            <td>${r.voordeel >= 0 ? euro.format(r.voordeel) : `− ${euro.format(-r.voordeel)}`}</td>
            <td>${euro.format(r.bruto / deel())}</td>
            <td>${r.voordeel >= 0 ? euro.format(r.voordeel / deel()) : `− ${euro.format(-r.voordeel / deel())}`}</td>
            <td>${euro.format(r.netto / deel())}</td></tr>`).join('');

        /* Aannames: de invoer waarmee is gerekend, leesbaar terug. */
        uit.aannames.innerHTML = [
            ['Hypotheek', euro.format(invoer.hypotheek)],
            ['Rente en vorm', `${procent(invoer.rentePercent / 100)}, ${VORMEN[veld.vorm.value][1].toLowerCase()}`],
            ['Looptijd', jaren(n)],
            ['WOZ-waarde', euro.format(invoer.woz)],
            ['Eigenwoningforfait', `${euro.format(t.forfait)} per jaar`],
            ['Bruto jaarinkomen', euro.format(invoer.inkomen) + (invoer.aow ? ', AOW-leeftijd' : '')],
            ...(metPartner ? [['Inkomen partner', euro.format(invoer.inkomenPartner) + (invoer.aowPartner ? ', AOW-leeftijd' : '')], ['Aftrek in jaar 1 bij', j1.bij]] : []),
            ['Financieringskosten', eenmaligeKosten > 0 ? euro.format(eenmaligeKosten) : 'geen'],
            ['Belastingregels', 'die van 2026, voor alle jaren'],
        ].map(([naam, waarde]) => `<dt>${naam}</dt><dd>${waarde}</dd>`).join('');

        /* Afdrukoverzicht. Een lege waarde laat reporting.js weg. */
        printknop.dataset.report = JSON.stringify({
            toolId: 'hypotheekrenteaftrek',
            toolTitle: 'Hypotheekrenteaftrek 2026',
            generatedAt: new Date().toISOString(),
            inputs: {
                mortgageAmount: invoer.hypotheek,
                mortgageRate: invoer.rentePercent,
                mortgageType: VORMEN[veld.vorm.value][1],
                durationYears: n,
                wozValue: invoer.woz,
                grossIncome: invoer.inkomen,
                stateAge: invoer.aow || null,
                partnerIncome: metPartner ? invoer.inkomenPartner : null,
                allocatedTo: metPartner ? j1.bij : null,
                oneTimeDeductibleCosts: eenmaligeKosten || null,
            },
            results: {
                taxBenefitMonthly: j1.voordeel / 12,
                taxBenefitYearly: j1.voordeel,
                grossMonthly: j1.bruto / 12,
                netMonthly: j1.netto / 12,
                interestYear: j1.rente,
                homeForfait: t.forfait,
                oneTimeBenefit: eenmaligeKosten > 0 ? t.eenmaligVoordeel : null,
            },
            conclusion: `${uit.zin.textContent} ${uit.noot.textContent}`.trim(),
            interpretation: samenvatting,
            tables: [{
                title: 'Jaar voor jaar',
                columns: [
                    { key: 'jaar', label: 'Jaar', type: 'text' },
                    { key: 'rente', label: 'Rente', type: 'currency' },
                    { key: 'voordeel', label: 'Belastingvoordeel', type: 'currency' },
                    { key: 'brutoMaand', label: 'Bruto per maand', type: 'currency' },
                    { key: 'nettoMaand', label: 'Netto per maand', type: 'currency' },
                ],
                rows: t.jaren.map((r) => ({ jaar: r.jaar, rente: r.rente, voordeel: r.voordeel, brutoMaand: r.bruto / 12, nettoMaand: r.netto / 12 })),
            }],
            assumptions: 'Indicatie met de belastingregels van 2026, aangehouden voor alle jaren, bij gelijkblijvend inkomen en gelijke WOZ-waarde. Met de algemene heffingskorting; zonder andere kortingen, andere aftrekposten en inkomen in box 2 en 3. Geen aangifte en geen fiscaal advies.',
        });
    }

    const klem01 = (x) => Math.min(1, Math.max(0, x));

    /* -------------------------------- binden -------------------------------- */

    for (const v of [veld.bedrag, veld.rente, veld.looptijd, veld.woz, veld.inkomen, veld.inkomenPartner, ...kostenvelden]) v.addEventListener('input', reken);
    for (const v of [veld.vorm, veld.aow, veld.partner, veld.aowPartner, veld.verdeling]) v.addEventListener('change', reken);
    const periodeknoppen = [...document.querySelectorAll('[data-periode]')];
    for (const knop of periodeknoppen) {
        knop.addEventListener('click', () => {
            perJaar = knop.dataset.periode === 'jaar';
            for (const k of periodeknoppen) k.setAttribute('aria-pressed', String(k === knop));
            reken();
        });
    }
    el('nhg-knop').addEventListener('click', () => {
        const bedrag = leesGetal(veld.bedrag.value);
        if (bedrag === null) return;
        veld.nhg.value = toonGetal(Math.round(bedrag * TAX_RULES_2026.nhgFeeRate));
        reken();
    });

    if ('ResizeObserver' in window) {
        let breedte = 0;
        new ResizeObserver(([item]) => {
            const nieuw = Math.round(item.contentRect.width);
            if (nieuw === breedte) return;
            breedte = nieuw;
            if (!verloop.speelt) verloop.teken();
        }).observe(el('verloop-grafiek'));
    }

    if ('IntersectionObserver' in window) {
        // De balk onderaan, zodra de uitkomst uit beeld is.
        new IntersectionObserver(([item]) => {
            const heeftUitkomst = uit.vastBedrag.textContent.trim() !== '' && !uit.zin.dataset.status;
            uit.vast.classList.toggle('is-zichtbaar', !item.isIntersecting && heeftUitkomst);
        }).observe(el('uitkomst'));
        // De animatie speelt één keer, de eerste keer dat de grafiek in beeld komt.
        const kijker = new IntersectionObserver(([item]) => {
            if (!item.isIntersecting) return;
            kijker.disconnect();
            verloop.speel();
        }, { threshold: 0.5 });
        kijker.observe(el('verloop-grafiek'));
    }

    reken();
}

startRekenpagina(initAftrek);
