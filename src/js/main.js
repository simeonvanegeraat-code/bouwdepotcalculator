import '../styles/main.css';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTEN SELECTEREN ---
    // Inputs (Sliders)
    const rangeAmount = document.getElementById('range-amount');
    const rangeInterest = document.getElementById('range-interest');
    const inputInterest = document.getElementById('input-interest'); // Nummer vakje
    const rangeDuration = document.getElementById('range-duration');
    const checkAftrek = document.getElementById('check-aftrek');

    // Display values (Naast de sliders)
    const valAmount = document.getElementById('val-amount');
    const valDuration = document.getElementById('val-duration');

    // Resultaten
    const resBruto = document.getElementById('res-bruto');
    const resVoordeel = document.getElementById('res-voordeel');
    const resNetto = document.getElementById('res-netto');

    // --- HELPER FUNCTIE: FORMAT EURO ---
    const formatEuro = (amount) => {
        return new Intl.NumberFormat('nl-NL', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // --- DE BEREKENING ---
    function calculate() {
        // Waardes ophalen
        const amount = parseFloat(rangeAmount.value);
        const interest = parseFloat(inputInterest.value); // Gebruik de precieze input
        const years = parseInt(rangeDuration.value);
        
        // Update Labels naast sliders
        valAmount.textContent = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
        valDuration.textContent = `${years} Jaar`;

        // 1. Bruto Maandlast (Annuiteit)
        // Formule: Bedrag * ( maandrente / (1 - (1 + maandrente)^(-maanden)) )
        const monthlyRate = (interest / 100) / 12;
        const totalMonths = years * 12;
        
        let grossMonthly = 0;
        if (interest === 0) {
            grossMonthly = amount / totalMonths;
        } else {
            grossMonthly = amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));
        }

        // 2. Belastingvoordeel (Simpele benadering 2026: ca 37% aftrek)
        const taxRate = 0.3697; // Basistarief
        // Bruto rente deel van de eerste maand (hoogste rente)
        const firstMonthInterest = amount * monthlyRate; 
        const taxBenefit = checkAftrek.checked ? (firstMonthInterest * taxRate) : 0;

        // 3. Netto
        const netMonthly = grossMonthly - taxBenefit;

        // --- UPDATE UI ---
        resBruto.textContent = formatEuro(grossMonthly);
        
        if (checkAftrek.checked) {
            resVoordeel.parentElement.style.display = 'flex';
            resVoordeel.textContent = '-' + formatEuro(taxBenefit);
        } else {
            resVoordeel.parentElement.style.display = 'none';
        }

        resNetto.textContent = formatEuro(netMonthly);
    }

    // --- SYNCHRONISEER SLIDER EN NUMMER INPUT VOOR RENTE ---
    rangeInterest.addEventListener('input', (e) => {
        inputInterest.value = e.target.value;
        calculate();
    });
    
    inputInterest.addEventListener('input', (e) => {
        rangeInterest.value = e.target.value;
        calculate();
    });

    // --- EVENTS ---
    rangeAmount.addEventListener('input', calculate);
    rangeDuration.addEventListener('input', calculate);
    checkAftrek.addEventListener('change', calculate);

    // Initialiseer
    calculate();
});