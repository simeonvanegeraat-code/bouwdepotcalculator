import '../styles/main.css';

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER: FORMAT EURO ---
    const formatEuro = (amount) => {
        return new Intl.NumberFormat('nl-NL', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 0, // Geen centen voor netheid, of 2 indien gewenst
            maximumFractionDigits: 2
        }).format(amount);
    };

    // --- PDF DOWNLOAD (Werkt op beide pagina's) ---
    const btnDownload = document.getElementById('btn-download');
    if(btnDownload) {
        btnDownload.addEventListener('click', () => {
            window.print();
        });
    }


    // ==============================================
    // LOGICA 1: HOMEPAGE (VERBOUW)
    // ==============================================
    const homeCalc = document.querySelector('.calculator-card'); // Check of we op home zijn
    // We checken specifiek op een ID dat alleen op home voorkomt, of we gebruiken classes.
    // Voor zekerheid: checken op 'range-amount' (bestaat alleen op home/verbouw in jouw vorige code)
    if (document.getElementById('range-amount')) {
        initVerbouwCalculator();
    }

    // ==============================================
    // LOGICA 2: NIEUWBOUW PAGINA
    // ==============================================
    if (document.getElementById('nieuwbouw-calc')) {
        initNieuwbouwCalculator();
    }


    // ----------------------------------------------
    // FUNCTIE: VERBOUW CALCULATOR (Oude code)
    // ----------------------------------------------
    function initVerbouwCalculator() {
        const rangeAmount = document.getElementById('range-amount');
        const rangeInterest = document.getElementById('range-interest');
        const inputInterest = document.getElementById('input-interest');
        const rangeDuration = document.getElementById('range-duration');
        const checkAftrek = document.getElementById('check-aftrek');

        const valAmount = document.getElementById('val-amount');
        const valDuration = document.getElementById('val-duration');
        const resBruto = document.getElementById('res-bruto');
        const resVoordeel = document.getElementById('res-voordeel');
        const resNetto = document.getElementById('res-netto');

        function calculate() {
            const amount = parseFloat(rangeAmount.value);
            const interest = parseFloat(inputInterest.value);
            const years = parseInt(rangeDuration.value);
            
            valAmount.textContent = formatEuro(amount);
            valDuration.textContent = `${years} Jaar`;

            const monthlyRate = (interest / 100) / 12;
            const totalMonths = years * 12;
            
            let grossMonthly = 0;
            if (interest === 0) {
                grossMonthly = amount / totalMonths;
            } else {
                grossMonthly = amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));
            }

            const taxRate = 0.3697;
            const firstMonthInterest = amount * monthlyRate; 
            const taxBenefit = checkAftrek.checked ? (firstMonthInterest * taxRate) : 0;
            const netMonthly = grossMonthly - taxBenefit;

            resBruto.textContent = formatEuro(grossMonthly);
            
            if (checkAftrek.checked) {
                resVoordeel.parentElement.style.display = 'flex';
                resVoordeel.textContent = '-' + formatEuro(taxBenefit);
            } else {
                resVoordeel.parentElement.style.display = 'none';
            }
            resNetto.textContent = formatEuro(netMonthly);
        }

        // Event Listeners Verbouw
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        rangeAmount.addEventListener('input', calculate);
        rangeDuration.addEventListener('input', calculate);
        checkAftrek.addEventListener('change', calculate);
        
        calculate(); // Init
    }


    // ----------------------------------------------
    // FUNCTIE: NIEUWBOUW CALCULATOR
    // ----------------------------------------------
    function initNieuwbouwCalculator() {
        const rangeLand = document.getElementById('range-land');
        const rangeConstruction = document.getElementById('range-construction');
        const rangeMonths = document.getElementById('range-months');
        const rangeInterest = document.getElementById('range-interest');
        const inputInterest = document.getElementById('input-interest');
        const checkSchedule = document.getElementById('show-schedule');

        // Displays
        const valLand = document.getElementById('val-land');
        const valConstruction = document.getElementById('val-construction');
        const valMonths = document.getElementById('val-months');

        // Results
        const resTotalLoan = document.getElementById('res-total-loan');
        const resLoss = document.getElementById('res-loss');
        const resAvgMonthly = document.getElementById('res-avg-monthly');
        const resFinalMonthly = document.getElementById('res-final-monthly');
        
        // Schedule Table
        const scheduleContainer = document.getElementById('schedule-container');
        const scheduleBody = document.getElementById('schedule-body');

        function calculate() {
            const landPrice = parseFloat(rangeLand.value);
            const constructionPrice = parseFloat(rangeConstruction.value);
            const months = parseInt(rangeMonths.value);
            const interest = parseFloat(inputInterest.value);

            // Update UI Labels
            valLand.textContent = formatEuro(landPrice);
            valConstruction.textContent = formatEuro(constructionPrice);
            valMonths.textContent = `${months} Maanden`;

            // Totale hypotheek & Maandlasten berekening
            const totalLoan = landPrice + constructionPrice;
            const monthlyRate = (interest / 100) / 12;
            
            // 1. Wat is de 'normale' annuïteit als alles klaar is? (o.b.v. 30 jaar)
            const loanTermMonths = 30 * 12;
            let finalMonthlyPayment = 0;
            if (interest === 0) finalMonthlyPayment = totalLoan / loanTermMonths;
            else finalMonthlyPayment = totalLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -loanTermMonths)));

            // 2. Loop door de bouwmaanden heen
            let totalInterestPaid = 0;
            let totalInterestReceived = 0;
            let totalNetPayment = 0;
            
            // We gaan uit van lineaire opname: Elke maand gaat er (Bouwsom / Maanden) uit het depot.
            const monthlyWithdrawal = constructionPrice / months;
            let currentDepotBalance = constructionPrice;
            
            // Voor de tabel
            let tableHTML = '';

            for (let i = 1; i <= months; i++) {
                // Rente betalen over HELE hypotheek (standaard in NL)
                // Let op: Bij nieuwbouw betaal je vaak alleen rente over wat je opgenomen hebt + grond, 
                // MAAR de standaard berekening is: Je betaalt alles, en krijgt rente terug over depot.
                // Dat komt op hetzelfde neer, maar rekent makkelijker.
                
                const interestPayable = totalLoan * monthlyRate; // Je betaalt rente over de hele pot
                const interestReceivable = currentDepotBalance * monthlyRate; // Je krijgt rente over wat nog in pot zit
                
                const netInterestCost = interestPayable - interestReceivable;
                
                // NB: We tellen hier even geen aflossing mee voor de "renteverlies" berekening,
                // want aflossing is geen kostenpost (is broekzak-vestzak).
                // Maar voor de maandlast die de klant VOELT, moet de aflossing er wel bij.
                // Aflossing is onderdeel van de finalMonthlyPayment.
                // De "korting" is de rente die je ontvangt.
                
                const currentMonthlyPayment = finalMonthlyPayment - interestReceivable;

                totalNetPayment += currentMonthlyPayment;
                totalInterestPaid += netInterestCost; // Dit is puur de rente die je 'kwijt' bent
                
                // Update tabel (toon elke maand of om de 3 maanden als het lang duurt)
                if (checkSchedule.checked) {
                    tableHTML += `
                        <tr>
                            <td>Maand ${i}</td>
                            <td>${formatEuro(currentDepotBalance)}</td>
                            <td>${formatEuro(currentMonthlyPayment)}</td>
                        </tr>
                    `;
                }

                // Saldo verlagen voor volgende maand
                currentDepotBalance -= monthlyWithdrawal;
                if (currentDepotBalance < 0) currentDepotBalance = 0;
            }

            // Outputs
            resTotalLoan.textContent = formatEuro(totalLoan);
            
            // Renteverlies = De totale netto rente die betaald is tijdens de bouw
            // Of simpeler: Het totaal aan rente over opgenomen bedragen.
            resLoss.textContent = formatEuro(totalInterestPaid);

            // Gemiddelde maandlast
            const avgMonthly = totalNetPayment / months;
            resAvgMonthly.textContent = formatEuro(avgMonthly);

            resFinalMonthly.textContent = formatEuro(finalMonthlyPayment);

            // Tabel
            if (checkSchedule.checked) {
                scheduleContainer.style.display = 'block';
                scheduleBody.innerHTML = tableHTML;
            } else {
                scheduleContainer.style.display = 'none';
            }
        }

        // Events Nieuwbouw
        rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
        inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
        rangeLand.addEventListener('input', calculate);
        rangeConstruction.addEventListener('input', calculate);
        rangeMonths.addEventListener('input', calculate);
        checkSchedule.addEventListener('change', calculate);

        calculate();
    }
});