/**
 * Voortgang voor afvinkbare lijsten (stappenplan, advieschecklist).
 *
 * Een pagina kan meerdere lijsten dragen. Elke lijst noemt zijn eigen
 * opslagsleutel, en het voortgangsblok wijst met dezelfde sleutel terug:
 *
 *   <div class="bs-voortgang" data-checklist-voortgang="bouwdepot-stappenplan-v1"> ... </div>
 *   <div class="bs-fasen"     data-checklist="bouwdepot-stappenplan-v1">          ... </div>
 *
 * Die koppeling per sleutel in plaats van per id, omdat de twee blokken niet
 * in elkaar staan: het voortgangsblok hoort bij de kop en de lijst staat een
 * sectie lager. Vaste id's zouden botsen zodra er twee lijsten zijn.
 *
 * Alles blijft in localStorage op het apparaat van de bezoeker en gaat nergens
 * heen. Werkt de opslag niet, bijvoorbeeld in privémodus, dan blijft de lijst
 * gewoon bruikbaar; alleen het onthouden vervalt.
 */

for (const container of document.querySelectorAll('[data-checklist]')) {
    const sleutel = container.dataset.checklist;
    const checks = Array.from(container.querySelectorAll('[data-plan-check]'));
    if (!checks.length) continue;

    const voortgang = document.querySelector(`[data-checklist-voortgang="${sleutel}"]`);
    const tekst = voortgang?.querySelector('[data-checklist-tekst]');
    const percent = voortgang?.querySelector('[data-checklist-percent]');
    const balk = voortgang?.querySelector('[data-checklist-balk]');
    const spoor = voortgang?.querySelector('.bs-spoor');

    const bewaar = () => {
        try {
            const gedaan = checks.filter((vak) => vak.checked).map((vak) => vak.dataset.planCheck);
            localStorage.setItem(sleutel, JSON.stringify(gedaan));
        } catch (_) {}
    };

    const toon = () => {
        const gedaan = checks.filter((vak) => vak.checked).length;
        const waarde = Math.round((gedaan / checks.length) * 100);
        if (tekst) tekst.textContent = `${gedaan} van ${checks.length} punten afgerond`;
        if (percent) percent.textContent = `${waarde}%`;
        if (balk) balk.style.width = `${waarde}%`;
        if (spoor) {
            spoor.setAttribute('aria-valuemax', String(checks.length));
            spoor.setAttribute('aria-valuenow', String(gedaan));
        }
    };

    try {
        const bewaard = JSON.parse(localStorage.getItem(sleutel) || '[]');
        checks.forEach((vak) => { vak.checked = bewaard.includes(vak.dataset.planCheck); });
    } catch (_) {}

    checks.forEach((vak) => vak.addEventListener('change', () => { bewaar(); toon(); }));

    voortgang?.querySelector('[data-checklist-reset]')?.addEventListener('click', () => {
        checks.forEach((vak) => { vak.checked = false; });
        try { localStorage.removeItem(sleutel); } catch (_) {}
        toon();
    });

    // Staan er twee lijsten op de pagina, dan moet "Afdrukken" alleen de eigen
    // lijst meenemen. Het blok krijgt daarom kort een merk mee waar de
    // print-CSS op selecteert; daarna weer weg, zodat het scherm onaangeroerd
    // blijft. Met één lijst verandert er niets.
    voortgang?.querySelector('[data-checklist-print]')?.addEventListener('click', () => {
        const blokken = document.querySelectorAll('[data-checklist-blok]');
        const eigen = Array.from(blokken).filter((blok) => blok.dataset.checklistBlok === sleutel);

        if (blokken.length > eigen.length) {
            document.body.classList.add('bs-print-selectie');
            eigen.forEach((blok) => blok.setAttribute('data-print-mee', ''));
        }

        const opruimen = () => {
            document.body.classList.remove('bs-print-selectie');
            eigen.forEach((blok) => blok.removeAttribute('data-print-mee'));
            window.removeEventListener('afterprint', opruimen);
        };
        window.addEventListener('afterprint', opruimen);

        window.print();
    });

    toon();
}
