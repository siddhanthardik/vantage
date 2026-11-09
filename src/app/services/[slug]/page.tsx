import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { permanentRedirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Target,
  Layers,
  Users,
  Compass,
  Sprout,
  Key,
  Briefcase,
  Lock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Home,
  GraduationCap,
  Armchair,
  ClipboardList,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import SectionKicker from "@/components/ui/SectionKicker";
import CtaBanner from "@/components/ui/CtaBanner";
import {
  getServiceBySlug,
  getPublishedServices,
  SLUG_REDIRECTS,
} from "@/server/repositories/serviceRepository";
import { ServiceItem } from "@/types/service";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.trim().toLowerCase();

  // If this is a legacy redirected slug, fallback to generic or let redirect handle
  const redirectTarget = SLUG_REDIRECTS[cleanSlug];
  if (redirectTarget) {
    return {
      title: "Service Redirect | Vantage Wealth",
      description: "Redirecting to canonical wealth management service.",
    };
  }

  let service: ServiceItem | null = null;
  try {
    service = await getServiceBySlug(cleanSlug);
  } catch {
    return {
      title: "Service Unavailable | Vantage Wealth",
      description: "Wealth management service details currently unavailable.",
    };
  }

  if (!service || service.status !== "PUBLISHED") {
    return {
      title: "Service Not Found | Vantage Wealth",
      description: "The requested financial service could not be found.",
    };
  }

  return {
    title: service.seoTitle || `${service.title} | Vantage Wealth`,
    description: service.seoDescription || service.shortDesc,
    alternates: {
      canonical: `/services/${service.slug}`,
    },
    openGraph: {
      title: service.seoTitle || service.title,
      description: service.seoDescription || service.shortDesc,
      url: `/services/${service.slug}`,
      images: service.ogImage ? [{ url: service.ogImage }] : undefined,
    },
  };
}

// Icon resolver
function resolveIcon(iconName?: string | null) {
  switch (iconName) {
    case "Target":
      return Target;
    case "Layers":
      return Layers;
    case "TrendingUp":
    case "LineChart":
      return TrendingUp;
    case "ShieldCheck":
    case "Lock":
      return ShieldCheck;
    case "User":
    case "Users":
      return Users;
    case "Compass":
      return Compass;
    case "Sprout":
      return Sprout;
    case "Key":
      return Key;
    case "Briefcase":
      return Briefcase;
    case "GraduationCap":
      return GraduationCap;
    case "Home":
      return Home;
    case "Armchair":
      return Armchair;
    default:
      return CheckCircle2;
  }
}

/**
 * Visually appropriate loading skeleton matching the service page structure.
 * Rendered by the static shell during Cache Components prerendering.
 */
