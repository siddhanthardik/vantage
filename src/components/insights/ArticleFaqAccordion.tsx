"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { ArticleFaqItem } from "@/types/article";

interface ArticleFaqAccordionProps {
  faqs: ArticleFaqItem[];
  className?: string;
}

export default function ArticleFaqAccordion({ faqs = [], className = "" }: ArticleFaqAccordionProps) {
  const publishedFaqs = faqs
    .filter((f) => f && f.isEnabled)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    // Default: first FAQ expanded for discovery
    if (publishedFaqs.length > 0) {
      return { [publishedFaqs[0].id]: true };
    }
    return {};
  });

  if (!publishedFaqs || publishedFaqs.length === 0) {
    return null;
  }

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className={`article-faqs-section pt-10 pb-4 font-sans ${className}`} aria-labelledby="article-faqs-heading">
      <div className="flex items-center gap-2 mb-6 border-b border-[#E5DFD5] pb-3">
        <HelpCircle className="w-5 h-5 text-[#B08D57]" aria-hidden="true" />
        <h2 id="article-faqs-heading" className="text-[20px] sm:text-[22px] font-semibold text-[#172B46] tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {publishedFaqs.map((faq, index) => {
          const isOpen = !!openIds[faq.id];
          return (
            <div
              key={faq.id || index}
              className="border border-[#E5DFD5] rounded-xs bg-[#FFFFFF] transition-all overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between text-left p-4 sm:p-5 hover:bg-[#F7F5F0]/60 transition-colors cursor-pointer group"
              >
                <span className="font-semibold text-sm sm:text-base text-[#172B46] pr-4 group-hover:text-[#B08D57] transition-colors leading-snug">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#B08D57] shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 text-sm sm:text-[15px] text-[#172B46]/85 font-normal leading-[1.72] border-t border-[#E5DFD5]/40 bg-[#F7F5F0]/30">
                  <p className="whitespace-pre-line text-justify [text-justify:inter-word] hyphens-auto">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
