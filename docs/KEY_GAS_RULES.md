# Key Gas Rules

Source: IEEE Std C57.104-2019

This document defines the canonical Key Gas fault identification method used by the DTL DGA Analysis System.

The Key Gas Engine must implement this document exactly.

---

# Purpose

The Key Gas method is a fault identification technique that determines the most probable fault type by identifying the dominant gas generated within a transformer.

It is intended as an initial diagnostic method only.

The result should be considered together with the Status Engine and other fault identification methods such as Doernenburg Ratios and the Duval methods.

---

# Inputs

The Key Gas Engine requires the current DGA sample.

Required gas concentrations:

- H2
- CH4
- C2H6
- C2H4
- C2H2
- CO
- CO2

Gas values are expressed in ppm (µL/L).

No historical samples are required.

---

# Method

Determine the dominant gas generated in the DGA sample.

The dominant gas is interpreted according to the IEEE Key Gas Method.

The interpretation should consider the dominant gas together with the characteristic secondary gases produced by the same fault.

---

# IEEE Fault Mapping

## Thermal Fault in Mineral Oil

Primary gas:

- C2H4 (Ethylene)

Typical gas pattern:

- Predominantly C2H4
- Smaller quantities of:
  - C2H6
  - CH4
  - H2
- Trace C2H2 may appear at very high temperatures.

Diagnosis:

THERMAL_OIL

---

## Thermal Fault involving Cellulose

Primary gas:

- CO

Typical gas pattern:

- Predominantly CO
- Much smaller quantities of hydrocarbon gases (the source table states this generically, without
  naming individual gases; C2H4, C2H6, CH4 may be elevated as an interpretive expansion of "hydrocarbon
  gases" — note H2 is not itself a hydrocarbon, so its inclusion here is a looser reading of the source
  text, not a literal quote)

Diagnosis:

THERMAL_CELLULOSE

---

## Low Energy Electrical Fault (Partial Discharge)

Primary gas:

- H2

Typical gas pattern:

- Predominantly H2
- Small quantities of CH4
- Trace quantities of:
  - C2H4
  - C2H6

Diagnosis:

PARTIAL_DISCHARGE

---

## High Energy Electrical Fault (Arcing)

Primary gases:

- H2
- C2H2

Typical gas pattern:

- Predominantly H2
- Predominantly C2H2
- Minor quantities of:
  - CH4
  - C2H4
  - C2H6
- CO may also be present if cellulose is involved.

Diagnosis:

ARCING

---

# Engine Output

The Key Gas Engine returns:

```ts
{
    diagnosis:
        | 'THERMAL_OIL'
        | 'THERMAL_CELLULOSE'
        | 'PARTIAL_DISCHARGE'
        | 'ARCING'
        | 'INCONCLUSIVE';

    dominantGas: GasKey | null;

    confidence:
        | 'LOW'
        | 'MEDIUM'
        | 'HIGH';

    reasoning: string[];
}
```

---

# Limitations

The IEEE guide explicitly states that the Key Gas Method has significant limitations.

When implemented automatically in software:

- approximately 50% of cases may produce incorrect or inconclusive fault identifications.

Reasons include (per the IEEE guide's own limitations discussion for this method):

- the dominant gas is not always obvious
- the dominant gas may not be one of the Key Gases
- CO alone is not always a reliable indicator of cellulose faults

("Multiple faults may exist simultaneously" is a true, general DGA caveat discussed elsewhere in the
standard, but is not itself one of the reasons IEEE gives specifically for the Key Gas method's error rate —
listed separately here for completeness, not as a literal quote of this method's own limitations text.)

When interpreted manually by experienced DGA engineers, the error rate is lower (approximately 30%) but remains significant.

For this reason, the Key Gas Engine must not be used as the sole diagnostic method.

---

# Implementation Rules

- Never use IEEE tables for Key Gas identification.
- Never use gas ratios.
- Never use historical samples.
- Never use delta values.
- Never use generation rates.
- Use only the current gas concentrations.
- Return INCONCLUSIVE if no clear dominant Key Gas exists.
- The Key Gas Engine is independent of the Status Engine.
- The Key Gas Engine is independent of the Doernenburg Ratio Engine.
- The Key Gas Engine is independent of the Duval methods.

---

# Integration

The Key Gas Engine is one component of the overall DGA analysis pipeline.

It should execute after:

- Norm Profile
- Delta Engine
- Rate Engine
- Status Engine

Its output should be displayed alongside other diagnostic methods rather than replacing them.

---

# IEEE Notes

The IEEE guide recommends that Key Gas results always be interpreted together with other diagnostic methods.

A final transformer diagnosis should never rely solely on the Key Gas Method.

More advanced diagnostic techniques such as Doernenburg Ratios and the Duval graphical methods should be used to confirm or refine the diagnosis.
