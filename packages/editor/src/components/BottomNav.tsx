/**
 * T177: Bottom navigation bar
 */

import '../styles/nav.css';

export type AppMode = 'write' | 'branch' | 'insights';

interface BottomNavProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const NAV_ITEMS: { mode: AppMode; icon: string; label: string }[] = [
  { mode: 'write', icon: '✍', label: 'Write' },
  { mode: 'branch', icon: '⑂', label: 'Branch' },
  { mode: 'insights', icon: '◉', label: 'Insights' },
];

export function BottomNav({ mode, onModeChange }: BottomNavProps) {
  return (
    <nav className="manum-bottom-nav" aria-label="Main navigation" data-testid="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.mode}
          className={`manum-nav-btn${mode === item.mode ? ' active' : ''}`}
          onClick={() => onModeChange(item.mode)}
          aria-current={mode === item.mode ? 'page' : undefined}
          data-testid={`nav-${item.mode}`}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
