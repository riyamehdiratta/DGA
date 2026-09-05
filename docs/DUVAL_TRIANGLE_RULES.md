# Duval Triangles 1, 4, and 5 — DGA Fault Diagnosis Reference

Based on IEEE Std C57.104-2019, Annex D.4 (Duval Triangles 1, 4, and 5 Methods).

---

## 1. Common Ternary Percentage Calculation

All three triangles (1, 4, 5) share the same underlying calculation. Given three gas concentrations in µL/L (ppm) — call them `x`, `y`, `z` (the specific gases differ per triangle, see below) — compute the relative percentages that become the ternary plot coordinates:

```
sum = x + y + z

%gasA = 100 * x / sum
%gasB = 100 * y / sum
%gasC = 100 * z / sum

```

These three relative percentages (which always sum to 100%) are the coordinates of the DGA point on the corresponding triangle. The fault zone is then determined by looking up which region of the triangle contains that point (see the boundary tables below).


| Triangle   | Gas x | Gas y | Gas z |
| ---------- | ----- | ----- | ----- |
| Triangle 1 | C₂H₂  | C₂H₄  | CH₄   |
| Triangle 4 | H₂    | CH₄   | C₂H₆  |
| Triangle 5 | CH₄   | C₂H₄  | C₂H₆  |


---

## 2. Triangle 1

### 2.1 Algorithm

1. Input: CH₄, C₂H₄, C₂H₂ concentrations (ppm).
2. Compute `sum = CH₄ + C₂H₄ + C₂H₂`.
3. Compute relative percentages:
  - `%CH4 = 100 * CH4 / sum`
  - `%C2H4 = 100 * C2H4 / sum`
  - `%C2H2 = 100 * C2H2 / sum`
4. Evaluate the percentages against the boundary conditions in Table 6, in the order given (PD → T1 → T2 → T3 → DT → D1 → D2), returning the first zone whose conditions are satisfied.
5. Output the matched fault zone code (PD, T1, T2, T3, DT, D1, or D2).

### 2.2 Fault Zone Boundary Table (Table 6)


| Fault | %CH₄ | %C₂H₄         | %C₂H₂         |
| ----- | ---- | ------------- | ------------- |
| PD    | ≥ 98 | —             | —             |
| T1    | < 98 | < 20          | < 4           |
| T2    | —    | ≥ 20 and < 50 | < 4           |
| T3    | —    | ≥ 50          | < 15          |
| DT    | —    | < 50          | ≥ 4 and < 13  |
| DT    | —    | ≥ 40 and < 50 | ≥ 13 and < 29 |
| DT    | —    | ≥ 50          | ≥ 15 and < 29 |
| D1    | —    | < 23          | ≥ 13          |
| D2    | —    | ≥ 23          | ≥ 29          |
| D2    | —    | ≥ 23 and < 40 | ≥ 13 and < 29 |


