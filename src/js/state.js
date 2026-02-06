export function createState() {
  return {
    loanTotal: 0,      // Was grondbedrag, nu Totale Hypotheek
    interestRate: 0,   // Hypotheekrente
    repayment: 0,      // Nieuw: Aflossing per maand
    
    depotTotal: 0,     // Bouwdepot startbedrag
    depotRate: 0,      // Depot rente
    
    duration: 12,      // Bouwtijd
    
    withdrawalMode: 'linear',
    customSchedule: []
  };
}