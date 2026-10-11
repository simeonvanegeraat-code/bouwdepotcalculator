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
 * De klassenamen (wr-spec__*) zijn die van de specificatie op de
 * verbouwbegroting, zodat beide documenten er hetzelfde uitzien. De stijlen
 * staan in src/styles/next/werkruimte.css; tests/afdrukdocument.test.mjs faalt
 * als dit document een klasse gebruikt die daar niet bestaat. Dat ging in
 * oktober 2026 mis: de klassen heetten nog bs-spec__* en hoorden bij een
 * stylesheet die de pagina's niet meer laadden. Het document stond toen
 * onopgemaakt onderaan de pagina, ook op het scherm.
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
    return `<tbody class="wr-spec__groep">
        <tr class="wr-spec__kopregel"><th colspan="2">${esc(titel)}</th></tr>
        ${regels.map((r) => `<tr>
            <td>${esc(r.label)}</td>
            <td class="wr-spec__bedrag">${esc(r.value)}</td>
        </tr>`).join('')}
    </tbody>`;
};

/** Een meegestuurde tabel, zoals het maandverloop van de nieuwbouwplanning. */
const tabel = (t) => `<h3>${esc(t.title)}</h3>
    <table class="wr-spec__tabel">
        <thead><tr>${t.columns.map((k) =>
            `<th${k.align === 'right' ? ' class="wr-spec__bedrag"' : ''}>${esc(k.label)}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map((rij) => `<tr>${rij.map((cel, i) =>
            `<td${t.columns[i]?.align === 'right' ? ' class="wr-spec__bedrag"' : ''}>${esc(cel)}</td>`).join('')}</tr>`).join('')}
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
        <header class="wr-spec__kop">
            <p class="wr-spec__merk">BouwdepotCalculator.nl</p>
            <h2>${esc(titel)}</h2>
            <p>Opgesteld op ${datumTekst(rapport.generatedAt)}${rapport.url ? ` &middot; zelf narekenen: ${esc(rapport.url)}` : ''}</p>
        </header>

        <table class="wr-spec__tabel">
            ${groep('Je invoer', rapport.inputs)}
            ${groep('Uitkomst', rapport.results)}
        </table>

        ${(rapport.tables || []).map(tabel).join('')}

        <div class="wr-spec__voet">
            ${alinea('Conclusie', rapport.conclusion)}
            ${alinea('Interpretatie', rapport.interpretation)}
            ${alinea('Aannames', rapport.assumptions)}
            <p>Bedragen zijn door de opsteller zelf ingevuld en niet door
            BouwdepotCalculator.nl geschat of gecontroleerd. Dit is een indicatie
            op basis van publieke productinformatie en geen toezegging; je
            geldverstrekker beoordeelt je eigen situatie.</p>
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
        vlak.className = 'wr-alleen-print wr-afdruk';
        document.body.append(vlak);
    }
    // Het adres zonder de ingevulde waarden: dit papier gaat naar een adviseur.
    const url = `${location.host.replace(/^www\./, '')}${location.pathname}`;
    vlak.innerHTML = bouwAfdrukdocument({ ...rapport, url });

    // De klasse verbergt de pagina zelf tijdens het printen. Alleen tijdens:
    // wie later Ctrl+P drukt zonder op de knop te klikken hoort gewoon het
    // scherm te krijgen, niet een oud document dat nog in de body hangt.
    const oudeTitel = document.title;
    document.body.classList.add('is-afdrukken');
    if (bestandsnaam) document.title = bestandsnaam;

    const opruimen = () => {
        document.body.classList.remove('is-afdrukken');
        document.title = oudeTitel;
        window.removeEventListener('afterprint', opruimen);
    };
    window.addEventListener('afterprint', opruimen);

    window.print();
    // Niet elke browser stuurt afterprint; na een tel alsnog opruimen.
    setTimeout(opruimen, 1000);
}
