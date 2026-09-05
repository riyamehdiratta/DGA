# DGA Recommendations Rules

Source: IEEE Std C57.104-2019, Clause 5.3 ("Context of DGA data interpretation") and Clause 6.1.2 ("DGA status")

This document defines the canonical recommendation-generation rules used by the DTL DGA Analysis System.

The Recommendation Engine must implement this document exactly.

---

# Purpose

The Recommendation Engine does not perform a new diagnosis. It translates results the pipeline has already
computed — DGA Status and the Duval-family fault-zone results — into an engineer-facing severity tier and a
list of recommended actions, per IEEE's status-based guidance in 6.1.2.1–6.1.2.4 and the escalation/
de-escalation carve-outs in 5.3.2.

It is the final engine in the pipeline and depends on all previous results being available.

---

# Mandatory Caveat

IEEE Std C57.104-2019, Clause 5.3, states directly:

> "The recommended action and resampling interval can be based on the fault diagnosis and the verified DGA
> status, plus the use of expert judgment. Because of the potentially serious consequences and high cost of
> misinterpreting transformer test data, an inflexible interpretation, based on an exclusively mechanical
> scoring approach, without the application of expert judgment, is highly inadvisable."

The tier-computation logic below is deterministic and must be implemented exactly as specified — but its
**output** is decision support, not a directive. Every result the engine returns must carry a reasoning line
stating that the recommendation does not replace expert judgment, consultation with the transformer
manufacturer, or company-specific DGA policy. This line must never be omitted.

---

# Inputs

The engine requires:

- **Status** — `StatusResult.status` (`STATUS_1` | `STATUS_2` | `STATUS_3`)
- **Duval fault-zone results** — the zone/diagnosis fields already produced by:
  - Duval Triangle 1 (`DuvalTriangle1Result.zone`)
  - Duval Triangle 4 (`DuvalTriangle4Result.zone`, when present)
  - Duval Triangle 5 (`DuvalTriangle5Result.zone`, when present)
  - Duval Pentagon 1 (`DuvalPentagon1Result.diagnosis`)
  - Duval Pentagon 2 (`DuvalPentagon2Result.diagnosis`)
- **Delta** — `DeltaResult.c2h4.delta` (for the extreme-value check)
- **Current sample** — `c2h6` concentration (for the extreme-value check)

Key Gas and Doernenburg results are **not** used to drive the severity tier (see Implementation Rules) but
may be surfaced elsewhere in the UI alongside this engine's output — that is outside this engine's scope.

No historical samples beyond the already-computed `DeltaResult` are used directly.

---

# Severity Tiers

Five tiers, in increasing order of severity:

```
ROUTINE < MONITOR < INVESTIGATE < URGENT < EXTREME
```

## Step 1 — Base tier from Status (6.1.2.1–6.1.2.3)

| Status | Base tier |
| ------ | --------- |
| STATUS_1 | ROUTINE |
| STATUS_2 | INVESTIGATE |
| STATUS_3 | URGENT |

## Step 2 — Fault-zone carve-outs (5.3.2) — only applied when Status is STATUS_2

**De-escalation.** If Status is STATUS_2 and any Duval-family result above equals `PD`, `T1`, or `S`,
downgrade the tier from `INVESTIGATE` to `MONITOR`. Primary source is 6.1.2.2 ("DGA Status 2"), the more
complete and authoritative clause — it explicitly lists all three:

> "If the fault diagnosis reveals an issue of Partial Discharges (PD), low temperature fault (T1), or stray
> gassing (S), this would be treated as a less urgent issue, but still may affect future life of the
> insulation system." (6.1.2.2)

5.3.2 restates the same carve-out in less complete form (mentions only T1 and S, omitting PD) — 6.1.2.2 is
the one this rule follows.

**Escalation.** If Status is STATUS_2 and any Duval-family result above equals `D2`, `T3`, `T3-H`, or `C`
(paper-carbonization zone), escalate the tier from `INVESTIGATE` to `URGENT`:

> "If there is an indication of high-energy arcing (D2) or a high-temperature thermal fault (T3), or if paper
> insulation appears to be involved in the fault, another analysis step may be prudent. Some users will
> consider extra steps with increased surveillance, as recommended for a unit with a DGA status of 3."
> (5.3.2)

Note the source's own language here is soft and optional ("may be prudent," "some users will consider") —
softer than the de-escalation carve-out above. This rule hardens it into a deterministic escalation because
a mechanical engine cannot implement "may be prudent" as a conditional; this is a simplification made for
implementability, not a literal "must" in the standard.

If both a de-escalation signal and an escalation signal are present simultaneously (different Duval methods
disagreeing), escalation wins — never de-escalate a sample with any indication of D2, T3, T3-H, or C.

