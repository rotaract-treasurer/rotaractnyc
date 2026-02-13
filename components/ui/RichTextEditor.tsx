'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

/**
 * Simple contentEditable-based rich text editor.
 * For a full-featured editor, consider integrating Tiptap or Quill.
 */
export default function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Write something...',
  className,
  minHeight = '200px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUserInput = useRef(false);

  // Sync external value changes into the editor
  useEffect(() => {
    if (editorRef.current && !isUserInput.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isUserInput.current = false;
  }, [value]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    isUserInput.current = true;
    onChange(editorRef.current?.innerHTML || '');
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border border-b-0 border-gray-300 dark:border-gray-700 rounded-t-xl bg-gray-50 dark:bg-gray-800">
        <ToolbarButton onClick={() => exec('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('italic')} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('underline')} title="Underline">
          <span className="underline">U</span>
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Bullet list">
          •
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('insertOrderedList')} title="Numbered list">
          1.
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton onClick={() => exec('formatBlock', 'h2')} title="Heading">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('formatBlock', 'h3')} title="Subheading">
          H3
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('formatBlock', 'p')} title="Paragraph">
          ¶
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) exec('createLink', url);
          }}
          title="Link"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('removeFormat')} title="Clear formatting">
          ✕
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className={cn(
          'w-full border border-gray-300 dark:border-gray-700 rounded-b-xl bg-white dark:bg-gray-900 px-4 py-3 text-sm',
          'text-gray-900 dark:text-gray-100 leading-relaxed',
          'focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 focus:border-cranberry-500',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400',
          'prose prose-sm dark:prose-invert max-w-none',
        )}
        style={{ minHeight }}
        suppressContentEditableWarning
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
    >
      {children}
    </button>
  );
}
