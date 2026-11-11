import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ShieldCheck,
  TrendingUp,
  Award,
  ArrowRight,
  Eye,
  Compass,
  Users,
  Scale,
  Sprout,
  Gem,
  Handshake,
  Calendar,
  Clock,
  Mail,
} from "lucide-react";
import { LinkedinIcon } from "@/components/ui/icons";
import CtaBanner from "@/components/ui/CtaBanner";
import { getFounderProfile, getPublishedTeamMembers, formatExperience } from "@/server/repositories/teamRepository";

export const metadata: Metadata = {
  title: "About Us | Vantage Wealth",
  description:
    "Discover Vantage Wealth: a boutique wealth management firm built on clarity, fiduciary discipline, and multi-generational stewardship.",
};

/**
 * Static placeholder skeleton for Founder & Team sections during streaming
 */
function FounderAndTeamFallback() {
  return (
    <div className="py-16 sm:py-20 bg-[#F7F5F0] border-b border-[#E5DFD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md h-[340px] sm:h-[400px] rounded-tl-3xl rounded-br-3xl overflow-hidden shadow-xl border-2 border-[#B08D57]/40 bg-[#FFFFFF]">
              <Image
                src="/images/about/founder-vineet-gupta.png"
                alt="Mr. Vineet Gupta"
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-cover object-top"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#B08D57]">
              Our Founder
            </span>
            <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight">
              Mr. Vineet Gupta
            </h2>
            <div className="text-xs uppercase font-bold tracking-widest text-[#B08D57] pb-2">
              Founder &amp; Principal Advisor
            </div>
            <div className="border-l-2 border-[#B08D57] pl-5 py-1 space-y-3">
              <p className="text-[15px] sm:text-[16px] text-[#172B46]/85 font-normal leading-relaxed">
                Vineet Gupta is the founder of Vantage Wealth with a deep passion for helping individuals and families achieve their financial goals. With a strong foundation in financial markets and wealth advisory, he brings a disciplined, long-term and client-centric approach to wealth management.
              </p>
              <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                Under his leadership, Vantage Wealth operates with uncompromising integrity, ensuring that each portfolio architecture is custom-tailored to the specific risk parameters, liquidity requirements, and multi-generational vision of the families we advise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Asynchronous Server Component rendering Founder Narrative and Public Team Grid
 */
async function FounderAndTeamContent() {
  const founder = await getFounderProfile();
  const teamMembers = await getPublishedTeamMembers();

  const founderName = founder?.name || "Mr. Vineet Gupta";
  const founderDesignation = founder?.designation || "Founder & Principal Advisor";
  const founderPhoto = founder?.photoUrl || "/images/about/founder-vineet-gupta.png";
  const founderBio =
    founder?.bio ||
    "Vineet Gupta is the founder of Vantage Wealth with a deep passion for helping individuals and families achieve their financial goals. With a strong foundation in financial markets and wealth advisory, he brings a disciplined, long-term and client-centric approach to wealth management.\n\nUnder his leadership, Vantage Wealth operates with uncompromising integrity, ensuring that each portfolio architecture is custom-tailored to the specific risk parameters, liquidity requirements, and multi-generational vision of the families we advise.";

  return (
    <>
      {/* 4. FOUNDER PROFILE: MR. VINEET GUPTA */}
      <section className="py-16 sm:py-20 bg-[#F7F5F0] border-b border-[#E5DFD5] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column: Portrait */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md h-[340px] sm:h-[400px] rounded-tl-3xl rounded-br-3xl overflow-hidden shadow-xl border-2 border-[#B08D57]/40 bg-[#FFFFFF]">
                <Image
                  src={founderPhoto}
                  alt={`${founderName} - ${founderDesignation}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover object-top"
                />
              </div>
            </div>

            {/* Right Column: Founder Profile Narrative */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#B08D57]">
                Our Founder
              </span>

              <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight">
                {founderName}
              </h2>

              <div className="flex flex-wrap items-center gap-3 pb-2">
                <div className="text-xs uppercase font-bold tracking-widest text-[#B08D57]">
                  {founderDesignation}
                </div>

                {founder?.experienceYears && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#172B46]/70 bg-[#172B46]/5 px-2.5 py-0.5 rounded-xs">
                    <Clock className="w-3 h-3 text-[#B08D57]" /> {formatExperience(founder.experienceYears)}
                  </span>
                )}

                {founder?.credentials && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B08D57] bg-[#B08D57]/10 px-2.5 py-0.5 rounded-xs">
                    <Award className="w-3 h-3 text-[#B08D57]" /> {founder.credentials}
                  </span>
                )}
              </div>

              {/* Founder Bio Narrative */}
              <div className="border-l-2 border-[#B08D57] pl-5 py-1 space-y-3">
                {founderBio.split("\n\n").map((para, i) => (
                  <p key={i} className="text-[15px] sm:text-[16px] text-[#172B46]/85 font-normal leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs group"
                >
                  <span>Connect with Our Advisory Team</span>
                  <ArrowRight className="w-4 h-4 text-[#C9A975] group-hover:translate-x-1 transition-transform" />
                </Link>

                {founder?.linkedInUrl && (
                  <a
                    href={founder.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-[#E5DFD5] bg-[#FFFFFF] hover:bg-[#F7F5F0] text-[#172B46] px-4 py-3 rounded-sm text-xs font-semibold transition-colors"
                  >
                    <LinkedinIcon className="w-4 h-4 text-[#0A66C2]" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5 OUR TEAM SECTION (Immediately below Founder and before Our Values) */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-b border-[#E5DFD5] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#B08D57]" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#B08D57]">
                Our Team
              </span>
              <span className="w-8 h-[1px] bg-[#B08D57]" />
            </div>

            <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight">
              Advisory Leadership &amp; Specialists
            </h2>

            <p className="text-[15px] sm:text-[16px] text-[#172B46]/75 font-normal max-w-2xl mx-auto leading-relaxed">
              Our multidisciplinary team brings institutional discipline, deep market perspective, and bespoke client attention to every family portfolio.
            </p>
          </div>

          {/* Team Cards Grid or Refined Empty State */}
          {teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm hover:border-[#B08D57] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Portrait Photo Container */}
                    <div className="relative w-full h-72 sm:h-80 bg-[#F7F5F0] overflow-hidden">
                      {member.photoUrl ? (
                        <Image
                          src={member.photoUrl}
                          alt={member.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover object-top group-hover:scale-102 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#B08D57]/40">
                          <Users className="w-16 h-16 stroke-1" />
                        </div>
                      )}

                      {/* LinkedIn overlay on hover */}
                      {member.linkedInUrl && (
                        <div className="absolute inset-0 bg-gradient-to-t from-[#172B46]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <a
                            href={member.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] text-[#172B46] text-xs font-bold rounded-xs shadow-sm hover:text-[#0A66C2] transition-colors"
                          >
                            <LinkedinIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                            <span>LinkedIn Profile</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Member Details */}
                    <div className="p-7 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#B08D57]">
                          {member.designation}
                        </span>
                        {member.experienceYears && (
                          <span className="text-[10px] font-semibold text-[#172B46]/60">
                            {formatExperience(member.experienceYears)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors">
                        {member.name}
                      </h3>

                      {member.credentials && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B08D57] bg-[#B08D57]/10 px-2 py-0.5 rounded-xs">
                          <Award className="w-3 h-3 text-[#B08D57]" /> {member.credentials}
                        </div>
                      )}

                      <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed line-clamp-4">
                        {member.bio}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  {member.email && (
                    <div className="p-7 pt-0 border-t border-[#E5DFD5]/60 flex items-center text-xs text-[#172B46]/70 mt-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-light">
                        <Mail className="w-3.5 h-3.5 text-[#B08D57]" /> {member.email}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Refined public layout when no secondary team members are published yet */
            <div className="max-w-2xl mx-auto text-center p-8 sm:p-10 bg-[#F7F5F0] border border-[#E5DFD5] rounded-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#FFFFFF] border border-[#B08D57]/30 flex items-center justify-center mx-auto text-[#B08D57]">
                <Users className="w-6 h-6 stroke-[1.25]" />
              </div>
              <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#172B46]">
                Bespoke Advisory Consortia
              </h3>
              <p className="text-xs sm:text-sm text-[#172B46]/75 font-light leading-relaxed max-w-lg mx-auto">
                Our client engagements are steered directly by our Founder alongside an elite network of chartered tax specialists, estate attorneys, and institutional custodian partners.
              </p>
              <div className="pt-2">
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 border border-[#B08D57] bg-[#B08D57] hover:bg-[#C9A975] text-[#172B46] px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                >
                  <span>Schedule Advisory Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#172B46]" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function AboutPage() {
  return (
    <div className="relative bg-[#FFFFFF] overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative w-full bg-[#F7F5F0] border-b border-[#E5DFD5] py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Section Tag */}
              <div className="inline-flex items-center gap-2.5">
                <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#B08D57]">
                  About Vantage Wealth
                </span>
                <span className="w-8 h-[1px] bg-[#B08D57]" />
              </div>

              <h1 className="text-[38px] sm:text-[44px] lg:text-[48px] font-semibold text-[#172B46] tracking-tight leading-[1.15]">
                A More Connected Approach <br className="hidden sm:inline" />
                to Financial Solutions<span className="text-[#B08D57]">.</span>
              </h1>

              <div className="space-y-3 text-[15px] sm:text-[16px] text-[#172B46]/80 font-normal leading-relaxed max-w-xl">
                <p>
                  Vantage Wealth is an integrated financial solutions firm focused on helping individuals and families navigate their financial journeys with greater clarity and confidence.
                </p>
                <p>
                  We bring together investment solutions, risk management, strategic financing, tax advisory and retirement planning within a coordinated financial framework.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 bg-[#172B46] hover:bg-[#B08D57] text-[#FFFFFF] px-7 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all shadow-sm group"
                >
                  <span>Book a Consultation</span>
                  <ArrowRight className="w-4 h-4 text-[#C9A975] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Architectural Photograph */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[440px] rounded-sm overflow-hidden shadow-lg border border-[#E5DFD5]/80">
                <Image
                  src="/images/about/vantage-headquarters.png"
                  alt="Vantage Wealth Architectural Office"
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

      {/* 2. WHO WE ARE & OUR APPROACH */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#B08D57]">
                Connected Solutions
              </span>
              <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight">
                Our Approach &amp; Commitment
              </h2>
              <p className="text-[16px] text-[#172B46]/80 font-normal leading-relaxed">
                Our approach recognises that financial decisions are interconnected. Building wealth, protecting financial interests, managing liabilities and preparing for the future all contribute to long-term financial well-being.
              </p>
              <p className="text-[16px] text-[#172B46]/80 font-normal leading-relaxed">
                Guided by our Protect, Perform and Preserve philosophy, we aim to help clients make informed choices based on their financial circumstances, priorities and aspirations.
              </p>

              <div className="pt-2">
                <Link
                  href="/philosophy"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B08D57] hover:underline"
                >
                  <span>Explore Our 3P Philosophy in Depth</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right 3 Core Philosophy Blocks */}
            <div className="lg:col-span-6 space-y-6 lg:pl-6">
              {/* Our Approach */}
              <div className="flex items-start gap-4 p-5 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5]">
                <div className="p-2.5 bg-[#FFFFFF] rounded-sm text-[#B08D57] shrink-0 border border-[#E5DFD5]">
                  <Compass className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[18px] font-semibold text-[#172B46]">
                    Our Approach
                  </h3>
                  <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                    We believe every financial journey is different. Rather than viewing financial products in isolation, we focus on understanding the broader financial picture and exploring solutions that work together.
                  </p>
                </div>
              </div>

              {/* Our Philosophy */}
              <div className="flex items-start gap-4 p-5 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5]">
                <div className="p-2.5 bg-[#FFFFFF] rounded-sm text-[#B08D57] shrink-0 border border-[#E5DFD5]">
                  <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-[18px] font-semibold text-[#172B46]">
                    Our Philosophy: Protect. Perform. Preserve.
                  </h3>
                  <ul className="space-y-1 text-[13px] text-[#172B46]/80 font-normal list-disc pl-4">
                    <li>Protect your family, assets and financial commitments.</li>
                    <li>Perform by putting your capital to work through informed investment and financing decisions.</li>
                    <li>Preserve your accumulated wealth and prepare for long-term financial independence.</li>
                  </ul>
                </div>
              </div>

              {/* Our Commitment */}
              <div className="flex items-start gap-4 p-5 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5]">
                <div className="p-2.5 bg-[#FFFFFF] rounded-sm text-[#B08D57] shrink-0 border border-[#E5DFD5]">
                  <Handshake className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[18px] font-semibold text-[#172B46]">
                    Our Commitment
                  </h3>
                  <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                    We aim to deliver a thoughtful, transparent and client-focused experience, helping individuals make financial decisions with greater understanding and purpose.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISION & MISSION BANNER */}
      <section className="bg-[#172B46] text-[#FFFFFF] relative overflow-hidden py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 divide-y md:divide-y-0 md:divide-x md:divide-[#B08D57]/30">
            {/* Vision */}
            <div className="space-y-4 pr-0 md:pr-8">
              <div className="flex items-center gap-2 text-[#C9A975]">
                <Eye className="w-6 h-6 stroke-[1.5]" />
                <span className="text-xs uppercase font-bold tracking-[0.2em]">
                  Our Vision
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-[1.75rem] font-semibold text-[#FFFFFF] leading-snug">
                To be a trusted wealth partner that helps people create financial freedom and a lasting legacy.
              </h3>
            </div>

            {/* Mission */}
            <div className="space-y-4 pt-8 md:pt-0 pl-0 md:pl-8">
              <div className="flex items-center gap-2 text-[#C9A975]">
                <Compass className="w-6 h-6 stroke-[1.5]" />
                <span className="text-xs uppercase font-bold tracking-[0.2em]">
                  Our Mission
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-[1.75rem] font-semibold text-[#FFFFFF] leading-snug">
                To deliver personalised, objective and holistic wealth solutions with clarity, discipline and a client-first approach.
              </h3>
            </div>
          </div>
        </div>

        {/* Alpine Mountain Background Overlay on Right */}
        <div className="absolute inset-y-0 right-0 w-2/5 opacity-20 pointer-events-none hidden sm:block">
          <Image
            src="/images/home/roadmap-banner.png"
            alt="Alpine background"
            fill
            sizes="40vw"
            className="object-cover object-right"
          />
        </div>
      </section>

      {/* 4 & 4.5 DYNAMIC FOUNDER & TEAM SECTIONS */}
      <Suspense fallback={<FounderAndTeamFallback />}>
        <FounderAndTeamContent />
      </Suspense>

      {/* 5. CORE VALUES */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#B08D57]" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#B08D57]">
                Our Values
              </span>
              <span className="w-8 h-[1px] bg-[#B08D57]" />
            </div>

            <h2 className="text-[28px] sm:text-[32px] lg:text-[34px] font-semibold text-[#172B46] tracking-tight">
              The Principles That Guide Us
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#B08D57]/30">
            <div className="space-y-3 px-4 pt-4 sm:pt-0">
              <div className="flex justify-center text-[#B08D57]">
                <Users className="w-8 h-8 stroke-[1.25]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#172B46]">
                Trust
              </h3>
              <p className="text-[14px] text-[#172B46]/70 font-normal leading-relaxed">
                Building lasting relationships anchored in transparent communication and confidentiality.
              </p>
            </div>

            <div className="space-y-3 px-4 pt-4 sm:pt-0">
              <div className="flex justify-center text-[#B08D57]">
                <Scale className="w-8 h-8 stroke-[1.25]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#172B46]">
                Integrity
              </h3>
              <p className="text-[14px] text-[#172B46]/70 font-normal leading-relaxed">
                Always doing what is right for our clients, without exception or compromise.
              </p>
            </div>

            <div className="space-y-3 px-4 pt-4 sm:pt-0">
              <div className="flex justify-center text-[#B08D57]">
                <Sprout className="w-8 h-8 stroke-[1.25]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#172B46]">
                Discipline
              </h3>
              <p className="text-[14px] text-[#172B46]/70 font-normal leading-relaxed">
                Staying focused on long-term wealth horizons rather than fleeting market emotions.
              </p>
            </div>

            <div className="space-y-3 px-4 pt-4 sm:pt-0">
              <div className="flex justify-center text-[#B08D57]">
                <Gem className="w-8 h-8 stroke-[1.25]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#172B46]">
                Excellence
              </h3>
              <p className="text-[14px] text-[#172B46]/70 font-normal leading-relaxed">
                Delivering thoughtful, institutional-grade research and advisory execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONSULTATION CTA BANNER */}
      <CtaBanner
        title="Let's Build Your Wealth Journey Together"
        description="Talk to us for a personalised consultation and a clear plan for your goals."
        buttonText="Book a Consultation"
        buttonHref="/consultation"
      />
    </div>
  );
}
