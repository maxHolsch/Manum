/**
 * T180: Onboarding flow for first-time users
 */

import { useState } from 'react';
import { setSetting } from '../storage/settings-store';
import {
  WelcomeStep,
  ColorsStep,
  BranchingStep,
  ExtensionStep,
  StartStep,
} from './onboarding/Steps';
import '../styles/cards.css';

interface OnboardingProps {
  isConnected: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const STEP_COUNT = 5;

const STEP_TITLES = [
  'Welcome to Manum',
  'Attribution Colors',
  'Git Branching',
  'Browser Extension',
  'Start Writing',
];

export function Onboarding({ isConnected, onComplete, onSkip }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const handleComplete = async () => {
    await setSetting('onboardingCompleted', true);
    onComplete();
  };

  const handleSkip = async () => {
    await setSetting('onboardingCompleted', true);
    onSkip();
  };

  const steps = [
    <WelcomeStep key="welcome" />,
    <ColorsStep key="colors" />,
    <BranchingStep key="branching" />,
    <ExtensionStep key="extension" isConnected={isConnected} />,
    <StartStep key="start" />,
  ];

  const isLast = step === STEP_COUNT - 1;

  return (
    <div
      data-testid="onboarding"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44, 44, 44, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'var(--color-paper, #F5F0E8)',
          borderRadius: '4px',
          width: '440px',
          maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem 1rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display, Special Elite)',
              fontSize: '1.1rem',
              margin: 0,
              color: 'var(--color-ink)',
            }}
          >
            {STEP_TITLES[step]}
          </h2>
          <button
            onClick={() => void handleSkip()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-meta)',
              fontSize: '0.75rem',
              color: 'var(--color-gray)',
            }}
            data-testid="onboarding-skip"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>{steps[step]}</div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: i === step ? 'var(--color-accent)' : 'var(--color-border)',
                  transition: 'background 200ms',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  padding: '0.4rem 0.8rem',
                  fontFamily: 'var(--font-meta)',
                  fontSize: '0.85rem',
                  color: 'var(--color-ink)',
                }}
                data-testid="onboarding-back"
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? () => void handleComplete() : () => setStep((s) => s + 1)}
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                padding: '0.4rem 0.8rem',
                fontFamily: 'var(--font-meta)',
                fontSize: '0.85rem',
              }}
              data-testid={isLast ? 'onboarding-start' : 'onboarding-next'}
            >
              {isLast ? 'Start Writing' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
