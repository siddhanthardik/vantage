import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, TrendingUp, Layers, Key, Sprout, Users, Briefcase } from "lucide-react";
import CtaBanner from "@/components/ui/CtaBanner";
import { getPublishedServices } from "@/server/repositories/serviceRepository";

export const metadata = {
  title: "Advisory Disciplines & Services | Vantage Wealth",
  description:
    "Explore our full suite of bespoke wealth disciplines: investment advisory, wealth protection, family legacy, retirement planning, strategic loans, and tax planning.",
};

function getServiceIcon(iconName?: string | null) {
  switch (iconName) {
    case "ShieldCheck":
      return ShieldCheck;
    case "Sprout":
      return Sprout;
    case "Users":
      return Users;
    case "Layers":
      return Layers;
    case "Key":
      return Key;
    case "Briefcase":
      return Briefcase;
    case "TrendingUp":
    case "LineChart":
    default:
      return TrendingUp;
  }
}

/**
 * Asynchronous Server Component fetching published services from PostgreSQL / Prisma
 */
async function ServicesGrid() {
  let services: any[] = [];
  try {
    services = await getPublishedServices();
  } catch (err) {
    console.error("Database connection failure loading services:", err);
    return (
      <div className="col-span-full max-w-xl mx-auto text-center p-8 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm space-y-3">
        <h3 className="text-base font-semibold text-[#172B46]">Services Catalog Currently Unavailable</h3>
        <p className="text-xs text-[#172B46]/70">
          We are unable to connect to the database to load our services catalog at this moment. Please check back shortly or reach out to our advisory office directly.
        </p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="col-span-full max-w-xl mx-auto text-center p-8 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm space-y-3">
        <h3 className="text-base font-semibold text-[#172B46]">No Published Services</h3>
        <p className="text-xs text-[#172B46]/70">
          There are currently no financial services published in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((item, idx) => {
        const Icon = getServiceIcon(item.iconName);
        const cardImage =
          item.thumbnailImage ||
          item.heroImage ||
          "/images/services/investment-advisory.png";

        return (
          <div
            key={item.id || item.slug}
            className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm hover:border-[#B08D57] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
          >
            <div>
              <div className="relative w-full h-48 bg-[#E5DFD5]">
                <Image
                  src={cardImage}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-7 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[#B08D57]">
                    <Icon className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#B08D57]/60">
                    0{item.displayOrder || idx + 1}
                  </span>
                </div>

                <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors">
                  {item.title}
                </h2>

                <p className="text-[14px] text-[#172B46]/75 font-normal leading-relaxed">
                  {item.shortDesc}
                </p>
              </div>
            </div>

            <div className="p-7 pt-0 border-t border-[#E5DFD5]/40 mt-4">
              <Link
                href={`/services/${item.slug}`}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#172B46] group-hover:text-[#B08D57] transition-colors pt-4"
              >
                <span>Explore Service</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#B08D57] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Lightweight loading skeleton fallback for services grid
 */
function ServicesGridFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm p-7 space-y-4 animate-pulse">
          <div className="w-full h-44 bg-[#E5DFD5]/50 rounded-xs" />
          <div className="w-2/3 h-5 bg-[#E5DFD5]/60 rounded-xs" />
          <div className="w-full h-3 bg-[#E5DFD5]/40 rounded-xs" />
          <div className="w-4/5 h-3 bg-[#E5DFD5]/40 rounded-xs" />
        </div>
      ))}
    </div>
  );
}

export default function ServicesHubPage() {
  return (
    <div className="relative bg-[#FFFFFF]">
      {/* Header Banner */}
      <section className="py-20 sm:py-28 bg-[#172B46] text-[#FFFFFF] border-b border-[#B08D57]/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#C9A975]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A975]">
              Integrated Financial Solutions
            </span>
            <span className="w-6 h-[1px] bg-[#C9A975]" />
          </div>
          <h1 className="text-[38px] sm:text-[44px] lg:text-[48px] font-semibold text-[#FFFFFF] tracking-tight">
            A Connected Approach to Your Financial Needs
          </h1>
          <p className="max-w-3xl mx-auto text-[16px] text-[#F7F5F0]/85 font-normal leading-relaxed pt-2">
            Your financial decisions are interconnected. Investment choices influence taxation, borrowing affects liquidity, and protection needs influence long-term financial security. Vantage Wealth brings these elements together through an integrated suite of financial solutions.
          </p>
        </div>
      </section>

      {/* Services Grid with Suspense Boundary */}
      <section className="py-20 sm:py-24 bg-[#F7F5F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<ServicesGridFallback />}>
            <ServicesGrid />
          </Suspense>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <CtaBanner
        title="Let's Build Your Wealth Roadmap"
        description="Talk to our advisors and get a personalised wealth plan for your goals."
        buttonText="Book a Consultation"
        buttonHref="/consultation"
      />
    </div>
  );
}
