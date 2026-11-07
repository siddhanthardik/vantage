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
  ArrowUpDown,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import { ServiceItem } from "@/types/service";

export default function AdminServicesListPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/services");
      if (!res.ok) throw new Error("Failed to load services");
      const data = await res.json();
      setServices(data.services || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to fetch services" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggleStatus = async (service: ServiceItem) => {
    const newStatus = service.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, status: newStatus } : s))
      );
      setActionMessage({
        type: "success",
        text: `"${service.title}" is now ${newStatus === "PUBLISHED" ? "live & published" : "saved as draft"}.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to update status" });
    }
  };

  const handleDeleteService = async () => {
    if (!deleteModalId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/services/${deleteModalId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete service");

      setServices((prev) => prev.filter((s) => s.id !== deleteModalId));
      setActionMessage({ type: "success", text: "Service deleted successfully." });
      setDeleteModalId(null);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to delete service" });
    } finally {
      setDeleting(false);
    }
  };

  const filteredServices = services
    .filter((s) => {
      if (statusFilter === "ALL") return true;
      return s.status === statusFilter;
    })
    .filter((s) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.title.toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term) ||
        s.shortDesc.toLowerCase().includes(term)
      );
    });

  const serviceToDelete = services.find((s) => s.id === deleteModalId);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5]">
        <div>
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#B08D57]">
            Content Management
          </span>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight mt-0.5">
            Services Management
          </h1>
          <p className="text-[13px] text-[#172B46]/70 mt-1">
            Manage public advisory disciplines. Published services appear in the homepage cards, navigation dropdown, and at <code>/services/[slug]</code>.
          </p>
        </div>

        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 bg-[#172B46] text-[#FFFFFF] hover:bg-[#B08D57] px-4 py-2 rounded-sm text-[13px] font-semibold tracking-wide transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#C9A975]" /> Add New Service
        </Link>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-sm border-l-4 flex items-center justify-between gap-3 text-xs ${
            actionMessage.type === "success"
              ? "bg-green-50 border-green-600 text-green-900"
              : "bg-red-50 border-red-600 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold uppercase tracking-wider hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] p-4 rounded-sm border border-[#E5DFD5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#172B46]/50 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, slug, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#B08D57]" />
          <span className="text-xs text-[#172B46]/70 font-medium">Filter:</span>
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wider transition-colors ${
                statusFilter === status
                  ? "bg-[#172B46] text-[#FFFFFF]"
                  : "bg-[#F7F5F0] text-[#172B46]/70 hover:bg-[#E5DFD5]"
              }`}
            >
              {status === "ALL" ? "All Services" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#172B46]/60">
            Loading advisory services from database...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-[#172B46]/70">No services match your criteria.</p>
            <Link
              href="/admin/services/new"
              className="inline-flex items-center gap-1.5 text-xs text-[#B08D57] font-semibold hover:underline"
            >
              <Plus className="w-4 h-4" /> Create a new service
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F0] border-b border-[#E5DFD5] text-[#172B46] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-20">Preview</th>
                  <th className="py-3 px-4">Service Details</th>
                  <th className="py-3 px-4">Public URL</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]">
                {filteredServices.map((service, idx) => (
                  <tr
                    key={service.id}
                    className="hover:bg-[#F7F5F0]/60 transition-colors"
                  >
                    <td className="py-4 px-4 text-center font-mono font-bold text-[#172B46]/50">
                      {service.displayOrder || idx + 1}
                    </td>

                    <td className="py-4 px-4">
                      <div className="w-14 h-10 relative bg-[#F7F5F0] rounded-xs overflow-hidden border border-[#E5DFD5]">
                        <Image
                          src={
                            service.thumbnailImage ||
                            service.heroImage ||
                            "/images/services/investment-advisory.png"
                          }
                          alt={service.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    </td>

                    <td className="py-4 px-4 space-y-1">
                      <div className="font-semibold text-sm text-[#172B46]">
                        {service.title}
                      </div>
                      <p className="text-xs text-[#172B46]/70 line-clamp-1 font-light max-w-md">
                        {service.shortDesc}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <code className="text-[11px] text-[#B08D57] bg-[#F7F5F0] px-2 py-1 rounded font-mono">
                        /services/{service.slug}
                      </code>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(service)}
                        title="Click to toggle publish status"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          service.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                      >
                        {service.status === "PUBLISHED" ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-700" />
                            Published
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-700" />
                            Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <Link
                        href={`/services/${service.slug}`}
                        target="_blank"
                        title="Preview Public Page"
                        className="inline-block p-1.5 text-[#172B46]/70 hover:text-[#B08D57] hover:bg-[#F7F5F0] rounded-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <Link
                        href={`/admin/services/${service.id}/edit`}
                        title="Edit Service Details"
                        className="inline-block p-1.5 text-[#172B46] hover:text-[#B08D57] hover:bg-[#F7F5F0] rounded-sm transition-colors font-semibold"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setDeleteModalId(service.id)}
                        title="Delete Service"
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-sm transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal Before Deletion */}
      {deleteModalId && serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-[#172B46]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-sm max-w-md w-full p-6 shadow-2xl border border-[#E5DFD5] space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-sans font-bold text-[#172B46]">
                Confirm Service Deletion
              </h3>
            </div>

            <p className="text-xs text-[#172B46]/80 leading-relaxed font-light">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#172B46] font-semibold">
                "{serviceToDelete.title}"
              </strong>
              ?
              <br />
              <br />
              This will remove its dynamic page at <code>/services/{serviceToDelete.slug}</code>, its homepage card, and its link in the navigation dropdown. This action cannot be undone.
            </p>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5DFD5]">
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                disabled={deleting}
                className="px-4 py-2 border border-[#E5DFD5] text-xs font-semibold text-[#172B46] hover:bg-[#F7F5F0] rounded-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteService}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-xs font-bold uppercase tracking-wider text-white rounded-sm transition-colors shadow-xs"
              >
                {deleting ? "Deleting..." : "Delete Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
