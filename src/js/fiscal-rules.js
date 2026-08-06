export const TAX_RULES_2026 = Object.freeze({
    year: 2026,
    firstBracketLimit: 38883,
    secondBracketLimit: 78426,
    firstRate: 0.3575,
    secondRate: 0.3756,
    thirdRate: 0.495,
    maxMortgageDeductionRate: 0.3756,
    hillenDeductionRate: 0.71867,
    highValueThreshold: 1330000,
    highValueBaseForfait: 4655,
    highValueRate: 0.0235,
    nhgFeeRate: 0.004,
    nhgLimit: 470000,
    nhgEnergyLimit: 498200
});

const nonNegative = (value) => Math.max(0, Number(value) || 0);

function calculateProgressiveTax(income, topRate = TAX_RULES_2026.thirdRate) {
    const taxableIncome = nonNegative(income);
    const firstSlice = Math.min(taxableIncome, TAX_RULES_2026.firstBracketLimit);
    const secondSlice = Math.min(
        Math.max(taxableIncome - TAX_RULES_2026.firstBracketLimit, 0),
        TAX_RULES_2026.secondBracketLimit - TAX_RULES_2026.firstBracketLimit
    );
    const thirdSlice = Math.max(taxableIncome - TAX_RULES_2026.secondBracketLimit, 0);

    return (firstSlice * TAX_RULES_2026.firstRate)
        + (secondSlice * TAX_RULES_2026.secondRate)
        + (thirdSlice * topRate);
}

export function calculateEigenwoningforfait(wozValue) {
    const woz = nonNegative(wozValue);
    if (woz <= 12500) return 0;
    if (woz <= 25000) return woz * 0.001;
    if (woz <= 50000) return woz * 0.002;
    if (woz <= 75000) return woz * 0.0025;
    if (woz <= TAX_RULES_2026.highValueThreshold) return woz * 0.0035;

    return TAX_RULES_2026.highValueBaseForfait
        + ((woz - TAX_RULES_2026.highValueThreshold) * TAX_RULES_2026.highValueRate);
}

export function calculateHomeDeductionBalance(yearlyInterest, yearlyForfait) {
    const interest = nonNegative(yearlyInterest);
    const forfait = nonNegative(yearlyForfait);
    const balance = interest - forfait;

    if (balance >= 0) return balance;

    const remainingForfait = Math.abs(balance) * (1 - TAX_RULES_2026.hillenDeductionRate);
    return -remainingForfait;
}

export function calculateHomeTaxEffect(grossIncome, homeDeductionBalance) {
    const income = nonNegative(grossIncome);
    const balance = Number(homeDeductionBalance) || 0;

    if (balance >= 0) {
        const incomeAfterDeduction = Math.max(0, income - balance);
        return calculateProgressiveTax(income, TAX_RULES_2026.maxMortgageDeductionRate)
            - calculateProgressiveTax(incomeAfterDeduction, TAX_RULES_2026.maxMortgageDeductionRate);
    }

    const incomeAfterAddition = income + Math.abs(balance);
    return -(calculateProgressiveTax(incomeAfterAddition) - calculateProgressiveTax(income));
}

export function calculateEffectiveDeductionRate(grossIncome, deductionAmount) {
    const deduction = nonNegative(deductionAmount);
    if (deduction === 0) return 0;
    return calculateHomeTaxEffect(grossIncome, deduction) / deduction;
}

export function calculateNhgFee(mortgageAmount) {
    return nonNegative(mortgageAmount) * TAX_RULES_2026.nhgFeeRate;
}
