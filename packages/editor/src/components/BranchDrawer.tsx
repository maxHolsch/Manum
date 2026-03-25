/**
 * T134, T135: Branch drawer with list, creation, and switching
 * T160: Timeline tab added
 * T178: Slide animation
 */

import { useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { listBranches, createBranch, checkoutBranch, renameBranch } from '../git/branches';
import type { BranchInfo } from '../git/branches';
import { Timeline } from './Timeline';
import '../styles/drawer.css';

type DrawerTab = 'branches' | 'timeline';

interface BranchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  docId: string;
  currentCommitOid?: string | null;
  onNavigateToCommit?: (oid: string) => void;
}

export function BranchDrawer({
  isOpen,
  onClose,
  editor,
  docId,
  currentCommitOid,
  onNavigateToCommit,
}: BranchDrawerProps) {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>('branches');

  const refreshBranches = useCallback(async () => {
    try {
      const list = await listBranches();
      setBranches(list);
    } catch {
      // Repo may not be initialized yet
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void refreshBranches();
    }
  }, [isOpen, refreshBranches]);

  const handleCreateBranch = async () => {
    setLoading(true);
    try {
      await createBranch();
      await refreshBranches();
    } catch (e) {
      console.error('Failed to create branch:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    if (!editor) return;
    setLoading(true);
    try {
      const content = await checkoutBranch(branchName, docId);
      if (content) {
        editor.commands.setContent(content as JSONContent);
      }
      await refreshBranches();
    } catch (e) {
      console.error('Failed to switch branch:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRename = (branchName: string) => {
    setEditingBranch(branchName);
    setEditName(branchName);
  };

  const handleFinishRename = async () => {
    if (!editingBranch || !editName.trim() || editName === editingBranch) {
      setEditingBranch(null);
      return;
    }
    setLoading(true);
    try {
      await renameBranch(editingBranch, editName.trim());
      await refreshBranches();
    } catch (e) {
      console.error('Failed to rename branch:', e);
    } finally {
      setLoading(false);
      setEditingBranch(null);
    }
  };

  return (
    <div className={`manum-drawer${isOpen ? ' open' : ''}`} data-testid="branch-drawer">
      <div className="manum-drawer-header">
        <h3
          style={{
            fontFamily: 'var(--font-display, Special Elite)',
            margin: 0,
            color: 'var(--color-ink, #2C2C2C)',
            fontSize: '1rem',
          }}
        >
          Paper Drawer
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-gray, #8C8C7C)',
            fontSize: '1.2rem',
          }}
          aria-label="Close drawer"
        >
          ×
        </button>
      </div>

      <div className="manum-drawer-tabs">
        <button
          className={`manum-drawer-tab${activeTab === 'branches' ? ' active' : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          Branches
        </button>
        <button
          className={`manum-drawer-tab${activeTab === 'timeline' ? ' active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      <div className="manum-drawer-body">
        {activeTab === 'branches' ? (
          <>
            {branches.map((branch) => (
              <div
                key={branch.name}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '2px',
                  background: branch.isActive ? 'rgba(74, 94, 138, 0.12)' : 'transparent',
                  border: branch.isActive
                    ? '1px solid rgba(74, 94, 138, 0.3)'
                    : '1px solid transparent',
                  marginBottom: '0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={() => !branch.isActive && void handleSwitchBranch(branch.name)}
                data-testid={`branch-item-${branch.name}`}
              >
                {editingBranch === branch.name ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => void handleFinishRename()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleFinishRename();
                      if (e.key === 'Escape') setEditingBranch(null);
                    }}
                    autoFocus
                    style={{
                      fontFamily: 'var(--font-meta, Courier Prime)',
                      fontSize: '0.85rem',
                      border: '1px solid var(--color-accent, #4A5E8A)',
                      background: 'transparent',
                      padding: '0.1rem 0.25rem',
                      flex: 1,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: 'var(--font-meta, Courier Prime)',
                      fontSize: '0.85rem',
                      color: branch.isActive
                        ? 'var(--color-accent, #4A5E8A)'
                        : 'var(--color-ink, #2C2C2C)',
                      fontWeight: branch.isActive ? 600 : 400,
                    }}
                  >
                    {branch.isActive ? '● ' : '○ '}
                    {branch.name}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRename(branch.name);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-gray, #8C8C7C)',
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.25rem',
                  }}
                  aria-label={`Rename ${branch.name}`}
                  title="Rename"
                >
                  ✎
                </button>
              </div>
            ))}
          </>
        ) : (
          <Timeline
            docId={docId}
            currentOid={currentCommitOid ?? null}
            onSelectCommit={onNavigateToCommit ?? (() => {})}
          />
        )}
      </div>

      {activeTab === 'branches' && (
        <div
          style={{
            padding: '0.75rem',
            borderTop: '1px solid var(--color-border, #D4C9A8)',
          }}
        >
          <button
            onClick={() => void handleCreateBranch()}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'var(--color-accent, #4A5E8A)',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              fontFamily: 'var(--font-meta, Courier Prime)',
              fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
            data-testid="create-branch-button"
          >
            + New Branch
          </button>
        </div>
      )}
    </div>
  );
}
