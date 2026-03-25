export type ConnectionState = 'connected' | 'disconnected' | 'checking';

interface ConnectionStatusProps {
  state: ConnectionState;
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const dotColor = state === 'connected' ? '#4caf50' : state === 'checking' ? '#ff9800' : '#9e9e9e';

  const label =
    state === 'connected'
      ? 'Extension connected'
      : state === 'checking'
        ? 'Checking\u2026'
        : 'Extension disconnected';

  return (
    <div
      className="connection-status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontFamily: 'var(--font-meta)',
        fontSize: '0.75rem',
        color: 'var(--color-gray)',
        padding: '0.25rem 0.5rem',
      }}
      title={label}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}
