# Duval Pentagon 1 Rules

Source: IEEE Std C57.104-2019

This document defines the canonical Duval Pentagon 1 fault identification method used by the DTL DGA Analysis System.

The Duval Pentagon 1 Engine must implement this document exactly.

---

# Purpose

The Duval Pentagon 1 method is a graphical fault identification technique based on the relative proportions of five combustible gases.

Unlike ratio methods, the Duval Pentagon considers all five hydrocarbon gases simultaneously.

It is capable of identifying:

- PD
- D1
- D2
- T1
- T2
- T3
- S (Stray Gassing)

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

# Gas Order

The pentagon vertices are ordered according to increasing fault energy.

Clockwise order:

1. H2
2. C2H6
3. CH4
4. C2H4
5. C2H2

This must match the vertex construction order used in the Coordinate Algorithm below (Step 6) and the
fixed axis angles (H2=90°, C2H6=162°, CH4=234°, C2H4=306°, C2H2=18° — each 72° further around the
same rotational direction from the last). Do not list gases in the reverse order here; a reversed
listing would silently describe the mirror-image traversal and mislead any future implementation.

---

# Coordinate System

Origin:

(0,0)

Reference point:

H2 vertex

(0,40)

The pentagon uses a fixed Cartesian coordinate system.

The engine must compute a single point inside the pentagon from the relative gas percentages.

---

# Fault Zones

The Duval Pentagon identifies the following diagnostic zones:

- PD
- D1
- D2
- T1
- T2
- T3
- S (Stray Gassing)

---

# Zone Boundary Coordinates

## PD

```
(0,33)
(-1,33)
(-1,24.5)
(0,24.5)
```

---

## D1

```
(0,40)
(38,12)
(32,-6.1)
(4,16)
(0,1.5)
```

---

## D2

```
(4,16)
(32,-6.1)
(24.3,-30)
(0,-3)
(0,1.5)
```

---

## T3

```
(0,-3)
(24.3,-30)
(23.5,-32.4)
(1,-32)
(-6,-4)
```

---

## T2

```
(-6,-4)
(1,-32.4)
(-22.5,-32.4)
```

---

## T1

```
(-6,-4)
(-22.5,-32.4)
(-23.5,-32.4)
(-35,3)
(0,1.5)
(0,-3)
```

---

## S (Stray Gassing)

```
(0,1.5)
(-35,3.1)
(-38,12.4)
(0,40)
(0,33)
(-1,33)
(-1,24.5)
(0,24.5)
```

---

# Classification Algorithm

The engine shall:

1. Read the five gas concentrations.
2. Convert concentrations into relative percentages.
3. Compute the Duval Pentagon point.
4. Determine which polygon contains the computed point.
5. Return the corresponding fault zone.

---

# Output

```ts
{
    diagnosis:
        | 'PD'
        | 'D1'
        | 'D2'
        | 'T1'
        | 'T2'
        | 'T3'
        | 'S'
        | 'OUTSIDE';

    coordinates: {
        x: number;
        y: number;
    };

    reasoning: string[];
}
```

---

# OUTSIDE Zone

If the calculated point does not lie inside any defined polygon:

Return:

```
OUTSIDE
```

The engine must not guess the nearest fault.

---

# Implementation Rules

- Never hardcode diagnosis outside the defined polygons.
- Never use gas ratios.
- Never use transformer age.
- Never use historical samples.
- Never use delta values.
- Never use generation rates.
- Perform all calculations on the backend.
- Frontend only renders the returned diagnosis and coordinates.

---

# Integration

The Duval Pentagon 1 Engine executes independently of:

- Status Engine
- Rate Engine
- Key Gas Engine
- Doernenburg Ratio Engine

Its output becomes one component of the overall DGA diagnosis.

---

# IEEE Notes

The Duval Pentagon 1 method considers all five hydrocarbon gases simultaneously.

Compared with ratio methods, it provides a more comprehensive graphical diagnosis and is capable of identifying the six fundamental transformer fault types together with stray gassing.

The algorithm for converting gas percentages into pentagon coordinates shall follow the procedure described in:

"The Duval Pentagon—A new complementary tool for the interpretation of dissolved gas analysis in transformers" (IEEE Reference B90).

# Duval Pentagon Coordinate Algorithm

## Purpose

This document defines the algorithm for converting Dissolved Gas Analysis (DGA) values into a single Cartesian coordinate `(x, y)` within the Duval Pentagon.

This document defines **only the coordinate transformation**.

Fault classification is handled separately by the Duval Pentagon Rule Engine.

---

# Inputs

The algorithm requires the five hydrocarbon gases.

| Gas       | Symbol |
| --------- | ------ |
| Hydrogen  | H₂     |
| Methane   | CH₄    |
| Ethane    | C₂H₆   |
| Ethylene  | C₂H₄   |
| Acetylene | C₂H₂   |

All values are provided in **ppm**.

---

# Step 1 — Calculate Total Hydrocarbon Gas

```text
TOTAL =
H₂ +
CH₄ +
C₂H₆ +
C₂H₄ +
C₂H₂
```

If

```text
TOTAL = 0
```

return

```text
null
```

because no Duval Pentagon coordinate can be calculated.

---

# Step 2 — Convert to Relative Percentages

Convert each gas into its percentage contribution.

