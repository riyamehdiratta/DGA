# Doernenburg Ratio Rules

Source: IEEE Std C57.104-2019

This document defines the canonical Doernenburg Ratio Method used by the DTL DGA Analysis System.

The Doernenburg Ratio Engine must implement this document exactly.

---

# Purpose

The Doernenburg Ratio Method is a ratio-based diagnostic technique used to identify the probable fault type in a transformer based on relationships between combustible gases.

It is one of several fault-identification methods and should not be used as the sole diagnostic technique.

---

# Inputs

The engine requires the current DGA sample.

Required gases:

- H2
- CH4
- C2H6
- C2H4
- C2H2

Gas concentrations are expressed in ppm (µL/L).

Historical samples are not required.

---

# Ratio Definitions

The engine computes four gas ratios.

## Ratio 1 (R1)

CH4 / H2

---

## Ratio 2 (R2)

C2H2 / C2H4

---

## Ratio 3 (R3)

C2H2 / CH4

---

## Ratio 4 (R4)

C2H6 / C2H2

---

# Threshold Source Note (audit finding M4)

IEEE Std C57.104-2019's Doernenburg table (Table D.2) actually defines **two parallel sets** of numeric
thresholds per ratio: one for gas dissolved in **mineral oil** and a separate, different-valued one for gas
measured in **gas space** (headspace/relay-gas analysis, e.g. a Buchholz relay). For example, the standard's
"Thermal decomposition" row gives R1 > 1.0 for the mineral-oil column but R1 > 0.1 for the gas-space column
— a different measurement basis entirely, not a rounding variant.

All thresholds in the "Fault Classification" section below are the **mineral oil** column, deliberately
chosen because this whole project operates exclusively on dissolved-gas-in-oil concentrations (ppm in oil),
never gas-space/headspace measurements. Every number below has been verified against that column exactly.
The gas-space column is out of scope and not implemented — if you ever cross-reference Table D.2 directly
and see different numbers there, that's the gas-space column, not an error in this document.

---

# Fault Classification

The calculated ratios are compared against the IEEE decision matrix.

## Thermal Decomposition

Conditions:

- R1 > 1.0
- R2 < 0.75
- R3 < 0.3
- R4 > 0.4

Diagnosis:

THERMAL_DECOMPOSITION

---

## Corona (Low Intensity Partial Discharge)

Conditions:

- R1 < 0.1
- R2 not significant
- R3 < 0.3
- R4 > 0.4

Diagnosis:

CORONA

---

## Arcing (High Intensity Partial Discharge)

Conditions:

- 0.1 < R1 < 1.0
- R2 > 0.75
- R3 > 0.3
- R4 < 0.4

Diagnosis:

ARCING

---

# Output

```ts
{
    diagnosis:
        | 'THERMAL_DECOMPOSITION'
        | 'CORONA'
        | 'ARCING'
        | 'INCONCLUSIVE';

    ratios: {
        r1: number | null;
        r2: number | null;
        r3: number | null;
        r4: number | null;
    };

    reasoning: string[];
}
```

---

# Division Rules

When calculating ratios:

- Division by zero must not throw an exception.
- If the denominator is zero, return null for that ratio.
- Null ratios prevent matching any diagnosis requiring that ratio.

---

# Matching Rules

The engine must evaluate all ratio conditions required for a diagnosis.

A diagnosis is valid only if every required ratio condition is satisfied.

If no diagnosis matches exactly:

Return:

INCONCLUSIVE

---

# Limitations

According to IEEE C57.104-2019:

- The Doernenburg Ratio Method is a historic method.
- It is used less frequently in modern transformer diagnostics.
- It has limitations similar to the Rogers Ratio Method.
- Results should always be interpreted together with:
  - Status Engine
  - Key Gas Method
  - Duval methods

The engine should therefore return diagnostic information only and should not determine the final transformer condition.

---

# Implementation Rules

- Never hardcode fault logic outside this document.
- Use only the current DGA sample.
- Never use historical samples.
- Never use delta values.
- Never use generation rates.
- Never depend on transformer age.
- Never depend on the Norm Profile.
- Perform safe floating-point division.
- All calculations execute on the backend.

---

# Integration

The Doernenburg Ratio Engine executes independently of:

- Status Engine
- Rate Engine
- Key Gas Engine

Its output is combined with other diagnostic methods by the Analysis Pipeline.

---

# IEEE Notes

IEEE identifies this as a historical diagnostic method.

It remains useful as a supporting diagnostic technique but should not be relied upon as the sole fault-identification method.
