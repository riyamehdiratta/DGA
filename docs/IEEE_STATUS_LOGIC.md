# IEEE Status Logic

Source: IEEE C57.104-2019

This document defines the canonical status determination logic used by the DTL DGA Analysis System.

The Status Engine must implement this document exactly.

---

## Inputs

The Status Engine requires:

* Norm Profile

  * LOW_RATIO
  * HIGH_RATIO
  * DEFAULT_HIGH_RATIO

* Transformer Age Category

  * UNKNOWN
  * YEARS_1_TO_9
  * YEARS_10_TO_30
  * YEARS_OVER_30

* Current Gas Concentrations

  * H2
  * CH4
  * C2H6
  * C2H4
  * C2H2
  * CO
  * CO2

* Delta Values

  * H2 Delta
  * CH4 Delta
  * C2H6 Delta
  * C2H4 Delta
  * C2H2 Delta
  * CO Delta
  * CO2 Delta

* Generation Rates

  * H2 Rate
  * CH4 Rate
  * C2H6 Rate
  * C2H4 Rate
  * C2H2 Rate
  * CO Rate
  * CO2 Rate

---

## Threshold Sources

### Table 1

90th percentile gas concentration thresholds.

Source:
IEEE_TABLES.md → TABLE 1

Used for STATUS_1 evaluation.

---

### Table 2

95th percentile gas concentration thresholds.

Source:
IEEE_TABLES.md → TABLE 2

Used for STATUS_3 evaluation.

---

### Table 3

95th percentile delta thresholds.

Source:
IEEE_TABLES.md → TABLE 3

Used for STATUS_1 evaluation.

---

### Table 4

95th percentile generation rate thresholds.

Source:
IEEE_TABLES.md → TABLE 4

Used for STATUS_1 and STATUS_3 evaluation.

---

# STATUS_1

Assign STATUS_1 when ALL of the following are true:

* Every gas concentration is less than or equal to its applicable Table 1 threshold.
* Every delta value is less than or equal to its applicable Table 3 threshold.
* Every generation rate is less than or equal to its applicable Table 4 threshold.

Formal definition:

STATUS_1 =
(All Gases <= Table 1)
AND
(All Deltas <= Table 3)
AND
(All Rates <= Table 4)

Meaning:

Normal operation.

Continue routine monitoring and normal DGA sampling practices.

---

# STATUS_3

If STATUS_1 is not satisfied, evaluate STATUS_3.

Assign STATUS_3 when ANY of the following are true:

* Any gas concentration exceeds its applicable Table 2 threshold.
* Any generation rate exceeds its applicable Table 4 threshold.

Formal definition:

STATUS_3 =
(Any Gas > Table 2)
OR
(Any Rate > Table 4)

Meaning:

Potential concern.

Perform fault identification and transformer assessment.

Take action according to engineering judgement and company policy.

---

# STATUS_2

Assign STATUS_2 when:

* STATUS_1 is false
  AND
* STATUS_3 is false

Formal definition:

STATUS_2 =
NOT STATUS_1
AND
NOT STATUS_3

Meaning:

Increased transformer surveillance.

Increase DGA sampling frequency and continue monitoring.

---

# Known Simplifications vs. IEEE Std C57.104-2019 (audit findings C4, M1)

## 1. No confirmation-sample workflow (C4 — Critical)

IEEE Std C57.104-2019, Clause 6.1.1 (Steps 4a–4e), describes a two-stage confirmation-sample workflow
for the specific case where gas *concentrations* are still within Table 1 but a delta or rate exceeds
Table 3/4 on a single reading:

1. A confirmation sample should be taken within a month.
2. If the confirmation sample does **not** reproduce the increase, status remains STATUS_1 (Step 4d).
3. Only if the confirmation sample **confirms** the increase does status become STATUS_2 (Step 4e).

This document — and the Status Engine that implements it — intentionally does **not** model this. The
formal `STATUS_1`/`STATUS_2` definitions above are a single-shot, stateless evaluation of one sample:
any Table 3/4 exceedance immediately fails STATUS_1, with no confirmation step. This is a real, known gap
in fidelity to the standard, not an oversight — implementing the actual two-stage procedure would require
tracking "pending confirmation" state across samples (which sample is the reference, a ~1 month timing
window, etc.), which is an architecture change beyond a single-sample engine.

This is a deliberate, currently-accepted scope decision. The Status Engine's behavior is unchanged by this
note — it still evaluates exactly as defined above.

## 2. No O2/N2-near-0.2 hysteresis handling (M1 — Minor)

IEEE Std C57.104-2019, Clause 6.1.1, Step 3, includes this note on Norm Profile selection:

> "When the O2/N2 ratio is near 0.2, it could happen that successive DGA test results change back and
> forth between <0.2 and >0.2 due to intrinsic DGA variability. In such cases it is recommended to use
> the >0.2 section."

This is a soft "recommended" (not a "must"), and detecting "successive results changing back and forth"
requires comparing the current sample's O2/N2 ratio against prior samples' ratios — trend detection across
multiple samples, not a single-sample computation. Neither `IEEE_TABLES.md`'s Norm Profile mapping nor the
Status Engine implements this hysteresis behavior: `selectNormProfile` classifies every sample independently
as `ratio <= 0.2 ? LOW_RATIO : HIGH_RATIO` with no memory of previous samples' ratios. A transformer whose
O2/N2 sits right at the 0.2 boundary could therefore flip between LOW_RATIO and HIGH_RATIO tables from one
sample to the next, exactly the oscillation the standard recommends damping. This is an accepted, documented
scope decision, not an oversight.

---

# Evaluation Order

The Status Engine must evaluate conditions in this exact order:

1. Evaluate STATUS_1.
2. If STATUS_1 is true, stop.
3. Evaluate STATUS_3.
4. If STATUS_3 is true, stop.
5. Otherwise assign STATUS_2.

---

# Output

The Status Engine must return:

```ts
{
  status: 'STATUS_1' | 'STATUS_2' | 'STATUS_3',
  reasoning: string[],
  exceededThresholds: ExceededThreshold[]
}
```

Where:

```ts
type ExceededThreshold = {
  sourceTable: 'TABLE_1' | 'TABLE_2' | 'TABLE_3' | 'TABLE_4';
  gas: string;
  actualValue: number;
  thresholdValue: number | 'ANY_INCREASE';
};
```

---

# Implementation Rules

* Never hardcode threshold values.
* Always use lookup.ts.
* DEFAULT_HIGH_RATIO must behave exactly like HIGH_RATIO.
* Transformer age affects:

  * Table 1
  * Table 2
* Transformer age does not affect:

  * Table 3
  * Table 4
* C2H2 special handling:

  * ANY_INCREASE must be treated as a threshold exceedance whenever the increase is greater than zero.
* All calculations must execute on the backend.
* Frontend must only render results.
