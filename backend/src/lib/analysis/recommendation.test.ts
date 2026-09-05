import { describe, expect, it } from 'vitest';
import { runRecommendationEngine } from './recommendation.js';
import type { RecommendationEngineInput } from './types.js';

const BASE_INPUT: RecommendationEngineInput = {
  status: 'STATUS_1',
  duvalTriangle1Zone: null,
  duvalTriangle4Zone: null,
  duvalTriangle5Zone: null,
  duvalPentagon1Diagnosis: null,
  duvalPentagon2Diagnosis: null,
  c2h4Delta: null,
  c2h6Level: 0,
};

function evaluate(overrides: Partial<RecommendationEngineInput>) {
  return runRecommendationEngine({ ...BASE_INPUT, ...overrides });
}

describe('Step 1 — base tier from Status', () => {
  it('STATUS_1 -> ROUTINE', () => {
    const result = evaluate({ status: 'STATUS_1' });
    expect(result.tier).toBe('ROUTINE');
    expect(result.reasoning).toContain('Base tier ROUTINE from STATUS_1.');
  });

  it('STATUS_2 -> INVESTIGATE (no fault-zone carve-out present)', () => {
    const result = evaluate({ status: 'STATUS_2' });
    expect(result.tier).toBe('INVESTIGATE');
  });

  it('STATUS_3 -> URGENT', () => {
    const result = evaluate({ status: 'STATUS_3' });
    expect(result.tier).toBe('URGENT');
    expect(result.reasoning).toContain('Base tier URGENT from STATUS_3.');
  });
});

describe('Step 2 — de-escalation carve-out (STATUS_2 only)', () => {
  it.each([
    ['duvalTriangle1Zone', 'PD'],
    ['duvalTriangle1Zone', 'T1'],
    ['duvalTriangle4Zone', 'PD'],
    ['duvalTriangle4Zone', 'S'],
    ['duvalTriangle5Zone', 'PD'],
    ['duvalTriangle5Zone', 'S'],
    ['duvalPentagon1Diagnosis', 'PD'],
    ['duvalPentagon1Diagnosis', 'T1'],
    ['duvalPentagon1Diagnosis', 'S'],
    ['duvalPentagon2Diagnosis', 'PD'],
    ['duvalPentagon2Diagnosis', 'S'],
  ] as const)('de-escalates to MONITOR when %s = %s', (field, zone) => {
    const result = evaluate({ status: 'STATUS_2', [field]: zone });
    expect(result.tier).toBe('MONITOR');
    expect(result.reasoning.some((line) => line.includes('De-escalated to MONITOR'))).toBe(true);
  });

  it('does not de-escalate STATUS_1 even if a Duval result is PD/T1/S', () => {
    const result = evaluate({ status: 'STATUS_1', duvalPentagon1Diagnosis: 'S' });
    expect(result.tier).toBe('ROUTINE');
  });

  it('does not de-escalate STATUS_3 even if a Duval result is PD/T1/S', () => {
    const result = evaluate({ status: 'STATUS_3', duvalPentagon1Diagnosis: 'PD' });
    expect(result.tier).toBe('URGENT');
  });
});

describe('Step 2 — escalation carve-out (STATUS_2 only)', () => {
  it.each([
    ['duvalTriangle1Zone', 'D2'],
    ['duvalTriangle1Zone', 'T3'],
    ['duvalTriangle4Zone', 'C'],
    ['duvalTriangle5Zone', 'T3'],
    ['duvalTriangle5Zone', 'C'],
    ['duvalPentagon1Diagnosis', 'D2'],
    ['duvalPentagon1Diagnosis', 'T3'],
    ['duvalPentagon2Diagnosis', 'D2'],
    ['duvalPentagon2Diagnosis', 'C'],
    ['duvalPentagon2Diagnosis', 'T3-H'],
  ] as const)('escalates to URGENT when %s = %s', (field, zone) => {
    const result = evaluate({ status: 'STATUS_2', [field]: zone });
    expect(result.tier).toBe('URGENT');
    expect(result.reasoning.some((line) => line.includes('Escalated to URGENT'))).toBe(true);
  });

  it('escalation wins when both a de-escalating and an escalating signal are present', () => {
    const result = evaluate({
      status: 'STATUS_2',
      duvalTriangle1Zone: 'T1',
      duvalPentagon1Diagnosis: 'D2',
    });
    expect(result.tier).toBe('URGENT');
  });

  it('does not escalate STATUS_1 or STATUS_3 based on fault zones (already at their own base tier)', () => {
    expect(evaluate({ status: 'STATUS_1', duvalPentagon1Diagnosis: 'D2' }).tier).toBe('ROUTINE');
    expect(evaluate({ status: 'STATUS_3', duvalPentagon1Diagnosis: 'D2' }).tier).toBe('URGENT');
  });
});

