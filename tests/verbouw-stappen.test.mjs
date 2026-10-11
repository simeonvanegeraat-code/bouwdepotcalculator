import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
    controleerGeld, controleerPosten, controleerRente, controleerReserve, schermvolgorde, volgende, voortgang, vorige,
} from '../src/verbouwen/stappenlogica.js';

const posten = JSON.parse(readFileSync(new URL('../data/verbouwposten.json', import.meta.url), 'utf8'));
const html = readFileSync(new URL('../verbouwbegroting.html', import.meta.url), 'utf8');
const CATS = posten.categorieen.map((c) => c.id);

test('alleen wat je aanvinkt krijgt een scherm, in de volgorde van de pagina', () => {
    assert.deepEqual(schermvolgorde(CATS, ['afbouw', 'ruwbouw']), ['wat', 'cat-ruwbouw', 'cat-afbouw', 'reserve', 'geld', 'rente']);
    assert.deepEqual(schermvolgorde(CATS, []), ['wat', 'reserve', 'geld', 'rente']);
    assert.equal(schermvolgorde(CATS, CATS).length, CATS.length + 4);
    assert.deepEqual(schermvolgorde(CATS, ['bestaat-niet']), ['wat', 'reserve', 'geld', 'rente']);
});

test('volgende en vorige lopen van start tot klaar', () => {
    const v = schermvolgorde(CATS, ['keuken-badkamer']);
    assert.equal(volgende(v, 'wat'), 'cat-keuken-badkamer');
    assert.equal(volgende(v, 'cat-keuken-badkamer'), 'reserve');
    assert.equal(volgende(v, 'rente'), 'klaar');
    assert.equal(vorige(v, 'wat'), 'start');
    assert.equal(vorige(v, 'reserve'), 'cat-keuken-badkamer');
    // Een scherm dat niet meer in de volgorde zit (zojuist uitgevinkt): terug naar het begin.
    assert.equal(volgende(v, 'cat-buiten'), 'wat');
    assert.equal(vorige(v, 'cat-buiten'), 'start');
    assert.ok(voortgang(v, 'wat') > 0 && voortgang(v, 'rente') < 1);
    assert.ok(voortgang(v, 'geld') < voortgang(v, 'rente'));
});

test('een aangevinkte post heeft een bedrag nodig, een niet-aangevinkte niet', () => {
    const rij = (gekozen, bedrag) => ({ naam: 'Keuken', gekozen, bedrag });
    assert.equal(controleerPosten([rij(true, 18000), rij(false, null)]), '');
    assert.equal(controleerPosten([]), '', 'niets aangevinkt mag: dan sla je het onderdeel over');
    assert.match(controleerPosten([rij(true, null)]), /Vul een bedrag in bij "Keuken"/);
    assert.match(controleerPosten([rij(true, 0)]), /Keuken/);
    assert.match(controleerPosten([rij(true, 5000001)]), /hoger dan waar deze tool mee rekent/);
});

test('reserve, financiering en rente houden de grenzen van de rekentool aan', () => {
    assert.equal(controleerReserve(0), '');
    assert.equal(controleerReserve(30), '');
    assert.notEqual(controleerReserve(31), '');
    assert.notEqual(controleerReserve(null), '');
    assert.equal(controleerGeld({ hypotheek: 0, waarde: 400000, eigen: 0 }), '');
    assert.match(controleerGeld({ hypotheek: 0, waarde: null, eigen: 0 }), /waard is/);
    assert.match(controleerGeld({ hypotheek: 0, waarde: 0, eigen: 0 }), /waard is/);
    assert.notEqual(controleerGeld({ hypotheek: -1, waarde: 400000, eigen: 0 }), '');
    assert.notEqual(controleerGeld({ hypotheek: 0, waarde: 400000, eigen: 1000001 }), '');
    assert.equal(controleerRente(0), '');
    assert.equal(controleerRente(3.9), '');
    assert.notEqual(controleerRente(null), '');
    assert.notEqual(controleerRente(20.5), '');
});

test('elke categorie en elke post uit de data staat in de stappen', () => {
    for (const c of posten.categorieen) {
        assert.ok(html.includes(`data-vb-cat="${c.id}"`), `tegel ${c.id}`);
        assert.ok(html.includes(`data-scherm="cat-${c.id}"`), `scherm ${c.id}`);
        assert.ok(html.includes(`data-zone="${c.id}"`), `plek in het huis voor ${c.id}`);
        for (const p of c.posten) {
            assert.ok(html.includes(`data-vb-kies="${p.id}"`) && html.includes(`data-vb-bedrag="${p.id}"`), `post ${p.id}`);
            // Elke post in de stappen schrijft naar een veld van de begroting.
            assert.ok(html.includes(`id="post-${p.id}"`), `veld voor ${p.id}`);
        }
    }
});

test('de pagina houdt haar adres, kop en ingangen', () => {
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    assert.match(html, /<h1 id="reken-titel">Wat gaat je verbouwing kosten\?<\/h1>/);
    assert.match(html, /<title>Verbouwbegroting maken \| Wat mag uit het bouwdepot\?<\/title>/);
    assert.ok(html.includes('id="leenruimte"'), 'het anker uit het menu');
    // Het kruimelpad op de pagina en dat in de gestructureerde data noemen de pagina hetzelfde.
    const zichtbaar = html.match(/aria-label="Kruimelpad">[\s\S]*?<span>([^<]+)<\/span><\/nav>/)[1];
    const kruimels = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((j) => j['@type'] === 'BreadcrumbList');
    assert.equal(kruimels.itemListElement.at(-1).name, zichtbaar);
    // Wie via het menu naar de leenruimte gaat, of een bedrag meekrijgt, slaat het startscherm over.
    assert.ok(html.includes("location.hash === '#leenruimte'") && html.includes(".has('bedrag')"));
    for (const haak of ['data-vb-samen', 'data-vb-lijst', 'data-vb-waardepunt', 'data-vb-bankpunt', 'id="invoer"', 'id="begroting-posten"', 'id="lr-volg-knop"', 'id="lr-praktijkcase"']) {
        assert.ok(html.includes(haak), haak);
    }
});
