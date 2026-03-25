/**
 * T138: Branch preview horizontal scroller for branched sections
 */

import { useCallback, useEffect, useState } from 'react';
import { getSectionPreviews } from '../git/section-preview';
import type { SectionPreview } from '../git/section-preview';
import { listBranches } from '../git/branches';

interface BranchPreviewProps {
  docId: string;
  paragraphIndex: number;
  currentBranch: string;
}

export function BranchPreview({ docId, paragraphIndex, currentBranch }: BranchPreviewProps) {
  const [previews, setPreviews] = useState<SectionPreview[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreviews = useCallback(async () => {
    setLoading(true);
    try {
      const branchList = await listBranches();
      const branchNames = branchList.map((b) => b.name);
      const results = await getSectionPreviews(docId, paragraphIndex, branchNames);
      setPreviews(results);
      if (results.length > 0 && !activeTab) {
        setActiveTab(results[0].branchName);
      }
    } catch (e) {
      console.error('Failed to load branch previews:', e);
    } finally {
      setLoading(false);
    }
  }, [docId, paragraphIndex, activeTab]);

  useEffect(() => {
    void loadPreviews();
  }, [loadPreviews]);

  if (previews.length === 0 && !loading) return null;

  const activePreview = previews.find((p) => p.branchName === activeTab);

  return (
    <div
      data-testid="branch-preview-scroller"
      style={{
        background: 'var(--color-paper, #F5F0E8)',
        border: '1px solid var(--color-border, #D4C9A8)',
        borderRadius: '2px',
        marginTop: '0.5rem',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          borderBottom: '1px solid var(--color-border, #D4C9A8)',
          scrollbarWidth: 'thin',
        }}
      >
        {previews.map((preview) => (
          <button
            key={preview.branchName}
            onClick={() => setActiveTab(preview.branchName)}
            data-testid={`branch-tab-${preview.branchName}`}
            style={{
              padding: '0.4rem 0.8rem',
              background:
                activeTab === preview.branchName ? 'rgba(74, 94, 138, 0.12)' : 'transparent',
              border: 'none',
              borderBottom:
                activeTab === preview.branchName
                  ? '2px solid var(--color-accent, #4A5E8A)'
                  : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-meta, Courier Prime)',
              fontSize: '0.75rem',
              color:
                activeTab === preview.branchName
                  ? 'var(--color-accent, #4A5E8A)'
                  : 'var(--color-gray, #8C8C7C)',
              whiteSpace: 'nowrap',
              fontWeight: activeTab === preview.branchName ? 600 : 400,
            }}
          >
            {preview.branchName === currentBranch
              ? `${preview.branchName} (current)`
              : preview.branchName}
          </button>
        ))}
      </div>

      {/* Preview content */}
      {activePreview && (
        <div
          style={{
            padding: '0.6rem 0.8rem',
            fontFamily: 'var(--font-body, Courier Prime)',
            fontSize: '0.85rem',
            color: 'var(--color-ink, #2C2C2C)',
            lineHeight: 1.5,
            maxHeight: '120px',
            overflow: 'auto',
            userSelect: 'none',
          }}
          data-testid="branch-preview-content"
        >
          {activePreview.paragraphText || <em style={{ opacity: 0.5 }}>(empty paragraph)</em>}
        </div>
      )}
    </div>
  );
}
