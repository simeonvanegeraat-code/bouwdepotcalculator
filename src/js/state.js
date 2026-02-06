/**
 * src/js/state.js
 * Definieert de standaard state structuur.
 */

export function createState() {
  return {
    grondbedrag: null,     // Number (euro)
    hypotheekrente: null,  // Number (percentage, bijv 4.5)
    bouwdepot: null,       // Number (euro)
    depotrente: null,      // Number (percentage)
    bouwtijd: null,        // Integer (maanden)
    taxEnabled: false,     // Boolean
    taxRate: 0.37          // Number (decimaal, 0.37 of 0.495)
  };
}