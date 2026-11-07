"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  Calendar,
  BarChart2,
  Layers,
  FileText,
  Umbrella,
  Users,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { ArticleItem } from "@/types/article";

interface InsightsFilterableListProps {
  articles: ArticleItem[];
  featuredArticle: ArticleItem | null;
}

const CATEGORIES = [
  { name: "All Insights", icon: null },
  { name: "Market Updates", icon: BarChart2 },
  { name: "Wealth Planning", icon: Layers },
  { name: "Tax & Regulation", icon: FileText },
  { name: "Retirement", icon: Umbrella },
  { name: "Family Wealth", icon: Users },
];

const POPULAR_READS = [
  {
    title: "Equity Investing: Key Things to Keep in Mind",
    date: "Sep 28, 2026",
    image: "/images/services/investment-advisory-hero.png",
    href: "/insights",
  },
  {
    title: "Diversification: Why It Matters for Your Portfolio",
    date: "Sep 18, 2026",
    image: "/images/services/chess-king.png",
    href: "/insights",
  },
  {
    title: "Smart Tax Planning for Individuals and Families",
    date: "Sep 10, 2026",
    image: "/images/services/tax-planning.png",
    href: "/insights",
  },
];

export default function InsightsFilterableList({
  articles,
  featuredArticle,
}: InsightsFilterableListProps) {
  const [selectedCategory, setSelectedCategory] = useState("All Insights");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail("");
    }
  };

  const filteredArticles = articles.filter((art) => {
    if (selectedCategory === "All Insights") return true;
    const catNorm = selectedCategory.toLowerCase();
    const artCatNorm = art.category.toLowerCase();
    if (catNorm === "tax & regulation" && (artCatNorm.includes("tax") || artCatNorm.includes("regulation") || artCatNorm.includes("legacy"))) {
      return true;
    }
    return artCatNorm.includes(catNorm);
  });

  // Filter out featured article from recent list if "All Insights" is selected
  const listArticles = filteredArticles.filter(
    (art) => selectedCategory !== "All Insights" || art.id !== featuredArticle?.id
  );

  return (
    <div className="space-y-10">
      {/* 1. Category Filter Tabs with Icons matching Reference 3 */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {CATEGORIES.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setSelectedCategory(name)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              selectedCategory === name
                ? "bg-[#172B46] text-[#FFFFFF] shadow-xs"
                : "bg-[#FFFFFF] text-[#172B46]/75 hover:bg-[#FAF8F5] hover:text-[#172B46] border border-[#E5DFD5]"
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 ${selectedCategory === name ? "text-[#C9A975]" : "text-[#B08D57]"}`} />}
            <span>{name}</span>
          </button>
        ))}
      </div>

      {/* 2. Main Two-Column Layout (Left 8 Cols, Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Featured Article + Latest Insights List */}
        <div className="lg:col-span-8 space-y-10">
          {/* Featured Article Card */}
          {selectedCategory === "All Insights" && featuredArticle && (
            <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl overflow-hidden hover:border-[#B08D57] hover:shadow-md transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-12 items-center">
                {/* Featured Image with Gold Badge */}
                <div className="md:col-span-5 relative w-full h-[240px] md:h-full min-h-[220px] bg-[#F7F5F0]">
                  <Image
                    src={featuredArticle.coverImage || "/images/insights/featured-article.png"}
                    alt={featuredArticle.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 35vw"
                    priority
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#B08D57] text-[#FFFFFF] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm shadow-xs">
                    FEATURED
                  </div>
                </div>

                {/* Content */}
                <div className="md:col-span-7 p-6 sm:p-8 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B08D57] block">
                    {featuredArticle.category}
                  </span>

                  <h2 className="text-[20px] sm:text-[22px] lg:text-[24px] font-semibold text-[#172B46] leading-snug">
                    <Link
                      href={`/insights/${featuredArticle.slug}`}
                      className="hover:text-[#B08D57] transition-colors"
                    >
                      {featuredArticle.title}
                    </Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-[#172B46]/75 font-normal leading-relaxed line-clamp-2">
                    {featuredArticle.excerpt}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-[#172B46]/60 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#B08D57]" />
                        {new Date(featuredArticle.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>|</span>
                      <span>{featuredArticle.readTime}</span>
                    </div>

                    <Link
                      href={`/insights/${featuredArticle.slug}`}
                      className="w-9 h-9 rounded-full bg-[#B08D57] text-[#FFFFFF] hover:bg-[#9B7A46] flex items-center justify-center transition-colors shadow-xs"
                      aria-label="Read full article"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Latest Insights Section */}
          <div className="space-y-5">
            <h3 className="text-[22px] sm:text-[24px] font-semibold text-[#172B46]">
              {selectedCategory === "All Insights" ? "Latest Insights" : selectedCategory}
            </h3>

            {listArticles.length === 0 ? (
              <div className="bg-[#FAF8F5] p-10 text-center border border-[#E5DFD5] rounded-xl space-y-2">
                <p className="text-sm text-[#172B46]/70">No articles currently published in this category.</p>
                <button
                  onClick={() => setSelectedCategory("All Insights")}
                  className="text-xs font-semibold text-[#B08D57] hover:underline"
                >
                  View all publications
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {listArticles.map((article) => (
                  <article
                    key={article.id}
                    className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl p-4 sm:p-5 hover:border-[#B08D57] hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                      {/* Thumbnail */}
                      <div className="sm:col-span-4 relative w-full h-36 sm:h-32 rounded-lg overflow-hidden bg-[#F7F5F0] shrink-0">
                        <Image
                          src={article.coverImage || "/images/insights/article-1.png"}
                          alt={article.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Info & Title */}
                      <div className="sm:col-span-8 flex flex-col justify-between h-full space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#B08D57]">
                          {article.category}
                        </span>

                        <h4 className="text-[17px] sm:text-[18px] font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors leading-snug">
                          <Link href={`/insights/${article.slug}`}>{article.title}</Link>
                        </h4>

                        <p className="text-xs text-[#172B46]/70 font-normal leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>

                        <div className="pt-1 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[11px] text-[#172B46]/60 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#B08D57]" />
                              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span>|</span>
                            <span>{article.readTime}</span>
                          </div>

                          <Link
                            href={`/insights/${article.slug}`}
                            className="w-8 h-8 rounded-full border border-[#B08D57] text-[#B08D57] hover:bg-[#B08D57] hover:text-[#FFFFFF] flex items-center justify-center transition-colors"
                            aria-label={`Read ${article.title}`}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stay Informed (Newsletter) + Popular Reads */}
        <div className="lg:col-span-4 space-y-8">
          {/* Stay Informed Newsletter Card */}
          <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5">
              <Mail className="w-6 h-6 text-[#B08D57]" />
              <h3 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                Stay Informed
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#172B46]/75 font-normal leading-relaxed">
              Get handpicked insights on markets, wealth planning and financial strategies delivered to your inbox.
            </p>

            {subscribed ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-md flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thank you. You will receive our next advisory briefing.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E5DFD5] rounded-md text-sm text-[#172B46] placeholder:text-[#172B46]/40 focus:outline-none focus:border-[#B08D57]"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-[#B08D57] hover:bg-[#9B7A46] text-[#FFFFFF] font-semibold text-sm rounded-md transition-colors shadow-xs cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>

          {/* Popular Reads Card */}
          <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5">
              <BarChart2 className="w-5 h-5 text-[#B08D57]" />
              <h3 className="text-[20px] sm:text-[22px] font-semibold text-[#172B46]">
                Popular Reads
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              {POPULAR_READS.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-[#F7F5F0] shrink-0 border border-[#E5DFD5]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#172B46]/60 flex items-center gap-1 font-normal">
                      <Calendar className="w-3 h-3 text-[#B08D57]" /> {item.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
