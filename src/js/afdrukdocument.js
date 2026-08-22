/**
 * Het document dat de bezoeker meeneemt, als HTML in plaats van als PDF.
 *
 * Er waren drie manieren om hetzelfde te leveren: jsPDF op zeven pagina's, het
 * scherm afdrukken op de depotplanner, en een eigen printdocument op de
 * verbouwbegroting. Die laatste zag er veruit het beste uit, en dat is geen
 * toeval: hij laat de browser een echte tabel zetten met de letter van de site,
 * terwijl jsPDF met de hand tekende -- label vet, waarde op de volgende regel
 * ingesprongen. Zes gegevens werden zo twaalf regels losse lijst.
 *
 * Deze module bouwt datzelfde document uit het rapport dat reporting.js al
 * samenstelt. Dat scheelt een download van 359 kB precies op het moment dat de
 * bezoeker staat te wachten, houdt de tekst selecteerbaar en voorleesbaar, en
 * laat nog maar één manier over waarop een overzicht ontstaat.
 *
 * De klassenamen komen uit de bestaande specificatie van de begroting, zodat
 * beide documenten er hetzelfde uitzien en er geen tweede stijl bij komt.
 */

const esc = (waarde) => String(waarde ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const datumTekst = (iso) => {
    const d = iso ? new Date(iso) : new Date();
    return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
};

/** Een blok regels onder een eigen kopregel. */
const groep = (titel, regels) => {
    if (!regels?.length) return '';
    return `<tbody class="spec__groep">
        <tr class="spec__kopregel"><th colspan="2">${esc(titel)}</th></tr>
        ${regels.map((r) => `<tr>
            <td>${esc(r.label)}</td>
            <td class="spec__bedrag">${esc(r.value)}</td>
        </tr>`).join('')}
    </tbody>`;
};

/** Een meegestuurde tabel, zoals het maandverloop van de nieuwbouwplanning. */
const tabel = (t) => `<h3>${esc(t.title)}</h3>
    <table class="spec__tabel">
        <thead><tr>${t.columns.map((k) =>
            `<th${k.align === 'right' ? ' class="spec__bedrag"' : ''}>${esc(k.label)}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map((rij) => `<tr>${rij.map((cel, i) =>
            `<td${t.columns[i]?.align === 'right' ? ' class="spec__bedrag"' : ''}>${esc(cel)}</td>`).join('')}</tr>`).join('')}
        </tbody>
    </table>`;

/**
 * Zet het rapport om in een afdrukbaar document.
 *
 * @param {object} rapport het genormaliseerde rapport uit reporting.js
 * @returns {string} HTML
 */
export function bouwAfdrukdocument(rapport) {
    const titel = rapport.toolTitle || 'Overzicht';

    const alinea = (kop, tekst) => tekst
        ? `<h3>${esc(kop)}</h3><p>${esc(tekst)}</p>`
        : '';

    return `
        <header class="spec__kop">
            <h2>${esc(titel)}</h2>
            <p>Opgesteld op ${datumTekst(rapport.generatedAt)} &middot; bouwdepotcalculator.nl</p>
        </header>

        <table class="spec__tabel">
            ${groep('Uw invoer', rapport.inputs)}
            ${groep('Uitkomst', rapport.results)}
        </table>

        ${(rapport.tables || []).map(tabel).join('')}

        <div class="spec__voet">
            ${alinea('Conclusie', rapport.conclusion)}
            ${alinea('Interpretatie', rapport.interpretation)}
            ${alinea('Aannames', rapport.assumptions)}
            <p>Bedragen zijn door de opsteller zelf ingevuld en niet door
            BouwdepotCalculator.nl geschat of gecontroleerd. Dit is een indicatie
            op basis van publieke productinformatie en geen toezegging; uw
            geldverstrekker beoordeelt uw eigen situatie.</p>
        </div>`;
}

/**
 * Toont het document en opent het printvenster.
 *
 * De documenttitel wordt tijdelijk gezet: Chrome gebruikt die als voorgestelde
 * bestandsnaam bij "Opslaan als PDF". Zonder dat heet het bestand naar de
 * paginatitel, en dan staat er "Bouwdepot berekenen | Wat kost het per maand"
 * op iemands bureaublad.
 */
export function drukAf(rapport, bestandsnaam) {
    let vlak = document.getElementById('afdrukdocument');
    if (!vlak) {
        vlak = document.createElement('div');
        vlak.id = 'afdrukdocument';
        vlak.className = 'alleen-print';
        document.body.append(vlak);
    }
    vlak.innerHTML = bouwAfdrukdocument(rapport);

    // De klasse verbergt de pagina zelf tijdens het printen. Alleen tijdens:
    // wie later Ctrl+P drukt zonder op de knop te klikken hoort gewoon het
    // scherm te krijgen, niet een oud document dat nog in de body hangt.
    const oudeTitel = document.title;
    document.body.classList.add('afdrukken');
    if (bestandsnaam) document.title = bestandsnaam;

    const opruimen = () => {
        document.body.classList.remove('afdrukken');
        document.title = oudeTitel;
        window.removeEventListener('afterprint', opruimen);
    };
    window.addEventListener('afterprint', opruimen);

    window.print();
    // Niet elke browser stuurt afterprint; na een tel alsnog opruimen.
    setTimeout(opruimen, 1000);
}
