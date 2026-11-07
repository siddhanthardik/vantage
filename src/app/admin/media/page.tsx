"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Cloud,
  HardDrive,
  Search,
  ExternalLink,
} from "lucide-react";
import { MediaItemRecord } from "@/server/repositories/mediaRepository";

export default function AdminMediaLibraryPage() {
  const [mediaList, setMediaList] = useState<MediaItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [altText, setAltText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/media");
      if (!res.ok) throw new Error("Failed to load media assets");
      const data = await res.json();
      setMediaList(data.media || []);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to load media assets" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (file: File) => {
    // Client-side quick check
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "File size exceeds 5MB limit." });
      return;
    }

    setUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (altText.trim()) {
        formData.append("altText", altText.trim());
      }

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setMediaList((prev) => [data.media, ...prev]);
      setStatusMessage({
        type: "success",
        text: `"${file.name}" uploaded successfully (${data.media.storageType} storage).`,
      });
      setAltText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to upload file" });
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (item: MediaItemRecord) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete media asset "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete media asset");

      setMediaList((prev) => prev.filter((m) => m.id !== id));
      setStatusMessage({ type: "success", text: `Deleted "${name}".` });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to delete" });
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.filename.toLowerCase().includes(term) ||
      m.originalName.toLowerCase().includes(term) ||
      (m.altText && m.altText.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5]">
        <div>
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#B08D57]">
            Asset Storage &amp; CDN
          </span>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight mt-0.5">
            Media Library
          </h1>
          <p className="text-[13px] text-[#172B46]/70 mt-1">
            Upload and organize photographic assets, service thumbnails, and editorial illustrations.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-sm border-l-4 flex items-center gap-3 text-xs ${
            statusMessage.type === "success"
              ? "bg-green-50 border-green-600 text-green-900"
              : "bg-red-50 border-red-600 text-red-900"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Upload Dropzone Panel */}
      <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-xs space-y-4">
        <h3 className="text-sm font-sans font-bold text-[#172B46]">
          Upload Media Asset
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E5DFD5] hover:border-[#B08D57] rounded-sm p-6 text-center cursor-pointer transition-colors bg-[#F7F5F0]/50"
            >
              <Upload className="w-6 h-6 text-[#B08D57] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#172B46]">
                Click or drag image file here to upload
              </p>
              <p className="text-[11px] text-[#172B46]/60 mt-1">
                Accepted: JPG, PNG, WebP, SVG, GIF (Maximum 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
            </div>
          </div>

          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#172B46] mb-1">
                Image Alt Text / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Architectural Headquarters Facade"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm focus:outline-none focus:border-[#B08D57]"
              />
            </div>

            <div className="p-3 bg-[#F7F5F0] rounded-sm border border-[#E5DFD5] text-[11px] text-[#172B46]/70 leading-relaxed">
              <strong>Storage Integration:</strong> Uploads are routed to Cloudflare R2 bucket when configured in environment variables, or stored securely in local public uploads.
            </div>
          </div>
        </div>
      </div>

      {/* Search and Media Gallery */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#172B46]/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm shadow-xs"
            />
          </div>

          <span className="text-xs text-[#172B46]/60 font-medium">
            Showing {filteredMedia.length} of {mediaList.length} assets
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#172B46]/60 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm">
            Loading media assets...
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#172B46]/60 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm font-light">
            No media assets found. Upload an image above to populate the library.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm overflow-hidden shadow-xs hover:border-[#B08D57] transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative w-full h-40 bg-[#F7F5F0] overflow-hidden">
                    <Image
                      src={item.url}
                      alt={item.altText || item.filename}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-xs ${
                          item.storageType === "R2"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-[#172B46] text-[#FFFFFF]"
                        }`}
                      >
                        {item.storageType === "R2" ? (
                          <Cloud className="w-2.5 h-2.5" />
                        ) : (
                          <HardDrive className="w-2.5 h-2.5" />
                        )}
                        {item.storageType}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3.5 space-y-1">
                    <div className="font-mono text-xs font-semibold text-[#172B46] truncate" title={item.filename}>
                      {item.filename}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#172B46]/60">
                      <span>{(item.sizeBytes / 1024).toFixed(0)} KB</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    {item.altText && (
                      <p className="text-[10px] text-[#172B46]/70 line-clamp-1 italic">
                        {item.altText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-[#F7F5F0] border-t border-[#E5DFD5] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#172B46] hover:text-[#B08D57] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>{copiedId === item.id ? "Copied!" : "Copy URL"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open full image"
                      className="text-[#172B46]/60 hover:text-[#172B46]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.filename)}
                      title="Delete asset"
                      className="text-[#172B46]/60 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
