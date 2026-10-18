/**
 * leenruimte.html: invoer lezen, de rekenkern aanroepen, de uitkomst tonen.
 *
 * Hier staat geen rekenregel. Alle bedragen komen uit src/domain/leenruimte.js;
 * de uitkomst, de ruimtebalk, "Zo is het gerekend", het afdrukoverzicht en het
 * Excel-bestand lezen dezelfde uitkomst.
 *
 * De velden hebben eigen id's (lr-...). Het gedeelde formuliergeheugen kent ze
 * niet, en de pagina bewaart zelf niets: inkomen hoort niet ongevraagd in de
 * opslag van de browser. Een link met de invoer erin maakt de bezoeker zelf.
 */

import { bindReportButton, startRekenpagina } from '../js/rekenpagina.js';
import { leesGetal, leesPercentage, toonGetal, euro, maakVeldlezer } from '../js/getallen.js';
import { berekenLeenruimte, ENERGIELABELS } from '../domain/leenruimte.js';
import { BRON } from '../domain/trhk-2026.js';
import { geefDownload, XLSX_TYPE } from '../js/download.js';
import { ruimtebalk } from './ruimtebalk.js';

const bedragGrens = (leeg, max = 5000000) => ({
    lezer: leesGetal, min: 0, max, exclusiefNul: false,
    leeg, teLaag: 'Een bedrag onder de nul kan niet.', teHoog: 'Dat bedrag is hoger dan waar deze tool mee rekent; controleer het.',
});

const GRENZEN = {
    'lr-inkomen': bedragGrens('Vul je bruto jaarinkomen in, of nul.', 2000000),
    'lr-partner': bedragGrens('Vul het inkomen van je partner in, of nul.', 2000000),
    'lr-hypotheek': bedragGrens('Vul je huidige hypotheek in, of nul.'),
    'lr-waarde': {
        lezer: leesGetal, min: 0, max: 10000000, exclusiefNul: true,
        leeg: 'Vul in wat je woning na de verbouwing waard is.', teLaag: 'Vul een woningwaarde boven de nul in.', teHoog: 'Dat bedrag is hoger dan waar deze tool mee rekent; controleer het.',
    },
    'lr-rente': {
        lezer: leesPercentage, min: 0, max: 20, exclusiefNul: false,
        leeg: 'Vul je hypotheekrente in.', teLaag: 'Een rente onder de nul procent bestaat niet.', teHoog: 'Boven de 20 procent is geen hypotheekrente; controleer het percentage.',
    },
    'lr-verbouwing': bedragGrens('Vul in wat de verbouwing kost, of nul.', 2000000),
    'lr-besparend': bedragGrens('Vul het energiebesparende deel in, of nul.', 2000000),
    'lr-studie': bedragGrens('Vul je studieschuld per maand in, of nul.', 10000),
};

const LABELNAAM = {
    'EFG': 'E, F of G', 'CD': 'C of D', 'AB': 'A of B', 'A+ A++': 'A+ of A++', 'A+++': 'A+++', 'A++++': 'A++++',
    'A++++ garantie': 'A++++ met garantie', 'geen': 'geen geldig label',
};

