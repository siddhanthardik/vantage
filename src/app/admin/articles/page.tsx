"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  Search,
  Filter,
  ExternalLink,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { ArticleItem } from "@/types/article";

export default function AdminArticlesListPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/articles");
      if (!res.ok) throw new Error("Failed to load articles");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to load articles" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleToggleStatus = async (article: ArticleItem, targetStatus: "PUBLISHED" | "DRAFT" | "ARCHIVED") => {
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, status: targetStatus } : a))
      );
      setActionMessage({
        type: "success",
        text: `"${article.title}" is now ${targetStatus.toLowerCase()}.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to update status" });
    }
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/articles/${deleteModalId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete article");

      setArticles((prev) => prev.filter((a) => a.id !== deleteModalId));
      setActionMessage({ type: "success", text: "Article deleted successfully." });
      setDeleteModalId(null);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to delete article" });
    } finally {
      setDeleting(false);
    }
  };

  const filteredArticles = articles
    .filter((a) => {
      if (statusFilter === "ALL") return true;
      return a.status === statusFilter;
    })
    .filter((a) => {
      if (categoryFilter === "ALL") return true;
      return a.category === categoryFilter;
    })
    .filter((a) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        a.title.toLowerCase().includes(term) ||
        a.excerpt.toLowerCase().includes(term) ||
        a.slug.toLowerCase().includes(term)
      );
    });

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5]">
        <div>
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#B08D57]">
            Content Management System
          </span>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight mt-0.5">
            Articles &amp; Insights Management
          </h1>
          <p className="text-[13px] text-[#172B46]/70 mt-1">
            Publish research essays, manage categories, schedule articles, and review revisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/insights"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-[#172B46]/30 bg-[#FFFFFF] text-[#172B46] hover:text-[#B08D57] px-3.5 py-2 rounded-sm text-[13px] font-semibold transition-colors"
          >
            Live Hub <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 bg-[#172B46] text-[#FFFFFF] hover:bg-[#B08D57] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#C9A975]" /> New Article
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-sm border-l-4 flex items-center gap-3 text-xs ${
            actionMessage.type === "success"
              ? "bg-green-50 border-green-600 text-green-900"
              : "bg-red-50 border-red-600 text-red-900"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] p-4 rounded-sm border border-[#E5DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#172B46]/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#172B46]/70">
            <Filter className="w-3.5 h-3.5 text-[#B08D57]" /> Status:
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm focus:outline-none focus:border-[#B08D57] cursor-pointer"
            >
              <option value="ALL">All Statuses ({articles.length})</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#172B46]/70">
            Category:
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm focus:outline-none focus:border-[#B08D57] cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Wealth Planning">Wealth Planning</option>
              <option value="Tax Planning">Tax Planning</option>
              <option value="Investment Strategy">Investment Strategy</option>
              <option value="Family Office">Family Office</option>
              <option value="Retirement">Retirement</option>
              <option value="Market Updates">Market Updates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#172B46]/60">
            Loading articles catalog...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-[#172B46]/70 font-light">
              No articles found matching your query.
            </p>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#172B46] text-[#FFFFFF] text-xs font-semibold rounded-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Compose New Article
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172B46]">
              <thead className="bg-[#F7F5F0] border-b border-[#E5DFD5] uppercase text-[10px] font-bold tracking-wider text-[#172B46]/70">
                <tr>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Read Time</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]/60">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                    {/* Title + Thumbnail */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {article.coverImage && (
                          <div className="relative w-12 h-10 rounded-xs overflow-hidden shrink-0 border border-[#E5DFD5] bg-[#F7F5F0]">
                            <Image
                              src={article.coverImage}
                              alt={article.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="font-sans font-bold text-sm text-[#172B46] hover:text-[#B08D57] transition-colors line-clamp-1"
                          >
                            {article.title}
                          </Link>
                          <div className="text-[11px] text-[#172B46]/60 font-mono">
                            /insights/{article.slug}
                            {article.isFeatured && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-[#B08D57] font-sans font-bold">
                                <Sparkles className="w-2.5 h-2.5" /> Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-medium text-[#172B46]/80">
                      {article.category}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase ${
                          article.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800"
                            : article.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-800"
                            : article.status === "DRAFT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {article.status === "PUBLISHED" && <CheckCircle className="w-3 h-3" />}
                        {article.status === "SCHEDULED" && <Clock className="w-3 h-3" />}
                        {article.status}
                      </span>
                    </td>

                    {/* Read Time */}
                    <td className="py-3.5 px-4 text-[#172B46]/70">
                      {article.readTime}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-[#172B46]/70">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Status Toggles */}
                        {article.status === "PUBLISHED" ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(article, "DRAFT")}
                            title="Unpublish to Draft"
                            className="p-1 text-[#172B46]/60 hover:text-amber-700 transition-colors cursor-pointer"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(article, "PUBLISHED")}
                            title="Publish Live"
                            className="p-1 text-[#172B46]/60 hover:text-green-700 transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        <Link
                          href={`/insights/${article.slug}`}
                          target="_blank"
                          title="View on Public Hub"
                          className="p-1 text-[#172B46]/60 hover:text-[#B08D57] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          title="Edit Article & Revisions"
                          className="p-1 text-[#172B46]/60 hover:text-[#172B46] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setDeleteModalId(article.id)}
                          title="Delete Article"
                          className="p-1 text-[#172B46]/60 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B46]/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] max-w-md w-full p-6 rounded-sm border border-[#E5DFD5] shadow-2xl space-y-4">
            <h3 className="text-lg font-sans font-bold text-[#172B46]">
              Confirm Article Deletion
            </h3>
            <p className="text-xs text-[#172B46]/75 font-light leading-relaxed">
              Are you sure you want to delete this article? This will remove the article and its revision history from the system.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                disabled={deleting}
                className="px-4 py-2 border border-[#E5DFD5] text-xs font-semibold text-[#172B46] rounded-sm hover:bg-[#F7F5F0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-[#FFFFFF] text-xs font-bold uppercase rounded-sm cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
