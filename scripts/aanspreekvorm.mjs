/**
 * Zet een tekst uit de dataset om van "u" naar "je".
 *
 * De teksten in data/bouwdepot-voorwaarden.json zijn geschreven toen de hele
 * site "u" zei. De pagina's in de nieuwe vormgeving zeggen "je", en twee
 * aanspreekvormen door elkaar op één pagina leest slordig. Zolang niet alle
 * pagina's over zijn blijft de dataset zoals hij is en zet de generator van
 * een nieuwe pagina de tekst hiermee om.
 *
 * Nederlands laat zich niet met één regel omzetten: "betaalt u" wordt "betaal
 * je", maar "moet u" blijft "moet je", en "als u de rekening heeft betaald"
 * wordt "als je de rekening hebt betaald". Daarom staan de gevallen die in de
 * dataset voorkomen hier uitgeschreven, en bewaakt tests/aanspreekvorm.test.mjs
 * dat er geen "u" of "je heeft" overblijft.
 */

// Werkwoorden waarvan de stam al op een t eindigt, of die onregelmatig zijn:
// daar valt bij "… u" geen t weg.
const VAST = {
  heeft: 'heb', moet: 'moet', schiet: 'schiet', laat: 'laat', zet: 'zet', weet: 'weet',
  sluit: 'sluit', let: 'let', wacht: 'wacht', mag: 'mag', kan: 'kan', zal: 'zal', bent: 'ben',
  gaat: 'ga', staat: 'sta', doet: 'doe',
  // Hier is "u" geen onderwerp maar lijdend voorwerp ("dat helpt u niet"), en
  // houdt het werkwoord dus zijn t.
  helpt: 'helpt',
};

const hoofdletter = (woord, zoals) => (zoals[0] === zoals[0].toUpperCase() ? woord[0].toUpperCase() + woord.slice(1) : woord);

export function jij(tekst) {
  return String(tekst ?? '')
    // "u" met de persoonsvorm verderop in de bijzin: "als u … heeft" → "als je … hebt".
    .replace(/\b([Uu])\b((?:(?![.;:!?]| u\b)[^])*?)\bheeft\b/g, (_, u, tussen) => `${u}${tussen}hebt`)
    // Persoonsvorm voor "u": de t valt weg, behalve bij de werkwoorden hierboven.
    .replace(/\b([A-Za-zë]+) u\b/g, (heel, werkwoord) => {
      const klein = werkwoord.toLowerCase();
      if (VAST[klein]) return `${hoofdletter(VAST[klein], werkwoord)} je`;
      if (/[^aeiou]t$|dt$/.test(klein) || /(aal|oop|uur|ie|un|oef|il)t$/.test(klein)) return `${werkwoord.slice(0, -1)} je`;
      return heel;
    })
    .replace(/\buzelf\b/g, 'jezelf').replace(/\bUzelf\b/g, 'Jezelf')
    .replace(/\bUw\b/g, 'Je').replace(/\buw\b/g, 'je')
    .replace(/\bU\b/g, 'Je').replace(/\bu\b/g, 'je');
}
