"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Eye,
  FileText,
  Upload,
  ImageIcon,
  X,
  Mail,
  Award,
  Clock,
  User,
  Bold,
  Italic,
  List,
  Quote,
} from "lucide-react";
import { LinkedinIcon } from "@/components/ui/icons";
import { TeamMemberItem, TeamMemberFormData, MemberRole, MemberStatus } from "@/types/team";

interface TeamMemberEditorProps {
  initialMember?: TeamMemberItem;
  isEditing?: boolean;
  fixedRole?: MemberRole;
}

export default function TeamMemberEditor({
  initialMember,
  isEditing = false,
  fixedRole,
}: TeamMemberEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: initialMember?.name || "",
    slug: initialMember?.slug || "",
    roleType: fixedRole || initialMember?.roleType || "TEAM",
    designation: initialMember?.designation || "",
    bio: initialMember?.bio || "",
    photoUrl: initialMember?.photoUrl || "/images/about/founder-vineet-gupta.png",
    experienceYears: initialMember?.experienceYears || "",
    credentials: initialMember?.credentials || "",
    linkedInUrl: initialMember?.linkedInUrl || "",
    email: initialMember?.email || "",
    status: initialMember?.status || "PUBLISHED",
    displayOrder: initialMember?.displayOrder || 0,
  });

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-generate slug when name changes for new team members
  const handleNameChange = (val: string) => {
    setFormData((prev) => {
      const updated = { ...prev, name: val };
      if (!isEditing || !prev.slug) {
        updated.slug = val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      return updated;
    });
  };

  // Fetch media library items when modal opens
  const openMediaPicker = async () => {
    setShowMediaModal(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setMediaLibrary(data.media || []);
      }
    } catch (e) {
      console.warn("Failed to load media library:", e);
    }
  };

  // Upload image through existing media library endpoint
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "File size exceeds 5MB limit." });
      return;
    }

    setUploadingImage(true);
    setStatusMessage(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("altText", `${formData.name || "Team Member"} Portrait`);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image");

      setFormData((prev) => ({ ...prev, photoUrl: data.media.url }));
      setStatusMessage({
        type: "success",
        text: `Portrait uploaded successfully (${data.media.originalName}).`,
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to upload image" });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Insert helper markdown / rich text into bio
  const insertBioSnippet = (syntax: string) => {
    setFormData((prev) => {
      const current = prev.bio || "";
      let addition = "";
      if (syntax === "bold") addition = " **bold text** ";
      else if (syntax === "italic") addition = " *italic text* ";
      else if (syntax === "paragraph") addition = "\n\nNew paragraph content...";
      else if (syntax === "quote") addition = "\n\n> Important quote or philosophy\n\n";
      else if (syntax === "bullet") addition = "\n- Specialized area or achievement\n- Second qualification";
      return { ...prev, bio: current + addition };
    });
  };

  const handleSave = async (targetStatus?: MemberStatus) => {
    setStatusMessage(null);

    if (!formData.name.trim()) {
      setStatusMessage({ type: "error", text: "Full name is required." });
      return;
    }
    if (!formData.designation.trim()) {
      setStatusMessage({ type: "error", text: "Professional designation is required." });
      return;
    }

    setSaving(true);
    const payload = {
      ...formData,
      status: targetStatus || formData.status,
    };

    try {
      const url = isEditing && initialMember
        ? `/api/admin/team/${initialMember.id}`
        : "/api/admin/team";
      const method = isEditing && initialMember ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile.");

      setStatusMessage({
        type: "success",
        text: `Profile for "${payload.name}" saved successfully as ${payload.status}.`,
      });

      router.refresh();

      setTimeout(() => {
        router.push("/admin/team");
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save profile." });
      setSaving(false);
    }
  };

  const isFounder = formData.roleType === "FOUNDER";

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DFD5] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/team"
            className="p-2 border border-[#E5DFD5] hover:bg-[#FFFFFF] text-[#172B46] rounded-sm transition-colors"
            title="Return to Team Management"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B08D57]">
                {isFounder ? "Founder Profile CMS" : isEditing ? "Edit Team Profile" : "New Team Profile"}
              </span>
              <span
                className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  formData.status === "PUBLISHED"
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {formData.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-sans font-bold text-[#172B46]">
              {formData.name || (isFounder ? "Founder Profile" : "Untitled Team Member")}
            </h1>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-[#E5DFD5]/60 rounded-sm">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                activeTab === "edit"
                  ? "bg-[#FFFFFF] text-[#172B46] shadow-2xs"
                  : "text-[#172B46]/70 hover:text-[#172B46]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                activeTab === "preview"
                  ? "bg-[#FFFFFF] text-[#172B46] shadow-2xs"
                  : "text-[#172B46]/70 hover:text-[#172B46]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Card Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="px-4 py-2 border border-[#E5DFD5] bg-[#FFFFFF] hover:bg-[#F7F5F0] text-[#172B46] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors shadow-2xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#C9A975]" />
            <span>{saving ? "Saving..." : formData.status === "PUBLISHED" ? "Update Live" : "Publish Live"}</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
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

      {/* TAB 1: EDIT FORM */}
      {activeTab === "edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Columns (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Core Identification */}
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-[#172B46] border-b border-[#E5DFD5] pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-[#B08D57]" />
                <span>Executive Identity & Designation</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Vineet Gupta"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. vineet-gupta"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs font-mono text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                    Professional Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isFounder ? "Founder & Principal Advisor" : "Senior Wealth Manager"}
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                    Role Category *
                  </label>
                  <select
                    value={formData.roleType}
                    disabled={!!fixedRole}
                    onChange={(e) => setFormData({ ...formData, roleType: e.target.value as MemberRole })}
                    className="w-full px-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm cursor-pointer disabled:opacity-75"
                  >
                    <option value="TEAM">Advisory / Leadership Team Member</option>
                    <option value="FOUNDER">Founder Profile</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                    Advisory Experience
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-[#B08D57] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. 15+ Years"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                    />
                  </div>
                  <span className="text-[10px] text-[#172B46]/60 mt-0.5 block">
                    Displays on profile card (e.g. &quot;15+ Years Experience&quot;).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                    Qualifications &amp; Credentials
                  </label>
                  <div className="relative">
                    <Award className="w-3.5 h-3.5 text-[#B08D57] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. CFP, CFA, MBA"
                      value={formData.credentials}
                      onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                    />
                  </div>
                  <span className="text-[10px] text-[#172B46]/60 mt-0.5 block">
                    Only include genuine, verified certifications. Leave empty if none.
                  </span>
                </div>
              </div>
            </div>

            {/* Biography with Formatting Toolbar */}
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-2">
                <h2 className="text-sm font-sans font-bold text-[#172B46] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#B08D57]" />
                  <span>Professional Biography &amp; Narrative</span>
                </h2>
                <span className="text-[11px] text-[#172B46]/60">
                  Multiple paragraphs supported (blank lines separate paragraphs)
                </span>
              </div>

              {/* Toolbar helper buttons */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F7F5F0] rounded-xs border border-[#E5DFD5]">
                <button
                  type="button"
                  onClick={() => insertBioSnippet("bold")}
                  className="px-2 py-1 text-[11px] font-bold text-[#172B46] hover:bg-[#FFFFFF] rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Insert bold text"
                >
                  <Bold className="w-3 h-3 text-[#B08D57]" /> Bold
                </button>
                <button
                  type="button"
                  onClick={() => insertBioSnippet("italic")}
                  className="px-2 py-1 text-[11px] italic text-[#172B46] hover:bg-[#FFFFFF] rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Insert italic text"
                >
                  <Italic className="w-3 h-3 text-[#B08D57]" /> Italic
                </button>
                <button
                  type="button"
                  onClick={() => insertBioSnippet("quote")}
                  className="px-2 py-1 text-[11px] text-[#172B46] hover:bg-[#FFFFFF] rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Insert blockquote"
                >
                  <Quote className="w-3 h-3 text-[#B08D57]" /> Quote
                </button>
                <button
                  type="button"
                  onClick={() => insertBioSnippet("bullet")}
                  className="px-2 py-1 text-[11px] text-[#172B46] hover:bg-[#FFFFFF] rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Insert bullet points"
                >
                  <List className="w-3 h-3 text-[#B08D57]" /> Bullets
                </button>
                <button
                  type="button"
                  onClick={() => insertBioSnippet("paragraph")}
                  className="px-2 py-1 text-[11px] text-[#172B46] hover:bg-[#FFFFFF] rounded-xs transition-colors cursor-pointer"
                  title="Insert new paragraph"
                >
                  + New Paragraph
                </button>
              </div>

              <textarea
                rows={10}
                required
                placeholder="Enter executive biography, advisory philosophy, and background narrative..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] leading-relaxed focus:outline-none focus:border-[#B08D57] rounded-sm font-sans"
              />
            </div>

            {/* Contact & Social Links */}
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-[#172B46] border-b border-[#E5DFD5] pb-2">
                Direct Contact &amp; Professional Links
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                    LinkedIn Profile URL
                  </label>
                  <div className="relative">
                    <LinkedinIcon className="w-3.5 h-3.5 text-[#0A66C2] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedInUrl}
                      onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46] mb-1">
                    Professional Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#B08D57] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="adviser@vantagewealth.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Settings (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Portrait Photograph */}
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-2xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B46] border-b border-[#E5DFD5] pb-2 flex items-center justify-between">
                <span>Portrait Photograph</span>
                <ImageIcon className="w-3.5 h-3.5 text-[#B08D57]" />
              </h2>

              <div className="relative w-full aspect-4/5 rounded-tl-2xl rounded-br-2xl overflow-hidden border-2 border-[#B08D57]/40 bg-[#F7F5F0] shadow-sm flex items-center justify-center">
                {formData.photoUrl ? (
                  <Image
                    src={formData.photoUrl}
                    alt={formData.name || "Preview"}
                    fill
                    sizes="400px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="text-center p-6 text-[#172B46]/50">
                    <User className="w-12 h-12 mx-auto stroke-1 text-[#B08D57]/40 mb-2" />
                    <span className="text-xs block">No portrait selected</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="/images/about/portrait.png"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-xs text-[#172B46] font-mono focus:outline-none focus:border-[#B08D57] rounded-sm"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleDirectUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#172B46] hover:bg-[#243D60] text-[#FFFFFF] text-xs font-semibold rounded-sm transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#C9A975]" />
                    <span>{uploadingImage ? "Uploading..." : "Upload Photo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={openMediaPicker}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-[#E5DFD5] bg-[#FFFFFF] hover:bg-[#F7F5F0] text-[#172B46] text-xs font-semibold rounded-sm transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>Media Library</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Publication Status & Display Order */}
            <div className="bg-[#FFFFFF] p-6 rounded-sm border border-[#E5DFD5] shadow-2xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B46] border-b border-[#E5DFD5] pb-2">
                Display &amp; Visibility Controls
              </h2>

              <div>
                <label className="block text-xs font-semibold text-[#172B46] mb-1">
                  Publication Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                  className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] font-semibold focus:outline-none focus:border-[#B08D57] rounded-sm cursor-pointer"
                >
                  <option value="PUBLISHED">Published (Visible on About Us page)</option>
                  <option value="DRAFT">Draft (Hidden from Public)</option>
                  <option value="ARCHIVED">Archived (Unlisted)</option>
                </select>
              </div>

              {!isFounder && (
                <div>
                  <label className="block text-xs font-semibold text-[#172B46] mb-1">
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] font-mono focus:outline-none focus:border-[#B08D57] rounded-sm"
                  />
                  <span className="text-[10px] text-[#172B46]/60 mt-0.5 block">
                    Lower numbers appear first in the public team grid.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE CARD PREVIEW */}
      {activeTab === "preview" && (
        <div className="bg-[#F7F5F0] p-8 sm:p-12 rounded-sm border border-[#E5DFD5] space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#B08D57] block">
              Public Preview
            </span>
            <h2 className="text-[20px] font-semibold text-[#172B46]">
              {isFounder ? "Founder Presentation Section" : "Our Team Grid Card"}
            </h2>
            <p className="text-xs text-[#172B46]/70">
              This is exactly how this profile will render to visitors on the Vantage Wealth About Us page.
            </p>
          </div>

          {isFounder ? (
            /* Founder Layout Preview */
            <div className="max-w-4xl mx-auto bg-[#FFFFFF] p-8 rounded-sm border border-[#E5DFD5] shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-xs h-[340px] rounded-tl-3xl rounded-br-3xl overflow-hidden shadow-xl border-2 border-[#B08D57]/40 bg-[#FFFFFF]">
                    {formData.photoUrl && (
                      <Image
                        src={formData.photoUrl}
                        alt={formData.name || "Founder"}
                        fill
                        sizes="400px"
                        className="object-cover object-top"
                      />
                    )}
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#B08D57]">
                    Our Founder
                  </span>
                  <h3 className="text-[24px] sm:text-[26px] font-semibold text-[#172B46]">
                    {formData.name || "Mr. Vineet Gupta"}
                  </h3>
                  <div className="text-xs uppercase font-bold tracking-widest text-[#B08D57] pb-1">
                    {formData.designation || "Founder & Principal Advisor"}
                  </div>

                  <div className="flex flex-wrap gap-2 py-1">
                    {formData.experienceYears && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#B08D57]/10 text-[#B08D57] text-[10px] font-bold uppercase tracking-wider rounded-xs">
                        <Clock className="w-3 h-3" /> {formData.experienceYears}
                      </span>
                    )}
                    {formData.credentials && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#172B46]/5 text-[#172B46] text-[10px] font-semibold tracking-wider rounded-xs">
                        <Award className="w-3 h-3 text-[#B08D57]" /> {formData.credentials}
                      </span>
                    )}
                  </div>

                  <div className="border-l-2 border-[#B08D57] pl-4 py-1 space-y-2 text-xs sm:text-sm text-[#172B46]/85 font-light leading-relaxed whitespace-pre-wrap">
                    {formData.bio}
                  </div>

                  {formData.linkedInUrl && (
                    <div className="pt-2">
                      <a
                        href={formData.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#0A66C2] hover:underline font-semibold"
                      >
                        <LinkedinIcon className="w-4 h-4" />
                        <span>Connect on LinkedIn</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Team Member Grid Card Preview */
            <div className="max-w-md mx-auto bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm overflow-hidden shadow-md group hover:border-[#B08D57] transition-all">
              <div className="relative w-full h-72 bg-[#F7F5F0] overflow-hidden">
                {formData.photoUrl && (
                  <Image
                    src={formData.photoUrl}
                    alt={formData.name || "Team Member"}
                    fill
                    sizes="400px"
                    className="object-cover object-top group-hover:scale-102 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#172B46]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  {formData.linkedInUrl && (
                    <a
                      href={formData.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] text-[#172B46] text-xs font-bold rounded-xs shadow-sm hover:text-[#0A66C2]"
                    >
                      <LinkedinIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                      <span>LinkedIn Profile</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#B08D57]">
                    {formData.designation || "Advisory Specialist"}
                  </span>
                  {formData.experienceYears && (
                    <span className="text-[10px] font-semibold text-[#172B46]/60">
                      {formData.experienceYears}
                    </span>
                  )}
                </div>

                <h4 className="text-[18px] font-semibold text-[#172B46]">
                  {formData.name || "Member Name"}
                </h4>

                {formData.credentials && (
                  <div className="text-[11px] font-semibold text-[#B08D57]">
                    {formData.credentials}
                  </div>
                )}

                <p className="text-xs text-[#172B46]/75 font-light leading-relaxed line-clamp-4">
                  {formData.bio}
                </p>

                {formData.email && (
                  <div className="pt-2 border-t border-[#E5DFD5] flex items-center justify-between text-[11px] text-[#172B46]/60">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#B08D57]" /> {formData.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Media Selection Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-[#172B46]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-sm max-w-3xl w-full p-6 shadow-2xl border border-[#E5DFD5] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5]">
              <div>
                <h3 className="text-base font-semibold text-[#172B46]">
                  Select Photograph from Media Library
                </h3>
                <p className="text-[11px] text-[#172B46]/60">
                  Choose a previously uploaded portrait asset.
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

            <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 p-2">
              {/* Founder default preset */}
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, photoUrl: "/images/about/founder-vineet-gupta.png" }));
                  setShowMediaModal(false);
                }}
                className="group flex flex-col items-center p-2 rounded-sm border border-[#E5DFD5] hover:border-[#B08D57] transition-all text-left cursor-pointer"
              >
                <div className="w-full h-28 relative bg-[#F7F5F0] rounded-xs overflow-hidden mb-2">
                  <Image
                    src="/images/about/founder-vineet-gupta.png"
                    alt="Mr. Vineet Gupta"
                    fill
                    sizes="(max-width: 640px) 50vw, 160px"
                    className="object-cover object-top group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#172B46] line-clamp-1 w-full">
                  Mr. Vineet Gupta (Portrait)
                </span>
                <span className="text-[9px] text-[#B08D57] uppercase font-bold tracking-wider">
                  Preset
                </span>
              </button>

              {/* Dynamic library items */}
              {mediaLibrary.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, photoUrl: item.url }));
                    setShowMediaModal(false);
                  }}
                  className="group flex flex-col items-center p-2 rounded-sm border border-[#E5DFD5] hover:border-[#B08D57] transition-all text-left cursor-pointer"
                >
                  <div className="w-full h-28 relative bg-[#F7F5F0] rounded-xs overflow-hidden mb-2">
                    <Image
                      src={item.url}
                      alt={item.altText || item.filename}
                      fill
                      sizes="(max-width: 640px) 50vw, 160px"
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

            <div className="pt-3 border-t border-[#E5DFD5] flex justify-end">
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="px-4 py-2 border border-[#E5DFD5] text-xs font-semibold text-[#172B46] hover:bg-[#F7F5F0] rounded-sm cursor-pointer"
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
