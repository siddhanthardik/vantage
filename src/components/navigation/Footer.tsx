"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Phone, Mail, MapPin } from "lucide-react";
import { BusinessSettingsData } from "@/types/service";

interface FooterProps {
  services?: Array<{ title: string; slug: string }>;
  settings?: BusinessSettingsData;
}

export default function Footer({ services = [], settings }: FooterProps) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const currentYear = 2026;

  const businessPhone = settings?.phone || "+91 98765 43210";
  const businessEmail = settings?.email || "hello@vantagewealth.in";
  const businessAddress = settings?.address || "New Delhi, India";

  // Canonical 6 Core Solutions per Vantage Wealth Architecture
  const defaultSolutions = [
    { title: "Risk Management & Insurance Solutions", slug: "risk-management-insurance" },
    { title: "Investment Solutions & Portfolio Advisory", slug: "investment-solutions" },
    { title: "Tax Advisory & Tax Compliance", slug: "tax-advisory" },
    { title: "Strategic Financing & Liability Solutions", slug: "strategic-financing" },
    { title: "Retirement Planning", slug: "retirement-planning" },
    { title: "Ongoing Portfolio Reviews", slug: "ongoing-portfolio-reviews" },
  ];

  const displayServices = services.length > 0 ? services : defaultSolutions;

  return (
    <footer className="bg-[#FFFFFF] text-[#172B46] border-t border-[#E5DFD5]">
      {/* Upper Footer Grid (Matching Corporate Homepage Reference) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 lg:divide-x lg:divide-[#E5DFD5]/60">
          {/* Column 1: Stacked Logo & Brand Statement */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <div className="relative w-44 h-20">
                <Image
                  src="/brand/logo/logo-stacked.png"
                  alt="Vantage Wealth"
                  fill
                  sizes="176px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <p className="text-[14px] text-[#172B46]/80 font-normal leading-relaxed pr-4">
              Integrated financial solutions to help individuals and families protect, perform and preserve their wealth.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4 lg:pl-10">
            <h4 className="text-[18px] font-semibold text-[#172B46]">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#172B46]/80 font-normal">
              <li>
                <Link href="/" className="hover:text-[#B08D57] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#B08D57] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/philosophy" className="hover:text-[#B08D57] transition-colors">
                  Our Philosophy
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-[#B08D57] transition-colors">
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="/insights" className="hover:text-[#B08D57] transition-colors">
                  Insights
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#B08D57] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Our Solutions */}
          <div className="space-y-4 lg:pl-10">
            <h4 className="text-[18px] font-semibold text-[#172B46]">
              Our Solutions
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#172B46]/80 font-normal">
              <li>
                <Link href="/services/risk-management-insurance" className="hover:text-[#B08D57] transition-colors">
                  Risk Management &amp; Insurance
                </Link>
              </li>
              <li>
                <Link href="/services/investment-solutions" className="hover:text-[#B08D57] transition-colors">
                  Investment Solutions
                </Link>
              </li>
              <li>
                <Link href="/services/tax-advisory" className="hover:text-[#B08D57] transition-colors">
                  Tax Advisory
                </Link>
              </li>
              <li>
                <Link href="/services/strategic-financing" className="hover:text-[#B08D57] transition-colors">
                  Strategic Financing
                </Link>
              </li>
              <li>
                <Link href="/services/retirement-planning" className="hover:text-[#B08D57] transition-colors">
                  Retirement Planning
                </Link>
              </li>
              <li>
                <Link href="/services/ongoing-portfolio-reviews" className="hover:text-[#B08D57] transition-colors">
                  Ongoing Portfolio Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Approved Business Details */}
          <div className="space-y-4 lg:pl-10">
            <h4 className="text-[18px] font-semibold text-[#172B46]">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-[14px] text-[#172B46]/85 font-normal">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B08D57] shrink-0" />
                <a href={`tel:${businessPhone.replace(/\s+/g, '')}`} className="hover:text-[#B08D57] transition-colors">
                  {businessPhone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B08D57] shrink-0" />
                <a href={`mailto:${businessEmail}`} className="hover:text-[#B08D57] transition-colors">
                  {businessEmail}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#B08D57] shrink-0" />
                <span>{businessAddress}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Bar */}
      <div className="border-t border-[#E5DFD5] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[#172B46]/70 gap-4">
          <div>
            &copy; {currentYear} Vantage Wealth. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#B08D57] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[#E5DFD5]">|</span>
            <Link href="/terms" className="hover:text-[#B08D57] transition-colors">
              Terms of Use
            </Link>
            <span className="text-[#E5DFD5]">|</span>
            <Link href="/disclaimer" className="hover:text-[#B08D57] transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
