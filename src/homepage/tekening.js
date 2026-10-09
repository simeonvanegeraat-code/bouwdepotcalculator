/**
 * De lijntekeningen bovenaan de homepage.
 *
 * Twee woningen als bouwtekening: wat er staat is een doorgetrokken lijn, wat
 * gepland is een streeplijn. Maatlijnen meten niet in meters maar in euro's.
 *
 * Dit bestand kent geen DOM. `geometrie` rekent de schermcoordinaten uit en
 * `svgInhoud` maakt er eenmalig SVG van; daarna zet woningen.js per
 * beeld alleen nog de coordinaten. Dezelfde functies leveren het stilstaande
 * beeld dat in de HTML staat voor wie geen JavaScript of beweging wil.
 */

import { camera, doos, zadeldak } from './iso.js';

const SCHAAL = 38;
const OX = 300;
const OY = 300;

const kavel = (x0, z0, x1, z1) => ({ punten: [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], randen: [[0, 1], [1, 2], [2, 3], [3, 0]], vlakken: [] });
const vloerlijn = (x0, z0, x1, z1, y) => ({ punten: [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], randen: [[0, 1], [1, 2], [2, 3], [3, 0]], vlakken: [] });

export const MODELLEN = {
    nieuw: {
        delen: [
            { vorm: kavel(-4.6, -3.8, 4.6, 3.8), soort: 'grond' },
            { vorm: doos(-3.15, 0, -2.45, 3.15, 0.3, 2.45), soort: 'staat' },
            { vorm: doos(-3, 0.3, -2.3, 3, 3.2, 2.3), soort: 'plan' },
            { vorm: vloerlijn(-3, -2.3, 3, 2.3, 1.8), soort: 'plan' },
            { vorm: zadeldak(-3.2, 3.2, 3.2, 4.9, -2.55, 2.55), soort: 'plan' },
        ],
        maten: [
            { van: [-4.1, 0, 2.3], tot: [-4.1, 4.9, 2.3], tekst: 'aanneemsom € 350.000', anker: 'middle', dx: -9, dy: 0, langs: true },
            { van: [-4.6, 0, 4.6], tot: [4.6, 0, 4.6], tekst: 'grond € 150.000', anker: 'middle', dx: 0, dy: 20 },
        ],
    },
    verbouw: {
        delen: [
            { vorm: kavel(-4.8, -3.8, 5.4, 3.8), soort: 'grond' },
            { vorm: doos(-3.8, 0, -2.3, 1.8, 3, 2.3), soort: 'staat' },
            { vorm: zadeldak(-4, 2, 3, 4.7, -2.55, 2.55), soort: 'staat' },
            { vorm: doos(1.8, 0, -1.1, 4.6, 1.75, 2.3), soort: 'plan' },
        ],
        maten: [
            { van: [1.8, 0, 3.2], tot: [4.6, 0, 3.2], tekst: 'aanbouw € 60.000', anker: 'middle', dx: 6, dy: 20 },
        ],
    },
};

const BASIS = { yaw: 35, pitch: 28 };

