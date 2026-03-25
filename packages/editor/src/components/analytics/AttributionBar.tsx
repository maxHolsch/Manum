/**
 * T169: Attribution summary ratio bar
 */

interface AttributionBarProps {
  green: number;
  yellow: number;
  red: number;
}

export function AttributionBar({ green, yellow, red }: AttributionBarProps) {
  const total = green + yellow + red || 100;
  const gPct = Math.round((green / total) * 100);
  const yPct = Math.round((yellow / total) * 100);
  const rPct = 100 - gPct - yPct;

  return (
    <div data-testid="attribution-bar">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-meta)',
            fontSize: '0.75rem',
            color: 'var(--color-green, #52A552)',
          }}
        >
          {gPct}% Original
        </span>
        <span
          style={{
            fontFamily: 'var(--font-meta)',
            fontSize: '0.75rem',
            color: 'var(--color-yellow, #D4A030)',
          }}
        >
          {yPct}% AI-influenced
        </span>
        <span
          style={{
            fontFamily: 'var(--font-meta)',
            fontSize: '0.75rem',
            color: 'var(--color-red, #B05050)',
          }}
        >
          {rPct}% Pasted
        </span>
      </div>

      {/* Rough-style bar container */}
      <div
        style={{
          display: 'flex',
          height: '24px',
          borderRadius: '2px',
          overflow: 'hidden',
          border: '1.5px solid var(--color-border, #D4C9A8)',
          gap: '1px',
          background: 'var(--color-border, #D4C9A8)',
        }}
      >
        {gPct > 0 && (
          <div
            data-testid="bar-green"
            style={{ flex: gPct, background: 'var(--color-green, #52A552)', opacity: 0.85 }}
            title={`Original: ${gPct}%`}
          />
        )}
        {yPct > 0 && (
          <div
            data-testid="bar-yellow"
            style={{ flex: yPct, background: 'var(--color-yellow, #D4A030)', opacity: 0.85 }}
            title={`AI-influenced: ${yPct}%`}
          />
        )}
        {rPct > 0 && (
          <div
            data-testid="bar-red"
            style={{ flex: rPct, background: 'var(--color-red, #B05050)', opacity: 0.85 }}
            title={`Pasted: ${rPct}%`}
          />
        )}
      </div>
    </div>
  );
}
