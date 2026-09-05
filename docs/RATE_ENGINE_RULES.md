# Rate Engine Rules

Source: IEEE Std C57.104-2019

This document defines the canonical generation rate calculation used by the DTL DGA Analysis System.

The Rate Engine must implement this document exactly.

---

# Purpose

The Rate Engine determines whether a transformer is exhibiting active gas generation by computing annualized gas generation rates and comparing them against IEEE Table 4 thresholds.

The Rate Engine does NOT assign DGA Status.

It only computes:

- generation rates
- rate exceedances
- metadata used by the Status Engine

---

# Inputs

The Rate Engine requires:

- Norm Profile
  - LOW_RATIO
  - HIGH_RATIO
  - DEFAULT_HIGH_RATIO

- Historical DGA Samples

Each sample contains:

- Sample Date
- H2
- CH4
- C2H6
- C2H4
- C2H2
- CO
- CO2

Samples must be ordered chronologically.

---

# Threshold Source

Generation rate thresholds come exclusively from:

IEEE_TABLES.md

Table 4

Never hardcode threshold values.

Always use lookup.ts.

---

# Sample Selection

The Rate Engine uses:

- minimum of 3 samples
- maximum of 6 samples

Rules:

If more than six samples exist:

Use the six most recent valid samples.

If fewer than three samples exist:

Rate cannot be computed.

---

# Time Window

The period between the first and last sample used for computation determines whether rate analysis is valid.

Valid period:

4 months
through
24 months

If the total period is less than four months:

Rate is unavailable.

If greater than twenty-four months:

Discard older samples until the window is within 24 months.

---

# Rate Computation

IEEE requires a multi-point linear best-fit calculation.

For each gas independently:

Compute the best-fit straight line through the selected samples.

Independent variable:

Time

Dependent variable:

Gas concentration

The slope of the line is the annual generation rate.

Return:

ppm/year

Do NOT compute using only the last two samples.

Do NOT average consecutive deltas.

Use linear regression.

---

# Gas List

Compute rates independently for:

- H2
- CH4
- C2H6
- C2H4
- C2H2
- CO
- CO2

---

# Table 4 Comparison

For each gas:

Lookup the applicable Table 4 threshold.

Compare:

rate <= threshold

Pass

rate > threshold

Exceedance

Special case:

C2H2

Threshold:

ANY_INCREASING_RATE

Meaning:

Any positive generation rate is considered an exceedance.

---

# Output

The Rate Engine returns:

```ts
{
    periodDays: number;
    periodBucket: 'MONTHS_4_TO_9' | 'MONTHS_10_TO_24' | null;

    rates: {
        h2: number | null;
        ch4: number | null;
        c2h6: number | null;
        c2h4: number | null;
        c2h2: number | null;
        co: number | null;
        co2: number | null;
    };

    exceededThresholds: ExceededThreshold[];

    rateAvailable: boolean;
}
```

---

# ExceededThreshold

```ts
type ExceededThreshold = {
  sourceTable: "TABLE_4";
  gas: string;
  actualValue: number;
  thresholdValue: number | "ANY_INCREASING_RATE";
};
```

---

# Period Bucket Selection

If:

period >= 4 months

AND

period < 10 months

Use:

MONTHS_4_TO_9

If:

period >= 10 months

AND

period <= 24 months

Use:

MONTHS_10_TO_24

Otherwise:

No rate available.

---

# Handling Missing Rates

If rate cannot be computed:

Return:

```ts
rateAvailable = false;
```

All gas rates:

null

No exceedances.

---

# Implementation Rules

- Never hardcode IEEE thresholds.
- Always use lookup.ts.
- DEFAULT_HIGH_RATIO behaves exactly like HIGH_RATIO.
- Compute rates independently for every gas.
- Use identical sample windows for all gases.
- Ignore gases with insufficient data only if the sample itself is invalid.
- All calculations execute on the backend.
- Frontend only renders API results.

---

# Integration

The Status Engine consumes the Rate Engine.

Status Engine must never compute generation rates itself.

The Rate Engine is responsible only for:

- selecting samples
- computing annualized rates
- determining Table 4 exceedances

Status assignment is handled separately by the Status Engine.

---

# IEEE Compliance Notes

The implementation must follow IEEE C57.104-2019:

- Multi-point (3–6 point) analysis
- Linear best-fit regression
- 4–24 month evaluation window
- Six most recent valid samples maximum
- Table 4 thresholds based on Norm Profile and Period Bucket
- Any positive C2H2 generation rate is considered an exceedance
