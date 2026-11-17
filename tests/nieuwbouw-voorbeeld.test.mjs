/**
 * Bewaakt het doorgerekende voorbeeld op nieuwbouw.html.
 *
 * De tekst, de uitgewerkte maand en de tabel staan in de HTML zelf, zodat ze er
 * ook zonder JavaScript zijn en een zoekmachine ze leest zonder iets in te
 * vullen. Ze zijn dus met de hand ingevuld en kunnen stil gaan afwijken van
 * src/domain/nieuwbouw.js zodra iemand een aanname of formule aanpast. Deze
 * test faalt dan op het bedrag dat niet meer klopt.
 *
 * De verwachte uitkomsten staan hier bovendien los uitgerekend, zonder het
 * model: een model dat zichzelf controleert, controleert niets.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { berekenTijdlijn, standaardTermijnen, STANDAARD } from '../src/domain/nieuwbouw.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'nieuwbouw.html'), 'utf8');
const sectie = html.match(/<section[^>]*id="voorbeeld"[\s\S]*?<\/section>/)?.[0] ?? '';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
// Maakt "&euro;&nbsp;3.530" en "€ 3.530" (met harde spatie) vergelijkbaar.
const plat = (s) => s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&euro;/g, '€').replace(/&minus;/g, '−').replace(/&shy;/g, '').replace(/&iuml;/g, 'ï').replace(/&nbsp;| /g, ' ')
    .replace(/\s+/g, ' ').trim();
const bedrag = (n) => plat(euro.format(n));

const t = berekenTijdlijn();
const regel = (maand) => t.regels.find((r) => r.maand === maand);

test('de sectie staat op de pagina', () => {
    assert.ok(sectie, 'de sectie met id="voorbeeld" ontbreekt');
});

test('het model geeft de met de hand nagerekende uitkomsten', () => {
    // Annuïteit over € 500.000, 3,80%, 360 maanden:
    //   i = 0,038 / 12; T = 500000 * i / (1 - (1 + i)^-360) = € 2.329,79
    const i = 0.038 / 12;
    const T = 500000 * i / (1 - (1 + i) ** -360);
    assert.ok(Math.abs(T - 2329.79) < 0.01);
    assert.equal(t.lening, 500000);
    assert.ok(Math.abs(t.maandlastDaarna - T) < 0.01, `annuiteit is ${t.maandlastDaarna}`);

    // Bouwmaand 1: depot van 350.000 naar 297.500 (15% van 350.000 = 52.500), gemiddeld 323.750.
    //   vergoeding = 323750 * i = 1.025,21; hypotheek = 2.329,79 - 1.025,21 = 1.304,58; plus 1.200 huur
    const m1 = regel(1);
    assert.ok(Math.abs(m1.vergoeding - 1025.21) < 0.01, `vergoeding maand 1 is ${m1.vergoeding}`);
    assert.ok(Math.abs(m1.hypotheek - 1304.58) < 0.01, `hypotheek maand 1 is ${m1.hypotheek}`);
    assert.ok(Math.abs(m1.totaal - 2504.58) < 0.01, `maand 1 is ${m1.totaal}`);

    // Maand 13: depot leeg, geen vergoeding, huur loopt nog door: 2.329,79 + 1.200.
    assert.equal(t.piek.maand, 13);
    assert.ok(Math.abs(t.piek.totaal - 3529.79) < 0.01, `de piek is ${t.piek.totaal}`);

    // Rente over de twaalf bouwmaanden = 12 termijnen min wat er is afgelost.
    //   restschuld na 12 maanden = P(1+i)^12 - T((1+i)^12 - 1)/i
    const rest = 500000 * (1 + i) ** 12 - T * ((1 + i) ** 12 - 1) / i;
    const rente = 12 * T - (500000 - rest);
    assert.ok(Math.abs(t.sommen.renteTijdensBouw - rente) < 0.01, `rente tijdens de bouw is ${t.sommen.renteTijdensBouw}`);

    // Vergoeding = i maal de som van de gemiddelde depotsaldi per maand.
    const gemiddeld = [323750, 297500, 262500, 227500, 227500, 192500, 157500, 157500, 113750, 70000, 70000, 35000];
    const vergoeding = gemiddeld.reduce((s, x) => s + x, 0) * i;
    assert.ok(Math.abs(t.sommen.vergoeding - vergoeding) < 0.01, `vergoeding tijdens de bouw is ${t.sommen.vergoeding}`);
});

test('de losse bedragen in de sectie komen uit het model', () => {
    const verwacht = {
        piek: t.piek.totaal,
        betaling: regel(1).betaling,
        vergoeding: regel(1).vergoeding,
        hypotheek: regel(1).hypotheek,
        huur: regel(1).woonlast,
        start: regel(1).totaal,
        rente: t.sommen.renteTijdensBouw,
        vergoedingtotaal: t.sommen.vergoeding,
    };
    const gevonden = [...sectie.matchAll(/data-vb="([a-z]+)"[^>]*>([^<]*)</g)];
    for (const [, naam, tekst] of gevonden) {
        assert.ok(naam in verwacht, `onbekend bedrag "${naam}" in het voorbeeld`);
        assert.equal(plat(tekst), bedrag(verwacht[naam]), `het bedrag "${naam}" in het voorbeeld`);
    }
    for (const naam of Object.keys(verwacht)) {
        assert.ok(gevonden.some(([, n]) => n === naam), `het bedrag "${naam}" staat niet meer in het voorbeeld`);
    }
});

test('de uitgewerkte maand telt op zoals hij er staat', () => {
    // Wie de afgeronde bedragen narekent, moet op hetzelfde uitkomen.
    const r = (n) => Math.round(n);
    const m1 = regel(1);
    assert.equal(r(m1.betaling) - r(m1.vergoeding), r(m1.hypotheek));
    assert.equal(r(m1.hypotheek) + r(m1.woonlast), r(m1.totaal));

    const som = plat(sectie.match(/<dl[^>]*data-vb-som>([\s\S]*?)<\/dl>/)[1]);
    assert.ok(som.includes(`hele lening van ${bedrag(t.lening)}`), 'de lening');
    assert.ok(som.includes(`gemiddeld ${bedrag((t.depotBijStart + m1.depot) / 2)} in depot`), 'het gemiddelde depot');
    assert.ok(som.includes(`${String(STANDAARD.rentePercent).replace('.', ',')}% over`), 'de rente');

    const tekst = plat(sectie);
    assert.ok(tekst.includes(`eerste termijn van ${bedrag(m1.termijnbedrag)} het depot in die maand van ${bedrag(t.depotBijStart)} naar ${bedrag(m1.depot)}`), 'de eerste termijn');
});

test('de tabel is regel voor regel het model', () => {
    const body = sectie.match(/<tbody data-vb-tabel>([\s\S]*?)<\/tbody>/);
    assert.ok(body, 'de tabel ontbreekt');
    const rijen = [...body[1].matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/g)];
    const cellen = rijen.map((m) => [...m[2].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => plat(c[1])));

    const wat = (r) => {
        if (r.termijn) return ` ${r.termijn}, ${bedrag(r.termijnbedrag)}`;
        if (r.fase === 'overlap') return r === t.piek ? ' Huur loopt nog door, hoogste maand' : ' Huur loopt nog door';
        if (r.fase === 'na') return ' Alleen de nieuwe hypotheek';
        return '';
    };
    const verwacht = t.regels.map((r) => [`${r.maand}${wat(r)}`, bedrag(r.depot), bedrag(r.vergoeding), bedrag(r.totaal)]);
    assert.deepEqual(cellen, verwacht);

    // De gemarkeerde rij is de hoogste maand van het model.
    const piekrij = rijen.findIndex((m) => /class="is-piek"/.test(m[1]));
    assert.equal(t.regels[piekrij], t.piek);
});

test('de aannames onder het voorbeeld zijn die van het model', () => {
    const lead = plat(sectie.match(/<p class="wr-lead">([\s\S]*?)<\/p>/)[1]);
    assert.ok(lead.includes(`Grond van ${bedrag(STANDAARD.grond)}`), 'grond');
    assert.ok(lead.includes(`aanneemsom van ${bedrag(STANDAARD.aanneemsom)}`), 'aanneemsom');
    assert.equal(STANDAARD.eigenGeld, 0, 'de tekst zegt "helemaal geleend"');
    assert.ok(lead.includes(`${String(STANDAARD.rentePercent).replace('.', ',')}%`), 'rente');
    assert.equal(STANDAARD.bouwduurMaanden, 12, 'de tekst zegt "twaalf maanden bouw"');
    assert.ok(lead.includes(`${bedrag(STANDAARD.huidigeWoonlast)} huur`), 'huur');

    const noot = plat(sectie.match(/<p class="wr-voorbehoud" data-vb-aannames>([\s\S]*?)<\/p>/)[1]);
    assert.ok(noot.includes(`${STANDAARD.looptijdJaren} jaar annuïtair`) && STANDAARD.vorm === 'annuiteit', 'looptijd en vorm');
    const procenten = standaardTermijnen(STANDAARD.bouwduurMaanden).map((x) => x.percent);
    assert.ok(noot.includes(`vijf termijnen (${procenten.slice(0, -1).join(', ')} en ${procenten.at(-1)}% van de aanneemsom)`), 'termijnschema');
    assert.equal(procenten.length, 5);
    assert.equal(STANDAARD.kortingDepotPercent, 0, 'de tekst zegt "gelijk aan de hypotheekrente"');
    assert.equal(STANDAARD.overlapNaOplevering, 2, 'de tabel laat de huur twee maanden doorlopen');
});

test('"Pas dit voorbeeld aan" opent dezelfde cijfers in de rekentool', () => {
    // De knop gebruikt VOORBEELD uit src/nieuwbouw/stappen.js. Dat bestand
    // werkt met de DOM en is hier niet te importeren; daarom de tekst.
    const bron = fs.readFileSync(path.join(ROOT, 'src/nieuwbouw/stappen.js'), 'utf8');
    const v = Object.fromEntries([...bron.match(/const VOORBEELD = \{([^}]*)\}/)[1].matchAll(/(\w+): '?([\w.]+)'?/g)].map(([, k, w]) => [k, w]));
    assert.equal(Number(v.von), STANDAARD.grond + STANDAARD.aanneemsom);
    assert.equal(Number(v.grond), STANDAARD.grond);
    assert.equal(Number(v.meerwerk), 0);
    assert.equal(Number(v.eigen), STANDAARD.eigenGeld);
    assert.equal(Number(v.rente), STANDAARD.rentePercent);
    assert.equal(v.vorm, STANDAARD.vorm);
    assert.equal(Number(v.maanden), STANDAARD.bouwduurMaanden);
    assert.equal(Number(v.woonlast), STANDAARD.huidigeWoonlast);
    assert.equal(Number(v.overlap), STANDAARD.overlapNaOplevering);
    assert.ok(/data-nb-voorbeeld/.test(sectie), 'de knop staat in het voorbeeld');
});

test('het voorbeeld is zichtbaar zolang er geen eigen overzicht staat', () => {
    // Alleen op het overzicht met eigen cijfers mag het weg; Google en wie
    // binnenkomt zien het startscherm.
    const css = ['nieuwbouw.css', 'werkruimte.css'].map((f) => fs.readFileSync(path.join(ROOT, 'src/styles/next', f), 'utf8')).join('\n');
    const regels = css.split('\n').filter((r) => r.includes('.nb-vb'));
    assert.deepEqual(regels.map((r) => r.trim()), ['body[data-nb="klaar"] .nb-vb { display: none; }']);
});
