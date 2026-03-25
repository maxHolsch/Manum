import type { AttributionColor } from '../editor/marks/attribution';

export function getColorFromDistance(dist: number): AttributionColor {
  if (dist >= 0.7) return 'green';
  if (dist >= 0.2) return 'yellow';
  return 'red';
}

export function computeYellowOpacity(editDistance: number): number {
  // opacity varies from 0.4 (at 20%) to 0.1 (at 70%)
  const clamped = Math.max(0.2, Math.min(0.7, editDistance));
  return 0.4 - ((clamped - 0.2) / 0.5) * 0.3;
}
