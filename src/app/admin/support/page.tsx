"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Phone,
  Mail,
  MessageSquare,
  ShieldAlert,
  ArrowUpRight,
  Lock,
  PlusCircle,
  X,
  Send,
  RefreshCw,
} from "lucide-react";

interface SupportCaseEventItem {
  id: string;
  eventType: string;
  isInternal: boolean;
  note: string | null;
  createdAt: string;
  adminUser?: { name: string; email: string } | null;
}

interface SupportCaseItem {
  id: string;
  caseNumber: string;
  customerName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  category: string;
  subcategory: string | null;
  subject: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status:
    | "OPEN"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "WAITING_FOR_CUSTOMER"
    | "WAITING_FOR_TEAM"
    | "ESCALATED"
    | "RESOLVED"
    | "CLOSED";
  assignedTo: string | null;
  advisorSummary: string | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  conversation?: { id: string; primaryIntent: string | null; visitorClass: string | null } | null;
  events?: SupportCaseEventItem[];
}

export default function AdminSupportPage() {
  const [cases, setCases] = useState<SupportCaseItem[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total: 0,
    open: 0,
    inProgress: 0,
    escalated: 0,
    resolved: 0,
    highPriority: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<SupportCaseItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Detail Modal Actions State
  const [internalNote, setInternalNote] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);

      const res = await fetch(`/api/admin/support?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load support cases");
      const json = await res.json();
      setCases(json.data || []);
      if (json.metrics) setMetrics(json.metrics);
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Failed to load support cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [categoryFilter, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const openCaseDetails = async (caseId: string) => {
    try {
      const res = await fetch(`/api/admin/support/${caseId}`);
      if (!res.ok) throw new Error("Failed to fetch case details");
      const json = await res.json();
      setSelectedCase(json.data);
      setAssigneeName(json.data.assignedTo || "");
      setResolutionText(json.data.resolutionNotes || "");
    } catch (err: any) {
      alert("Could not load case details: " + err.message);
    }
  };

  const handleAction = async (payload: any) => {
    if (!selectedCase) return;
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await fetch(`/api/admin/support/${selectedCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }

      const json = await res.json();
      setSelectedCase(json.data);
      setActionSuccess("Case updated successfully.");
      setTimeout(() => setActionSuccess(null), 3000);
      fetchCases();
    } catch (err: any) {
      setActionError(err.message || "Action failed");
    }
  };

  const handleAddInternalNote = async () => {
    if (!internalNote.trim()) return;
    await handleAction({ action: "ADD_INTERNAL_NOTE", note: internalNote });
    setInternalNote("");
  };

  const handleAssign = async () => {
    if (!assigneeName.trim()) return;
    await handleAction({ action: "ASSIGN", assignedTo: assigneeName });
  };

  const handleResolve = async () => {
    if (!resolutionText.trim()) {
      alert("Please provide resolution notes before marking the case resolved.");
      return;
    }
    await handleAction({ action: "RESOLVE", resolutionNotes: resolutionText });
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded">URGENT</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">LOW</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "OPEN":
        return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">Open</span>;
      case "ASSIGNED":
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">Assigned</span>;
      case "IN_PROGRESS":
        return <span className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">In Progress</span>;
      case "ESCALATED":
        return <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 rounded-full border border-red-200">Escalated</span>;
      case "WAITING_FOR_CUSTOMER":
        return <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full border border-amber-200">Waiting for Client</span>;
      case "RESOLVED":
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-300">Resolved</span>;
      case "CLOSED":
        return <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full border border-gray-300">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">{s}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#172B46] text-[#B08D57] rounded-lg">
              <LifeBuoy className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#172B46]">
              Support & Service Operations Desk
            </h1>
          </div>
          <p className="text-sm text-[#172B46]/70 mt-1">
            Database-backed case management integrated with Soumya and Senior Advisory Operations.
          </p>
        </div>
        <button
          onClick={fetchCases}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#172B46]/10 text-xs font-medium text-[#172B46] rounded-md shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Cases
        </button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-[#172B46]/10 p-4 rounded-xl shadow-sm">
          <p className="text-xs uppercase font-medium text-[#172B46]/60">Total Cases</p>
          <p className="text-2xl font-serif font-bold text-[#172B46] mt-1">{metrics.total || 0}</p>
        </div>
        <div className="bg-white border border-[#172B46]/10 p-4 rounded-xl shadow-sm">
          <p className="text-xs uppercase font-medium text-emerald-700">Open & Active</p>
          <p className="text-2xl font-serif font-bold text-emerald-800 mt-1">
            {(metrics.open || 0) + (metrics.assigned || 0) + (metrics.inProgress || 0)}
          </p>
        </div>
        <div className="bg-white border border-red-200 p-4 rounded-xl shadow-sm bg-red-50/20">
          <p className="text-xs uppercase font-bold text-red-700">Escalated / High Priority</p>
          <p className="text-2xl font-serif font-bold text-red-800 mt-1">
            {metrics.escalated || metrics.highPriority || 0}
          </p>
        </div>
        <div className="bg-white border border-[#172B46]/10 p-4 rounded-xl shadow-sm">
          <p className="text-xs uppercase font-medium text-indigo-700">In Progress</p>
          <p className="text-2xl font-serif font-bold text-indigo-800 mt-1">{metrics.inProgress || 0}</p>
        </div>
        <div className="bg-white border border-[#172B46]/10 p-4 rounded-xl shadow-sm">
          <p className="text-xs uppercase font-medium text-slate-600">Resolved</p>
          <p className="text-2xl font-serif font-bold text-slate-700 mt-1">{metrics.resolved || 0}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#172B46]/10 p-4 rounded-xl shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#172B46]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by case number (e.g. VW-CASE), customer name, email, phone, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#172B46]/15 rounded-md text-sm text-[#172B46] placeholder:text-[#172B46]/40 focus:outline-none focus:ring-1 focus:ring-[#B08D57]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#172B46] text-white text-sm font-medium rounded-md hover:bg-[#1f3757] transition shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#172B46]/10 text-xs">
          <span className="text-[#172B46]/60 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#172B46]/15 rounded px-2.5 py-1.5 text-[#172B46] bg-slate-50 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-[#172B46]/15 rounded px-2.5 py-1.5 text-[#172B46] bg-slate-50 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-[#172B46]/15 rounded px-2.5 py-1.5 text-[#172B46] bg-slate-50 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="GENERAL_ENQUIRY">General Enquiry</option>
            <option value="INVESTMENT_SERVICE">Investment Service</option>
            <option value="PORTFOLIO_REVIEW">Portfolio Review</option>
            <option value="INSURANCE">Insurance</option>
            <option value="TAX">Tax Advisory</option>
            <option value="FINANCING">Financing</option>
            <option value="CONSULTATION">Consultation</option>
            <option value="DOCUMENT_REQUEST">Document Request</option>
            <option value="SERVICE_COMPLAINT">Service Complaint</option>
            <option value="CALLBACK">Callback</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white border border-[#172B46]/10 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#172B46]/50">Loading support cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-[#172B46] font-medium">No support cases found</p>
            <p className="text-xs text-[#172B46]/50">
              Cases generated automatically by Soumya or created at the desk will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-[#172B46]/10 text-[#172B46]/70 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Category & Subject</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172B46]/5 text-[#172B46]">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openCaseDetails(c.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#172B46] whitespace-nowrap">
                      {c.caseNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-sm">{c.customerName}</div>
                      <div className="text-[11px] text-[#172B46]/60">
                        {c.contactPhone || c.contactEmail || "No contact provided"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium truncate text-sm">{c.subject}</div>
                      <div className="text-[11px] text-[#172B46]/50 truncate">
                        {c.category.replace(/_/g, " ")} {c.subcategory ? `• ${c.subcategory}` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getPriorityBadge(c.priority)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(c.status)}</td>
                    <td className="py-3.5 px-4 text-[#172B46]/80 whitespace-nowrap">
                      {c.assignedTo || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4 text-[#172B46]/60 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs font-semibold text-[#B08D57] hover:underline flex items-center justify-end gap-1">
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="p-6 bg-[#172B46] text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tracking-wide text-[#B08D57] font-bold">
                    {selectedCase.caseNumber}
                  </span>
                  {getPriorityBadge(selectedCase.priority)}
                  {getStatusBadge(selectedCase.status)}
                </div>
                <h2 className="text-lg font-serif font-bold mt-1 text-white">{selectedCase.subject}</h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Opened {new Date(selectedCase.createdAt).toLocaleString("en-IN")} • Category:{" "}
                  {selectedCase.category.replace(/_/g, " ")}
                </p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification alert banner */}
            {actionSuccess && (
              <div className="bg-emerald-50 text-emerald-800 text-xs px-6 py-2 border-b border-emerald-200">
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="bg-red-50 text-red-800 text-xs px-6 py-2 border-b border-red-200">
                {actionError}
              </div>
            )}

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Profile Card */}
              <div className="bg-slate-50 border border-[#172B46]/10 p-4 rounded-xl space-y-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-[#172B46]/60">
                  Client Contact Profile
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-[#172B46]/50 block">Full Name:</span>
                    <span className="font-semibold text-[#172B46]">{selectedCase.customerName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#172B46]/50 block">Phone:</span>
                    <span className="font-semibold text-[#172B46]">
                      {selectedCase.contactPhone || "None provided"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-[#172B46]/50 block">Email:</span>
                    <span className="font-semibold text-[#172B46]">
                      {selectedCase.contactEmail || "None provided"}
                    </span>
                  </div>
                </div>

                {selectedCase.conversation && (
                  <div className="pt-2 mt-2 border-t border-[#172B46]/10 flex items-center justify-between">
                    <span className="text-xs text-[#172B46]/70">Correlated Chat Conversation:</span>
                    <Link
                      href={`/admin/chat/conversations`}
                      className="text-xs font-semibold text-[#B08D57] hover:underline flex items-center gap-1"
                    >
                      View Live Transcript <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Case Verbatim Description */}
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider font-semibold text-[#172B46]/60">
                  Customer Requirement / Verbatim Concern
                </p>
                <div className="p-3 bg-white border border-[#172B46]/10 rounded-lg text-sm text-[#172B46] whitespace-pre-wrap">
                  {selectedCase.description}
                </div>
              </div>

              {/* Advisor Discovery Summary */}
              {selectedCase.advisorSummary && (
                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-wider font-semibold text-[#172B46]/60">
                    Advisor Discovery Briefing
                  </p>
                  <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs font-mono text-[#172B46] whitespace-pre-wrap">
                    {selectedCase.advisorSummary}
                  </div>
                </div>
              )}

              {/* Actions & Lifecycle Panel */}
              <div className="bg-white border border-[#172B46]/10 p-4 rounded-xl space-y-4">
                <p className="text-xs uppercase tracking-wider font-semibold text-[#172B46]/60">
                  Operational Case Lifecycle Controls
                </p>

                {/* Status Transition Buttons */}
                <div className="space-y-1.5">
                  <span className="text-xs text-[#172B46]/70 block font-medium">Update Status:</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(
                      [
                        "OPEN",
                        "ASSIGNED",
                        "IN_PROGRESS",
                        "WAITING_FOR_CUSTOMER",
                        "WAITING_FOR_TEAM",
                        "ESCALATED",
                        "RESOLVED",
                        "CLOSED",
                      ] as const
                    ).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleAction({ action: "UPDATE_STATUS", status: st })}
                        className={`px-3 py-1.5 rounded border transition ${
                          selectedCase.status === st
                            ? "bg-[#172B46] text-white font-bold border-[#172B46]"
                            : "bg-slate-50 text-[#172B46] border-[#172B46]/10 hover:bg-slate-100"
                        }`}
                      >
                        {st.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="space-y-1.5 pt-2 border-t border-[#172B46]/10">
                  <span className="text-xs text-[#172B46]/70 block font-medium">Priority Escalation:</span>
                  <div className="flex gap-2 text-xs">
                    {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((pr) => (
                      <button
                        key={pr}
                        onClick={() => handleAction({ action: "UPDATE_PRIORITY", priority: pr })}
                        className={`px-3 py-1 rounded border transition ${
                          selectedCase.priority === pr
                            ? pr === "URGENT"
                              ? "bg-red-700 text-white font-bold border-red-700"
                              : "bg-[#172B46] text-white font-bold border-[#172B46]"
                            : "bg-slate-50 text-[#172B46] border-[#172B46]/10 hover:bg-slate-100"
                        }`}
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignment */}
                <div className="space-y-1.5 pt-2 border-t border-[#172B46]/10">
                  <span className="text-xs text-[#172B46]/70 block font-medium">Assigned Advisor:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Advisor Name or RM..."
                      value={assigneeName}
                      onChange={(e) => setAssigneeName(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 border border-[#172B46]/15 rounded"
                    />
                    <button
                      onClick={handleAssign}
                      className="px-3 py-1.5 bg-[#172B46] text-white text-xs font-semibold rounded hover:bg-[#1f3757]"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Resolution Notes */}
                <div className="space-y-1.5 pt-2 border-t border-[#172B46]/10">
                  <span className="text-xs text-[#172B46]/70 block font-medium">Resolution Notes:</span>
                  <textarea
                    rows={2}
                    placeholder="Document how this issue was resolved..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#172B46]/15 rounded focus:outline-none"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] text-[#172B46]/50">
                      Required when marking case as Resolved.
                    </p>
                    <button
                      onClick={handleResolve}
                      className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded hover:bg-emerald-800"
                    >
                      Resolve Case
                    </button>
                  </div>
                </div>

                {/* Out-of-band messaging advisory */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-[#172B46]/70">
                  <strong>Notice for Administrators:</strong> Automated email/SMS dispatch is currently
                  not configured. Please coordinate directly with the client via phone or corporate email.
                </div>
              </div>

              {/* Case History & Internal Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider font-semibold text-[#172B46]/60">
                    Case Timeline & Internal Notes
                  </p>
                  <span className="text-[11px] text-[#172B46]/50 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#B08D57]" /> Internal notes hidden from visitor
                  </span>
                </div>

                {/* New Internal Note Form */}
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="Add an internal advisor note regarding investigation, callbacks, or next steps..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    className="flex-1 text-xs p-2.5 border border-[#172B46]/15 rounded focus:outline-none focus:ring-1 focus:ring-[#B08D57]"
                  />
                  <button
                    onClick={handleAddInternalNote}
                    className="px-3 bg-[#172B46] text-white text-xs font-semibold rounded hover:bg-[#1f3757] flex items-center gap-1 self-end py-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Note
                  </button>
                </div>

                {/* Events list */}
                <div className="space-y-2 pt-2">
                  {(selectedCase.events || []).length === 0 ? (
                    <p className="text-xs text-[#172B46]/40 italic">No events recorded yet.</p>
                  ) : (
                    selectedCase.events?.map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-lg text-xs space-y-1 ${
                          ev.isInternal
                            ? "bg-amber-50/60 border border-amber-200/60"
                            : "bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#172B46] flex items-center gap-1.5">
                            {ev.isInternal ? (
                              <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded font-bold text-[10px]">
                                INTERNAL NOTE
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-bold text-[10px]">
                                {ev.eventType}
                              </span>
                            )}
                            {ev.adminUser?.name || "System"}
                          </span>
                          <span className="text-[#172B46]/50">
                            {new Date(ev.createdAt).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {ev.note && <p className="text-[#172B46]/80 text-xs">{ev.note}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
