"use client";

import { useState } from "react";
import { Calendar, Clock, Video, Building2, User, Mail, Phone, MessageSquare, Send, CheckCircle2, AlertCircle, Shield } from "lucide-react";

interface ServiceOption {
  slug: string;
  title: string;
}

interface ConsultationFormProps {
  services: ServiceOption[];
  defaultServiceSlug?: string;
}

export default function ConsultationForm({ services, defaultServiceSlug }: ConsultationFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    serviceSlug: defaultServiceSlug || (services[0]?.slug ?? "investment-solutions"),
    preferredMode: "ONLINE", // 'ONLINE' | 'IN_PERSON'
    preferredDate: "",
    preferredTime: "Morning (10:00 AM - 1:00 PM)",
    message: "",
    hp_field: "", // honeypot spam protection
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Client-side validations
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setStatus({ type: "error", text: "Please enter your full name." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setStatus({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      setStatus({ type: "error", text: "Please provide a valid contact phone number." });
      return;
    }

    if (!formData.preferredDate) {
      setStatus({ type: "error", text: "Please select your preferred date." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to submit consultation request.");
      }

      setStatus({
        type: "success",
        text:
          data.message ||
          "Your consultation request has been received by Vantage Wealth. A senior advisor will review your requested time and contact you promptly to finalize your discovery session.",
      });

      // Clear form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        serviceSlug: services[0]?.slug ?? "investment-advisory",
        preferredMode: "ONLINE",
        preferredDate: "",
        preferredTime: "Morning (10:00 AM - 1:00 PM)",
        message: "",
        hp_field: "",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        text: err.message || "An unexpected error occurred. Please try again or reach out to our advisory desk.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toISOString().split("T")[0];

  return (
    <div className="bg-[#FAF8F5] p-7 sm:p-9 rounded-xl border border-[#E5DFD5] shadow-xs space-y-6">
      <div>
        <h3 className="text-xl sm:text-2xl font-semibold text-[#172B46] tracking-tight">
          Request a Confidential Consultation
        </h3>
        <div className="w-12 h-1 bg-[#B08D57] rounded-full mt-2 mb-3" />
        <p className="text-xs sm:text-sm text-[#172B46]/75 font-normal leading-relaxed">
          Please provide your details and scheduling preferences below. Our advisory team will reach out to confirm availability.
        </p>
      </div>

      {status && (
        <div
          className={`p-4 rounded-sm border-l-4 flex items-start gap-3 text-xs sm:text-sm leading-relaxed ${
            status.type === "success"
              ? "bg-green-50 border-green-600 text-green-950"
              : "bg-red-50 border-red-600 text-red-950"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-semibold block mb-0.5">
              {status.type === "success" ? "Request Submitted Successfully" : "Submission Notice"}
            </span>
            {status.text}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Honeypot field (hidden from genuine users) */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="hp_consultation">Leave this blank</label>
          <input
            id="hp_consultation"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={formData.hp_field}
            onChange={(e) => setFormData({ ...formData, hp_field: e.target.value })}
          />
        </div>

        {/* Row 1: Name and Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              <User className="w-3.5 h-3.5 text-[#B08D57]" /> Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Sharma"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] focus:bg-[#FFFFFF] rounded-sm transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              <Phone className="w-3.5 h-3.5 text-[#B08D57]" /> Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] focus:bg-[#FFFFFF] rounded-sm transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Email and Service */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              <Mail className="w-3.5 h-3.5 text-[#B08D57]" /> Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. rajesh@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] focus:bg-[#FFFFFF] rounded-sm transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              Service of Interest *
            </label>
            <select
              value={formData.serviceSlug}
              onChange={(e) => setFormData({ ...formData, serviceSlug: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] focus:bg-[#FFFFFF] rounded-sm transition-colors cursor-pointer"
            >
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
              <option value="general-consultation">Comprehensive Wealth Portfolio Review</option>
            </select>
          </div>
        </div>

        {/* Consultation Mode Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#172B46]">
            Meeting Preference *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, preferredMode: "ONLINE" })}
              className={`p-3.5 rounded-sm border text-left flex items-center gap-3 transition-colors ${
                formData.preferredMode === "ONLINE"
                  ? "border-[#B08D57] bg-[#B08D57]/5 text-[#172B46]"
                  : "border-[#E5DFD5] bg-[#FFFFFF] text-[#172B46]/70 hover:border-[#B08D57]/50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  formData.preferredMode === "ONLINE" ? "border-[#B08D57]" : "border-[#B08D57]/40"
                }`}
              >
                {formData.preferredMode === "ONLINE" && (
                  <div className="w-2 h-2 rounded-full bg-[#B08D57]" />
                )}
              </div>
              <Video className="w-4 h-4 text-[#B08D57]" />
              <div className="text-xs">
                <span className="font-semibold block text-[#172B46]">Virtual Consultation</span>
                <span className="font-light text-[11px] text-[#172B46]/60">Secure high-definition video meeting</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, preferredMode: "IN_PERSON" })}
              className={`p-3.5 rounded-sm border text-left flex items-center gap-3 transition-colors ${
                formData.preferredMode === "IN_PERSON"
                  ? "border-[#B08D57] bg-[#B08D57]/5 text-[#172B46]"
                  : "border-[#E5DFD5] bg-[#FFFFFF] text-[#172B46]/70 hover:border-[#B08D57]/50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  formData.preferredMode === "IN_PERSON" ? "border-[#B08D57]" : "border-[#B08D57]/40"
                }`}
              >
                {formData.preferredMode === "IN_PERSON" && (
                  <div className="w-2 h-2 rounded-full bg-[#B08D57]" />
                )}
              </div>
              <Building2 className="w-4 h-4 text-[#B08D57]" />
              <div className="text-xs">
                <span className="font-semibold block text-[#172B46]">In-Person Advisory</span>
                <span className="font-light text-[11px] text-[#172B46]/60">At our New Delhi advisory desk</span>
              </div>
            </button>
          </div>
        </div>

        {/* Row 3: Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              <Calendar className="w-3.5 h-3.5 text-[#B08D57]" /> Preferred Date *
            </label>
            <input
              type="date"
              required
              min={minDateString}
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] focus:bg-[#FFFFFF] rounded-sm transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
              <Clock className="w-3.5 h-3.5 text-[#B08D57]" /> Preferred Time Slot *
            </label>
            <select
              value={formData.preferredTime}
              onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] focus:bg-[#FFFFFF] rounded-sm transition-colors cursor-pointer"
            >
              <option value="Morning (10:00 AM - 1:00 PM)">Morning (10:00 AM – 1:00 PM)</option>
              <option value="Afternoon (2:00 PM - 5:00 PM)">Afternoon (2:00 PM – 5:00 PM)</option>
              <option value="Evening (5:00 PM - 7:00 PM)">Evening (5:00 PM – 7:00 PM)</option>
            </select>
          </div>
        </div>

        {/* Row 4: Message / Goals */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#172B46]">
            <MessageSquare className="w-3.5 h-3.5 text-[#B08D57]" /> Additional Context or Financial Goals
          </label>
          <textarea
            rows={4}
            placeholder="Share any specific milestones, portfolio objectives, or questions you wish to address during our discussion..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] focus:bg-[#FFFFFF] rounded-sm transition-colors"
          ></textarea>
        </div>

        {/* Disclaimer / Notice */}
        <div className="p-3.5 bg-[#F7F5F0] border-l-2 border-[#B08D57] rounded-r-sm flex items-start gap-2.5 text-xs text-[#172B46]/75 font-light leading-relaxed">
          <Shield className="w-4 h-4 text-[#B08D57] shrink-0 mt-0.5" />
          <span>
            <strong>Scheduling Protocol:</strong> Submitting this request initiates a scheduling review. An advisor will contact you to confirm the exact appointment time. No formal advisory engagement is created until an agreement is executed.
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#B08D57] hover:bg-[#9B7A46] text-[#FFFFFF] text-sm font-semibold px-8 py-3.5 rounded-md transition-all duration-300 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
        >
          {loading ? (
            <span>Transmitting Request...</span>
          ) : (
            <>
              <span>Request Consultation</span>
              <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
