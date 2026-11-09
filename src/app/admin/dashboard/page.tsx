import { Suspense } from "react";
import Link from "next/link";
import { getAllServices } from "@/server/repositories/serviceRepository";
import { getAllArticles } from "@/server/repositories/articleRepository";
import { getAllEnquiries } from "@/server/repositories/enquiryRepository";
import { getAllMedia } from "@/server/repositories/mediaRepository";
import {
  Briefcase,
  FileText,
  Inbox,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Plus,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  User,
  Calendar,
} from "lucide-react";

async function DashboardContent() {
  const [services, articles, enquiries, media] = await Promise.all([
    getAllServices(),
    getAllArticles(),
    getAllEnquiries(),
    getAllMedia(),
  ]);

  const publishedServices = services.filter((s) => s.status === "PUBLISHED").length;
  const publishedArticles = articles.filter((a) => a.status === "PUBLISHED").length;
  const newEnquiries = enquiries.filter((e) => e.status === "NEW").length;
  const consultationCount = enquiries.filter((e) => e.type === "CONSULTATION").length;

  const recentEnquiries = enquiries.slice(0, 5);

  return (
    <div className="space-y-8 w-full pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5]">
        <div>
          <span className="text-[12px] font-medium uppercase tracking-wider text-[#B08D57]">
            Vantage Wealth Management Console
          </span>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] mt-1 leading-tight">
            Dashboard Overview
          </h1>
          <p className="text-[14px] text-[#172B46]/70 mt-1">
            Real-time management of public wealth solutions, research publications, and advisory leads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/services/new"
            className="inline-flex items-center gap-1.5 bg-[#172B46] text-[#FFFFFF] hover:bg-[#B08D57] px-3.5 py-2 rounded-sm text-[13px] font-semibold tracking-wide transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#C9A975]" /> New Service
          </Link>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-1.5 bg-[#B08D57] text-[#172B46] hover:bg-[#C9A975] px-3.5 py-2 rounded-sm text-[13px] font-semibold tracking-wide transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#172B46]" /> New Article
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-[#172B46]/30 bg-[#FFFFFF] text-[#172B46] hover:border-[#B08D57] hover:text-[#B08D57] px-3.5 py-2 rounded-sm text-[13px] font-semibold tracking-wide transition-colors"
          >
            Live Site <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Services Card */}
        <Link
          href="/admin/services"
          className="bg-[#FFFFFF] p-5 rounded-sm border border-[#E5DFD5] shadow-xs space-y-2 hover:border-[#B08D57] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wider text-[#172B46]/70">
              Services
            </span>
            <Briefcase className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="text-[28px] lg:text-[30px] font-semibold text-[#172B46] leading-none">
            {services.length}
          </div>
          <div className="text-[12px] text-green-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {publishedServices} Live & Published
          </div>
        </Link>

        {/* Articles Card */}
        <Link
          href="/admin/articles"
          className="bg-[#FFFFFF] p-5 rounded-sm border border-[#E5DFD5] shadow-xs space-y-2 hover:border-[#B08D57] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wider text-[#172B46]/70">
              Articles &amp; Blog
            </span>
            <FileText className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="text-[28px] lg:text-[30px] font-semibold text-[#172B46] leading-none">
            {articles.length}
          </div>
          <div className="text-[12px] text-green-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {publishedArticles} Live on Insights Hub
          </div>
        </Link>

        {/* Enquiries Card */}
        <Link
          href="/admin/enquiries"
          className="bg-[#FFFFFF] p-5 rounded-sm border border-[#E5DFD5] shadow-xs space-y-2 hover:border-[#B08D57] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wider text-[#172B46]/70">
              Enquiries &amp; Leads
            </span>
            <Inbox className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="text-[28px] lg:text-[30px] font-semibold text-[#172B46] leading-none">
            {enquiries.length}
          </div>
          <div className="text-[12px] text-amber-700 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {newEnquiries} Pending Follow-up
          </div>
        </Link>

        {/* Media Library Card */}
        <Link
          href="/admin/media"
          className="bg-[#FFFFFF] p-5 rounded-sm border border-[#E5DFD5] shadow-xs space-y-2 hover:border-[#B08D57] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wider text-[#172B46]/70">
              Media Assets
            </span>
            <ImageIcon className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="text-[28px] lg:text-[30px] font-semibold text-[#172B46] leading-none">
            {media.length}
          </div>
          <div className="text-[12px] text-[#172B46]/60">
            Cloudflare R2 &amp; Local Storage
          </div>
        </Link>
      </div>

      {/* Recent Inquiries & Consultations */}
      <div className="bg-[#FFFFFF] rounded-sm border border-[#E5DFD5] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5]">
          <div>
            <h2 className="text-[20px] lg:text-[22px] font-semibold text-[#172B46] leading-snug">
              Recent Inquiries &amp; Consultations
            </h2>
            <p className="text-[13px] text-[#172B46]/65 mt-0.5">
              Prospective family and client requests awaiting advisor outreach.
            </p>
          </div>
          <Link
            href="/admin/enquiries"
            className="text-[13px] font-semibold text-[#B08D57] hover:underline"
          >
            View All ({enquiries.length}) &rarr;
          </Link>
        </div>

        {recentEnquiries.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#172B46]/60 font-light">
            No advisory inquiries received yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E5DFD5]/50">
            {recentEnquiries.map((enq) => (
              <div key={enq.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172B46]">
                      {enq.fullName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs uppercase ${
                        enq.type === "CONSULTATION"
                          ? "bg-[#B08D57]/15 text-[#B08D57]"
                          : "bg-[#172B46]/10 text-[#172B46]"
                      }`}
                    >
                      {enq.type}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-xs ${
                        enq.status === "NEW"
                          ? "bg-amber-100 text-amber-800"
                          : enq.status === "CONTACTED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {enq.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#172B46]/70 flex items-center gap-3">
                    <span>{enq.email}</span>
                    <span>&bull;</span>
                    <span>{enq.phone}</span>
                  </div>
                </div>

                <Link
                  href="/admin/enquiries"
                  className="text-xs text-[#B08D57] hover:text-[#172B46] font-semibold shrink-0"
                >
                  Details &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#172B46]/60 bg-[#FFFFFF] border border-[#E5DFD5] rounded-sm animate-pulse">
          Loading dashboard metrics...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