> A fault (DT, D2) can be reached by any one of its listed alternative rows (they are OR'd conditions, not simultaneous constraints).

---

## 3. Triangle 4

Used only to get more detail on faults already classified as **PD, T1, or T2** by Triangle 1. Distinguishes minor faults (S, O, PD, R) from carbonization-risk fault C. Fault R appears only at the apex (100% H₂).

### 3.1 Algorithm

1. Input: H₂, CH₄, C₂H₆ concentrations (ppm).
2. Compute `sum = H2 + CH4 + C2H6`.
3. Compute relative percentages:
  - `%H2 = 100 * H2 / sum`
  - `%CH4 = 100 * CH4 / sum`
  - `%C2H6 = 100 * C2H6 / sum`
4. Evaluate against Table D.3 boundary conditions in order (PD → S → O → C → ND), returning the first satisfied zone.
5. Output the matched fault zone code (PD, S, O, C, or ND).

### 3.2 Fault Zone Boundary Table (Table D.3)


| Fault | %H₂  | %CH₄          | %C₂H₆         |
| ----- | ---- | ------------- | ------------- |
| PD    | —    | ≥ 2 and < 15  | < 1           |
| S     | ≥ 9  | —             | ≥ 30 and < 46 |
| S     | ≥ 15 | —             | ≥ 24 and < 30 |
| S     | —    | < 36          | ≥ 1 and < 24  |
| S     | —    | < 36 and ≥ 15 | < 1           |
| S     | —    | < 2           | < 1           |
| O     | < 9  | —             | ≥ 30          |
| C     | —    | ≥ 36          | ≥ 24          |
| C     | < 15 | —             | ≥ 24 and < 30 |
| ND    | ≥ 9  | —             | ≥ 46          |


---

## 4. Triangle 5

Used only to get more detail on faults already classified as **T2 or T3** by Triangle 1. Distinguishes high-temperature faults T3/T2 (mineral-oil only, lower concern) from carbonization-risk fault C.

### 4.1 Algorithm

1. Input: CH₄, C₂H₄, C₂H₆ concentrations (ppm).
2. Compute `sum = CH4 + C2H4 + C2H6`.
3. Compute relative percentages:
  - `%CH4 = 100 * CH4 / sum`
  - `%C2H4 = 100 * C2H4 / sum`
  - `%C2H6 = 100 * C2H6 / sum`
4. Evaluate against Table D.4 boundary conditions in order (PD → O → S → T2 → T3 → C → ND), returning the first satisfied zone.
5. Output the matched fault zone code (PD, O, S, T2, T3, C, or ND).

### 4.2 Fault Zone Boundary Table (Table D.4)


| Fault | %CH₄ | %C₂H₄         | %C₂H₆         |
| ----- | ---- | ------------- | ------------- |
| PD    | —    | < 1           | ≥ 2 and < 14  |
| O     | —    | ≥ 1 and < 10  | ≥ 2 and < 14  |
| O     | —    | < 1           | < 2           |
| O     | —    | < 10          | ≥ 54          |
| S     | —    | < 10          | ≥ 14 and < 54 |
| T2    | —    | ≥ 10 and < 35 | < 12          |
| T3    | —    | ≥ 35          | < 12          |
| T3    | —    | ≥ 50          | ≥ 12 and < 14 |
| T3    | —    | ≥ 70          | ≥ 14          |
| T3    | —    | ≥ 35          | ≥ 30          |
| C     | —    | ≥ 10 and < 50 | ≥ 12 and < 14 |
| C     | —    | ≥ 10 and < 70 | ≥ 14 and < 30 |
| ND    | —    | ≥ 10 and < 35 | ≥ 30          |


---

## 5. IEEE Usage Restrictions

Per IEEE Std C57.104-2019:

- **Triangle 1 always returns a diagnosis** (it is a "closed" system, unlike 2-gas ratio methods). Because of this, it should only be used to *identify* a fault type when other evidence already indicates a fault is likely present. A zone match is not, by itself, confirmation that a fault exists.
- **Do not use Triangle 1 (or the Rogers Ratio Method) on samples with very low gas levels** — results can be unreliable and inaccurate at low concentrations.
- **Triangle 4 and Triangle 5 must never be used for faults that Triangle 1 identified as electrical faults (D1 or D2).** They are thermal/PD refinement tools only.
- **Triangle 4** may only be used when Triangle 1 first identified the fault as **PD, T1, or T2**.
- **Triangle 5** may only be used when Triangle 1 first identified the fault as **T2 or T3**.
- A DGA point landing in zone **C** (Triangle 4 or 5) indicates a *possibility* of paper carbonization, not certainty — further investigation using carbon oxides and furans analysis should be undertaken.
- This reference reproduces IEEE Std C57.104-2019 fault-zone boundary values for internal engineering/implementation use. The original standard is copyrighted by IEEE; consult the official standard for authoritative figures, diagrams, and full explanatory text before using this in a regulated or published context.

---

## 6. Implementation Rules

- **Check order matters.** The boundary tables are not mutually exclusive partitions expressed as clean non-overlapping ranges — evaluate conditions in the order listed per triangle (as in the algorithms above) and return the **first** zone whose condition set is fully satisfied.
- **OR-groups.** Where a fault has multiple rows in a table (e.g., DT, D2 in Table 6; S, C in Table D.3; T3, O, C in Table D.4), those rows are alternative (OR'd) conditions — satisfying any one row is sufficient to assign that fault.
- **Boundary inequalities are exact.** Use `≥`/`<` (or `≥`/`≤` where the table says "and <") exactly as written — do not round percentages before comparison.
- **Percentages must sum to 100%** (within floating-point tolerance) since they are computed from a single 3-gas ratio. Validate this as a sanity check after computing `%A + %B + %C`.
- **Triangle selection is sequential**, not independent:
  1. Always run Triangle 1 first.
  2. If result ∈ {PD, T1, T2} → optionally run Triangle 4 for refinement.
  3. If result ∈ {T2, T3} → optionally run Triangle 5 for refinement.
  4. If result ∈ {D1, D2, DT} → do not run Triangle 4 or 5.
- **Never silently default.** If no zone condition matches (should not normally happen given closed partitioning, but can occur due to data entry errors or floating-point edge effects at boundaries), surface this as an explicit "unclassified" result rather than guessing.

---

## 7. Output DTO

Suggested JSON structure for a single triangle evaluation result:

```json
{
  "triangle": "1",
  "input_gases_ppm": {
    "CH4": 25,
    "C2H4": 15,
    "C2H2": 10
  },
  "percentages": {
    "CH4": 50.0,
    "C2H4": 30.0,
    "C2H2": 20.0
  },
  "fault_zone": "D2",
  "fault_description": "High-energy electrical discharge / arcing",
  "matched_rule": {
    "gas": "C2H4",
    "condition": ">= 23",
    "secondary_gas": "C2H2",
    "secondary_condition": ">= 29"
  },
  "warnings": [],
  "refinement_recommended": null
}

```

For a chained evaluation (Triangle 1 followed by Triangle 4 or 5):

```json
{
  "triangle_1": {
    "percentages": { "CH4": 96.0, "C2H4": 3.0, "C2H2": 1.0 },
    "fault_zone": "T1"
  },
  "refinement": {
    "triangle": "4",
    "reason": "Triangle 1 result T1 permits Triangle 4 refinement",
    "input_gases_ppm": { "H2": 5, "CH4": 90, "C2H6": 5 },
    "percentages": { "H2": 5.0, "CH4": 90.0, "C2H6": 5.0 },
    "fault_zone": "C",
    "fault_description": "Possible carbonization of paper — further investigation recommended"
  }
}

```

Field notes:

- `fault_zone`: one of the codes defined per triangle (see Annex C referenced in the source standard for full fault-type definitions).
- `matched_rule`: optional, useful for debugging/audit trails — records which table row triggered the classification.
- `warnings`: populate with strings such as `"low_gas_levels"` or `"near_boundary"` (see Edge Cases below).
- `refinement_recommended`: `"triangle_4"`, `"triangle_5"`, or `null`.

---

## 8. Edge Cases

- **All three gas concentrations are zero.** `sum = 0` causes division by zero when computing percentages. Reject the input or return an explicit "insufficient data" result rather than propagating `NaN`/`Infinity`.
- **Negative or missing gas values.** Treat as invalid input; do not coerce to zero silently, since that would distort the ternary percentages.
- **Very low absolute gas levels.** Even if the ratios compute cleanly, the standard cautions that Triangle 1 (and Rogers Ratio) results are unreliable at very low concentrations. Flag results with a warning when total gas volume is below a reasonable detection/reliability threshold, rather than presenting the fault zone with full confidence.
- **Point falls exactly on a boundary line.** Because inequalities are a mix of `≥`/`<`, exact boundary values resolve deterministically to one adjacent zone as written — but floating-point rounding of the input percentages could push a true boundary case to the wrong side. Consider comparing with a small epsilon tolerance and flagging near-boundary results (e.g., within 0.1–0.5% of a threshold) as lower-confidence.
- **Triangle 4/5 requested for a D1/D2/DT Triangle-1 result.** This combination is explicitly disallowed by the standard — reject the refinement request (or return a validation error) rather than computing a meaningless answer.
- **Result lands in zone C.** This is not itself an error, but per the usage restrictions it should always be surfaced with the "possible carbonization, not certainty — investigate further" caveat rather than presented as a final diagnosis.
- **Overlapping OR-row ambiguity.** In principle a point could satisfy the row conditions for two different faults if the input matches multiple rows across different fault labels due to a data error; since rows are evaluated in a fixed fault order per the algorithms above, the first match in that order wins — log this situation if detected, since it usually signals bad input rather than a genuine dual classification.

---

## 9. Integration Notes

- **Sequencing with a UI or reporting pipeline:** run Triangle 1 unconditionally for every DGA sample; only offer/trigger Triangle 4 or 5 refinement when the Triangle 1 result qualifies (see Implementation Rules §6), and grey out or hide the non-applicable refinement option (e.g., hide "Refine with Triangle 5" when Triangle 1 returned D1).
- **Do not treat Triangle 1 output as a final maintenance recommendation** — downstream logic (alarms, work orders, etc.) should combine the fault zone with other DGA context (gas trend over time, absolute concentrations, other IEEE C57.104-2019 methods) rather than acting on the triangle result alone.
- **Historical trending:** since a key advantage of Duval Triangle 1 is visualizing fault evolution over time, store each sample's ternary coordinates (not just the final zone label) so a time series of points can be plotted on the triangle in a UI.
- **Shared calculation code:** because all three triangles use the identical percentage-calculation formula (§1), implement it once as a shared utility function parameterized by the three input gas values, rather than duplicating it per triangle.
- **Versioning:** tie the boundary tables to the specific edition of the standard (IEEE Std C57.104-2019) in code/config, since fault-zone boundaries have changed between editions historically and may change again in future revisions.

