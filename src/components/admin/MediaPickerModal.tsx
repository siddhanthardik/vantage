"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Check, Image as ImageIcon, Search, Loader2 } from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string | null;
  createdAt: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: { url: string; altText: string; caption?: string }) => void;
  title?: string;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = "Select Image from Media Library",
}: MediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [customAltText, setCustomAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedMedia(null);
      setCustomAltText("");
      setCaption("");
      setErrorMsg(null);
    }
  }, [isOpen]);

  const fetchMedia = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (res.ok && data.media) {
        setMediaList(data.media);
      } else {
        throw new Error(data.error || "Failed to load media assets");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load media assets");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    if (customAltText.trim()) {
      formData.append("altText", customAltText.trim());
    }

    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      await fetchMedia();
      setSelectedMedia(data.media);
      setCustomAltText(data.media.altText || data.media.originalName || "");
      setActiveTab("library");
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirmSelect = () => {
    if (!selectedMedia) return;
    onSelect({
      url: selectedMedia.url,
      altText: customAltText.trim() || selectedMedia.altText || selectedMedia.originalName || "Article illustration",
      caption: caption.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  const filteredMedia = mediaList.filter((m) =>
    (m.originalName || m.filename || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#172B46]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DFD5] bg-[#F7F5F0]/60">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#B08D57]" />
            <h3 className="text-base font-semibold text-[#172B46]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-[#172B46]/60 hover:text-[#172B46] hover:bg-[#E5DFD5]/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-[#E5DFD5] px-6 bg-[#FFFFFF]">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
              activeTab === "library"
                ? "border-[#B08D57] text-[#172B46]"
                : "border-transparent text-[#172B46]/60 hover:text-[#172B46]"
            }`}
          >
            Library ({mediaList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
              activeTab === "upload"
                ? "border-[#B08D57] text-[#172B46]"
                : "border-transparent text-[#172B46]/60 hover:text-[#172B46]"
            }`}
          >
            Upload New Image
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-600 text-xs text-red-900 rounded-xs">
            {errorMsg}
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "library" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-[#172B46]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search assets by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm focus:outline-none focus:border-[#B08D57]"
                />
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-[#172B46]/60 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#B08D57]" />
                  <span>Loading media library...</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#172B46]/60 bg-[#F7F5F0]/30 rounded-sm border border-dashed border-[#E5DFD5]">
                  No images found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-1">
                  {filteredMedia.map((m) => {
                    const isSelected = selectedMedia?.id === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMedia(m);
                          setCustomAltText(m.altText || m.originalName || "");
                        }}
                        className={`group relative aspect-square rounded-sm overflow-hidden border cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#B08D57] ring-2 ring-[#B08D57]/40 shadow-sm"
                            : "border-[#E5DFD5] hover:border-[#B08D57]/60"
                        }`}
                      >
                        <Image
                          src={m.url}
                          alt={m.altText || m.originalName || "Thumbnail"}
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-[#B08D57] text-[#FFFFFF] rounded-full p-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-[#172B46]/80 p-1 text-[10px] text-[#FFFFFF] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {m.originalName || m.filename}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedMedia && (
                <div className="pt-4 border-t border-[#E5DFD5] space-y-3 bg-[#F7F5F0]/40 p-4 rounded-sm">
                  <div className="text-xs font-semibold text-[#172B46]">Selected: {selectedMedia.originalName || selectedMedia.filename}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#172B46] uppercase tracking-wider mb-1">
                        Alt Text (Accessibility & SEO)
                      </label>
                      <input
                        type="text"
                        value={customAltText}
                        onChange={(e) => setCustomAltText(e.target.value)}
                        placeholder="Describe the image for screen readers..."
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm focus:outline-none focus:border-[#B08D57]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#172B46] uppercase tracking-wider mb-1">
                        Caption (Optional)
                      </label>
                      <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Visible caption below image..."
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm focus:outline-none focus:border-[#B08D57]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-8">
              <div className="max-w-md mx-auto text-center border-2 border-dashed border-[#E5DFD5] hover:border-[#B08D57] rounded-sm p-8 transition-colors bg-[#F7F5F0]/40">
                <Upload className="w-10 h-10 text-[#B08D57] mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-[#172B46] mb-1">Upload New Article Asset</h4>
                <p className="text-xs text-[#172B46]/60 mb-4 font-light">
                  PNG, JPG, WebP, or SVG up to 10MB. Automatically optimized and persisted to media library.
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors">
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Choose File to Upload</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-[#E5DFD5] bg-[#F7F5F0]/60">
          <div className="text-xs text-[#172B46]/60">
            {selectedMedia ? `Ready: ${selectedMedia.filename}` : "Select an image"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5DFD5] bg-[#FFFFFF] text-[#172B46] text-xs font-semibold rounded-sm hover:bg-[#F7F5F0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedMedia}
              onClick={handleConfirmSelect}
              className="px-5 py-2 bg-[#172B46] hover:bg-[#B08D57] disabled:opacity-40 disabled:cursor-not-allowed text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
            >
              Insert Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
