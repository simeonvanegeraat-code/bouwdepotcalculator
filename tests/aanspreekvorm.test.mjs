/**
 * De omzetting van "u" naar "je" voor teksten uit de dataset
 * (scripts/aanspreekvorm.mjs), en de declaratiegids die haar gebruikt.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { jij } from '../scripts/aanspreekvorm.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));

test('de persoonsvorm voor "u" verliest zijn t, behalve waar de stam op t eindigt', () => {
    assert.equal(jij('Betaalt u toch eerst zelf'), 'Betaal je toch eerst zelf');
    assert.equal(jij('dan stuurt u een bankafschrift mee'), 'dan stuur je een bankafschrift mee');
    assert.equal(jij('dan uploadt u de factuur'), 'dan upload je de factuur');
    assert.equal(jij('Verlengt u, dan krijgt u niets'), 'Verleng je, dan krijg je niets');
    assert.equal(jij('Heeft u zelf betaald'), 'Heb je zelf betaald');
    assert.equal(jij('Bij verbouwing schiet u voor'), 'Bij verbouwing schiet je voor');
    assert.equal(jij('gaat u rente betalen'), 'ga je rente betalen');
    assert.equal(jij('Bent u nog niet klaar'), 'Ben je nog niet klaar');
    // "u" als lijdend voorwerp: het werkwoord houdt zijn t.
    assert.equal(jij('Een mondelinge toezegging helpt u niet'), 'Een mondelinge toezegging helpt je niet');
});

test('"heeft" verderop in de bijzin wordt "hebt"', () => {
    assert.equal(jij('of aan uzelf als u de rekening heeft voorgeschoten.'), 'of aan jezelf als je de rekening hebt voorgeschoten.');
    assert.equal(jij('waarop staat dat u betaald heeft.'), 'waarop staat dat je betaald hebt.');
    // Een "heeft" in een volgende zin hoort bij een ander onderwerp.
    assert.equal(jij('U betaalt zelf. De bank heeft dan niets nodig.'), 'Je betaalt zelf. De bank heeft dan niets nodig.');
});

test('uw, Uw en U aan het begin van een zin', () => {
    assert.equal(jij('U tekent de kopie van uw factuur.'), 'Je tekent de kopie van je factuur.');
    assert.equal(jij('Uw depot'), 'Je depot');
    assert.equal(jij('Geen aanspreekvorm hier.'), 'Geen aanspreekvorm hier.');
});

test('in geen enkele tekst van de dataset blijft "u" of een verkeerde vervoeging over', () => {
    const teksten = [];
    const loop = (x) => {
        if (typeof x === 'string') teksten.push(x);
        else if (x && typeof x === 'object') Object.values(x).forEach(loop);
    };
    loop(data.aanbieders);
    for (const tekst of teksten) {
        const om = jij(tekst);
        assert.doesNotMatch(om, /\b(u|uw|U|Uw|uzelf)\b/, tekst);
        assert.doesNotMatch(om, /\bje heeft\b|\bheeft je\b|\b(betaalt|stuurt|uploadt|krijgt|verlengt|kunt|bent|gaat) je\b(?! (hypotheek|maand|eigen|lening|leverancier|situatie|verbouwplan|bank|offerte|rekening))/i, tekst);
    }
});

test('de declaratiegids zegt nergens meer "u" en houdt per reden de rijen uit de data', () => {
    const html = fs.readFileSync(path.join(ROOT, 'bouwdepot-declaratie-afgewezen.html'), 'utf8');
    const inhoud = html.slice(html.indexOf('<main'), html.indexOf('</main>')).replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(inhoud, /\b(u|uw|U|Uw)\b/);

    for (const soort of ['soort-bewijs', 'vast-aan-woning', 'factuurgegevens', 'ouderdom', 'factuurdatum', 'taal-en-valuta', 'bestandsformaat']) {
        const aantal = data.aanbieders.filter((a) => (a.declaratieEisen || []).some((e) => e.eis === soort)).length;
        if (!aantal) continue;
        const blok = html.slice(html.indexOf(`id="${soort}"`)).split('</article>')[0];
        assert.equal((blok.match(/data-bank="/g) || []).length, aantal, soort);
    }
});

test('de vergelijking en de pagina per aanbieder zeggen nergens meer "u"', () => {
    const paginas = ['bouwdepot-voorwaarden-vergelijken.html', ...data.aanbieders.map((a) => `bouwdepot-${a.id}.html`)];
    for (const bestand of paginas) {
        const html = fs.readFileSync(path.join(ROOT, bestand), 'utf8');
        const inhoud = html.slice(html.indexOf('<main'), html.indexOf('</main>')).replace(/<[^>]+>/g, ' ');
        assert.doesNotMatch(inhoud, /\b(u|uw|U|Uw|uzelf)\b/, bestand);
        assert.doesNotMatch(inhoud, /\bje heeft\b|\bheeft je\b|\bhelp je niet\b/, bestand);
    }
});
