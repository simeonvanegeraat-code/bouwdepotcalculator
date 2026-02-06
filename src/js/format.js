/**
 * src/js/format.js
 * Formatting en parsing utilities voor NL locale.
 */

const NL_LOCALE = 'nl-NL';

// Formatter voor Euro bedragen (bijv. € 250.000)
export const formatEUR = (value) => {
  if (value == null || isNaN(value)) return '';
  return new Intl.NumberFormat(NL_LOCALE, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Formatter voor Percentages (bijv. 4,20%)
export const formatPct = (value) => {
  if (value == null || isNaN(value)) return '';
  // Intl verwacht 0.042 voor 4.2%, maar onze input state is 4.2
  // We formatteren het gewoon als decimaal getal met een suffix
  return new Intl.NumberFormat(NL_LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(value); // + '%' wordt vaak in de UI label gedaan, of hier toevoegen indien gewenst
};

// Formatter voor gehele getallen (maanden)
export const formatInt = (value) => {
  if (value == null || isNaN(value)) return '';
  return Math.round(value).toString();
};

/**
 * Zet een user string (bijv "250.000,50" of "€ 250.000") om naar een Javascript Number.
 * Dit is robuust tegen punten, komma's en valuta tekens.
 */
export const toNumberLoose = (str) => {
  if (!str) return null;
  if (typeof str === 'number') return str;

  // 1. Verwijder alles wat geen cijfer, komma, punt of min-teken is
  let clean = str.toString().replace(/[^0-9,.-]/g, '');

  // 2. Nederlandse conventie check:
  // Als er een komma in zit, en die komt ná de laatste punt (of er is geen punt),
  // dan is de komma de decimaal scheider.
  // We vervangen punten (duizendtallen) door niets, en komma door punt.
  if (clean.includes(',')) {
     clean = clean.replace(/\./g, ''); // 100.000,00 -> 100000,00
     clean = clean.replace(',', '.');  // 100000,00 -> 100000.00
  } else {
     // Geen komma? Dan kan een punt een duizendtal zijn (100.000) of decimaal (internationaal)
     // Aanname in deze NL tool: Punten zijn duizendtallen, tenzij er maar 1 punt is en minder dan 3 cijfers erachter? 
     // Veiliger: In NL tool gewoon punten negeren als duizendtal separator.
     clean = clean.replace(/\./g, ''); 
  }

  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
};