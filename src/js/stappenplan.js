/**
 * Voortgang van de dossiercheck op het stappenplan.
 *
 * Stond eerder als inline scriptblok in stappenplan.html. Logica ongewijzigd;
 * de voortgang blijft in localStorage op het apparaat van de bezoeker en gaat
 * nergens heen.
 */

const KEY = 'bouwdepot-stappenplan-v1';

const checks = Array.from(document.querySelectorAll('[data-plan-check]'));

if (checks.length) {
    const text = document.getElementById('plan-progress-text');
    const percent = document.getElementById('plan-progress-percent');
    const bar = document.getElementById('plan-progress-bar');
    const track = document.querySelector('.plan-progress-track');

    const save = () => {
        try {
            const done = checks.filter((box) => box.checked).map((box) => box.dataset.planCheck);
            localStorage.setItem(KEY, JSON.stringify(done));
        } catch (_) {
            // Privémodus of geblokkeerde opslag: voortgang gaat dan niet mee, verder niets aan de hand.
        }
    };

    const render = () => {
        const done = checks.filter((box) => box.checked).length;
        const value = checks.length ? Math.round((done / checks.length) * 100) : 0;
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
