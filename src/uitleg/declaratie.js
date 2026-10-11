/**
 * Licht op de declaratiegids de gekozen geldverstrekker uit.
 *
 * De pagina zet per afwijzingsreden de eisen van alle aanbieders onder elkaar.
 * Wie een afgewezen declaratie heeft, wil alleen weten wat zijn eigen bank
 * eist. Kiest de bezoeker een geldverstrekker (src/js/bankkeuze.js, dezelfde
 * keuze als op de rest van de site), dan komt die rij in elke lijst bovenaan
 * te staan. Publiceert de bank bij een reden niets, dan staat dat er in
 * woorden bij: geen rij is iets anders dan geen eis.
 *
 * Zonder keuze of zonder dit script staat de hele pagina er gewoon; er wordt
 * niets verborgen.
 */

import { opBankwissel } from '../js/bankkeuze.js';

opBankwissel((bank) => {
    for (const lijst of document.querySelectorAll('[data-perbank]')) {
        let gevonden = false;
        for (const rij of lijst.children) {
            const mijn = Boolean(bank) && rij.dataset.bank === bank.id;
            rij.classList.toggle('is-mijn', mijn);
            gevonden ||= mijn;
        }

        // De melding staat bij de lijst: in de tekst ernaast, of er vlak voor.
        const melding = lijst.parentElement.querySelector('[data-mijn]');
        if (!melding) continue;
        melding.hidden = !bank || gevonden;
        if (bank && !gevonden) {
            melding.textContent = `${bank.naam} publiceert hierover niets. Dat betekent niet dat het daar geen rol speelt; vraag het na.`;
        }
    }
});
