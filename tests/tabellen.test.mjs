/**
 * Bewaakt dat de compacte telefoontabel alleen werkt op de maandtabel waar hij
 * voor gemaakt is.
 *
 * De regel verbergt op een telefoon de kolommen 2, 3, 5, 6, 7 en 9 van de
 * maandtabel met tien kolommen. Hij gold voor elke tabel, en verborg daardoor op
 * de pagina's renteverlies, hypotheekrenteaftrek, dubbele lasten en bouwrente
 * juist de kolom met de uitkomst. Die tabellen kiezen hun telefoonkolommen zelf.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(ROOT, 'src/styles/next/werkruimte.css'), 'utf8');
const paginas = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

test('de compacte telefoontabel geldt niet voor elke tabel', () => {
    assert.ok(!/\.wr-tabel:not\(\.is-volledig\)/.test(css), 'een regel voor .wr-tabel:not(.is-volledig) raakt alle tabellen');
    assert.ok(/\.wr-tabel--maanden:not\(\.is-volledig\)/.test(css), 'de compacte maandtabel is weg');
});

test('elke maandtabel met de kolomknop draagt wr-tabel--maanden', () => {
    for (const p of paginas) {
        const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
        if (!html.includes('id="tabel-kolommen"')) continue;
        assert.match(html, /<table class="[^"]*\bwr-tabel--maanden\b[^"]*" id="maandtabel">/, `${p} heeft de kolomknop maar geen wr-tabel--maanden`);
    }
});
