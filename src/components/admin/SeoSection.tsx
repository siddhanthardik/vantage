"use client";

import { useState } from "react";
import { Sparkles, X, Plus, AlertCircle, CheckCircle2 } from "lucide-react";

interface SeoSectionProps {
  primaryKeyword: string;
  secondaryKeywords: string[];
  seoTitle: string;
  seoDescription: string;
  slug: string;
  articleTitle: string;
  articleExcerpt: string;
  articleContent: string;
  onPrimaryKeywordChange: (val: string) => void;
  onSecondaryKeywordsChange: (keywords: string[]) => void;
  onSeoTitleChange: (val: string) => void;
  onSeoDescriptionChange: (val: string) => void;
}

export default function SeoSection({
  primaryKeyword = "",
  secondaryKeywords = [],
  seoTitle = "",
  seoDescription = "",
  slug = "",
  articleTitle = "",
  articleExcerpt = "",
  articleContent = "",
  onPrimaryKeywordChange,
  onSecondaryKeywordsChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: SeoSectionProps) {
  const [newSecondaryInput, setNewSecondaryInput] = useState("");

  const handleAddSecondary = () => {
    const trimmed = newSecondaryInput.trim();
    if (!trimmed) return;

    // Prevent accidental duplicates
    const lowerList = secondaryKeywords.map((k) => k.toLowerCase());
    if (!lowerList.includes(trimmed.toLowerCase())) {
      onSecondaryKeywordsChange([...secondaryKeywords, trimmed]);
    }
    setNewSecondaryInput("");
  };

  const handleRemoveSecondary = (kwToRemove: string) => {
    onSecondaryKeywordsChange(secondaryKeywords.filter((k) => k !== kwToRemove));
  };

  // Keyword presence analysis (informational / editorial only)
  const pkLower = primaryKeyword.trim().toLowerCase();
  const titleHasPk = pkLower ? (seoTitle || articleTitle).toLowerCase().includes(pkLower) : false;
  const excerptHasPk = pkLower ? (seoDescription || articleExcerpt).toLowerCase().includes(pkLower) : false;
  const slugHasPk = pkLower ? slug.toLowerCase().includes(pkLower.replace(/\s+/g, "-")) : false;
  const contentHasPk = pkLower ? articleContent.toLowerCase().includes(pkLower) : false;

  const titleLength = (seoTitle || articleTitle).length;
  const descLength = (seoDescription || articleExcerpt).length;

  return (
    <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-6 font-sans">
      <div className="flex items-center gap-2 border-b border-[#E5DFD5] pb-3">
        <Sparkles className="w-4 h-4 text-[#B08D57]" />
        <h3 className="text-sm font-bold text-[#172B46] uppercase tracking-wider">
          Search Engine Optimization (SEO) & Social Sharing
        </h3>
      </div>

      {/* 1. PRIMARY KEYWORD */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46]">
            Primary SEO Keyword *
          </label>
          <span className="text-[11px] text-[#172B46]/60">Required for editorial focus</span>
        </div>
        <input
          type="text"
          required
          placeholder="e.g. sequence of returns risk"
          value={primaryKeyword}
          onChange={(e) => onPrimaryKeywordChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm font-medium"
        />
        <p className="text-[11px] text-[#172B46]/60 font-light">
          The central topic or query this research publication addresses. Kept separate from general tags.
        </p>

        {/* Primary Keyword Editorial Verification Indicators */}
        {primaryKeyword.trim() && (
          <div className="p-3 bg-[#F7F5F0]/80 rounded-sm border border-[#E5DFD5] space-y-1.5 text-xs">
            <span className="font-semibold text-[#172B46] text-[11px] block uppercase tracking-wider">
              Editorial Keyword Consistency:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <span className={`inline-flex items-center gap-1 ${titleHasPk ? "text-green-700 font-medium" : "text-[#172B46]/60"}`}>
                {titleHasPk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} In Title
              </span>
              <span className={`inline-flex items-center gap-1 ${slugHasPk ? "text-green-700 font-medium" : "text-[#172B46]/60"}`}>
                {slugHasPk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} In URL Slug
              </span>
              <span className={`inline-flex items-center gap-1 ${excerptHasPk ? "text-green-700 font-medium" : "text-[#172B46]/60"}`}>
                {excerptHasPk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} In Excerpt
              </span>
              <span className={`inline-flex items-center gap-1 ${contentHasPk ? "text-green-700 font-medium" : "text-[#172B46]/60"}`}>
                {contentHasPk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} In Content
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. SECONDARY KEYWORDS */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46]">
          Secondary Keywords (Target Terms)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. decumulation strategy, multi-bucket allocation"
            value={newSecondaryInput}
            onChange={(e) => setNewSecondaryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSecondary();
              }
            }}
            className="flex-1 px-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
          />
          <button
            type="button"
            onClick={handleAddSecondary}
            className="px-4 py-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Secondary Keywords Chips */}
        {secondaryKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {secondaryKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] font-medium rounded-xs"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSecondary(kw)}
                  className="text-[#172B46]/40 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. SEO TITLE & META DESCRIPTION */}
      <div className="grid grid-cols-1 gap-4 pt-2 border-t border-[#E5DFD5]">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              SEO Title Tag
            </label>
            <span
              className={`text-[11px] ${
                titleLength >= 50 && titleLength <= 60
                  ? "text-green-700 font-semibold"
                  : titleLength > 60
                  ? "text-amber-700"
                  : "text-[#172B46]/60"
              }`}
            >
              {titleLength} characters (Recommended: 50–60)
            </span>
          </div>
          <input
            type="text"
            placeholder="Defaults to article title | Vantage Wealth"
            value={seoTitle}
            onChange={(e) => onSeoTitleChange(e.target.value)}
            className="w-full px-4 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              Meta Description
            </label>
            <span
              className={`text-[11px] ${
                descLength >= 140 && descLength <= 160
                  ? "text-green-700 font-semibold"
                  : descLength > 160
                  ? "text-amber-700"
                  : "text-[#172B46]/60"
              }`}
            >
              {descLength} characters (Recommended: 150–160)
            </span>
          </div>
          <textarea
            rows={2}
            placeholder="Defaults to executive summary excerpt..."
            value={seoDescription}
            onChange={(e) => onSeoDescriptionChange(e.target.value)}
            className="w-full px-4 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm leading-relaxed"
          />
        </div>
      </div>

      {/* 4. GOOGLE SERP PREVIEW */}
      <div className="p-4 bg-[#F7F5F0] rounded-sm border border-[#E5DFD5] space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#172B46]/60 block">
          Search Engine Result Preview
        </span>
        <div className="text-sm font-medium text-blue-800 hover:underline cursor-pointer truncate">
          {seoTitle || articleTitle || "Article Title"} | Vantage Wealth
        </div>
        <div className="text-xs text-green-800 truncate font-mono">
          https://vantagewealth.in/insights/{slug || "article-url-slug"}
        </div>
        <div className="text-xs text-[#172B46]/80 line-clamp-2 leading-relaxed">
          {seoDescription || articleExcerpt || "Summary description of publication appearing in organic search results."}
        </div>
      </div>
    </div>
  );
}
