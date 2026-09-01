/**
 * De zwevende balk die het bedrag in beeld houdt terwijl de bezoeker invult.
 *
 * De harde mobiele eis is dat invoer en uitkomst samen in beeld staan. Op 375px
 * lukt dat op geen enkele rekenpagina letterlijk: het uitkomstblok van
 * maandlasten-bouwdepot eindigt op 978px, ruim voorbij de vouw. De balk lost dat
 * op door het bedrag mee te nemen naar beneden.
 *
 * Hij stond alleen op de homepage, met eigen HTML en eigen bijwerkcode in
 * main.js. Deze module leest in plaats daarvan de uitkomstkaart zelf uit, zodat
 * elke pagina met een `.bs-blad` hem krijgt zonder eigen markup of eigen
 * regel code. Wat er in de kaart verandert, verandert mee.
 *
 * Nieuw ten opzichte van de homepageversie: hij verschijnt pas als de kaart uit
 * beeld is. Altijd zichtbaar kostte 66px onderaan het scherm, en juist op de
 * homepage was daar maar 25px speling; hij dekte er de voettekst af en at van de
 * ruimte die de uitkomst nodig had.
 */

/** De kop boven het bedrag is voor een pil te lang zodra er een toelichting
 *  achter een komma staat: "Bruto maandlast, eerste maand". Het deel ervoor is
 *  de naam, het deel erna de precisering. */
export const kortLabel = (tekst) => String(tekst || '').split(',')[0].trim();

/** Een balk met "—" of "€ 0" erin vertelt niets. Zolang er geen uitkomst is
 *  hoort hij weg te blijven; de depotplanner opent bijvoorbeeld met een streepje
 *  totdat er een geldverstrekker is gekozen. */
export function heeftUitkomst(tekst) {
    const kaal = String(tekst || '').replace(/\s/g, '');
    if (kaal === '' || kaal === '—' || kaal === '-') return false;
    return !/^[€]?-?0([.,]0+)?$/.test(kaal);
}

function bouwBalk() {
    const balk = document.createElement('div');
    balk.className = 'bs-stickybalk';
    balk.id = 'bs-stickybalk';
    balk.setAttribute('role', 'status');
    balk.setAttribute('aria-live', 'polite');
    balk.innerHTML = '<span class="bs-stickybalk__label"></span>'
        + '<span class="bs-stickybalk__bedrag tnum"></span>'
        + '<span class="bs-stickybalk__pijl" aria-hidden="true">&uarr;</span>';
    return balk;
}

function start() {
    const kaart = document.querySelector('.bs-blad');
    if (!kaart) return;

    const label = kaart.querySelector('.bs-antwoord__label');
    const bedrag = kaart.querySelector('.bs-antwoord__bedrag');
    if (!label || !bedrag) return;

    // Een pagina die de balk al in de HTML had, krijgt er geen tweede bij.
    if (document.getElementById('bs-stickybalk')) return;

    const balk = bouwBalk();
    document.body.append(balk);

    const balkLabel = balk.querySelector('.bs-stickybalk__label');
    const balkBedrag = balk.querySelector('.bs-stickybalk__bedrag');

    let uitBeeld = kaart.getBoundingClientRect().bottom <= 0;

    const werkBij = () => {
        balkLabel.textContent = kortLabel(label.textContent);
        balkBedrag.textContent = bedrag.textContent.trim();
        balk.classList.toggle('is-zichtbaar', uitBeeld && heeftUitkomst(balkBedrag.textContent));
    };

    // De beginstand meteen zetten in plaats van op de eerste melding van de
    // waarnemer wachten; die komt pas op de volgende frame.
    werkBij();

    // De calculators schrijven rechtstreeks in de kaart. Meekijken scheelt een
    // aanroep per pagina en houdt de balk vanzelf gelijk.
    new MutationObserver(werkBij).observe(kaart, {
        characterData: true,
        childList: true,
        subtree: true,
    });

    new IntersectionObserver(([invoer]) => {
        uitBeeld = !invoer.isIntersecting;
        werkBij();
    }, { threshold: 0 }).observe(kaart);

    balk.addEventListener('click', () => {
        kaart.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// Alleen in de browser starten; de twee regels hierboven zijn los te toetsen
// en worden door tests/stickybalk.test.mjs bewaakt.
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
}
