import test from 'node:test';
import assert from 'node:assert/strict';

import {
    TAX_RULES_2026,
    calculateEffectiveDeductionRate,
    calculateEigenwoningforfait,
    calculateHomeDeductionBalance,
    calculateHomeTaxEffect,
    calculateNhgFee
} from '../src/js/fiscal-rules.js';

test('uses the 2026 mortgage-deduction rates across income brackets', () => {
    assert.equal(calculateEffectiveDeductionRate(30000, 1000), 0.3575);
    assert.ok(Math.abs(calculateEffectiveDeductionRate(50000, 1000) - 0.3756) < 0.000001);
    assert.ok(Math.abs(calculateEffectiveDeductionRate(100000, 1000) - TAX_RULES_2026.maxMortgageDeductionRate) < 0.000001);
});

test('blends rates when a deduction crosses the first bracket boundary', () => {
    const benefit = calculateHomeTaxEffect(40000, 2000);
    const expected = (1117 * 0.3756) + (883 * 0.3575);
    assert.ok(Math.abs(benefit - expected) < 0.001);
});

test('calculates every 2026 eigenwoningforfait tier', () => {
    assert.equal(calculateEigenwoningforfait(12000), 0);
    assert.equal(calculateEigenwoningforfait(20000), 20);
    assert.equal(calculateEigenwoningforfait(40000), 80);
    assert.equal(calculateEigenwoningforfait(60000), 150);
    assert.equal(calculateEigenwoningforfait(400000), 1400);
    // De villagrens ligt in 2026 op 1.350.000 met een basis van 4.725; in 2025
    // was dat 1.330.000 en 4.655. Die twee waarden waren blijven staan, waardoor
    // een woning van 1,34 miljoen het villatarief kreeg dat pas boven 1,35
    // miljoen geldt. Deze regels bewaken precies die grens.
    assert.equal(calculateEigenwoningforfait(1340000), 4690);   // nog 0,35%
    assert.equal(calculateEigenwoningforfait(1350000), 4725);   // exact op de grens
    assert.equal(calculateEigenwoningforfait(1400000), 5900);   // 4.725 + 2,35% over 50.000
});

test('applies the 2026 Hillen phase-out to a small home-loan balance', () => {
    const balance = calculateHomeDeductionBalance(1000, 1200);
    assert.ok(Math.abs(balance + 56.266) < 0.001);
});

test('calculates the 2026 NHG fee at 0.4 percent', () => {
    assert.equal(calculateNhgFee(300000), 1200);
});