Step 2 does not run for STATUS_1 or STATUS_3 — the carve-out is stated only in the context of a STATUS_2
result.

## Step 3 — Extreme override (6.1.2.4) — applied regardless of Status or tier so far

If **either** condition holds, set the tier to `EXTREME`, overriding every prior step:

- `DeltaResult.c2h4.delta > 200` (ppm increase in C2H4 since the previous sample), or
- current sample `c2h6 > 1000` (ppm)

> "For example, if an increase in C2H4 of 200 µL/L (ppm) or a level of C2H6 of 1000 µL/L (ppm) is observed,
> these would be considered extreme... immediate investigation and operating restrictions should be
> initiated." (6.1.2.4)

If `DeltaResult.c2h4.delta` is `null` (no previous sample), only the C2H6 level condition is evaluated.

Note this deliberately narrow scope: 6.1.2.4's actual principle is broader — "gas levels or changes that are
much larger than those provided in Table 2 and Table 3 warrant immediate extra investigation" for *any*
gas — and the C2H4/C2H6 numbers are explicitly introduced as "for example," one illustrative case, not an
exhaustive list. This document only operationalizes the two gases the standard gives concrete numbers for.
It does not attempt to generalize "much larger than Table 2/3" to H2, CH4, C2H2, CO, or CO2, since no
numeric threshold is given for them and inventing one would violate "never hardcode a tier outside the
rules in this document."

---

# Recommended Actions per Tier

| Tier | Actions |
| ---- | ------- |
| ROUTINE | Continue routine operation. Sample per the owner's normal DGA screening protocol. |
| MONITOR | Treat as a lower-urgency issue. Continue monitoring; note that a low-temperature fault (T1) may still affect long-term insulation life. |
| INVESTIGATE | Investigate the probable cause of gas generation. Increase sampling frequency. Consider on-line dissolved gas monitoring. Establish multi-point generation rates if not already available. |
| URGENT | Place the transformer under increased surveillance. Recommend additional transformer testing. Consult the transformer manufacturer or a DGA expert. |
| EXTREME | Recommend immediate investigation, including additional oil analysis and physical/electrical testing. Consider operating restrictions until the cause is dismissed as sampling error or fully understood. |

These action lists are the literal, minimum action set per tier — never invent additional actions not
derivable from this document.

---

# Output

```ts
{
    tier: 'ROUTINE' | 'MONITOR' | 'INVESTIGATE' | 'URGENT' | 'EXTREME';
    actions: string[];
    reasoning: string[];
}
```

`reasoning` must include, at minimum: the base tier and why (Status), any carve-out applied and which
Duval result triggered it, whether the extreme override fired and which condition triggered it, and the
mandatory expert-judgment caveat (always present, regardless of tier).

---

# Implementation Rules

- Never hardcode a tier outside the rules in this document.
- Never use Key Gas or Doernenburg results to drive the severity tier — IEEE's status-based action guidance
  (5.3.2) uses Duval fault-zone vocabulary (`PD`, `T1`, `T2`, `T3`, `D1`, `D2`, `S`) directly; Key Gas and
  Doernenburg use a different label set and are not referenced by this clause of the standard.
- Never use transformer age directly (Status already accounts for it).
- Never compute a new fault diagnosis — this engine only consumes results already produced upstream.
- The extreme-value check (Step 3) always runs and always takes precedence, independent of Status.
- The fault-zone carve-out (Step 2) only applies when Status is STATUS_2.
- The mandatory caveat reasoning line must be present in every result, at every tier.
- All calculations execute on the backend. Frontend only renders the returned tier, actions, and reasoning.

---

# Explicitly Out of Scope

- **Longitudinal reassessment.** IEEE Std C57.104-2019 6.1.2.2/6.1.2.3 both describe a *separate*
  de-escalation path based on a year or more of stable samples with no active gassing — this requires
  tracking DGA history across multiple analyses over time, which is beyond what a single-sample engine can
  determine, and is not implemented by this document.
- **Company-specific policy overrides.** The standard repeatedly defers to "owner's internal policy" and
  "manufacturer's recommendations" — this engine has no such input and does not attempt to model it.

---

# Integration

The Recommendation Engine runs last in the pipeline (ANALYSIS_PIPELINE.md), after Status, Key Gas,
Doernenburg, Duval Triangle, and both Duval Pentagon engines have all produced results. It is the only
engine whose `Depends On` is "all previous results."

---

# IEEE Notes

IEEE Std C57.104-2019 frames the recommended action as a function of DGA status plus fault diagnosis plus
expert judgment — never status or fault diagnosis alone, and never a purely mechanical score. This engine
implements the status- and fault-zone-based portion of that guidance exactly and deterministically, but its
output must always be presented as decision support, not a final determination of transformer condition.
