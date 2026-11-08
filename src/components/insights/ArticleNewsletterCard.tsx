"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ArticleNewsletterCardProps {
  articleSlug?: string;
}

export default function ArticleNewsletterCard({ articleSlug }: ArticleNewsletterCardProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hpField, setHpField] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!email.trim()) {
      setStatus({ type: "error", message: "Please enter your email address." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          sourceSlug: articleSlug,
          hp_field: hpField,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Subscription failed. Please try again.");
      }

      setStatus({
        type: "success",
        message: data.message || "Thank you for subscribing to The Vantage Wealth Newsletter.",
      });
      setName("");
      setEmail("");
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Something went wrong. Please check your email and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm p-6 shadow-xs font-sans">
      <div className="space-y-2 mb-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#B08D57]">
          Research &amp; Commentary
        </span>
        <h3 className="text-[18px] sm:text-[19px] font-semibold text-[#172B46] tracking-tight leading-snug">
          The Vantage Wealth Newsletter
        </h3>
        <p className="text-[13px] text-[#172B46]/75 font-normal leading-relaxed">
          Receive thoughtful perspectives on wealth planning, investments and financial decisions in India.
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
              htmlFor="newsletter-name"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#172B46] mb-1.5"
            >
              Your Name <span className="text-[#172B46]/50 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="newsletter-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-[13px] text-[#172B46] placeholder-[#172B46]/40 rounded-xs focus:outline-none focus:border-[#B08D57] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="newsletter-email"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#172B46] mb-1.5"
            >
              Email Address <span className="text-[#B08D57]">*</span>
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul.sharma@example.com"
              className="w-full px-3.5 py-2.5 bg-[#F7F5F0] border border-[#E5DFD5] text-[13px] text-[#172B46] placeholder-[#172B46]/40 rounded-xs focus:outline-none focus:border-[#B08D57] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Subscribing...</span>
              </>
            ) : (
              <span>Subscribe</span>
            )}
          </button>

          <p className="text-[11px] text-[#172B46]/50 text-center leading-normal pt-1">
            Unsubscribe anytime. We treat your information with strict institutional confidentiality.
          </p>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setStatus(null)}
          className="text-xs text-[#B08D57] font-semibold hover:underline block text-center w-full pt-1"
        >
          Subscribe another email
        </button>
      )}
    </div>
  );
}
