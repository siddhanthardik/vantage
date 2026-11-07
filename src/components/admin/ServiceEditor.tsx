"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  CheckCircle,
  Eye,
  ArrowLeft,
  Trash2,
  Plus,
  X,
  AlertCircle,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { ServiceItem, ServiceFormData, ServiceBenefit, ServiceProcessStep } from "@/types/service";

interface ServiceEditorProps {
  initialData?: ServiceItem;
  isNew?: boolean;
}

const AVAILABLE_IMAGES = [
  { label: "Chart with Golden Coins", path: "/images/services/investment-advisory.png" },
  { label: "Family Silhouette at Sunset", path: "/images/services/wealth-protection.png" },
  { label: "Couple on Sunset Bench", path: "/images/services/retirement-bench.png" },
  { label: "Golden Chess King & Pieces", path: "/images/services/chess-king.png" },
  { label: "Desk with Pen & Financial Report", path: "/images/services/tax-planning.png" },
  { label: "Luxury Villa & Estate", path: "/images/services/loans.png" },
  { label: "Financial Books & Bull Statue (Hero)", path: "/images/services/investment-advisory-hero.png" },
  { label: "Modern Headquarters Facade", path: "/images/about/vantage-headquarters.png" },
  { label: "Advisor with Clients", path: "/images/home/hero-advisory.png" },
];

const AVAILABLE_ICONS = [
  "LineChart",
  "ShieldCheck",
  "Sprout",
  "Users",
  "Layers",
  "Key",
  "Briefcase",
  "TrendingUp",
  "Lock",
  "Landmark",
  "Compass",
  "Target",
];

