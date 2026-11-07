"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Globe,
  RefreshCw,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  details?: any;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("ALL");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/audit-logs");
      if (!res.ok) throw new Error("Failed to load audit logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs
    .filter((log) => {
      if (filterAction === "ALL") return true;
      return log.action.includes(filterAction);
    })
    .filter((log) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(term) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(term)) ||
        (log.ipAddress && log.ipAddress.includes(term)) ||
        (log.entityType && log.entityType.toLowerCase().includes(term))
      );
    });

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5]">
        <div>
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#B08D57]">
            Fiduciary Compliance &amp; Governance
          </span>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight mt-0.5">
            Security &amp; Operational Audit Logs
          </h1>
          <p className="text-[13px] text-[#172B46]/70 mt-1">
            Immutable log of administrative logins, content mutations, spam interventions, and system operations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 border border-[#172B46]/30 bg-[#FFFFFF] text-[#172B46] hover:bg-[#F7F5F0] px-3.5 py-2 rounded-sm text-[13px] font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#FFFFFF] p-4 rounded-sm border border-[#E5DFD5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#172B46]/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, actor email, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#172B46]/70">
          <span>Action Type:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm focus:outline-none focus:border-[#B08D57] cursor-pointer"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            <option value="LOGIN">Authentication Events</option>
            <option value="ARTICLE">Article Mutations</option>
            <option value="SERVICE">Service Mutations</option>
            <option value="MEDIA">Media Assets</option>
            <option value="SPAM">Anti-Spam Interventions</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#172B46]/60">
            Loading security audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#172B46]/60 font-light">
            No audit records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172B46]">
              <thead className="bg-[#F7F5F0] border-b border-[#E5DFD5] uppercase text-[10px] font-bold tracking-wider text-[#172B46]/70">
                <tr>
                  <th className="py-3 px-4">Event Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F7F5F0]/50 transition-colors font-mono">
                    {/* Action */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                          log.action.includes("SUCCESS") || log.action.includes("CREATED")
                            ? "bg-green-100 text-green-800"
                            : log.action.includes("FAILURE") || log.action.includes("BLOCKED")
                            ? "bg-red-100 text-red-800"
                            : log.action.includes("UPDATED") || log.action.includes("RESTORED")
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-4 text-[#172B46]/80 font-sans">
                      {log.entityType} {log.entityId ? `(${log.entityId.slice(0, 10)})` : ""}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 font-sans text-[#172B46]">
                      {log.userEmail || "anonymous"}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 text-[#172B46]/60">
                      {log.ipAddress || "unknown"}
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-[#172B46]/70 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : "-"}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-[#172B46]/60 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
