import { Suspense } from "react";
import { Metadata } from "next";
import { ShieldCheck, Calendar, Clock, Award, Users, CheckCircle, Target } from "lucide-react";
import ConsultationForm from "@/components/forms/ConsultationForm";
import SectionKicker from "@/components/ui/SectionKicker";
import CtaBanner from "@/components/ui/CtaBanner";
import { getPublishedServices, getBusinessSettings } from "@/server/repositories/serviceRepository";

export const metadata: Metadata = {
  title: "Book a Confidential Consultation | Vantage Wealth",
  description:
    "Schedule a structured discovery session with a Vantage Wealth advisor. Personalized wealth strategies tailored to your aspirations.",
};

interface ConsultationPageProps {
  searchParams: Promise<{ service?: string }>;
}

async function ConsultationContent({ searchParams }: ConsultationPageProps) {
  const resolvedSearchParams = await searchParams;
  let services: any[] = [];
  let settings = {
    phone: "+91 98765 43210",
    email: "hello@vantagewealth.in",
    address: "New Delhi, India",
  };

  try {
    const [dbServices, dbSettings] = await Promise.all([
      getPublishedServices(),
      getBusinessSettings(),
    ]);
    services = dbServices;
    settings = dbSettings;
  } catch (err) {
    console.error("Database connection failure on consultation page:", err);
  }

  const serviceOptions = services.map((s) => ({
    slug: s.slug,
    title: s.title,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
      {/* Consultation Expectations */}
      <div className="lg:col-span-5 space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
            The Discovery Process
          </span>
          <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#172B46]">
            What to Expect
          </h2>
          <p className="text-sm font-light text-[#172B46]/75 leading-relaxed">
            Our initial consultation is designed to understand your life aspirations, current balance sheet structure, and family legacy objectives.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F7F5F0] flex items-center justify-center shrink-0 text-[#B08D57]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172B46]">
                1. Understand Your Financial Position
              </h4>
              <p className="text-xs text-[#172B46]/70 font-normal mt-1 leading-relaxed">
                Discuss your current financial arrangements, priorities and concerns.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F7F5F0] flex items-center justify-center shrink-0 text-[#B08D57]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172B46]">
                2. Identify Key Financial Needs
              </h4>
              <p className="text-xs text-[#172B46]/70 font-normal mt-1 leading-relaxed">
                Explore investment, protection, financing, tax and retirement-related requirements.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F7F5F0] flex items-center justify-center shrink-0 text-[#B08D57]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172B46]">
                3. Discuss Potential Solutions
              </h4>
              <p className="text-xs text-[#172B46]/70 font-normal mt-1 leading-relaxed">
                Understand relevant solutions and possible next steps based on your circumstances.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F7F5F0] flex items-center justify-center shrink-0 text-[#B08D57]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172B46]">
                4. Define the Way Forward
              </h4>
              <p className="text-xs text-[#172B46]/70 font-normal mt-1 leading-relaxed">
                Determine whether further assessment or engagement would be appropriate.
              </p>
            </div>
          </div>
        </div>

        {/* Direct Desk Information */}
        <div className="p-6 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172B46]">
            Prefer Direct Coordination?
          </h4>
          <p className="text-xs text-[#172B46]/70 font-light leading-relaxed">
            If you require an immediate appointment or private off-site arrangement, please contact our principal desk directly:
          </p>
          <div className="pt-1 text-xs space-y-1">
            <p className="text-[#172B46] font-medium">
              Phone:{" "}
              <a
                href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                className="hover:text-[#B08D57] transition-colors"
              >
                {settings.phone}
              </a>
            </p>
            <p className="text-[#172B46] font-medium">
              Email:{" "}
              <a
                href={`mailto:${settings.email}`}
                className="hover:text-[#B08D57] transition-colors"
              >
                {settings.email}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Booking Intake Form Component */}
      <div className="lg:col-span-7">
        <ConsultationForm
          services={serviceOptions}
          defaultServiceSlug={resolvedSearchParams?.service}
        />
      </div>
    </div>
  );
}

function ConsultationFallback() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start animate-pulse">
      <div className="lg:col-span-5 space-y-6">
        <div className="h-6 w-32 bg-[#E5DFD5]/60 rounded" />
        <div className="h-10 w-3/4 bg-[#E5DFD5] rounded" />
        <div className="h-20 bg-[#E5DFD5]/40 rounded" />
      </div>
      <div className="lg:col-span-7 h-96 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm" />
    </div>
  );
}

export default function ConsultationPage({ searchParams }: ConsultationPageProps) {
  return (
    <div className="relative bg-[#FFFFFF]">
      {/* Light Hero Section matching Unified Design System */}
      <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 border-b border-[#E5DFD5] bg-gradient-to-b from-[#FAF8F5] to-[#FFFFFF] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl space-y-4">
          <SectionKicker align="center" textColor="#B08D57">
            PRIVATE CONSULTATION
          </SectionKicker>

          <h1 className="text-[38px] sm:text-[44px] lg:text-[48px] font-semibold text-[#172B46] tracking-tight">
            A Conversation About Your <br className="hidden sm:inline" />
            Financial Priorities<span className="text-[#B08D57]">.</span>
          </h1>

          <p className="text-[16px] sm:text-[18px] text-[#172B46]/75 font-normal leading-relaxed max-w-2xl mx-auto">
            A meaningful financial conversation begins with understanding your current position, priorities and future aspirations. During an initial consultation, we aim to understand your requirements and explore how our integrated financial solutions may support your objectives.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<ConsultationFallback />}>
            <ConsultationContent searchParams={searchParams} />
          </Suspense>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <CtaBanner
        title="Prefer a Direct Phone Conversation?"
        description="Call our senior advisory desk directly to arrange an immediate introduction."
        buttonText="Call Advisory Desk"
        buttonHref="tel:+919876543210"
      />
    </div>
  );
}
