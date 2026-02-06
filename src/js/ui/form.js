import { state, updateState } from '../state.js';
import { calculateScenario } from '../calc/model.js';
import { updateKPIs, updateChart } from './results.js';

/**
 * Initialiseert alle event listeners voor het formulier
 */
export function initForm() {
    const form = document.getElementById('calc-form');
    const monthsSlider = document.getElementById('constructionMonths');
    const monthsDisplay = document.getElementById('months-display');

    if (!form) return;

    // Luister naar alle input veranderingen in het formulier
    form.addEventListener('input', (e) => {
        const target = e.target;
        
        // Update de lokale state
        updateState(target.id, target.value);

        // Speciale actie voor de slider display
        if (target.id === 'constructionMonths') {
            monthsDisplay.textContent = target.value;
        }

        // Voer de berekening uit en update de UI
        runCalculation();
    });

    // Run de eerste keer bij het laden
    runCalculation();
}

/**
 * Haalt de nieuwste berekening op en stuurt deze naar de UI componenten
 */
export function runCalculation() {
    // 1. Bereken het scenario op basis van de huidige state
    const results = calculateScenario(state);

    // 2. Update de KPI blokken bovenin
    updateKPIs(results);

    // 3. Update de grafiek (Chart.js)
    updateChart(results);
    
    // Optioneel: Update ook de tabel als je die hebt
    // updateTable(results);
}