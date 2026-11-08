import React, { ReactNode } from "react";

interface ArticleContentRendererProps {
  content: string;
  className?: string;
}

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; lines: string[] };

/**
 * Parses inline Markdown: **bold**, *italic*, _italic_, and [label](url).
 * Safely outputs React elements without using dangerouslySetInnerHTML.
 */
function parseInlineMarkdown(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  // Matches:
  // [1,2,3]: [label](url)
  // [4,5]: **bold**
  // [6,7]: *italic*
  // [8,9]: _italic_
  const regex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      tokens.push(text.slice(lastIndex, matchIndex));
    }

    if (match[1]) {
      // Link: [label](url)
      const linkText = match[2];
      const linkUrl = match[3];
      const isExternal = linkUrl.startsWith("http://") || linkUrl.startsWith("https://");
      tokens.push(
        <a
          key={`link-${matchIndex}`}
          href={linkUrl}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-[#B08D57] hover:underline font-medium transition-colors"
        >
          {parseInlineMarkdown(linkText)}
        </a>
      );
    } else if (match[4]) {
      // Bold: **text**
      const boldText = match[5];
      tokens.push(
        <strong key={`bold-${matchIndex}`} className="font-semibold text-[#172B46]">
          {parseInlineMarkdown(boldText)}
        </strong>
      );
    } else if (match[6]) {
      // Italic: *text*
      const italicText = match[7];
      tokens.push(
        <em key={`em-${matchIndex}`} className="italic">
          {italicText}
        </em>
      );
    } else if (match[8]) {
      // Italic: _text_
      const italicText = match[9];
      tokens.push(
        <em key={`em-${matchIndex}`} className="italic">
          {italicText}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.length > 0 ? tokens : [text];
}

/**
 * Parses article markdown into structured blocks.
 * Guarantees that single-newline headings never swallow or wrap subsequent paragraphs.
 */
function parseContentBlocks(content: string): Block[] {
  if (!content) return [];

  // Normalize LF and CRLF line endings
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  const blocks: Block[] = [];
  let currentBlock: Block | null = null;

  const flush = () => {
    if (currentBlock) {
      blocks.push(currentBlock);
      currentBlock = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Blank line indicates block break
    if (!trimmed) {
      flush();
      continue;
    }

    // Heading 3: "### Heading"
    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      flush();
      blocks.push({ type: "h3", text: h3Match[1].trim() });
      continue;
    }

    // Heading 2: "## Heading"
    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      flush();
      blocks.push({ type: "h2", text: h2Match[1].trim() });
      continue;
    }

    // Heading 1: "# Heading" (mapped to h2 to preserve single page-level h1)
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      flush();
      blocks.push({ type: "h2", text: h1Match[1].trim() });
      continue;
    }

    // Blockquote: "> Quote line"
    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      if (currentBlock && currentBlock.type === "quote") {
        currentBlock.lines.push(quoteMatch[1]);
      } else {
        flush();
        currentBlock = { type: "quote", lines: [quoteMatch[1]] };
      }
      continue;
    }

    // Unordered list item: "- Item" or "* Item"
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (currentBlock && currentBlock.type === "ul") {
        currentBlock.items.push(ulMatch[1].trim());
      } else {
        flush();
        currentBlock = { type: "ul", items: [ulMatch[1].trim()] };
      }
      continue;
    }

    // Ordered list item: "1. Item", "2. Item"
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (currentBlock && currentBlock.type === "ol") {
        currentBlock.items.push(olMatch[1].trim());
      } else {
        flush();
        currentBlock = { type: "ol", items: [olMatch[1].trim()] };
      }
      continue;
    }

    // Standard paragraph text
    if (currentBlock && currentBlock.type === "p") {
      currentBlock.text += " " + trimmed;
    } else {
      flush();
      currentBlock = { type: "p", text: trimmed };
    }
  }

  flush();
  return blocks;
}

/**
 * ArticleContentRenderer
 *
 * Renders editorial Markdown content with strict typographic hierarchy,
 * deterministic separation between headings and paragraphs, and responsive
 * Manrope typography.
 */
export default function ArticleContentRenderer({
  content,
  className = "",
}: ArticleContentRendererProps) {
  const blocks = parseContentBlocks(content);

  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className={`article-content-body font-sans text-[#172B46] ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={`h2-${index}`}
                className="text-[22px] sm:text-[24px] lg:text-[26px] font-semibold text-[#172B46] mt-10 mb-4 tracking-tight leading-[1.3] first:mt-0"
              >
                {parseInlineMarkdown(block.text)}
              </h2>
            );

          case "h3":
            return (
              <h3
                key={`h3-${index}`}
                className="text-[19px] sm:text-[20px] lg:text-[21px] font-semibold text-[#172B46] mt-8 mb-3 tracking-tight leading-[1.35] first:mt-0"
              >
                {parseInlineMarkdown(block.text)}
              </h3>
            );

          case "p":
            return (
              <p
                key={`p-${index}`}
                className="text-[16px] sm:text-[17px] lg:text-[18px] text-[#172B46]/85 font-normal leading-[1.72] mb-6 last:mb-0"
              >
                {parseInlineMarkdown(block.text)}
              </p>
            );

          case "ul":
            return (
              <ul key={`ul-${index}`} className="space-y-3 mb-6 pl-1 sm:pl-2">
                {block.items.map((item, itemIdx) => (
                  <li
                    key={`ul-item-${itemIdx}`}
                    className="flex items-start gap-3 text-[15px] sm:text-[16px] lg:text-[17px] text-[#172B46]/85 font-normal leading-[1.65]"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#B08D57] shrink-0 mt-2.5"
                      aria-hidden="true"
                    />
                    <div className="flex-1">{parseInlineMarkdown(item)}</div>
                  </li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol key={`ol-${index}`} className="space-y-3 mb-6 pl-1 sm:pl-2">
                {block.items.map((item, itemIdx) => (
                  <li
                    key={`ol-item-${itemIdx}`}
                    className="flex items-start gap-3 text-[15px] sm:text-[16px] lg:text-[17px] text-[#172B46]/85 font-normal leading-[1.65]"
                  >
                    <span
                      className="font-semibold text-[#B08D57] shrink-0 min-w-[1.25rem] text-sm sm:text-base"
                      aria-hidden="true"
                    >
                      {itemIdx + 1}.
                    </span>
                    <div className="flex-1">{parseInlineMarkdown(item)}</div>
                  </li>
                ))}
              </ol>
            );

          case "quote":
            return (
              <blockquote
                key={`quote-${index}`}
                className="border-l-4 border-[#B08D57] bg-[#F7F5F0]/70 pl-5 pr-4 py-3.5 my-6 rounded-r-xs text-[16px] sm:text-[17px] italic text-[#172B46]/80 leading-[1.65]"
              >
                {block.lines.map((line, lineIdx) => (
                  <p key={`quote-line-${lineIdx}`} className="mb-2 last:mb-0">
                    {parseInlineMarkdown(line)}
                  </p>
                ))}
              </blockquote>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
