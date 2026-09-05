/**
 * Shared Recharts styling for engineering-style diagnostic charts.
 *
 * Gas colors are a muted, colorblind-safe categorical set (derived from the
 * Tol "vibrant" palette, desaturated). C2H2 is deliberately red — acetylene
 * is the arcing indicator and should always read as the danger series.
 */

export const chartColors = {
  grid: '#e8eaed',
  axis: '#6b7280',
  h2: '#0077bb',
  ch4: '#009988',
  c2h6: '#997700',
  c2h4: '#ee7733',
  c2h2: '#cc3311',
  co: '#6f4d9b',
  co2: '#708090',
  o2: '#0077bb',
  n2: '#708090',
  ch4h2: '#0077bb',
  c2h2c2h4: '#cc3311',
  c2h4c2h6: '#ee7733',
  bar: '#4b6a88',
  barHighlight: '#cc3311',
} as const;

export const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #c8cdd3',
  borderRadius: 0,
  fontSize: 12,
  boxShadow: '0 2px 8px rgba(28, 39, 51, 0.10)',
  padding: '8px 10px',
} as const;

export const tooltipLabelStyle = {
  fontWeight: 600,
  color: '#1c2733',
  marginBottom: 4,
} as const;

export const axisProps = {
  tick: { fontSize: 11, fill: chartColors.axis },
  axisLine: { stroke: '#c8cdd3' },
  tickLine: { stroke: '#c8cdd3' },
} as const;

export const legendStyle = {
  fontSize: 11.5,
  paddingTop: 10,
} as const;

/** Shared restrained entrance animation for line/bar series. */
export const seriesAnimation = {
  animationDuration: 700,
  animationEasing: 'ease-out',
} as const;

/** All trend charts on the page share one x-axis domain (sample dates). */
export const TRENDS_SYNC_ID = 'analysis-trends';
