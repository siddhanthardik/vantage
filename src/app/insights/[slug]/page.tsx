import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { connection } from "next/server";
import {
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import CtaBanner from "@/components/ui/CtaBanner";
import ArticleContentRenderer from "@/components/insights/ArticleContentRenderer";
import ArticleFaqAccordion from "@/components/insights/ArticleFaqAccordion";
import {
  getArticleBySlug,
  getRelatedArticles,
  getPublishedArticles,
} from "@/server/repositories/articleRepository";
import { ArticleItem } from "@/types/article";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Checks whether an article is publicly viewable:
 * Either actively PUBLISHED, or SCHEDULED with a matured publication date.
 * Executed at request time beneath a Suspense boundary.
 */
function isArticlePubliclyAvailable(
  article: { status: string; scheduledFor?: string | Date | null } | null
): boolean {
  if (!article) return false;
  if (article.status === "PUBLISHED") return true;
  if (article.status === "SCHEDULED" && article.scheduledFor) {
    return new Date(article.scheduledFor).getTime() <= Date.now();
  }
  return false;
}

/**
 * Metadata generation compatible with Cache Components.
 * Does not call synchronous time APIs (Date.now()) during prerendering.
 */
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || (article.status !== "PUBLISHED" && article.status !== "SCHEDULED")) {
    return {
      title: "Insights | Vantage Wealth",
      description: "Wealth management insights and research.",
    };
  }

  return {
    title: article.seoTitle || `${article.title} | Vantage Wealth Insights`,
    description: article.seoDescription || article.excerpt,
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

/**
 * Neutral loading skeleton matching the article editorial layout.
 * Rendered by the static shell during Cache Components prerendering.
 */
function InsightLoadingSkeleton() {
  return (
    <div className="min-h-[70vh] bg-[#FFFFFF] animate-pulse">
      <div className="bg-[#F7F5F0] border-b border-[#E5DFD5] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="h-4 w-36 bg-[#E5DFD5] rounded" />
          <div className="h-10 w-3/4 bg-[#E5DFD5] rounded" />
          <div className="h-4 w-1/2 bg-[#E5DFD5]/70 rounded" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
        <div className="h-4 w-full bg-[#E5DFD5]/50 rounded" />
        <div className="h-4 w-full bg-[#E5DFD5]/50 rounded" />
        <div className="h-4 w-2/3 bg-[#E5DFD5]/50 rounded" />
      </div>
    </div>
  );
}

/**
 * Asynchronous article content component executed under Suspense.
 * Awaits connection() and params at request time to support real-time scheduling checks.
 */
async function SingleInsightContent({ params }: ArticlePageProps) {
  await connection();
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || !isArticlePubliclyAvailable(article)) {
    const published = await getPublishedArticles();
    return (
      <div className="min-h-[60vh] bg-[#F7F5F0] py-24 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#FFFFFF] p-8 rounded-sm border border-[#E5DFD5] text-center space-y-4">
          <h1 className="text-2xl font-semibold text-[#172B46]">
            Article Not Found
          </h1>
          <p className="text-xs text-[#172B46]/70 leading-relaxed font-light">
            The publication you are looking for has been moved or archived. Please explore our other recent insights below.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {published.slice(0, 3).map((p) => (
              <Link
                key={p.slug}
                href={`/insights/${p.slug}`}
                className="text-xs text-[#B08D57] font-semibold hover:underline block"
              >
                {p.title}
              </Link>
            ))}
          </div>
          <div className="pt-4 border-t border-[#E5DFD5]">
            <Link
              href="/insights"
              className="text-xs font-bold uppercase tracking-wider text-[#172B46] hover:text-[#B08D57]"
            >
              &larr; Return to Insights Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const related = await getRelatedArticles(article.slug, article.category, 3);

  // Filter published and enabled FAQs in order
  const publishedFaqs = (article.faqs || [])
    .filter((f) => f && f.isEnabled)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Generate structured data only when FAQs exist and match visible content
  const faqJsonLd = publishedFaqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": publishedFaqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  } : null;

  return (
    <article className="relative bg-[#FFFFFF] overflow-x-hidden">
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* 1. FULL-WIDTH ARTICLE HERO IMAGE (DIRECTLY BELOW GLOBAL NAVIGATION) */}
      {article.coverImage && (
        <section className="relative w-full aspect-[16/9] sm:aspect-[16/8] lg:aspect-[16/7] max-h-[540px] overflow-hidden bg-[#172B46]/5 border-b border-[#E5DFD5]">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="100vw"
            priority
            className="object-cover object-center"
          />
        </section>
      )}

      {/* ARTICLE CONTENT CONTAINER (MAXIMUM WIDTH 780PX) */}
      <div className="max-w-[780px] mx-auto px-5 sm:px-6 pt-8 pb-16">
        {/* 2. BREADCRUMB NAVIGATION */}
        <nav className="flex items-center gap-2 text-xs text-[#172B46]/60 font-medium mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#B08D57] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B08D57]" aria-hidden="true" />
          <Link href="/insights" className="hover:text-[#B08D57] transition-colors">
            Insights
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B08D57]" aria-hidden="true" />
          <span className="text-[#172B46] font-semibold truncate max-w-xs sm:max-w-md">
            {article.title}
          </span>
        </nav>

        {/* 3. ARTICLE TITLE (H1: 38-42px desktop, 29-32px mobile, weight 600) */}
        <h1 className="text-[29px] sm:text-[34px] lg:text-[40px] font-semibold text-[#172B46] tracking-tight leading-[1.2] mb-5">
          {article.title}
        </h1>

        {/* 4. SMALL ARTICLE DESCRIPTION / SUMMARY (18px desktop, 16px mobile, weight 400) */}
        <p className="text-[16px] sm:text-[18px] text-[#172B46]/80 font-normal leading-relaxed border-l-2 border-[#B08D57] pl-4 mb-10">
          {article.excerpt}
        </p>

        {/* 5. DETAILED ARTICLE CONTENT */}
        <ArticleContentRenderer content={article.content} />

        {/* 6. FREQUENTLY ASKED QUESTIONS (ONLY IF PUBLISHED FAQS EXIST) */}
        {publishedFaqs.length > 0 && (
          <ArticleFaqAccordion faqs={publishedFaqs} />
        )}

        {/* 7. PUBLISHED BY INFORMATION (AFTER COMPLETE ARTICLE CONTENT & FAQS) */}
        <div className="mt-12 pt-6 border-t border-[#E5DFD5] text-sm text-[#172B46]/75">
          <span>
            Published by <strong className="text-[#172B46] font-semibold">{article.authorName}</strong>
          </span>
        </div>

        {/* 8. DISCLAIMER */}
        <div className="mt-8 p-5 bg-[#F7F5F0] border-l-4 border-[#B08D57] rounded-xs space-y-1.5 text-xs text-[#172B46]/75 font-normal leading-relaxed">
          <strong className="text-[#172B46] font-semibold block text-[13px]">
            Editorial & Advisory Notice:
          </strong>
          The observations and commentary above are published for general wealth education and institutional perspective. They do not constitute specific investment, legal, or tax counsel for any individual circumstances. All asset allocations are subject to market conditions.
        </div>
      </div>

      {/* 4. RELATED ARTICLES */}
      {related.length > 0 && (
        <section className="py-14 sm:py-16 bg-[#F7F5F0] border-t border-[#E5DFD5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#B08D57]">
                  Further Reading
                </span>
                <h3 className="text-[22px] sm:text-[24px] font-semibold text-[#172B46] mt-0.5">
                  Related Insights
                </h3>
              </div>
              <Link
                href="/insights"
                className="text-xs font-bold uppercase tracking-wider text-[#B08D57] hover:underline"
              >
                All Publications &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/insights/${rel.slug}`}
                  className="bg-[#FFFFFF] border border-[#E5DFD5] p-6 rounded-sm hover:border-[#B08D57] hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B08D57]">
                      {rel.category}
                    </span>
                    <h4 className="text-[17px] sm:text-[18px] font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors leading-snug">
                      {rel.title}
                    </h4>
                    <p className="text-[13px] text-[#172B46]/70 font-normal line-clamp-2 leading-relaxed">
                      {rel.excerpt}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#172B46] group-hover:text-[#B08D57]">
                    <span>Read Insight</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. CONSULTATION CTA BANNER */}
      <CtaBanner
        title="Need a Clearer Perspective on Your Assets?"
        description="Schedule a confidential discovery meeting with our senior advisory team to discuss your goals and portfolio architecture."
        buttonText="Book a Consultation"
        buttonHref="/consultation"
      />
    </article>
  );
}

/**
 * SingleInsightPage is a synchronous Server Component.
 * Under nextConfig.cacheComponents, params is passed directly into a <Suspense> boundary.
 * Next.js prerenders the static shell using InsightLoadingSkeleton while dynamic article
 * content and scheduled publication checks stream in at request time.
 */
export default function SingleInsightPage({ params }: ArticlePageProps) {
  return (
    <Suspense fallback={<InsightLoadingSkeleton />}>
      <SingleInsightContent params={params} />
    </Suspense>
  );
}
