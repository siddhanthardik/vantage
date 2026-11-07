"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import ChatWidget from "./ChatWidget";

/**
 * Gate component checking whether current route is public.
 * Suppresses the chatbot completely within /admin routes.
 */
function ChatbotRouteGate() {
  const pathname = usePathname();

  // Strictly avoid rendering inside the Admin Dashboard or login page
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return <ChatWidget />;
}

/**
 * PublicChatbotShell wraps the route gate in a lightweight Suspense boundary.
 * Prevents prerendering usePathname() errors on dynamic Next.js 16 routes.
 */
export function PublicChatbotShell() {
  return (
    <Suspense fallback={null}>
      <ChatbotRouteGate />
    </Suspense>
  );
}
