import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";
import NavHeader, { NavHeaderFallback } from "@/components/navigation/NavHeader";
import NavFooter, { NavFooterFallback } from "@/components/navigation/NavFooter";
import { PublicHeaderShell, PublicFooterShell } from "@/components/navigation/PublicLayoutShell";
import { PublicChatbotShell } from "@/components/chat/PublicChatbotShell";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vantage Wealth | A Clearer Perspective on Your Wealth",
  description:
    "Personalised wealth strategies to grow, protect and create a lasting legacy. Institutional advisory for individuals and families.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F5F0] text-[#172B46] selection:bg-[#B08D57]/20 selection:text-[#172B46]">
        <Suspense fallback={null}>
          <PublicHeaderShell>
            <Suspense fallback={<NavHeaderFallback />}>
              <NavHeader />
            </Suspense>
          </PublicHeaderShell>
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense fallback={null}>
          <PublicFooterShell>
            <Suspense fallback={<NavFooterFallback />}>
              <NavFooter />
            </Suspense>
          </PublicFooterShell>
        </Suspense>
        <PublicChatbotShell />
      </body>
    </html>
  );
}
