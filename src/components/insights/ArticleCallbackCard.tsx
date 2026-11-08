"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, PhoneCall } from "lucide-react";
import { ALLOWED_AREAS_OF_INTEREST } from "@/server/repositories/enquiryRepository";

interface ArticleCallbackCardProps {
  articleSlug: string;
  articleTitle?: string;
}

export default function ArticleCallbackCard({
  articleSlug,
  articleTitle,
}: ArticleCallbackCardProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [areaOfInterest, setAreaOfInterest] = useState<string>("Investment Planning");
  const [preferredTime, setPreferredTime] = useState<string>("Morning (9:30 AM - 1:00 PM)");
  const [consent, setConsent] = useState(false);
  const [hpField, setHpField] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!fullName.trim()) {
      setStatus({ type: "error", message: "Please provide your full name." });
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      setStatus({ type: "error", message: "Please enter a valid phone number (8 to 15 digits)." });
      return;
    }

    if (!consent) {
      setStatus({
        type: "error",
        message: "Please agree to receive a callback from Vantage Wealth.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/enquiries/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          areaOfInterest,
          preferredTime,
          consent,
          articleSlug,
          articleTitle,
          hp_field: hpField,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit callback request.");
      }

      setStatus({
        type: "success",
        message: data.message || "Thank you. Your callback request has been received.",
      });
      setFullName("");
      setPhone("");
      setEmail("");
      setConsent(false);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Something went wrong. Please check your information and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm p-6 shadow-xs font-sans">
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B08D57]">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Direct Advisory</span>
        </div>
        <h3 className="text-[18px] sm:text-[19px] font-semibold text-[#172B46] tracking-tight leading-snug">
          Planning your financial future?
        </h3>
        <p className="text-[13px] text-[#172B46]/75 font-normal leading-relaxed">
          Request a conversation with the Vantage Wealth team.
        </p>
      </div>

      {status && (
        <div
          className={`p-3.5 mb-4 rounded-xs text-xs flex items-start gap-2.5 ${
            status.type === "success"
              ? "bg-green-50 border border-green-200 text-green-900"
              : "bg-red-50 border border-red-200 text-red-900"
          }`}
          role="alert"
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{status.message}</span>
        </div>
      )}

      {status?.type !== "success" ? (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Honeypot field for bot protection */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="hp_field"
              tabIndex={-1}
              autoComplete="off"
              value={hpField}
              onChange={(e) => setHpField(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="callback-name"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#172B46] mb-1.5"
            >
              Full Name <span className="text-[#B08D57]">*</span>
            </label>
            <input
              id="callback-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Vikram Malhotra"
              className="w-full px-3.5 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-[13px] text-[#172B46] placeholder-[#172B46]/40 rounded-xs focus:outline-none focus:border-[#B08D57] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="callback-phone"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#172B46] mb-1.5"
            >
              Phone Number <span className="text-[#B08D57]">*</span>
            </label>
            <input
              id="callback-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-[13px] text-[#172B46] placeholder-[#172B46]/40 rounded-xs focus:outline-none focus:border-[#B08D57] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="callback-email"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#172B46] mb-1.5"
            >
              Email Address <span className="text-[#172B46]/50 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="callback-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vikram@malhotra.in"
              className="w-full px-3.5 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-[13px] text-[#172B46] placeholder-[#172B46]/40 rounded-xs focus:outline-none focus:border-[#B08D57] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="callback-area"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#172B46] mb-1.5"
            >
              Area of Interest <span className="text-[#B08D57]">*</span>
            </label>
            <select
              id="callback-area"
              value={areaOfInterest}
              onChange={(e) => setAreaOfInterest(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-[13px] text-[#172B46] rounded-xs focus:outline-none focus:border-[#B08D57] transition-colors cursor-pointer"
            >
              {ALLOWED_AREAS_OF_INTEREST.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="callback-time"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#172B46] mb-1.5"
            >
              Preferred Callback Time <span className="text-[#172B46]/50 font-normal lowercase">(optional)</span>
            </label>
            <select
              id="callback-time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-[13px] text-[#172B46] rounded-xs focus:outline-none focus:border-[#B08D57] transition-colors cursor-pointer"
            >
              <option value="Morning (9:30 AM - 1:00 PM)">Morning (9:30 AM - 1:00 PM)</option>
              <option value="Afternoon (1:00 PM - 5:00 PM)">Afternoon (1:00 PM - 5:00 PM)</option>
              <option value="Evening (5:00 PM - 7:30 PM)">Evening (5:00 PM - 7:30 PM)</option>
              <option value="Any time during business hours">Any time during business hours</option>
            </select>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-[#172B46]/80 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded-xs border-[#E5DFD5] text-[#172B46] focus:ring-[#B08D57] cursor-pointer"
              />
              <span className="text-[12px] leading-relaxed">
                I agree to receive a callback from the Vantage Wealth advisory team regarding my financial inquiry.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <span>Request a Callback</span>
            )}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setStatus(null)}
          className="text-xs text-[#B08D57] font-semibold hover:underline block text-center w-full pt-1"
        >
          Submit another inquiry
        </button>
      )}
    </div>
  );
}