const procent = (p, d = 1) => `${p.toLocaleString('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
const bedrag = (n) => euro.format(Math.round(n));

/* De link met de invoer. Korte sleutels, alleen wat afwijkt van leeg. */
const ADRES = {
    inkomen: 'lr-inkomen', partner: 'lr-partner', hypotheek: 'lr-hypotheek', waarde: 'lr-waarde', rente: 'lr-rente',
    verbouwing: 'lr-verbouwing', besparend: 'lr-besparend', studie: 'lr-studie',
};

function initLeenruimte() {
    const el = (id) => document.getElementById(id);
    const veld = Object.fromEntries(Object.keys(GRENZEN).map((id) => [id, el(id)]));
    const vast = el('lr-vast');
    const label = el('lr-label');
    const aow = el('lr-aow');
    const leesVeld = maakVeldlezer(GRENZEN);
    const printknop = el('btn-download');
    bindReportButton(printknop);

    /* Invoer uit een bewaarde link, of een bedrag uit een andere rekenpagina (?bedrag=). */
    const params = new URLSearchParams(location.search);
    for (const [sleutel, id] of Object.entries(ADRES)) {
        const w = params.get(sleutel);
        if (w !== null && Number.isFinite(Number(w)) && Number(w) >= 0) veld[id].value = sleutel === 'rente' ? toonGetal(Number(w), 2) : toonGetal(Math.round(Number(w)));
    }
    if (params.has('bedrag') && Number(params.get('bedrag')) > 0) veld['lr-verbouwing'].value = toonGetal(Math.round(Number(params.get('bedrag'))));
    if (params.get('vast') === 'kort') vast.value = 'kort';
    if (ENERGIELABELS.includes(params.get('label'))) label.value = params.get('label');
    if (params.get('aow') === '1') aow.checked = true;

    const uit = {
        extra: el('lr-extra'), extraNoot: el('lr-extra-noot'), zin: el('lr-zin'),
        maximaal: el('lr-maximaal'), maximaalNoot: el('lr-maximaal-noot'), maand: el('lr-maand'), maandNoot: el('lr-maand-noot'),
        eigen: el('lr-eigen'), eigenNoot: el('lr-eigen-noot'),
        balk: { huidig: el('lr-r-huidig'), lenen: el('lr-r-lenen'), zelf: el('lr-r-zelf'), over: el('lr-r-over') },
        grens: { inkomen: el('lr-r-grens-inkomen'), waarde: el('lr-r-grens-waarde') },
        leg: Object.fromEntries([...document.querySelectorAll('[data-lr-leg]')].map((li) => [li.dataset.lrLeg, li])),
        stappenInkomen: el('lr-stappen-inkomen'), stappenWaarde: el('lr-stappen-waarde'),
        vast: el('wr-vast'), vastBedrag: el('wr-vast-bedrag'), naarDepot: el('naar-depot'),
    };
    const punt = Object.fromEntries([...document.querySelectorAll('[data-lr-punt]')].map((p) => [p.dataset.lrPunt, p]));
    let laatste = null;

    function zetBedrag(element, tekst, noot, nootElement) {
        element.firstChild.textContent = tekst;
        if (nootElement) nootElement.textContent = noot;
    }

    function toonGeenUitkomst() {
        for (const [e, n] of [[uit.extra, uit.extraNoot], [uit.maximaal, uit.maximaalNoot], [uit.maand, uit.maandNoot], [uit.eigen, uit.eigenNoot]]) zetBedrag(e, '–', '', n);
        uit.zin.dataset.status = 'afwijkend';
        uit.zin.textContent = 'Pas de gemarkeerde velden aan voor een uitkomst.';
        uit.stappenInkomen.innerHTML = '';
        uit.stappenWaarde.innerHTML = '';
        for (const b of Object.values(uit.balk)) b.style.width = '0';
        for (const li of Object.values(uit.leg)) li.querySelector('strong').textContent = '';
        uit.vast.classList.remove('is-zichtbaar');
        laatste = null;
        delete printknop.dataset.report;
    }

    /* Het bedrag in het goudkleurige vak, als het past; anders staat het alleen
       in de lijst eronder. Geschat op ongeveer 8 pixels per teken bij deze
       letter, plus wat lucht; opnieuw bij een andere schermbreedte. */
    let vakBreedte = 0;
    let vakBedrag = '';
    const vakTekst = el('lr-r-lenen-tekst');
    const balk = el('lr-r-lenen').parentElement;
    function plaatsVakTekst() {
        const pixels = (vakBreedte / 100) * balk.clientWidth;
        vakTekst.textContent = vakBedrag && pixels >= vakBedrag.length * 8 + 16 ? vakBedrag : '';
    }
    if ('ResizeObserver' in window) new ResizeObserver(plaatsVakTekst).observe(balk);

    const rij = (dt, dd, sterk = false) => `<dt>${dt}</dt><dd class="tnum">${sterk ? `<strong>${dd}</strong>` : dd}</dd>`;

    function reken() {
        const g = Object.fromEntries(Object.entries(veld).map(([id, v]) => [id, leesVeld(v)]));
        if (Object.values(g).some((w) => w === null)) { toonGeenUitkomst(); return; }

        const invoer = {
            inkomen: g['lr-inkomen'], inkomenPartner: g['lr-partner'], aowBereikt: aow.checked,
            rentePercent: g['lr-rente'], tienJaarVast: vast.value === 'lang', studieschuldMaand: g['lr-studie'],
            hypotheek: g['lr-hypotheek'], waarde: g['lr-waarde'], verbouwing: g['lr-verbouwing'],
            energiebesparend: g['lr-besparend'], label: label.value,
        };
        const u = berekenLeenruimte(invoer);
        laatste = { invoer, u };

        /* De uitkomst. Het bedrag is wat je voor de verbouwing kunt lenen; mag
           er meer, dan staat dat in de zin, want meer dan de verbouwing kost
           hoort niet in een bouwdepot. */
        const grensTekst = u.grens === 'inkomen' ? 'je inkomen' : 'de woningwaarde';
        zetBedrag(uit.extra, bedrag(u.voorVerbouwing), invoer.verbouwing > 0 ? `van ${bedrag(invoer.verbouwing)}` : '', uit.extraNoot);
        uit.zin.dataset.status = u.extra > 0 ? '' : 'afwijkend';
        if (u.extra <= 0) {
            uit.zin.textContent = `Met deze gegevens kun je niets bijlenen: ${grensTekst} laat een hypotheek toe van ${bedrag(u.maximaal)}, en je hebt al ${bedrag(u.hypotheek)}. De verbouwing betaal je dan met eigen geld.`;
        } else if (u.extra > u.voorVerbouwing) {
            uit.zin.textContent = `Je kunt de hele verbouwing lenen. De grens komt uit ${grensTekst}: tot ${bedrag(u.maximaal)} hypotheek, dus ${bedrag(u.extra)} meer dan je nu hebt.`;
        } else {
            uit.zin.textContent = `De grens komt uit ${grensTekst}: je hypotheek mag tot ${bedrag(u.maximaal)}, ${bedrag(u.extra)} meer dan nu. De rest van de verbouwing betaal je zelf.`;
        }

        zetBedrag(uit.maximaal, bedrag(u.maximaal), u.grens === 'inkomen' ? 'grens: je inkomen' : 'grens: de woningwaarde', uit.maximaalNoot);
        zetBedrag(uit.maand, bedrag(u.extraMaandlast), u.voorVerbouwing > 0 ? `bruto, bij ${procent(invoer.rentePercent, 2)} over 30 jaar` : '', uit.maandNoot);
        zetBedrag(uit.eigen, bedrag(u.eigenGeld), u.eigenGeld > 0 ? 'voor wat je niet kunt lenen' : 'je kunt alles lenen', uit.eigenNoot);

        /* De ruimtebalk en de lijst eronder: wat er staat, wat erbij kan, wat je
           zelf betaalt, en waar de twee grenzen liggen. */
        const r = ruimtebalk(u, invoer.verbouwing);
        uit.balk.huidig.parentElement.classList.toggle('is-geknikt', r.geknikt);
        for (const deel of ['huidig', 'lenen', 'zelf', 'over']) {
            uit.balk[deel].style.left = `${r[deel].left.toFixed(2)}%`;
            uit.balk[deel].style.width = `${r[deel].width.toFixed(2)}%`;
        }
        vakBreedte = r.lenen.width;
        vakBedrag = u.voorVerbouwing > 0 ? bedrag(u.voorVerbouwing) : '';
        plaatsVakTekst();
        uit.grens.inkomen.style.left = `${r.grensInkomen.toFixed(2)}%`;
        uit.grens.waarde.style.left = `${r.grensWaarde.toFixed(2)}%`;
        uit.grens.inkomen.classList.toggle('is-grens', u.grens === 'inkomen');
        uit.grens.waarde.classList.toggle('is-grens', u.grens === 'waarde');
        const legenda = {
            huidig: u.hypotheek, lenen: u.voorVerbouwing, zelf: u.eigenGeld, over: r.overBedrag,
            inkomen: u.maxInkomen, waarde: u.maxWaarde,
        };
        for (const [deel, waarde] of Object.entries(legenda)) {
            uit.leg[deel].querySelector('strong').textContent = bedrag(waarde);
            uit.leg[deel].hidden = (deel === 'zelf' || deel === 'over' || deel === 'lenen') && waarde <= 0;
        }
        uit.leg.inkomen.classList.toggle('is-grens', u.grens === 'inkomen');
        uit.leg.waarde.classList.toggle('is-grens', u.grens === 'waarde');

        /* Zo is het gerekend: elke stap, met het percentage uit de wet. */
        const s = u.studieschuld;
        uit.stappenInkomen.innerHTML = [
            rij('Toetsinkomen', bedrag(u.toetsinkomen)),
            rij(`Toetsrente${invoer.tienJaarVast ? ', je eigen rente' : ', minimaal 5%'}`, procent(u.toetsrente, 2)),
            rij(`Percentage uit de wet, tabel ${invoer.aowBereikt ? 2 : 1}`, procent(u.percentage * 100)),
            rij('Toegestane last per maand', bedrag(u.lastUitInkomen)),
            s.termijn > 0 ? rij(`Min studieschuld, ${bedrag(s.termijn)} &times; ${toonGetal(s.factor, 2)}`, `&minus;${bedrag(s.gebruteerd)}`) : '',
            rij('Te lenen met die last, 30 jaar', bedrag(u.uitLast)),
            u.erbij.label > 0 ? rij(`Plus bij energielabel ${LABELNAAM[invoer.label]}`, bedrag(u.erbij.label)) : '',
            u.erbij.energiebesparend > 0 ? rij('Plus energiebesparende maatregelen', bedrag(u.erbij.energiebesparend)) : '',
            u.erbij.alleenstaand > 0 ? rij('Plus voor een alleenstaande', bedrag(u.erbij.alleenstaand)) : '',
            rij('Maximale hypotheek op inkomen', bedrag(u.maxInkomen), true),
        ].join('');
        uit.stappenWaarde.innerHTML = [
            rij('Woningwaarde na de verbouwing', bedrag(invoer.waarde)),
            rij('Maximaal 100% daarvan', bedrag(u.waarde.basis)),
            u.waarde.energiebesparend > 0 ? rij('Plus energiebesparend, tot 106%', bedrag(u.waarde.energiebesparend)) : '',
            rij('Maximale hypotheek op woningwaarde', bedrag(u.maxWaarde), true),
            rij('Min je huidige hypotheek', `&minus;${bedrag(u.hypotheek)}`),
            rij(`Extra te lenen, laagste van beide`, bedrag(u.extra), true),
        ].join('');

        /* Nog te controleren. */
        // Wat een taxatie van 10.000 lager doet met wat je voor de verbouwing kunt lenen.
        const lager = berekenLeenruimte({ ...invoer, waarde: Math.max(1, invoer.waarde - 10000) });
        const verschil = u.voorVerbouwing - lager.voorVerbouwing;
        punt.waarde.innerHTML = u.grens === 'inkomen'
            ? `Je rekent met <strong>${bedrag(invoer.waarde)}</strong>. Je grens ligt nu bij je inkomen; de waarde gaat pas tellen als de taxatie onder ${bedrag(u.maxInkomen - u.waarde.energiebesparend)} uitkomt.`
            : u.extra <= 0
                ? `Je rekent met <strong>${bedrag(invoer.waarde)}</strong>, en je hypotheek is nu al hoger dan die waarde toelaat. Alleen een hogere taxatie verandert dat.`
                : `Hier zit je grens. Je rekent met <strong>${bedrag(invoer.waarde)}</strong>; valt de taxatie ${bedrag(10000)} lager uit, dan ${verschil > 0 ? `kun je ${bedrag(verschil)} minder lenen voor de verbouwing` : 'verandert er voor je verbouwing niets'}.`;
        punt.erbij.innerHTML = u.erbij.totaal > 0
            ? `In de uitkomst zit <strong>${bedrag(u.erbij.totaal)}</strong> die de wet een bank toestaat, maar niet voorschrijft. Telt jouw bank die niet mee, dan kun je ${bedrag(u.extraZonderErbij)} extra lenen in plaats van ${bedrag(u.extra)}.`
            : 'Bij deze invoer zit er geen extra ruimte in die afhangt van je bank.';

        uit.vastBedrag.textContent = bedrag(u.voorVerbouwing);

        uit.naarDepot.href = u.voorVerbouwing > 0 ? `bouwdepot-berekenen.html?bedrag=${Math.round(u.voorVerbouwing)}&rente=${invoer.rentePercent}` : 'bouwdepot-berekenen.html';

        printknop.dataset.report = JSON.stringify({
            toolId: 'leenruimte',
            toolTitle: 'Leenruimte: hoeveel kun je lenen voor je verbouwing',
            generatedAt: new Date().toISOString(),
            inputs: {
                grossIncome: invoer.inkomen, partnerIncome: invoer.inkomenPartner || null, stateAge: invoer.aowBereikt,
                currentMortgage: invoer.hypotheek, valueAfterRenovation: invoer.waarde, interestRate: invoer.rentePercent,
                fixedTenYears: invoer.tienJaarVast, renovationCost: invoer.verbouwing, energySavingCost: invoer.energiebesparend || null,
                energyLabel: LABELNAAM[invoer.label], studentDebtMonthly: invoer.studieschuldMaand || null,
            },
            results: {
                testRate: u.toetsrente, financingPercentage: u.percentage * 100, allowedMonthly: u.toegestaneLast,
                maxOnIncome: u.maxInkomen, maxOnValue: u.maxWaarde, maxMortgage: u.maximaal, lenderAllowance: u.erbij.totaal || null,
                extraBorrowing: u.extra, ownFundsRequired: u.eigenGeld, grossMonthly: u.extraMaandlast,
                bindingLimit: u.grens === 'inkomen' ? 'je inkomen' : 'de woningwaarde',
            },
            assumptions: [
                `Normen uit de Tijdelijke regeling hypothecair krediet, versie 1 januari 2026 (${BRON}).`,
                'De hele hypotheek telt als annuïteit over 30 jaar. Andere leningen dan een studieschuld zitten er niet in.',
                'Een indicatie, geen toezegging: de geldverstrekker beslist na taxatie en een toets van je hele situatie.',
            ],
        });
    }

    /* Excel: dezelfde stappen, met formules, zodat je zelf kunt variëren. */
    el('btn-excel').addEventListener('click', async () => {
        if (!laatste) return;
        const [{ maakXlsx }, { leenruimteBlad }] = await Promise.all([import('../js/xlsx.js'), import('./blad.js')]);
        geefDownload(maakXlsx(leenruimteBlad(laatste.invoer, laatste.u)), 'leenruimte-verbouwing.xlsx', XLSX_TYPE);
    });

    /* Een link met de invoer erin, om te bewaren of door te sturen. */
    const melding = el('kopieer-melding');
    el('btn-kopieer').addEventListener('click', async () => {
        if (!laatste) { melding.textContent = 'Vul eerst de gemarkeerde velden in; dan maken we de link.'; return; }
        const i = laatste.invoer;
        const p = new URLSearchParams();
        const waarden = { inkomen: i.inkomen, partner: i.inkomenPartner, hypotheek: i.hypotheek, waarde: i.waarde, rente: i.rentePercent, verbouwing: i.verbouwing, besparend: i.energiebesparend, studie: i.studieschuldMaand };
        for (const [k, w] of Object.entries(waarden)) if (w) p.set(k, String(w));
        if (!i.tienJaarVast) p.set('vast', 'kort');
        p.set('label', i.label);
        if (i.aowBereikt) p.set('aow', '1');
        const adres = `${location.origin}${location.pathname}?${p}`;
        try {
            await navigator.clipboard.writeText(adres);
            melding.textContent = 'Link gekopieerd. Je bedragen staan in de link zelf; wie hem krijgt, ziet dezelfde berekening. Let op: dus ook je inkomen.';
        } catch {
            melding.textContent = `Kopiëren lukte niet. Kopieer deze link zelf: ${adres}`;
        }
    });

    // Op een smal scherm staat de invoer onder de uitkomst. De balk houdt het
    // bedrag in beeld zodra de uitkomst zelf uit beeld is gescrold.
    let uitkomstInBeeld = true;
    const toonBalk = () => uit.vast.classList.toggle('is-zichtbaar', !uitkomstInBeeld && laatste !== null);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([item]) => { uitkomstInBeeld = item.isIntersecting; toonBalk(); }).observe(el('uitkomst'));
    }

    for (const v of [...Object.values(veld), vast, label, aow]) {
        v.addEventListener('input', reken);
        v.addEventListener('input', toonBalk);
        v.addEventListener('change', reken);
    }
    reken();
}

startRekenpagina(initLeenruimte);
