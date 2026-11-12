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
  const [pipelineMetrics, setPipelineMetrics] = useState<any>({
    total: 0,
    newEnquiries: 0,
    qualification: 0,
    consultationRequested: 0,
    consultationScheduled: 0,
    converted: 0,
    closed: 0,
    pendingFollowUps: 0,
  });
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [salesStageFilter, setSalesStageFilter] = useState("");
  const [hasFollowUpFilter, setHasFollowUpFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminNote, setAdminNote] = useState("");
  const [assignedAdvisorInput, setAssignedAdvisorInput] = useState("");
  const [followUpDateInput, setFollowUpDateInput] = useState("");
  const [closureReasonInput, setClosureReasonInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchLeads() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      if (salesStageFilter) params.set("salesStage", salesStageFilter);
      if (hasFollowUpFilter) params.set("hasPendingFollowUp", "true");
      params.set("page", page.toString());

      const res = await fetch(`/api/admin/chat/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        if (data.pipelineMetrics) setPipelineMetrics(data.pipelineMetrics);
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
        setAssignedAdvisorInput(data.lead.assignedAdvisor || "");
      }
    } catch (e) {
      console.error("Error opening lead:", e);
    }
  }

  async function handlePatchLead(payload: any) {
    if (!selectedLead) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/chat/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLead(data.lead);
        fetchLeads();
        setNotification({ type: "success", text: "Lead updated successfully." });
      } else {
        setNotification({ type: "error", text: data.error || "Update failed." });
      }
    } catch (e: any) {
      setNotification({ type: "error", text: e.message || "Failed to update lead." });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    await handlePatchLead({ status: newStatus });
  }

  async function updateStage(newStage: string) {
    await handlePatchLead({ salesStage: newStage });
  }

  async function handleAssignAdvisor() {
    if (!assignedAdvisorInput.trim()) return;
    await handlePatchLead({ assignedAdvisor: assignedAdvisorInput.trim() });
  }

  async function handleSetFollowUp() {
    if (!followUpDateInput) return;
    await handlePatchLead({ followUpDate: followUpDateInput });
    setFollowUpDateInput("");
  }

  async function handleCompleteFollowUp() {
    await handlePatchLead({ action: "COMPLETE_FOLLOW_UP" });
  }

  async function handleCloseLead() {
    if (!closureReasonInput.trim()) {
      alert("Please provide a reason for marking the lead as not proceeding.");
      return;
    }
    await handlePatchLead({ reason: closureReasonInput.trim() });
    setClosureReasonInput("");
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !adminNote.trim()) return;
    await handlePatchLead({ note: adminNote.trim() });
    setAdminNote("");
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
  }, [page, statusFilter, salesStageFilter, hasFollowUpFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight">
            Sales Pipeline &amp; Relationship Management
          </h1>
          <p className="text-[13px] text-stone-600 mt-1">
            Qualify, track pipeline stages, schedule advisor follow-ups, and convert prospective clients captured via Soumya.
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

      {/* Sales Pipeline Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200 p-3 rounded-lg shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-stone-500">Total Enquiries</p>
          <p className="text-xl font-bold text-[#172B46] mt-0.5">{pipelineMetrics.total || 0}</p>
        </div>
        <div className="bg-white border border-stone-200 p-3 rounded-lg shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-amber-700">Qualifying</p>
          <p className="text-xl font-bold text-amber-900 mt-0.5">{pipelineMetrics.qualification || 0}</p>
        </div>
        <div className="bg-white border border-blue-200 p-3 rounded-lg shadow-2xs bg-blue-50/20">
          <p className="text-[10px] uppercase font-bold text-blue-700">Consultation Reqs</p>
          <p className="text-xl font-bold text-blue-900 mt-0.5">{pipelineMetrics.consultationRequested || 0}</p>
        </div>
        <div className="bg-white border border-indigo-200 p-3 rounded-lg shadow-2xs bg-indigo-50/20">
          <p className="text-[10px] uppercase font-bold text-indigo-700">Scheduled</p>
          <p className="text-xl font-bold text-indigo-900 mt-0.5">{pipelineMetrics.consultationScheduled || 0}</p>
        </div>
        <div className="bg-white border border-emerald-200 p-3 rounded-lg shadow-2xs bg-emerald-50/20">
          <p className="text-[10px] uppercase font-bold text-emerald-700">Converted Clients</p>
          <p className="text-xl font-bold text-emerald-900 mt-0.5">{pipelineMetrics.converted || 0}</p>
        </div>
        <div className="bg-white border border-rose-200 p-3 rounded-lg shadow-2xs bg-rose-50/20">
          <p className="text-[10px] uppercase font-bold text-rose-700">Pending Follow-Ups</p>
          <p className="text-xl font-bold text-rose-900 mt-0.5">{pipelineMetrics.pendingFollowUps || 0}</p>
        </div>
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
          value={salesStageFilter}
          onChange={(e) => {
            setSalesStageFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white px-3 py-2 rounded-lg border border-stone-300 text-stone-700"
        >
          <option value="">All Sales Stages</option>
          <option value="NEW_ENQUIRY">NEW_ENQUIRY</option>
          <option value="INITIAL_DISCOVERY">INITIAL_DISCOVERY</option>
          <option value="QUALIFICATION">QUALIFICATION</option>
          <option value="CONSULTATION_REQUESTED">CONSULTATION_REQUESTED</option>
          <option value="CONSULTATION_SCHEDULED">CONSULTATION_SCHEDULED</option>
          <option value="PROPOSAL_OR_NEXT_STEPS">PROPOSAL_OR_NEXT_STEPS</option>
          <option value="CONVERTED">CONVERTED</option>
          <option value="NOT_PROCEEDING">NOT_PROCEEDING</option>
          <option value="NURTURE">NURTURE</option>
        </select>

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
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4">Score</th>
                  <th className="py-2.5 px-4">Advisor</th>
                  <th className="py-2.5 px-4">Next Follow-Up</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-[#172B46]">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500 text-xs">
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
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-[#172B46]">
                            {l.salesStage || "NEW_ENQUIRY"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#B08D57]"
                                style={{ width: `${l.qualificationScore || 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-stone-500">
                              {l.qualificationScore || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          {l.assignedAdvisor || <span className="text-stone-400 italic">Unassigned</span>}
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-[11px]">
                          {l.nextFollowUpAt ? (
                            <span className="text-rose-700 font-semibold">
                              {new Date(l.nextFollowUpAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
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
              <div className="py-2.5 space-y-2 border-b border-stone-100 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-stone-600">Sales Stage:</span>
                    <select
                      value={selectedLead.salesStage || "NEW_ENQUIRY"}
                      onChange={(e) => updateStage(e.target.value)}
                      disabled={actionLoading}
                      className="text-xs font-semibold border border-stone-300 rounded px-2 py-1 text-[#172B46] bg-amber-50/50"
                    >
                      <option value="NEW_ENQUIRY">NEW_ENQUIRY</option>
                      <option value="INITIAL_DISCOVERY">INITIAL_DISCOVERY</option>
                      <option value="QUALIFICATION">QUALIFICATION</option>
                      <option value="CONSULTATION_OFFERED">CONSULTATION_OFFERED</option>
                      <option value="CONSULTATION_REQUESTED">CONSULTATION_REQUESTED</option>
                      <option value="CONSULTATION_SCHEDULED">CONSULTATION_SCHEDULED</option>
                      <option value="CONSULTATION_COMPLETED">CONSULTATION_COMPLETED</option>
                      <option value="PROPOSAL_OR_NEXT_STEPS">PROPOSAL_OR_NEXT_STEPS</option>
                      <option value="CONVERTED">CONVERTED</option>
                      <option value="NOT_PROCEEDING">NOT_PROCEEDING</option>
                      <option value="NURTURE">NURTURE</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-stone-500">Qual:</span>
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#172B46] hover:bg-[#253f63] text-white text-[11px] font-medium rounded transition-colors disabled:opacity-50"
                    >
                      <FileCheck className="w-3 h-3 text-[#B08D57]" /> Convert to Enquiry
                    </button>
                  )}
                </div>
              </div>

              {/* Lead Details Scroll View */}
              <div className="flex-1 overflow-y-auto space-y-4 py-3 text-xs">
                {/* Advisor Assignment & Follow-Up Management (Phase 4) */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#172B46] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#B08D57]" />
                      Advisor Assignment &amp; Follow-Up Schedule
                    </p>
                    {selectedLead.consultationStatus && (
                      <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-blue-100 text-blue-800">
                        Consultation: {selectedLead.consultationStatus}
                      </span>
                    )}
                  </div>

                  {/* Advisor Assignment Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Assign Lead to Advisor (e.g. Vineet Gupta)..."
                      value={assignedAdvisorInput}
                      onChange={(e) => setAssignedAdvisorInput(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded focus:outline-none focus:border-[#B08D57]"
                    />
                    <button
                      onClick={handleAssignAdvisor}
                      disabled={actionLoading || !assignedAdvisorInput.trim()}
                      className="px-3 py-1.5 bg-[#172B46] hover:bg-[#243f65] text-white rounded text-xs font-medium disabled:opacity-40"
                    >
                      Assign
                    </button>
                  </div>

                  {/* Follow-up Controls */}
                  <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-stone-600 font-medium">Scheduled Follow-Up:</span>
                      {selectedLead.nextFollowUpAt ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {new Date(selectedLead.nextFollowUpAt).toLocaleString()}
                          </span>
                          <button
                            onClick={handleCompleteFollowUp}
                            disabled={actionLoading}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                          >
                            Mark Completed
                          </button>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic text-[11px]">No pending follow-up</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="datetime-local"
                        value={followUpDateInput}
                        onChange={(e) => setFollowUpDateInput(e.target.value)}
                        className="flex-1 text-xs px-2 py-1 bg-white border border-stone-300 rounded focus:outline-none focus:border-[#B08D57]"
                      />
                      <button
                        onClick={handleSetFollowUp}
                        disabled={actionLoading || !followUpDateInput}
                        className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-medium disabled:opacity-40"
                      >
                        Set Follow-Up
                      </button>
                    </div>
                  </div>

                  {/* Close / Not Proceeding Option */}
                  {selectedLead.salesStage !== "NOT_PROCEEDING" && selectedLead.salesStage !== "CONVERTED" && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reason if closing / not proceeding..."
                        value={closureReasonInput}
                        onChange={(e) => setClosureReasonInput(e.target.value)}
                        className="flex-1 text-xs px-2 py-1 bg-white border border-stone-300 rounded focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={handleCloseLead}
                        disabled={actionLoading || !closureReasonInput.trim()}
                        className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-medium disabled:opacity-40"
                      >
                        Close Lead
                      </button>
                    </div>
                  )}

                  {selectedLead.closureReason && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-800">
                      <span className="font-bold">Closure Reason:</span> {selectedLead.closureReason}
                    </div>
                  )}
                </div>
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
                    {selectedLead.serviceInterest && (
                      <div className="col-span-2">
                        <span className="text-stone-500 block">Service Interest:</span>
                        <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                          {selectedLead.serviceInterest}
                        </span>
                      </div>
                    )}
                    {(selectedLead.source || selectedLead.campaign) && (
                      <div className="col-span-2 flex items-center gap-3 text-stone-500 text-[10px] pt-1">
                        {selectedLead.source && <span>Source: <strong className="text-stone-700">{selectedLead.source}</strong></span>}
                        {selectedLead.campaign && <span>Campaign: <strong className="text-stone-700">{selectedLead.campaign}</strong></span>}
                      </div>
                    )}
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
