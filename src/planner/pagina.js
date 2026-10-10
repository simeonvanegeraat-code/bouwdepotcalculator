/**
 * Depotplanner: geen rekenmachine maar een agenda.
 *
 * De rest van de site rekent bedragen uit voor wie nog moet beslissen. Deze
 * pagina is voor wie er middenin zit en een andere vraag heeft: hoeveel tijd
 * heb ik nog, en wat moet ik wanneer regelen.
 *
 * De datums komen uit src/domain/depotplanning.js, het declaratieplan uit
 * src/js/declaratieplan.js en het agendabestand uit src/js/agenda.js. Dit
 * bestand leest de invoer en zet de uitkomst op het scherm.
 *
 * De opslagsleutel en de veld-id's zijn die van de vorige versie
 * (src/js/depotplanner.js), zodat een planning die iemand al had ingevuld
 * blijft staan.
 */

// Telt vier mijlpalen, zonder ingevulde waarden. Zie meting.js.
import '../js/meting.js';

import { huidigeBank, opBankwissel } from '../js/bankkeuze.js';
import { maakAgenda, downloadAgenda } from '../js/agenda.js';
import { maakPlan } from '../js/declaratieplan.js';
import { leesGetal, toonGetal, euro, koppelBedragveld, maakVeldlezer } from '../js/getallen.js';
import { maandenErbij, maandenTussen, gebeurtenissen } from '../domain/depotplanning.js';

const wortel = document.getElementById('depotplanner');

