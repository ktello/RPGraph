import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { NodeResizeControl, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeLayoutSync } from '../shared/CardView';

const minNoteFontSize = 10;
const maxNoteFontSize = 32;

function clampFontSize(value: number) {
  if (!Number.isFinite(value)) {
    return 14;
  }
  return Math.min(maxNoteFontSize, Math.max(minNoteFontSize, value));
}

function inlineMarkdown(text: string) {
  const parts: ReactNode[] = [];
  const pattern = /(\[\[[^\]]+\]\([^)]+\)\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index));
    }
    const token = match[0];
    const nestedLink = /^\[\[([^\]]+)\]\([^)]+\)\]\(([^)]+)\)$/.exec(token);
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
    if (nestedLink) {
      parts.push(
        <a
          key={`${match.index}-nested-link`}
          href={nestedLink[2]}
          target="_blank"
          rel="noreferrer"
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {inlineMarkdown(nestedLink[1])}
        </a>,
      );
    } else if (link) {
      parts.push(
        <a
          key={`${match.index}-link`}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {inlineMarkdown(link[1])}
        </a>,
      );
    } else if (token.startsWith('**')) {
      parts.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>);
    }
    cursor = match.index + token.length;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts;
}

function isMarkdownTableRow(line: string) {
  const trimmed = line.trim();
  return trimmed.includes('|') && splitMarkdownTableRow(trimmed).length > 1;
}

function isMarkdownTableDelimiter(line: string) {
  const cells = splitMarkdownTableRow(line.trim());
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function isMarkdownTableStart(lines: string[], index: number) {
  return isMarkdownTableRow(lines[index]) && index + 1 < lines.length && isMarkdownTableDelimiter(lines[index + 1]);
}

function splitMarkdownTableRow(line: string) {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.endsWith('|')) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed.split('|').map((cell) => cell.trim());
}

function markdownTableAlignment(delimiterCell: string): CSSProperties['textAlign'] {
  const trimmed = delimiterCell.trim();
  if (trimmed.startsWith(':') && trimmed.endsWith(':')) {
    return 'center';
  }
  if (trimmed.endsWith(':')) {
    return 'right';
  }
  return 'left';
}

function renderMarkdownTable(tableLines: string[], key: string) {
  const headerCells = splitMarkdownTableRow(tableLines[0]);
  const delimiterCells = splitMarkdownTableRow(tableLines[1]);
  const alignments = headerCells.map((_, index) => markdownTableAlignment(delimiterCells[index] ?? '---'));
  const bodyRows = tableLines.slice(2).map(splitMarkdownTableRow);

  return (
    <div className="note-table-wrap" key={key}>
      <table className="note-table">
        <thead>
          <tr>
            {headerCells.map((cell, index) => (
              <th key={index} style={{ textAlign: alignments[index] }}>
                {inlineMarkdown(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headerCells.map((_, cellIndex) => (
                <td key={cellIndex} style={{ textAlign: alignments[cellIndex] }}>
                  {inlineMarkdown(row[cellIndex] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function markdownBlocks(text: string) {
  if (!text.trim()) {
    return [];
  }
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let unorderedList: string[] = [];
  let orderedList: string[] = [];
  let quote: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }
    blocks.push(<p key={`p-${blocks.length}`}>{inlineMarkdown(paragraph.join(' '))}</p>);
    paragraph = [];
  };
  const flushUnorderedList = () => {
    if (!unorderedList.length) {
      return;
    }
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {unorderedList.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}
      </ul>,
    );
    unorderedList = [];
  };
  const flushOrderedList = () => {
    if (!orderedList.length) {
      return;
    }
    blocks.push(
      <ol key={`ol-${blocks.length}`}>
        {orderedList.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}
      </ol>,
    );
    orderedList = [];
  };
  const flushQuote = () => {
    if (!quote.length) {
      return;
    }
    blocks.push(<blockquote key={`quote-${blocks.length}`}>{quote.map((line) => inlineMarkdown(line))}</blockquote>);
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushUnorderedList();
    flushOrderedList();
    flushQuote();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      flushAll();
      continue;
    }
    if (/^-{3,}$/.test(trimmed)) {
      flushAll();
      blocks.push(<hr key={`hr-${blocks.length}`} />);
      continue;
    }
    if (isMarkdownTableStart(lines, index)) {
      flushAll();
      const tableLines = [line, lines[index + 1]];
      index += 2;
      while (index < lines.length && isMarkdownTableRow(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }
      index -= 1;
      blocks.push(renderMarkdownTable(tableLines, `table-${blocks.length}`));
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushAll();
      const HeadingTag = `h${heading[1].length + 1}` as 'h2' | 'h3' | 'h4' | 'h5';
      blocks.push(<HeadingTag key={`h-${blocks.length}`}>{inlineMarkdown(heading[2])}</HeadingTag>);
      continue;
    }
    const quoteLine = /^>\s?(.+)$/.exec(trimmed);
    if (quoteLine) {
      flushParagraph();
      flushUnorderedList();
      flushOrderedList();
      quote.push(quoteLine[1]);
      continue;
    }
    const listItem = /^[-*+]\s+(.+)$/.exec(trimmed);
    if (listItem) {
      flushParagraph();
      flushOrderedList();
      flushQuote();
      unorderedList.push(listItem[1]);
      continue;
    }
    const orderedItem = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (orderedItem) {
      flushParagraph();
      flushUnorderedList();
      flushQuote();
      orderedList.push(orderedItem[1]);
      continue;
    }
    flushUnorderedList();
    flushOrderedList();
    flushQuote();
    paragraph.push(trimmed);
  }
  flushAll();
  return blocks;
}

export function NoteNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { updateData } = useNodeActions();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.noteText ?? '');
  const noteText = data.noteText ?? '';
  const noteFontSize = clampFontSize(data.noteFontSize ?? 14);

  useEffect(() => {
    if (editing) {
      editorRef.current?.focus();
      editorRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    const el = nodeBodyRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stop, { passive: true });
    return () => el.removeEventListener('wheel', stop);
  }, [nodeBodyRef]);

  const saveDraft = () => {
    updateData(id, {
      noteText: draft,
      preview: draft.trim() ? 'Note written' : 'Empty note',
    });
    setEditing(false);
  };

  const changeFontSize = (delta: number) => {
    updateData(id, { noteFontSize: clampFontSize(noteFontSize + delta) });
  };

  return (
    <div className="workflow-node note-node" ref={nodeBodyRef}>
      <NodeResizeControl className="note-resize-control" minHeight={160} minWidth={260} />
      <div className="note-size-controls nodrag">
        <button type="button" aria-label="Decrease text size" onClick={() => changeFontSize(-1)}>
          -
        </button>
        <button type="button" aria-label="Increase text size" onClick={() => changeFontSize(1)}>
          +
        </button>
      </div>
      {editing ? (
        <textarea
          ref={editorRef}
          className="note-editor nodrag nowheel"
          aria-label="Text"
          value={draft}
          style={{ fontSize: noteFontSize }}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={saveDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              saveDraft();
            }
            if (event.key === 'Escape') {
              setDraft(noteText);
              setEditing(false);
            }
          }}
        />
      ) : (
        <div
          className="note-markdown nowheel"
          style={{ fontSize: noteFontSize }}
          onDoubleClick={() => {
            setDraft(noteText);
            setEditing(true);
          }}
          onWheel={(event) => event.stopPropagation()}
        >
          {markdownBlocks(noteText)}
        </div>
      )}
    </div>
  );
}
