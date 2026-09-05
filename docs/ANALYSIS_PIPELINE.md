# ANALYSIS_PIPELINE.md

# Purpose

This document defines the complete analysis pipeline used by the DTL DGA Analysis System.

It specifies:

- Engine execution order
- Engine inputs
- Engine outputs
- Engine dependencies
- AnalysisResult construction

All analysis engines must follow this execution order.

---

# Pipeline Overview

```
Current DGA Sample
        │
        ▼
Norm Profile Selection
        │
        ▼
Delta Engine
        │
        ▼
Rate Engine
        │
        ▼
Status Engine
        │
        ▼
Key Gas Engine
        │
        ▼
Doernenburg Ratio Engine
        │
        ▼
Duval Triangle Engine
        │
        ▼
Duval Pentagon 1 Engine
        │
        ▼
Duval Pentagon 2 Engine
        │
        ▼
Recommendation Engine
        │
        ▼
AnalysisResult
```

---

# Engine Responsibilities

## 1. Norm Profile Engine

### Inputs

- O2
- N2

### Output

```ts
NormProfile;
```

Possible values

- LOW_RATIO
- HIGH_RATIO
- DEFAULT_HIGH_RATIO

---

## 2. Delta Engine

Purpose

Calculate change between current and previous sample.

Inputs

- Current sample
- Previous sample

Output

```ts
DeltaResult;
```

---

## 3. Rate Engine

Purpose

Calculate annualized gas generation rates.

Inputs

- Current sample
- Previous sample

Output

```ts
RateResult;
```

Uses

- IEEE Table 4

---

## 4. Status Engine

Purpose

Determine STATUS_1 / STATUS_2 / STATUS_3.

Inputs

- Current gases
- DeltaResult
- RateResult
- NormProfile
- Transformer Age

Uses

- IEEE_TABLES.md
- IEEE_STATUS_LOGIC.md

Output

```ts
StatusResult;
```

---

## 5. Key Gas Engine

Purpose

Determine dominant gas and probable fault.

Uses

KEY_GAS_RULES.md

Output

```ts
KeyGasResult;
```

---

## 6. Doernenburg Ratio Engine

Purpose

Calculate diagnostic ratios.

Uses

DOERNENBURG_RATIO_RULES.md

Output

```ts
DoernenburgResult;
```

---

## 7. Duval Triangle Engine

Purpose

Primary ternary fault diagnosis.

Uses

DUVAL_TRIANGLE_RULES.md

Output

```ts
DuvalTriangleResult;
```

---

## 8. Duval Pentagon 1 Engine

Purpose

Five-gas fault diagnosis.

Uses

DUVAL_PENTAGON_1_RULES.md

Output

```ts
DuvalPentagon1Result;
```

---

## 9. Duval Pentagon 2 Engine

Purpose

Fault refinement.

Uses

DUVAL_PENTAGON_2_RULES.md

Output

```ts
DuvalPentagon2Result;
```

---

## 10. Recommendation Engine

Purpose

Generate engineer-facing recommendations.

Uses

DGA_RECOMMENDATIONS.md

Output

```ts
RecommendationResult;
```

---

# Final AnalysisResult

The pipeline produces

```ts
AnalysisResult {
    normProfile
    deltaResult
    rateResult

    statusResult

    keyGasResult

    doernenburgResult

    duvalTriangleResult

    duvalPentagon1Result

    duvalPentagon2Result

    recommendationResult
}
```

---

# Engine Dependencies

| Engine         | Depends On           |
| -------------- | -------------------- |
| Norm Profile   | O2, N2               |
| Delta          | Previous Sample      |
| Rate           | Previous Sample      |
| Status         | Norm, Delta, Rate    |
| Key Gas        | Current Sample       |
| Doernenburg    | Current Sample       |
| Triangle       | Current Sample       |
| Pentagon 1     | Current Sample       |
| Pentagon 2     | Current Sample       |
| Recommendation | All previous results |

---

# Execution Rules

- Execute engines in pipeline order.
- Do not execute engines in parallel if dependencies exist.
- Every engine must be deterministic.
- Engines must not modify previous results.
- Engines communicate only through AnalysisResult.

---

# Implementation Rules

- IEEE threshold values must never be hardcoded.
- IEEE_TABLES.md is the single source of truth.
- Each engine is independently testable.
- Business logic belongs in the backend.
- Frontend only renders results.

---

# References

- IEEE_TABLES.md
- IEEE_STATUS_LOGIC.md
- RATE_ENGINE_RULES.md
- KEY_GAS_RULES.md
- DOERNENBURG_RATIO_RULES.md
- DUVAL_TRIANGLE_RULES.md
- DUVAL_PENTAGON_1_RULES.md
- DUVAL_PENTAGON_2_RULES.md
- DGA_RECOMMENDATIONS.md
