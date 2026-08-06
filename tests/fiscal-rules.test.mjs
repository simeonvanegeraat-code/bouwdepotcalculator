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
    assert.equal(calculateEigenwoningforfait(1330000), 4655);
    assert.equal(calculateEigenwoningforfait(1400000), 6300);
});

test('applies the 2026 Hillen phase-out to a small home-loan balance', () => {
    const balance = calculateHomeDeductionBalance(1000, 1200);
    assert.ok(Math.abs(balance + 56.266) < 0.001);
});

test('calculates the 2026 NHG fee at 0.4 percent', () => {
    assert.equal(calculateNhgFee(300000), 1200);
});
