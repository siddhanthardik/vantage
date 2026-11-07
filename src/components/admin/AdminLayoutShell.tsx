"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Image as ImageIcon,
  Inbox,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  User,
  Bot,
  MessageSquare,
  UserCheck,
  Sliders,
  Database,
  Cpu,
  Palette,
  BarChart3,
} from "lucide-react";

interface AdminSessionInfo {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AdminLayoutShellProps {
  session: AdminSessionInfo;
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: "WORKSPACE",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Services", href: "/admin/services", icon: Briefcase },
      { name: "Articles & Blog", href: "/admin/articles", icon: FileText },
      { name: "Team & Founder", href: "/admin/team", icon: Users },
      { name: "Media Library", href: "/admin/media", icon: ImageIcon },
      { name: "Enquiries", href: "/admin/enquiries", icon: Inbox },
      { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
    ],
  },
  {
    title: "VANTAGE WEALTH ASSISTANT",
    items: [
      { name: "Overview", href: "/admin/chat", icon: Bot },
      { name: "Conversations", href: "/admin/chat/conversations", icon: MessageSquare },
      { name: "Chat Leads", href: "/admin/chat/leads", icon: UserCheck },
      { name: "Custom Instructions", href: "/admin/chat/instructions", icon: Sliders },
      { name: "Knowledge Base", href: "/admin/chat/knowledge", icon: Database },
      { name: "AI Diagnostics", href: "/admin/chat/ai", icon: Cpu },
      { name: "Appearance", href: "/admin/chat/appearance", icon: Palette },
      { name: "Analytics", href: "/admin/chat/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

function getBreadcrumb(pathname: string): { section: string; title: string } {
  if (pathname.startsWith("/admin/dashboard")) {
    return { section: "Workspace", title: "Dashboard" };
  }
  if (pathname.startsWith("/admin/services")) {
    if (pathname.includes("/new")) return { section: "Services", title: "Add New Service" };
    if (pathname.includes("/edit")) return { section: "Services", title: "Edit Service" };
    return { section: "Workspace", title: "Services Management" };
  }
  if (pathname.startsWith("/admin/articles")) {
    if (pathname.includes("/new")) return { section: "Articles", title: "Compose Article" };
    if (pathname.includes("/edit")) return { section: "Articles", title: "Edit Article" };
    return { section: "Workspace", title: "Articles & Research Blog" };
  }
  if (pathname.startsWith("/admin/team")) {
    if (pathname.includes("/founder")) return { section: "Team & Founder", title: "Edit Founder Profile" };
    if (pathname.includes("/new")) return { section: "Team & Founder", title: "Add Team Member" };
    if (pathname.includes("/edit")) return { section: "Team & Founder", title: "Edit Member Profile" };
    return { section: "Workspace", title: "Founder & Team Management" };
  }
  if (pathname.startsWith("/admin/media")) {
    return { section: "Workspace", title: "Media Library" };
  }
  if (pathname.startsWith("/admin/enquiries")) {
    return { section: "Workspace", title: "Client Enquiries & Consultations" };
  }
  if (pathname.startsWith("/admin/audit-logs")) {
    return { section: "Workspace", title: "Audit & Security Logs" };
  }
  if (pathname.startsWith("/admin/chat")) {
    if (pathname.includes("/conversations")) return { section: "Vantage Assistant", title: "Conversation History" };
    if (pathname.includes("/leads")) return { section: "Vantage Assistant", title: "Chat Lead Management" };
    if (pathname.includes("/instructions")) return { section: "Vantage Assistant", title: "Custom Instructions & Prompt" };
    if (pathname.includes("/knowledge")) return { section: "Vantage Assistant", title: "Knowledge Base Synchronization" };
    if (pathname.includes("/ai")) return { section: "Vantage Assistant", title: "AI Configuration & Diagnostics" };
    if (pathname.includes("/appearance")) return { section: "Vantage Assistant", title: "Chatbot Appearance & Behaviour" };
    if (pathname.includes("/analytics")) return { section: "Vantage Assistant", title: "Assistant Analytics" };
    return { section: "Vantage Assistant", title: "Assistant Overview" };
  }
  if (pathname.startsWith("/admin/settings")) {
    return { section: "Settings", title: "Business Settings" };
  }
  return { section: "Admin", title: "Management Console" };
}

export default function AdminLayoutShell({
  session,
  children,
}: AdminLayoutShellProps) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const breadcrumb = getBreadcrumb(pathname);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
    } catch {
      // Continue to home page redirect
    }
    window.location.href = "/";
  };

  const isLinkActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderNavLinks = (onNavigate?: () => void) => (
    <div className="space-y-3.5">
      {navigationSections.map((section, sIdx) => (
        <div key={section.title} className={sIdx > 0 ? "pt-2.5 mt-2.5 border-t border-[#F7F5F0]/10" : ""}>
          <div className="px-3 pb-1 text-[10px] uppercase font-bold tracking-[0.16em] text-[#C9A975]/70">
            {section.title}
          </div>
          <nav className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-medium tracking-wide transition-colors ${
                    active
                      ? "bg-[#243D60] text-[#FFFFFF] font-semibold border-l-2 border-[#B08D57] shadow-xs"
                      : "text-[#F7F5F0]/80 hover:bg-[#1D3554] hover:text-[#FFFFFF]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? "text-[#C9A975]" : "text-[#C9A975]/75 group-hover:text-[#C9A975]"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );

  return (
    <div className="admin-portal min-h-screen bg-[#F7F5F0] flex font-sans text-[#172B46] antialiased">
      {/* 1. DESKTOP SIDEBAR (Sticky, Width: 260px, overflow-hidden on outer container) */}
      <aside className="hidden md:flex flex-col w-[260px] bg-[#172B46] text-[#F7F5F0] shrink-0 border-r border-[#B08D57]/20 sticky top-0 h-screen overflow-hidden">
        {/* Brand Section: One official logo, no duplicate branding, small tasteful label */}
        <div className="p-3.5 border-b border-[#F7F5F0]/10 shrink-0">
          <Link
            href="/admin/dashboard"
            className="block bg-[#FFFFFF] px-3 py-2 rounded-sm border border-[#B08D57]/30 hover:border-[#B08D57] transition-colors shadow-2xs group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="relative w-32 h-6 sm:h-7">
                <Image
                  src="/brand/logo/logo-horizontal.png"
                  alt="Vantage Wealth"
                  fill
                  priority
                  sizes="128px"
                  className="object-contain object-left"
                />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#B08D57] bg-[#B08D57]/10 px-1.5 py-0.5 rounded-xs shrink-0">
                CMS
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section: flex-1 min-h-0 with no-scrollbar for natural fit without scrollbar clutter */}
        <div className="flex-1 min-h-0 px-3 py-2.5 overflow-y-auto no-scrollbar">
          {renderNavLinks()}
        </div>

        {/* User Session Bar: pinned to bottom */}
        <div className="p-3 border-t border-[#F7F5F0]/10 bg-[#0F1D30]/60 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-[#243D60] text-[#C9A975] flex items-center justify-center font-bold text-xs shrink-0 border border-[#B08D57]/30">
              {session.name ? session.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="truncate">
              <span className="block text-xs font-semibold text-[#FFFFFF] truncate leading-tight">
                {session.name || "Administrator"}
              </span>
              <span className="block text-[10px] text-[#F7F5F0]/60 truncate">
                {session.email || "admin@vantagewealth.in"}
              </span>
            </div>
          </div>

          <form action="/api/admin/auth/logout" method="POST" onSubmit={handleLogout}>
            <button
              type="submit"
              title="Sign Out"
              className="p-1.5 rounded-sm hover:bg-[#243D60] text-[#F7F5F0]/70 hover:text-[#C9A975] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* 2. MOBILE SLIDE-OVER DRAWER */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-[#0A1320]/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-[#172B46] text-[#F7F5F0] flex flex-col h-full shadow-2xl z-10 border-r border-[#B08D57]/30 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-[#F7F5F0]/10 flex items-center justify-between shrink-0">
              <div className="bg-[#FFFFFF] px-3 py-2 rounded-sm border border-[#B08D57]/30 flex-1 mr-2">
                <div className="relative w-28 h-6">
                  <Image
                    src="/brand/logo/logo-horizontal.png"
                    alt="Vantage Wealth"
                    fill
                    sizes="112px"
                    className="object-contain object-left"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-[#F7F5F0]/80 hover:text-[#FFFFFF] hover:bg-[#243D60] rounded-sm transition-colors cursor-pointer"
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation */}
            <div className="flex-1 min-h-0 px-3.5 py-3 overflow-y-auto no-scrollbar">
              {renderNavLinks(() => setMobileDrawerOpen(false))}
            </div>

            {/* Drawer Footer Session */}
            <div className="p-3 border-t border-[#F7F5F0]/10 bg-[#0F1D30]/60 flex items-center justify-between text-xs shrink-0">
              <div className="truncate">
                <span className="block text-xs font-semibold text-[#FFFFFF] truncate">
                  {session.name || "Administrator"}
                </span>
                <span className="block text-[10px] text-[#F7F5F0]/60 truncate">
                  {session.email || "admin@vantagewealth.in"}
                </span>
              </div>
              <form action="/api/admin/auth/logout" method="POST" onSubmit={handleLogout}>
                <button
                  type="submit"
                  className="p-1.5 rounded-sm hover:bg-[#243D60] text-[#F7F5F0]/70 hover:text-[#C9A975] transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE WITH INTEGRATED TOPBAR */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Admin Topbar */}
        <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E5DFD5] h-16 flex items-center justify-between px-6 sm:px-8 lg:px-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 -ml-2 text-[#172B46] hover:bg-[#F7F5F0] rounded-sm transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Current Page Title */}
            <div className="flex items-center gap-2 truncate text-xs">
              <span className="text-[#172B46]/60 font-medium hidden sm:inline">
                {breadcrumb.section}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#172B46]/40 hidden sm:inline" />
              <span className="font-sans font-bold text-[#172B46] text-sm sm:text-base truncate">
                {breadcrumb.title}
              </span>
            </div>
          </div>

          {/* Topbar Right Actions: Administrator Profile & Direct Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#F7F5F0] border border-[#E5DFD5] rounded-sm">
              <div className="w-6 h-6 rounded-full bg-[#172B46] text-[#C9A975] flex items-center justify-center font-bold text-[10px] shrink-0">
                {session.name ? session.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-semibold text-[#172B46] block truncate max-w-[130px]">
                  {session.name || "Administrator"}
                </span>
                <span className="text-[10px] font-bold text-[#B08D57] uppercase tracking-wider block">
                  Admin
                </span>
              </div>
            </div>

            <form action="/api/admin/auth/logout" method="POST" onSubmit={handleLogout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5DFD5] bg-[#FFFFFF] hover:bg-[#F7F5F0] hover:text-[#B08D57] text-[#172B46] text-xs font-semibold rounded-sm transition-colors cursor-pointer"
                title="Sign out of Admin Console"
              >
                <LogOut className="w-3.5 h-3.5 text-[#B08D57]" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </header>

        {/* Workspace Main Content Container: Approximately 32-40px horizontal padding, clean vertical spacing */}
        <main className="flex-1 w-full px-6 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
