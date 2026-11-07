"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  User,
  Shield,
  X,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function ConversationsManagementPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  async function fetchConversations() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      if (languageFilter) params.set("language", languageFilter);
      params.set("page", page.toString());

      const res = await fetch(`/api/admin/chat/conversations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function openDetail(id: string) {
    setIsDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/chat/conversations/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedConversation(data.conversation);
      }
    } catch (e) {
      console.error("Failed to load detail:", e);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/chat/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if (selectedConversation && selectedConversation.id === id) {
          setSelectedConversation({ ...selectedConversation, status: newStatus });
        }
        fetchConversations();
      }
    } catch (e) {
      console.error("Update status error:", e);
    }
  }

  useEffect(() => {
    fetchConversations();
  }, [page, statusFilter, languageFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight">
            Conversation Management
          </h1>
          <p className="text-[13px] text-stone-600 mt-1">
            Audit, review and inspect full chronological transcripts of all public chatbot interactions.
          </p>
        </div>

        <button
          onClick={fetchConversations}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold text-[#172B46] bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B08D57] ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by ID, session, visitor name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchConversations()}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white px-3 py-2 rounded-lg border border-stone-300 text-stone-700"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="ENDED">ENDED</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="CONVERTED">CONVERTED</option>
        </select>

        <select
          value={languageFilter}
          onChange={(e) => {
            setLanguageFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white px-3 py-2 rounded-lg border border-stone-300 text-stone-700"
        >
          <option value="">All Languages</option>
          <option value="en">English (en)</option>
          <option value="hi">Hindi (hi)</option>
          <option value="hinglish">Hinglish</option>
        </select>
      </div>

      {/* Main Grid: List on Left, Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F0] text-stone-600 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Session / ID</th>
                  <th className="py-2.5 px-4">Language</th>
                  <th className="py-2.5 px-4">Turns</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-[#172B46]">
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500 text-xs">
                      No conversations found matching filters.
                    </td>
                  </tr>
                ) : (
                  conversations.map((c) => {
                    const isSelected = selectedConversation?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => openDetail(c.id)}
                        className={`cursor-pointer hover:bg-stone-50 transition-colors ${
                          isSelected ? "bg-amber-50/50" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-[11px] font-semibold text-[#172B46]">
                          {c.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 uppercase">
                            {c.language}
                          </span>
                        </td>
                        <td className="py-3 px-4">{c._count?.messages ?? c.messageCount ?? 0}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              c.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : c.status === "CONVERTED"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-[11px]">
                          {new Date(c.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-stone-400 inline" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-[#F7F5F0] border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2.5 py-1 bg-white border border-stone-300 rounded disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-2.5 py-1 bg-white border border-stone-300 rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conversation Inspector Side Panel */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs p-4 flex flex-col h-[700px] overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="pb-3 border-b border-stone-200 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-sans text-sm font-bold text-[#172B46]">
                    Thread: {selectedConversation.id.slice(0, 10)}...
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 uppercase font-medium">
                      {selectedConversation.language}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {new Date(selectedConversation.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedConversation.status}
                    onChange={(e) => updateStatus(selectedConversation.id, e.target.value)}
                    className="text-xs border border-stone-300 rounded px-2 py-1 text-stone-700 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ENDED">ENDED</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="CONVERTED">CONVERTED</option>
                  </select>
                </div>
              </div>

              {/* Associated Lead Summary Card */}
              {selectedConversation.lead && (
                <div className="my-2.5 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs shrink-0">
                  <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                    Captured Lead: {selectedConversation.lead.fullName || "Prospective Client"}
                  </p>
                  <div className="text-[11px] text-blue-800 mt-1 grid grid-cols-2 gap-1">
                    <span>Phone: {selectedConversation.lead.phone || "—"}</span>
                    <span>Email: {selectedConversation.lead.email || "—"}</span>
                    <span>Objective: {selectedConversation.lead.financialObjective || "General"}</span>
                    <span>Status: {selectedConversation.lead.status}</span>
                  </div>
                </div>
              )}

              {/* Messages Chronological Transcript */}
              <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
                {selectedConversation.messages?.map((m: any) => {
                  const isAssistant = m.role === "ASSISTANT";
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg leading-relaxed ${
                        isAssistant
                          ? "bg-[#F7F5F0] border-l-2 border-l-[#B08D57] text-[#172B46]"
                          : "bg-[#172B46] text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[10px] opacity-70">
                        <span className="font-semibold">{m.role}</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="whitespace-pre-line text-xs">{m.content}</p>

                      {/* Flag Warning */}
                      {m.isFlagged && (
                        <div className="mt-1.5 pt-1.5 border-t border-amber-200 text-amber-800 text-[10px] flex items-center gap-1">
                          <Shield className="w-3 h-3 text-amber-600" />
                          <span>Flagged: {m.flagReason}</span>
                        </div>
                      )}

                      {/* Feedback Tag */}
                      {m.feedback && (
                        <div className="mt-1 text-[10px] text-stone-500 flex items-center gap-1">
                          {m.feedback.rating === 5 ? (
                            <ThumbsUp className="w-2.5 h-2.5 text-[#B08D57]" />
                          ) : (
                            <ThumbsDown className="w-2.5 h-2.5 text-red-500" />
                          )}
                          <span>Rating: {m.feedback.rating}/5</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-[#172B46]" />
              <p className="text-xs">Select any conversation from the list to inspect full transcript and citations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
