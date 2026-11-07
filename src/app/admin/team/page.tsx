"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  Users,
  Award,
  Clock,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
} from "lucide-react";
import { TeamMemberItem } from "@/types/team";

export default function AdminTeamListPage() {
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/team");
      if (!res.ok) throw new Error("Failed to load team profiles");
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to fetch team profiles" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const founder = members.find((m) => m.roleType === "FOUNDER") || members[0];
  const teamMembers = members.filter((m) => m.roleType === "TEAM");

  const handleToggleStatus = async (member: TeamMemberItem) => {
    const newStatus = member.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m))
      );
      setActionMessage({
        type: "success",
        text: `"${member.name}" is now ${newStatus === "PUBLISHED" ? "visible on public site" : "hidden (draft)"}.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to update status" });
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteModalId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/team/${deleteModalId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete team member");

      setMembers((prev) => prev.filter((m) => m.id !== deleteModalId));
      setActionMessage({ type: "success", text: "Team member profile deleted." });
      setDeleteModalId(null);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to delete team member" });
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= teamMembers.length) return;

    const newTeam = [...teamMembers];
    const [moved] = newTeam.splice(index, 1);
    newTeam.splice(targetIndex, 0, moved);

    const orderedIds = newTeam.map((m) => m.id);

    try {
      const res = await fetch("/api/admin/team/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Failed to update display order");

      setMembers((prev) => {
        const nonTeam = prev.filter((m) => m.roleType !== "TEAM");
        return [...nonTeam, ...newTeam];
      });
      setActionMessage({ type: "success", text: "Team display order updated." });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to reorder" });
    }
  };

  const filteredTeamMembers = teamMembers
    .filter((m) => {
      if (statusFilter === "ALL") return true;
      return m.status === statusFilter;
    })
    .filter((m) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(term) ||
        m.designation.toLowerCase().includes(term) ||
        (m.credentials && m.credentials.toLowerCase().includes(term))
      );
    });

  return (
    <div className="space-y-8 w-full pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DFD5] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-semibold tracking-wider text-[#B08D57]">
              Advisory Leadership &amp; Profiles
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight mt-0.5">
            Founder &amp; Team Management
          </h1>
          <p className="text-[13px] text-[#172B46]/70 mt-1">
            Manage the principal founder narrative and public advisory profiles displayed on the About Us page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/about"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E5DFD5] bg-[#FFFFFF] hover:bg-[#F7F5F0] text-[#172B46] text-[13px] font-semibold rounded-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>View Public About Page</span>
          </Link>

          <Link
            href="/admin/team/new"
            className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-4 py-2 rounded-sm text-[13px] font-semibold tracking-wide transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-[#C9A975]" />
            <span>Add Team Member</span>
          </Link>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-sm text-xs font-medium flex items-center gap-2.5 border ${
            actionMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 1. FOUNDER PROFILE SPOTLIGHT CARD */}
      <div className="bg-[#FFFFFF] border border-[#B08D57]/30 rounded-sm p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-tl-xl rounded-br-xl overflow-hidden border-2 border-[#B08D57]/50 bg-[#F7F5F0] shrink-0">
              {founder?.photoUrl && (
                <Image
                  src={founder.photoUrl}
                  alt={founder.name || "Founder"}
                  fill
                  sizes="64px"
                  className="object-cover object-top"
                />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#B08D57] bg-[#B08D57]/10 px-2 py-0.5 rounded-xs">
                  Principal Founder
                </span>
                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    founder?.status === "PUBLISHED"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {founder?.status || "PUBLISHED"}
                </span>
              </div>
              <h2 className="text-[26px] lg:text-[28px] font-semibold text-[#172B46] leading-snug">
                {founder?.name || "Mr. Vineet Gupta"}
              </h2>
              <p className="text-[13px] text-[#172B46]/70">
                {founder?.designation || "Founder & Principal Advisor"}
                {founder?.experienceYears && ` • ${founder.experienceYears}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Link
              href={founder ? `/admin/team/${founder.id}/edit` : "/admin/team/founder"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-[13px] font-semibold rounded-sm transition-colors shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5 text-[#C9A975]" />
              <span>Edit Founder Profile</span>
            </Link>
          </div>
        </div>

        {founder && (
          <div className="mt-4 pt-4 border-t border-[#E5DFD5] text-[14px] text-[#172B46]/80 line-clamp-2 leading-relaxed">
            {founder.bio}
          </div>
        )}
      </div>

      {/* 2. ADVISORY & LEADERSHIP TEAM SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#B08D57]" />
            <h2 className="text-[20px] lg:text-[22px] font-semibold text-[#172B46]">
              Advisory &amp; Executive Team Members ({teamMembers.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#172B46]/40 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm focus:outline-none focus:border-[#B08D57] w-48 sm:w-60"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm p-0.5 text-xs">
              {(["ALL", "PUBLISHED", "DRAFT"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-xs transition-colors cursor-pointer ${
                    statusFilter === s
                      ? "bg-[#172B46] text-[#FFFFFF]"
                      : "text-[#172B46]/70 hover:text-[#172B46]"
                  }`}
                >
                  {s === "ALL" ? "All" : s === "PUBLISHED" ? "Published" : "Draft"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Members List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[#172B46]/60 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm">
            Loading team profiles...
          </div>
        ) : filteredTeamMembers.length === 0 ? (
          /* Clean Empty State */
          <div className="p-12 sm:p-16 text-center bg-[#FFFFFF] border border-dashed border-[#E5DFD5] rounded-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F7F5F0] flex items-center justify-center mx-auto text-[#B08D57]">
              <Users className="w-6 h-6 stroke-[1.25]" />
            </div>
            <h3 className="text-base font-sans font-bold text-[#172B46]">
              {searchTerm || statusFilter !== "ALL"
                ? "No team profiles match your search criteria"
                : "No Team Members Added Yet"}
            </h3>
            <p className="text-xs text-[#172B46]/70 max-w-md mx-auto leading-relaxed">
              {searchTerm || statusFilter !== "ALL"
                ? "Try clearing the search input or selecting a different status filter."
                : "Currently, only the principal founder profile is active. Click 'Add Team Member' above to create executive profiles for your advisory team."}
            </p>
            {!searchTerm && statusFilter === "ALL" && (
              <div className="pt-2">
                <Link
                  href="/admin/team/new"
                  className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-[#C9A975]" />
                  <span>Add First Team Member</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Team Table */
          <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#172B46]">
                <thead className="bg-[#F7F5F0] border-b border-[#E5DFD5] text-[10px] uppercase font-bold tracking-wider text-[#172B46]/70">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Order</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Experience &amp; Credentials</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD5]">
                  {filteredTeamMembers.map((member, idx) => (
                    <tr key={member.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                      {/* Order Controls */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 hover:bg-[#E5DFD5] rounded-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5 text-[#172B46]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, "down")}
                            disabled={idx === filteredTeamMembers.length - 1}
                            className="p-1 hover:bg-[#E5DFD5] rounded-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5 text-[#172B46]" />
                          </button>
                        </div>
                      </td>

                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-[#F7F5F0] border border-[#E5DFD5] shrink-0">
                            {member.photoUrl && (
                              <Image
                                src={member.photoUrl}
                                alt={member.name}
                                fill
                                sizes="48px"
                                className="object-cover object-top"
                              />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/team/${member.id}/edit`}
                              className="font-sans font-bold text-sm text-[#172B46] hover:text-[#B08D57] transition-colors"
                            >
                              {member.name}
                            </Link>
                            <div className="text-[10px] text-[#172B46]/50 font-mono">
                              /{member.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4 font-medium text-[#172B46]">
                        {member.designation}
                      </td>

                      {/* Experience & Credentials */}
                      <td className="py-3 px-4 space-y-0.5">
                        {member.experienceYears && (
                          <div className="text-[11px] font-semibold text-[#172B46]/80 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#B08D57]" /> {member.experienceYears}
                          </div>
                        )}
                        {member.credentials ? (
                          <div className="text-[10px] text-[#B08D57] font-semibold flex items-center gap-1">
                            <Award className="w-3 h-3 text-[#B08D57]" /> {member.credentials}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#172B46]/40 italic">—</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(member)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                            member.status === "PUBLISHED"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                        >
                          {member.status === "PUBLISHED" ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Published
                            </>
                          ) : (
                            <>Draft (Hidden)</>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/team/${member.id}/edit`}
                            className="p-1.5 hover:bg-[#F7F5F0] text-[#172B46] hover:text-[#B08D57] rounded-sm transition-colors"
                            title="Edit Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteModalId(member.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-sm transition-colors cursor-pointer"
                            title="Delete Profile"
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
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 bg-[#172B46]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-sm max-w-md w-full p-6 shadow-2xl border border-[#E5DFD5] space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-sans font-bold text-[#172B46]">
                Delete Team Member Profile?
              </h3>
            </div>
            <p className="text-xs text-[#172B46]/70 leading-relaxed">
              Are you sure you want to delete this profile? This action cannot be undone and will remove the member card from the public website.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                disabled={deleting}
                className="px-4 py-2 border border-[#E5DFD5] text-xs font-semibold text-[#172B46] hover:bg-[#F7F5F0] rounded-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
