/**
 * Formatteert een getal naar een Nederlandse valuta weergave
 */
export function formatEuro(amount) {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    }).format(amount);
}

/**
 * Formatteert een getal naar een percentage
 */
export function formatPercent(value) {
    return new Intl.NumberFormat('nl-NL', {
        style: 'percent',
        minimumFractionDigits: 2
    }).format(value / 100);
}