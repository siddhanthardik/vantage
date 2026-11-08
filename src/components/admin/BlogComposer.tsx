"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
  Trash2,
} from "lucide-react";
import MediaPickerModal from "./MediaPickerModal";
import { isHtmlContent, markdownToHtml } from "@/lib/content/contentConverter";

interface BlogComposerProps {
  content: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
}

export default function BlogComposer({
  content,
  onChange,
  placeholder = "Compose your research article here...",
}: BlogComposerProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isLinkPromptOpen, setIsLinkPromptOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Convert incoming Markdown to HTML if needed for Tiptap
  const initialHtml = isHtmlContent(content) ? content : markdownToHtml(content);
  const lastEmittedHtmlRef = useRef<string>(initialHtml);

  const editor = useEditor({
    extensions: [
      // StarterKit with link & underline disabled to prevent duplicate extension warnings in Tiptap v3
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#B08D57] underline font-medium",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-xs max-w-full my-4 border border-[#E5DFD5]",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-[#E5DFD5] w-full my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-[#E5DFD5] bg-[#F7F5F0] px-3 py-2 text-left font-semibold text-[#172B46]",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-[#E5DFD5] px-3 py-2 text-[#172B46]",
        },
      }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[340px] px-5 py-4 text-sm sm:text-base leading-relaxed text-[#172B46] font-sans",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedHtmlRef.current = html;
      onChange(html);
    },
    immediatelyRender: false,
  });

  // Keep editor content in sync when loaded/changed externally (e.g. revision rollback)
  // Guarded against overwriting user's active typing or looping editor's own emitted HTML
  useEffect(() => {
    if (!editor) return;
    const targetHtml = isHtmlContent(content) ? content : markdownToHtml(content);
    // Ignore updates if content matches what the editor already generated
    if (targetHtml === lastEmittedHtmlRef.current) return;
    // Never disrupt the user while the editor is actively focused
    if (editor.isFocused) return;

    if (editor.getHTML() !== targetHtml) {
      lastEmittedHtmlRef.current = targetHtml;
      editor.commands.setContent(targetHtml, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="w-full h-80 bg-[#F7F5F0]/60 border border-[#E5DFD5] rounded-sm flex items-center justify-center text-xs text-[#172B46]/60">
        Initializing Vantage Wealth Blog Composer...
      </div>
    );
  }

  // Safe command execution helper that maintains focus without forcing page scroll jumps
  const exec = (command: (chain: any) => { run: () => boolean }) => {
    if (!editor) return;
    command(editor.chain().focus(undefined, { scrollIntoView: false })).run();
  };

  const handleLinkPromptOpen = () => {
    const prevUrl = editor.getAttributes("link").href || "";
    setLinkUrl(prevUrl);
    setIsLinkPromptOpen(true);
  };

  const applyLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus(undefined, { scrollIntoView: false }).extendMarkRange("link").unsetLink().run();
      setIsLinkPromptOpen(false);
      return;
    }
    const formattedUrl = /^https?:\/\//i.test(linkUrl.trim())
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .extendMarkRange("link")
      .setLink({ href: formattedUrl })
      .run();
    setLinkUrl("");
    setIsLinkPromptOpen(false);
  };

  const handleMediaInsert = ({
    url,
    altText,
    caption,
  }: {
    url: string;
    altText: string;
    caption?: string;
  }) => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setImage({ src: url, alt: altText, title: caption })
      .run();
  };

  const insertTable = () => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div
      className={`border border-[#E5DFD5] bg-[#FFFFFF] rounded-sm transition-all flex flex-col font-sans ${
        isFullScreen ? "fixed inset-0 z-50 rounded-none shadow-2xl h-screen" : "relative shadow-xs"
      }`}
    >
      {/* TOOLBAR */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 p-2 bg-[#F7F5F0] border-b border-[#E5DFD5] text-[#172B46]">
        {/* Undo / Redo */}
        <div className="flex items-center border-r border-[#E5DFD5] pr-1.5 mr-1 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Undo (Ctrl+Z)"
            onClick={() => exec((chain) => chain.undo())}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-xs hover:bg-[#FFFFFF] disabled:opacity-30 transition-colors cursor-pointer text-[#172B46]"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Redo (Ctrl+Y)"
            onClick={() => exec((chain) => chain.redo())}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-xs hover:bg-[#FFFFFF] disabled:opacity-30 transition-colors cursor-pointer text-[#172B46]"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center border-r border-[#E5DFD5] pr-1.5 mr-1 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Paragraph"
            onClick={() => exec((chain) => chain.setParagraph())}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("paragraph") ? "bg-[#172B46] text-[#FFFFFF]" : "hover:bg-[#FFFFFF]"
            }`}
          >
            <Pilcrow className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Heading 1"
            onClick={() => exec((chain) => chain.toggleHeading({ level: 1 }))}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("heading", { level: 1 })
                ? "bg-[#172B46] text-[#FFFFFF]"
                : "hover:bg-[#FFFFFF]"
            }`}
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Heading 2"
            onClick={() => exec((chain) => chain.toggleHeading({ level: 2 }))}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("heading", { level: 2 })
                ? "bg-[#172B46] text-[#FFFFFF]"
                : "hover:bg-[#FFFFFF]"
            }`}
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Heading 3"
            onClick={() => exec((chain) => chain.toggleHeading({ level: 3 }))}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("heading", { level: 3 })
                ? "bg-[#172B46] text-[#FFFFFF]"
                : "hover:bg-[#FFFFFF]"
            }`}
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Styles: Bold, Italic, Underline */}
        <div className="flex items-center border-r border-[#E5DFD5] pr-1.5 mr-1 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Bold (Ctrl+B)"
            onClick={() => exec((chain) => chain.toggleBold())}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("bold") ? "bg-[#172B46] text-[#FFFFFF]" : "hover:bg-[#FFFFFF]"
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Italic (Ctrl+I)"
            onClick={() => exec((chain) => chain.toggleItalic())}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("italic") ? "bg-[#172B46] text-[#FFFFFF]" : "hover:bg-[#FFFFFF]"
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Underline (Ctrl+U)"
            onClick={() => exec((chain) => chain.toggleUnderline())}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("underline") ? "bg-[#172B46] text-[#FFFFFF]" : "hover:bg-[#FFFFFF]"
            }`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center border-r border-[#E5DFD5] pr-1.5 mr-1 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Align Left"
            onClick={() => exec((chain) => chain.setTextAlign("left"))}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive({ textAlign: "left" })
                ? "bg-[#172B46] text-[#FFFFFF]"
                : "hover:bg-[#FFFFFF]"
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Align Center"
            onClick={() => exec((chain) => chain.setTextAlign("center"))}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive({ textAlign: "center" })
                ? "bg-[#172B46] text-[#FFFFFF]"
                : "hover:bg-[#FFFFFF]"
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Align Right"
            onClick={() => exec((chain) => chain.setTextAlign("right"))}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive({ textAlign: "right" })
                ? "bg-[#172B46] text-[#FFFFFF]"
                : "hover:bg-[#FFFFFF]"
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Justify"
            onClick={() => exec((chain) => chain.setTextAlign("justify"))}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive({ textAlign: "justify" })
                ? "bg-[#172B46] text-[#FFFFFF]"
                : "hover:bg-[#FFFFFF]"
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center border-r border-[#E5DFD5] pr-1.5 mr-1 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Bullet List"
            onClick={() => exec((chain) => chain.toggleBulletList())}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("bulletList") ? "bg-[#172B46] text-[#FFFFFF]" : "hover:bg-[#FFFFFF]"
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Numbered List"
            onClick={() => exec((chain) => chain.toggleOrderedList())}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("orderedList") ? "bg-[#172B46] text-[#FFFFFF]" : "hover:bg-[#FFFFFF]"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Blockquote"
            onClick={() => exec((chain) => chain.toggleBlockquote())}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("blockquote") ? "bg-[#172B46] text-[#FFFFFF]" : "hover:bg-[#FFFFFF]"
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Horizontal Divider"
            onClick={() => exec((chain) => chain.setHorizontalRule())}
            className="p-1.5 rounded-xs hover:bg-[#FFFFFF] transition-colors cursor-pointer text-[#172B46]"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Links & Media */}
        <div className="flex items-center border-r border-[#E5DFD5] pr-1.5 mr-1 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Add Hyperlink"
            onClick={handleLinkPromptOpen}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("link") ? "bg-[#172B46] text-[#FFFFFF]" : "hover:bg-[#FFFFFF]"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Remove Hyperlink"
              onClick={() => exec((chain) => chain.unsetLink())}
              className="p-1.5 rounded-xs hover:bg-[#FFFFFF] text-red-600 transition-colors cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Insert Image from Media Library"
            onClick={() => setIsMediaPickerOpen(true)}
            className="p-1.5 rounded-xs hover:bg-[#FFFFFF] text-[#B08D57] transition-colors cursor-pointer font-semibold flex items-center gap-1"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider hidden sm:inline">Image</span>
          </button>
        </div>

        {/* Tables */}
        <div className="flex items-center border-r border-[#E5DFD5] pr-1.5 mr-1 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="Insert 3x3 Table"
            onClick={insertTable}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              editor.isActive("table") ? "bg-[#172B46] text-[#FFFFFF]" : "hover:bg-[#FFFFFF]"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          {editor.isActive("table") && (
            <>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Add Column"
                onClick={() => exec((chain) => chain.addColumnAfter())}
                className="p-1 rounded-xs hover:bg-[#FFFFFF] text-[10px] text-[#172B46] font-bold cursor-pointer"
              >
                +Col
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Add Row"
                onClick={() => exec((chain) => chain.addRowAfter())}
                className="p-1 rounded-xs hover:bg-[#FFFFFF] text-[10px] text-[#172B46] font-bold cursor-pointer"
              >
                +Row
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Delete Table"
                onClick={() => exec((chain) => chain.deleteTable())}
                className="p-1 rounded-xs hover:bg-[#FFFFFF] text-[10px] text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        {/* Full Screen Mode Toggle */}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-xs hover:bg-[#FFFFFF] transition-colors cursor-pointer text-[#172B46]"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* INLINE LINK PROMPT MODAL */}
      {isLinkPromptOpen && (
        <div className="p-3 bg-[#F7F5F0] border-b border-[#E5DFD5] flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-[#B08D57]" />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter destination URL (e.g. https://example.com)..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
            className="flex-1 px-3 py-1.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-xs focus:outline-none focus:border-[#B08D57]"
            autoFocus
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyLink}
            className="px-3 py-1.5 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-xs font-semibold rounded-xs transition-colors cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsLinkPromptOpen(false)}
            className="px-2.5 py-1.5 border border-[#E5DFD5] bg-[#FFFFFF] text-[#172B46] text-xs rounded-xs hover:bg-[#F7F5F0] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* EDITOR CONTENT AREA */}
      <div className={`overflow-y-auto ${isFullScreen ? "flex-1" : "min-h-[380px]"}`}>
        <EditorContent editor={editor} />
      </div>

      {/* MEDIA PICKER MODAL */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaInsert}
      />
    </div>
  );
}
