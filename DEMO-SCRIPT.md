# FeeLens — demo script (~2 minutes)

Terminal recording of real runs. No narration track; on-screen text carries
the story. All output is the program's actual output (also saved verbatim in
`examples/demo-output.txt`).

## Shot list

1. **Title card** (4s): "FeeLens — the true cost of getting paid across
   borders. A Code-con entry by CloudCorpRecords."
2. **The problem** (10s): text card — "A client pays $1,000. How much
   arrives? It depends on the rail — and most of the difference is not a
   fee. It is the exchange rate, marked down in silence."
3. **Run 1** (~35s): `node src/cli.js compare 1000 USD INR` — scroll the
   ranked table; pause on the verdict lines: cheapest ₹88,123.45 vs priciest
   ₹82,227.47, hidden-cost gap ₹5,895.98.
4. **Run 2** (~20s): `node src/cli.js quote 1000 USD INR paypal` — the
   itemized anatomy of one route; the FX-markup line (₹2,543.12) is the
   number no receipt shows.
5. **Run 3** (~20s): `node src/cli.js compare 500 USD PHP` — a second
   corridor; even the "cheap" rails differ by ₱2,828.68 on a $500 payment.
6. **Proof it is honest** (~15s): `npm test` — 8/8 pass, including the
   conservation invariant (recipient + cost = payment × mid-market rate)
   across every provider and corridor.
7. **Close** (6s): "FeeLens. Same payment. Same day. Up to 7.3% apart.
   Know what the rail keeps. github.com/CloudCorpRecords/feelens"
