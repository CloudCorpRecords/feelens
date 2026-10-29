# FeeLens — the true cost of getting paid across borders

**Code-con (Telem AI) hackathon entry.** When a freelancer, creator, or small
business gets paid from another country, the price they are shown is almost
never the price they pay. The real cost hides in three places: a percentage
fee, a fixed fee, and — the silent one — an exchange rate that is quietly
marked up below the mid-market rate. FeeLens puts all three under one lens:
for a single payment it itemizes every slice each provider takes, ranks the
routes cheapest-first, and prints the **hidden-cost gap** — how much more the
priciest route quietly keeps than the cheapest one, on the same money.

On the demo payment ($1,000 USD → INR) that gap is **₹5,895.98**: money that
moves without ever appearing on a fee receipt.

## Build Disclosure

Built by AI agents (Tree / Muse fleet) directed by Rene Turcios
(CloudCorpRecords), for the Code-con hackathon hosted by Telem AI
(Oct 28–30, 2026). Rene set the problem, reviewed the fee model, and owns
the entry; the code, tests, and documentation were produced by his agents
and verified by actually running them (see `examples/demo-output.txt`,
captured from a real run, and the test suite below). FeeLens itself uses no
AI at runtime — the engine is deterministic arithmetic on published fee
schedules, because a cost calculator should give the same answer every time.

## The problem

A client in the US pays a contractor in India $1,000. Depending on the rail
chosen, the contractor receives anywhere from ₹88,123 down to ₹82,227 — a
7.3% swing — yet every provider can truthfully advertise a "low fee," because
most of the difference is not a fee at all. It is the exchange-rate markup,
which appears on no invoice. First-time earners, who can least afford the
leak, are the least likely to know it exists.

## What FeeLens does

- **Quote** one route and see the full anatomy: percentage fee, fixed fee,
  amount actually converted, mid-market rate vs their rate, the FX-markup
  cost as its own line, and total cost as money and as a percentage.
- **Compare** six routes for the same payment, ranked by what the recipient
  actually receives, with the hidden-cost gap called out.
- **Honest by construction:** the engine guarantees
  `recipientGets + totalCost = amount × mid-market rate` for every quote —
  the test suite asserts this invariant across all providers and corridors,
  so no cost can be invented or lost in the math.

## Run it

Requires Node.js 18+. No dependencies, no build step, no network.

```bash
# Compare all routes for one payment
node src/cli.js compare 1000 USD INR

# Itemize a single route
node src/cli.js quote 1000 USD INR paypal

# Run the three demo scenarios plus one itemized route
node src/cli.js demo        # or: npm run demo

# Tests (8 tests: hand-computed cases, the conservation invariant,
# ranking, validation, rendering)
npm test
```

Providers modeled: `wise`, `paypal`, `payoneer`, `remitly`, `swift-bank`,
`cash-agent`. Sample corridors: USD→INR, USD→PHP, USD→MXN, USD→EUR,
USD→GBP, EUR→INR, GBP→INR, EUR→USD, GBP→USD (inverse corridors resolve
automatically).

## Data honesty — read this

`data/providers.json` holds **illustrative published fee schedules**,
collected 2026-10-28 from the providers' public pricing/fee pages, with a
per-provider note and source. Fees vary by corridor, account type, and
promotions, and providers change them; treat the numbers as representative,
never as a quote. `data/rates.json` holds **sample mid-market rates**
recorded 2026-10-28 for demonstration — not live market data. The point of
FeeLens is the anatomy and the comparison, and the math is rate-agnostic:
drop in a live mid-market rate and every figure updates. Both data files
carry their disclaimers inline.

## Technology stack

- Node.js (CommonJS, zero runtime dependencies)
- `node:test` + `node:assert` for the test suite
- Plain JSON data files for provider schedules and rates — auditable and
  editable by anyone who wants to check or correct a figure

## Team

- **Rene Turcios** (CloudCorpRecords) — entrant; problem selection, fee-model
  review, submission
- Built with his AI agent fleet (Muse), disclosed above and in the
  Devpost submission

## License

MIT
