import { DuvalTriangleDiagram } from './DuvalTriangleDiagram';
import { TRIANGLE1_SPEC, TRIANGLE4_SPEC, TRIANGLE5_SPEC } from './duvalZones';
import {
  TRIANGLE1_INTERPRETATIONS,
  TRIANGLE4_INTERPRETATIONS,
  TRIANGLE5_INTERPRETATIONS,
} from './duvalInterpretations';
import type {
  DuvalTriangle1Result,
  DuvalTriangle4Result,
  DuvalTriangle5Result,
} from '@/types';

function percentageMetrics(
  entries: { label: string; value: number }[] | null,
): { label: string; value: string }[] | undefined {
  if (!entries) return undefined;
  return entries.map((e) => ({ label: e.label, value: `${e.value.toFixed(1)}%` }));
}

export function DuvalTriangle1({ result }: { result: DuvalTriangle1Result | null }) {
  const percentages = result?.percentages ?? null;
  return (
    <DuvalTriangleDiagram
      title="Duval Triangle 1"
      subtitle="CH₄ / C₂H₄ / C₂H₂ — IEEE C57.104 Table 6, classic fault classification"
      spec={TRIANGLE1_SPEC}
      percentages={percentages}
      result={result?.zone ?? null}
      interpretation={result?.zone ? TRIANGLE1_INTERPRETATIONS[result.zone] : null}
      zoneDescriptions={TRIANGLE1_INTERPRETATIONS}
      metrics={percentageMetrics(
        percentages
          ? [
              { label: '%CH₄', value: percentages.ch4 },
              { label: '%C₂H₄', value: percentages.c2h4 },
              { label: '%C₂H₂', value: percentages.c2h2 },
            ]
          : null,
      )}
    />
  );
}

export function DuvalTriangle4({ result }: { result: DuvalTriangle4Result | null }) {
  const percentages = result?.percentages ?? null;
  return (
    <DuvalTriangleDiagram
      title="Duval Triangle 4"
      subtitle="H₂ / CH₄ / C₂H₆ — IEEE C57.104 Table D.3, low-energy fault refinement"
      spec={TRIANGLE4_SPEC}
      percentages={percentages}
      result={result?.zone ?? null}
      interpretation={result?.zone ? TRIANGLE4_INTERPRETATIONS[result.zone] : null}
      zoneDescriptions={TRIANGLE4_INTERPRETATIONS}
      metrics={percentageMetrics(
        percentages
          ? [
              { label: '%H₂', value: percentages.h2 },
              { label: '%CH₄', value: percentages.ch4 },
              { label: '%C₂H₆', value: percentages.c2h6 },
            ]
          : null,
      )}
    />
  );
}

export function DuvalTriangle5({ result }: { result: DuvalTriangle5Result | null }) {
  const percentages = result?.percentages ?? null;
  return (
    <DuvalTriangleDiagram
      title="Duval Triangle 5"
      subtitle="CH₄ / C₂H₄ / C₂H₆ — IEEE C57.104 Table D.4, thermal fault refinement"
      spec={TRIANGLE5_SPEC}
      percentages={percentages}
      result={result?.zone ?? null}
      interpretation={result?.zone ? TRIANGLE5_INTERPRETATIONS[result.zone] : null}
      zoneDescriptions={TRIANGLE5_INTERPRETATIONS}
      metrics={percentageMetrics(
        percentages
          ? [
              { label: '%CH₄', value: percentages.ch4 },
              { label: '%C₂H₄', value: percentages.c2h4 },
              { label: '%C₂H₆', value: percentages.c2h6 },
            ]
          : null,
      )}
    />
  );
}
