import { useState } from 'react'

// Copy Button Component for styled code snippets with feedback
export function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-2 py-0.5 rounded transition-all cursor-pointer flex items-center justify-center text-[10px] gap-1 border active:scale-95 select-none ${
        copied 
          ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' 
          : 'bg-[#171717] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#f5f5f5] border-[#27272a]'
      }`}
      title="Copy code"
    >
      <span className="material-symbols-outlined text-[12px]">
        {copied ? 'check' : 'content_copy'}
      </span>
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

// Custom Markdown Component to render solutions and reasoning nicely
export default function Markdown({ text }) {
  if (!text) return null;

  // Split content by code blocks: ```language ... ```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-content select-text font-sans space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // It's a code block
          const lines = part.split('\n');
          const firstLine = lines[0]; // e.g. ```javascript or ```jsx
          const language = firstLine.replace('```', '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');

          return (
            <div key={index} className="bg-[#0c0c0c] rounded-md p-3.5 font-mono text-[12px] text-[#f5f5f5] border border-[#27272a] overflow-x-auto relative group my-3 select-text">
              <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[#27272a] select-none">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a1a1aa]">{language}</span>
                <CopyButton code={code} />
              </div>
              <pre className="whitespace-pre overflow-x-auto"><code className={`language-${language}`}>{code}</code></pre>
            </div>
          );
        } else {
          // Standard text with paragraphs, bullet points, headers, inline code, bold text, and tables
          return <div key={index} dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(part) }} />;
        }
      })}
    </div>
  );
}

function parseSimpleMarkdown(md) {
  if (!md) return '';

  // Escape HTML entities to prevent XSS (except for the ones we generate)
  let escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Inline formatting: Bold, inline code
  escaped = escaped.replace(/`([^`\n]+)`/g, '<code class="bg-[#27272a]/50 px-1.5 py-0.5 rounded font-mono text-[11px] text-[#818cf8] font-medium">$1</code>');
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-[#f5f5f5]">$1</strong>');

  const lines = escaped.split('\n');
  let result = [];
  let inList = false;
  let listType = null; // 'ul' or 'ol'
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  const closeList = () => {
    if (inList) {
      result.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
  };

  const renderTable = (headers, rows) => {
    const headerHtml = headers.map(h => `<th class="p-2 font-semibold text-[#f5f5f5] border border-[#27272a] bg-[#1f1f1f]">${h}</th>`).join('');
    const rowsHtml = rows.map(r => {
      const cellsHtml = r.map(c => `<td class="p-2 border border-[#27272a]">${c}</td>`).join('');
      return `<tr class="hover:bg-[#27272a]/20 transition-colors">${cellsHtml}</tr>`;
    }).join('');

    return `
      <div class="overflow-x-auto my-3 rounded border border-[#27272a] bg-[#111111]/30">
        <table class="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Table Parsing
    if (trimmed.startsWith('|')) {
      closeList();

      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isSeparator = cells.every(c => /^:-{1,}:?$/g.test(c) || /^-+$/g.test(c));
      
      if (isSeparator) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      if (inTable) {
        result.push(renderTable(tableHeaders, tableRows));
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }
    }

    // 2. Header Parsing
    if (trimmed.startsWith('### ')) {
      closeList();
      result.push(`<h3 class="text-[12px] font-bold text-[#f5f5f5] mb-2 mt-4 flex items-center gap-1.5">${trimmed.substring(4)}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeList();
      result.push(`<h2 class="text-xs font-semibold text-[#f5f5f5] mb-2 mt-4 border-b border-[#27272a] pb-1">${trimmed.substring(3)}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      closeList();
      result.push(`<h1 class="text-sm font-bold text-[#f5f5f5] mb-3 mt-4">${trimmed.substring(2)}</h1>`);
      continue;
    }

    // 3. List Parsing
    const isUnordered = trimmed.startsWith('* ') || trimmed.startsWith('- ');
    const isOrdered = /^\d+\.\s/.test(trimmed);

    if (isUnordered || isOrdered) {
      const currentListType = isUnordered ? 'ul' : 'ol';
      const content = isUnordered ? trimmed.substring(2) : trimmed.replace(/^\d+\.\s/, '');

      if (!inList) {
        inList = true;
        listType = currentListType;
        result.push(`<${listType} class="${listType === 'ul' ? 'list-disc' : 'list-decimal'} pl-4 mb-2.5 text-[11px] text-[#a1a1aa] space-y-1">`);
      } else if (listType !== currentListType) {
        result.push(`</${listType}>`);
        listType = currentListType;
        result.push(`<${listType} class="${listType === 'ul' ? 'list-disc' : 'list-decimal'} pl-4 mb-2.5 text-[11px] text-[#a1a1aa] space-y-1">`);
      }

      result.push(`<li>${content}</li>`);
      continue;
    } else {
      closeList();
    }

    // 4. Standard Paragraph
    if (trimmed.length > 0) {
      result.push(`<p class="mb-2 text-[11px] text-[#a1a1aa] leading-relaxed">${trimmed}</p>`);
    }
  }

  closeList();
  if (inTable) {
    result.push(renderTable(tableHeaders, tableRows));
  }

  return result.join('\n');
}
