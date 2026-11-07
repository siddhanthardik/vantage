"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";

/**
 * Inner client component that reads the current pathname.
 * Must be executed beneath a Suspense boundary during static prerendering.
 */
function HeaderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return <>{children}</>;
}

/**
 * PublicHeaderShell wraps HeaderGate inside a self-contained Suspense boundary.
 * Prevents "Next.js encountered usePathname() outside of a <Suspense> boundary" errors
 * during static prerendering and partial prefetching of dynamic routes.
 */
export function PublicHeaderShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <HeaderGate>{children}</HeaderGate>
    </Suspense>
  );
}

/**
 * Inner client component that reads the current pathname for footer suppression.
 */
function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return <>{children}</>;
}

/**
 * PublicFooterShell wraps FooterGate inside a self-contained Suspense boundary.
 */
export function PublicFooterShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <FooterGate>{children}</FooterGate>
    </Suspense>
  );
}
