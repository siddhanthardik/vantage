import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { connection } from "next/server";
import {
  ChevronRight,
  Clock,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import CtaBanner from "@/components/ui/CtaBanner";
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

  return (
    <article className="relative bg-[#FFFFFF] overflow-x-hidden">
      {/* 1. ARTICLE HEADER & BREADCRUMB */}
      <section className="bg-gradient-to-b from-[#F7F5F0] to-[#FFFFFF] border-b border-[#E5DFD5] pt-6 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#172B46]/60 font-medium">
            <Link href="/" className="hover:text-[#B08D57] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#B08D57]" />
            <Link href="/insights" className="hover:text-[#B08D57] transition-colors">
              Insights
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#B08D57]" />
            <span className="text-[#172B46] font-semibold truncate max-w-xs sm:max-w-md">
              {article.title}
            </span>
          </nav>

          {/* Meta Badges */}
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
            <span className="text-[#B08D57] bg-[#B08D57]/10 px-3 py-1 rounded-xs">
              {article.category}
            </span>
            <span className="text-[#172B46]/40">&bull;</span>
            <span className="text-[#172B46]/70 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> {article.readTime}
            </span>
            <span className="text-[#172B46]/40">&bull;</span>
            <span className="text-[#172B46]/70 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Article Title */}
          <h1 className="text-[34px] sm:text-[40px] lg:text-[46px] font-semibold text-[#172B46] tracking-tight leading-[1.18]">
            {article.title}
          </h1>

          {/* Subtitle / Excerpt */}
          <p className="text-[16px] sm:text-[18px] text-[#172B46]/80 font-normal leading-relaxed border-l-2 border-[#B08D57] pl-4">
            {article.excerpt}
          </p>

          {/* Author Byline */}
          <div className="pt-2 flex items-center justify-between text-xs text-[#172B46]/70 border-t border-[#E5DFD5]/60">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#B08D57]" />
              <span>
                Published by <strong className="text-[#172B46] font-semibold">{article.authorName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#B08D57]">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Fiduciary Research</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COVER IMAGE */}
      {article.coverImage && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="relative w-full h-[320px] sm:h-[440px] rounded-sm overflow-hidden shadow-lg border border-[#E5DFD5]">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              priority
              className="object-cover"
            />
          </div>
        </section>
      )}

      {/* 3. ESSAY NARRATIVE BODY */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-[#172B46]">
          {article.content.split("\n\n").map((block, idx) => {
            if (block.startsWith("### ")) {
              return (
                <h3
                  key={idx}
                  className="text-[20px] sm:text-[22px] font-semibold text-[#172B46] pt-6 pb-1 tracking-tight"
                >
                  {block.replace("### ", "")}
                </h3>
              );
            }
            if (block.startsWith("## ")) {
              return (
                <h2
                  key={idx}
                  className="text-[26px] sm:text-[30px] font-semibold text-[#172B46] pt-8 pb-2 tracking-tight"
                >
                  {block.replace("## ", "")}
                </h2>
              );
            }
            if (block.startsWith("- ")) {
              const items = block.split("\n").filter((l) => l.startsWith("- "));
              return (
                <ul key={idx} className="space-y-2 py-2 pl-2">
                  {items.map((it, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm sm:text-base text-[#172B46]/85 font-light leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57] shrink-0 mt-2.5" />
                      <span>{it.replace("- ", "")}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p
                key={idx}
                className="text-sm sm:text-base text-[#172B46]/85 font-light leading-relaxed"
              >
                {block}
              </p>
            );
          })}

          {/* Compliance Review Disclaimer */}
          <div className="mt-12 p-5 bg-[#F7F5F0] border-l-4 border-[#B08D57] rounded-xs space-y-1 text-xs text-[#172B46]/75 font-light">
            <strong className="text-[#172B46] font-semibold block">Editorial & Advisory Notice:</strong>
            The observations and commentary above are published for general wealth education and institutional perspective. They do not constitute specific investment, legal, or tax counsel for any individual circumstances. All asset allocations are subject to market conditions.
          </div>
        </div>
      </section>

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
