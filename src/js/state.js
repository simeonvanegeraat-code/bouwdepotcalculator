// src/js/state.js

export const state = {
    landPrice: 150000,
    depotAmount: 300000,
    interestRate: 3.8,
    depotInterestRate: 3.8,
    constructionTime: 18,
    taxRate: 36.97
};

// Het is cruciaal dat 'export' hier voor staat
export function updateState(key, value) {
    const parsed = parseFloat(value);
    // Als de input geldig is, update de state. Anders negeren.
    if (!isNaN(parsed)) {
        state[key] = parsed;
    }
}