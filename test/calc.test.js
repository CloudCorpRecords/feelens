'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { quote, compare, hiddenCostGap, midRate } = require('../src/calc');
const { renderCompare, renderQuote } = require('../src/cli');

test('mid-market rate: direct, inverse, and same-currency', () => {
  assert.equal(midRate('USD', 'INR'), 88.7);
  assert.ok(Math.abs(midRate('INR', 'USD') - 1 / 88.7) < 1e-12);
  assert.equal(midRate('USD', 'USD'), 1);
  assert.throws(() => midRate('USD', 'ZZZ'), /No sample rate/);
});

test('quote math matches a hand-computed case (Wise, 1000 USD -> INR)', () => {
  // Wise: pctFee 0.65% of 1000 = 6.50, fixed 0, markup 0.
  // converted = 993.50; recipient = 993.50 * 88.7 = 88123.45
  // gross at mid = 88700; total cost = 576.55
  const q = quote({ amount: 1000, from: 'USD', to: 'INR', provider: 'wise' });
  assert.equal(q.percentFee, 6.5);
  assert.equal(q.fixedFee, 0);
  assert.equal(q.converted, 993.5);
  assert.equal(q.fxMarkupCost, 0);
  assert.equal(q.recipientGets, 88123.45);
  assert.equal(q.totalCost, 576.55);
});

test('quote math matches a hand-computed case with markup (PayPal, 1000 USD -> INR)', () => {
  // PayPal: pct 4.4% = 44.00, fixed 0.30; converted = 955.70.
  // provider rate = 88.7 * 0.97 = 86.039; recipient = 955.70 * 86.039 = 82227.47 (rounded)
  // gross = 88700; markup cost = 955.70 * (88.7 - 86.039) = 955.70 * 2.661 = 2543.12 (rounded)
  const q = quote({ amount: 1000, from: 'USD', to: 'INR', provider: 'paypal' });
  assert.equal(q.percentFee, 44);
  assert.equal(q.fixedFee, 0.3);
  assert.equal(q.converted, 955.7);
  assert.ok(Math.abs(q.recipientGets - 82227.47) <= 0.02, `recipient ${q.recipientGets}`);
  assert.ok(Math.abs(q.fxMarkupCost - 2543.12) <= 0.02, `markup ${q.fxMarkupCost}`);
});

test('invariant: recipientGets + totalCost === grossAtMid for every provider and corridor', () => {
  const corridors = [
    ['USD', 'INR'], ['USD', 'PHP'], ['USD', 'MXN'], ['USD', 'EUR'],
    ['EUR', 'USD'], ['GBP', 'USD'], ['INR', 'USD'], ['USD', 'USD'],
  ];
  for (const [from, to] of corridors) {
    for (const q of compare({ amount: 777.77, from, to })) {
      assert.ok(
        Math.abs(q.recipientGets + q.totalCost - q.grossAtMid) <= 0.011,
        `${q.provider} ${from}->${to}: ${q.recipientGets} + ${q.totalCost} != ${q.grossAtMid}`
      );
      assert.ok(q.recipientGets > 0, `${q.provider} recipient should be positive`);
      assert.ok(q.totalCost >= 0);
    }
  }
});

test('same-currency transfer charges no FX markup, even for markup-heavy providers', () => {
  const q = quote({ amount: 200, from: 'USD', to: 'USD', provider: 'swift-bank' });
  assert.equal(q.fxMarkupCost, 0);
  assert.equal(q.providerRate, 1);
  assert.equal(q.recipientGets, 165); // 200 - 35 fixed
});

test('compare ranks cheapest first and the gap is worst minus best', () => {
  const quotes = compare({ amount: 1000, from: 'USD', to: 'INR' });
  for (let i = 1; i < quotes.length; i++) {
    assert.ok(quotes[i].totalCost >= quotes[i - 1].totalCost, 'not sorted by cost');
  }
  assert.equal(quotes[0].provider, 'wise');
  const gap = hiddenCostGap(quotes);
  assert.equal(gap, Math.round((quotes[quotes.length - 1].totalCost - quotes[0].totalCost) * 100) / 100);
  assert.ok(gap > 1000, `expected a four-figure gap on 1000 USD->INR, got ${gap}`);
});

test('validation: bad amount, unknown provider, fees exceeding amount', () => {
  assert.throws(() => quote({ amount: 0, from: 'USD', to: 'INR', provider: 'wise' }), /positive number/);
  assert.throws(() => quote({ amount: -5, from: 'USD', to: 'INR', provider: 'wise' }), /positive number/);
  assert.throws(() => quote({ amount: 100, from: 'USD', to: 'INR', provider: 'nope' }), /Unknown provider/);
  assert.throws(() => quote({ amount: 20, from: 'USD', to: 'EUR', provider: 'swift-bank' }), /meet or exceed/);
});

test('rendering: comparison text names the cheapest route and the gap', () => {
  const { text } = renderCompare({ amount: 1000, from: 'USD', to: 'INR' });
  assert.match(text, /Cheapest route: Wise/);
  assert.match(text, /Hidden-cost gap/);
  const single = renderQuote(quote({ amount: 1000, from: 'USD', to: 'INR', provider: 'paypal' }));
  assert.match(single, /TOTAL COST/);
  assert.match(single, /FX markup cost/);
});
