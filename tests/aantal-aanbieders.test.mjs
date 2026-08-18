/**
 * Bewaakt dat het aantal aanbieders overal klopt met de data.
 *
 * Het aantal geldverstrekkers staat op elf pagina's met de hand in de tekst,
 * in de vorm "zes geldverstrekkers", "vier van de zes" en "1 van de 6". De
 * gegenereerde pagina's rekenen dat zelf uit, de handgeschreven niet. Zodra er
 * een aanbieder bijkomt, klopt elk van die zinnen niet meer.
 *
 * Dat is geen theorie: toen het aantal niet-gepubliceerde gegevens van 19 naar
 * 17 zakte, bleef 19 op de homepage staan. Deze test maakt uitbreiden veilig
 * door hard te falen zolang er nog ergens een oud getal staat.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bouwdepot-voorwaarden.json'), 'utf8'));
const AANTAL = data.aanbieders.length;

const TELWOORD = {
    2: 'twee', 3: 'drie', 4: 'vier', 5: 'vijf', 6: 'zes', 7: 'zeven', 8: 'acht',
    9: 'negen', 10: 'tien', 11: 'elf', 12: 'twaalf',
};

const paginas = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

/**
 * Een telwoord of cijfer dat direct voor "aanbieders" of "geldverstrekkers"
 * staat. Dat vangt ook de wending "vier van de zes aanbieders", want daarin is
 * het totaal het getal dat tegen het zelfstandig naamwoord aan staat.
 *
 * Bewust niet losser: een patroon op "van de N" ving ook "van de 34 posten" en
 * "van de twee rekenmodellen", en die hebben niets met aanbieders te maken.
 */
const PATROON = /(\d+|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf)\s+(?:vergeleken\s+)?(?:geldverstrekkers|aanbieders)/gi;

const alsGetal = (woord) => {
    const n = Number(woord);
    if (!Number.isNaN(n)) return n;
    const gevonden = Object.entries(TELWOORD).find(([, w]) => w === woord.toLowerCase());
    return gevonden ? Number(gevonden[0]) : null;
};

test('elke vermelding van het totaal aantal aanbieders klopt met de data', () => {
    const fouten = [];

    for (const bestand of paginas) {
        const html = fs.readFileSync(path.join(ROOT, bestand), 'utf8');

        for (const m of html.matchAll(PATROON)) {
            const getal = alsGetal(m[1]);
            if (getal == null) continue;

            // Onderscheid een totaal van een deelaantal. "van de zes aanbieders"
            // en "(6 geldverstrekkers)" gaan over de hele vergelijking; "slechts
            // twee aanbieders publiceren een termijn" is een bevinding en mag
            // elk getal zijn.
            const ervoor = html.slice(Math.max(0, m.index - 12), m.index);
            const isTotaal = /(?:van\s+(?:de\s+)?|alle\s+|\()$/i.test(ervoor);
            if (!isTotaal) continue;

            if (getal !== AANTAL) {
                fouten.push(`${bestand}: "${ervoor.trim()} ${m[0].trim()}" — verwacht ${AANTAL}`);
            }
        }
    }

    assert.deepEqual(fouten, [], `onjuiste aantallen:\n    ${fouten.join('\n    ')}`);
});

test('het telwoord voor het aantal aanbieders bestaat', () => {
    // Zonder dit zou een uitbreiding naar dertien stilletjes onbeschrijfbaar zijn
    // in de lopende tekst, en zou de test hierboven niets meer vangen.
    assert.ok(
        TELWOORD[AANTAL],
        `er is geen telwoord voor ${AANTAL} aanbieders; vul TELWOORD aan in deze test`,
    );
});
