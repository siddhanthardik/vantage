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
} from "lucide-react";
import { ArticleItem, ArticleFormData, ArticleRevisionItem } from "@/types/article";

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
  });

  const [newTagInput, setNewTagInput] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "revisions">("edit");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [revisions, setRevisions] = useState<ArticleRevisionItem[]>(initialArticle?.revisions || []);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  // Auto-generate slug from title if in create mode or slug is empty
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!formData.title.trim()) {
      setStatusMessage({ type: "error", text: "Article title is required." });
      return;
    }
    if (!formData.slug.trim()) {
      setStatusMessage({ type: "error", text: "Article URL slug is required." });
      return;
    }
    if (!formData.excerpt.trim()) {
      setStatusMessage({ type: "error", text: "Article summary excerpt is required." });
      return;
    }
    if (!formData.content.trim()) {
      setStatusMessage({ type: "error", text: "Article content cannot be empty." });
      return;
    }

    setSaving(true);

    try {
      const endpoint = isEditing && initialArticle?.id
        ? `/api/admin/articles/${initialArticle.id}`
        : "/api/admin/articles";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save article.");
      }

      setStatusMessage({
        type: "success",
        text: `Article "${formData.title}" saved successfully.`,
      });

      if (!isEditing && data.article?.id) {
        router.push(`/admin/articles/${data.article.id}/edit`);
      } else {
        // Refresh revisions
        if (data.article?.id) {
          const revRes = await fetch(`/api/admin/articles/${data.article.id}`);
          const revData = await revRes.json();
          if (revData.article?.revisions) {
            setRevisions(revData.article.revisions);
          }
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save article" });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreRevision = async (version: number) => {
    if (!initialArticle?.id) return;
    if (!confirm(`Are you sure you want to restore to version ${version}? This will overwrite your current unsaved changes.`)) {
      return;
    }

    setRestoringVersion(version);
    try {
      const res = await fetch(`/api/admin/articles/${initialArticle.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore revision");

      setFormData((prev) => ({
        ...prev,
        title: data.article.title,
        excerpt: data.article.excerpt,
        content: data.article.content,
        seoTitle: data.article.seoTitle || "",
        seoDescription: data.article.seoDescription || "",
      }));

      setStatusMessage({
        type: "success",
        text: `Restored article content to version ${version}.`,
      });
      setActiveTab("edit");
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to restore revision" });
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <div className="space-y-6 w-full pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5]">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/articles"
            className="p-2 rounded-sm border border-[#E5DFD5] bg-[#FFFFFF] text-[#172B46] hover:bg-[#F7F5F0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B08D57]">
              {isEditing ? "Edit Article" : "Create New Publication"}
            </span>
            <h1 className="text-2xl font-sans font-bold text-[#172B46] mt-0.5">
              {formData.title || "Untitled Article"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab toggles */}
          <div className="flex border border-[#E5DFD5] rounded-sm overflow-hidden bg-[#FFFFFF]">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                activeTab === "edit"
                  ? "bg-[#172B46] text-[#FFFFFF]"
                  : "text-[#172B46]/70 hover:bg-[#F7F5F0]"
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                activeTab === "preview"
                  ? "bg-[#172B46] text-[#FFFFFF]"
                  : "text-[#172B46]/70 hover:bg-[#F7F5F0]"
              }`}
            >
              Live Preview
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setActiveTab("revisions")}
                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  activeTab === "revisions"
                    ? "bg-[#172B46] text-[#FFFFFF]"
                    : "text-[#172B46]/70 hover:bg-[#F7F5F0]"
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

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#C9A975]" />
            <span>{saving ? "Saving..." : "Save Article"}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-sm border-l-4 flex items-center gap-3 text-xs ${
            statusMessage.type === "success"
              ? "bg-green-50 border-green-600 text-green-900"
              : "bg-red-50 border-red-600 text-red-900"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* TAB 1: EDITOR FORM */}
      {activeTab === "edit" && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Fields (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navigating Multi-Generational Wealth Preservation"
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
                  placeholder="A concise 2-3 sentence overview that appears on article cards and search previews..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#172B46]">
                    Full Article Content *
                  </label>
                  <span className="text-[11px] text-[#172B46]/60">
                    Supports Markdown (## Headings, **bold**, lists, &gt; quotes)
                  </span>
                </div>
                <textarea
                  rows={18}
                  required
                  placeholder="Compose your research article here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-sm text-[#172B46] font-mono focus:outline-none focus:border-[#B08D57] rounded-sm leading-relaxed"
                />
              </div>
            </div>

            {/* SEO Information Panel */}
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5DFD5] pb-2">
                <Sparkles className="w-4 h-4 text-[#B08D57]" />
                <h3 className="text-sm font-sans font-bold text-[#172B46]">
                  Search Engine Optimization (SEO) & Social Sharing
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                  SEO Title Tag
                </label>
                <input
                  type="text"
                  placeholder="Defaults to article title | Vantage Wealth"
                  value={formData.seoTitle || ""}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Defaults to article excerpt..."
                  value={formData.seoDescription || ""}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  className="w-full px-4 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>

              {/* Google SERP Snippet Preview */}
              <div className="p-4 bg-[#F7F5F0] rounded-sm border border-[#E5DFD5] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#172B46]/60">
                  Search Engine Preview
                </span>
                <div className="text-sm font-medium text-blue-800 truncate">
                  {formData.seoTitle || formData.title || "Article Title"} | Vantage Wealth
                </div>
                <div className="text-xs text-green-700 truncate">
                  https://vantagewealth.in/insights/{formData.slug || "article-slug"}
                </div>
                <div className="text-xs text-[#172B46]/75 line-clamp-2 leading-relaxed">
                  {formData.seoDescription || formData.excerpt || "Meta description preview."}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Settings (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Publication Status & Schedule */}
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172B46] border-b border-[#E5DFD5] pb-2">
                Publishing Controls
              </h3>

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
                    value={formData.scheduledFor || ""}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                  />
                  <p className="text-[10px] text-[#172B46]/70 leading-relaxed">
                    Article will automatically publish when the scheduled timestamp is reached.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-[#B08D57] rounded-xs border-gray-300"
                />
                <label htmlFor="featuredCheck" className="text-xs text-[#172B46] cursor-pointer">
                  Feature in Hero Banner on Insights Hub
                </label>
              </div>
            </div>

            {/* Categorization & Tags */}
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172B46] border-b border-[#E5DFD5] pb-2">
                Categorization
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Primary Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm cursor-pointer"
                >
                  <option value="Wealth Planning">Wealth Planning</option>
                  <option value="Tax Planning">Tax Planning</option>
                  <option value="Investment Strategy">Investment Strategy</option>
                  <option value="Family Office">Family Office</option>
                  <option value="Retirement">Retirement Planning</option>
                  <option value="Market Updates">Market Updates</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Tags & Topics
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-[#172B46] text-[#FFFFFF] text-xs font-semibold rounded-sm hover:bg-[#B08D57] transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {formData.tags?.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F7F5F0] border border-[#E5DFD5] text-[11px] text-[#172B46] rounded-xs"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-red-500 hover:text-red-700 ml-1 cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Estimated Read Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 min read"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Author Signature
                </label>
                <input
                  type="text"
                  placeholder="Vantage Research Desk"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>
            </div>

            {/* Featured Image & Media */}
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172B46] border-b border-[#E5DFD5] pb-2">
                Article Media
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Featured Cover Image URL
                </label>
                <input
                  type="text"
                  placeholder="/images/insights/featured-article.png"
                  value={formData.coverImage || ""}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
                <p className="text-[10px] text-[#172B46]/60 mt-1">
                  Paste URL or select from{" "}
                  <Link href="/admin/media" target="_blank" className="text-[#B08D57] underline">
                    Media Library
                  </Link>
                  .
                </p>
              </div>

              {formData.coverImage && (
                <div className="relative w-full h-36 rounded-sm overflow-hidden border border-[#E5DFD5] bg-[#F7F5F0]">
                  <Image
                    src={formData.coverImage}
                    alt="Cover preview"
                    fill
                    sizes="(max-width: 1024px) 100vw, 380px"
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Social Share (OG) Image URL
                </label>
                <input
                  type="text"
                  placeholder="Defaults to cover image..."
                  value={formData.ogImage || ""}
                  onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: LIVE PREVIEW */}
      {activeTab === "preview" && (
        <div className="bg-[#FFFFFF] p-8 sm:p-12 rounded-sm border border-[#E5DFD5] shadow-xs max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
              {formData.category} &bull; {formData.readTime}
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#172B46] leading-tight">
              {formData.title || "Untitled Article"}
            </h1>
            <p className="text-base text-[#172B46]/80 font-light italic leading-relaxed border-l-2 border-[#B08D57] pl-4">
              {formData.excerpt}
            </p>
          </div>

          {formData.coverImage && (
            <div className="relative w-full h-72 sm:h-96 rounded-sm overflow-hidden border border-[#E5DFD5]">
              <Image
                src={formData.coverImage}
                alt={formData.title}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          )}

          <div className="prose max-w-none text-sm text-[#172B46]/85 font-light leading-relaxed space-y-4 whitespace-pre-wrap">
            {formData.content}
          </div>

          <div className="pt-6 border-t border-[#E5DFD5] flex items-center justify-between text-xs text-[#172B46]/60">
            <span>By {formData.authorName}</span>
            <span>Tags: {formData.tags?.join(", ")}</span>
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
                Every save creates an immutable version snapshot. You can inspect or rollback to any previous version.
              </p>
            </div>
          </div>

          {revisions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#172B46]/60">
              No previous revisions recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 bg-[#F7F5F0] rounded-sm border border-[#E5DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-[#172B46] text-[#C9A975] px-2 py-0.5 rounded-xs">
                        v{rev.version}
                      </span>
                      <span className="text-xs font-bold text-[#172B46]">
                        {rev.title}
                      </span>
                    </div>
                    <p className="text-xs text-[#172B46]/70 line-clamp-1">
                      {rev.excerpt}
                    </p>
                    <div className="text-[11px] text-[#172B46]/50">
                      Modified by {rev.authorEmail || "Admin"} on{" "}
                      {new Date(rev.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestoreRevision(rev.version)}
                    disabled={restoringVersion === rev.version}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#172B46]/40 hover:border-[#B08D57] hover:text-[#B08D57] text-[#172B46] text-xs font-semibold rounded-sm transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{restoringVersion === rev.version ? "Restoring..." : "Restore Version"}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
