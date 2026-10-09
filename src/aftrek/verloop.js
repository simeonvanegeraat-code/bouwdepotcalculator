/**
 * Het verloop van de aftrek over de jaren, als rij staven met diepte in SVG.
 *
 * Per jaar één kolom: onderaan wat je netto betaalt, daarboven wat je
 * terugkrijgt. Samen de bruto maandlast. Naarmate je aflost wordt de bovenste
 * laag dunner; dat is het hele verhaal van deze pagina.
 *
 * Deze module rekent niets uit. Ze tekent de jaarregels die ze krijgt, dezelfde
 * waar de tabel zijn cijfers uit haalt. De voorkant van elke staaf is een
 * gewone rechthoek op de as, dus de hoogte is exact af te lezen; de zijkant en
 * de bovenkant zijn alleen diepte.
 *
 * Beweging: de kolommen komen van links naar rechts op, daarna loopt het
 * gekozen jaar één keer van het eerste naar het laatste. Wie de schuif of een
 * kolom aanraakt neemt het over. Bij verminderde beweging staat alles er
 * meteen.
 */

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const r1 = (n) => n.toFixed(1);
const klem = (n) => Math.min(1, Math.max(0, n));
const zacht = (t) => 1 - (1 - t) ** 3;

function asMaximum(hoogste) {
    const stap = hoogste > 8000 ? 2000 : hoogste > 4000 ? 1000 : hoogste > 1000 ? 500 : hoogste > 400 ? 200 : hoogste > 100 ? 50 : 20;
    return Math.max(stap, Math.ceil(hoogste / stap) * stap);
}

/**
 * @param {HTMLElement} houder
 * @param {object} opties
 * @param {(jaar:number) => void} opties.opKies   de bezoeker wijst een jaar aan
 * @param {(speelt:boolean) => void} [opties.opStand]  de animatie begint of stopt
 */
