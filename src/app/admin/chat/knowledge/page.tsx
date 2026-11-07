"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Search,
  RefreshCw,
  CheckCircle2,
  FileText,
  Briefcase,
  Users,
  Shield,
  Eye,
  X,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function KnowledgeBaseManagementPage() {
  const [chunks, setChunks] = useState<any[]>([]);
  const [sourceCounts, setSourceCounts] = useState<any>({});
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSourceType, setSelectedSourceType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchKnowledge() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedSourceType) params.set("sourceType", selectedSourceType);

      const res = await fetch(`/api/admin/chat/knowledge?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setChunks(data.chunks || []);
        if (data.sourceCounts) setSourceCounts(data.sourceCounts);
        if (data.total !== undefined) setTotal(data.total);
      }
    } catch (e) {
      console.error("Failed to load knowledge chunks:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSyncKnowledge() {
    setIsSyncing(true);
    setNotification(null);
    try {
      const res = await fetch("/api/admin/chat/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          text: `Knowledge base synced! Indexed ${data.syncResult.servicesIndexed} services, ${data.syncResult.articlesIndexed} articles, ${data.syncResult.teamIndexed} team members (${data.syncResult.totalChunks} total active chunks).`,
        });
        fetchKnowledge();
      } else {
        setNotification({ type: "error", text: data.error || "Sync failed." });
      }
    } catch (e) {
      setNotification({ type: "error", text: "Knowledge synchronization request failed." });
    } finally {
      setIsSyncing(false);
    }
  }

  async function toggleChunkActive(id: string, currentActive: boolean) {
    try {
      const res = await fetch("/api/admin/chat/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setChunks((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !currentActive } : c))
        );
        if (selectedChunk?.id === id) {
          setSelectedChunk({ ...selectedChunk, isActive: !currentActive });
        }
      }
    } catch (e) {
      console.error("Toggle active error:", e);
    }
  }

  useEffect(() => {
    fetchKnowledge();
  }, [selectedSourceType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight">
            Knowledge Base Synchronization
          </h1>
          <p className="text-[13px] text-stone-600 mt-1">
            Manage grounded PostgreSQL knowledge chunks ingested from published Services, Insights, and Leadership records.
          </p>
        </div>

        <button
          onClick={handleSyncKnowledge}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#172B46] hover:bg-[#253f63] rounded-sm transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B08D57] ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Ingesting Published CMS..." : "Sync Knowledge Now"}
        </button>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-700">
            ×
          </button>
        </div>
      )}

      {/* Source Category Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1 text-xs">
            <span className="uppercase tracking-wider text-[10px] font-medium">Total Chunks</span>
            <Database className="w-3.5 h-3.5 text-[#B08D57]" />
          </div>
          <span className="text-xl font-bold text-[#172B46]">{total}</span>
          <p className="text-[10px] text-stone-400 mt-0.5">PostgreSQL Knowledge Repository</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1 text-xs">
            <span className="uppercase tracking-wider text-[10px] font-medium">Services</span>
            <Briefcase className="w-3.5 h-3.5 text-[#B08D57]" />
          </div>
          <span className="text-xl font-bold text-[#172B46]">
            {sourceCounts["SERVICE_PAGE"] || 0}
          </span>
          <p className="text-[10px] text-stone-400 mt-0.5">Published wealth solutions</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1 text-xs">
            <span className="uppercase tracking-wider text-[10px] font-medium">Articles & Insights</span>
            <FileText className="w-3.5 h-3.5 text-[#B08D57]" />
          </div>
          <span className="text-xl font-bold text-[#172B46]">
            {sourceCounts["INSIGHT_ARTICLE"] || 0}
          </span>
          <p className="text-[10px] text-stone-400 mt-0.5">Fiduciary research publications</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1 text-xs">
            <span className="uppercase tracking-wider text-[10px] font-medium">Team & Leadership</span>
            <Users className="w-3.5 h-3.5 text-[#B08D57]" />
          </div>
          <span className="text-xl font-bold text-[#172B46]">
            {sourceCounts["TEAM_PROFILE"] || 0}
          </span>
          <p className="text-[10px] text-stone-400 mt-0.5">Executive leadership profiles</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search knowledge repository (Full-Text Search & Trigram)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchKnowledge()}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
          />
        </div>

        <select
          value={selectedSourceType}
          onChange={(e) => setSelectedSourceType(e.target.value)}
          className="text-xs bg-white px-3 py-2 rounded-lg border border-stone-300 text-stone-700"
        >
          <option value="">All Source Types</option>
          <option value="SERVICE_PAGE">SERVICE_PAGE</option>
          <option value="INSIGHT_ARTICLE">INSIGHT_ARTICLE</option>
          <option value="TEAM_PROFILE">TEAM_PROFILE</option>
          <option value="STATIC_FAQ">STATIC_FAQ</option>
        </select>
      </div>

      {/* Main Grid: Chunks Table Left, Detail Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F0] text-stone-600 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Title / Source</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Language</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Last Synced</th>
                  <th className="py-2.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-[#172B46]">
                {chunks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500 text-xs">
                      No knowledge chunks found. Click &quot;Sync Knowledge Now&quot; to ingest published CMS records.
                    </td>
                  </tr>
                ) : (
                  chunks.map((c) => {
                    const isSelected = selectedChunk?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedChunk(c)}
                        className={`cursor-pointer hover:bg-stone-50 transition-colors ${
                          isSelected ? "bg-amber-50/50" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-[#172B46]">
                          {c.title}
                          {c.slug && (
                            <span className="block text-[10px] text-stone-500 font-mono">
                              /{c.slug}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-600 font-mono text-[10px]">
                          {c.sourceType}
                        </td>
                        <td className="py-3 px-4 uppercase font-semibold text-[10px] text-stone-600">
                          {c.language}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              c.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-stone-100 text-stone-500"
                            }`}
                          >
                            {c.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-[11px]">
                          {new Date(c.lastSyncedAt || c.updatedAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Eye className="w-3.5 h-3.5 text-stone-400 inline hover:text-[#B08D57]" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chunk Content Detail Inspector */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs p-4 flex flex-col h-[650px] overflow-hidden">
          {selectedChunk ? (
            <>
              <div className="pb-3 border-b border-stone-200 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-sm font-bold text-[#172B46]">
                    {selectedChunk.title}
                  </h3>
                  <button
                    onClick={() => toggleChunkActive(selectedChunk.id, selectedChunk.isActive)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      selectedChunk.isActive
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-stone-100 text-stone-600 border-stone-300"
                    }`}
                  >
                    {selectedChunk.isActive ? "Active (Deactivate)" : "Inactive (Activate)"}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                  <span className="font-mono">{selectedChunk.sourceType}</span>
                  {selectedChunk.slug && <span>• /{selectedChunk.slug}</span>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs leading-relaxed">
                <div>
                  <p className="font-semibold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                    Grounded Content
                  </p>
                  <div className="p-3 bg-[#F7F5F0] rounded-lg border border-stone-200 whitespace-pre-line text-stone-800 text-xs">
                    {selectedChunk.content}
                  </div>
                </div>

                {selectedChunk.keywords && selectedChunk.keywords.length > 0 && (
                  <div>
                    <p className="font-semibold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                      Indexed Search Keywords
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedChunk.keywords.map((kw: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-stone-100 rounded text-[10px] text-stone-600 font-mono"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedChunk.aliases && selectedChunk.aliases.length > 0 && (
                  <div>
                    <p className="font-semibold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                      Hinglish & Transliterated Aliases
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedChunk.aliases.map((al: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-mono"
                        >
                          {al}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Database className="w-10 h-10 mb-2 opacity-30 text-[#172B46]" />
              <p className="text-xs">Select any chunk to inspect full grounded text, keywords, and transliterated aliases.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
