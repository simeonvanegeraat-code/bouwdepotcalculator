/**
 * Bewaakt dat het agendabestand van de depotplanner geldig blijft.
 *
 * Een .ics die een agenda weigert te openen is erger dan geen knop: de bezoeker
 * denkt dat zijn einddatum vastligt terwijl er niets in zijn agenda staat. Deze
 * test controleert de structuur en de vier dingen waar agenda's over vallen:
 * CRLF-regeleinden, dagvullende datums, escaping, en gevouwen lange regels.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maakAgenda } from '../src/js/agenda.js';

const voorbeeld = () => maakAgenda({
    naam: 'Bouwdepot Rabobank',
    bron: 'bouwdepotcalculator.nl',
    gebeurtenissen: [
        { naam: 'Vergoeding stopt', datum: new Date(2027, 1, 19), uitleg: 'Na 24 maanden stopt de vergoeding.' },
        { naam: 'Standaardtermijn eindigt', datum: new Date(2027, 7, 19), uitleg: 'De standaardlooptijd is 24 maanden; let op, komma en; puntkomma.', herinnering: 30 },
        { naam: 'Verlengen regelen', uitleg: 'Geen datum gepubliceerd.' },
    ],
});

test('levert een geldige agenda met een gebeurtenis per datum', () => {
    const ics = voorbeeld();
    assert.ok(ics.startsWith('BEGIN:VCALENDAR'), 'begint met VCALENDAR');
    assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'), 'eindigt met VCALENDAR');
    // Twee van de drie gebeurtenissen hebben een datum; de derde hoort er niet in.
    assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
    assert.equal((ics.match(/END:VEVENT/g) || []).length, 2);
    assert.ok(!ics.includes('Verlengen regelen'), 'een gebeurtenis zonder datum hoort niet in de agenda');
});

test('gebruikt CRLF, zoals de ICS-standaard eist', () => {
    const ics = voorbeeld();
    const losseNewlines = ics.split('\n').filter((r, i, a) => i < a.length - 1 && !r.endsWith('\r'));
    assert.deepEqual(losseNewlines, [], 'elke regel hoort op CRLF te eindigen');
});

test('zet de datums als dagvullend en sluit de dag erna af', () => {
    const ics = voorbeeld();
    assert.ok(ics.includes('DTSTART;VALUE=DATE:20270219'), 'startdatum als dagvullende datum');
    assert.ok(ics.includes('DTEND;VALUE=DATE:20270220'), 'DTEND is exclusief, dus de dag erna');
});

test('ontsnapt tekens waar het formaat over valt', () => {
    // Eerst ontvouwen: een lange regel is opgeknipt met CRLF plus een spatie,
    // dus de tekst staat verspreid over twee regels in het bestand.
    const ontvouwen = voorbeeld().replace(/\r\n /g, '');
    assert.ok(ontvouwen.includes('let op\\, komma en\\; puntkomma'), 'komma en puntkomma zijn ontsnapt');
});

test('vouwt regels langer dan 75 tekens', () => {
    const ics = maakAgenda({
        naam: 'Bouwdepot',
        gebeurtenissen: [{ naam: 'Lang', datum: new Date(2027, 0, 1), uitleg: 'x'.repeat(300) }],
    });
    const teLang = ics.split('\r\n').filter((r) => r.length > 75);
    assert.deepEqual(teLang, [], 'geen enkele regel mag boven de 75 tekens uitkomen');
});

test('zet alleen een herinnering waar er iets te doen valt', () => {
    const ics = voorbeeld();
    assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 1, 'een van de twee gebeurtenissen vraagt om actie');
    assert.ok(ics.includes('TRIGGER:-P30D'), 'de herinnering staat 30 dagen ervoor');
});

test('geeft niets terug als er geen enkele datum is', () => {
    assert.equal(maakAgenda({ naam: 'Leeg', gebeurtenissen: [{ naam: 'Zonder datum' }] }), '');
    assert.equal(maakAgenda({ naam: 'Leeg', gebeurtenissen: [] }), '');
});
