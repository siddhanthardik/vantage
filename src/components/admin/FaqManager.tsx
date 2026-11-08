"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, HelpCircle, Eye, EyeOff, Check, X } from "lucide-react";
import { ArticleFaqItem } from "@/types/article";

interface FaqManagerProps {
  faqs: ArticleFaqItem[];
  onChange: (faqs: ArticleFaqItem[]) => void;
}

export default function FaqManager({ faqs = [], onChange }: FaqManagerProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Auto-resize helper for textareas
  const autoResizeTextarea = (el: HTMLTextAreaElement | null, minHeight: number) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  };

  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newFaq: ArticleFaqItem = {
      id: `faq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      displayOrder: faqs.length + 1,
      isEnabled: true,
    };

    onChange([...faqs, newFaq]);
    setNewQuestion("");
    setNewAnswer("");
    setIsAdding(false);
  };

  const handleUpdateFaq = (id: string, updates: Partial<ArticleFaqItem>) => {
    const updated = faqs.map((faq) => (faq.id === id ? { ...faq, ...updates } : faq));
    onChange(updated);
  };

  const handleDeleteFaq = (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this FAQ?");
    if (!confirmDelete) return;

    const filtered = faqs
      .filter((faq) => faq.id !== id)
      .map((faq, idx) => ({ ...faq, displayOrder: idx + 1 }));
    onChange(filtered);
  };

  const handleMoveFaq = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const list = [...faqs];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reordered = list.map((faq, idx) => ({ ...faq, displayOrder: idx + 1 }));
    onChange(reordered);
  };

  return (
    <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-5 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DFD5] pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#B08D57]" />
          <h3 className="text-sm font-bold text-[#172B46] uppercase tracking-wider">
            Article FAQ Manager
          </h3>
          <span className="text-xs bg-[#B08D57]/15 text-[#8C6B37] px-2.5 py-0.5 rounded-xs font-semibold">
            {faqs.length} {faqs.length === 1 ? "FAQ" : "FAQs"}
          </span>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-3.5 py-2 rounded-xs transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New FAQ</span>
          </button>
        )}
      </div>

      <p className="text-xs text-[#172B46]/70 leading-relaxed font-light">
        Add frequently asked questions to address reader inquiries, demonstrate advisory expertise,
        and generate valid FAQPage Google structured schema automatically.
      </p>

      {/* NEW FAQ FORM */}
      {isAdding && (
        <div className="p-5 bg-[#F7F5F0]/80 border border-[#B08D57]/50 rounded-sm space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B46]">
              New Question &amp; Answer
            </h4>
            <span className="text-[11px] text-[#B08D57] font-semibold">
              Item #{faqs.length + 1}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#172B46] uppercase tracking-wider mb-1.5">
              Question Title * <span className="text-[#172B46]/50 font-normal lowercase">(wraps naturally, multi-line supported)</span>
            </label>
            <textarea
              rows={2}
              value={newQuestion}
              onChange={(e) => {
                setNewQuestion(e.target.value);
                autoResizeTextarea(e.target, 52);
              }}
              placeholder="e.g. How does multi-bucket wealth architecture mitigate sequence-of-returns risk for high-net-worth Indian families?"
              className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs sm:text-[13px] font-medium text-[#172B46] rounded-xs focus:outline-none focus:border-[#B08D57] min-h-[52px] leading-relaxed resize-y"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#172B46] uppercase tracking-wider mb-1.5">
              Fiduciary Answer *
            </label>
            <textarea
              rows={3}
              value={newAnswer}
              onChange={(e) => {
                setNewAnswer(e.target.value);
                autoResizeTextarea(e.target, 90);
              }}
              placeholder="Provide a comprehensive fiduciary response outlining clear principles, risk safeguards, or portfolio considerations..."
              className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs sm:text-[13px] text-[#172B46] rounded-xs focus:outline-none focus:border-[#B08D57] min-h-[90px] leading-relaxed resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5DFD5]">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewQuestion("");
                setNewAnswer("");
              }}
              className="px-3.5 py-2 border border-[#E5DFD5] bg-[#FFFFFF] text-xs text-[#172B46] font-semibold rounded-xs hover:bg-[#F7F5F0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!newQuestion.trim() || !newAnswer.trim()}
              onClick={handleAddFaq}
              className="px-4 py-2 bg-[#172B46] hover:bg-[#B08D57] disabled:opacity-40 text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-xs"
            >
              Save FAQ Item
            </button>
          </div>
        </div>
      )}

      {/* FAQS LIST */}
      {faqs.length === 0 && !isAdding ? (
        <div className="py-10 text-center border border-dashed border-[#E5DFD5] rounded-sm bg-[#F7F5F0]/30 text-xs text-[#172B46]/60 space-y-2">
          <HelpCircle className="w-6 h-6 text-[#172B46]/30 mx-auto" />
          <p>No FAQs configured for this publication yet.</p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold text-[#B08D57] hover:underline"
          >
            + Click here to add your first FAQ
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`rounded-sm border transition-all ${
                faq.isEnabled
                  ? "bg-[#FFFFFF] border-[#E5DFD5] shadow-xs"
                  : "bg-[#F7F5F0]/60 border-[#E5DFD5]/70 opacity-70"
              }`}
            >
              {/* Separate Clean Header Row for Number & Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#F7F5F0] border-b border-[#E5DFD5]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B08D57] bg-[#B08D57]/15 px-2 py-0.5 rounded-xs">
                    FAQ #{index + 1}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-xs ${
                      faq.isEnabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {faq.isEnabled ? "Visible on Article" : "Hidden"}
                  </span>
                </div>

                {/* Action Controls: Move Up, Move Down, Visibility Toggle, Delete */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Move Up"
                    disabled={index === 0}
                    onClick={() => handleMoveFaq(index, "up")}
                    className="p-1.5 rounded-xs hover:bg-[#FFFFFF] disabled:opacity-20 text-[#172B46] border border-transparent hover:border-[#E5DFD5] transition-colors cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Move Down"
                    disabled={index === faqs.length - 1}
                    onClick={() => handleMoveFaq(index, "down")}
                    className="p-1.5 rounded-xs hover:bg-[#FFFFFF] disabled:opacity-20 text-[#172B46] border border-transparent hover:border-[#E5DFD5] transition-colors cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title={faq.isEnabled ? "Hide this FAQ from public view" : "Make this FAQ visible publicly"}
                    onClick={() => handleUpdateFaq(faq.id, { isEnabled: !faq.isEnabled })}
                    className={`p-1.5 rounded-xs transition-colors cursor-pointer border ${
                      faq.isEnabled
                        ? "bg-[#FFFFFF] border-green-300 text-green-700 hover:bg-green-50"
                        : "bg-[#FFFFFF] border-[#E5DFD5] text-[#172B46]/50 hover:bg-gray-100"
                    }`}
                  >
                    {faq.isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    title="Delete FAQ Item"
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-1.5 rounded-xs bg-[#FFFFFF] border border-[#E5DFD5] hover:border-red-300 text-red-600 hover:bg-red-50 transition-colors cursor-pointer ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Full-Width Question & Answer Editing Area */}
              <div className="p-4 space-y-3.5">
                {/* 1. Full-Width Question Textarea */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B46] mb-1">
                    Question Text *
                  </label>
                  <textarea
                    rows={2}
                    value={faq.question}
                    onChange={(e) => {
                      handleUpdateFaq(faq.id, { question: e.target.value });
                      autoResizeTextarea(e.target, 52);
                    }}
                    placeholder="Enter question text (e.g. 100-200+ characters supported without truncation)..."
                    className="w-full text-xs sm:text-[13px] font-semibold text-[#172B46] bg-[#FFFFFF] border border-[#E5DFD5] hover:border-[#B08D57]/60 focus:border-[#B08D57] p-2.5 rounded-xs focus:outline-none min-h-[52px] leading-relaxed resize-y"
                  />
                </div>

                {/* 2. Full-Width Answer Textarea */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B46] mb-1">
                    Fiduciary Answer Text *
                  </label>
                  <textarea
                    rows={3}
                    value={faq.answer}
                    onChange={(e) => {
                      handleUpdateFaq(faq.id, { answer: e.target.value });
                      autoResizeTextarea(e.target, 90);
                    }}
                    placeholder="Enter complete answer text..."
                    className="w-full text-xs sm:text-[13px] text-[#172B46]/85 bg-[#F7F5F0]/40 border border-[#E5DFD5] hover:border-[#B08D57]/60 focus:border-[#B08D57] focus:bg-[#FFFFFF] p-2.5 rounded-xs focus:outline-none min-h-[90px] leading-relaxed resize-y"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
