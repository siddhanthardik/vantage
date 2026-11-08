"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, HelpCircle, Eye, EyeOff } from "lucide-react";
import { ArticleFaqItem } from "@/types/article";

interface FaqManagerProps {
  faqs: ArticleFaqItem[];
  onChange: (faqs: ArticleFaqItem[]) => void;
}

export default function FaqManager({ faqs = [], onChange }: FaqManagerProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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
      <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#B08D57]" />
          <h3 className="text-sm font-bold text-[#172B46] uppercase tracking-wider">
            Article FAQ Manager
          </h3>
          <span className="text-xs bg-[#B08D57]/15 text-[#8C6B37] px-2 py-0.5 rounded-xs font-semibold">
            {faqs.length} FAQs
          </span>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B08D57] hover:text-[#172B46] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        )}
      </div>

      <p className="text-xs text-[#172B46]/70 leading-relaxed font-light">
        Add frequently asked questions to address reader inquiries, demonstrate advisory expertise,
        and generate valid FAQPage Google structured schema automatically.
      </p>

      {/* NEW FAQ FORM */}
      {isAdding && (
        <div className="p-4 bg-[#F7F5F0]/70 border border-[#B08D57]/40 rounded-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B46]">
            New Question & Answer
          </h4>
          <div>
            <label className="block text-[11px] font-semibold text-[#172B46] uppercase tracking-wider mb-1">
              Question *
            </label>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. How does multi-bucket allocation mitigate sequence risk?"
              className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-xs focus:outline-none focus:border-[#B08D57]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#172B46] uppercase tracking-wider mb-1">
              Answer *
            </label>
            <textarea
              rows={3}
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Comprehensive fiduciary response explaining the principles..."
              className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-xs focus:outline-none focus:border-[#B08D57] leading-relaxed"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewQuestion("");
                setNewAnswer("");
              }}
              className="px-3 py-1.5 border border-[#E5DFD5] bg-[#FFFFFF] text-xs text-[#172B46] font-semibold rounded-xs hover:bg-[#F7F5F0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!newQuestion.trim() || !newAnswer.trim()}
              onClick={handleAddFaq}
              className="px-4 py-1.5 bg-[#172B46] hover:bg-[#B08D57] disabled:opacity-40 text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
            >
              Save FAQ
            </button>
          </div>
        </div>
      )}

      {/* FAQS LIST */}
      {faqs.length === 0 && !isAdding ? (
        <div className="py-8 text-center border border-dashed border-[#E5DFD5] rounded-sm bg-[#F7F5F0]/30 text-xs text-[#172B46]/60">
          No FAQs configured for this article yet. Click &quot;Add FAQ&quot; above to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`p-4 rounded-sm border transition-all ${
                faq.isEnabled
                  ? "bg-[#FFFFFF] border-[#E5DFD5] shadow-2xs"
                  : "bg-[#F7F5F0]/50 border-[#E5DFD5]/60 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#B08D57] min-w-[1.25rem]">
                    Q{index + 1}.
                  </span>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => handleUpdateFaq(faq.id, { question: e.target.value })}
                    className="font-semibold text-xs text-[#172B46] bg-transparent border-b border-transparent hover:border-[#E5DFD5] focus:border-[#B08D57] focus:bg-[#FFFFFF] px-1 py-0.5 rounded-xs w-full focus:outline-none"
                  />
                </div>

                {/* Actions: Reorder, Toggle, Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Move Up"
                    disabled={index === 0}
                    onClick={() => handleMoveFaq(index, "up")}
                    className="p-1 rounded-xs hover:bg-[#F7F5F0] disabled:opacity-20 text-[#172B46]/70 transition-colors cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Move Down"
                    disabled={index === faqs.length - 1}
                    onClick={() => handleMoveFaq(index, "down")}
                    className="p-1 rounded-xs hover:bg-[#F7F5F0] disabled:opacity-20 text-[#172B46]/70 transition-colors cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title={faq.isEnabled ? "Disable FAQ" : "Enable FAQ"}
                    onClick={() => handleUpdateFaq(faq.id, { isEnabled: !faq.isEnabled })}
                    className={`p-1 rounded-xs transition-colors cursor-pointer ${
                      faq.isEnabled ? "text-green-700 hover:bg-green-50" : "text-[#172B46]/40 hover:bg-[#E5DFD5]"
                    }`}
                  >
                    {faq.isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    title="Delete FAQ"
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-1 rounded-xs hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => handleUpdateFaq(faq.id, { answer: e.target.value })}
                  className="w-full text-xs text-[#172B46]/80 bg-[#F7F5F0]/40 border border-transparent hover:border-[#E5DFD5] focus:border-[#B08D57] focus:bg-[#FFFFFF] p-2 rounded-xs focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