function ServiceLoadingSkeleton() {
  return (
    <div className="min-h-[70vh] bg-[#FFFFFF] animate-pulse">
      <div className="bg-[#F7F5F0] border-b border-[#E5DFD5] pt-6 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="h-4 w-40 bg-[#E5DFD5] rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-2">
            <div className="lg:col-span-6 space-y-4">
              <div className="h-10 w-3/4 bg-[#E5DFD5] rounded" />
              <div className="h-4 w-full bg-[#E5DFD5]/70 rounded" />
              <div className="h-4 w-2/3 bg-[#E5DFD5]/70 rounded" />
              <div className="h-10 w-48 bg-[#E5DFD5] rounded mt-4" />
            </div>
            <div className="lg:col-span-6 h-[320px] sm:h-[400px] bg-[#E5DFD5] rounded-sm" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <div className="h-6 w-48 bg-[#E5DFD5] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-[#F7F5F0] border border-[#E5DFD5] rounded-sm p-4 space-y-3">
              <div className="w-8 h-8 rounded-full bg-[#E5DFD5]" />
              <div className="h-4 w-24 bg-[#E5DFD5]" />
              <div className="h-3 w-full bg-[#E5DFD5]/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Asynchronous child Server Component executed under Suspense.
 * Resolves params and fetches service data inside the Suspense boundary.
 */
async function DynamicServiceContent({ params }: ServicePageProps) {
  const { slug } = await params;
  const cleanSlug = slug.trim().toLowerCase();

  // Permanent 308 redirect for retired service URLs
  const redirectTarget = SLUG_REDIRECTS[cleanSlug];
  if (redirectTarget) {
    permanentRedirect(redirectTarget);
  }

  let service: ServiceItem | null = null;
  let allPublished: ServiceItem[] = [];

  try {
    [service, allPublished] = await Promise.all([
      getServiceBySlug(cleanSlug),
      getPublishedServices(),
    ]);
  } catch (err) {
    console.error("Database connection failure loading service:", err);
    return (
      <div className="min-h-[70vh] bg-[#F7F5F0] py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl mx-auto text-center space-y-6 bg-[#FFFFFF] p-10 rounded-sm border border-[#E5DFD5] shadow-lg">
          <div className="inline-block p-3 rounded-full bg-red-100 text-red-600">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#172B46]">
            Service Information Unavailable
          </h1>
          <p className="text-sm text-[#172B46]/75 font-light leading-relaxed">
            We are currently unable to reach the database to retrieve this service. Please check back shortly or contact our team directly.
          </p>
          <div className="pt-4 border-t border-[#E5DFD5]">
            <Link
              href="/contact"
              className="text-xs font-bold uppercase tracking-wider text-[#B08D57] hover:underline"
            >
              Contact Advisory Team &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If service does not exist or is not published in PostgreSQL, trigger genuine 404
  if (!service || service.status !== "PUBLISHED") {
    notFound();
  }

  const heroImg =
    service.heroImage ||
    service.thumbnailImage ||
    "/images/services/investment-advisory-hero.png";

  const benefits = service.benefits && service.benefits.length > 0 ? service.benefits : [
    { title: "Goal-Oriented", description: "Invest with a clear purpose and measurable outcomes.", icon: "Target" },
    { title: "Diversified Portfolios", description: "Balance risk and returns across asset classes.", icon: "Layers" },
    { title: "Research-Backed", description: "Insights driven by market research and macroeconomic analysis.", icon: "TrendingUp" },
    { title: "Personalised Advice", description: "Solutions aligned to your risk profile and life goals.", icon: "User" },
  ];

  const features = service.features && service.features.length > 0 ? service.features : [
    { title: "Child's Education", description: "Build a fund for quality education and a brighter future.", image: "/images/services/wealth-protection.png", icon: "GraduationCap" },
    { title: "Dream Home", description: "Plan and invest for your own home.", image: "/images/services/loans.png", icon: "Home" },
    { title: "Comfortable Retirement", description: "Create a steady and independent income for your golden years.", image: "/images/services/retirement-bench.png", icon: "Armchair" },
    { title: "Life Goals", description: "Be financially ready for the experiences that matter to you.", image: "/images/services/family-wealth-legacy.png", icon: "Compass" },
    { title: "Long-Term Wealth", description: "Grow, preserve and pass on your wealth across generations with confidence.", image: "/images/services/investment-advisory.png", icon: "Sprout" },
  ];

  const processSteps = service.processSteps && service.processSteps.length > 0 ? service.processSteps : [
    { step: 1, title: "Understand", description: "Your goals, financial situation and risk profile." },
    { step: 2, title: "Plan", description: "Design a personalised investment strategy." },
    { step: 3, title: "Invest", description: "Build and implement a diversified portfolio." },
    { step: 4, title: "Review", description: "Monitor, rebalance and keep you on track." },
  ];

  // Related Services (excluding current)
  const relatedServices = allPublished.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <div className="relative bg-[#FFFFFF] overflow-x-hidden">
      {/* 1. BREADCRUMB & HERO SECTION */}
      <section className="bg-gradient-to-b from-[#F7F5F0] to-[#FFFFFF] border-b border-[#E5DFD5] pt-6 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-[#172B46]/60 font-medium">
            <Link href="/" className="hover:text-[#B08D57] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#B08D57]" />
            <Link href="/services" className="hover:text-[#B08D57] transition-colors">
              Our Services
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#B08D57]" />
            <span className="text-[#172B46] font-semibold">{service.title}</span>
          </nav>

          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-2">
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-start gap-4">
                <span className="w-1.5 h-16 bg-[#B08D57] shrink-0 mt-1" />
                <h1 className="text-[36px] sm:text-[42px] lg:text-[48px] font-semibold text-[#172B46] tracking-tight leading-[1.12]">
                  {service.heroHeading || service.title}
                </h1>
              </div>

              <p className="text-[16px] sm:text-[18px] text-[#172B46]/80 font-normal leading-relaxed max-w-xl">
                {service.heroSubtext || service.shortDesc}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href={service.ctaButtonUrl || "/consultation"}
                  className="inline-flex items-center justify-center gap-2 bg-[#B08D57] hover:bg-[#9B7A46] text-[#FFFFFF] px-7 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xs group"
                >
                  <span>{service.ctaButtonText || "Book a Consultation"}</span>
                  <ArrowRight className="w-4 h-4 text-[#FFFFFF] group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 border border-[#172B46] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#172B46] px-6 py-3.5 rounded-sm text-xs font-semibold tracking-wider transition-colors"
                >
                  <FileText className="w-4 h-4 text-[#B08D57]" />
                  <span>Download Service Brochure</span>
                </Link>
              </div>
            </div>

            {/* Right Hero Photographic Element */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full h-[320px] sm:h-[400px] rounded-sm overflow-hidden shadow-xl border border-[#E5DFD5]">
                <Image
                  src={heroImg}
                  alt={service.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY THIS SERVICE MATTERS / THE VANTAGE ADVANTAGE */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4 lg:pr-8 lg:border-r lg:border-[#E5DFD5]">
              <SectionKicker linePosition="right" textColor="#B08D57">
                THE VANTAGE ADVANTAGE
              </SectionKicker>

              <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight leading-[1.18]">
                Why {service.title}?
              </h2>

              <p className="text-[16px] text-[#172B46]/75 font-normal leading-relaxed">
                {service.fullDesc ||
                  "A disciplined and research-driven approach to help you grow your wealth with clarity, confidence and a long-term perspective."}
              </p>
            </div>

            {/* Benefits Grid (2x2) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {benefits.map((b, idx) => {
                const BenefitIcon = resolveIcon(b.icon);
                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center shrink-0 text-[#B08D57]">
                      <BenefitIcon className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#172B46]">
                        {b.title}
                      </h3>
                      <p className="text-[14px] text-[#172B46]/70 font-normal leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY GOALS (5-Column Desktop Cards matching Reference 4) */}
      <section className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Heading with Decorative Gold Lines */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center gap-3">
              <span className="w-8 h-[1px] bg-[#B08D57]" />
              <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight">
                We Help You Achieve Life&apos;s Key Goals
              </h2>
              <span className="w-8 h-[1px] bg-[#B08D57]" />
            </div>
          </div>

          {/* 5 Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {features.map((feat, idx) => {
              const FeatureIcon = resolveIcon(feat.icon);
              return (
                <div
                  key={idx}
                  className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm overflow-hidden flex flex-col justify-between hover:border-[#B08D57] hover:shadow-md transition-all group"
                >
                  {feat.image && (
                    <div className="relative w-full h-36 bg-[#F7F5F0] overflow-hidden">
                      <Image
                        src={feat.image}
                        alt={feat.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5 space-y-2.5">
                    <div className="text-[#B08D57]">
                      <FeatureIcon className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#172B46] leading-snug">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#172B46]/70 font-light leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. OUR INVESTMENT PROCESS (Horizontal 4 Steps matching Reference 4) */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Title & Description */}
            <div className="lg:col-span-4 space-y-3">
              <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight">
                Our Investment
                <br />
                Process
              </h2>
              <p className="text-[15px] text-[#172B46]/75 font-normal leading-relaxed">
                A simple, transparent and client-centric approach to wealth creation.
              </p>
            </div>

            {/* Right Horizontal Process Flow */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
              {processSteps.map((step, idx) => {
                const stepIcons = [Target, ClipboardList, BarChart3, RotateCcw];
                const StepIcon = stepIcons[idx % stepIcons.length];

                return (
                  <div key={idx} className="flex flex-col items-start space-y-3 relative group">
                    {/* Icon Circle */}
                    <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#B08D57]/40 flex items-center justify-center text-[#B08D57] group-hover:bg-[#B08D57] group-hover:text-[#FFFFFF] transition-colors">
                      <StepIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-[#172B46]">
                        {step.step || idx + 1}. {step.title}
                      </h3>
                      <p className="text-xs text-[#172B46]/70 font-light leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Step indicator arrow */}
                    {idx < processSteps.length - 1 && (
                      <div className="hidden md:block absolute -right-3 top-4 text-[#B08D57]/50">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. RELATED SERVICES */}
      {relatedServices.length > 0 && (
        <section className="py-14 sm:py-16 bg-[#FAF8F5] border-b border-[#E5DFD5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#B08D57]">
                  Explore Adjacent Disciplines
                </span>
                <h3 className="text-[22px] sm:text-[24px] font-semibold text-[#172B46]">
                  Related Wealth Services
                </h3>
              </div>
              <Link
                href="/services"
                className="text-xs font-bold uppercase tracking-wider text-[#B08D57] hover:underline"
              >
                All Services &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedServices.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/services/${rel.slug}`}
                  className="bg-[#FFFFFF] border border-[#E5DFD5] p-6 rounded-sm hover:border-[#B08D57] hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <h4 className="text-base font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-[#172B46]/70 font-light leading-relaxed line-clamp-2">
                      {rel.shortDesc}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. BOTTOM CTA BANNER matching Reference 4 */}
      <CtaBanner
        title={service.ctaHeading || `Let's Build Your ${service.title} Plan`}
        description="Talk to our advisors and get a personalised financial roadmap for your family goals."
        buttonText={service.ctaButtonText || "Book a Consultation"}
        buttonHref={service.ctaButtonUrl || "/consultation"}
      />
    </div>
  );
}

/**
 * DynamicServicePage is a synchronous Server Component.
 * Under Cache Components, params is passed directly into a <Suspense> boundary.
 * Next.js prerenders the static shell using ServiceLoadingSkeleton while dynamic service
 * content, PostgreSQL queries, and published checks stream in at request time.
 */
export default function DynamicServicePage({ params }: ServicePageProps) {
  return (
    <Suspense fallback={<ServiceLoadingSkeleton />}>
      <DynamicServiceContent params={params} />
    </Suspense>
  );
}
