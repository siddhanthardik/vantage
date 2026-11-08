import DOMPurify from "isomorphic-dompurify";

/**
 * Checks whether content is structured HTML (as output by Tiptap)
 * or legacy/plain Markdown text.
 */
export function isHtmlContent(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return /^<(!DOCTYPE|[a-z]+)(\s|>)/i.test(trimmed) || (trimmed.startsWith("<p>") && trimmed.endsWith("</p>"));
}

/**
 * Converts legacy Markdown into clean, semantic HTML suitable for Tiptap
 * or direct rendering.
 */
export function markdownToHtml(content: string): string {
  if (!content) return "";
  if (isHtmlContent(content)) return content;

  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  let html = "";
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html += "</ul>";
      inUl = false;
    }
    if (inOl) {
      html += "</ol>";
      inOl = false;
    }
  };

  const inlineFormat = (text: string): string => {
    return text
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>");
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    // Heading 3
    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      closeLists();
      html += `<h3>${inlineFormat(h3Match[1].trim())}</h3>`;
      continue;
    }

    // Heading 2
    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      closeLists();
      html += `<h2>${inlineFormat(h2Match[1].trim())}</h2>`;
      continue;
    }

    // Heading 1 (maps to h2 to preserve page title h1)
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      closeLists();
      html += `<h2>${inlineFormat(h1Match[1].trim())}</h2>`;
      continue;
    }

    // Blockquote
    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      closeLists();
      html += `<blockquote><p>${inlineFormat(quoteMatch[1].trim())}</p></blockquote>`;
      continue;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (inOl) {
        html += "</ol>";
        inOl = false;
      }
      if (!inUl) {
        html += "<ul>";
        inUl = true;
      }
      html += `<li>${inlineFormat(ulMatch[1].trim())}</li>`;
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inUl) {
        html += "</ul>";
        inUl = false;
      }
      if (!inOl) {
        html += "<ol>";
        inOl = true;
      }
      html += `<li>${inlineFormat(olMatch[1].trim())}</li>`;
      continue;
    }

    closeLists();
    html += `<p>${inlineFormat(trimmed)}</p>`;
  }

  closeLists();
  return html;
}

/**
 * Sanitizes rich-text HTML against XSS vulnerabilities while preserving
 * allowed tags and styling attributes.
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "span", "strong", "em", "u", "s", "strike",
      "ul", "ol", "li",
      "blockquote", "hr", "br",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption", "div",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel",
      "src", "alt", "title", "width", "height", "loading",
      "class", "style", "colspan", "rowspan", "align",
    ],
    ADD_ATTR: ["target"],
  });
}
