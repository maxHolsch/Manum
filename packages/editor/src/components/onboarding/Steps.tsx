/**
 * T180: Individual onboarding steps
 */

export interface OnboardingStep {
  id: string;
  title: string;
  content: React.ReactNode;
}

export const ONBOARDING_STEPS: Omit<OnboardingStep, 'content'>[] = [
  { id: 'welcome', title: 'Welcome to Manum' },
  { id: 'colors', title: 'Attribution Colors' },
  { id: 'branching', title: 'Git Branching' },
  { id: 'extension', title: 'Browser Extension' },
  { id: 'start', title: 'Start Writing' },
];

export function WelcomeStep() {
  return (
    <div style={{ textAlign: 'center' }}>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          color: 'var(--color-ink)',
          lineHeight: 1.7,
          marginBottom: '1rem',
        }}
      >
        Manum tracks how much of your writing is truly yours.
      </p>
      <p
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.85rem',
          color: 'var(--color-gray)',
          lineHeight: 1.6,
        }}
      >
        Every word is scored: did you write it, was it influenced by AI, or was it pasted directly?
        Manum visualizes this with a color overlay on your text.
      </p>
    </div>
  );
}

export function ColorsStep() {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: 'var(--color-gray)',
          marginBottom: '1rem',
        }}
      >
        Each character in your document is attributed one of three colors:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[
          {
            color: '#52A552',
            label: 'Green — Original',
            desc: 'You wrote this yourself, before seeing any AI output.',
          },
          {
            color: '#D4A030',
            label: 'Yellow — AI-influenced',
            desc: 'You wrote this, but AI said something similar first.',
          },
          {
            color: '#B05050',
            label: 'Red — Pasted',
            desc: 'This was copied directly from an AI response.',
          },
        ].map(({ color, label, desc }) => (
          <div key={label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                background: color,
                borderRadius: '2px',
                flexShrink: 0,
                marginTop: '2px',
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-meta)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-meta)',
                  fontSize: '0.75rem',
                  color: 'var(--color-gray)',
                }}
              >
                {desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BranchingStep() {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.85rem',
          color: 'var(--color-ink)',
          lineHeight: 1.6,
          marginBottom: '0.75rem',
        }}
      >
        Like git for code, Manum lets you create branches for your writing.
      </p>
      <p
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: 'var(--color-gray)',
          lineHeight: 1.6,
        }}
      >
        Try different phrasings, explore alternative directions, and switch between them — your
        history is always preserved in the commit timeline.
      </p>
      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.6rem',
          background: 'rgba(74, 94, 138, 0.08)',
          borderRadius: '2px',
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: 'var(--color-accent)',
        }}
      >
        Tip: Press Ctrl+Shift+B to create a new branch.
      </div>
    </div>
  );
}

export function ExtensionStep({ isConnected }: { isConnected: boolean }) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.85rem',
          color: 'var(--color-ink)',
          lineHeight: 1.6,
          marginBottom: '0.75rem',
        }}
      >
        The Manum Chrome extension monitors your AI conversations so it can automatically attribute
        text you paste from Claude.ai, ChatGPT, and others.
      </p>
      <div
        style={{
          padding: '0.6rem',
          borderRadius: '2px',
          background: isConnected ? 'rgba(82, 165, 82, 0.1)' : 'rgba(176, 80, 80, 0.1)',
          border: `1px solid ${isConnected ? '#52A552' : '#B05050'}`,
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: isConnected ? '#52A552' : '#B05050',
        }}
      >
        {isConnected
          ? '✓ Extension connected'
          : '✗ Extension not detected — install it from the Chrome Web Store for full attribution tracking.'}
      </div>
    </div>
  );
}

export function StartStep() {
  return (
    <div style={{ textAlign: 'center' }}>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          color: 'var(--color-accent)',
          marginBottom: '0.75rem',
        }}
      >
        You&apos;re ready to write.
      </p>
      <p
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: 'var(--color-gray)',
          lineHeight: 1.6,
        }}
      >
        Click &quot;Start Writing&quot; to create your first document. Toggle the attribution
        overlay anytime with Ctrl+Shift+A.
      </p>
    </div>
  );
}
