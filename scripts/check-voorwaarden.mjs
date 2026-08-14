/**
 * Signaleert wijzigingen in de bronpagina's van de voorwaardenvergelijking.
 *
 * Draait wekelijks via .github/workflows/voorwaarden-check.yml. Het doel is
 * nadrukkelijk niet om automatisch data bij te werken - dat blijft mensenwerk,
 * want een verkeerde cel is erger dan een verouderde cel. Dit script zegt
 * alleen: "hier is iets veranderd, ga kijken."
 *
 * Ruisonderdrukking: bankensites wijzigen voortdurend om redenen die er niet
 * toe doen (marketing, tokens, banners). Daarom wordt niet de hele pagina
 * vergeleken, maar alleen zinnen die een getal combineren met een term die
 * voor bouwdepotvoorwaarden relevant is.
 *
 *   node scripts/check-voorwaarden.mjs            vergelijk met de snapshot
 *   node scripts/check-voorwaarden.mjs --update   sla de huidige stand op
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'data/bouwdepot-voorwaarden.json');
const SNAPSHOT = path.join(ROOT, 'data/bronnen-snapshot.json');
const RAPPORT = path.join(ROOT, 'voorwaarden-rapport.md');

const UPDATE = process.argv.includes('--update');

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const snapshot = fs.existsSync(SNAPSHOT) ? JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) : { bronnen: {} };

/** Termen die een zin relevant maken voor bouwdepotvoorwaarden. */
const SIGNAAL = /(maand|werkdag|weken|jaar|rente|vergoeding|declara|depot|factuur|kassabon|verleng|minimum|maximum|restant|aflos)/i;

function naarTekst(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&euro;/g, '€')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

/** Alleen zinnen met én een getal én een relevante term. Dat filtert het meeste weg. */
function signaalZinnen(tekst) {
  return [...new Set(
    tekst
      .split(/(?<=[.!?])\s+/)
      .map((z) => z.trim())
      .filter((z) => z.length > 25 && z.length < 400)
      .filter((z) => /\d/.test(z) && SIGNAAL.test(z))
  )].sort();
}

