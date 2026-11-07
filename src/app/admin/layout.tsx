import { Suspense } from "react";
import Image from "next/image";
import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const metadata = {
  title: "Admin Portal | Vantage Wealth",
};

/**
 * Neutral, brand-aligned loading screen shown during authentication verification.
 * Does not expose the protected sidebar or administrative content in the fallback.
 */
function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#F0EDE6] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 relative mb-4 opacity-80 animate-pulse">
        <Image
          src="/brand/logo/logo-stacked.png"
          alt="Vantage Wealth"
          fill
          sizes="48px"
          className="object-contain"
          priority
        />
      </div>
      <div className="inline-block w-6 h-6 border-2 border-[#B08D57] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-sans font-semibold text-[#172B46] tracking-wide">
        Vantage Wealth Management Console
      </p>
      <p className="text-[11px] text-[#172B46]/60 font-light mt-0.5">
        Verifying administrative credentials...
      </p>
    </div>
  );
}

/**
 * Dedicated Asynchronous Server Component for Admin Authentication.
 * Executes beneath the Suspense boundary so that connection-dependent authentication
 * does not block static prerendering of the outer AdminLayout.
 */
async function AdminAuthGate({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getAdminSession();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isLoginPage = pathname === "/admin/login";

  if (!session) {
    if (isLoginPage) {
      return (
        <div className="admin-portal min-h-screen bg-[#172B46] flex flex-col font-sans">
          <main className="flex-1 flex flex-col min-w-0">{children}</main>
        </div>
      );
    }
    redirect("/admin/login");
  }

  if (isLoginPage) {
    redirect("/admin/dashboard");
  }

  return (
    <AdminLayoutShell
      session={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </AdminLayoutShell>
  );
}

/**
 * Outer AdminLayout is a Synchronous Server Component.
 * It renders an appropriate Suspense boundary and does not await request data at the top level.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <AdminAuthGate>{children}</AdminAuthGate>
    </Suspense>
  );
}
