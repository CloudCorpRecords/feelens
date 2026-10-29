'use strict';

const providersData = require('../data/providers.json');
const ratesData = require('../data/rates.json');

const providers = providersData.providers;
const pairs = ratesData.pairs;

function midRate(from, to) {
  if (from === to) return 1;
  const direct = pairs[`${from}->${to}`];
  if (typeof direct === 'number') return direct;
  const inverse = pairs[`${to}->${from}`];
  if (typeof inverse === 'number' && inverse !== 0) return 1 / inverse;
  throw new Error(`No sample rate for corridor ${from}->${to}. Corridors in data/rates.json: ${Object.keys(pairs).join(', ')}`);
}

function getProvider(id) {
  const p = providers.find((x) => x.id === id);
  if (!p) {
    throw new Error(`Unknown provider "${id}". Known: ${providers.map((x) => x.id).join(', ')}`);
  }
  return p;
}

/**
 * Quote one transfer.
 *
 * Model (all fees are charged in the SOURCE currency, before conversion —
 * this matches how the listed providers actually bill):
 *   percentFee   = amount * provider.pctFee
 *   fixedFee     = provider.fixedFee            (source currency units)
 *   converted    = amount - percentFee - fixedFee
 *   providerRate = mid * (1 - provider.fxMarkupPct)   (markup = 0 when from === to)
 *   recipientGets = converted * providerRate
 *   grossAtMid    = amount * mid
 *   totalCost     = grossAtMid - recipientGets        (in TARGET currency)
 *   fxMarkupCost  = converted * (mid - providerRate)  (the silent slice)
 *
 * Invariant: recipientGets + totalCost === grossAtMid.
 */
function quote({ amount, from, to, provider }) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Amount must be a positive number, got ${amount}`);
  }
  const p = getProvider(provider);
  const mid = midRate(from, to);
  const sameCurrency = from === to;
  const markupPct = sameCurrency ? 0 : p.fxMarkupPct;

  const percentFee = round2(amount * p.pctFee);
  const fixedFee = round2(p.fixedFee);
  if (percentFee + fixedFee >= amount) {
    throw new Error(`Fees (${percentFee + fixedFee}) meet or exceed the amount (${amount}); nothing would be left to convert.`);
  }
  const converted = round2(amount - percentFee - fixedFee);
  const providerRate = mid * (1 - markupPct);
  const recipientGets = round2(converted * providerRate);
  const grossAtMid = round2(amount * mid);
  const fxMarkupCost = round2(converted * (mid - providerRate));
  const totalCost = round2(grossAtMid - recipientGets);
  const costPct = grossAtMid === 0 ? 0 : (totalCost / grossAtMid) * 100;

  return {
    provider: p.id,
    providerName: p.name,
    amount,
    from,
    to,
    midRate: mid,
    providerRate,
    percentFee,
    fixedFee,
    converted,
    fxMarkupCost,
    totalCost,
    costPct,
    recipientGets,
    grossAtMid,
  };
}

/** Quote every provider for the same transfer, cheapest first. */
function compare({ amount, from, to }) {
  const quotes = providers.map((p) => quote({ amount, from, to, provider: p.id }));
  quotes.sort((a, b) => a.totalCost - b.totalCost);
  return quotes;
}

/** How much more the priciest route costs than the cheapest, for one transfer. */
function hiddenCostGap(quotes) {
  if (!quotes.length) return 0;
  const costs = quotes.map((q) => q.totalCost);
  return round2(Math.max(...costs) - Math.min(...costs));
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { quote, compare, hiddenCostGap, midRate, getProvider, providers, pairs };
