/**
 * T173: Cross-project trend chart showing AI dependency over time
 */

interface TrendPoint {
  date: string;
  green: number;
  yellow: number;
  red: number;
}

interface TrendChartProps {
  data: TrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: 'var(--color-gray)',
          padding: '0.5rem 0',
        }}
      >
        Not enough data to show trends.
      </div>
    );
  }

  const chartHeight = 80;

  return (
    <div data-testid="trend-chart">
      <svg
        width="100%"
        height={chartHeight + 20}
        viewBox={`0 0 ${data.length * 30} ${chartHeight + 20}`}
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Green line */}
        <polyline
          points={data
            .map((d, i) => `${i * 30 + 15},${chartHeight - (d.green / 100) * chartHeight}`)
            .join(' ')}
          fill="none"
          stroke="var(--color-green, #52A552)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Yellow line */}
        <polyline
          points={data
            .map((d, i) => `${i * 30 + 15},${chartHeight - (d.yellow / 100) * chartHeight}`)
            .join(' ')}
          fill="none"
          stroke="var(--color-yellow, #D4A030)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Red line */}
        <polyline
          points={data
            .map((d, i) => `${i * 30 + 15},${chartHeight - (d.red / 100) * chartHeight}`)
            .join(' ')}
          fill="none"
          stroke="var(--color-red, #B05050)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={i * 30 + 15}
            y={chartHeight + 15}
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-meta)', fontSize: '7px', fill: 'var(--color-gray)' }}
          >
            {d.date}
          </text>
        ))}
      </svg>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-meta)',
            fontSize: '0.7rem',
            color: 'var(--color-green, #52A552)',
          }}
        >
          ── Original
        </span>
        <span
          style={{
            fontFamily: 'var(--font-meta)',
            fontSize: '0.7rem',
            color: 'var(--color-yellow, #D4A030)',
          }}
        >
          ── AI-influenced
        </span>
        <span
          style={{
            fontFamily: 'var(--font-meta)',
            fontSize: '0.7rem',
            color: 'var(--color-red, #B05050)',
          }}
        >
          ── Pasted
        </span>
      </div>
    </div>
  );
}
