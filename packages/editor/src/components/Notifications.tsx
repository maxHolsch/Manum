/**
 * T129: Notification component for LLM fallback and other system messages.
 * Uses wired-elements for manuscript aesthetic.
 */

import { useEffect, useState } from 'react';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  autoDismissMs?: number;
}

interface NotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function Notifications({ notifications, onDismiss }: NotificationsProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 1000,
        maxWidth: '320px',
      }}
    >
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const { id, message, type, autoDismissMs = 5000 } = notification;

  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => onDismiss(id), autoDismissMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, autoDismissMs, onDismiss]);

  const bgColors: Record<string, string> = {
    info: 'rgba(74, 94, 138, 0.1)',
    warning: 'rgba(218, 165, 32, 0.15)',
    error: 'rgba(180, 60, 40, 0.15)',
  };

  const borderColors: Record<string, string> = {
    info: 'var(--color-accent, #4A5E8A)',
    warning: '#DAA520',
    error: '#B43C28',
  };

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        background: bgColors[type] || bgColors['info'],
        border: `1px solid ${borderColors[type] || borderColors['info']}`,
        borderRadius: '2px',
        fontFamily: 'var(--font-meta, Courier Prime, monospace)',
        fontSize: '0.8rem',
        color: 'var(--color-ink, #2C2C2C)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '0.5rem',
        boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => onDismiss(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          lineHeight: 1,
          color: 'inherit',
          opacity: 0.6,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Hook to manage notifications state including LLM fallback notifications.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (n: Omit<Notification, 'id'>) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setNotifications((prev) => [...prev, { ...n, id }]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ reason: string }>).detail;
      addNotification({
        message: `LLM scoring unavailable — using edit-distance mode. ${detail.reason}`,
        type: 'warning',
        autoDismissMs: 5000,
      });
    };

    window.addEventListener('manum:llm-fallback', handler);
    return () => window.removeEventListener('manum:llm-fallback', handler);
  }, []);

  return { notifications, addNotification, dismissNotification };
}
