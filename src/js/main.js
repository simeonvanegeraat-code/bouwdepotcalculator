import '../styles/main.css';

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER: FORMAT EURO ---
    const formatEuro = (amount) => {
        return new Intl.NumberFormat('nl-NL', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // --- PDF DOWNLOAD ---
    const btnDownload = document.getElementById('btn-download');
    if(btnDownload) {
        btnDownload.addEventListener('click', () => {
            window.print();
        });
    }

    // ==============================================
    // ROUTING (Welke calculator moeten we starten?)
    // ==============================================
    if (document.getElementById('range-amount')) {
        initVerbouwCalculator();
    }

    if (document.getElementById('nieuwbouw-calc')) {
        initNieuwbouwCalculator();
    }


    // ----------------------------------------------
    // 1. VERBOUW CALCULATOR LOGICA
    // ----------------------------------------------
    function initVerbouwCalculator() {
        // Elementen
        const rangeAmount = document.getElementById('range-amount');
        const inputAmount = document.getElementById('input-amount'); // NIEUW: Input veld
        const rangeInterest = document.getElementById('range-interest');
        const inputInterest = document.getElementById('input-interest');
        const rangeDuration = document.getElementById('range-duration');
        const checkAftrek = document.getElementById('check-aftrek');

        // Labels & Results
        const valDuration = document.getElementById('val-duration');
        const resBruto = document.getElementById('res-bruto');
        const resVoordeel = document.getElementById('res-voordeel');
        const resNetto = document.getElementById('res-netto');

        function calculate() {
            // Nu lezen we de waarde uit het INPUT veld, niet alleen de slider
            // Dit zorgt ervoor dat je handmatig 200.000 kan typen terwijl de slider bij 150k stopt.
            const amount = parseFloat(inputAmount.value);
            const interest = parseFloat(inputInterest.value);
            const years = parseInt(rangeDuration.value);
            
            // Update labels
            valDuration.textContent = `${years} Jaar`;

            // Berekening Annuïteit
            const monthlyRate = (interest / 100) / 12;
            const totalMonths = years * 12;
            
            let grossMonthly = 0;
            if (interest === 0 || isNaN(interest)) {
                grossMonthly = amount / totalMonths;
            } else {
                grossMonthly = amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));
            }

            // Belasting
            const taxRate = 0.3697;
            const firstMonthInterest = amount * monthlyRate; 
            const taxBenefit = checkAftrek.checked ? (firstMonthInterest * taxRate) : 0;
            const netMonthly = grossMonthly - taxBenefit;

            // UI Updates
            resBruto.textContent = formatEuro(grossMonthly);
            
            if (checkAftrek.checked) {
                resVoordeel.parentElement.style.display = 'flex';
                resVoordeel.textContent = '-' + formatEuro(taxBenefit);
            } else {
                resVoordeel.parentElement.style.display = 'none';
            }
            resNetto.textContent = formatEuro(netMonthly);
        }

        // --- Event Listeners (Synchronisatie) ---
        
        // 1. Sync Bedrag (Slider <-> Input)
        rangeAmount.addEventListener('input', (e) => {
            inputAmount.value = e.target.value; // Slider past input aan
            calculate();
        });
        
        inputAmount.addEventListener('input', (e) => {
            // Input past slider aan (maar slider stopt visueel bij 150k)
            // Dit is prima: power-users kunnen hoger typen.
            rangeAmount.value = e.target.value; 
            calculate();
        });

        // 2. Sync Rente (Slider <-> Input)
        rangeInterest.addEventListener('input', (e) => { 
            inputInterest.value = e.target.value; 
            calculate(); 
        });
        inputInterest.addEventListener('input', (e) => { 
            rangeInterest.value = e.target.value; 
            calculate(); 
        });

        // 3. Overige events
        rangeDuration.addEventListener('input', calculate);
        checkAftrek.addEventListener('change', calculate);
        
        calculate(); // Start
    }


    // ----------------------------------------------
    // 2. NIEUWBOUW CALCULATOR LOGICA
    // ----------------------------------------------
    function initNieuwbouwCalculator() {
        const rangeLand = document.getElementById('range-land');
        const rangeConstruction = document.getElementById('range-construction');
        const rangeMonths = document.getElementById('range-months');
        const rangeInterest = document.getElementById('range-interest');
        const inputInterest = document.getElementById('input-interest');
        const checkSchedule = document.getElementById('show-schedule');

        const valLand = document.getElementById('val-land');
        const valConstruction = document.getElementById('val-construction');
        const valMonths = document.getElementById('val-months');

        const resTotalLoan = document.getElementById('res-total-loan');
        const resLoss = document.getElementById('res-loss');
        const resAvgMonthly = document.getElementById('res-avg-monthly');
        const resFinalMonthly = document.getElementById('res-final-monthly');
        
        const scheduleContainer = document.getElementById('schedule-container');
        const scheduleBody = document.getElementById('schedule-body');

        function calculate() {
            const landPrice = parseFloat(rangeLand.value);
            const constructionPrice = parseFloat(rangeConstruction.value);
            const months = parseInt(rangeMonths.value);
            const interest = parseFloat(inputInterest.value);

            valLand.textContent = formatEuro(landPrice);
            valConstruction.textContent = formatEuro(constructionPrice);
            valMonths.textContent = `${months} Maanden`;

            const totalLoan = landPrice + constructionPrice;
            const monthlyRate = (interest / 100) / 12;
            
            const loanTermMonths = 30 * 12;
            let finalMonthlyPayment = 0;
            if (interest === 0) finalMonthlyPayment = totalLoan / loanTermMonths;
            else finalMonthlyPayment = totalLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -loanTermMonths)));

            let totalInterestPaid = 0;
            let totalNetPayment = 0;
            
            const monthlyWithdrawal = constructionPrice / months;
            let currentDepotBalance = constructionPrice;
            let tableHTML = '';

            for (let i = 1; i <= months; i++) {
                const interestPayable = totalLoan * monthlyRate;
                const interestReceivable = currentDepotBalance * monthlyRate;
                const currentMonthlyPayment = finalMonthlyPayment - interestReceivable;

                totalNetPayment += currentMonthlyPayment;
                // Renteverlies is wat je betaalt minus wat je krijgt (puur rente deel)
                // Let op: finalMonthlyPayment bevat ook aflossing.
                // Zuivere rente last = (TotaleSchuld * Rente) - (Depot * Rente)
                const netInterestOnly = (totalLoan * monthlyRate) - (currentDepotBalance * monthlyRate);
                totalInterestPaid += netInterestOnly;

                if (checkSchedule.checked) {
                    tableHTML += `<tr><td>Maand ${i}</td><td>${formatEuro(currentDepotBalance)}</td><td>${formatEuro(currentMonthlyPayment)}</td></tr>`;
                }

                currentDepotBalance -= monthlyWithdrawal;
                if (currentDepotBalance < 0) currentDepotBalance = 0;
            }

            resTotalLoan.textContent = formatEuro(totalLoan);
            resLoss.textContent = formatEuro(totalInterestPaid);
            resAvgMonthly.textContent = formatEuro(totalNetPayment / months);
            resFinalMonthly.textContent = formatEuro(finalMonthlyPayment);

            if (checkSchedule.checked) {
                scheduleContainer.style.display = 'block';
                scheduleBody.innerHTML = tableHTML;
            } else {
                scheduleContainer.style.display = 'none';
            }
        }

        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        rangeLand.addEventListener('input', calculate);
        rangeConstruction.addEventListener('input', calculate);
        rangeMonths.addEventListener('input', calculate);
        checkSchedule.addEventListener('change', calculate);

        calculate();
    }
});