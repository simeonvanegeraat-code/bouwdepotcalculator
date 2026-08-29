/**
 * Leenruimte op basis van woningwaarde.
 *
 * Stond eerder als uitklapblok op de homepage, onder het label "Ook
 * waarderuimte en eigen geld toetsen". Voor wie een bestaande woning verbouwt
 * is dit geen "ook" maar de vraag die vooraf gaat aan de maandlast: kan ik dit
 * uberhaupt financieren.
 *
 * De rekenregels zijn ongewijzigd overgenomen uit main.js:
 *
 *   waarderuimte      = waarde na verbouwing - huidige hypotheek
 *   financieringsgat  = gewenst bedrag - waarderuimte
 *   eigen geld nodig  = financieringsgat + kosten buiten het depot
 *   buffer daarna     = beschikbaar eigen geld - eigen geld nodig
 *
 * Dit is nadrukkelijk een waardetoets, geen inkomenstoets. Wat een
 * geldverstrekker werkelijk verstrekt hangt daarnaast af van inkomen,
 * verplichtingen, taxatie en acceptatiebeleid.
 */

import { leesGetal } from './getallen.js';

const wortel = document.getElementById('leenruimte');

if (wortel) {
    const SLEUTEL = 'bouwdepot-leenruimte-v1';
    const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    const el = (id) => document.getElementById(id);

    const velden = {
        bedrag: el('lr-bedrag'),
        hypotheek: el('lr-hypotheek'),
        waarde: el('lr-waarde'),
        eigenGeld: el('lr-eigen-geld'),
        buitenDepot: el('lr-buiten-depot'),
    };

    const uit = {
        ruimte: el('lr-res-ruimte'),
        gat: el('lr-res-gat'),
        nodig: el('lr-res-nodig'),
        buffer: el('lr-res-buffer'),
        zin: el('lr-res-zin'),
        verhouding: el('lr-res-verhouding'),
        balkLening: el('lr-balk-lening'),
        balkRuimte: el('lr-balk-ruimte'),
    };

    /* --------------------------------------------------------- begroting mee */

    // De verbouwbegroting linkt hierheen met het depotbedrag in de URL.
    const uitUrl = new URLSearchParams(window.location.search).get('bedrag');
    if (uitUrl && Number(uitUrl) > 0 && velden.bedrag) velden.bedrag.value = uitUrl;

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
                // Een bedrag uit de URL wint van wat er onthouden is.
                if (naam === 'bedrag' && uitUrl) continue;
                if (velden[naam] && waarde) velden[naam].value = waarde;
            }
        } catch (_) {}
    };

    /* ------------------------------------------------------------- berekenen */

    function bereken() {
        const bedrag = Math.max(0, leesGetal(velden.bedrag?.value) || 0);
        const hypotheek = Math.max(0, leesGetal(velden.hypotheek?.value) || 0);
        const waarde = Math.max(0, leesGetal(velden.waarde?.value) || 0);
        const eigenGeld = Math.max(0, leesGetal(velden.eigenGeld?.value) || 0);
        const buitenDepot = Math.max(0, leesGetal(velden.buitenDepot?.value) || 0);

        const ruimte = Math.max(0, waarde - hypotheek);
        const gat = Math.max(0, bedrag - ruimte);
        const nodig = gat + buitenDepot;
        const buffer = eigenGeld - nodig;

        uit.ruimte.textContent = euro.format(ruimte);
        uit.gat.textContent = euro.format(gat);
        uit.nodig.textContent = euro.format(nodig);
        uit.buffer.textContent = euro.format(buffer);
        uit.buffer.classList.toggle('is-tekort', buffer < 0);

        // Hoe verhoudt de totale lening zich tot de waarde na verbouwing?
        const totaleLening = hypotheek + Math.min(bedrag, ruimte);
        const verhouding = waarde > 0 ? (totaleLening / waarde) * 100 : 0;
        if (uit.verhouding) {
            uit.verhouding.textContent = waarde > 0 ? `${Math.round(verhouding)}% van de woningwaarde` : 'Vul de waarde na verbouwing in';
        }
        if (uit.balkLening && uit.balkRuimte && waarde > 0) {
            const pctHyp = Math.min(100, (hypotheek / waarde) * 100);
            const pctExtra = Math.min(100 - pctHyp, (Math.min(bedrag, ruimte) / waarde) * 100);
            uit.balkLening.style.width = pctHyp.toFixed(1) + '%';
            uit.balkRuimte.style.width = pctExtra.toFixed(1) + '%';
        }

        uit.zin.textContent = waarde <= 0
            ? 'Vul de verwachte woningwaarde na verbouwing in om de waarderuimte te beoordelen.'
            : gat === 0
                ? buffer >= 0
                    ? `Het gewenste bedrag past binnen de waarderuimte. Na de kosten buiten het depot blijft ${euro.format(buffer)} eigen buffer over.`
                    : `Het bedrag past binnen de waarderuimte, maar voor de kosten buiten het depot ontbreekt nog ${euro.format(Math.abs(buffer))}.`
                : buffer >= 0
                    ? `Van het gewenste bedrag valt ${euro.format(gat)} buiten de waarderuimte. Met uw eigen geld is dat te overbruggen; er blijft ${euro.format(buffer)} over.`
                    : `Van het gewenste bedrag valt ${euro.format(gat)} buiten de waarderuimte. Daarvoor ontbreekt indicatief ${euro.format(Math.abs(buffer))} aan eigen middelen.`;

        const naarMaandlast = el('lr-naar-maandlast');
        if (naarMaandlast) {
            const financierbaar = Math.min(bedrag, ruimte);
            naarMaandlast.href = financierbaar > 0 ? `/?bedrag=${Math.round(financierbaar)}` : '/';
        }

        bewaar();
    }

    Object.values(velden).forEach((v) => v?.addEventListener('input', bereken));

    el('lr-praktijkcase')?.addEventListener('click', () => {
        velden.bedrag.value = 75000;
        velden.hypotheek.value = 300000;
        velden.waarde.value = 360000;
        velden.eigenGeld.value = 25000;
        velden.buitenDepot.value = 10000;
        bereken();
    });

    herstel();
    bereken();
}