async function haalOp(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });
    if (!res.ok) return { ok: false, reden: `HTTP ${res.status}` };
    return { ok: true, html: await res.text() };
  } catch (e) {
    return { ok: false, reden: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

const gewijzigd = [];
const onbereikbaar = [];
const nieuw = [];
const nieuweSnapshot = { bijgewerkt: new Date().toISOString().slice(0, 10), bronnen: {} };

for (const a of data.aanbieders) {
  const urls = [a.bron, ...(a.bronnen || [])].filter(Boolean);
  for (const url of urls) {
    const res = await haalOp(url);
    if (!res.ok) {
      onbereikbaar.push({ aanbieder: a.naam, url, reden: res.reden });
      // Oude stand bewaren, anders lijkt het volgende week een wijziging.
      if (snapshot.bronnen[url]) nieuweSnapshot.bronnen[url] = snapshot.bronnen[url];
      continue;
    }

    const zinnen = signaalZinnen(naarTekst(res.html));
    const hash = crypto.createHash('sha256').update(zinnen.join('\n')).digest('hex').slice(0, 16);
    nieuweSnapshot.bronnen[url] = { hash, aantal: zinnen.length, zinnen };

    const oud = snapshot.bronnen[url];
    if (!oud) {
      nieuw.push({ aanbieder: a.naam, url, aantal: zinnen.length });
    } else if (oud.hash !== hash) {
      const oudeSet = new Set(oud.zinnen || []);
      const nieuweSet = new Set(zinnen);
      gewijzigd.push({
        aanbieder: a.naam,
        url,
        toegevoegd: zinnen.filter((z) => !oudeSet.has(z)),
        verdwenen: (oud.zinnen || []).filter((z) => !nieuweSet.has(z)),
      });
    }
  }
}

if (UPDATE || !fs.existsSync(SNAPSHOT)) {
  fs.writeFileSync(SNAPSHOT, JSON.stringify(nieuweSnapshot, null, 2) + '\n');
  console.log(`Snapshot opgeslagen: ${Object.keys(nieuweSnapshot.bronnen).length} bronnen.`);
}

// ------------------------------------------------------------------ rapport

const regels = [];

if (gewijzigd.length) {
  regels.push('## Gewijzigde bronpagina\'s\n');
  regels.push('Controleer of de vergelijking nog klopt en werk zo nodig `data/bouwdepot-voorwaarden.json` bij (inclusief de `gecontroleerd`-datum).\n');
  for (const g of gewijzigd) {
    regels.push(`### ${g.aanbieder}`);
    regels.push(`<${g.url}>\n`);
    if (g.toegevoegd.length) {
      regels.push('**Nieuw of gewijzigd:**\n');
      g.toegevoegd.slice(0, 12).forEach((z) => regels.push(`- ${z}`));
      if (g.toegevoegd.length > 12) regels.push(`- _...en nog ${g.toegevoegd.length - 12} regels_`);
      regels.push('');
    }
    if (g.verdwenen.length) {
      regels.push('**Verdwenen:**\n');
      g.verdwenen.slice(0, 12).forEach((z) => regels.push(`- ${z}`));
      if (g.verdwenen.length > 12) regels.push(`- _...en nog ${g.verdwenen.length - 12} regels_`);
      regels.push('');
    }
  }
}

if (onbereikbaar.length) {
  regels.push('## Niet automatisch te controleren\n');
  regels.push('Deze bronnen blokkeren geautomatiseerd ophalen. Loop ze handmatig na.\n');
  onbereikbaar.forEach((o) => regels.push(`- **${o.aanbieder}** — <${o.url}> (${o.reden})`));
  regels.push('');
}

if (nieuw.length) {
  regels.push('## Nieuw toegevoegde bronnen\n');
  nieuw.forEach((n) => regels.push(`- **${n.aanbieder}** — <${n.url}> (${n.aantal} relevante regels vastgelegd)`));
  regels.push('');
}

// Aanbieders waarvan de controledatum verlopen is, ook al wijzigde er niets.
const verlopen = data.aanbieders.filter((a) => {
  const d = new Date(a.gecontroleerd + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + 6);
  return d < new Date();
});
if (verlopen.length) {
  regels.push('## Controledatum verlopen\n');
  regels.push('Deze aanbieders zijn langer dan zes maanden niet gecontroleerd; de site toont daar nu "controle openstaand".\n');
  verlopen.forEach((a) => regels.push(`- **${a.naam}** — laatst gecontroleerd ${a.gecontroleerd}`));
  regels.push('');
}

// Onbereikbare bronnen alléén zijn geen aanleiding voor een issue: Rabobank en ING
// blokkeren structureel, en dat elke week melden levert ruis op die je gaat negeren.
// Ze staan wél in het rapport zodra er een echte reden is om te kijken, en de
// zesmaandelijkse controledatum blijft het vangnet voor handmatige verificatie.
const heeftMelding = gewijzigd.length > 0 || verlopen.length > 0;

if (heeftMelding) {
  fs.writeFileSync(RAPPORT, regels.join('\n') + '\n');
  console.log(`Rapport geschreven naar ${path.basename(RAPPORT)}`);
} else if (fs.existsSync(RAPPORT)) {
  fs.unlinkSync(RAPPORT);
}

console.log(
  `Gecontroleerd: ${Object.keys(nieuweSnapshot.bronnen).length + onbereikbaar.length} bronnen · ` +
  `${gewijzigd.length} gewijzigd · ${onbereikbaar.length} onbereikbaar · ${verlopen.length} controle verlopen`
);

// Exitcode 0 blijft: de workflow beslist wat er met het rapport gebeurt.
process.exit(0);
