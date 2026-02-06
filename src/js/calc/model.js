/**
 * src/js/calc/model.js
 * Cashflow model: Bruto Last - Depot Vergoeding = Netto Cashflow
 */

export function calculateScenario(state) {
  const loanTotal = Number(state.loanTotal) || 0;
  const rate = Number(state.interestRate) / 100 || 0;
  const repayment = Number(state.repayment) || 0; // Vaste aflossing
  
  const depotTotal = Number(state.depotTotal) || 0;
  // Als depotrente 0 is ingevuld, nemen we aan dat het gelijk is aan hypotheekrente? 
  // Nee, bij deze tool moet je specifiek zijn. Default 0.
  const depotRate = (Number(state.depotRate) / 100) || 0;
  
  const duration = Number(state.duration) || 12;
  const isCustom = state.withdrawalMode === 'custom';
  const customSchedule = state.customSchedule || [];

  const result = {
    totalNetInterest: 0, // Totaal betaalde rente (netto)
    startNet: 0,
    endNet: 0,
    rows: []
  };

  // Vaste componenten
  // Rente over de TOTALE lening per maand.
  // We gaan ervan uit dat dit een vaste rente is.
  const monthlyLoanInterest = (loanTotal * rate) / 12;
  
  // De bruto maandlast die van de rekening gaat (Rente + Aflossing)
  const grossMonthlyPayment = monthlyLoanInterest + repayment;

  let currentDepot = depotTotal;
  let totalCost = 0;

  for (let month = 1; month <= duration; month++) {
    
    // 1. Bepaal opname
    let withdrawAmount = 0;
    if (isCustom) {
      const pct = customSchedule[month - 1] || 0;
      withdrawAmount = depotTotal * (pct / 100);
    } else {
      withdrawAmount = depotTotal / duration;
    }

    // 2. Bereken vergoeding over wat er aan BEGIN maand stond
    const depotReimbursement = (currentDepot * depotRate) / 12;

    // 3. Netto Cashflow = Bruto Betaling - Vergoeding
    const netCashflow = grossMonthlyPayment - depotReimbursement;

    totalCost += netCashflow;

    result.rows.push({
      month,
      gross: grossMonthlyPayment,     // Wat je aan de bank moet betalen
      reimbursement: depotReimbursement, // Wat je terugkrijgt (of niet hoeft te betalen)
      net: netCashflow,               // Het verschil
      depotStand: currentDepot
    });

    // Depot afboeken voor volgende maand
    currentDepot -= withdrawAmount;
    if (currentDepot < 0) currentDepot = 0;
  }

  result.totalNetInterest = totalCost - (repayment * duration); // Puur de rentekosten (totaal betaald - totaal afgelost)
  
  if (result.rows.length > 0) {
    result.startNet = result.rows[0].net;
    result.endNet = result.rows[result.rows.length - 1].net;
  }

  return result;
}