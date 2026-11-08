"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Tag,
  AlertCircle,
  ExternalLink,
  Layers,
  HelpCircle,
  Settings,
} from "lucide-react";
import { ArticleItem, ArticleFormData, ArticleRevisionItem, ArticleFaqItem } from "@/types/article";
import ArticleContentRenderer from "@/components/insights/ArticleContentRenderer";
import ArticleFaqAccordion from "@/components/insights/ArticleFaqAccordion";
import BlogComposer from "./BlogComposer";
import FaqManager from "./FaqManager";
import SeoSection from "./SeoSection";
import MediaPickerModal from "./MediaPickerModal";

interface ArticleEditorProps {
  initialArticle?: ArticleItem;
  isEditing?: boolean;
}

export default function ArticleEditor({
  initialArticle,
  isEditing = false,
}: ArticleEditorProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<ArticleFormData>({
    title: initialArticle?.title || "",
    slug: initialArticle?.slug || "",
    excerpt: initialArticle?.excerpt || "",
    content: initialArticle?.content || "",
    category: initialArticle?.category || "Wealth Planning",
    tags: initialArticle?.tags || ["Advisory", "Wealth Management"],
    readTime: initialArticle?.readTime || "5 min read",
    coverImage: initialArticle?.coverImage || "/images/insights/featured-article.png",
    ogImage: initialArticle?.ogImage || initialArticle?.coverImage || "",
    authorName: initialArticle?.authorName || "Vantage Research Desk",
    isFeatured: initialArticle?.isFeatured || false,
    status: initialArticle?.status || "PUBLISHED",
    scheduledFor: initialArticle?.scheduledFor || "",
    seoTitle: initialArticle?.seoTitle || "",
    seoDescription: initialArticle?.seoDescription || "",
    primaryKeyword: initialArticle?.primaryKeyword || "",
    secondaryKeywords: initialArticle?.secondaryKeywords || [],
    faqs: initialArticle?.faqs || [],
  });

  const [newTagInput, setNewTagInput] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "revisions">("edit");
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingPublish, setSavingPublish] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [revisions, setRevisions] = useState<ArticleRevisionItem[]>(initialArticle?.revisions || []);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  // Media picker modal states for Cover & OG image
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"cover" | "og" | null>(null);

  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!isEditing || !prev.slug) {
        updated.slug = val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      return updated;
    });
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    if (!formData.tags?.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tagToRemove) || [],
    }));
  };

  const handleSaveAction = async (targetStatus?: "DRAFT" | "PUBLISHED" | "SCHEDULED") => {
    setStatusMessage(null);

    const effectiveStatus = targetStatus || formData.status || "PUBLISHED";
    const isDraft = effectiveStatus === "DRAFT";

    // Client-side validations
    if (!formData.title.trim()) {
      setStatusMessage({
        type: "error",
        text: isDraft ? "Please provide an article title to save a draft." : "Article title is required to publish.",
      });
      return;
    }

    let finalSlug = formData.slug.trim();
    if (!finalSlug) {
      finalSlug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (!finalSlug) {
        finalSlug = `article-${Date.now()}`;
      }
    }

    if (!isDraft) {
      if (!formData.excerpt.trim()) {
        setStatusMessage({ type: "error", text: "Article executive excerpt is required before publishing." });
        return;
      }
      if (!formData.content.trim() || formData.content === "<p></p>") {
        setStatusMessage({ type: "error", text: "Article content cannot be empty before publishing." });
        return;
      }
      if (!formData.primaryKeyword?.trim()) {
        setStatusMessage({
          type: "error",
          text: "Primary SEO keyword is required in the SEO section before publishing.",
        });
        return;
      }
      if (effectiveStatus === "SCHEDULED" && !formData.scheduledFor) {
        setStatusMessage({ type: "error", text: "Please select a date and time for scheduled publication." });
        return;
      }
    }

    if (isDraft) {
      setSavingDraft(true);
    } else {
      setSavingPublish(true);
    }

    const payload: ArticleFormData = {
      ...formData,
      slug: finalSlug,
      status: effectiveStatus,
    };

    try {
      const endpoint = isEditing && initialArticle?.id
        ? `/api/admin/articles/${initialArticle.id}`
        : "/api/admin/articles";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to persist article to database.");
      }

      setFormData(payload);

      if (isDraft) {
        setStatusMessage({
          type: "success",
          text: `Draft "${payload.title}" saved successfully to PostgreSQL.`,
        });
      } else {
        setStatusMessage({
          type: "success",
          text: `Article "${payload.title}" ${
            effectiveStatus === "SCHEDULED" ? "scheduled" : "published"
          } successfully to PostgreSQL!`,
        });
      }

      if (!isEditing && data.article?.id) {
        router.push(`/admin/articles/${data.article.id}/edit`);
      } else if (data.article?.id) {
        const revRes = await fetch(`/api/admin/articles/${data.article.id}`);
        const revData = await revRes.json();
        if (revData.article?.revisions) {
          setRevisions(revData.article.revisions);
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save article." });
    } finally {
      setSavingDraft(false);
      setSavingPublish(false);
    }
  };

  const handleRestoreRevision = async (version: number) => {
    if (!initialArticle?.id) return;
    const confirmRestore = confirm(
      `Are you sure you want to restore Version ${version}? This will update the active article content.`
    );
    if (!confirmRestore) return;

    setRestoringVersion(version);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/articles/${initialArticle.id}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to restore version ${version}.`);
      }

      setFormData((prev) => ({
        ...prev,
        title: data.article.title,
        excerpt: data.article.excerpt,
        content: data.article.content,
        seoTitle: data.article.seoTitle || "",
        seoDescription: data.article.seoDescription || "",
        primaryKeyword: data.article.primaryKeyword || "",
        secondaryKeywords: data.article.secondaryKeywords || [],
        faqs: data.article.faqs || [],
      }));

      setStatusMessage({
        type: "success",
        text: `Successfully rolled back to snapshot Version ${version}.`,
      });

      setActiveTab("edit");
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Rollback failed." });
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/articles"
            className="p-2 border border-[#E5DFD5] bg-[#FFFFFF] text-[#172B46] hover:bg-[#F7F5F0] rounded-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B08D57]">
              Insights CMS &bull; Blog Composer 2.0
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172B46]">
              {isEditing ? `Edit: ${formData.title || "Untitled"}` : "Create New Research Publication"}
            </h1>
          </div>
        </div>

        {/* Tab Switcher & Save Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                activeTab === "edit" ? "bg-[#172B46] text-[#FFFFFF]" : "text-[#172B46]/70 hover:bg-[#F7F5F0]"
              }`}
            >
              Composer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                activeTab === "preview" ? "bg-[#172B46] text-[#FFFFFF]" : "text-[#172B46]/70 hover:bg-[#F7F5F0]"
              }`}
            >
              Live Preview
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setActiveTab("revisions")}
                className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                  activeTab === "revisions" ? "bg-[#172B46] text-[#FFFFFF]" : "text-[#172B46]/70 hover:bg-[#F7F5F0]"
                }`}
              >
                Revisions ({revisions.length})
              </button>
            )}
          </div>

          {isEditing && formData.slug && (
            <Link
              href={`/insights/${formData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 border border-[#172B46]/30 bg-[#FFFFFF] text-[#172B46] hover:text-[#B08D57] px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors"
            >
              Public View <ExternalLink className="w-3 h-3" />
            </Link>
          )}

          {/* Draft Button */}
          <button
            type="button"
            onClick={() => handleSaveAction("DRAFT")}
            disabled={savingDraft || savingPublish}
            className="inline-flex items-center gap-1.5 border border-[#172B46]/30 bg-[#FFFFFF] hover:bg-[#F7F5F0] text-[#172B46] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-[#172B46]" />
            <span>{savingDraft ? "Saving Draft..." : "Save Draft"}</span>
          </button>

          {/* Publish / Update Button */}
          <button
            type="button"
            onClick={() => handleSaveAction(formData.status === "SCHEDULED" ? "SCHEDULED" : "PUBLISHED")}
            disabled={savingDraft || savingPublish}
            className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#C9A975]" />
            <span>
              {savingPublish
                ? "Publishing..."
                : formData.status === "SCHEDULED"
                ? "Schedule Article"
                : isEditing && initialArticle?.status === "PUBLISHED"
                ? "Update & Publish"
                : "Publish Article"}
            </span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-sm border-l-4 flex flex-wrap items-center justify-between gap-3 text-xs ${
            statusMessage.type === "success"
              ? "bg-green-50 border-green-600 text-green-900"
              : "bg-red-50 border-red-600 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>

          {statusMessage.type === "success" && formData.status === "PUBLISHED" && formData.slug && (
            <Link
              href={`/insights/${formData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded-xs font-bold text-[11px] transition-colors"
            >
              <span>View Live Article</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* TAB 1: SEVEN-SECTION BLOG COMPOSER FORM */}
      {activeTab === "edit" && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveAction(); }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column: Sections 1, 2, 3, 4 (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. BASIC INFORMATION */}
            <section className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5DFD5] pb-2">
                <FileText className="w-4 h-4 text-[#B08D57]" />
                <h2 className="text-sm font-bold text-[#172B46] uppercase tracking-wider">
                  1. Basic Information
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navigating Multi-Generational Wealth Preservation in Volatile Markets"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-base font-sans text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#172B46]/60 font-mono">/insights/</span>
                  <input
                    type="text"
                    required
                    placeholder="navigating-multi-generational-wealth"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs font-mono text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                  Executive Excerpt / Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="A concise 2-3 sentence overview that appears on article cards, search engine previews, and directly below the title..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm leading-relaxed"
                />
              </div>
            </section>

            {/* 2. RICH TEXT BLOG COMPOSER */}
            <section className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#B08D57]" />
                  <h2 className="text-sm font-bold text-[#172B46] uppercase tracking-wider">
                    2. Rich Text Blog Composer (WYSIWYG)
                  </h2>
                </div>
                <span className="text-[11px] text-[#172B46]/60">
                  Full formatting, tables, media & live preview
                </span>
              </div>

              <BlogComposer
                content={formData.content}
                onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
              />
            </section>

            {/* 3. FAQ MANAGER */}
            <section>
              <FaqManager
                faqs={formData.faqs || []}
                onChange={(faqs) => setFormData((prev) => ({ ...prev, faqs }))}
              />
            </section>

            {/* 4. SEO & SOCIAL SHARING */}
            <section>
              <SeoSection
                primaryKeyword={formData.primaryKeyword || ""}
                secondaryKeywords={formData.secondaryKeywords || []}
                seoTitle={formData.seoTitle || ""}
                seoDescription={formData.seoDescription || ""}
                slug={formData.slug}
                articleTitle={formData.title}
                articleExcerpt={formData.excerpt}
                articleContent={formData.content}
                onPrimaryKeywordChange={(val) => setFormData((prev) => ({ ...prev, primaryKeyword: val }))}
                onSecondaryKeywordsChange={(keywords) => setFormData((prev) => ({ ...prev, secondaryKeywords: keywords }))}
                onSeoTitleChange={(val) => setFormData((prev) => ({ ...prev, seoTitle: val }))}
                onSeoDescriptionChange={(val) => setFormData((prev) => ({ ...prev, seoDescription: val }))}
              />
            </section>
          </div>

          {/* Right Sidebar: Sections 5, 6, 7 (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            {/* 5. CATEGORISATION */}
            <section className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5DFD5] pb-2">
                <Tag className="w-4 h-4 text-[#B08D57]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B46]">
                  5. Categorisation
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Primary Solution / Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm cursor-pointer"
                >
                  <option value="Wealth Planning">Wealth Planning</option>
                  <option value="Market Updates">Market Updates</option>
                  <option value="Tax & Legacy">Tax & Legacy</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Portfolio Strategy">Portfolio Strategy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Estimated Read Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6 min read"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Tags & Topics
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a topic tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-[#172B46] text-[#FFFFFF] text-xs font-semibold rounded-sm hover:bg-[#B08D57] transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags?.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 bg-[#F7F5F0] border border-[#E5DFD5] px-2 py-0.5 rounded-xs text-[11px] text-[#172B46]"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-[#172B46]/40 hover:text-red-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* 6. ARTICLE MEDIA */}
            <section className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5DFD5] pb-2">
                <ImageIcon className="w-4 h-4 text-[#B08D57]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B46]">
                  6. Article Media
                </h2>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#172B46]">Cover Hero Image URL</label>
                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget("cover")}
                    className="text-[11px] text-[#B08D57] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <ImageIcon className="w-3 h-3" /> Select Asset
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="/images/insights/article.png"
                  value={formData.coverImage || ""}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs font-mono text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>

              {formData.coverImage && (
                <div className="relative aspect-video rounded-sm overflow-hidden border border-[#E5DFD5] bg-[#F7F5F0]">
                  <Image
                    src={formData.coverImage}
                    alt="Cover preview"
                    fill
                    sizes="350px"
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#172B46]">Social Share Image (OG)</label>
                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget("og")}
                    className="text-[11px] text-[#B08D57] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <ImageIcon className="w-3 h-3" /> Select Asset
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Defaults to cover image"
                  value={formData.ogImage || ""}
                  onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs font-mono text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>
            </section>

            {/* 7. PUBLISHING CONTROLS */}
            <section className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5DFD5] pb-2">
                <Settings className="w-4 h-4 text-[#B08D57]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B46]">
                  7. Publishing Controls
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Publication Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm cursor-pointer"
                >
                  <option value="PUBLISHED">Published (Visible Live)</option>
                  <option value="DRAFT">Draft (Internal Only)</option>
                  <option value="SCHEDULED">Scheduled Publication</option>
                  <option value="ARCHIVED">Archived (Unlisted)</option>
                </select>
              </div>

              {formData.status === "SCHEDULED" && (
                <div className="p-3 bg-[#B08D57]/10 rounded-sm border border-[#B08D57]/30 space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#172B46]">
                    <Clock className="w-3.5 h-3.5 text-[#B08D57]" /> Schedule Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledFor ? new Date(formData.scheduledFor).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-xs"
                  />
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#172B46] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded-xs text-[#B08D57] focus:ring-[#B08D57] cursor-pointer"
                  />
                  <span>Feature on Insights Hub Hero</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Author Byline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vantage Research Desk"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>
            </section>
          </div>
        </form>
      )}

      {/* TAB 2: LIVE PREVIEW MATCHING PUBLIC PAGE LAYOUT */}
      {activeTab === "preview" && (
        <div className="bg-[#FFFFFF] p-6 sm:p-10 rounded-sm border border-[#E5DFD5] shadow-xs max-w-4xl mx-auto space-y-8 font-sans">
          {/* 1. HERO COVER IMAGE */}
          {formData.coverImage && (
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] max-h-[420px] rounded-sm overflow-hidden border border-[#E5DFD5]">
              <Image
                src={formData.coverImage}
                alt={formData.title || "Article Cover"}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover object-center"
              />
            </div>
          )}

          <div className="max-w-[780px] mx-auto space-y-6">
            {/* 2. BREADCRUMB */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B08D57]">
              <span>Home</span>
              <span className="text-[#172B46]/30">&gt;</span>
              <span>Insights</span>
              <span className="text-[#172B46]/30">&gt;</span>
              <span className="text-[#172B46]">{formData.title || "Untitled Article"}</span>
            </div>

            {/* 3. ARTICLE TITLE */}
            <h1 className="article-title-heading">
              {formData.title || "Untitled Article"}
            </h1>

            {/* 4. SMALL DESCRIPTION */}
            {formData.excerpt && (
              <p className="text-[15px] sm:text-[17px] text-[#172B46]/80 font-normal leading-relaxed border-l-2 border-[#B08D57] pl-4">
                {formData.excerpt}
              </p>
            )}

            {/* 5. DETAILED CONTENT */}
            <div className="py-2">
              <ArticleContentRenderer content={formData.content} />
            </div>

            {/* 6. FAQS PREVIEW */}
            {formData.faqs && formData.faqs.filter((f) => f.isEnabled).length > 0 && (
              <ArticleFaqAccordion faqs={formData.faqs} />
            )}

            {/* 7. PUBLISHED BY */}
            <div className="pt-6 border-t border-[#E5DFD5] text-sm text-[#172B46]/80">
              <span>
                Published by <strong className="text-[#172B46] font-semibold">{formData.authorName}</strong>
              </span>
            </div>

            {/* 8. DISCLAIMER */}
            <div className="p-5 bg-[#F7F5F0] border-l-4 border-[#B08D57] rounded-xs space-y-1.5 text-xs text-[#172B46]/75 font-normal leading-relaxed">
              <strong className="text-[#172B46] font-semibold block text-[13px]">
                Editorial & Advisory Notice:
              </strong>
              The observations and commentary above are published for general wealth education and institutional perspective. They do not constitute specific investment, legal, or tax counsel for any individual circumstances. All asset allocations are subject to market conditions.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVISION HISTORY */}
      {activeTab === "revisions" && (
        <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-4">
            <div>
              <h3 className="text-lg font-sans font-bold text-[#172B46]">
                Article Revision History
              </h3>
              <p className="text-xs text-[#172B46]/65 font-light">
                Every save creates an immutable version snapshot containing article content, SEO keywords, and FAQs.
              </p>
            </div>
          </div>

          {revisions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#172B46]/60 bg-[#F7F5F0]/40 rounded-sm border border-dashed border-[#E5DFD5]">
              No previous revisions captured for this article.
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((rev) => (
                <div
                  key={rev.id || rev.version}
                  className="p-5 bg-[#F7F5F0]/50 rounded-sm border border-[#E5DFD5] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#B08D57] bg-[#B08D57]/10 px-2 py-0.5 rounded-xs">
                        Snapshot v{rev.version}
                      </span>
                      <span className="text-xs text-[#172B46]/50">&bull;</span>
                      <span className="text-xs text-[#172B46]/70">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-[#172B46]">{rev.title}</h4>
                    <p className="text-xs text-[#172B46]/70 line-clamp-1">{rev.excerpt}</p>
                    {rev.primaryKeyword && (
                      <span className="text-[11px] text-[#B08D57] block">
                        Primary Keyword: {rev.primaryKeyword}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={restoringVersion === rev.version}
                    onClick={() => handleRestoreRevision(rev.version)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#172B46] text-[#172B46] hover:bg-[#172B46] hover:text-[#FFFFFF] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{restoringVersion === rev.version ? "Restoring..." : "Rollback to Version"}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MEDIA PICKER MODAL FOR COVER OR OG IMAGE */}
      <MediaPickerModal
        isOpen={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        title={mediaPickerTarget === "cover" ? "Select Article Cover Hero Image" : "Select Social Share (OG) Image"}
        onSelect={({ url }) => {
          if (mediaPickerTarget === "cover") {
            setFormData((prev) => ({ ...prev, coverImage: url }));
          } else if (mediaPickerTarget === "og") {
            setFormData((prev) => ({ ...prev, ogImage: url }));
          }
        }}
      />
    </div>
  );
}