```text
H₂%   = H₂   / TOTAL × 100
CH₄%  = CH₄  / TOTAL × 100
C₂H₆% = C₂H₆ / TOTAL × 100
C₂H₄% = C₂H₄ / TOTAL × 100
C₂H₂% = C₂H₂ / TOTAL × 100
```

The five percentages always sum to

```text
100%
```

---

# Step 3 — Pentagon Axis Directions

Each gas is represented by a fixed axis.

| Gas  | Angle (Degrees) |
| ---- | --------------: |
| H₂   |             90° |
| C₂H₆ |            162° |
| CH₄  |            234° |
| C₂H₄ |            306° |
| C₂H₂ |             18° |

These angles never change.

---

# Step 4 — Convert Angles to Radians

Angles above are specified in **degrees**.

Before using trigonometric functions, convert them to radians.

```text
radians = degrees × π / 180
```

Use the converted value when calling

```text
cos()
sin()
```

---

# Step 5 — Convert Each Gas to Cartesian Coordinates

For every gas,

```text
x = percentage × cos(angle)

y = percentage × sin(angle)
```

This produces five points.

```text
P0 = H₂
P1 = C₂H₆
P2 = CH₄
P3 = C₂H₄
P4 = C₂H₂
```

---

# Step 6 — Polygon Vertex Order

The polygon **must always** be constructed using the following order.

```text
H₂
↓

C₂H₆
↓

CH₄
↓

C₂H₄
↓

C₂H₂
↓

H₂
```

Do **not** reorder the vertices.

The Shoelace Formula and centroid calculation assume this ordering.

---

# Step 7 — Close the Polygon

Append the first point to the end.

```text
P5 = P0
```

---

# Step 8 — Compute Polygon Area

Use the Shoelace Formula.

```text
A =
½ × Σ(
xi yi+1
−
xi+1 yi
)
```

The polygon may be traversed either clockwise or counter-clockwise.

Use the **signed area** produced by the Shoelace Formula when computing the centroid.

Do **not** replace the signed area with its absolute value until after centroid computation if following the standard polygon centroid equations.

If

```text
A = 0
```

return

```text
null
```

---

# Step 9 — Compute Centroid X

```text
Cx =
1 / (6A)
×
Σ(
(xi + xi+1)
×
(
xi yi+1
−
xi+1 yi
)
)
```

---

# Step 10 — Compute Centroid Y

```text
Cy =
1 / (6A)
×
Σ(
(yi + yi+1)
×
(
xi yi+1
−
xi+1 yi
)
)
```

---

# Step 11 — Return Coordinate

Return

```text
{
    x: Cx,
    y: Cy
}
```

This coordinate uniquely represents the DGA sample inside the Duval Pentagon.

---

# Fixed Pentagon Geometry

The IEEE paper defines the full-scale pentagon vertices as

| Gas  |     X |     Y |
| ---- | ----: | ----: |
| H₂   |     0 |   100 |
| C₂H₆ | -95.1 |  30.9 |
| CH₄  | -58.8 | -80.9 |
| C₂H₄ |  58.8 | -80.9 |
| C₂H₂ |  95.1 |  30.9 |

For visualization, only **40%** of each axis is required.

Rendering coordinates become

| Gas  |     X |     Y |
| ---- | ----: | ----: |
| H₂   |     0 |    40 |
| C₂H₆ | -38.0 |  12.4 |
| CH₄  | -23.5 | -32.4 |
| C₂H₄ |  23.5 | -32.4 |
| C₂H₂ |  38.0 |  12.4 |

These coordinates are used only for rendering.

Centroid computation always uses the percentage values.

---

# Numerical Precision

Use **double-precision floating-point arithmetic** throughout the computation.

Do not round intermediate values.

Round values only for presentation or reporting.

---

# Edge Cases

If

```text
TOTAL = 0
```

return

```text
null
```

If

```text
Polygon Area = 0
```

return

```text
null
```

If the final centroid lies outside every fault polygon, the Rule Engine should return

```text
OUTSIDE
```

---

# Next Step

The computed centroid is passed to the Duval Pentagon Rule Engine.

The Rule Engine determines the diagnosis by performing a **point-in-polygon** test against each fault zone defined in

```text
DUVAL_PENTAGON_1_RULES.md
```

---

# Implementation Notes

The coordinate calculation and the fault-zone classification are intentionally separated.

This document defines only the coordinate transformation.

Fault classification is defined in

```text
DUVAL_PENTAGON_1_RULES.md
```

The backend implementation should therefore consist of two independent modules.

## Coordinate Engine

**Input**

- Gas concentrations

**Output**

```text
(x, y)
```

---

## Zone Classification Engine

**Input**

```text
(x, y)
```

**Output**

```text
PD
D1
D2
T1
T2
T3
S
OUTSIDE
```

---

# Algorithm Summary

```text
Read gas values
      ↓
Compute total
      ↓
Convert to percentages
      ↓
Convert degrees to radians
      ↓
Project gases onto pentagon axes
      ↓
Construct polygon
      ↓
Compute signed area
      ↓
Compute centroid
      ↓
Return (x, y)
      ↓
Point-in-polygon classification
      ↓
Return fault diagnosis
```

---

# Reference

Michel Duval, Laurent Lamarre

**The Duval Pentagon—A New Complementary Tool for the Interpretation of Dissolved Gas Analysis in Transformers**

IEEE Electrical Insulation Magazine, Vol. 30, No. 6, 2014.
