import { DuvalPentagonDiagram } from './DuvalPentagonDiagram';
import { PENTAGON1_ZONES, PENTAGON2_ZONES } from './duvalZones';
import {
  PENTAGON1_INTERPRETATIONS,
  PENTAGON2_INTERPRETATIONS,
} from './duvalInterpretations';
import type { DuvalPentagon1Result, DuvalPentagon2Result } from '@/types';

function coordinateMetrics(
  coordinates: { x: number; y: number } | null | undefined,
): { label: string; value: string }[] | undefined {
  if (!coordinates) return undefined;
  return [
    { label: 'Cx', value: coordinates.x.toFixed(2) },
    { label: 'Cy', value: coordinates.y.toFixed(2) },
  ];
}

export function DuvalPentagon1({ result }: { result: DuvalPentagon1Result | null }) {
  const coordinates = result?.coordinates ?? null;
  return (
    <DuvalPentagonDiagram
      title="Duval Pentagon 1"
      subtitle="Five-gas centroid method — primary fault classification"
      zones={PENTAGON1_ZONES}
      coordinates={coordinates}
      result={result?.diagnosis ?? null}
      interpretation={result?.diagnosis ? PENTAGON1_INTERPRETATIONS[result.diagnosis] : null}
      zoneDescriptions={PENTAGON1_INTERPRETATIONS}
      metrics={coordinateMetrics(coordinates)}
    />
  );
}

export function DuvalPentagon2({ result }: { result: DuvalPentagon2Result | null }) {
  const coordinates = result?.coordinates ?? null;
  return (
    <DuvalPentagonDiagram
      title="Duval Pentagon 2"
      subtitle="Five-gas centroid method — thermal fault refinement"
      zones={PENTAGON2_ZONES}
      coordinates={coordinates}
      result={result?.diagnosis ?? null}
      interpretation={result?.diagnosis ? PENTAGON2_INTERPRETATIONS[result.diagnosis] : null}
      zoneDescriptions={PENTAGON2_INTERPRETATIONS}
      metrics={coordinateMetrics(coordinates)}
    />
  );
}
