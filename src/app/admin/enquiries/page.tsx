"use client";

import { useState, useEffect } from "react";
import {
  Inbox,
  Calendar,
  Mail,
  Phone,
  Video,
  Building2,
  CheckCircle,
  Clock,
  Archive,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { EnquiryItem } from "@/types/enquiry";

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/enquiries");
      if (!res.ok) throw new Error("Failed to load enquiries");
      const data = await res.json();
      setEnquiries(data.enquiries || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to load enquiries" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "NEW" | "CONTACTED" | "ARCHIVED") => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }

      setActionMessage({
        type: "success",
        text: `Enquiry marked as ${newStatus.toLowerCase()}.`,
      });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Status update failed" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this lead?")) return;

    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete enquiry");

      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry(null);
      }
      setActionMessage({ type: "success", text: "Enquiry deleted." });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Delete failed" });
    }
  };

  const filteredEnquiries = enquiries
    .filter((e) => {
      if (typeFilter === "ALL") return true;
      return e.type === typeFilter;
    })
    .filter((e) => {
      if (statusFilter === "ALL") return true;
      return e.status === statusFilter;
    })
    .filter((e) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        e.fullName.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.phone.toLowerCase().includes(term) ||
        (e.subject && e.subject.toLowerCase().includes(term))
      );
    });

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5]">
        <div>
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#B08D57]">
            Client Communications Desk
          </span>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight mt-0.5">
            Advisory Enquiries &amp; Consultations
          </h1>
          <p className="text-[13px] text-[#172B46]/70 mt-1">
            Review prospective client contact submissions and scheduled discovery requests.
          </p>
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

      {/* Type Filter Tabs */}
      <div className="flex border-b border-[#E5DFD5] text-xs font-semibold gap-6">
        <button
          type="button"
          onClick={() => setTypeFilter("ALL")}
          className={`pb-3 relative cursor-pointer ${
            typeFilter === "ALL"
              ? "text-[#172B46] font-bold border-b-2 border-[#B08D57]"
              : "text-[#172B46]/60 hover:text-[#172B46]"
          }`}
        >
          All Inquiries ({enquiries.length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter("CONSULTATION")}
          className={`pb-3 relative cursor-pointer ${
            typeFilter === "CONSULTATION"
              ? "text-[#172B46] font-bold border-b-2 border-[#B08D57]"
              : "text-[#172B46]/60 hover:text-[#172B46]"
          }`}
        >
          Discovery Consultations ({enquiries.filter((e) => e.type === "CONSULTATION").length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter("CONTACT")}
          className={`pb-3 relative cursor-pointer ${
            typeFilter === "CONTACT"
              ? "text-[#172B46] font-bold border-b-2 border-[#B08D57]"
              : "text-[#172B46]/60 hover:text-[#172B46]"
          }`}
        >
          Contact Messages ({enquiries.filter((e) => e.type === "CONTACT").length})
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-[#FFFFFF] p-4 rounded-sm border border-[#E5DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#172B46]/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by client name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#172B46]/70">
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm focus:outline-none focus:border-[#B08D57] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New (Uncontacted)</option>
            <option value="CONTACTED">Contacted</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table / Grid */}
      <div className="bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#172B46]/60">
            Loading enquiries...
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#172B46]/60 font-light">
            No inquiries found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172B46]">
              <thead className="bg-[#F7F5F0] border-b border-[#E5DFD5] uppercase text-[10px] font-bold tracking-wider text-[#172B46]/70">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Details / Service</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]/60">
                {filteredEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                    {/* Client */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#172B46]">
                        {enq.fullName}
                      </div>
                      <div className="text-[11px] text-[#172B46]/65">
                        {enq.email} &bull; {enq.phone}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase ${
                          enq.type === "CONSULTATION"
                            ? "bg-[#B08D57]/20 text-[#B08D57]"
                            : "bg-[#172B46]/10 text-[#172B46]"
                        }`}
                      >
                        {enq.type}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4">
                      {enq.type === "CONSULTATION" ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-[#172B46]">
                            {enq.serviceSlug || "Wealth Strategy"}
                          </div>
                          <div className="text-[11px] text-[#172B46]/60 flex items-center gap-1">
                            {enq.preferredMode === "IN_PERSON" ? (
                              <Building2 className="w-3 h-3 text-[#B08D57]" />
                            ) : (
                              <Video className="w-3 h-3 text-[#B08D57]" />
                            )}
                            <span>
                              {enq.preferredDate || "Anytime"} ({enq.preferredTime || "Standard"})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="font-medium text-[#172B46]">
                            {enq.subject || "General Inquiry"}
                          </div>
                          <p className="text-[11px] text-[#172B46]/60 line-clamp-1">
                            {enq.message}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-[#172B46]/60">
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase ${
                          enq.status === "NEW"
                            ? "bg-amber-100 text-amber-800"
                            : enq.status === "CONTACTED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {enq.status === "NEW" && <Clock className="w-3 h-3" />}
                        {enq.status === "CONTACTED" && <CheckCircle className="w-3 h-3" />}
                        {enq.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiry(enq)}
                          className="px-2 py-1 bg-[#172B46] text-[#FFFFFF] text-[11px] font-semibold rounded-xs hover:bg-[#B08D57] transition-colors cursor-pointer"
                        >
                          View
                        </button>

                        {enq.status === "NEW" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(enq.id, "CONTACTED")}
                            title="Mark as Contacted"
                            className="p-1 text-[#172B46]/60 hover:text-green-700 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(enq.id, "ARCHIVED")}
                            title="Archive"
                            className="p-1 text-[#172B46]/60 hover:text-gray-700 cursor-pointer"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(enq.id)}
                          title="Delete"
                          className="p-1 text-[#172B46]/60 hover:text-red-700 cursor-pointer"
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

      {/* Inquiry Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B46]/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] max-w-xl w-full p-6 sm:p-8 rounded-sm border border-[#E5DFD5] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#B08D57]">
                  {selectedEnquiry.type === "CONSULTATION" ? "Consultation Request" : "Contact Message"}
                </span>
                <h3 className="text-xl font-sans font-bold text-[#172B46]">
                  {selectedEnquiry.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#172B46]/60 block uppercase text-[10px] font-bold">Email</span>
                <a href={`mailto:${selectedEnquiry.email}`} className="text-[#B08D57] font-semibold underline">
                  {selectedEnquiry.email}
                </a>
              </div>
              <div>
                <span className="text-[#172B46]/60 block uppercase text-[10px] font-bold">Phone</span>
                <a href={`tel:${selectedEnquiry.phone}`} className="text-[#172B46] font-semibold">
                  {selectedEnquiry.phone}
                </a>
              </div>
              {selectedEnquiry.serviceSlug && (
                <div>
                  <span className="text-[#172B46]/60 block uppercase text-[10px] font-bold">Service Practice</span>
                  <span className="font-semibold text-[#172B46]">{selectedEnquiry.serviceSlug}</span>
                </div>
              )}
              {selectedEnquiry.preferredMode && (
                <div>
                  <span className="text-[#172B46]/60 block uppercase text-[10px] font-bold">Meeting Mode</span>
                  <span className="font-semibold text-[#172B46]">
                    {selectedEnquiry.preferredMode === "IN_PERSON" ? "In-Person Desk" : "Virtual Video Consultation"}
                  </span>
                </div>
              )}
              {selectedEnquiry.preferredDate && (
                <div>
                  <span className="text-[#172B46]/60 block uppercase text-[10px] font-bold">Requested Date</span>
                  <span className="font-semibold text-[#172B46]">{selectedEnquiry.preferredDate}</span>
                </div>
              )}
              {selectedEnquiry.preferredTime && (
                <div>
                  <span className="text-[#172B46]/60 block uppercase text-[10px] font-bold">Preferred Time Window</span>
                  <span className="font-semibold text-[#172B46]">{selectedEnquiry.preferredTime}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[#172B46]/60 uppercase text-[10px] font-bold block">
                Client Context & Inquired Message
              </span>
              <div className="p-4 bg-[#F7F5F0] rounded-sm border border-[#E5DFD5] text-xs text-[#172B46] leading-relaxed whitespace-pre-wrap">
                {selectedEnquiry.message}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5DFD5]">
              <div className="flex items-center gap-2">
                {selectedEnquiry.status !== "CONTACTED" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedEnquiry.id, "CONTACTED")}
                    className="px-3.5 py-2 bg-green-700 hover:bg-green-800 text-[#FFFFFF] text-xs font-semibold rounded-sm cursor-pointer"
                  >
                    Mark as Contacted
                  </button>
                )}
                {selectedEnquiry.status !== "ARCHIVED" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedEnquiry.id, "ARCHIVED")}
                    className="px-3.5 py-2 border border-[#E5DFD5] text-[#172B46] hover:bg-[#F7F5F0] text-xs font-semibold rounded-sm cursor-pointer"
                  >
                    Archive
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 border border-[#E5DFD5] text-xs font-semibold text-[#172B46] rounded-sm hover:bg-[#F7F5F0] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