export default function ServiceEditor({ initialData, isNew = false }: ServiceEditorProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"general" | "content" | "benefits" | "seo">("general");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imagePickerTarget, setImagePickerTarget] = useState<"thumbnailImage" | "heroImage" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ServiceFormData>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    shortDesc: initialData?.shortDesc || "",
    fullDesc: initialData?.fullDesc || "",
    heroHeading: initialData?.heroHeading || "",
    heroSubtext: initialData?.heroSubtext || "",
    heroImage: initialData?.heroImage || "/images/services/investment-advisory-hero.png",
    thumbnailImage: initialData?.thumbnailImage || "/images/services/investment-advisory.png",
    iconName: initialData?.iconName || "LineChart",
    benefits: initialData?.benefits || [
      { title: "Goal-Oriented", description: "Invest with a clear purpose and measurable outcomes.", icon: "Target" },
      { title: "Institutional Rigor", description: "Evidence-based asset allocation and risk management.", icon: "TrendingUp" },
    ],
    features: initialData?.features || [],
    processSteps: initialData?.processSteps || [
      { step: 1, title: "Understand", description: "Assess goals and current asset structure." },
      { step: 2, title: "Plan", description: "Design an institutional strategy blueprint." },
      { step: 3, title: "Invest", description: "Execute diversified portfolio implementation." },
      { step: 4, title: "Review", description: "Continuous rebalancing and performance monitoring." },
    ],
    ctaHeading: initialData?.ctaHeading || "Let's Build Your Wealth Plan",
    ctaButtonText: initialData?.ctaButtonText || "Book a Consultation",
    ctaButtonUrl: initialData?.ctaButtonUrl || "/consultation",
    seoTitle: initialData?.seoTitle || "",
    seoDescription: initialData?.seoDescription || "",
    ogImage: initialData?.ogImage || "",
    status: initialData?.status || "DRAFT",
    displayOrder: initialData?.displayOrder || 1,
  });

  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const next = { ...prev, title: val };
      if (isNew && !prev.slug) {
        next.slug = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      if (!prev.heroHeading) {
        next.heroHeading = val;
      }
      return next;
    });
  };

  const handleBenefitChange = (index: number, field: keyof ServiceBenefit, val: string) => {
    const list = [...(formData.benefits || [])];
    list[index] = { ...list[index], [field]: val };
    setFormData({ ...formData, benefits: list });
  };

  const addBenefit = () => {
    const list = [...(formData.benefits || [])];
    list.push({ title: "New Benefit", description: "Describe the specific client advantage.", icon: "CheckCircle" });
    setFormData({ ...formData, benefits: list });
  };

  const removeBenefit = (index: number) => {
    const list = [...(formData.benefits || [])];
    list.splice(index, 1);
    setFormData({ ...formData, benefits: list });
  };

  const handleProcessChange = (index: number, field: keyof ServiceProcessStep, val: any) => {
    const list = [...(formData.processSteps || [])];
    list[index] = { ...list[index], [field]: val };
    setFormData({ ...formData, processSteps: list });
  };

  const addProcessStep = () => {
    const list = [...(formData.processSteps || [])];
    const nextStep = list.length + 1;
    list.push({ step: nextStep, title: `Stage ${nextStep}`, description: "Action step detail." });
    setFormData({ ...formData, processSteps: list });
  };

  const removeProcessStep = (index: number) => {
    const list = [...(formData.processSteps || [])];
    list.splice(index, 1);
    setFormData({ ...formData, processSteps: list });
  };

  const handleSave = async (overrideStatus?: "DRAFT" | "PUBLISHED") => {
    setNotification(null);

    if (!formData.title.trim()) {
      setNotification({ type: "error", text: "Service Title is required." });
      setActiveTab("general");
      return;
    }
    if (!formData.slug.trim()) {
      setNotification({ type: "error", text: "URL Slug is required." });
      setActiveTab("general");
      return;
    }
    if (!formData.shortDesc.trim()) {
      setNotification({ type: "error", text: "Short Description is required for cards." });
      setActiveTab("general");
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      status: overrideStatus || formData.status,
    };

    try {
      const url = isNew ? "/api/admin/services" : `/api/admin/services/${initialData?.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save service.");
      }

      setNotification({
        type: "success",
        text: `Service "${payload.title}" saved successfully as ${payload.status}!`,
      });

      if (isNew && resData.service?.id) {
        setTimeout(() => {
          router.push(`/admin/services/${resData.service.id}/edit`);
        }, 1000);
      } else {
        setFormData((prev) => ({ ...prev, status: payload.status }));
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to save service." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services/${initialData.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete service");
      router.push("/admin/services");
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete" });
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-20">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5DFD5]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/services"
            className="p-2 border border-[#E5DFD5] bg-[#FFFFFF] hover:bg-[#F7F5F0] rounded-sm text-[#172B46] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#B08D57]">
              {isNew ? "Create New Service" : "Edit Advisory Discipline"}
            </span>
            <h1 className="text-2xl font-sans font-bold text-[#172B46] mt-0.5">
              {formData.title || "Untitled Service"}
            </h1>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isNew && (
            <Link
              href={`/services/${formData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 border border-[#172B46]/30 bg-[#FFFFFF] text-[#172B46] hover:border-[#B08D57] hover:text-[#B08D57] px-3.5 py-2 rounded-sm text-xs font-semibold tracking-wider transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview Page
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={loading}
            className="inline-flex items-center gap-1.5 border border-[#E5DFD5] bg-[#FFFFFF] hover:bg-[#F7F5F0] text-[#172B46] px-4 py-2 rounded-sm text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave("PUBLISHED")}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-5 py-2 rounded-sm text-xs font-bold tracking-wider uppercase transition-all shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-[#C9A975]" />
            {formData.status === "PUBLISHED" ? "Update Live Service" : "Publish to Site"}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-sm transition-colors"
              title="Delete Service"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-sm border-l-4 flex items-center justify-between text-xs ${
            notification.type === "success"
              ? "bg-green-50 border-green-600 text-green-900"
              : "bg-red-50 border-red-600 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold uppercase tracking-wider hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E5DFD5] bg-[#FFFFFF] rounded-t-sm px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wider border-b-2 transition-colors ${
            activeTab === "general"
              ? "border-[#B08D57] text-[#172B46]"
              : "border-transparent text-[#172B46]/60 hover:text-[#172B46]"
          }`}
        >
          1. General & Card Presentation
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wider border-b-2 transition-colors ${
            activeTab === "content"
              ? "border-[#B08D57] text-[#172B46]"
              : "border-transparent text-[#172B46]/60 hover:text-[#172B46]"
          }`}
        >
          2. Hero & Detailed Narrative
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("benefits")}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wider border-b-2 transition-colors ${
            activeTab === "benefits"
              ? "border-[#B08D57] text-[#172B46]"
              : "border-transparent text-[#172B46]/60 hover:text-[#172B46]"
          }`}
        >
          3. Value Pillars & 4-Stage Process
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wider border-b-2 transition-colors ${
            activeTab === "seo"
              ? "border-[#B08D57] text-[#172B46]"
              : "border-transparent text-[#172B46]/60 hover:text-[#172B46]"
          }`}
        >
          4. SEO & Social Metadata
        </button>
      </div>

      {/* Form Content Body */}
      <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-b-sm border border-t-0 border-[#E5DFD5] shadow-xs space-y-6">
        {/* TAB 1: GENERAL & CARDS */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Investment Advisory"
                  className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
                <p className="text-[11px] text-[#172B46]/60 mt-1 font-light">
                  Displayed on public cards, navigation dropdown and headers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                  URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-[#E5DFD5]/60 text-xs text-[#172B46]/70 border border-r-0 border-[#E5DFD5] rounded-l-sm font-mono">
                    /services/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                      })
                    }
                    placeholder="investment-advisory"
                    className="w-full px-3 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-r-sm font-mono"
                  />
                </div>
                <p className="text-[11px] text-[#172B46]/60 mt-1 font-light">
                  Unique path identifier used in dynamic route <code>/services/[slug]</code>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
                <p className="text-[11px] text-[#172B46]/60 mt-1 font-light">
                  Lower numbers appear first on the homepage and menu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                  Service Icon
                </label>
                <select
                  value={formData.iconName || "LineChart"}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                >
                  {AVAILABLE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#172B46]/60 mt-1 font-light">
                  Fine-line gold Lucide icon for cards and highlights.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                  Visibility Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "DRAFT" | "PUBLISHED" })
                  }
                  className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                >
                  <option value="DRAFT">Draft (Hidden from public visitors)</option>
                  <option value="PUBLISHED">Published (Active on site & menu)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                Card Short Description *
              </label>
              <textarea
                rows={2}
                required
                value={formData.shortDesc}
                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                placeholder="Build a diversified, goal-based investment portfolio."
                className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
              <p className="text-[11px] text-[#172B46]/60 mt-1 font-light">
                Concise 1-2 sentence description shown on the homepage Comprehensive Wealth Solutions card.
              </p>
            </div>

            {/* Thumbnail Image Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                Card Thumbnail Image
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-28 h-18 relative bg-[#F7F5F0] rounded-sm overflow-hidden border border-[#E5DFD5] shrink-0">
                  <Image
                    src={formData.thumbnailImage || "/images/services/investment-advisory.png"}
                    alt="Thumbnail preview"
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.thumbnailImage || ""}
                      onChange={(e) => setFormData({ ...formData, thumbnailImage: e.target.value })}
                      placeholder="/images/services/investment-advisory.png"
                      className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] font-mono focus:outline-none focus:border-[#B08D57] rounded-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePickerTarget("thumbnailImage")}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-xs font-semibold rounded-sm whitespace-nowrap transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Choose Image
                    </button>
                  </div>
                  <p className="text-[11px] text-[#172B46]/60 font-light">
                    Select an authentic curated photo from the media library or paste a custom URL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HERO & DETAILED CONTENT */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                  Page Hero Heading
                </label>
                <input
                  type="text"
                  value={formData.heroHeading || ""}
                  onChange={(e) => setFormData({ ...formData, heroHeading: e.target.value })}
                  placeholder="e.g. Investment Advisory"
                  className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                  Page Hero Subtext
                </label>
                <input
                  type="text"
                  value={formData.heroSubtext || ""}
                  onChange={(e) => setFormData({ ...formData, heroSubtext: e.target.value })}
                  placeholder="Build a diversified, goal-based investment portfolio aligned with your risk profile..."
                  className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
                />
              </div>
            </div>

            {/* Hero Image */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                Hero Photographic Asset
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-40 h-20 relative bg-[#F7F5F0] rounded-sm overflow-hidden border border-[#E5DFD5] shrink-0">
                  <Image
                    src={formData.heroImage || "/images/services/investment-advisory-hero.png"}
                    alt="Hero asset preview"
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.heroImage || ""}
                      onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] font-mono focus:outline-none focus:border-[#B08D57] rounded-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePickerTarget("heroImage")}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-xs font-semibold rounded-sm whitespace-nowrap transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Choose Image
                    </button>
                  </div>
                  <p className="text-[11px] text-[#172B46]/60 font-light">
                    Large photographic element displayed on the right side of the service page hero.
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Narrative */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                Detailed Service Narrative & Philosophy
              </label>
              <textarea
                rows={6}
                value={formData.fullDesc || ""}
                onChange={(e) => setFormData({ ...formData, fullDesc: e.target.value })}
                placeholder="Provide a comprehensive explanation of how your advisory team approaches this practice area, manages risk, and delivers institutional results..."
                className="w-full px-4 py-3 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm leading-relaxed"
              />
            </div>

            {/* CTA Section Config */}
            <div className="p-5 bg-[#F7F5F0] rounded-sm border border-[#E5DFD5] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B46]">
                Bottom Call-to-Action (CTA) Settings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#172B46] mb-1">
                    CTA Heading
                  </label>
                  <input
                    type="text"
                    value={formData.ctaHeading || ""}
                    onChange={(e) => setFormData({ ...formData, ctaHeading: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#172B46] mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.ctaButtonText || ""}
                    onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#172B46] mb-1">
                    Button Destination URL
                  </label>
                  <input
                    type="text"
                    value={formData.ctaButtonUrl || ""}
                    onChange={(e) => setFormData({ ...formData, ctaButtonUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VALUE PILLARS & 4-STAGE PROCESS */}
        {activeTab === "benefits" && (
          <div className="space-y-8">
            {/* Value Pillars List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#172B46]">
                    Core Value Pillars (Why Choose This Service)
                  </h3>
                  <p className="text-xs text-[#172B46]/60 font-light">
                    4 structured advantage cards displayed on the service page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addBenefit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#172B46] text-[#FFFFFF] hover:bg-[#B08D57] rounded-sm text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Pillar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.benefits?.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#F7F5F0] border border-[#E5DFD5] rounded-sm space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#B08D57] tracking-wider">
                        Pillar #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBenefit(idx)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove Pillar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={benefit.title}
                        onChange={(e) => handleBenefitChange(idx, "title", e.target.value)}
                        placeholder="Pillar Title"
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs font-semibold text-[#172B46] rounded-sm mb-2"
                      />
                      <textarea
                        rows={2}
                        value={benefit.description}
                        onChange={(e) => handleBenefitChange(idx, "description", e.target.value)}
                        placeholder="Pillar Description"
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4-Stage Process Steps */}
            <div className="space-y-4 pt-6 border-t border-[#E5DFD5]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#172B46]">
                    Our 4-Stage Advisory Process
                  </h3>
                  <p className="text-xs text-[#172B46]/60 font-light">
                    Sequential client-centric stages (e.g. 1. Understand, 2. Plan, 3. Invest, 4. Review).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addProcessStep}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#172B46] text-[#FFFFFF] hover:bg-[#B08D57] rounded-sm text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stage
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {formData.processSteps?.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#F7F5F0] border border-[#E5DFD5] rounded-sm space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#B08D57]">
                        Stage 0{step.step || idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeProcessStep(idx)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove Stage"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => handleProcessChange(idx, "title", e.target.value)}
                      placeholder="Stage Title"
                      className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs font-semibold text-[#172B46] rounded-sm"
                    />

                    <textarea
                      rows={3}
                      value={step.description}
                      onChange={(e) => handleProcessChange(idx, "description", e.target.value)}
                      placeholder="Stage Description"
                      className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E5DFD5] text-xs text-[#172B46] rounded-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SEO & SOCIAL METADATA */}
        {activeTab === "seo" && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={formData.seoTitle || ""}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="Investment Advisory | Vantage Wealth"
                className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
              <p className="text-[11px] text-[#172B46]/60 mt-1 font-light">
                Recommended length: 50-60 characters for optimal Google search appearance.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                SEO Meta Description
              </label>
              <textarea
                rows={3}
                value={formData.seoDescription || ""}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="Institutional investment management, custom asset allocation, and disciplined risk-adjusted portfolio construction for discerning clients."
                className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
              <p className="text-[11px] text-[#172B46]/60 mt-1 font-light">
                Recommended length: 140-160 characters for search engine snippets.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172B46] mb-1.5">
                Open Graph / Social Sharing Image
              </label>
              <input
                type="text"
                value={formData.ogImage || ""}
                onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                placeholder="/images/services/investment-advisory-hero.png"
                className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-xs text-[#172B46] font-mono focus:outline-none focus:border-[#B08D57] rounded-sm"
              />
              <p className="text-[11px] text-[#172B46]/60 mt-1 font-light">
                Image shown when this service URL is shared on LinkedIn, WhatsApp or Twitter.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-[#FFFFFF] border-t border-[#E5DFD5] p-4 px-6 flex items-center justify-between shadow-lg z-40">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              formData.status === "PUBLISHED" ? "bg-green-600" : "bg-amber-500"
            }`}
          />
          <span className="text-xs font-semibold text-[#172B46]">
            Status: {formData.status === "PUBLISHED" ? "Live & Published" : "Draft (Unlisted)"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={loading}
            className="px-4 py-2 border border-[#E5DFD5] bg-[#FFFFFF] hover:bg-[#F7F5F0] text-[#172B46] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave("PUBLISHED")}
            disabled={loading}
            className="px-6 py-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-xs font-bold uppercase tracking-widest rounded-sm transition-all shadow-sm"
          >
            {formData.status === "PUBLISHED" ? "Update Live Service" : "Publish Service"}
          </button>
        </div>
      </div>

      {/* Image Selection Modal */}
      {imagePickerTarget && (
        <div className="fixed inset-0 z-50 bg-[#172B46]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-sm max-w-2xl w-full p-6 shadow-2xl border border-[#E5DFD5] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5]">
              <h3 className="text-base font-sans font-bold text-[#172B46]">
                Select Image from Vantage Media Library
              </h3>
              <button
                type="button"
                onClick={() => setImagePickerTarget(null)}
                className="p-1 hover:bg-[#F7F5F0] rounded-sm"
              >
                <X className="w-5 h-5 text-[#172B46]" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
              {AVAILABLE_IMAGES.map((img) => (
                <button
                  key={img.path}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, [imagePickerTarget]: img.path });
                    setImagePickerTarget(null);
                  }}
                  className="group flex flex-col items-center p-2 rounded-sm border border-[#E5DFD5] hover:border-[#B08D57] transition-all text-left"
                >
                  <div className="w-full h-24 relative bg-[#F7F5F0] rounded-xs overflow-hidden mb-2">
                    <Image
                      src={img.path}
                      alt={img.label}
                      fill
                      sizes="(max-width: 640px) 50vw, 160px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#172B46] line-clamp-1 w-full">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E5DFD5] flex justify-end">
              <button
                type="button"
                onClick={() => setImagePickerTarget(null)}
                className="px-4 py-2 border border-[#E5DFD5] text-xs font-semibold text-[#172B46] hover:bg-[#F7F5F0] rounded-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-[#172B46]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-sm max-w-md w-full p-6 shadow-2xl border border-[#E5DFD5] space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-sans font-bold text-[#172B46]">
                Delete Service Permanently?
              </h3>
            </div>

            <p className="text-xs text-[#172B46]/80 leading-relaxed font-light">
              Are you sure you want to delete <strong>"{formData.title}"</strong>? This will remove its public page, card displays, and navigation entries.
            </p>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5DFD5]">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={loading}
                className="px-4 py-2 border border-[#E5DFD5] text-xs font-semibold text-[#172B46] hover:bg-[#F7F5F0] rounded-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded-sm shadow-xs"
              >
                {loading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
