export function calculateScenario(state) {
  const months = state.bouwtijd;

  const ground = state.grondbedrag;
  const mortgageRate = state.hypotheekrente / 100;
  const depot = state.bouwdepot;
  const depotRate = state.depotrente / 100;

  const taxEnabled = state.taxEnabled;
  const taxRate = state.taxRate ?? 0;

  let depotRemaining = depot;
  const monthlyWithdrawal = depot / months;

  const rows = [];
  let totalNet = 0;
  let totalMortgageInterest = 0;
  let totalDepotInterest = 0;

  for (let m = 1; m <= months; m++) {
    // hypotheekrente over grond
    const mortgageInterest = ground * (mortgageRate / 12);
    totalMortgageInterest += mortgageInterest;

    // gemiddelde depotstand voor rente
    const avgDepot = depotRemaining - monthlyWithdrawal / 2;
    const depotInterest = avgDepot * (depotRate / 12);
    totalDepotInterest += depotInterest;

    // belasting (indicatief)
    const taxBenefit = taxEnabled ? mortgageInterest * taxRate : 0;

    const netMonth =
      mortgageInterest - depotInterest - taxBenefit;

    totalNet += netMonth;

    rows.push({
      month: m,
      mortgageInterest,
      depotInterest,
      taxBenefit,
      netMonth,
      depotRemaining
    });

    depotRemaining -= monthlyWithdrawal;
    if (depotRemaining < 0) depotRemaining = 0;
  }

  const avgNet = totalNet / months;
  const diff = totalMortgageInterest - totalDepotInterest;

  return {
    rows,
    totalNet,
    avgNet,
    diff
  };
}
