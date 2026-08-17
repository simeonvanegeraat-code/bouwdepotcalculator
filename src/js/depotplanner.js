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

const wortel = document.getElementById('depotplanner');

if (wortel) {
    const SLEUTEL = 'bouwdepot-planner-v1';
    const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    const datum = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    const el = (id) => document.getElementById(id);

    const velden = {
        soort: el('dp-soort'),
        start: el('dp-start'),
        bedrag: el('dp-bedrag'),
        opgenomen: el('dp-opgenomen'),
    };

    const uit = {
        koptekst: el('dp-koptekst'),
        resterend: el('dp-resterend'),
        resterendZin: el('dp-resterend-zin'),
        saldo: el('dp-saldo'),
        opgenomenPct: el('dp-opgenomen-pct'),
        balkOpgenomen: el('dp-balk-opgenomen'),
        tijdlijn: el('dp-tijdlijn'),
        restantRegel: el('dp-restant'),
        waarschuwing: el('dp-waarschuwing'),
        geenBank: el('dp-geen-bank'),
    };

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

    const vandaag = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

    /* ---------------------------------------------------------------- opslag */

    const bewaar = () => {
        try {
            const staat = {};
            for (const [naam, veld] of Object.entries(velden)) if (veld) staat[naam] = veld.value;
            localStorage.setItem(SLEUTEL, JSON.stringify(staat));
        } catch (_) {}
    };

    const herstel = () => {
        try {
            const staat = JSON.parse(localStorage.getItem(SLEUTEL) || '{}');
            for (const [naam, waarde] of Object.entries(staat)) {
                if (velden[naam] && waarde) velden[naam].value = waarde;
            }
        } catch (_) {}
    };

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
            const klassen = ['stap'];
            if (geweest) klassen.push('stap--geweest');
            if (g.let_op && !geweest) klassen.push('stap--letop');
            if (!g.datum) klassen.push('stap--zonder-datum');
            return `<li class="${klassen.join(' ')}">
                <div class="stap__datum">${g.datum ? datum.format(g.datum) : 'geen datum'}</div>
                <div class="stap__inhoud">
                    <strong>${g.naam}</strong>
                    <span class="ds-caption">${g.uitleg}</span>
                </div>
            </li>`;
        }).join('');
    }

    /* ------------------------------------------------------------- berekenen */

    function bereken() {
        bewaar();

        const bank = huidigeBank();
        const soort = velden.soort?.value === 'nieuwbouw' ? 'nieuwbouw' : 'verbouw';
        const bedrag = Math.max(0, Number(velden.bedrag?.value) || 0);
        const opgenomen = Math.min(bedrag, Math.max(0, Number(velden.opgenomen?.value) || 0));
        const saldo = bedrag - opgenomen;

        uit.saldo.textContent = euro.format(saldo);
        const pct = bedrag > 0 ? (opgenomen / bedrag) * 100 : 0;
        uit.opgenomenPct.textContent = bedrag > 0
            ? `${Math.round(pct)}% opgenomen, ${euro.format(opgenomen)} van ${euro.format(bedrag)}`
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

        if (resterend == null) {
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

        toonTijdlijn(gebeurtenissen(bank, start, soort), nu);

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

    el('dp-printen')?.addEventListener('click', () => window.print());

    el('dp-vandaag')?.addEventListener('click', () => {
        // Handig voor wie zijn depot vandaag opent, en het maakt de tijdlijn
        // meteen zichtbaar voor wie komt kijken hoe de pagina werkt.
        velden.start.value = vandaag().toISOString().slice(0, 10);
        bereken();
    });

    // De startdatum blijft bewust leeg tot de bezoeker hem invult. Een voorbeeld
    // invullen zou een tijdlijn opleveren die eruitziet als de zijne maar het niet
    // is, en op deze pagina zijn de datums het hele product.
    herstel();
    opBankwissel(bereken);
}
