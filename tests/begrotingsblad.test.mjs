import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

import { crc32, kolom, maakXlsx, zip, STIJL } from '../src/js/xlsx.js';
import { begrotingsblad, UIT_DEPOT, UIT_EIGEN } from '../src/verbouwen/begrotingsblad.js';
import { berekenBegroting } from '../src/js/begrotingrekenen.js';
import { maandblad } from '../src/nieuwbouw/maandblad.js';
import { berekenTijdlijn, standaardTermijnen, STANDAARD } from '../src/domain/nieuwbouw.js';

const { categorieen } = JSON.parse(readFileSync(new URL('../data/verbouwposten.json', import.meta.url), 'utf8'));
const tekst = (bytes) => new TextDecoder().decode(bytes);

test('de zip is leesbaar: bekende controlegetallen en de juiste opbouw', () => {
    // De standaardwaarde voor CRC-32 over "123456789".
    assert.equal(crc32(new TextEncoder().encode('123456789')), 0xCBF43926);
    const z = zip([{ naam: 'a.txt', tekst: 'hallo' }, { naam: 'map/b.txt', tekst: 'wereld €' }]);
    const blik = new DataView(z.buffer);
    assert.equal(blik.getUint32(0, true), 0x04034B50, 'begint met een lokaal bestand');
    assert.equal(blik.getUint32(z.length - 22, true), 0x06054B50, 'eindigt met het slotrecord');
    assert.equal(blik.getUint16(z.length - 22 + 10, true), 2, 'twee bestanden');
    // Het slotrecord wijst naar de centrale lijst, en die naar het eerste bestand.
    const centraal = blik.getUint32(z.length - 22 + 16, true);
    assert.equal(blik.getUint32(centraal, true), 0x02014B50);
    assert.equal(blik.getUint32(centraal + 42, true), 0);
    assert.ok(tekst(z).includes('wereld €'), 'onverpakt en in UTF-8');
});

test('kolomletters lopen door na Z', () => {
    assert.deepEqual([0, 3, 25, 26, 27, 701, 702].map(kolom), ['A', 'D', 'Z', 'AA', 'AB', 'ZZ', 'AAA']);
});

