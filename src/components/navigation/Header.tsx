"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, Calendar } from "lucide-react";

interface HeaderProps {
  services?: Array<{ title: string; slug: string }>;
}

export default function Header({ services = [] }: HeaderProps) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  // Canonical 6 Core Solutions fallback
  const displayServices = services.length > 0 ? services : [
    { title: "Risk Management & Insurance Solutions", slug: "risk-management-insurance" },
    { title: "Investment Solutions & Portfolio Advisory", slug: "investment-solutions" },
    { title: "Tax Advisory & Tax Compliance", slug: "tax-advisory" },
    { title: "Strategic Financing & Liability Solutions", slug: "strategic-financing" },
    { title: "Retirement Planning", slug: "retirement-planning" },
    { title: "Ongoing Portfolio Reviews", slug: "ongoing-portfolio-reviews" },
  ];

  const isHome = pathname === "/";
  const isAbout = pathname === "/about";
  const isPhilosophy = pathname === "/philosophy";
  const isServices = pathname.startsWith("/services");
  const isInsights = pathname === "/insights";
  const isContact = pathname === "/contact";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5DFD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Exact Approved Vantage Wealth Logo */}
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
            {/* Home Link with active gold indicator */}
            <Link
              href="/"
              className={`relative py-2 transition-colors hover:text-[#B08D57] ${
                isHome ? "text-[#172B46] font-semibold" : "text-[#172B46]/85"
              }`}
            >
              Home
              {isHome && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B08D57]" />
              )}
            </Link>

            <Link
              href="/about"
              className={`relative py-2 transition-colors hover:text-[#B08D57] ${
                isAbout ? "text-[#172B46] font-semibold" : "text-[#172B46]/85"
              }`}
            >
              About Us
              {isAbout && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B08D57]" />
              )}
            </Link>

            <Link
              href="/philosophy"
              className={`relative py-2 transition-colors hover:text-[#B08D57] ${
                isPhilosophy ? "text-[#172B46] font-semibold" : "text-[#172B46]/85"
              }`}
            >
              Our Philosophy
              {isPhilosophy && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B08D57]" />
              )}
            </Link>

            {/* Dynamic Our Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <Link
                href="/services"
                className={`flex items-center gap-1.5 py-2 transition-colors hover:text-[#B08D57] ${
                  isServices ? "text-[#172B46] font-semibold" : "text-[#172B46]/85"
                }`}
              >
                Our Services <ChevronDown className="w-3.5 h-3.5 text-[#172B46]/60 group-hover:text-[#B08D57]" />
                {isServices && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B08D57]" />
                )}
              </Link>

              {servicesDropdownOpen && (
                <div className="absolute top-full left-0 w-72 bg-[#FFFFFF] shadow-xl border border-[#E5DFD5] rounded-sm py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2 border-b border-[#E5DFD5]/60 text-[10px] uppercase font-bold tracking-widest text-[#B08D57]">
                    Advisory Services ({displayServices.length})
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E5DFD5]/30">
                    {displayServices.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/services/${item.slug}`}
                        className="block px-4 py-2.5 text-xs text-[#172B46] hover:bg-[#F7F5F0] hover:text-[#B08D57] transition-colors"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                  <div className="p-2 border-t border-[#E5DFD5]/60 bg-[#F7F5F0]/50">
                    <Link
                      href="/services"
                      className="block text-center text-[11px] font-semibold text-[#B08D57] hover:underline py-1"
                    >
                      View All Services &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/insights"
              className={`relative py-2 transition-colors hover:text-[#B08D57] ${
                isInsights ? "text-[#172B46] font-semibold" : "text-[#172B46]/85"
              }`}
            >
              Insights
              {isInsights && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B08D57]" />
              )}
            </Link>

            <Link
              href="/contact"
              className={`relative py-2 transition-colors hover:text-[#B08D57] ${
                isContact ? "text-[#172B46] font-semibold" : "text-[#172B46]/85"
              }`}
            >
              Contact
              {isContact && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B08D57]" />
              )}
            </Link>
          </nav>

          {/* Prominent Book a Consultation Button (Visual Reference Match) */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 border border-[#B08D57] bg-[#FFFFFF] hover:bg-[#B08D57] text-[#172B46] hover:text-[#FFFFFF] px-5 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-300 shadow-2xs group"
            >
              <Calendar className="w-3.5 h-3.5 text-[#B08D57] group-hover:text-[#FFFFFF] transition-colors" />
              <span>Book a Consultation</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#172B46] hover:text-[#B08D57] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFFFF] border-b border-[#E5DFD5] px-6 py-6 space-y-4 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-[#172B46] hover:text-[#B08D57]"
          >
            Home
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#172B46] hover:text-[#B08D57]"
          >
            About Us
          </Link>
          <Link
            href="/philosophy"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#172B46] hover:text-[#B08D57]"
          >
            Our Philosophy
          </Link>

          <div className="pt-2 pb-2">
            <div className="text-xs uppercase font-bold text-[#B08D57] tracking-wider mb-2">
              Our Services
            </div>
            <div className="space-y-2 pl-3 border-l border-[#B08D57]/40">
              {displayServices.map((item) => (
                <Link
                  key={item.slug}
                  href={`/services/${item.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs text-[#172B46]/80 hover:text-[#B08D57]"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/insights"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#172B46] hover:text-[#B08D57]"
          >
            Insights
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#172B46] hover:text-[#B08D57]"
          >
            Contact
          </Link>

          <div className="pt-4 border-t border-[#E5DFD5]">
            <Link
              href="/consultation"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full text-center border border-[#B08D57] bg-[#B08D57] text-[#FFFFFF] py-3 rounded-md text-xs font-bold tracking-wider uppercase shadow-xs"
            >
              <Calendar className="w-4 h-4 text-[#FFFFFF]" />
              Book a Consultation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