/** Alle te tekenen onderdelen, in vaste volgorde, met hun schermcoordinaten. */
export function geometrie(model, yaw = BASIS.yaw, pitch = BASIS.pitch) {
    const cam = camera(yaw, pitch, SCHAAL);
    const kijk = camera(BASIS.yaw, BASIS.pitch, 1);
    const naar = (p) => { const [x, y] = cam(p); return [OX + x, OY + y]; };
    const r = (n) => n.toFixed(1);

    const vlakken = [];
    const lijnen = [];

    for (const deel of model.delen) {
        const { punten, randen, vlakken: zijden } = deel.vorm;
        // Alleen de vlakken die bij de beginstand naar de kijker wijzen krijgen
        // een vulling. De volgorde ligt daarmee vast; bij het kleine bereik
        // waarover de tekening draait klapt geen vlak om.
        for (const zijde of zijden) {
            if (kijk(zijde.n)[2] <= 0.001) continue;
            const diepte = zijde.p.reduce((s, i) => s + kijk(punten[i])[2], 0) / zijde.p.length;
            vlakken.push({ t: 'polygon', k: `hp-vlak hp-vlak--${deel.soort}`, diepte, pts: zijde.p.map((i) => naar(punten[i]).map(r).join(',')).join(' ') });
        }
        for (const [a, b] of randen) {
            const [x1, y1] = naar(punten[a]);
            const [x2, y2] = naar(punten[b]);
            const attrs = { x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2) };
            lijnen.push({ t: 'line', k: `hp-l hp-l--${deel.soort}`, attrs });
            if (deel.soort === 'plan') {
                // De "gebouwde" lijn ligt over de streeplijn en wordt van onder
                // naar boven getrokken: hoe hoger de rand, hoe later. De
                // waarde gaat twee keer mee: als vertraging in seconden voor
                // de muis, en kaal voor het meebouwen met de scrollpositie.
                const hoogte = (punten[a][1] + punten[b][1]) / 2;
                lijnen.push({ t: 'line', k: 'hp-l hp-l--bouw', attrs, lengte: true, vertraging: (hoogte / 5).toFixed(2) });
            }
        }
    }
    vlakken.sort((a, b) => a.diepte - b.diepte);

    const maten = [];
    for (const m of model.maten) {
        const [x1, y1] = naar(m.van);
        const [x2, y2] = naar(m.tot);
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const nx = (-(y2 - y1) / len) * 5, ny = ((x2 - x1) / len) * 5;
        maten.push({ t: 'line', k: 'hp-maat', attrs: { x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2) } });
        maten.push({ t: 'line', k: 'hp-maat', attrs: { x1: r(x1 - nx), y1: r(y1 - ny), x2: r(x1 + nx), y2: r(y1 + ny) } });
        maten.push({ t: 'line', k: 'hp-maat', attrs: { x1: r(x2 - nx), y1: r(y2 - ny), x2: r(x2 + nx), y2: r(y2 + ny) } });
        // Een staande maat krijgt zijn tekst langs de lijn, van onder naar
        // boven te lezen. Boven de lijn liep hij door het dak heen.
        const tx = (x1 + x2) / 2 + m.dx, ty = (y1 + y2) / 2 + m.dy;
        const attrs = { x: r(tx), y: r(ty), 'text-anchor': m.anker };
        if (m.langs) attrs.transform = `rotate(-90 ${r(tx)} ${r(ty)})`;
        maten.push({ t: 'text', k: 'hp-maattekst', attrs, tekst: m.tekst });
    }

    return [...vlakken, ...lijnen, ...maten];
}

/** De SVG-inhoud voor de eerste weergave. */
export function svgInhoud(onderdelen) {
    return onderdelen.map((o) => {
        const attrs = Object.entries(o.attrs ?? { points: o.pts }).map(([k, v]) => `${k}="${v}"`).join(' ');
        const extra = (o.lengte ? ' pathLength="1"' : '') + (o.vertraging ? ` style="--d:${o.vertraging}s;--dn:${o.vertraging}"` : '');
        if (o.t === 'text') return `<text class="${o.k}" ${attrs}>${o.tekst}</text>`;
        return `<${o.t} class="${o.k}" ${attrs}${extra}/>`;
    }).join('');
}

/** Zet de coordinaten van een al getekende SVG opnieuw. */
export function werkBij(svg, onderdelen) {
    const kinderen = svg.children;
    for (let i = 0; i < onderdelen.length; i++) {
        const o = onderdelen[i];
        const el = kinderen[i];
        if (!el) return;
        if (o.t === 'polygon') el.setAttribute('points', o.pts);
        else for (const k in o.attrs) if (k !== 'text-anchor') el.setAttribute(k, o.attrs[k]);
    }
}
