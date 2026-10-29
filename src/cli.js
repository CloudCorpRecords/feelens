'use strict';

const { quote, compare, hiddenCostGap } = require('./calc');

function fmt(n, digits = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function renderQuote(q) {
  const lines = [];
  lines.push(`${q.providerName}`);
  lines.push(`  You send:            ${fmt(q.amount)} ${q.from}`);
  lines.push(`  Percentage fee:     -${fmt(q.percentFee)} ${q.from}`);
  lines.push(`  Fixed fee:          -${fmt(q.fixedFee)} ${q.from}`);
  lines.push(`  Actually converted:  ${fmt(q.converted)} ${q.from}`);
  lines.push(`  Mid-market rate:     1 ${q.from} = ${q.midRate} ${q.to}`);
  lines.push(`  Their rate:          1 ${q.from} = ${fmt(q.providerRate, 4)} ${q.to}  (FX markup cost: ${fmt(q.fxMarkupCost)} ${q.to})`);
  lines.push(`  Recipient gets:      ${fmt(q.recipientGets)} ${q.to}`);
  lines.push(`  TOTAL COST:          ${fmt(q.totalCost)} ${q.to}  (${fmt(q.costPct)}% of the payment)`);
  return lines.join('\n');
}

function renderCompare({ amount, from, to }) {
  const quotes = compare({ amount, from, to });
  const lines = [];
  lines.push(`FeeLens comparison: sending ${fmt(amount)} ${from} -> ${to}`);
  lines.push(`(mid-market value of the payment: ${fmt(quotes[0].grossAtMid)} ${to})`);
  lines.push('');
  lines.push('Provider                                Recipient gets      Total cost   Cost %');
  lines.push('--------------------------------------  ----------------    ----------   ------');
  for (const q of quotes) {
    lines.push(
      `${q.providerName.padEnd(38)}  ${fmt(q.recipientGets).padStart(14)} ${q.to}  ${fmt(q.totalCost).padStart(9)} ${q.to}  ${fmt(q.costPct).padStart(5)}%`
    );
  }
  lines.push('');
  const best = quotes[0];
  const worst = quotes[quotes.length - 1];
  lines.push(`Cheapest route: ${best.providerName} — recipient gets ${fmt(best.recipientGets)} ${to}.`);
  lines.push(`Priciest route: ${worst.providerName} — recipient gets ${fmt(worst.recipientGets)} ${to}.`);
  lines.push(`Hidden-cost gap on this one payment: ${fmt(hiddenCostGap(quotes))} ${to}.`);
  lines.push(`That gap is money that moves without ever appearing on a fee receipt.`);
  return { text: lines.join('\n'), quotes };
}

function usage() {
  return [
    'FeeLens — the true cost of getting paid across borders',
    '',
    'Usage:',
    '  node src/cli.js quote <amount> <FROM> <TO> <provider>',
    '  node src/cli.js compare <amount> <FROM> <TO>',
    '  node src/cli.js demo',
    '',
    'Providers: wise, paypal, payoneer, remitly, swift-bank, cash-agent',
    'Sample corridors: USD->INR, USD->PHP, USD->MXN, USD->EUR, USD->GBP, EUR->USD, GBP->USD (inverses work too)',
    '',
    'Example: node src/cli.js compare 1000 USD INR',
  ].join('\n');
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === 'quote') {
    const [amount, from, to, provider] = rest;
    console.log(renderQuote(quote({ amount: Number(amount), from, to, provider })));
  } else if (cmd === 'compare') {
    const [amount, from, to] = rest;
    console.log(renderCompare({ amount: Number(amount), from, to }).text);
  } else if (cmd === 'demo') {
    const scenarios = [
      { amount: 1000, from: 'USD', to: 'INR' },
      { amount: 500, from: 'USD', to: 'PHP' },
      { amount: 2500, from: 'EUR', to: 'USD' },
    ];
    for (const s of scenarios) {
      console.log(renderCompare(s).text);
      console.log('\n---\n');
    }
    const single = quote({ amount: 1000, from: 'USD', to: 'INR', provider: 'paypal' });
    console.log('One route under the lens (PayPal, 1000 USD -> INR):');
    console.log(renderQuote(single));
  } else {
    console.log(usage());
    if (cmd && cmd !== 'help') process.exitCode = 1;
  }
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { renderQuote, renderCompare };
