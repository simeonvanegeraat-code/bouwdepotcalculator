/**
 * src/js/state.js
 * Update: Met withdrawalMode en customSchedule
 */

export function createState() {
  return {
    grondbedrag: null,     
    hypotheekrente: null,  
    bouwdepot: null,       
    depotrente: null,      
    bouwtijd: null,        
    taxEnabled: false,     
    taxRate: 0.37,
    
    // Nieuw: Opname strategie
    withdrawalMode: 'linear', // 'linear' of 'custom'
    customSchedule: []        // Array van getallen (percentages)
  };
}