import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedArticles, getFeaturedArticle } from "@/server/repositories/articleRepository";
import InsightsFilterableList from "@/components/insights/InsightsFilterableList";
import SectionKicker from "@/components/ui/SectionKicker";
import CtaBanner from "@/components/ui/CtaBanner";

export const metadata: Metadata = {
  title: "Wealth Insights | Vantage Wealth",
  description:
    "Market updates, wealth planning ideas and expert perspectives to help you make smarter financial decisions.",
};

async function InsightsListLoader() {
  const [articles, featuredArticle] = await Promise.all([
    getPublishedArticles(),
    getFeaturedArticle(),
  ]);

  return (
    <InsightsFilterableList
      articles={articles}
      featuredArticle={featuredArticle}
    />
  );
}

function InsightsLoadingFallback() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-9 w-28 bg-[#E5DFD5]/60 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="h-64 bg-[#E5DFD5]/40 rounded-xl" />
          <div className="h-32 bg-[#E5DFD5]/40 rounded-xl" />
          <div className="h-32 bg-[#E5DFD5]/40 rounded-xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="h-64 bg-[#E5DFD5]/40 rounded-xl" />
          <div className="h-64 bg-[#E5DFD5]/40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <div className="relative bg-[#FFFFFF]">
      {/* Light Hero Section matching Reference 3 */}
      <section className="relative pt-16 pb-16 sm:pt-20 sm:pb-20 border-b border-[#E5DFD5] bg-gradient-to-b from-[#FAF8F5] to-[#FFFFFF] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-4">
            <SectionKicker linePosition="right" textColor="#B08D57">
              INSIGHTS
            </SectionKicker>

            <h1 className="text-[38px] sm:text-[44px] lg:text-[48px] font-semibold text-[#172B46] tracking-tight">
              Wealth Insights
            </h1>

            <p className="text-[16px] sm:text-[18px] text-[#172B46]/75 font-normal leading-relaxed max-w-2xl">
              Market updates, wealth planning ideas and expert perspectives to help you make smarter financial decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-12 sm:py-16 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<InsightsLoadingFallback />}>
            <InsightsListLoader />
          </Suspense>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <CtaBanner
        title="Prefer a Personal Conversation?"
        description="Book a one-on-one consultation with our wealth advisor to discuss your goals and explore the right strategies."
        buttonText="Book a Consultation"
        buttonHref="/consultation"
      />
    </div>
  );
}
