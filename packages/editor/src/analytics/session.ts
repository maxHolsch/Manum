/**
 * T168: Session aggregation and IndexedDB storage
 */

import { subscribe, type AnalyticsEvent } from './event-bus';
import { getDB, type SessionSummary } from '../storage/db';

const SESSION_GAP_MS = 5 * 60 * 1000; // 5 minutes

interface ActiveSession {
  id: string;
  documentId: string;
  startTime: number;
  lastActivity: number;
  editCount: number;
  pasteCount: number;
  deleteCount: number;
  tabSwitches: number;
  branchCreations: number;
  activeTimeMs: number;
  lastActiveStart: number | null;
}

let currentSession: ActiveSession | null = null;
let documentId = '';

function generateId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function startSession(docId: string): ActiveSession {
  return {
    id: generateId(),
    documentId: docId,
    startTime: Date.now(),
    lastActivity: Date.now(),
    editCount: 0,
    pasteCount: 0,
    deleteCount: 0,
    tabSwitches: 0,
    branchCreations: 0,
    activeTimeMs: 0,
    lastActiveStart: Date.now(),
  };
}

async function persistSession(session: ActiveSession): Promise<void> {
  const endTime = session.lastActivity;
  // Close any open active period
  let activeTime = session.activeTimeMs;
  if (session.lastActiveStart !== null) {
    activeTime += endTime - session.lastActiveStart;
  }

  const summary: SessionSummary = {
    id: session.id,
    documentId: session.documentId,
    startTime: session.startTime,
    endTime,
    activeTime,
    editCount: session.editCount,
    pasteCount: session.pasteCount,
    deleteCount: session.deleteCount,
    tabSwitches: session.tabSwitches,
    branchCreations: session.branchCreations,
  };

  try {
    const db = await getDB();
    await db.put('analytics_sessions', summary);
  } catch {
    // Non-fatal
  }
}

function handleEvent(event: AnalyticsEvent): void {
  if (!documentId) return;

  const now = event.timestamp;

  // Check if we need to start a new session
  if (currentSession === null) {
    currentSession = startSession(documentId);
  } else if (now - currentSession.lastActivity > SESSION_GAP_MS) {
    // End old session and start new one
    void persistSession(currentSession);
    currentSession = startSession(documentId);
  }

  // Update activity
  if (currentSession.lastActiveStart === null) {
    currentSession.lastActiveStart = now;
  }
  currentSession.lastActivity = now;

  // Aggregate by event type
  switch (event.type) {
    case 'edit':
      currentSession.editCount++;
      break;
    case 'paste':
      currentSession.pasteCount++;
      break;
    case 'delete':
      currentSession.deleteCount++;
      break;
    case 'tab_switch':
      currentSession.tabSwitches++;
      break;
    case 'branch_create':
      currentSession.branchCreations++;
      break;
  }
}

export function initSessionTracker(docId: string): () => void {
  documentId = docId;
  currentSession = startSession(docId);

  const unsubscribers = [
    'edit',
    'paste',
    'delete',
    'tab_switch',
    'branch_create',
    'branch_resize',
    'scroll',
    'active_time',
    'ai_usage',
  ].map((type) => subscribe(type as Parameters<typeof subscribe>[0], handleEvent));

  // Flush on page unload
  const handleUnload = () => {
    if (currentSession) {
      void persistSession(currentSession);
    }
  };
  window.addEventListener('beforeunload', handleUnload);

  return () => {
    unsubscribers.forEach((u) => u());
    window.removeEventListener('beforeunload', handleUnload);
    if (currentSession) {
      void persistSession(currentSession);
      currentSession = null;
    }
  };
}

export async function getSessionsForDocument(docId: string): Promise<SessionSummary[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('analytics_sessions', 'documentId', docId);
  } catch {
    return [];
  }
}

export async function getAllSessions(): Promise<SessionSummary[]> {
  try {
    const db = await getDB();
    return await db.getAll('analytics_sessions');
  } catch {
    return [];
  }
}

/** Exposed for testing */
export function getCurrentSession(): ActiveSession | null {
  return currentSession;
}

export function resetSessionTracker(): void {
  currentSession = null;
  documentId = '';
}
