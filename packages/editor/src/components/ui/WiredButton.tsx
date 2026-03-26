import type { ReactNode } from 'react';
import 'wired-elements';

interface WiredButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
  title?: string;
}

export function WiredButton({ onClick, disabled, active, children, title }: WiredButtonProps) {
  return (
    <wired-button
      onClick={onClick}
      style={{
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-meta)',
        fontSize: '0.85rem',
        background: active ? 'var(--color-border)' : 'transparent',
      }}
      title={title}
    >
      {children}
    </wired-button>
  );
}
