import { cacheTag } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";
import Footer from "./Footer";
import { getPublishedServices, getBusinessSettings } from "@/server/repositories/serviceRepository";

/**
 * Pure static server-rendered placeholder for the footer.
 * Does NOT call usePathname() or any client hooks.
 * Preserves exact layout, styling, and branding to prevent layout shift.
 */
export function NavFooterFallback() {
  const currentYear = 2026;
  return (
    <footer className="bg-[#FFFFFF] text-[#172B46] border-t border-[#E5DFD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 lg:divide-x lg:divide-[#E5DFD5]/60">
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

          <div className="space-y-4 lg:pl-10">
            <h4 className="text-[18px] font-semibold text-[#172B46]">
              Our Solutions
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#172B46]/80 font-normal">
              <li>
                <Link href="/services/risk-management-insurance" className="hover:text-[#B08D57] transition-colors">
                  Risk Management &amp; Insurance Solutions
                </Link>
              </li>
              <li>
                <Link href="/services/investment-solutions" className="hover:text-[#B08D57] transition-colors">
                  Investment Solutions &amp; Portfolio Advisory
                </Link>
              </li>
              <li>
                <Link href="/services/tax-advisory" className="hover:text-[#B08D57] transition-colors">
                  Tax Advisory &amp; Tax Compliance
                </Link>
              </li>
              <li>
                <Link href="/services/strategic-financing" className="hover:text-[#B08D57] transition-colors">
                  Strategic Financing &amp; Liability Solutions
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

          <div className="space-y-4 lg:pl-10">
            <h4 className="text-[18px] font-semibold text-[#172B46]">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-[14px] text-[#172B46]/85 font-normal">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B08D57] shrink-0" />
                <a href="tel:+919820247167" className="hover:text-[#B08D57] transition-colors">
                  +91 9820247167
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B08D57] shrink-0" />
                <a href="mailto:info@vantagewealth.in" className="hover:text-[#B08D57] transition-colors">
                  info@vantagewealth.in
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#B08D57] shrink-0" />
                <span>Gurugram, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

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

/**
 * Dedicated Asynchronous Server Component for Footer Data Access
 * Fetches published services and business settings without blocking RootLayout prerendering.
 */
export default async function NavFooter() {
  "use cache";
  cacheTag("business-settings", "published-services");

  let navServices: { title: string; slug: string }[] = [];
  let settings = {
    phone: "+91 98765 43210",
    email: "hello@vantagewealth.in",
    address: "New Delhi, India",
    companyName: "Vantage Wealth",
    tagline: "A Clearer Perspective on Your Wealth",
    consultationUrl: "/consultation",
    copyrightNotice: "© Vantage Wealth. All rights reserved.",
  };

  try {
    const [dbServices, dbSettings] = await Promise.all([
      getPublishedServices(),
      getBusinessSettings(),
    ]);
    navServices = dbServices.map((s) => ({
      title: s.title,
      slug: s.slug,
    }));
    settings = dbSettings;
  } catch (err) {
    console.error("Database connection failure in NavFooter:", err);
  }

  return <Footer services={navServices} settings={settings} />;
}