export function maakVerloop(houder, { opKies, opStand = () => {} }) {
    const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let regels = [];        // { jaar, netto, voordeel, bruto } per maand
    let omschrijving = '';
    let gekozen = 1;
    let groei = 1;          // 0..1: hoe ver de kolommen zijn opgekomen
    let lus = 0;

    function teken() {
        if (!regels.length) { houder.innerHTML = ''; return; }
        const breedte = Math.max(280, Math.round(houder.clientWidth || 640));
        const smal = breedte < 480;
        const hoogte = smal ? 260 : 330;
        const n = regels.length;
        const m = { links: smal ? 44 : 56, rechts: 14, boven: 22, onder: 28 };
        const vlakB = breedte - m.links - m.rechts;
        const vlakH = hoogte - m.boven - m.onder;
        const stap = vlakB / n;
        const staafB = Math.max(3, stap * 0.6);
        const dx = Math.min(10, stap * 0.36), dy = dx * 0.62;

        const max = asMaximum(Math.max(...regels.map((r) => Math.max(r.bruto, r.netto))));
        const y = (bedrag) => m.boven + vlakH - (bedrag / max) * vlakH;
        let svg = '';

        for (const deel of [0, 0.5, 1]) {
            const b = max * deel;
            svg += `<line class="wr-g-raster" x1="${m.links}" x2="${breedte - m.rechts}" y1="${r1(y(b))}" y2="${r1(y(b))}"/>`;
            svg += `<text class="wr-g-as" x="${m.links - 8}" y="${r1(y(b) + 4)}" text-anchor="end">${euro.format(b)}</text>`;
        }

        // Een blok met voorkant, zijkant en eventueel een bovenkant.
        const blok = (x, van, tot, soort, metDak) => {
            if (tot - van < 0.01) return '';
            const yb = y(van), yt = y(tot), xr = x + staafB;
            let s = `<rect class="wr-v-${soort}" x="${r1(x)}" y="${r1(yt)}" width="${r1(staafB)}" height="${r1(yb - yt)}"/>`;
            s += `<polygon class="wr-v-${soort} wr-v--zij" points="${r1(xr)},${r1(yt)} ${r1(xr + dx)},${r1(yt - dy)} ${r1(xr + dx)},${r1(yb - dy)} ${r1(xr)},${r1(yb)}"/>`;
            if (metDak) s += `<polygon class="wr-v-${soort} wr-v--dak" points="${r1(x)},${r1(yt)} ${r1(x + dx)},${r1(yt - dy)} ${r1(xr + dx)},${r1(yt - dy)} ${r1(xr)},${r1(yt)}"/>`;
            return s;
        };

        regels.forEach((r, i) => {
            const g = zacht(klem((groei * (n + 8) - i) / 8));
            const x = m.links + i * stap + (stap - staafB) / 2;
            // Normaal: netto onder, het voordeel erboven. Betaal je per saldo
            // belasting over je woning, dan steekt netto boven bruto uit.
            const onder = Math.min(r.netto, r.bruto) * g;
            const boven = Math.max(r.netto, r.bruto) * g;
            const soortBoven = r.voordeel >= 0 ? 'terug' : 'bij';
            svg += `<g class="wr-v-kolom${r.jaar === gekozen ? ' is-gekozen' : ''}"><title>Jaar ${r.jaar}: netto ${euro.format(r.netto)} per maand</title>`
                + blok(x, 0, onder, 'netto', boven - onder < 0.01)
                + blok(x, onder, boven, soortBoven, true)
                + '</g>';
            // Het gekozen jaar krijgt ook een streep onder de as: niet alleen
            // een verschil in helderheid, want dat ziet niet iedereen.
            if (r.jaar === gekozen) svg += `<rect class="wr-v-merk" x="${r1(x - 1)}" y="${r1(y(0) + 2)}" width="${r1(staafB + 2)}" height="3"/>`;
            // Het raakvlak is de hele kolomhoogte, niet alleen de staaf.
            svg += `<rect class="wr-v-raak" data-jaar="${r.jaar}" x="${r1(m.links + i * stap)}" y="${m.boven - 10}" width="${r1(stap)}" height="${r1(vlakH + 10)}"/>`;
        });

        const elke = n > 20 ? 5 : n > 10 ? 2 : 1;
        regels.forEach((r, i) => {
            if (r.jaar !== 1 && r.jaar % elke !== 0) return;
            svg += `<text class="wr-g-as" x="${r1(m.links + i * stap + stap / 2)}" y="${hoogte - 9}" text-anchor="middle">${r.jaar}</text>`;
        });
        svg += `<text class="wr-g-as" x="${m.links - 8}" y="${hoogte - 9}" text-anchor="end">jaar</text>`;

        houder.innerHTML = `<svg viewBox="0 0 ${breedte} ${hoogte}" width="${breedte}" height="${hoogte}" role="img" aria-label="${omschrijving.replace(/"/g, '&quot;')}">${svg}</svg>`;
    }

    function stop() {
        if (!lus) return;
        cancelAnimationFrame(lus);
        lus = 0;
        groei = 1;
        teken();
        opStand(false);
    }

    /** Laat de kolommen opkomen en loopt daarna één keer door de jaren. */
    function speel() {
        if (stil || !regels.length) return;
        stop();
        const n = regels.length;
        const opkomst = 1500, perJaar = Math.max(120, 5200 / n), rust = 500;
        const start = performance.now();
        opStand(true);
        const stapje = (nu) => {
            const t = nu - start;
            groei = klem(t / opkomst);
            const jaar = t < opkomst + rust ? 1 : Math.min(n, 1 + Math.floor((t - opkomst - rust) / perJaar));
            if (jaar !== gekozen) { gekozen = jaar; opKies(jaar); }
            teken();
            if (t < opkomst + rust + n * perJaar + 900) { lus = requestAnimationFrame(stapje); return; }
            lus = 0;
            gekozen = 1;
            opKies(1);
            teken();
            opStand(false);
        };
        groei = 0;
        lus = requestAnimationFrame(stapje);
    }

    houder.addEventListener('click', (e) => {
        const jaar = Number(e.target.closest?.('[data-jaar]')?.dataset.jaar);
        if (!jaar) return;
        stop();
        gekozen = jaar;
        teken();
        opKies(jaar);
    });

    return {
        /** Nieuwe cijfers: opnieuw tekenen, zonder de animatie te herhalen. */
        zet(nieuweRegels, tekst) {
            const bezig = lus !== 0;
            regels = nieuweRegels;
            omschrijving = tekst;
            if (gekozen > regels.length) gekozen = 1;
            if (bezig) stop(); else teken();
        },
        kies(jaar) { stop(); gekozen = jaar; teken(); },
        leeg() { stop(); regels = []; teken(); },
        teken,
        speel,
        stop,
        get speelt() { return lus !== 0; },
        get kanBewegen() { return !stil; },
    };
}
