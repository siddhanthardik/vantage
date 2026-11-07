"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Save,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ImageIcon,
  Upload,
  X,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { BusinessSettingsData } from "@/types/service";

const POSITION_OPTIONS = [
  { value: "object-center", label: "Center (Balanced)" },
  { value: "object-top", label: "Top (Focus on Faces)" },
  { value: "object-bottom", label: "Bottom" },
  { value: "object-left", label: "Left" },
  { value: "object-right", label: "Right (Subject on Right)" },
];

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<BusinessSettingsData>({
    companyName: "",
    tagline: "",
    phone: "",
    email: "",
    address: "",
    consultationUrl: "",
    copyrightNotice: "",
    heroHeading: "A Clearer Perspective on Your Wealth.",
    heroSubheading: "Integrated financial solutions to help you grow, protect and preserve your wealth.",
    heroNarrative: "",
    heroImageUrl: "/images/home/hero-advisory.png",
    heroImageAlt: "Vantage Wealth Senior Advisory Counsel",
    heroImagePosition: "object-center",
    heroCtaText: "Book a Consultation",
    heroCtaUrl: "/consultation",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Media Library Modal state
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("Failed to load settings from PostgreSQL");
        const data = await res.json();
        if (data.settings) {
          setFormData({
            companyName: data.settings.companyName || "",
            tagline: data.settings.tagline || "",
            phone: data.settings.phone || "",
            email: data.settings.email || "",
            address: data.settings.address || "",
            consultationUrl: data.settings.consultationUrl || "",
            copyrightNotice: data.settings.copyrightNotice || "",
            heroHeading: data.settings.heroHeading || "A Clearer Perspective on Your Wealth.",
            heroSubheading:
              data.settings.heroSubheading ||
              "Integrated financial solutions to help you grow, protect and preserve your wealth.",
            heroNarrative: data.settings.heroNarrative ?? "",
            heroImageUrl: data.settings.heroImageUrl || "/images/home/hero-advisory.png",
            heroImageAlt: data.settings.heroImageAlt || "Vantage Wealth Senior Advisory Counsel",
            heroImagePosition: data.settings.heroImagePosition || "object-center",
            heroCtaText: data.settings.heroCtaText || "Book a Consultation",
            heroCtaUrl: data.settings.heroCtaUrl || "/consultation",
          });
        }
      } catch (e: any) {
        setStatusMessage({ type: "error", text: e.message || "Failed to load settings" });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const openMediaLibrary = async () => {
    setShowMediaModal(true);
    setLoadingMedia(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data.media || []);
      }
    } catch (err) {
      console.warn("Failed to load media assets:", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("altText", formData.heroImageAlt || "Homepage Hero Photograph");

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();

      if (data.media?.url) {
        setFormData((prev) => ({
          ...prev,
          heroImageUrl: data.media.url,
          heroImageAlt: data.media.altText || prev.heroImageAlt,
        }));
        setShowMediaModal(false);
      }
    } catch (err: any) {
      alert(err.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings in PostgreSQL");

      setStatusMessage({
        type: "success",
        text: "Business settings and Homepage Hero configuration saved authoritatively to PostgreSQL.",
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      setStatusMessage({ type: "error", text: e.message || "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#172B46]/60 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm">
        Loading business settings from PostgreSQL...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-4xl pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DFD5] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-semibold tracking-wider text-[#B08D57]">
              Configuration &amp; Brand
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight mt-0.5">
            Business Settings &amp; Homepage Hero CMS
          </h1>
          <p className="text-[13px] text-[#172B46]/70 mt-1">
            Global corporate identity, contact parameters and Homepage Hero content stored in PostgreSQL.
          </p>
        </div>

        <button
          type="submit"
          form="settingsForm"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-5 py-2.5 rounded-sm text-[13px] font-semibold tracking-wide transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-[#C9A975]" />
          <span>{saving ? "Saving to Database..." : "Save Settings"}</span>
        </button>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-sm text-xs font-medium flex items-center gap-2.5 border ${
            statusMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <form id="settingsForm" onSubmit={handleSave} className="space-y-6">
        {/* 1. HOMEPAGE HERO CMS SECTION */}
        <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-sm border border-[#E5DFD5] shadow-2xs space-y-6">
          <div className="border-b border-[#E5DFD5] pb-3 flex items-center justify-between">
            <h2 className="text-sm font-sans font-bold text-[#172B46] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B08D57]" />
              <span>Homepage Hero Section (CMS)</span>
            </h2>
            <span className="text-[11px] font-semibold text-[#B08D57] uppercase tracking-wider">
              PostgreSQL Managed
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                Hero Main Heading *
              </label>
              <input
                type="text"
                required
                value={formData.heroHeading}
                onChange={(e) => setFormData({ ...formData, heroHeading: e.target.value })}
                placeholder="A Clearer Perspective on Your Wealth."
                className="w-full px-3.5 py-2.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs font-medium text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                Hero Subheading / Tagline
              </label>
              <input
                type="text"
                value={formData.heroSubheading}
                onChange={(e) => setFormData({ ...formData, heroSubheading: e.target.value })}
                placeholder="Integrated financial solutions to help you grow, protect and preserve your wealth."
                className="w-full px-3.5 py-2.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                Hero Narrative Paragraphs (Separate multiple paragraphs with blank lines)
              </label>
              <textarea
                rows={4}
                value={formData.heroNarrative}
                onChange={(e) => setFormData({ ...formData, heroNarrative: e.target.value })}
                placeholder="At Vantage Wealth, we bring together..."
                className="w-full px-3.5 py-2.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm font-sans"
              />
            </div>

            {/* Hero Image Controls & Live Preview */}
            <div className="border-t border-[#E5DFD5] pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#172B46]">
                  Hero Photograph &amp; Focal Point
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openMediaLibrary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] border border-[#B08D57]/60 hover:bg-[#B08D57] hover:text-[#FFFFFF] text-[11px] font-semibold text-[#172B46] rounded-xs transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#B08D57] group-hover:text-[#FFFFFF]" />
                    <span>Choose from Media Library</span>
                  </button>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#172B46] hover:bg-[#B08D57] text-[11px] font-semibold text-[#FFFFFF] rounded-xs transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#C9A975]" />
                    <span>{uploadingImage ? "Uploading..." : "Upload New Photo"}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                {/* Image URL & Alt & Position inputs */}
                <div className="sm:col-span-7 space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#172B46]/70 mb-1">
                      Image Path or URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.heroImageUrl}
                      onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                      placeholder="/images/home/hero-advisory.png"
                      className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs font-mono text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#172B46]/70 mb-1">
                        Focal Point Position
                      </label>
                      <select
                        value={formData.heroImagePosition}
                        onChange={(e) => setFormData({ ...formData, heroImagePosition: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                      >
                        {POSITION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#172B46]/70 mb-1">
                        Image Alt Description
                      </label>
                      <input
                        type="text"
                        value={formData.heroImageAlt}
                        onChange={(e) => setFormData({ ...formData, heroImageAlt: e.target.value })}
                        placeholder="Vantage Wealth Senior Advisory Counsel"
                        className="w-full px-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Preset quick button */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-[#172B46]/60">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          heroImageUrl: "/images/home/hero-advisory.png",
                          heroImagePosition: "object-center",
                        }))
                      }
                      className="text-[11px] px-2 py-0.5 bg-[#F7F5F0] border border-[#E5DFD5] hover:border-[#B08D57] rounded-xs cursor-pointer text-[#172B46]"
                    >
                      Default Advisory Counsel
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          heroImageUrl: "/images/about/vantage-headquarters.png",
                          heroImagePosition: "object-center",
                        }))
                      }
                      className="text-[11px] px-2 py-0.5 bg-[#F7F5F0] border border-[#E5DFD5] hover:border-[#B08D57] rounded-xs cursor-pointer text-[#172B46]"
                    >
                      Office Headquarters
                    </button>
                  </div>
                </div>

                {/* Live Focal Point Preview Box */}
                <div className="sm:col-span-5 space-y-1.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#172B46]/70">
                    Live Hero Image Preview ({formData.heroImagePosition})
                  </span>
                  <div className="relative w-full h-44 rounded-sm overflow-hidden border-2 border-[#E5DFD5] bg-[#F7F5F0] shadow-inner">
                    {formData.heroImageUrl ? (
                      <Image
                        src={formData.heroImageUrl}
                        alt={formData.heroImageAlt || "Preview"}
                        fill
                        sizes="320px"
                        className={`object-cover ${formData.heroImagePosition || "object-center"}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#172B46]/40">
                        No image specified
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F7F5F0]/60 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Call to Action Configuration */}
            <div className="border-t border-[#E5DFD5] pt-5">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-3">
                Hero Primary Call-To-Action (CTA) Button
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#172B46]/70 mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={formData.heroCtaText}
                    onChange={(e) => setFormData({ ...formData, heroCtaText: e.target.value })}
                    placeholder="Book a Consultation"
                    className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#172B46]/70 mb-1">
                    Button Target URL
                  </label>
                  <input
                    type="text"
                    value={formData.heroCtaUrl}
                    onChange={(e) => setFormData({ ...formData, heroCtaUrl: e.target.value })}
                    placeholder="/consultation"
                    className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs font-mono text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CORPORATE IDENTITY */}
        <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-sm border border-[#E5DFD5] shadow-2xs space-y-4">
          <h2 className="text-sm font-sans font-bold text-[#172B46] border-b border-[#E5DFD5] pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#B08D57]" />
            <span>Corporate Identity &amp; Metadata</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                Global Tagline / Slogan
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
            </div>
          </div>
        </div>

        {/* 3. CONTACT & ADVISORY CHANNELS */}
        <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-sm border border-[#E5DFD5] shadow-2xs space-y-4">
          <h2 className="text-sm font-sans font-bold text-[#172B46] border-b border-[#E5DFD5] pb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#B08D57]" />
            <span>Contact &amp; Advisory Channels</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                Telephone Hotline
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                Primary Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
              Registered Physical Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
            />
          </div>
        </div>

        {/* 4. LEGAL & GLOBAL ROUTING */}
        <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-sm border border-[#E5DFD5] shadow-2xs space-y-4">
          <h2 className="text-sm font-sans font-bold text-[#172B46] border-b border-[#E5DFD5] pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#B08D57]" />
            <span>Legal &amp; Routing</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                Default Consultation Route
              </label>
              <input
                type="text"
                value={formData.consultationUrl}
                onChange={(e) => setFormData({ ...formData, consultationUrl: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs font-mono text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                Copyright Notice
              </label>
              <input
                type="text"
                value={formData.copyrightNotice}
                onChange={(e) => setFormData({ ...formData, copyrightNotice: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
            </div>
          </div>
        </div>
      </form>

      {/* MEDIA LIBRARY SELECTION MODAL */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-[#172B46]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-sm max-w-3xl w-full p-6 shadow-2xl border border-[#E5DFD5] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5]">
              <div>
                <h3 className="text-base font-semibold text-[#172B46]">
                  Select Homepage Hero Photograph from Media Library
                </h3>
                <p className="text-[11px] text-[#172B46]/60">
                  Select a curated asset or upload a new high-resolution photo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="p-1 hover:bg-[#F7F5F0] rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5 text-[#172B46]" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {loadingMedia ? (
                <div className="py-12 text-center text-xs text-[#172B46]/60">
                  Loading media library assets...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Curated Presets */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        heroImageUrl: "/images/home/hero-advisory.png",
                        heroImageAlt: "Vantage Wealth Senior Advisory Counsel",
                      }));
                      setShowMediaModal(false);
                    }}
                    className="group flex flex-col items-center p-2 rounded-sm border border-[#E5DFD5] hover:border-[#B08D57] transition-all text-left cursor-pointer"
                  >
                    <div className="w-full h-24 relative bg-[#F7F5F0] rounded-xs overflow-hidden mb-2">
                      <Image
                        src="/images/home/hero-advisory.png"
                        alt="Hero Advisory Preset"
                        fill
                        sizes="160px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#172B46] line-clamp-1 w-full">
                      Hero Advisory Counsel
                    </span>
                    <span className="text-[9px] text-[#B08D57] uppercase font-bold tracking-wider">
                      Preset
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        heroImageUrl: "/images/about/vantage-headquarters.png",
                        heroImageAlt: "Vantage Wealth Architectural Office",
                      }));
                      setShowMediaModal(false);
                    }}
                    className="group flex flex-col items-center p-2 rounded-sm border border-[#E5DFD5] hover:border-[#B08D57] transition-all text-left cursor-pointer"
                  >
                    <div className="w-full h-24 relative bg-[#F7F5F0] rounded-xs overflow-hidden mb-2">
                      <Image
                        src="/images/about/vantage-headquarters.png"
                        alt="Headquarters Preset"
                        fill
                        sizes="160px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#172B46] line-clamp-1 w-full">
                      Office Headquarters
                    </span>
                    <span className="text-[9px] text-[#B08D57] uppercase font-bold tracking-wider">
                      Preset
                    </span>
                  </button>

                  {/* Uploaded Media Items */}
                  {mediaItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          heroImageUrl: item.url,
                          heroImageAlt: item.altText || item.originalName,
                        }));
                        setShowMediaModal(false);
                      }}
                      className="group flex flex-col items-center p-2 rounded-sm border border-[#E5DFD5] hover:border-[#B08D57] transition-all text-left cursor-pointer"
                    >
                      <div className="w-full h-24 relative bg-[#F7F5F0] rounded-xs overflow-hidden mb-2">
                        <Image
                          src={item.url}
                          alt={item.altText || item.filename}
                          fill
                          sizes="160px"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#172B46] line-clamp-1 w-full">
                        {item.altText || item.originalName}
                      </span>
                      <span className="text-[9px] text-[#172B46]/50">
                        {item.mimeType}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E5DFD5] flex items-center justify-between">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#172B46] text-[#FFFFFF] text-xs font-semibold rounded-xs hover:bg-[#B08D57] transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#C9A975]" />
                <span>Upload New File to Media Library</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="px-4 py-1.5 border border-[#E5DFD5] text-xs font-semibold text-[#172B46] hover:bg-[#F7F5F0] rounded-sm cursor-pointer"
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
