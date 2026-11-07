import { cacheTag } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Calendar, Menu } from "lucide-react";
import Header from "./Header";
import { getPublishedServices } from "@/server/repositories/serviceRepository";

/**
 * Lightweight, static server-renderable placeholder for the navigation header.
 * - Does NOT import or render Header.tsx
 * - Does NOT use usePathname, useSearchParams, useState, or any client hooks
 * - Preserves exact height (h-20), logo dimensions, background, and alignment to prevent layout shifts
 */
export function NavHeaderFallback() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5DFD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group py-2">
            <div className="relative w-52 sm:w-60 h-10 sm:h-12">
              <Image
                src="/brand/logo/logo-horizontal.png"
                alt="Vantage Wealth"
                fill
                priority
                sizes="(max-width: 640px) 208px, 240px"
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9 text-xs lg:text-sm font-medium tracking-wide text-[#172B46]">
            <Link
              href="/"
              className="relative py-2 transition-colors hover:text-[#B08D57] text-[#172B46]/85"
            >
              Home
            </Link>

            <Link
              href="/about"
              className="relative py-2 transition-colors hover:text-[#B08D57] text-[#172B46]/85"
            >
              About Us
            </Link>

            <Link
              href="/philosophy"
              className="relative py-2 transition-colors hover:text-[#B08D57] text-[#172B46]/85"
            >
              Our Philosophy
            </Link>

            <div className="relative">
              <Link
                href="/services"
                className="flex items-center gap-1.5 py-2 transition-colors hover:text-[#B08D57] text-[#172B46]/85"
              >
                Our Services <ChevronDown className="w-3.5 h-3.5 text-[#172B46]/60" />
              </Link>
            </div>

            <Link
              href="/insights"
              className="relative py-2 transition-colors hover:text-[#B08D57] text-[#172B46]/85"
            >
              Insights
            </Link>

            <Link
              href="/contact"
              className="relative py-2 transition-colors hover:text-[#B08D57] text-[#172B46]/85"
            >
              Contact
            </Link>
          </nav>

          {/* Consultation CTA matching Header.tsx */}
          <div className="hidden md:flex items-center">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 border border-[#B08D57] bg-[#FFFFFF] hover:bg-[#B08D57] text-[#172B46] hover:text-[#FFFFFF] px-5 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-300 shadow-2xs group"
            >
              <Calendar className="w-3.5 h-3.5 text-[#B08D57] group-hover:text-[#FFFFFF] transition-colors" />
              <span>Book a Consultation</span>
            </Link>
          </div>

          {/* Mobile Menu Placeholder */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-1.5 bg-[#172B46] text-[#FFFFFF] px-3.5 py-2 rounded-sm text-[11px] font-bold uppercase tracking-wider"
            >
              <span>Consult</span>
            </Link>
            <div className="p-2 text-[#172B46]">
              <Menu className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Dedicated Asynchronous Server Component for Navigation Data Access
 * Fetches published services from PostgreSQL/Prisma without blocking RootLayout prerendering.
 * Rendered strictly inside the <Suspense> boundary.
 */
export default async function NavHeader() {
  "use cache";
  cacheTag("published-services");

  let navServices: { title: string; slug: string }[] = [];
  try {
    const services = await getPublishedServices();
    navServices = services.map((s) => ({
      title: s.title,
      slug: s.slug,
    }));
  } catch (err) {
    console.error("Database connection failure in NavHeader:", err);
  }

  return <Header services={navServices} />;
}
