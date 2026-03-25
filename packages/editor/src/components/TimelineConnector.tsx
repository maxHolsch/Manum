/**
 * T161: Hand-drawn SVG connector lines using perfect-freehand
 */

import { getStroke } from 'perfect-freehand';

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';
  const d = stroke.reduce<string[]>(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(`${x0},${y0}`, `${(x0 + x1) / 2},${(y0 + y1) / 2}`);
      return acc;
    },
    [`M ${stroke[0][0]},${stroke[0][1]} Q`],
  );
  d.push('Z');
  return d.join(' ');
}

interface TimelineConnectorProps {
  height: number;
  isBranch?: boolean;
}

export function TimelineConnector({ height, isBranch = false }: TimelineConnectorProps) {
  // Generate points for the connector line with slight randomness for hand-drawn feel
  const cx = 8;
  const points: [number, number, number][] = [];
  const steps = Math.max(4, Math.floor(height / 8));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx + Math.sin(t * Math.PI * 2 + 0.5) * 1.5;
    const y = t * height;
    const pressure = 0.4 + Math.sin(t * Math.PI) * 0.3;
    points.push([x, y, pressure]);
  }

  const stroke = getStroke(points, {
    size: isBranch ? 2.5 : 1.8,
    thinning: 0.4,
    smoothing: 0.6,
    streamline: 0.5,
  });

  const pathData = getSvgPathFromStroke(stroke);

  return (
    <svg
      width="16"
      height={height}
      style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
      aria-hidden
    >
      <path d={pathData} fill={isBranch ? 'rgba(74, 94, 138, 0.5)' : 'rgba(140, 130, 110, 0.5)'} />
    </svg>
  );
}