test('een werkboek bevat de onderdelen die Excel verwacht', () => {
    const x = tekst(maakXlsx({ naam: 'Proef & test', breedtes: [20, 10], rijen: [['Tekst <b>', 12.5], [{ f: 'SUM(B1:B1)', s: STIJL.euro }, null]], vast: 1 }));
    for (const deel of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']) assert.ok(x.includes(deel), deel);
    assert.ok(x.includes('name="Proef &amp; test"'));
    assert.ok(x.includes('<t xml:space="preserve">Tekst &lt;b&gt;</t>'), 'tekst wordt niet als opmaak gelezen');
    assert.ok(x.includes('<c r="B1"><v>12.5</v></c>'));
    assert.ok(x.includes('<c r="A2" s="2"><f>SUM(B1:B1)</f></c>'));
    assert.ok(x.includes('ySplit="1"'));
    assert.ok(x.includes('fullCalcOnLoad="1"'), 'Excel rekent de formules uit bij het openen');
});

/** Rekent de formules van het blad na, zoals Excel dat doet. */
function rekenNa(blad) {
    const rij = (adres) => blad.rijen[Number(adres.slice(1)) - 1];
    const regels = blad.rijen.filter((r) => r.length === 4 && (r[1] === UIT_DEPOT || r[1] === UIT_EIGEN));
    const som = (kolomIndex, waarde) => regels.filter((r) => r[kolomIndex] === waarde).reduce((s, r) => s + (r[3].w ?? 0), 0);
    const depot = som(1, UIT_DEPOT), eigen = som(1, UIT_EIGEN);
    const pct = rij(blad.cellen.reservePct)[3].w;
    const reserve = Math.round(depot * pct);
    return { depot, eigen, reserve, depotMetReserve: depot + reserve, totaal: depot + reserve + eigen, noodzakelijk: som(2, 'Noodzakelijk'), gewenst: som(2, 'Gewenst'), regels };
}

test('het lege template heeft elke post uit de data, zonder bedragen', () => {
    const blad = begrotingsblad(categorieen);
    const namen = blad.rijen.map((r) => (typeof r[0] === 'string' ? r[0] : r[0]?.w));
    for (const c of categorieen) {
        assert.ok(namen.includes(c.naam), c.naam);
        for (const p of c.posten) {
            const regel = blad.rijen.find((r) => r[0] === p.naam);
            assert.ok(regel, p.naam);
            assert.equal(regel[1], p.vastAanWoning ? UIT_DEPOT : UIT_EIGEN, `${p.naam}: betaald uit`);
            assert.equal(regel[3].w, null, 'geen voorgevulde prijs');
        }
    }
    assert.equal(rekenNa(blad).totaal, 0);
});

test('het ingevulde blad komt op dezelfde bedragen uit als de rekentool', () => {
    const posten = { keuken: { bedrag: 18000 }, badkamer: { bedrag: 14500, prioriteit: 'gewenst' }, 'keuken-los': { bedrag: 2500 } };
    const eigen = [{ naam: 'Dakgoot', bedrag: 1234, vast: true }, { naam: 'Bank', bedrag: 900, vast: false, prioriteit: 'gewenst' }];
    const blad = begrotingsblad(categorieen, { posten, eigen, reservePct: 15 });
    const na = rekenNa(blad);

    const alle = categorieen.flatMap((c) => c.posten);
    const kern = berekenBegroting([
        ...Object.entries(posten).map(([id, p]) => ({ bedrag: p.bedrag, vast: alle.find((x) => x.id === id).vastAanWoning, prioriteit: p.prioriteit })),
        ...eigen,
    ], 15);
    assert.equal(na.depot, kern.depot);
    assert.equal(na.reserve, kern.margeBedrag);
    assert.equal(na.depotMetReserve, kern.depotMetMarge);
    assert.equal(na.eigen, kern.eigen);
    assert.equal(na.totaal, kern.totaal);
    assert.equal(na.noodzakelijk, kern.noodzakelijk);
    assert.equal(na.gewenst, kern.gewenst);
    // Met de hand: depot 18.000 + 14.500 + 1.234 = 33.734; 15% is 5.060,10, dus 5.060; eigen 2.500 + 900.
    assert.deepEqual([na.depot, na.reserve, na.eigen, na.totaal], [33734, 5060, 3400, 42194]);
});

test('de formules bestrijken alle regels met een bedrag, ook de lege regels onderaan', () => {
    const blad = begrotingsblad(categorieen, { eigen: [{ naam: 'Dakgoot', bedrag: 1, vast: true }] });
    const regels = blad.rijen.map((r, i) => ({ r, nr: i + 1 })).filter(({ r }) => r.length === 4 && (r[1] === UIT_DEPOT || r[1] === UIT_EIGEN));
    const formule = blad.rijen[Number(blad.cellen.depot.slice(1)) - 1][3].f;
    const [, van, tot] = formule.match(/\$B\$(\d+):\$B\$(\d+)/);
    assert.ok(Number(van) <= regels[0].nr && Number(tot) === regels.at(-1).nr, formule);
    assert.equal(regels.filter(({ r }) => r[0] === '').length, 5, 'vijf lege regels om zelf in te vullen');
    assert.match(blad.rijen[Number(blad.cellen.reserve.slice(1)) - 1][3].f, /^ROUND\(D\d+\*D\d+,0\)$/);
    assert.match(blad.rijen[Number(blad.cellen.totaal.slice(1)) - 1][3].f, /^D\d+\+D\d+$/);
});

test('het template staat klaar om te downloaden en de pagina verwijst ernaar', () => {
    const pad = new URL('../public/downloads/verbouwbegroting-template.xlsx', import.meta.url);
    assert.ok(existsSync(pad), 'gemaakt door scripts/build-begroting.mjs');
    const bytes = readFileSync(pad);
    assert.equal(bytes.readUInt32LE(0), 0x04034B50);
    assert.ok(bytes.toString('utf8').includes('Verbouwbegroting'));
    const html = readFileSync(new URL('../verbouwbegroting.html', import.meta.url), 'utf8');
    assert.ok(html.includes('href="/downloads/verbouwbegroting-template.xlsx"'));
    assert.ok(html.includes('id="begroting-excel"'));
});

test('het maandblad van nieuwbouw toont de maandregels van de rekenkern', () => {
    const t = berekenTijdlijn({ ...STANDAARD, termijnen: standaardTermijnen(STANDAARD.bouwduurMaanden) });
    const columns = [
        { key: 'maand', label: 'Mnd', type: 'text' }, { key: 'depot', label: 'Depot eind maand', type: 'currency' },
        { key: 'hypotheek', label: 'Hypotheek na vergoeding', type: 'currency' }, { key: 'totaal', label: 'Bruto totaal', type: 'currency' },
    ];
    const blad = maandblad({ tabel: { columns, rows: t.regels }, toelichting: 'Indicatief.' }, [['Koopsom v.o.n.', '€ 500.000']]);
    const maandrijen = blad.rijen.slice(blad.eersteMaandrij - 1, blad.laatsteMaandrij);
    assert.equal(maandrijen.length, t.regels.length);
    maandrijen.forEach((rij, i) => {
        assert.equal(rij[0], t.regels[i].maand);
        assert.equal(rij[3].w, Math.round(t.regels[i].totaal));
    });
    // De hoogste maand van het voorbeeld: maand 13, € 3.530.
    assert.equal(maandrijen[12][3].w, 3530);
    const totaal = blad.rijen[blad.laatsteMaandrij];
    assert.equal(totaal[0].w, 'Totaal');
    assert.equal(totaal[1], null, 'het depotsaldo wordt niet opgeteld');
    assert.equal(totaal[3].f, `SUM(D${blad.eersteMaandrij}:D${blad.laatsteMaandrij})`);
    assert.ok(new TextDecoder().decode(maakXlsx(blad)).includes('Koopsom v.o.n.'));
});
