"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  PieChart,
  Activity,
} from "lucide-react";

export default function ChatAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchAnalytics() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/chat/analytics");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-sans text-2xl font-bold text-[#172B46]">Chatbot Analytics & Performance</h1>
          <p className="text-xs text-stone-600 mt-1">
            Aggregated metrics, language trends, lead distribution, and satisfaction ratings derived strictly from PostgreSQL records.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#172B46] bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B08D57] ${isLoading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Language Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#B08D57]" />
              Conversations by Language
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {analytics?.conversationsByLanguage?.length === 0 ? (
              <p className="text-stone-400 text-xs py-4 text-center">No conversation records yet.</p>
            ) : (
              analytics?.conversationsByLanguage?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#F7F5F0]">
                  <span className="font-medium text-[#172B46] uppercase text-[11px] font-mono">
                    {item.language === "en" ? "English (en)" : item.language === "hi" ? "Hindi (hi)" : item.language}
                  </span>
                  <span className="font-bold text-stone-700">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Lead Qualification Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#B08D57]" />
              Leads by Qualification
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {analytics?.leadsByStatus?.length === 0 ? (
              <p className="text-stone-400 text-xs py-4 text-center">No leads recorded yet.</p>
            ) : (
              analytics?.leadsByStatus?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#F7F5F0]">
                  <span className="font-medium text-[#172B46] text-[11px]">{item.status}</span>
                  <span className="font-bold text-[#B08D57]">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Financial Objectives & Interests */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#B08D57]" />
              Top Wealth Objectives
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {analytics?.leadsByObjective?.length === 0 ? (
              <p className="text-stone-400 text-xs py-4 text-center">No objective data yet.</p>
            ) : (
              analytics?.leadsByObjective?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#F7F5F0]">
                  <span className="font-medium text-[#172B46] text-[11px]">{item.objective}</span>
                  <span className="font-bold text-stone-700">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 4: Visitor Feedback Satisfaction */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-[#B08D57]" />
              Visitor Feedback Satisfaction
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {analytics?.feedbackStats?.length === 0 ? (
              <p className="text-stone-400 text-xs py-4 text-center">No feedback ratings yet.</p>
            ) : (
              analytics?.feedbackStats?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#F7F5F0]">
                  <span className="font-medium text-[#172B46] text-[11px]">{item.rating}</span>
                  <span className="font-bold text-emerald-700">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 5: Moderation & Guardrails Flagged Turns */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B08D57]" />
              Fiduciary Guardrails Intercepts
            </h3>
          </div>

          <div className="p-4 bg-[#F7F5F0] rounded-lg text-center space-y-1">
            <span className="text-3xl font-bold text-[#172B46]">
              {analytics?.totalFlagged ?? 0}
            </span>
            <p className="text-[11px] text-stone-500">
              Speculative queries (stock tips, crypto) intercepted & refused
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
