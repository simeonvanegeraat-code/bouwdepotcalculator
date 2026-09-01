/**
 * Voortgang voor afvinkbare lijsten (stappenplan, advieschecklist).
 *
 * De pagina bepaalt zelf onder welke sleutel wordt opgeslagen, zodat twee
 * lijsten elkaar niet overschrijven:
 *
 *   <div data-checklist="bouwdepot-stappenplan-v1"> ... </div>
 *
 * Alles blijft in localStorage op het apparaat van de bezoeker en gaat nergens
 * heen. Werkt de opslag niet, bijvoorbeeld in privémodus, dan blijft de lijst
 * gewoon bruikbaar; alleen het onthouden vervalt.
 */

const container = document.querySelector('[data-checklist]');
const checks = container ? Array.from(container.querySelectorAll('[data-plan-check]')) : [];

if (checks.length) {
    const KEY = container.dataset.checklist;

    const text = document.getElementById('plan-progress-text');
    const percent = document.getElementById('plan-progress-percent');
    const bar = document.getElementById('plan-progress-bar');
    const track = document.querySelector('.bs-spoor');

    const save = () => {
        try {
            const done = checks.filter((box) => box.checked).map((box) => box.dataset.planCheck);
            localStorage.setItem(KEY, JSON.stringify(done));
        } catch (_) {}
    };

    const render = () => {
        const done = checks.filter((box) => box.checked).length;
        const value = Math.round((done / checks.length) * 100);
        if (text) text.textContent = `${done} van ${checks.length} punten afgerond`;
        if (percent) percent.textContent = `${value}%`;
        if (bar) bar.style.width = `${value}%`;
        if (track) {
            track.setAttribute('aria-valuemax', String(checks.length));
            track.setAttribute('aria-valuenow', String(done));
        }
    };

    try {
        const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
        checks.forEach((box) => { box.checked = saved.includes(box.dataset.planCheck); });
    } catch (_) {}

    checks.forEach((box) => box.addEventListener('change', () => { save(); render(); }));

    document.getElementById('plan-reset')?.addEventListener('click', () => {
        checks.forEach((box) => { box.checked = false; });
        try { localStorage.removeItem(KEY); } catch (_) {}
        render();
    });

    document.getElementById('plan-print')?.addEventListener('click', () => window.print());

    render();
}
