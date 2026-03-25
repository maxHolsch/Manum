import type { Editor } from '@tiptap/react';
import { WiredButton } from './ui/WiredButton';

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div
      className="manum-toolbar"
      style={{
        display: 'flex',
        gap: '0.25rem',
        padding: '0.5rem',
        borderBottom: '1px solid var(--color-border)',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <WiredButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        B
      </WiredButton>

      <WiredButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        I
      </WiredButton>

      <WiredButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        H1
      </WiredButton>

      <WiredButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </WiredButton>

      <WiredButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </WiredButton>
    </div>
  );
}
