/**
 * Depotplanner: geen rekenmachine maar een agenda.
 *
 * De rest van de site rekent bedragen uit voor wie nog moet beslissen. Deze
 * pagina is voor wie er middenin zit en een andere vraag heeft: hoeveel tijd
 * heb ik nog, en wat moet ik wanneer regelen.
 *
 * Alle datums komen uit twee dingen die de bezoeker weet, de startdatum en de
 * aanbieder, gecombineerd met de gepubliceerde termijnen. Wat een aanbieder
 * niet publiceert wordt niet gerekend: liever geen datum dan een verzonnen
 * datum, want een deadline waar iemand op vertrouwt moet kloppen.
 *
 * Drie datums die de bezoeker zelf niet makkelijk vindt:
 *
 *   einddatum          startdatum plus de standaardlooptijd
 *   vergoeding stopt   startdatum plus de vergoedingsduur, vaak eerder
 *   verlengen regelen  alleen waar de aanbieder een termijn noemt
 */

import { huidigeBank, opBankwissel } from './bankkeuze.js';
import { maakAgenda, downloadAgenda } from './agenda.js';
import { maakPlan } from './declaratieplan.js';
import { leesGetal, toonGetal } from './getallen.js';

const wortel = document.getElementById('depotplanner');

if (wortel) {
    const SLEUTEL = 'bouwdepot-planner-v3';
    const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    const datum = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    const el = (id) => document.getElementById(id);

    const velden = {
        soort: el('dp-soort'),
        start: el('dp-start'),
        bedrag: el('dp-bedrag'),
        stand: el('dp-stand'),
    };

    const uit = {
        koptekst: el('dp-koptekst'),
        resterend: el('dp-resterend'),
        resterendZin: el('dp-resterend-zin'),
        saldo: el('dp-saldo'),
        opgenomenPct: el('dp-opgenomen-pct'),
        balkOpgenomen: el('dp-balk-opgenomen'),
        tijdlijn: el('dp-tijdlijn'),
        agendaKnop: el('dp-agenda'),
        foutStand: el('dp-fout-stand'),
        standLabel: el('dp-stand-label'),
        standUitleg: el('dp-stand-uitleg'),
        restantRegel: el('dp-restant'),
        waarschuwing: el('dp-waarschuwing'),
        geenBank: el('dp-geen-bank'),
        postenLijst: el('dp-posten'),
        postenTotaal: el('dp-posten-totaal'),
        postenFout: el('dp-fout-posten'),
        planSectie: el('dp-plan-sectie'),
        planLead: el('dp-plan-lead'),
        planTabel: el('dp-plan-tabel'),
        planSaldo: el('dp-plan-saldo'),
        planBewijs: el('dp-plan-bewijs'),
    };

    /* ----------------------------------------------------------------- posten */

    /**
     * De posten die nog uit het depot betaald moeten worden. Deze lijst is het
     * verschil tussen een aftelklok en een planning: zonder posten weet de
     * pagina alleen wanneer het depot afloopt, met posten of het geld op tijd
     * besteed raakt.
     */
    let posten = [];

    /* ------------------------------------------------------------ hulpmiddel */

    const maandenErbij = (d, n) => {
        // Een depot dat op 31 januari start en 1 maand loopt, eindigt eind
        // februari. new Date(2026, 1, 31) rolt door naar 3 maart, dus terugzetten
        // naar de laatste dag van de doelmaand.
        const doel = new Date(d.getFullYear(), d.getMonth() + n, 1);
        const laatste = new Date(doel.getFullYear(), doel.getMonth() + 1, 0).getDate();
        doel.setDate(Math.min(d.getDate(), laatste));
        return doel;
    };

    const maandenTussen = (van, tot) => {
        const dagen = (tot - van) / 86400000;
        return dagen / 30.44;
    };

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
            uitleg: 'Het bedrag dat uw bank als resterend depotsaldo toont.',
            teHoog: (max) => `Er kan niet meer in het depot staan dan de ${max} waarmee het begon.`,
            negatief: 'Een negatief saldo bestaat niet; we rekenen met nul.',
        },
        opgenomen: {
            label: 'Al opgenomen',
            uitleg: 'Alles wat u tot nu toe uit het depot hebt laten betalen, bij elkaar opgeteld.',
            teHoog: (max) => `U kunt niet meer opnemen dan de ${max} die in het depot zat. We rekenen met het volledige depot.`,
            negatief: 'Een opgenomen bedrag onder nul bestaat niet; we rekenen met nul.',
        },
    };

    /** Zet de modus en past het label, de uitleg en de knoppen aan. */
    function zetModus(nieuweModus, herberekenen = true) {
        modus = nieuweModus === 'opgenomen' ? 'opgenomen' : 'restant';
        const t = TEKSTEN[modus];
        if (uit.standLabel) uit.standLabel.textContent = t.label;
        if (uit.standUitleg) uit.standUitleg.textContent = t.uitleg;
        document.querySelectorAll('.bs-segment [data-modus]').forEach((knop) => {
            knop.setAttribute('aria-pressed', knop.dataset.modus === modus ? 'true' : 'false');
        });
        if (herberekenen) bereken();
    }

    const vandaag = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

    /** JJJJ-MM-DD in de lokale tijd, voor een input[type=date]. */
    const alsInvoerdatum = (d) => [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');

    /* ---------------------------------------------------------------- opslag */

    const bewaar = () => {
        try {
            const staat = { posten, modus };
            for (const [naam, veld] of Object.entries(velden)) if (veld) staat[naam] = veld.value;
            localStorage.setItem(SLEUTEL, JSON.stringify(staat));
        } catch (_) {}
    };

    const herstel = () => {
        try {
            const staat = JSON.parse(localStorage.getItem(SLEUTEL) || '{}');
            if (Array.isArray(staat.posten)) posten = staat.posten;
            if (staat.modus) zetModus(staat.modus, false);
            for (const [naam, waarde] of Object.entries(staat)) {
                if (velden[naam] && waarde) velden[naam].value = waarde;
            }
        } catch (_) {}
    };


    function tekenPosten() {
        if (!uit.postenLijst) return;
        uit.postenLijst.innerHTML = posten.map((post, i) => {
            const nr = i + 1;
            return `<div class="bs-postrij">
                <div><input type="text" value="${post.omschrijving ?? ''}" data-idx="${i}" data-veld="omschrijving" aria-label="Post ${nr}: omschrijving" placeholder="Bijvoorbeeld keuken"></div>
                <div class="bs-omhulsel"><span aria-hidden="true">&euro;</span><input type="text" inputmode="decimal" value="${post.bedrag ? toonGetal(post.bedrag) : ''}" data-idx="${i}" data-veld="bedrag" aria-label="Post ${nr}: bedrag in euro"></div>
                <div><input type="month" value="${post.maand ?? ''}" data-idx="${i}" data-veld="maand" aria-label="Post ${nr}: in welke maand verwacht"></div>
                <button type="button" class="btn-remove" data-idx="${i}" aria-label="Post ${nr} verwijderen" title="Post ${nr} verwijderen">&times;</button>
            </div>`;
        }).join('');

        uit.postenLijst.querySelectorAll('input').forEach((veld) => {
            veld.addEventListener('input', (e) => {
                const { idx, veld: naam } = e.target.dataset;
                posten[idx][naam] = naam === 'bedrag' ? (leesGetal(e.target.value) ?? 0) : e.target.value;
                bereken();
            });
            // Pas bij het verlaten opmaken, anders vecht de opmaak met wie typt.
            if (veld.dataset.veld === 'bedrag') {
                veld.addEventListener('change', () => tekenPosten());
            }
        });
        uit.postenLijst.querySelectorAll('.btn-remove').forEach((knop) => {
            knop.addEventListener('click', (e) => {
                posten.splice(Number(e.currentTarget.dataset.idx), 1);
                tekenPosten();
                bereken();
            });
        });
    }

    /** Zet het declaratieplan op het scherm. */
    function toonPlan(bank, einde, saldoNu) {
        const plan = maakPlan({
            einde,
            werkdagen: bank.uitbetalingWerkdagen,
            saldo: saldoNu,
            posten,
        });

        if (uit.postenTotaal) {
            uit.postenTotaal.textContent = plan.regels.length
                ? `${euro.format(plan.totaalPosten)} gepland`
                : '';
        }

        const heeftPosten = plan.regels.length > 0;
        if (uit.planSectie) uit.planSectie.hidden = !heeftPosten;
        if (!heeftPosten) {
            if (uit.postenFout) uit.postenFout.textContent = '';
            return plan;
        }

        // De uiterste indiendatum is het stuk dat de bank niet uit zichzelf
        // vertelt. Publiceert de aanbieder geen doorlooptijd, dan staat er geen
        // datum maar de reden waarom niet.
        const uiterlijk = plan.uiterste
            ? datum.format(plan.uiterste)
            : 'niet te bepalen';

        if (uit.planLead) {
            uit.planLead.textContent = plan.uiterste
                ? `${bank.naam} doet er ${bank.uitbetalingWerkdagen === 0 ? 'geen wachttijd over' : `ongeveer ${bank.uitbetalingWerkdagen} werkdagen over`} om een declaratie te verwerken. Wat op ${datum.format(einde)} betaald moet zijn, dient u dus uiterlijk ${uiterlijk} in.`
                : `${bank.naam} publiceert niet hoe lang een declaratie duurt. Wij rekenen daar geen uiterste datum voor uit; houd zelf ruime marge voor ${datum.format(einde)}.`;
        }

        if (uit.planTabel) {
            uit.planTabel.innerHTML = plan.regels.map((r) => `<tr${r.teLaat ? ' class="bs-rij--letop"' : ''}>
                <td>${r.omschrijving}</td>
                <td class="col-amount">${euro.format(r.bedrag)}</td>
                <td>${r.verwacht ? new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(r.verwacht) : '—'}</td>
                <td>${r.teLaat ? `<strong>na ${uiterlijk}</strong>` : uiterlijk}</td>
            </tr>`).join('');
        }

        if (uit.planSaldo) {
            const delen = [];
            if (plan.tekort > 0) {
                delen.push(`U plant ${euro.format(plan.totaalPosten)} terwijl er nog ${euro.format(saldoNu)} in het depot staat. Er ontbreekt ${euro.format(plan.tekort)}, dat u dus uit eigen geld betaalt.`);
            } else if (plan.nietBelegd > 0) {
                delen.push(`Van de ${euro.format(saldoNu)} die nog in het depot staat is ${euro.format(plan.totaalPosten)} belegd met posten. De resterende ${euro.format(plan.nietBelegd)} heeft nog geen bestemming.`);
            } else {
                delen.push(`Uw posten sluiten precies aan op wat er nog in het depot staat.`);
            }
            if (plan.teLaat > 0) {
                delen.push(`${plan.teLaat === 1 ? 'Eén post valt' : `${plan.teLaat} posten vallen`} na de uiterste indiendatum. Dat deel raakt niet meer op tijd uitbetaald.`);
            }
            uit.planSaldo.textContent = delen.join(' ');
            uit.planSaldo.dataset.status = (plan.tekort > 0 || plan.teLaat > 0) ? 'afwijkend' : '';
        }

        if (uit.planBewijs) {
            // Wat er bij een declaratie mee moet, staat al per aanbieder in de
            // data. Hier hoort het thuis: op het moment dat iemand zijn indienen
            // plant, niet drie pagina's verderop.
            const eisen = (bank.eisen || []).filter((e) => e.waarde);
            uit.planBewijs.innerHTML = eisen.length
                ? `<strong>Wat ${bank.naam} bij een declaratie wil zien</strong><ul class="bs-plan-eisen">`
                    + eisen.map((e) => `<li><strong>${e.waarde}</strong>${e.detail ? ` &mdash; ${e.detail}` : ''}</li>`).join('')
                    + '</ul>'
                : `<strong>${bank.naam}</strong> publiceert niet welk bewijsstuk bij een declaratie hoort. Vraag dat na voordat u indient.`;
        }

        return plan;
    }

    /* -------------------------------------------------------------- tijdlijn */

    /**
     * Bouwt de gebeurtenissen op de tijdlijn. Elke gebeurtenis heeft of een
     * datum, of een uitleg waarom die er niet is. Nooit beide leeg.
     */
    function gebeurtenissen(bank, start, soort) {
        const rij = [];
        const looptijd = bank.looptijd[soort];
        const vergoeding = bank.vergoeding.maanden[soort];
        const verlenging = bank.verlenging[soort];
        const aanvraag = bank.verlengingAanvragen;

        rij.push({
            naam: 'Depot geopend',
            datum: start,
            uitleg: 'Vanaf deze datum betaalt u rente over het depot en loopt de termijn.',
        });

        // De vergoedingsduur hoort vergeleken te worden met de langste termijn die
        // het depot kan halen, niet met de standaardtermijn. Bij ABN AMRO loopt de
        // vergoeding bij nieuwbouw 30 maanden: voorbij de standaard van 24, maar
        // niet tot de 36 die met verlenging mogelijk zijn.
        const langste = bank.maximaal[soort] ?? looptijd;

        if (bank.vergoeding.model === 'rente-alleen-over-opgenomen') {
            rij.push({
                naam: 'Vergoeding',
                uitleg: `${bank.naam} vergoedt geen rente over uw depotsaldo, maar rekent er ook geen rente over. Er is dus geen datum waarop dit verandert.`,
            });
        } else if (typeof vergoeding === 'number') {
            const loopt_door_na_standaard = typeof looptijd === 'number' && vergoeding > looptijd;
            const stopt_eerder = typeof langste === 'number' && vergoeding < langste;
            let uitleg;
            if (!stopt_eerder) {
                uitleg = `De vergoeding loopt door tot het einde van uw depot, ook als u verlengt.`;
            } else if (loopt_door_na_standaard) {
                uitleg = `De vergoeding loopt ${vergoeding} maanden en dus door in de verlenging, maar niet tot het einde daarvan. Over de laatste ${langste - vergoeding} maanden betaalt u wel rente en ontvangt u niets meer.`;
            } else {
                uitleg = `Na ${vergoeding} maanden stopt de vergoeding, terwijl het depot tot ${langste} maanden kan lopen. Wat er daarna nog in staat kost u wel rente en levert niets meer op.`;
            }
            rij.push({
                naam: 'Vergoeding stopt',
                datum: maandenErbij(start, vergoeding),
                uitleg,
                let_op: stopt_eerder,
            });
        }

        if (aanvraag.maandenVoorEinde != null && typeof looptijd === 'number') {
            const moment = maandenErbij(start, looptijd - aanvraag.maandenVoorEinde);
            rij.push({
                naam: aanvraag.soort === 'bericht-van-bank' ? 'Bericht over verlengen' : 'Verlengen aanvragen kan vanaf',
                datum: moment,
                uitleg: aanvraag.detail || '',
                let_op: aanvraag.soort !== 'bericht-van-bank',
            });
        }

        if (typeof looptijd === 'number') {
            rij.push({
                naam: 'Standaardtermijn eindigt',
                datum: maandenErbij(start, looptijd),
                uitleg: `De standaardlooptijd bij ${bank.naam} is ${looptijd} maanden voor ${soort === 'verbouw' ? 'verbouwing van een bestaande woning' : 'nieuwbouw'}.`,
                let_op: true,
            });
        }

        if (typeof verlenging === 'number' && typeof looptijd === 'number') {
            rij.push({
                naam: 'Uiterste einddatum na verlenging',
                datum: maandenErbij(start, looptijd + verlenging),
                uitleg: bank.verlenging.eenmalig === false
                    ? `Verlengen kan bij ${bank.naam} in meer dan één stap, tot in totaal ${looptijd + verlenging} maanden.`
                    : `Met de eenmalige verlenging van ${verlenging} maanden komt u op ${looptijd + verlenging} maanden in totaal.`,
            });
        } else if (bank.verlenging.duurOnbekend) {
            rij.push({
                naam: 'Na verlenging',
                uitleg: `${bank.naam} maakt verlenging wel mogelijk maar publiceert niet met hoeveel maanden. Wij rekenen daar geen datum voor uit; vraag die op bij uw eigen adviseur.`,
            });
        } else if (bank.verlenging.geen) {
            rij.push({
                naam: 'Geen verlenging gepubliceerd',
                uitleg: `${bank.naam} publiceert geen verlenging: de bron stelt dat het depot na de looptijd automatisch stopt. Reken dus met de einddatum hierboven als een harde datum, en vraag bij uw adviseur na of er in uw geval iets mogelijk is.`,
            });
        }

        if (aanvraag.maandenVoorEinde == null) {
            rij.push({
                naam: 'Verlengen regelen',
                uitleg: aanvraag.detail
                    ? `${aanvraag.detail} Zet zelf een herinnering ruim voor de einddatum.`
                    : `${bank.naam} publiceert niet hoeveel maanden voor de einddatum een verlenging geregeld moet zijn. Wacht er niet mee tot de laatste weken.`,
            });
        }

        // Een tijdlijn die niet op datum staat is geen tijdlijn. De gebeurtenissen
        // worden hierboven per onderwerp opgebouwd, niet per moment: het bericht
        // over verlengen valt bijvoorbeeld voor de einddatum, maar wordt daarna
        // toegevoegd. Wat geen datum heeft komt onderaan te staan.
        const metDatum = rij.filter((g) => g.datum).sort((a, b) => a.datum - b.datum);
        return [...metDatum, ...rij.filter((g) => !g.datum)];
    }

    function toonTijdlijn(rij, nu) {
        uit.tijdlijn.innerHTML = rij.map((g) => {
            const geweest = g.datum && g.datum <= nu;
            const klassen = ['bs-stap'];
            if (geweest) klassen.push('bs-stap--geweest');
            if (g.let_op && !geweest) klassen.push('bs-stap--letop');
            if (!g.datum) klassen.push('bs-stap--zonder-datum');
            return `<li class="${klassen.join(' ')}">
                <div class="bs-stap__datum">${g.datum ? datum.format(g.datum) : 'geen datum'}</div>
                <div class="bs-stap__inhoud">
                    <strong>${g.naam}</strong>
                    <span class="bs-hulp">${g.uitleg}</span>
                </div>
            </li>`;
        }).join('');
    }

    /* ------------------------------------------------------------- berekenen */

    function bereken() {
        bewaar();

        // De agenda staat uit tot er datums zijn. Zonder bank of zonder
        // passeerdatum is er niets te exporteren, en een knop die niets doet is
        // erger dan geen knop: je denkt dat het gelukt is.
        laatsteAgenda = null;
        if (uit.agendaKnop) uit.agendaKnop.disabled = true;

        const bank = huidigeBank();
        const soort = velden.soort?.value === 'nieuwbouw' ? 'nieuwbouw' : 'verbouw';
        const bedrag = Math.max(0, leesGetal(velden.bedrag?.value) || 0);
        // Stil afkappen is precies waar deze site niet voor staat: de bezoeker
        // typt 80.000, ziet 50.000 terug en weet niet of de tool hem begrepen
        // heeft. We rekenen wel door met een bruikbare waarde, maar zeggen het.
        const ingevoerd = leesGetal(velden.stand?.value) || 0;
        const begrensd = Math.min(bedrag, Math.max(0, ingevoerd));

        // Het ene bedrag volgt uit het andere; welk van de twee is ingevuld
        // maakt voor de rest van de berekening niet uit.
        const opgenomen = modus === 'restant' ? bedrag - begrensd : begrensd;
        const saldo = modus === 'restant' ? begrensd : bedrag - opgenomen;

        if (uit.foutStand) {
            const t = TEKSTEN[modus];
            let melding = '';
            if (ingevoerd < 0) melding = t.negatief;
            else if (bedrag > 0 && ingevoerd > bedrag) melding = t.teHoog(euro.format(bedrag));
            uit.foutStand.textContent = melding;
            velden.stand?.setAttribute('aria-invalid', melding ? 'true' : 'false');
        }

        uit.saldo.textContent = euro.format(saldo);
        const pct = bedrag > 0 ? (opgenomen / bedrag) * 100 : 0;
        // De bedragen dragen de regel, niet het percentage: "142.374 van 334.110"
        // is wat iemand met zijn bankafschrift vergelijkt. Het percentage is de
        // samenvatting daarvan en hoort dus achteraan, niet vooraan.
        uit.opgenomenPct.innerHTML = bedrag > 0
            ? `<strong>${euro.format(opgenomen)}</strong> van ${euro.format(bedrag)} opgenomen &middot; ${Math.round(pct)}%`
            : 'Vul uw depotbedrag in.';
        if (uit.balkOpgenomen) uit.balkOpgenomen.style.width = `${pct.toFixed(1)}%`;

        // Zonder bank zijn er geen termijnen en dus geen agenda. De pagina zegt
        // dat, in plaats van een tijdlijn met streepjes te tonen.
        if (uit.geenBank) uit.geenBank.hidden = !!bank;
        if (uit.tijdlijn) uit.tijdlijn.hidden = !bank;
        if (!bank) {
            uit.koptekst.textContent = 'Kies uw geldverstrekker';
            uit.resterend.textContent = '—';
            uit.resterendZin.textContent = 'De termijnen verschillen per aanbieder. Zonder die keuze kunnen wij geen datums berekenen.';
            if (uit.restantRegel) uit.restantRegel.hidden = true;
            if (uit.waarschuwing) uit.waarschuwing.hidden = true;
            return;
        }

        const startWaarde = velden.start?.value;
        const start = startWaarde ? new Date(`${startWaarde}T00:00:00`) : null;
        const nu = vandaag();

        uit.koptekst.textContent = `Uw depot bij ${bank.naam}`;

        if (!start || Number.isNaN(start.getTime())) {
            uit.resterend.textContent = '—';
            uit.resterendZin.textContent = 'Vul de datum in waarop uw hypotheek is gepasseerd; vanaf dat moment loopt de termijn.';
            uit.tijdlijn.hidden = true;
            if (uit.restantRegel) uit.restantRegel.hidden = true;
            if (uit.waarschuwing) uit.waarschuwing.hidden = true;
            return;
        }

        const looptijd = bank.looptijd[soort];
        const einde = typeof looptijd === 'number' ? maandenErbij(start, looptijd) : null;
        const resterend = einde ? maandenTussen(nu, einde) : null;

        // Een passeerdatum in de toekomst is een echt geval: wie volgende maand
        // passeert wil weten wanneer zijn depot afloopt. Maar "resterend" telt
        // vanaf vandaag, en dat gaf een kop van 33 maanden bij een termijn die
        // 24 maanden duurt -- meer tijd dan het depot lang is. De tijdlijn klopt
        // wel, dus die laten we staan; alleen de kop vertelt iets anders.
        const nogNietGeopend = start > nu;

        if (nogNietGeopend && einde) {
            uit.resterend.textContent = 'Nog niet gestart';
            uit.resterendZin.textContent = `Uw depot opent op ${datum.format(start)}. Vanaf dat moment loopt de standaardtermijn van ${looptijd} maanden, tot ${datum.format(einde)}.`;
        } else if (resterend == null) {
            uit.resterend.textContent = '—';
            uit.resterendZin.textContent = `${bank.naam} publiceert geen standaardlooptijd voor dit deposoort.`;
        } else if (resterend <= 0) {
            const over = Math.abs(Math.round(resterend));
            uit.resterend.textContent = 'Verlopen';
            uit.resterendZin.textContent = `De standaardtermijn eindigde ${over === 0 ? 'deze maand' : `ongeveer ${over} ${over === 1 ? 'maand' : 'maanden'} geleden`}, op ${datum.format(einde)}. Staat er nog geld in het depot, neem dan contact op met ${bank.naam}: zonder verlenging wordt het restant meestal op de lening afgelost.`;
        } else {
            const heel = Math.floor(resterend);
            uit.resterend.textContent = heel >= 1 ? `${heel} ${heel === 1 ? 'maand' : 'maanden'}` : 'Minder dan een maand';
            uit.resterendZin.textContent = `De standaardtermijn eindigt op ${datum.format(einde)}. ${saldo > 0
                ? `Er staat nog ${euro.format(saldo)} in het depot dat voor die datum besteed of verlengd moet zijn.`
                : 'Volgens uw invoer is het depot leeg.'}`;
        }

        const rij = gebeurtenissen(bank, start, soort);
        toonTijdlijn(rij, nu);
        // De agendaknop werkt met dezelfde gebeurtenissen als de tijdlijn, zodat
        // wat iemand meeneemt niet kan afwijken van wat hij op het scherm zag.
        const plan = toonPlan(bank, einde, saldo);
        laatsteAgenda = { bank, soort, rij, plan };
        if (uit.agendaKnop) uit.agendaKnop.disabled = !rij.some((g) => g.datum);

        if (uit.restantRegel) {
            uit.restantRegel.hidden = false;
            const restant = bank.restant;
            uit.restantRegel.innerHTML = `<strong>Wat gebeurt er met het restant?</strong> Bij ${bank.naam}: ${restant.waarde
                ? restant.waarde.toLowerCase() + '.'
                : 'niet gepubliceerd.'}${restant.detail ? ` ${restant.detail}` : ''}`;
        }

        // Alleen waarschuwen als er echt iets te verliezen is: geld in het depot
        // en weinig tijd. Een waarschuwing bij een leeg depot is ruis.
        if (uit.waarschuwing) {
            const vergoeding = bank.vergoeding.maanden[soort];
            const vergoedingStopt = typeof vergoeding === 'number' && bank.vergoeding.model === 'beperkt-in-duur'
                ? maandenErbij(start, vergoeding)
                : null;
            const vergoedingVoorbij = vergoedingStopt && vergoedingStopt <= nu;

            let tekst = '';
            if (saldo > 0 && resterend != null && resterend > 0 && resterend <= 4) {
                tekst = `Er staat nog ${euro.format(saldo)} in het depot en de standaardtermijn eindigt over minder dan vier maanden. Dit is het moment om te beslissen: bestellen en declareren, of verlenging aanvragen.`;
            } else if (saldo > 0 && vergoedingVoorbij) {
                tekst = `De vergoedingstermijn van ${vergoeding} maanden is voorbij, terwijl er nog ${euro.format(saldo)} in het depot staat. Over dat bedrag betaalt u wel rente en ontvangt u niets meer terug.`;
            }
            uit.waarschuwing.hidden = !tekst;
            uit.waarschuwing.querySelector('p').textContent = tekst;
        }
    }

    /* ---------------------------------------------------------------- binding */

    Object.values(velden).forEach((v) => {
        v?.addEventListener('input', bereken);
        if (v?.tagName === 'SELECT') v.addEventListener('change', bereken);
    });

    document.querySelectorAll('.bs-segment [data-modus]').forEach((knop) => {
        knop.addEventListener('click', () => {
            if (knop.dataset.modus === modus) return;
            // Het getal in het veld hoort mee te veranderen: wie 20.000 opgenomen
            // heeft van 50.000, ziet na het wisselen 30.000 staan. Zonder die
            // omrekening zou dezelfde invoer ineens iets anders betekenen.
            const bedrag = leesGetal(velden.bedrag?.value) || 0;
            const huidig = leesGetal(velden.stand?.value) || 0;
            if (velden.stand && bedrag > 0) {
                velden.stand.value = Math.max(0, bedrag - Math.min(bedrag, Math.max(0, huidig)));
            }
            zetModus(knop.dataset.modus);
        });
    });

    el('dp-post-toevoegen')?.addEventListener('click', () => {
        posten.push({ omschrijving: '', bedrag: 0, maand: '' });
        tekenPosten();
        bereken();
        // De cursor hoort in het veld te staan dat er net bij kwam.
        uit.postenLijst?.querySelector('.bs-postrij:last-child input')?.focus();
    });

    el('dp-printen')?.addEventListener('click', () => window.print());

    // Een herinnering hoort alleen bij een moment waarop iets te regelen valt.
    // De tijdlijn markeert die al met let_op; dat hergebruiken we hier, zodat de
    // agenda niet bij elke gebeurtenis piept. Een agenda die te vaak piept wordt
    // uitgezet, en werkt dan niet meer op het moment dat het ertoe doet.
    const DAGEN_VOORAF = 30;

    el('dp-agenda')?.addEventListener('click', () => {
        if (!laatsteAgenda) return;
        const { bank, soort, rij, plan } = laatsteAgenda;
        const extra = [];
        if (plan?.uiterste && plan.regels.length) {
            extra.push({
                naam: 'Uiterlijk declareren',
                datum: plan.uiterste,
                uitleg: `Na deze datum is een declaratie bij ${bank.naam} niet meer op tijd verwerkt voor het einde van uw depot.`,
                let_op: true,
            });
        }
        const naam = `Bouwdepot ${bank.naam}`;
        const inhoud = maakAgenda({
            naam,
            bron: 'bouwdepotcalculator.nl/depotplanner.html',
            gebeurtenissen: [...rij, ...extra].map((g) => ({
                naam: g.naam,
                datum: g.datum,
                uitleg: g.uitleg,
                herinnering: g.let_op ? DAGEN_VOORAF : null,
            })),
        });
        if (!inhoud) return;
        const kern = `${bank.id}-${soort}`;
        downloadAgenda(`bouwdepot-${kern}.ics`, inhoud);
    });

    el('dp-vandaag')?.addEventListener('click', () => {
        // Handig voor wie zijn depot vandaag opent, en het maakt de tijdlijn
        // meteen zichtbaar voor wie komt kijken hoe de pagina werkt.
        // Niet toISOString: die rekent naar UTC, en in onze zomertijd levert
        // lokale middernacht dan de dag ervoor op. De knop vulde daardoor
        // gisteren in, en op deze pagina schuift dat elke datum een dag mee.
        velden.start.value = alsInvoerdatum(vandaag());
        bereken();
    });

    // De startdatum blijft bewust leeg tot de bezoeker hem invult. Een voorbeeld
    // invullen zou een tijdlijn opleveren die eruitziet als de zijne maar het niet
    // is, en op deze pagina zijn de datums het hele product.
    herstel();
    // Zonder dit staan teruggehaalde posten wel in het geheugen -- het plan
    // rekent er dan mee -- maar is de lijst op het scherm leeg. Een plan met
    // posten boven een lege invoerlijst is niet te rijmen.
    tekenPosten();
    opBankwissel(bereken);
}
