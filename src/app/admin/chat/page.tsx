"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  PhoneCall,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Cpu,
  Clock,
} from "lucide-react";

export default function ChatOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchStats() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/chat/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentConversations(data.recentConversations || []);
      }
    } catch (e) {
      console.error("Failed to load chat stats:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight">
            Vantage Wealth Assistant Overview
          </h1>
          <p className="text-[13px] text-stone-600 mt-1">
            Real-time conversational concierge metrics, qualified advisory leads, and AI operational status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold text-[#172B46] bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B08D57] ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
          <Link
            href="/admin/chat/conversations"
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#172B46] rounded-lg hover:bg-[#253f63] transition-colors shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#B08D57]" />
            View Live Threads
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Conversations */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-600 mb-2">
            <span className="text-[12px] font-medium uppercase tracking-wider">Conversations</span>
            <MessageSquare className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] lg:text-[28px] font-semibold text-[#172B46] leading-none">
              {isLoading ? "—" : stats?.totalConversations ?? 0}
            </span>
            <span className="text-[12px] text-emerald-600 font-medium">
              +{stats?.conversationsToday ?? 0} today
            </span>
          </div>
          <p className="text-[12px] text-stone-600 mt-1">
            {stats?.conversationsThisWeek ?? 0} active this week
          </p>
        </div>

        {/* Card 2: Total Leads Captured */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-600 mb-2">
            <span className="text-[12px] font-medium uppercase tracking-wider">Advisory Leads</span>
            <Users className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] lg:text-[28px] font-semibold text-[#172B46] leading-none">
              {isLoading ? "—" : stats?.totalLeads ?? 0}
            </span>
            <span className="text-[12px] text-blue-600 font-medium">
              {stats?.qualifiedLeads ?? 0} qualified
            </span>
          </div>
          <p className="text-[12px] text-stone-600 mt-1">
            Progressive conversational capture
          </p>
        </div>

        {/* Card 3: Callbacks Pending */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-600 mb-2">
            <span className="text-[12px] font-medium uppercase tracking-wider">Pending Callbacks</span>
            <PhoneCall className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] lg:text-[28px] font-semibold text-[#172B46] leading-none">
              {isLoading ? "—" : stats?.callbackRequestsPending ?? 0}
            </span>
            <span className="text-[12px] text-amber-600 font-medium">Action required</span>
          </div>
          <p className="text-[12px] text-stone-600 mt-1">
            Phone &amp; email requests
          </p>
        </div>

        {/* Card 4: Converted to Enquiries */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-600 mb-2">
            <span className="text-[12px] font-medium uppercase tracking-wider">Enquiry Conversions</span>
            <TrendingUp className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] lg:text-[28px] font-semibold text-[#172B46] leading-none">
              {isLoading ? "—" : stats?.convertedLeads ?? 0}
            </span>
            <span className="text-[12px] text-emerald-600 font-medium">
              {stats?.conversionRate ?? "0.0"}% rate
            </span>
          </div>
          <p className="text-[12px] text-stone-600 mt-1">
            Official consultation records
          </p>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/chat/leads"
          className="group p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#B08D57] transition-all shadow-2xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#B08D57]/10 flex items-center justify-center text-[#B08D57]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[16px] lg:text-[17px] font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors">
                Chat Lead Management
              </h4>
              <p className="text-[13px] text-stone-600">Review, qualify and convert chatbot leads</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#B08D57] transition-colors" />
        </Link>

        <Link
          href="/admin/chat/instructions"
          className="group p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#B08D57] transition-all shadow-2xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#172B46]/10 flex items-center justify-center text-[#172B46]">
              <Sparkles className="w-5 h-5 text-[#B08D57]" />
            </div>
            <div>
              <h4 className="text-[16px] lg:text-[17px] font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors">
                System Instructions &amp; Tone
              </h4>
              <p className="text-[13px] text-stone-600">Configure prompt, welcome text and questions</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#B08D57] transition-colors" />
        </Link>

        <Link
          href="/admin/chat/ai"
          className="group p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#B08D57] transition-all shadow-2xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[16px] lg:text-[17px] font-semibold text-[#172B46] group-hover:text-[#B08D57] transition-colors">
                AI Diagnostics &amp; Model
              </h4>
              <p className="text-[13px] text-stone-600">Google Gemini Developer API status</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#B08D57] transition-colors" />
        </Link>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-[16px] lg:text-[18px] font-semibold text-[#172B46] tracking-wide">
            Recent Advisory Conversations
          </h2>
          <Link
            href="/admin/chat/conversations"
            className="text-[13px] text-[#B08D57] hover:underline flex items-center gap-1 font-semibold"
          >
            View all conversations <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5F0] text-stone-600 uppercase tracking-wider text-[10px] border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-4">Conversation ID</th>
                <th className="py-2.5 px-4">Language</th>
                <th className="py-2.5 px-4">Messages</th>
                <th className="py-2.5 px-4">Lead Status</th>
                <th className="py-2.5 px-4">Started At</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-[#172B46]">
              {recentConversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-500 text-xs">
                    No conversations recorded yet.
                  </td>
                </tr>
              ) : (
                recentConversations.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-[#172B46]">
                      {c.id.slice(0, 10)}...
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 uppercase">
                        {c.language}
                      </span>
                    </td>
                    <td className="py-3 px-4">{c._count?.messages ?? c.messageCount ?? 0} turns</td>
                    <td className="py-3 px-4">
                      {c.lead ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                          <UserCheck className="w-2.5 h-2.5" />
                          {c.lead.status}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">Anonymous</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/chat/conversations?id=${c.id}`}
                        className="text-[#B08D57] hover:underline font-medium text-[11px]"
                      >
                        Inspect Thread
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
