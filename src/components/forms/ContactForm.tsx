"use client";

import { useState } from "react";
import { Mail, Phone, User, MessageSquare, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "General Wealth Advisory",
    message: "",
    hp_field: "", // honeypot spam protection
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Client-side validation
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
      setStatus({ type: "error", text: "Please enter a valid contact phone number." });
      return;
    }

    const submissionMessage = formData.message.trim() || `Inquiry regarding ${formData.subject}.`;

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          message: submissionMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit message.");
      }

      setStatus({
        type: "success",
        text: data.message || "Thank you. Your inquiry has been delivered to our advisory desk.",
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        subject: "General Wealth Advisory",
        message: "",
        hp_field: "",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        text: err.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] p-7 sm:p-9 rounded-xl border border-[#E5DFD5] shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-[#172B46] tracking-tight">
          Get in Touch
        </h3>
        <div className="w-12 h-1 bg-[#B08D57] rounded-full mt-2 mb-3" />
        <p className="text-sm text-[#172B46]/75 font-normal leading-relaxed">
          Share your details and our team will get back to you shortly to schedule a conversation.
        </p>
      </div>

      {status && (
        <div
          className={`mb-6 p-4 rounded-md border-l-4 flex items-start gap-3 text-xs ${
            status.type === "success"
              ? "bg-emerald-50 border-emerald-600 text-emerald-900"
              : "bg-red-50 border-red-600 text-red-900"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{status.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field (hidden from genuine users) */}
        <div className="hidden" aria-hidden="true">
          <input
            type="text"
            name="hp_field"
            tabIndex={-1}
            autoComplete="off"
            value={formData.hp_field}
            onChange={(e) => setFormData({ ...formData, hp_field: e.target.value })}
          />
        </div>

        {/* Row 1: Full Name & Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B46] mb-1.5">
              Full Name <span className="text-[#B08D57]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Your full name"
              className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E5DFD5] text-sm text-[#172B46] placeholder:text-[#172B46]/40 focus:outline-none focus:border-[#B08D57] rounded-md transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B46] mb-1.5">
              Phone Number <span className="text-[#B08D57]">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E5DFD5] text-sm text-[#172B46] placeholder:text-[#172B46]/40 focus:outline-none focus:border-[#B08D57] rounded-md transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Email Address */}
        <div>
          <label className="block text-xs font-semibold text-[#172B46] mb-1.5">
            Email Address <span className="text-[#B08D57]">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@company.com"
            className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E5DFD5] text-sm text-[#172B46] placeholder:text-[#172B46]/40 focus:outline-none focus:border-[#B08D57] rounded-md transition-colors"
          />
        </div>

        {/* Row 3: Service of Interest */}
        <div>
          <label className="block text-xs font-semibold text-[#172B46] mb-1.5">
            Service of Interest
          </label>
          <select
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E5DFD5] text-sm text-[#172B46] focus:outline-none focus:border-[#B08D57] rounded-md"
          >
            <option value="Investment Advisory">Investment Advisory</option>
            <option value="Wealth Protection">Wealth Protection</option>
            <option value="Retirement Planning">Retirement Planning</option>
            <option value="Family Wealth & Legacy">Family Wealth & Legacy</option>
            <option value="Tax Planning">Tax Planning</option>
            <option value="Strategic Loans">Strategic Loans</option>
            <option value="General Wealth Advisory">General Wealth Advisory</option>
          </select>
        </div>

        {/* Row 4: Your Message (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-[#172B46] mb-1.5">
            Your Message (Optional)
          </label>
          <textarea
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Briefly describe what you would like to discuss..."
            className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E5DFD5] text-sm text-[#172B46] placeholder:text-[#172B46]/40 focus:outline-none focus:border-[#B08D57] rounded-md leading-relaxed"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[#B08D57] hover:bg-[#9B7A46] disabled:bg-gray-400 text-[#FFFFFF] text-sm font-semibold px-7 py-3 rounded-md transition-all duration-300 shadow-xs cursor-pointer group"
          >
            {loading ? (
              <span>Sending...</span>
            ) : (
              <>
                <span>Send Message</span>
                <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
