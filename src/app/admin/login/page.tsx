"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please provide both email address and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials. Please verify your email and password.");
      }

      router.push(data.redirect || "/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#172B46]">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Login Card */}
        <div className="bg-[#FFFFFF] p-8 sm:p-10 rounded-xl shadow-2xl border border-[#E5DFD5]">
          {/* Official Vantage Wealth Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" title="Vantage Wealth">
              <div className="relative w-48 sm:w-52 h-10 sm:h-12">
                <Image
                  src="/brand/logo/logo-horizontal.png"
                  alt="Vantage Wealth"
                  fill
                  priority
                  sizes="(max-width: 640px) 192px, 208px"
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-600 rounded-sm flex items-start gap-2.5 text-xs text-red-800"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-[#172B46] mb-1.5"
              >
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#B08D57] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vantagewealth.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E5DFD5] text-sm text-[#172B46] placeholder:text-[#172B46]/40 focus:outline-none focus:border-[#B08D57] focus:bg-[#FFFFFF] rounded-md transition-colors"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#172B46] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#B08D57] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-[#FAF8F5] border border-[#E5DFD5] text-sm text-[#172B46] placeholder:text-[#172B46]/40 focus:outline-none focus:border-[#B08D57] focus:bg-[#FFFFFF] rounded-md transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-[#172B46]/50 hover:text-[#B08D57] transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Primary Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#B08D57] hover:bg-[#9B7A46] disabled:bg-gray-400 text-[#FFFFFF] text-sm font-semibold rounded-md transition-all duration-300 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>

          {/* Subtle Security Badge */}
          <div className="mt-6 pt-5 border-t border-[#E5DFD5] flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#172B46]/60 font-light">
              <Shield className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Secure administrator access</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#172B46]/70 hover:text-[#B08D57] transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
            </Link>
          </div>
        </div>

        {/* Small Copyright Footer */}
        <p className="text-[11px] text-[#F7F5F0]/60 text-center font-light">
          &copy; 2026 Vantage Wealth. All rights reserved.
        </p>
      </div>
    </div>
  );
}
