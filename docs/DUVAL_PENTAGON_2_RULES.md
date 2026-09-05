# Duval Pentagon 2 Rules

Source: IEEE Std C57.104-2019, Annex D.5

This document defines the canonical Duval Pentagon 2 fault identification method used by the DTL DGA Analysis System.

The Duval Pentagon 2 Engine must implement this document exactly.

---

# 1. Purpose

Duval Pentagon 2 is an extension of Duval Pentagon 1.

It is intended for refining fault diagnosis by distinguishing fault sub-types and mixed faults.

The coordinate calculation is identical to Duval Pentagon 1.

Only the fault zones differ.

Pentagon 2 uses the same five hydrocarbon gases, at the same summits, in the same clockwise order of increasing fault energy, as Pentagon 1.

---

# 2. Inputs

Exactly the same as Pentagon 1.

```
H2
CH4
C2H6
C2H4
C2H2
```

Gas concentrations are expressed in ppm (µL/L).

Historical samples are not required.

---

# 3. Coordinate Algorithm

Do NOT duplicate the coordinate transformation.

```
Coordinate generation SHALL follow the algorithm defined in

DUVAL_PENTAGON_1_RULES.md

This includes:

• Percentage calculation

• Cartesian projection

• Polygon centroid

• Point generation

No changes are made to the coordinate algorithm.
```

---

# 4. Fault Zones

| Zone     | Meaning                                           | Interpretation                                                                                                                                                                                                                             |
| -------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PD**   | Partial Discharge                                 | Electrical fault of the discharge type not involving a full arc — localized ionization of gas pockets (voids, bubbles) in insulation. Low energy, no carbonization.                                                                        |
| **D1**   | Low-energy electrical discharge (sparking)        | Electrical fault involving low-energy sparking discharges. May produce carbon particles in oil but limited energy release.                                                                                                                 |
| **D2**   | High-energy electrical discharge (arcing)         | Electrical fault involving high-energy arcing. Indicates a more severe electrical fault with potential for significant power follow-through and damage.                                                                                    |
| **S**    | Stray Gassing                                     | Not a fault. Gas produced by the mineral oil itself under normal, low-temperature service conditions (typically below ~200 °C), without any localized thermal or electrical fault present. Included to prevent false-positive fault calls. |
| **O**    | Low-temperature thermal fault (oil only)          | Thermal degradation of the mineral oil at relatively low overheating temperatures, not involving paper insulation. Lower severity than C or T3-H.                                                                                          |
| **C**    | Possible carbonization of paper                   | Thermal fault zone indicating overheating that may involve the solid (paper/cellulose) insulation, with possible carbonization. A result here is a _possibility_, not a certainty — see IEEE Notes.                                        |
| **T3-H** | High-temperature thermal fault (mineral oil only) | Thermal fault at high temperature (>300 °C) confined to the mineral oil, without involvement of paper insulation. "H" = _Huile_ (French for oil).                                                                                          |

Pentagon 2 does not report T1, T2, or T3 directly — those Pentagon 1 labels are resolved into S, O, C, or T3-H by this method.

---

# 5. Zone Coordinates

```
PD
(0,33)
(-1,33)
(-1,24.5)
(0,24.5)

D1
(0,40)
(38,12)
(32,-6.1)
(4,16)
(0,1.5)

D2
(4,16)
(32,-6.1)
(24.3,-30)
(0,-3)
(0,1.5)

S
(0,1.5)
(-35,3.1)
(-38,12.4)
(0,40)
(0,33)
(-1,33)
(-1,24.5)
(0,24.5)

O
(-3.5,-3)
(-11,-8)
(-21.5,-32.4)
(-23.5,-32.4)
(-35,3.1)
(0,1.5)
(0,-3)

C
(-3.5,-3)
(2.5,-32.4)
(-21.5,-32.4)
(-11,-8)

T3-H
(0,-3)
(24.3,-30)
(23.5,-32.4)
(2.5,-32.4)
(-3.5,-3)
```