if (wortel) {
    const SLEUTEL = 'bouwdepot-planner-v3';
    const datum = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    const maandjaar = new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' });
    const kort = new Intl.DateTimeFormat('nl-NL', { month: 'short', year: 'numeric' });
    const el = (id) => document.getElementById(id);
    const veilig = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const velden = { soort: el('dp-soort'), start: el('dp-start'), bedrag: el('dp-bedrag'), stand: el('dp-stand') };

    const uit = {
        koptekst: el('dp-koptekst'), resterend: el('dp-resterend'), resterendZin: el('dp-resterend-zin'),
        saldo: el('dp-saldo'), opgenomenPct: el('dp-opgenomen-pct'), balkOpgenomen: el('dp-balk-opgenomen'), balkRest: el('dp-balk-rest'),
        tijdlijn: el('dp-tijdlijn'), tijdbalk: el('dp-tijdbalk'), agendaKnop: el('dp-agenda'), foutStand: el('dp-fout-stand'),
        standLabel: el('dp-stand-label'), standUitleg: el('dp-stand-uitleg'), restantRegel: el('dp-restant'),
        waarschuwing: el('dp-waarschuwing'), geenBank: el('dp-geen-bank'), postenLijst: el('dp-posten'),
        postenTotaal: el('dp-posten-totaal'), planSectie: el('dp-plan-sectie'), planLead: el('dp-plan-lead'),
        planTabel: el('dp-plan-tabel'), planSaldo: el('dp-plan-saldo'), planBewijs: el('dp-plan-bewijs'),
        verloopLeeg: el('dp-verloop-leeg'), verloopActies: el('dp-verloop-acties'),
        vast: el('wr-vast'), vastBedrag: el('wr-vast-bedrag'),
    };

    /**
     * De posten die nog uit het depot betaald moeten worden. Deze lijst is het
     * verschil tussen een aftelklok en een planning: zonder posten weet de
     * pagina alleen wanneer het depot afloopt, met posten of het geld op tijd
     * besteed raakt.
     */
    let posten = [];

    // Wat de agendaknop nodig heeft, bijgewerkt bij elke berekening.
    let laatsteAgenda = null;

    /**
     * Welk van de twee bedragen de bezoeker invult.
     *
     * 'restant'   het bedrag dat nog in het depot staat -- wat bankapps tonen
     * 'opgenomen' de som van wat er al uit is gegaan
     *
     * Het een volgt uit het ander zodra het depotbedrag bekend is, dus intern
     * rekenen we altijd met allebei. De keuze bepaalt alleen wat we vragen.
     */
    let modus = 'restant';

    const TEKSTEN = {
        restant: {
            label: 'Nog in het depot',
            uitleg: 'Het bedrag dat je bank als resterend depotsaldo toont.',
            teHoog: (max) => `Er kan niet meer in het depot staan dan de ${max} waarmee het begon.`,
            negatief: 'Een negatief saldo bestaat niet; we rekenen met nul.',
        },
        opgenomen: {
            label: 'Al opgenomen',
            uitleg: 'Alles wat je tot nu toe uit het depot hebt laten betalen, bij elkaar opgeteld.',
            teHoog: (max) => `Je kunt niet meer opnemen dan de ${max} die in het depot zat. We rekenen met het volledige depot.`,
            negatief: 'Een opgenomen bedrag onder nul bestaat niet; we rekenen met nul.',
        },
    };

    const modusknoppen = [...document.querySelectorAll('[data-modus]')];

    /** Zet de modus en past het label, de uitleg en de knoppen aan. */
    function zetModus(nieuweModus, herberekenen = true) {
        modus = nieuweModus === 'opgenomen' ? 'opgenomen' : 'restant';
        const t = TEKSTEN[modus];
        uit.standLabel.textContent = t.label;
        uit.standUitleg.textContent = t.uitleg;
        for (const knop of modusknoppen) knop.setAttribute('aria-pressed', knop.dataset.modus === modus ? 'true' : 'false');
        if (herberekenen) bereken();
    }

    const vandaag = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

    /** JJJJ-MM-DD in de lokale tijd, voor een input[type=date]. */
    const alsInvoerdatum = (d) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

    /* ---------------------------------------------------------------- opslag */

    const bewaar = () => {
        try {
            const staat = { posten, modus };
            for (const [naam, veld] of Object.entries(velden)) staat[naam] = veld.value;
            localStorage.setItem(SLEUTEL, JSON.stringify(staat));
        } catch (_) { /* opslag is een gemak, geen voorwaarde */ }
    };

    const herstel = () => {
        try {
            const staat = JSON.parse(localStorage.getItem(SLEUTEL) || '{}');
            if (Array.isArray(staat.posten)) posten = staat.posten.filter((p) => p && typeof p === 'object');
            if (staat.modus) zetModus(staat.modus, false);
            for (const [naam, waarde] of Object.entries(staat)) {
                if (velden[naam] && waarde) velden[naam].value = waarde;
            }
        } catch (_) { /* een kapotte opslag mag de pagina niet omleggen */ }
    };

    /* ----------------------------------------------------------------- posten */

    function tekenPosten() {
        uit.postenLijst.innerHTML = posten.map((post, i) => {
            const nr = i + 1;
            return `<div class="wr-planpost">
                <input type="text" value="${veilig(post.omschrijving)}" data-idx="${i}" data-veld="omschrijving" aria-label="Post ${nr}: omschrijving" placeholder="Bijvoorbeeld keuken">
                <div class="wr-veld__in"><span aria-hidden="true">&euro;</span><input type="text" inputmode="decimal" value="${post.bedrag ? toonGetal(post.bedrag) : ''}" data-idx="${i}" data-veld="bedrag" aria-label="Post ${nr}: bedrag in euro"></div>
                <input type="month" value="${veilig(post.maand)}" data-idx="${i}" data-veld="maand" aria-label="Post ${nr}: in welke maand verwacht">
                <button type="button" class="wr-termijn__weg" data-weg="${i}" aria-label="Post ${nr} verwijderen" title="Post ${nr} verwijderen">&times;</button>
            </div>`;
        }).join('');

        for (const veld of uit.postenLijst.querySelectorAll('input')) {
            veld.addEventListener('input', (e) => {
                const { idx, veld: naam } = e.target.dataset;
                posten[idx][naam] = naam === 'bedrag' ? (leesGetal(e.target.value) ?? 0) : e.target.value;
                bereken();
            });
            // Pas bij het verlaten opmaken, anders vecht de opmaak met wie typt.
            if (veld.dataset.veld === 'bedrag') veld.addEventListener('change', tekenPosten);
        }
        for (const knop of uit.postenLijst.querySelectorAll('[data-weg]')) {
            knop.addEventListener('click', () => {
                posten.splice(Number(knop.dataset.weg), 1);
                tekenPosten();
                bereken();
            });
        }
    }

    /** Zet het declaratieplan op het scherm. */
    function toonPlan(bank, einde, saldoNu) {
        const plan = maakPlan({ einde, werkdagen: bank.uitbetalingWerkdagen, saldo: saldoNu, posten });

        uit.postenTotaal.textContent = plan.regels.length ? `${euro.format(plan.totaalPosten)} gepland` : '';
        const heeftPosten = plan.regels.length > 0 && Boolean(einde);
        uit.planSectie.hidden = !heeftPosten;
        if (!heeftPosten) return plan;

        // De uiterste indiendatum is het stuk dat de bank niet uit zichzelf
        // vertelt. Publiceert de aanbieder geen doorlooptijd, dan staat er geen
        // datum maar de reden waarom niet.
        const uiterlijk = plan.uiterste ? datum.format(plan.uiterste) : 'niet te bepalen';
        uit.planLead.textContent = plan.uiterste
            ? `${bank.naam} doet er ${bank.uitbetalingWerkdagen === 0 ? 'geen wachttijd over' : `ongeveer ${bank.uitbetalingWerkdagen} werkdagen over`} om een declaratie te verwerken. Wat op ${datum.format(einde)} betaald moet zijn, dien je dus uiterlijk ${uiterlijk} in.`
            : `${bank.naam} publiceert niet hoe lang een declaratie duurt. Wij rekenen daar geen uiterste datum voor uit; houd zelf ruime marge voor ${datum.format(einde)}.`;

        uit.planTabel.innerHTML = plan.regels.map((r) => `<tr${r.teLaat ? ' class="is-piek"' : ''}>
            <td>${veilig(r.omschrijving)}</td>
            <td>${euro.format(r.bedrag)}</td>
            <td>${r.verwacht ? maandjaar.format(r.verwacht) : '–'}</td>
            <td>${r.teLaat ? `<strong>na ${uiterlijk}</strong>` : uiterlijk}</td>
        </tr>`).join('');

        const delen = [];
        if (plan.tekort > 0) {
            delen.push(`Je plant ${euro.format(plan.totaalPosten)} terwijl er nog ${euro.format(saldoNu)} in het depot staat. Er ontbreekt ${euro.format(plan.tekort)}, dat je dus uit eigen geld betaalt.`);
        } else if (plan.nietBelegd > 0) {
            delen.push(`Van de ${euro.format(saldoNu)} die nog in het depot staat is ${euro.format(plan.totaalPosten)} belegd met posten. De resterende ${euro.format(plan.nietBelegd)} heeft nog geen bestemming.`);
        } else {
            delen.push('Je posten sluiten precies aan op wat er nog in het depot staat.');
        }
        if (plan.teLaat > 0) {
            delen.push(`${plan.teLaat === 1 ? 'Eén post valt' : `${plan.teLaat} posten vallen`} na de uiterste indiendatum. Dat deel raakt niet meer op tijd uitbetaald.`);
        }
        uit.planSaldo.textContent = delen.join(' ');
        uit.planSaldo.dataset.status = (plan.tekort > 0 || plan.teLaat > 0) ? 'afwijkend' : '';

        // Wat er bij een declaratie mee moet, staat al per aanbieder in de data.
        // Hier hoort het thuis: op het moment dat iemand zijn indienen plant.
        const eisen = (bank.eisen || []).filter((e) => e.waarde);
        uit.planBewijs.innerHTML = eisen.length
            ? `<strong>Wat ${veilig(bank.naam)} bij een declaratie wil zien</strong><ul class="wr-lijst">`
                + eisen.map((e) => `<li><strong>${veilig(e.waarde)}</strong>${e.detail ? ` &mdash; ${veilig(e.detail)}` : ''}</li>`).join('')
                + '</ul>'
            : `<strong>${veilig(bank.naam)}</strong> publiceert niet welk bewijsstuk bij een declaratie hoort. Vraag dat na voordat je indient.`;

        return plan;
    }

    /* -------------------------------------------------------------- tijdlijn */

    function toonTijdlijn(rij, nu) {
        uit.tijdlijn.innerHTML = rij.map((g) => {
            const geweest = g.datum && g.datum <= nu;
            const klassen = ['wr-stap'];
            if (geweest) klassen.push('is-geweest');
            if (g.let_op && !geweest) klassen.push('is-letop');
            if (!g.datum) klassen.push('is-zonder-datum');
            return `<li class="${klassen.join(' ')}">
                <div class="wr-stap__datum">${g.datum ? datum.format(g.datum) : 'geen datum'}</div>
                <div class="wr-stap__inhoud"><strong>${veilig(g.naam)}</strong><span>${veilig(g.uitleg)}</span></div>
            </li>`;
        }).join('');
    }

    /**
     * De balk boven de lijst: de hele looptijd op schaal, met vandaag erin.
     * Versiering bij de lijst eronder, die dezelfde datums in woorden geeft.
     */
    function toonTijdbalk(rij, nu) {
        const metDatum = rij.filter((g) => g.datum);
        const start = metDatum[0]?.datum;
        const einde = rij.find((g) => g.soort === 'einde')?.datum;
        const uiterste = rij.find((g) => g.soort === 'uiterste')?.datum ?? einde;
        if (!start || !einde) { uit.tijdbalk.hidden = true; return; }
        uit.tijdbalk.hidden = false;

        const laatste = new Date(Math.max(uiterste, metDatum.at(-1).datum));
        const span = laatste - start || 1;
        const pct = (d) => Math.min(100, Math.max(0, ((d - start) / span) * 100));
        const vergoeding = rij.find((g) => g.soort === 'vergoeding')?.datum;

        // Vallen het einde en het stoppen van de vergoeding samen, dan krijgen ze
        // één streep met één label; liggen ze dicht bij elkaar, dan staat het
        // label van de vergoeding een regel hoger.
        const samen = vergoeding && Math.abs(vergoeding - einde) < 86400000;
        const dichtbij = vergoeding && !samen && Math.abs(pct(vergoeding) - pct(einde)) < 24;
        const merken = () => [
            vergoeding && !samen && vergoeding < laatste ? merk(vergoeding, 'vergoeding stopt', `is-vergoeding${dichtbij ? ' is-hoog' : ''}`) : '',
            einde < laatste ? merk(einde, samen ? 'einde, vergoeding stopt' : 'einde', 'is-einde') : '',
        ].join('');
        const merk = (d, naam, klasse) => `<i class="wr-tijdbalk__merk ${klasse}" style="left:${pct(d).toFixed(2)}%"><b>${naam}</b></i>`;
        uit.tijdbalk.innerHTML = `
            <div class="wr-tijdbalk__spoor">
                <span class="wr-tijdbalk__standaard" style="width:${pct(einde).toFixed(2)}%"></span>
                <span class="wr-tijdbalk__voorbij" style="width:${pct(nu).toFixed(2)}%"></span>
                ${merken()}
                ${nu > start && nu < laatste ? merk(nu, 'vandaag', 'is-vandaag') : ''}
            </div>
            <p class="wr-tijdbalk__as"><span>${kort.format(start)}</span><span>${kort.format(laatste)}</span></p>`;
    }

    /* ------------------------------------------------------------- berekenen */

    // Alleen het depotbedrag. De stand ernaast heeft een eigen melding, want
    // die wordt afgezet tegen dit bedrag en niet tegen een vaste grens.
    const leesVeld = maakVeldlezer({
        'dp-bedrag': {
            lezer: leesGetal, min: 0, max: 1000000, exclusiefNul: true,
            leeg: 'Vul het bedrag van je bouwdepot in.',
            teLaag: 'Vul een depotbedrag boven de nul in.',
            teHoog: 'Boven een miljoen euro is geen bouwdepot meer; controleer het bedrag.',
        },
    });

    /** Geen datums te tonen: de rechterkant zegt waarom. */
    function zonderPlanning() {
        uit.tijdlijn.hidden = true;
        uit.tijdbalk.hidden = true;
        uit.verloopActies.hidden = true;
        uit.verloopLeeg.hidden = false;
        uit.restantRegel.hidden = true;
        uit.waarschuwing.hidden = true;
        uit.planSectie.hidden = true;
        uit.vast.classList.remove('is-zichtbaar');
        uit.vastBedrag.textContent = '';
    }

    function bereken() {
        bewaar();

        // De agenda staat uit tot er datums zijn. Een knop die niets doet is
        // erger dan geen knop: je denkt dat het gelukt is.
        laatsteAgenda = null;
        uit.agendaKnop.disabled = true;

        const bank = huidigeBank();
        const soort = velden.soort.value === 'nieuwbouw' ? 'nieuwbouw' : 'verbouw';
        const bedrag = leesVeld(velden.bedrag);
        if (bedrag === null) {
            uit.saldo.firstChild.textContent = '–';
            uit.opgenomenPct.textContent = 'Vul je depotbedrag in.';
            return;
        }
        // Stil afkappen is precies waar deze site niet voor staat: de bezoeker
        // typt 80.000, ziet 50.000 terug en weet niet of de tool hem begrepen
        // heeft. We rekenen wel door met een bruikbare waarde, maar zeggen het.
        const ingevoerd = leesGetal(velden.stand.value) || 0;
        const begrensd = Math.min(bedrag, Math.max(0, ingevoerd));

        // Het ene bedrag volgt uit het andere; welk van de twee is ingevuld
        // maakt voor de rest van de berekening niet uit.
        const opgenomen = modus === 'restant' ? bedrag - begrensd : begrensd;
        const saldo = modus === 'restant' ? begrensd : bedrag - opgenomen;

        const t = TEKSTEN[modus];
        let melding = '';
        if (ingevoerd < 0) melding = t.negatief;
        else if (ingevoerd > bedrag) melding = t.teHoog(euro.format(bedrag));
        uit.foutStand.textContent = melding;
        velden.stand.setAttribute('aria-invalid', melding ? 'true' : 'false');

        uit.saldo.firstChild.textContent = euro.format(saldo);
        const pct = (opgenomen / bedrag) * 100;
        // De bedragen dragen de regel, niet het percentage: "142.374 van 334.110"
        // is wat iemand met zijn bankafschrift vergelijkt.
        uit.opgenomenPct.innerHTML = `<strong>${euro.format(opgenomen)}</strong> van ${euro.format(bedrag)} opgenomen &middot; ${Math.round(pct)}%`;
        uit.balkOpgenomen.style.width = `${pct.toFixed(1)}%`;
        uit.balkRest.style.width = `${(100 - pct).toFixed(1)}%`;

        // Zonder bank zijn er geen termijnen en dus geen agenda. De pagina zegt
        // dat, in plaats van een tijdlijn met streepjes te tonen.
        uit.geenBank.hidden = Boolean(bank);
        if (!bank) {
            uit.koptekst.textContent = 'Kies je geldverstrekker';
            uit.resterend.firstChild.textContent = '–';
            uit.resterendZin.textContent = 'De termijnen verschillen per aanbieder. Zonder die keuze kunnen wij geen datums berekenen.';
            uit.verloopLeeg.textContent = 'Kies links je geldverstrekker en vul de datum van passeren in. Dan staan hier je datums.';
            zonderPlanning();
            return;
        }

        const start = velden.start.value ? new Date(`${velden.start.value}T00:00:00`) : null;
        const nu = vandaag();
        uit.koptekst.textContent = `Je depot bij ${bank.naam}`;

        if (!start || Number.isNaN(start.getTime())) {
            uit.resterend.firstChild.textContent = '–';
            uit.resterendZin.textContent = 'Vul de datum in waarop je hypotheek is gepasseerd; vanaf dat moment loopt de termijn.';
            uit.verloopLeeg.textContent = 'Vul links de datum in waarop je hypotheek is gepasseerd. Dan staan hier je datums.';
            zonderPlanning();
            return;
        }

        const looptijd = bank.looptijd[soort];
        const einde = typeof looptijd === 'number' ? maandenErbij(start, looptijd) : null;
        const resterend = einde ? maandenTussen(nu, einde) : null;

        // Een passeerdatum in de toekomst is een echt geval: wie volgende maand
        // passeert wil weten wanneer zijn depot afloopt. Maar "resterend" telt
        // vanaf vandaag, en dat zou meer tijd geven dan het depot lang is.
        const nogNietGeopend = start > nu;
        let kop;
        if (nogNietGeopend && einde) {
            kop = 'Nog niet gestart';
            uit.resterendZin.textContent = `Je depot opent op ${datum.format(start)}. Vanaf dat moment loopt de standaardtermijn van ${looptijd} maanden, tot ${datum.format(einde)}.`;
        } else if (resterend == null) {
            kop = '–';
            uit.resterendZin.textContent = `${bank.naam} publiceert geen standaardlooptijd voor dit soort depot.`;
        } else if (resterend <= 0) {
            const over = Math.abs(Math.round(resterend));
            kop = 'Verlopen';
            uit.resterendZin.textContent = `De standaardtermijn eindigde ${over === 0 ? 'deze maand' : `ongeveer ${over} ${over === 1 ? 'maand' : 'maanden'} geleden`}, op ${datum.format(einde)}. Staat er nog geld in het depot, neem dan contact op met ${bank.naam}: zonder verlenging wordt het restant meestal op de lening afgelost.`;
        } else {
            const heel = Math.floor(resterend);
            kop = heel >= 1 ? `${heel} ${heel === 1 ? 'maand' : 'maanden'}` : 'Minder dan een maand';
            uit.resterendZin.textContent = `De standaardtermijn eindigt op ${datum.format(einde)}. ${saldo > 0
                ? `Er staat nog ${euro.format(saldo)} in het depot dat voor die datum besteed of verlengd moet zijn.`
                : 'Volgens je invoer is het depot leeg.'}`;
        }
        uit.resterend.firstChild.textContent = kop;
        uit.vastBedrag.textContent = kop;

        const rij = gebeurtenissen(bank, start, soort);
        uit.verloopLeeg.hidden = true;
        uit.tijdlijn.hidden = false;
        uit.verloopActies.hidden = false;
        toonTijdbalk(rij, nu);
        toonTijdlijn(rij, nu);
        // De agendaknop werkt met dezelfde gebeurtenissen als de tijdlijn, zodat
        // wat iemand meeneemt niet kan afwijken van wat hij op het scherm zag.
        const plan = toonPlan(bank, einde, saldo);
        laatsteAgenda = { bank, soort, rij, plan };
        uit.agendaKnop.disabled = !rij.some((g) => g.datum);

        uit.restantRegel.hidden = false;
        const restant = bank.restant;
        uit.restantRegel.innerHTML = `<strong>Wat gebeurt er met het restant?</strong> Bij ${veilig(bank.naam)}: ${restant.waarde
            ? `${veilig(restant.waarde.toLowerCase())}.`
            : 'niet gepubliceerd.'}${restant.detail ? ` ${veilig(restant.detail)}` : ''}`;

        // Alleen waarschuwen als er echt iets te verliezen is: geld in het depot
        // en weinig tijd. Een waarschuwing bij een leeg depot is ruis.
        const vergoeding = bank.vergoeding.maanden[soort];
        const vergoedingStopt = typeof vergoeding === 'number' && bank.vergoeding.model === 'beperkt-in-duur' ? maandenErbij(start, vergoeding) : null;
        let tekst = '';
        if (saldo > 0 && resterend != null && resterend > 0 && resterend <= 4) {
            tekst = `Er staat nog ${euro.format(saldo)} in het depot en de standaardtermijn eindigt over minder dan vier maanden. Dit is het moment om te beslissen: bestellen en declareren, of verlenging aanvragen.`;
        } else if (saldo > 0 && vergoedingStopt && vergoedingStopt <= nu) {
            tekst = `De vergoedingstermijn van ${vergoeding} maanden is voorbij, terwijl er nog ${euro.format(saldo)} in het depot staat. Over dat bedrag betaal je wel rente en ontvang je niets meer terug.`;
        }
        uit.waarschuwing.hidden = !tekst;
        uit.waarschuwing.textContent = tekst;
    }

    /* ---------------------------------------------------------------- binding */

    for (const v of Object.values(velden)) {
        v.addEventListener('input', bereken);
        if (v.tagName === 'SELECT') v.addEventListener('change', bereken);
    }

    for (const knop of modusknoppen) {
        knop.addEventListener('click', () => {
            if (knop.dataset.modus === modus) return;
            // Het getal in het veld hoort mee te veranderen: wie 20.000 opgenomen
            // heeft van 50.000, ziet na het wisselen 30.000 staan. Zonder die
            // omrekening zou dezelfde invoer ineens iets anders betekenen.
            const bedrag = leesGetal(velden.bedrag.value) || 0;
            const huidig = leesGetal(velden.stand.value) || 0;
            if (bedrag > 0) velden.stand.value = toonGetal(Math.max(0, bedrag - Math.min(bedrag, Math.max(0, huidig))));
            zetModus(knop.dataset.modus);
        });
    }

    el('dp-post-toevoegen').addEventListener('click', () => {
        posten.push({ omschrijving: '', bedrag: 0, maand: '' });
        tekenPosten();
        bereken();
        // De cursor hoort in het veld te staan dat er net bij kwam.
        uit.postenLijst.querySelector('.wr-planpost:last-child input')?.focus();
    });

    el('dp-printen').addEventListener('click', () => window.print());

    // Een herinnering hoort alleen bij een moment waarop iets te regelen valt.
    // De tijdlijn markeert die al met let_op; dat hergebruiken we hier, zodat de
    // agenda niet bij elke gebeurtenis piept. Een agenda die te vaak piept wordt
    // uitgezet, en werkt dan niet meer op het moment dat het ertoe doet.
    const DAGEN_VOORAF = 30;

    uit.agendaKnop.addEventListener('click', () => {
        if (!laatsteAgenda) return;
        const { bank, soort, rij, plan } = laatsteAgenda;
        const extra = [];
        if (plan?.uiterste && plan.regels.length) {
            extra.push({
                naam: 'Uiterlijk declareren',
                datum: plan.uiterste,
                uitleg: `Na deze datum is een declaratie bij ${bank.naam} niet meer op tijd verwerkt voor het einde van je depot.`,
                let_op: true,
            });
        }
        const inhoud = maakAgenda({
            naam: `Bouwdepot ${bank.naam}`,
            bron: 'bouwdepotcalculator.nl/depotplanner.html',
            gebeurtenissen: [...rij, ...extra].map((g) => ({
                naam: g.naam, datum: g.datum, uitleg: g.uitleg, herinnering: g.let_op ? DAGEN_VOORAF : null,
            })),
        });
        if (inhoud) downloadAgenda(`bouwdepot-${bank.id}-${soort}.ics`, inhoud);
    });

    el('dp-vandaag').addEventListener('click', () => {
        // Niet toISOString: die rekent naar UTC, en in onze zomertijd levert
        // lokale middernacht dan de dag ervoor op.
        velden.start.value = alsInvoerdatum(vandaag());
        bereken();
    });

    // Op een smal scherm staat de invoer onder de uitkomst. De balk houdt de
    // resterende tijd in beeld zodra de uitkomst zelf uit beeld is gescrold.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([item]) => {
            uit.vast.classList.toggle('is-zichtbaar', !item.isIntersecting && uit.vastBedrag.textContent.trim() !== '');
        }).observe(el('uitkomst'));
    }

    // De startdatum blijft bewust leeg tot de bezoeker hem invult. Een voorbeeld
    // invullen zou een tijdlijn opleveren die eruitziet als de zijne maar het
    // niet is, en op deze pagina zijn de datums het hele product.
    herstel();
    for (const v of [velden.bedrag, velden.stand]) koppelBedragveld(v);
    // Zonder dit staan teruggehaalde posten wel in het geheugen -- het plan
    // rekent er dan mee -- maar is de lijst op het scherm leeg.
    tekenPosten();
    opBankwissel(bereken);
}
