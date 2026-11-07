import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Target,
  Users,
  CheckCircle2,
  Calendar,
  LineChart,
  Sprout,
  Layers,
  Briefcase,
  FileText,
  Compass,
} from "lucide-react";
import SectionKicker from "@/components/ui/SectionKicker";
import {
  getPublishedServices,
  getBusinessSettings,
  DEFAULT_BUSINESS_SETTINGS,
} from "@/server/repositories/serviceRepository";
import { ServiceItem, BusinessSettingsData } from "@/types/service";

// Icon resolution helper for dynamic service cards
function getServiceIcon(iconName?: string | null) {
  switch (iconName) {
    case "ShieldCheck":
      return ShieldCheck;
    case "FileText":
      return FileText;
    case "Briefcase":
      return Briefcase;
    case "Sprout":
      return Sprout;
    case "Target":
      return Target;
    case "Layers":
      return Layers;
    case "Users":
      return Users;
    case "Compass":
      return Compass;
    case "TrendingUp":
    default:
      return TrendingUp;
  }
}

async function HomeServicesGrid() {
  let services: ServiceItem[] = [];
  try {
    services = await getPublishedServices();
  } catch (err) {
    console.error("Database connection failure loading published services:", err);
    return (
      <div className="text-center py-12 px-6 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm max-w-xl mx-auto space-y-2">
        <p className="text-sm font-semibold text-[#172B46]">Services Catalog Currently Unavailable</p>
        <p className="text-xs text-[#172B46]/70">
          We are unable to connect to the database to load financial solutions at this time.
        </p>
      </div>
    );
  }

  // An empty PostgreSQL result must strictly remain an empty result
  if (services.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm max-w-xl mx-auto space-y-2">
        <p className="text-sm font-semibold text-[#172B46]">No Published Services Available</p>
        <p className="text-xs text-[#172B46]/70">
          There are currently no financial services published in the database.
        </p>
      </div>
    );
  }

  // Custom CTA labels per service architecture
  const ctaLabels: Record<string, string> = {
    "risk-management-insurance": "Explore Protection Solutions",
    "investment-solutions": "Explore Investment Solutions",
    "tax-advisory": "Explore Tax Solutions",
    "strategic-financing": "Explore Financing Solutions",
    "retirement-planning": "Plan Your Retirement",
    "portfolio-reviews": "Understand Our Review Process",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.slice(0, 6).map((service, idx) => {
        const ServiceIcon = getServiceIcon(service.iconName);
        const cardImage =
          service.thumbnailImage ||
          service.heroImage ||
          "/images/services/investment-advisory.png";
        const ctaText = ctaLabels[service.slug] || "Explore Discipline";

        return (
          <div
            key={service.id || service.slug}
            className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm hover:border-[#B08D57] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group overflow-hidden h-full"
          >
            <div>
              <div className="relative w-full h-48 bg-[#F7F5F0] overflow-hidden shrink-0">
                <Image
                  src={cardImage}
                  alt={service.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#172B46]/90 backdrop-blur-xs text-[#FFFFFF] text-[11px] font-semibold px-2.5 py-1 rounded-xs uppercase tracking-wider">
                  0{idx + 1}
                </div>
              </div>

              <div className="p-6 sm:p-7 space-y-3">
                <div className="text-[#B08D57]">
                  <ServiceIcon className="w-6 h-6 stroke-[1.5]" />
                </div>

                <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors leading-snug min-h-[3rem] flex items-center">
                  {service.title}
                </h3>

                <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed min-h-[4rem] line-clamp-3">
                  {service.shortDesc}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-7 pt-0">
              <Link
                href={`/services/${service.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#172B46] group-hover:text-[#B08D57] transition-colors pt-4 border-t border-[#E5DFD5]/40 w-full"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#B08D57] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HomeServicesFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm p-6 space-y-4 h-80 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-full h-36 bg-[#E5DFD5]/60 rounded-xs" />
            <div className="w-2/3 h-5 bg-[#E5DFD5]/80 rounded-xs" />
            <div className="w-full h-3 bg-[#E5DFD5]/50 rounded-xs" />
          </div>
          <div className="w-1/3 h-4 bg-[#E5DFD5]/70 rounded-xs" />
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  let settings: BusinessSettingsData = DEFAULT_BUSINESS_SETTINGS;
  try {
    settings = await getBusinessSettings();
  } catch (err) {
    console.error("Database connection failure loading business settings on homepage:", err);
  }

  const heroHeading = settings.heroHeading || DEFAULT_BUSINESS_SETTINGS.heroHeading || "A Clearer Perspective on Your Wealth.";
  const heroSubheading = settings.heroSubheading || DEFAULT_BUSINESS_SETTINGS.heroSubheading || "Integrated financial solutions to help you grow, protect and preserve your wealth.";
  const heroNarrative = settings.heroNarrative ?? "";
  const heroImageUrl = settings.heroImageUrl || DEFAULT_BUSINESS_SETTINGS.heroImageUrl || "/images/home/hero-advisory.png";
  const heroImageAlt = settings.heroImageAlt || DEFAULT_BUSINESS_SETTINGS.heroImageAlt || "Vantage Wealth Senior Advisory Counsel";
  const heroImagePosition = settings.heroImagePosition || DEFAULT_BUSINESS_SETTINGS.heroImagePosition || "object-center";
  const heroCtaText = settings.heroCtaText || DEFAULT_BUSINESS_SETTINGS.heroCtaText || "Book a Consultation";
  const heroCtaUrl = settings.heroCtaUrl || DEFAULT_BUSINESS_SETTINGS.heroCtaUrl || "/consultation";

  const narrativeParagraphs = heroNarrative.split("\n\n").map((p) => p.trim()).filter(Boolean);

  return (
    <div className="relative bg-[#F7F5F0] overflow-x-hidden font-sans">
      {/* 1. HERO SECTION (Full-Width Photographic Integration with Soft Ivory Gradient) */}
      <section className="relative w-full bg-[#F7F5F0] border-b border-[#E5DFD5] overflow-hidden min-h-[500px] lg:min-h-[580px] flex items-center">
        {/* Full-bleed Right Photographic Background on Desktop */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[55%] h-full pointer-events-none">
          <Image
            src={heroImageUrl}
            alt={heroImageAlt}
            fill
            priority
            sizes="55vw"
            className={`object-cover ${heroImagePosition}`}
          />
          {/* Smooth multi-stage ivory gradient overlay seamlessly blending the photo into the background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F7F5F0] via-[#F7F5F0]/80 via-35% to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#F7F5F0] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#F7F5F0] to-transparent pointer-events-none" />
        </div>

        {/* Content Container */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-20 w-full z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-6 lg:pr-6">
              {/* Main Headline from CMS / PostgreSQL */}
              <h1 className="text-[38px] sm:text-[44px] lg:text-[48px] font-semibold text-[#172B46] tracking-tight leading-[1.15]">
                {heroHeading}
              </h1>

              {/* Supporting Subhead & Text from CMS / PostgreSQL */}
              <div className="space-y-3 max-w-xl">
                <p className="text-[17px] sm:text-[19px] text-[#172B46] font-medium leading-snug">
                  {heroSubheading}
                </p>

                {narrativeParagraphs.length > 0 &&
                  narrativeParagraphs.map((para, i) => (
                    <p key={i} className="text-[15px] sm:text-[16px] text-[#172B46]/80 font-normal leading-relaxed">
                      {para}
                    </p>
                  ))}
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href={heroCtaUrl}
                  className="inline-flex items-center justify-center gap-2 bg-[#172B46] text-[#FFFFFF] hover:bg-[#B08D57] px-7 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm group"
                >
                  <span>{heroCtaText}</span>
                  <ArrowRight className="w-4 h-4 text-[#C9A975] group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 border border-[#172B46] bg-transparent hover:bg-[#172B46] text-[#172B46] hover:text-[#FFFFFF] px-7 py-3.5 rounded-sm text-xs font-semibold tracking-wider transition-all duration-300"
                >
                  Explore Our Solutions
                </Link>
              </div>
            </div>

            {/* Mobile & Tablet Full-Width Photographic Display */}
            <div className="block lg:hidden w-full pt-4">
              <div className="relative w-full h-[280px] sm:h-[380px] overflow-hidden rounded-sm border border-[#E5DFD5]">
                <Image
                  src={heroImageUrl}
                  alt={heroImageAlt}
                  fill
                  priority
                  sizes="100vw"
                  className={`object-cover ${heroImagePosition}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#F7F5F0] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#F7F5F0] via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE VANTAGE WEALTH PHILOSOPHY: PROTECT. PERFORM. PRESERVE. */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <SectionKicker align="center" textColor="#B08D57">
              THE VANTAGE WEALTH PHILOSOPHY
            </SectionKicker>

            <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight leading-[1.2]">
              Protect. Perform. Preserve.
            </h2>

            <p className="text-[16px] text-[#172B46]/80 font-normal leading-relaxed">
              Financial well-being is about more than building wealth. It is about protecting what matters, making your capital work towards your goals and ensuring your wealth supports your future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Protect */}
            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-8 space-y-4 hover:border-[#B08D57] transition-all hover:shadow-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                  <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="text-xs uppercase font-bold tracking-widest text-[#B08D57]">
                  Principle 01
                </div>
                <h3 className="text-[20px] font-semibold text-[#172B46] leading-snug">
                  PROTECT — Safeguard What Matters
                </h3>
                <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                  Identify financial risks and explore suitable insurance solutions to protect your family, lifestyle and financial commitments.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E5DFD5]/60 text-xs font-semibold text-[#172B46]">
                Life &bull; Health &bull; Liabilities &bull; Assets
              </div>
            </div>

            {/* Pillar 2: Perform */}
            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-8 space-y-4 hover:border-[#B08D57] transition-all hover:shadow-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                  <TrendingUp className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="text-xs uppercase font-bold tracking-widest text-[#B08D57]">
                  Principle 02
                </div>
                <h3 className="text-[20px] font-semibold text-[#172B46] leading-snug">
                  PERFORM — Make Your Capital Work
                </h3>
                <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                  Explore investment opportunities, optimise financing structures and make informed tax decisions aligned with your financial objectives.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E5DFD5]/60 text-xs font-semibold text-[#172B46]">
                Investments &bull; Financing &bull; Tax Planning
              </div>
            </div>

            {/* Pillar 3: Preserve */}
            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-8 space-y-4 hover:border-[#B08D57] transition-all hover:shadow-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-sm bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                  <Sprout className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="text-xs uppercase font-bold tracking-widest text-[#B08D57]">
                  Principle 03
                </div>
                <h3 className="text-[20px] font-semibold text-[#172B46] leading-snug">
                  PRESERVE — Secure Your Financial Future
                </h3>
                <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                  Plan for retirement, sustain financial independence and keep your financial strategy aligned with changing needs.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E5DFD5]/60 text-xs font-semibold text-[#172B46]">
                Retirement &bull; Continuity &bull; Portfolio Reviews
              </div>
            </div>
          </div>

          <div className="text-center pt-10">
            <Link
              href="/philosophy"
              className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-7 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all shadow-sm group"
            >
              <span>Discover Our 3P Philosophy</span>
              <ArrowRight className="w-4 h-4 text-[#C9A975] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. OUR FINANCIAL SOLUTIONS (6 Connected Solutions Grid) */}
      <section className="py-16 sm:py-20 bg-[#F7F5F0] border-b border-[#E5DFD5]" id="solutions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <SectionKicker align="center" textColor="#B08D57">
              OUR FINANCIAL SOLUTIONS
            </SectionKicker>

            <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight leading-[1.2]">
              A Connected Approach to Your Financial Needs.
            </h2>

            <p className="text-[16px] text-[#172B46]/80 font-normal max-w-2xl mx-auto leading-relaxed">
              Your financial decisions are interconnected. Investment choices influence taxation, borrowing affects liquidity, and protection needs influence long-term financial security. Vantage Wealth brings these elements together through an integrated suite of financial solutions.
            </p>
          </div>

          <Suspense fallback={<HomeServicesFallback />}>
            <HomeServicesGrid />
          </Suspense>
        </div>
      </section>

      {/* 4. WHY AN INTEGRATED FINANCIAL APPROACH MATTERS */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-5 space-y-4">
              <SectionKicker linePosition="left" textColor="#B08D57">
                WHY AN INTEGRATED FINANCIAL APPROACH MATTERS
              </SectionKicker>

              <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight leading-[1.2]">
                Your Financial Decisions Should Work Together.
              </h2>

              <p className="text-[16px] text-[#172B46]/80 font-normal leading-relaxed">
                A financial decision rarely exists in isolation. Your investments, insurance, borrowing, taxes and retirement plans influence one another.
              </p>

              <p className="text-[15px] text-[#172B46]/75 font-normal leading-relaxed">
                By evaluating each financial choice through an integrated lens, Vantage Wealth helps you avoid conflicting allocations, eliminate unnecessary fee drag, and maintain complete alignment with your life goals.
              </p>

              <div className="pt-2">
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 border border-[#B08D57] bg-[#FFFFFF] hover:bg-[#B08D57] text-[#172B46] hover:text-[#FFFFFF] px-6 py-3 rounded-sm text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-2xs group"
                >
                  <span>Request a Strategy Session</span>
                  <ArrowRight className="w-4 h-4 text-[#B08D57] group-hover:text-[#FFFFFF] group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* Right Checklist (7 Integration Pillars) */}
            <div className="lg:col-span-7 bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm p-7 sm:p-9 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B08D57] pb-2 border-b border-[#E5DFD5]">
                An integrated approach helps you:
              </div>

              <div className="space-y-3.5">
                {[
                  "Understand your overall financial position.",
                  "Identify investment overlaps and concentration risks.",
                  "Evaluate financial protection requirements.",
                  "Consider tax implications when making financial decisions.",
                  "Manage borrowing and liquidity more effectively.",
                  "Prepare for retirement and long-term financial needs.",
                  "Review and realign your strategy as circumstances change.",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#B08D57] text-[#FFFFFF] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[14px] sm:text-[15px] font-medium text-[#172B46]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. OUR COMMITMENT & CTA */}
      <section className="bg-[#172B46] text-[#FFFFFF] py-14 sm:py-18 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2">
              <span className="w-6 h-[1px] bg-[#C9A975]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A975]">
                Our Commitment
              </span>
              <span className="w-6 h-[1px] bg-[#C9A975]" />
            </div>

            <h2 className="text-[28px] sm:text-[32px] lg:text-[36px] font-semibold text-[#FFFFFF] tracking-tight leading-[1.2]">
              Protect What Matters. Perform with Purpose. Preserve for the Future.
            </h2>

            <p className="text-[15px] sm:text-[16px] text-[#F7F5F0]/85 font-normal leading-relaxed">
              We believe effective financial solutions begin with understanding your needs. Our aim is to simplify complex financial decisions, facilitate access to suitable financial solutions and build enduring relationships founded on trust, transparency and a long-term perspective.
            </p>

            <div className="pt-3">
              <Link
                href="/consultation"
                className="inline-flex items-center gap-2.5 bg-[#B08D57] hover:bg-[#9B7A46] text-[#FFFFFF] px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm group"
              >
                <Calendar className="w-4 h-4 text-[#FFFFFF]" />
                <span>Start a Conversation</span>
                <ArrowRight className="w-4 h-4 text-[#FFFFFF] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