---

# 6. Classification Algorithm

```
Read gases

↓

Calculate percentages

↓

Generate centroid

↓

Point-in-polygon

↓

Return diagnosis
```

The engine shall:

1. Read the five gas concentrations.
2. Convert concentrations into relative percentages.
3. Compute the Duval Pentagon centroid using the shared coordinate algorithm (Section 3).
4. Test the centroid against each polygon (PD, D1, D2, S, O, C, T3-H) in a point-in-polygon test.
5. Return the corresponding fault zone, or `OUTSIDE` if no polygon contains the point.

---

# 7. Output DTO

```ts
{
    diagnosis:
        | 'PD'
        | 'D1'
        | 'D2'
        | 'S'
        | 'O'
        | 'C'
        | 'T3-H'
        | 'OUTSIDE';

    coordinates: {
        x: number;
        y: number;
    };

    reasoning: string[];

    matchedZone: string | null;
}
```

---

# 8. IEEE Notes

IEEE Std C57.104-2019 explains that Duval Pentagon 2 is a complementary refinement to Duval Pentagon 1, not a standalone first-pass method:

- If thermal faults (**T1**, **T2**, and **T3**) have been identified with Duval Pentagon 1, more information can be obtained on these faults with Duval Pentagon 2.
- Pentagon 2 allows detection of the same 3 basic electrical fault types (PD, D1, D2) as Pentagon 1, and further distinguishes 4 additional sub-types of thermal/oil-related faults: S, O, C, and T3-H (T3 in mineral oil only).
- In Duval Pentagon 2, faults T3 in mineral oil only are indicated as T3-H, where H is for "Huile" (French for oil).
- DGA points occurring in zone C indicate a _possibility_ of carbonization of paper, not a 100% certainty — further investigation with carbon oxides and furans should be undertaken.
- The procedure for calculating and displaying DGA points in Duval Pentagons (both 1 and 2) is described in "The Duval Pentagon—A new complementary tool for the interpretation of dissolved gas analysis in transformers" (IEEE Reference B90).

---

# 9. Edge Cases

- If `TOTAL = 0` (sum of all five gas concentrations), return `null` — no coordinate can be calculated.
- If the computed polygon area (Shoelace Formula, as defined in the shared coordinate algorithm) is `0`, return `null`.
- If the centroid does not lie inside any of the seven defined polygons (PD, D1, D2, S, O, C, T3-H), return `OUTSIDE`. Do not guess the nearest zone.
- Never invoke Pentagon 2 as a standalone diagnosis when Pentagon 1 has not been run first (see Section 10 and Section 11).
- Never report T1, T2, or T3 as a Pentagon 2 output label.

---

# 10. Implementation Rules

```
Never use historical samples.

Never use transformer age.

Never use status.

Never use rate.

Never use key gas.

Only the five hydrocarbon gases are required.

Backend performs all calculations.

Frontend renders only the result.
```

Additionally:

- Never hardcode a diagnosis outside the defined polygons.
- Never use gas ratios.
- Never use delta values or generation rates.
- When a result lands in zone C, the `reasoning` output must note that this indicates a _possibility_ of paper carbonization, not certainty, and that further investigation with carbon oxides and furans is recommended.

---

# 11. Integration

```
Current Sample

↓

Pentagon 1

↓

Pentagon 2 (optional refinement)

↓

Final Diagnosis
```

The Duval Pentagon 2 Engine executes independently of:

- Status Engine
- Rate Engine
- Key Gas Engine
- Doernenburg Ratio Engine

It depends on the Duval Pentagon 1 Engine's output only to determine whether refinement is applicable; its own coordinate and classification computation is self-contained and defined entirely by this document and Section 3.

---

# Reference

Michel Duval, Laurent Lamarre

**The Duval Pentagon—A New Complementary Tool for the Interpretation of Dissolved Gas Analysis in Transformers**

IEEE Electrical Insulation Magazine, Vol. 30, No. 6, 2014.
