"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  FileCheck,
} from "lucide-react";

export default function LeadsManagementPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchLeads() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());

      const res = await fetch(`/api/admin/chat/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (e) {
      console.error("Failed to fetch leads:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function openLead(id: string) {
    try {
      const res = await fetch(`/api/admin/chat/leads/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedLead(data.lead);
      }
    } catch (e) {
      console.error("Error opening lead:", e);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!selectedLead) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/chat/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLead(data.lead);
        fetchLeads();
        setNotification({ type: "success", text: `Status updated to ${newStatus}` });
      }
    } catch (e) {
      setNotification({ type: "error", text: "Failed to update status." });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !adminNote.trim()) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/chat/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: adminNote.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLead(data.lead);
        setAdminNote("");
        setNotification({ type: "success", text: "Internal note saved to timeline." });
      }
    } catch (e) {
      setNotification({ type: "error", text: "Failed to save note." });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConvertToEnquiry() {
    if (!selectedLead) return;
    if (
      !confirm(
        `Are you sure you want to convert lead "${selectedLead.fullName || selectedLead.id}" into an official Enquiry consultation record?`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/chat/leads/${selectedLead.id}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLead(data.lead);
        fetchLeads();
        setNotification({
          type: "success",
          text: `Successfully converted lead to Enquiry record (${data.enquiry.id})!`,
        });
      } else {
        setNotification({ type: "error", text: data.error || "Failed to convert lead." });
      }
    } catch (e) {
      setNotification({ type: "error", text: "Conversion request failed." });
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight">
            Advisory Leads &amp; Callbacks
          </h1>
          <p className="text-[13px] text-stone-600 mt-1">
            Qualify, follow up, and manage prospective clients captured through the Vantage Wealth Assistant.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold text-[#172B46] bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B08D57] ${isLoading ? "animate-spin" : ""}`} />
          Refresh
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone, or financial objective..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
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
          <option value="">All Qualification Statuses</option>
          <option value="NEW">NEW</option>
          <option value="QUALIFYING">QUALIFYING</option>
          <option value="QUALIFIED">QUALIFIED</option>
          <option value="CALLBACK_REQUESTED">CALLBACK_REQUESTED</option>
          <option value="CONTACT_PENDING">CONTACT_PENDING</option>
          <option value="CONVERTED">CONVERTED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Main Grid: Leads Table Left, Inspector Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F0] text-stone-600 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Visitor / Name</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4">Objective</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-[#172B46]">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500 text-xs">
                      No advisory leads found matching criteria.
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => {
                    const isSelected = selectedLead?.id === l.id;
                    return (
                      <tr
                        key={l.id}
                        onClick={() => openLead(l.id)}
                        className={`cursor-pointer hover:bg-stone-50 transition-colors ${
                          isSelected ? "bg-amber-50/50" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-[#172B46]">
                          {l.fullName || <span className="text-stone-400 italic">Unspecified</span>}
                          {l.consentGiven && (
                            <span className="ml-1.5 text-[9px] text-emerald-600 inline-flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> Consented
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          {l.phone || l.email || <span className="text-stone-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-stone-700">
                          {l.financialObjective || "General Wealth"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              l.status === "CALLBACK_REQUESTED"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : l.status === "QUALIFIED"
                                ? "bg-blue-50 text-blue-700"
                                : l.status === "CONVERTED_TO_ENQUIRY"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-[11px]">
                          {new Date(l.createdAt).toLocaleDateString([], {
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

        {/* Lead Inspector Detail Panel */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs p-4 flex flex-col h-[700px] overflow-hidden">
          {selectedLead ? (
            <>
              {/* Header */}
              <div className="pb-3 border-b border-stone-200 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-base font-bold text-[#172B46]">
                    {selectedLead.fullName || "Prospective Client"}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                    ID: {selectedLead.id.slice(-8)}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Captured on {new Date(selectedLead.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Status Action Bar */}
              <div className="py-2.5 flex items-center justify-between gap-2 border-b border-stone-100 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-stone-600">Qualification:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={actionLoading}
                    className="text-xs border border-stone-300 rounded px-2 py-1 text-stone-700 bg-white"
                  >
                    <option value="NEW">NEW</option>
                    <option value="QUALIFYING">QUALIFYING</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="CALLBACK_REQUESTED">CALLBACK_REQUESTED</option>
                    <option value="CONTACT_PENDING">CONTACT_PENDING</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                {!selectedLead.enquiryId && (
                  <button
                    onClick={handleConvertToEnquiry}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#172B46] hover:bg-[#253f63] text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                  >
                    <FileCheck className="w-3 h-3 text-[#B08D57]" /> Convert to Enquiry
                  </button>
                )}
              </div>

              {/* Lead Details Scroll View */}
              <div className="flex-1 overflow-y-auto space-y-4 py-3 text-xs">
                {/* Advisor Discovery Briefing Card (Phase 2 Intelligence) */}
                {selectedLead.advisorSummary && (
                  <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-[#B08D57]" />
                        Advisor Discovery Briefing
                      </p>
                      {selectedLead.urgency && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          selectedLead.urgency === "HIGH" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {selectedLead.urgency} Urgency
                        </span>
                      )}
                    </div>
                    <pre className="text-[11px] text-stone-800 whitespace-pre-wrap font-sans bg-white/70 p-2.5 rounded border border-amber-200/60 leading-relaxed">
                      {selectedLead.advisorSummary}
                    </pre>
                  </div>
                )}

                {/* Qualification Completeness Score */}
                {selectedLead.qualificationScore !== undefined && selectedLead.qualificationScore > 0 && (
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#172B46]">Qualification Completeness:</span>
                      <span className="font-bold text-[#B08D57]">{selectedLead.qualificationScore}%</span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-1.5">
                      <div
                        className="bg-[#B08D57] h-1.5 rounded-full transition-all"
                        style={{ width: `${selectedLead.qualificationScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Contact Card */}
                <div className="bg-[#F7F5F0] p-3 rounded-lg border border-stone-200 space-y-1.5">
                  <p className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">
                    Contact Information
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-500 block">Phone:</span>
                      <span className="font-medium text-[#172B46]">{selectedLead.phone || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Email:</span>
                      <span className="font-medium text-[#172B46]">{selectedLead.email || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Preferred Mode:</span>
                      <span className="font-medium text-[#172B46]">{selectedLead.preferredMethod}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Time Window:</span>
                      <span className="font-medium text-[#172B46]">{selectedLead.preferredTimeWindow || "Standard Hours"}</span>
                    </div>
                  </div>

                  {selectedLead.enquiry && (
                    <div className="mt-2 pt-2 border-t border-stone-200 text-emerald-800 text-[11px] flex items-center justify-between">
                      <span>Linked Enquiry: {selectedLead.enquiry.id}</span>
                      <Link
                        href={`/admin/enquiries?id=${selectedLead.enquiry.id}`}
                        className="text-[#B08D57] hover:underline flex items-center gap-0.5"
                      >
                        View in Enquiries <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Event Audit Timeline */}
                <div>
                  <p className="font-semibold text-stone-700 uppercase tracking-wider text-[10px] mb-2">
                    Lead Lifecycle & Audit Trail
                  </p>
                  <div className="space-y-2">
                    {selectedLead.events?.map((ev: any) => (
                      <div key={ev.id} className="p-2.5 bg-white border border-stone-200 rounded-lg text-[11px]">
                        <div className="flex items-center justify-between text-stone-500 mb-1 text-[10px]">
                          <span className="font-semibold text-[#172B46]">{ev.eventType}</span>
                          <span>{new Date(ev.createdAt).toLocaleTimeString()}</span>
                        </div>
                        {ev.metadata?.note && (
                          <p className="text-stone-700 italic">"{ev.metadata.note}"</p>
                        )}
                        {ev.adminUser && (
                          <p className="text-[10px] text-stone-400 mt-1">Logged by: {ev.adminUser.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-stone-200">
                  <label className="text-[11px] font-semibold text-stone-700 block">
                    Add Administrative Note
                  </label>
                  <textarea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Enter confidential notes regarding lead outreach or qualification..."
                    className="w-full text-xs p-2 rounded border border-stone-300 focus:outline-none focus:border-[#B08D57]"
                  />
                  <button
                    type="submit"
                    disabled={!adminNote.trim() || actionLoading}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    Save Note
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Users className="w-10 h-10 mb-2 opacity-30 text-[#172B46]" />
              <p className="text-xs">Select any lead to inspect contact preferences, audit history, and enquiry conversion.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