describe('UNCLASSIFIED / OUTSIDE / null zones are ignored', () => {
  it('does not treat UNCLASSIFIED as a de-escalation or escalation signal', () => {
    const result = evaluate({ status: 'STATUS_2', duvalTriangle1Zone: 'UNCLASSIFIED' });
    expect(result.tier).toBe('INVESTIGATE');
  });

  it('does not treat OUTSIDE as a de-escalation or escalation signal', () => {
    const result = evaluate({ status: 'STATUS_2', duvalPentagon1Diagnosis: 'OUTSIDE' });
    expect(result.tier).toBe('INVESTIGATE');
  });
});

describe('Step 3 — extreme override (always evaluated, overrides everything)', () => {
  it('escalates to EXTREME when C2H4 delta > 200 ppm', () => {
    const result = evaluate({ status: 'STATUS_1', c2h4Delta: 201 });
    expect(result.tier).toBe('EXTREME');
    expect(result.reasoning.some((line) => line.includes('Escalated to EXTREME'))).toBe(true);
    expect(result.reasoning.some((line) => line.includes('C2H4 delta'))).toBe(true);
  });

  it('escalates to EXTREME when C2H6 level > 1000 ppm', () => {
    const result = evaluate({ status: 'STATUS_1', c2h6Level: 1001 });
    expect(result.tier).toBe('EXTREME');
    expect(result.reasoning.some((line) => line.includes('C2H6 level'))).toBe(true);
  });

  it('does not trigger EXTREME at exactly 200 ppm C2H4 delta (boundary is exclusive)', () => {
    const result = evaluate({ status: 'STATUS_1', c2h4Delta: 200 });
    expect(result.tier).toBe('ROUTINE');
  });

  it('does not trigger EXTREME at exactly 1000 ppm C2H6 level (boundary is exclusive)', () => {
    const result = evaluate({ status: 'STATUS_1', c2h6Level: 1000 });
    expect(result.tier).toBe('ROUTINE');
  });

  it('handles a null C2H4 delta (no previous sample) by evaluating only the C2H6 condition', () => {
    expect(() => evaluate({ status: 'STATUS_1', c2h4Delta: null, c2h6Level: 1001 })).not.toThrow();
    expect(evaluate({ status: 'STATUS_1', c2h4Delta: null, c2h6Level: 1001 }).tier).toBe('EXTREME');
    expect(evaluate({ status: 'STATUS_1', c2h4Delta: null, c2h6Level: 0 }).tier).toBe('ROUTINE');
  });

  it('overrides a STATUS_2 de-escalation signal (extreme wins over MONITOR)', () => {
    const result = evaluate({
      status: 'STATUS_2',
      duvalPentagon1Diagnosis: 'S',
      c2h6Level: 1500,
    });
    expect(result.tier).toBe('EXTREME');
  });

  it('overrides STATUS_3/URGENT too', () => {
    const result = evaluate({ status: 'STATUS_3', c2h4Delta: 500 });
    expect(result.tier).toBe('EXTREME');
  });
});

describe('actions per tier', () => {
  it('returns the documented action list for each tier', () => {
    expect(evaluate({ status: 'STATUS_1' }).actions).toEqual([
      'Continue routine operation.',
      "Sample per the owner's normal DGA screening protocol.",
    ]);
    expect(evaluate({ status: 'STATUS_2', duvalPentagon1Diagnosis: 'S' }).actions[0]).toContain(
      'lower-urgency issue',
    );
    expect(evaluate({ status: 'STATUS_2' }).actions[0]).toContain('Investigate');
    expect(evaluate({ status: 'STATUS_3' }).actions[0]).toContain('increased surveillance');
    expect(evaluate({ status: 'STATUS_1', c2h6Level: 2000 }).actions[0]).toContain(
      'immediate investigation',
    );
  });
});

describe('mandatory expert-judgment caveat', () => {
  it('is present in reasoning for every tier', () => {
    const caveat =
      'This recommendation is decision support only — it does not replace expert judgment, consultation with the transformer manufacturer, or company-specific DGA policy.';

    for (const result of [
      evaluate({ status: 'STATUS_1' }),
      evaluate({ status: 'STATUS_2' }),
      evaluate({ status: 'STATUS_2', duvalPentagon1Diagnosis: 'S' }),
      evaluate({ status: 'STATUS_3' }),
      evaluate({ status: 'STATUS_1', c2h6Level: 2000 }),
    ]) {
      expect(result.reasoning).toContain(caveat);
    }
  });
});

describe('determinism', () => {
  it('produces a deterministic result for the same input', () => {
    const input: RecommendationEngineInput = {
      ...BASE_INPUT,
      status: 'STATUS_2',
      duvalPentagon1Diagnosis: 'D2',
      c2h4Delta: 50,
      c2h6Level: 300,
    };
    expect(runRecommendationEngine(input)).toEqual(runRecommendationEngine(input));
  });
});
