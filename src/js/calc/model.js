/**
 * src/js/calc/model.js
 * Update: Ondersteuning voor niet-lineaire opnames
 */

export function calculateScenario(state) {
  const grondbedrag = Number(state.grondbedrag) || 0;
  const hypotheekrente = Number(state.hypotheekrente) / 100 || 0;
  const bouwdepot = Number(state.bouwdepot) || 0;
  const depotrente = state.depotrente != null ? (Number(state.depotrente) / 100) : hypotheekrente; 
  const bouwtijd = Number(state.bouwtijd) || 12;
  
  const taxEnabled = state.taxEnabled || false;
  const taxRate = Number(state.taxRate) / 100 || 0.37;

  // Haal custom schedule op (en vul aan met 0 als de array te kort is)
  const isCustom = state.withdrawalMode === 'custom';
  const customSchedule = state.customSchedule || [];

  const result = {
    avgNet: 0,
    totalNet: 0,
    diff: 0,
    rows: []
  };

  const monthlyGroundInterest = (grondbedrag * hypotheekrente) / 12;
  
  // Let op: Bij nieuwbouw betaal je vaak rente over het HELE depotbedrag (lening), 
  // en krijg je rentevergoeding over wat er nog in kas zit.
  // Dus de lasten van de lening blijven constant (indien aflossingsvrij in bouw), de vergoeding daalt.
  const monthlyDepotLoanCost = (bouwdepot * hypotheekrente) / 12;

  let currentDepot = bouwdepot;
  let totalNetCost = 0;

  // Loop
  for (let month = 1; month <= bouwtijd; month++) {
    
    // Bepaal opname voor deze maand
    let withdrawAmount = 0;

    if (isCustom) {
      // Haal percentage voor deze maand (index is month-1)
      const pct = customSchedule[month - 1] || 0;
      withdrawAmount = bouwdepot * (pct / 100);
    } else {
      // Lineair
      withdrawAmount = bouwdepot / bouwtijd;
    }

    // Rente vergoeding over wat er aan het BEGIN van de maand nog stond
    const depotInterestInfo = (currentDepot * depotrente) / 12;

    const totalInterestPaid = monthlyGroundInterest + monthlyDepotLoanCost;
    const grossMonth = totalInterestPaid - depotInterestInfo;

    let taxBenefit = 0;
    if (taxEnabled) {
      // Fiscaal: Betaalde rente - Ontvangen rente = Aftrekpost
      // Als ontvangen rente > betaalde rente (bijv bij 100% depot en gelijke rentes), is saldo 0 of positief.
      // We nemen even aan dat grossMonth > 0 is voor aftrek.
      const deductible = Math.max(0, grossMonth); 
      taxBenefit = deductible * taxRate;
    }

    const netMonth = grossMonth - taxBenefit;
    totalNetCost += netMonth;

    result.rows.push({
      month: month,
      depotRemaining: currentDepot,
      mortgageInterest: totalInterestPaid,
      depotInterest: depotInterestInfo,
      taxBenefit: taxBenefit,
      netMonth: netMonth,
      withdraw: withdrawAmount // Voor debugging/tabel handig
    });

    // Depot afboeken voor VOLGENDE maand
    currentDepot -= withdrawAmount;
    if (currentDepot < 0) currentDepot = 0;
  }

  result.totalNet = totalNetCost;
  result.avgNet = bouwtijd > 0 ? totalNetCost / bouwtijd : 0;
  
  if (result.rows.length > 0) {
    const firstMonth = result.rows[0].netMonth;
    const lastMonth = result.rows[result.rows.length - 1].netMonth;
    result.diff = lastMonth - firstMonth;
  }

  return result;
}