export const DEFAULT_STATE = {
  grondbedrag: null,
  hypotheekrente: null,
  bouwdepot: null,
  depotrente: null,
  bouwtijd: null,
  taxEnabled: false,
  taxRate: 0.37
};

export function createState() {
  return structuredClone(DEFAULT_STATE);
}
