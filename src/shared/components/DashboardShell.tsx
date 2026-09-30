"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SessionUser } from "@/server/auth/session";
import { logoutAction } from "@/server/actions/authActions";
import { USER_ROLES } from "@/core/application/authorization/Role";
import {
  LayoutDashboard,
  Building2,
  Warehouse as WarehouseIcon,
  Fish,
  FileInput,
  FileOutput,
  Boxes,
  DollarSign,
  FileCheck2,
  BarChart3,
  Users,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ThermometerSnowflake,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { OceanFlowerEmblem } from "./BrandLogo";

interface DashboardShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ user, children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";
  const isGeneralManager = user.role === "GENERAL_MANAGER";

  // Categorized Navigation Groups
  const navSections = [
    {
      title: "العمليات وحركة الصيد",
      items: [
        { name: "الرئيسية", href: "/", icon: LayoutDashboard },
        { name: "سندات الإدخال", href: "/inbound", icon: FileInput },
        { name: "سندات الصرف (FIFO)", href: "/outbound", icon: FileOutput },
        { name: "المخزون والدفعات", href: "/inventory", icon: Boxes },
      ],
    },
    {
      title: "العملاء والمستودعات",
      items: [
        { name: "شركات الصيد", href: "/companies", icon: Building2 },
        { name: "مستودعات التبريد", href: "/warehouses", icon: WarehouseIcon },
        { name: "دليل الصيد والأسعار", href: "/catalog", icon: Fish },
      ],
    },
    {
      title: "الشؤون المالية والموافقات",
      items: [
        ...(isManager
          ? [{ name: "المالية والحسابات", href: "/finance", icon: DollarSign }]
          : []),
        { name: "طلبات الموافقات", href: "/approvals", icon: FileCheck2 },
        { name: "التقارير الإحصائية", href: "/reports", icon: BarChart3 },
      ],
    },
    {
      title: "إدارة النظام والرقابة",
      items: [
        ...(isGeneralManager
          ? [{ name: "إدارة المستخدمين", href: "/users", icon: Users }]
          : []),
        ...(isManager
          ? [{ name: "سجل التدقيق والرقابة", href: "/audit", icon: ScrollText }]
          : []),
        ...(isGeneralManager
          ? [{ name: "إعدادات النظام العامة", href: "/settings", icon: Settings }]
          : []),
      ],
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* ============================================================== */}
      {/* TOP NAVBAR: EXECUTIVE OCEANIC HEADER                           */}
      {/* ============================================================== */}
      <header className="bg-gradient-to-r from-[#061838] via-[#0b2e6b] to-[#071a3d] text-white border-b border-blue-900/60 sticky top-0 z-40 shadow-md">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Corporate Titles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <OceanFlowerEmblem size={44} showText={false} />
                <div className="absolute inset-0 rounded-full bg-white/10 filter blur-xs -z-10 group-hover:bg-white/20 transition-colors" />
              </div>
              <div>
                <span className="font-black text-white text-base sm:text-lg tracking-tight block leading-tight">
                  <span className="text-[#f87171] drop-shadow-xs">زهرة المحيط</span>{" "}
                  <span className="text-white">لتصدير الأسماك</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-blue-200/80 font-medium block">
                  إدارة مستودعات التبريد والمخزون • المكلا
                </span>
              </div>
            </Link>
          </div>

          {/* Central Live System Status Badges (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-100 text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>4 مستودعات تبريد نشطة</span>
            </div>

            <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 text-xs font-mono font-bold">
              <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
              <span>تبريد عميق -25°C ~ -35°C</span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* User Details */}
            <div className="text-left hidden sm:block">
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 justify-end">
                <span>{user.displayName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              </div>
              <div className="text-[11px] text-blue-200 font-semibold">
                {USER_ROLES[user.role]?.labelAr || user.role}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN CONTAINER: SIDEBAR + CONTENT                             */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Branded Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white border-l border-slate-200 shadow-xs overflow-y-auto justify-between">
          <div className="p-4 space-y-5">
            {navSections.map((sec, sIdx) => {
              if (sec.items.length === 0) return null;
              return (
                <div key={sIdx} className="space-y-1">
                  <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {sec.title}
                  </div>
                  <div className="space-y-0.5">
                    {sec.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                            isActive
                              ? "bg-gradient-to-l from-blue-50/80 via-white to-blue-50/40 text-[#0e3a82] font-black border-r-4 border-r-[#dc2626] shadow-xs"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 transition-colors ${
                                isActive ? "text-[#0e3a82]" : "text-slate-400"
                              }`}
                            />
                            <span>{item.name}</span>
                          </div>
                          {isActive && (
                            <ChevronLeft className="w-3.5 h-3.5 text-[#dc2626]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Corporate Mini-Card */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 m-3 rounded-2xl border">
            <div className="flex items-center gap-2.5">
              <OceanFlowerEmblem size={32} showText={false} />
              <div>
                <span className="text-[11px] font-black text-slate-800 block">
                  زهرة المحيط لتصدير الأسماك
                </span>
                <span className="text-[9.5px] text-slate-500 font-semibold block">
                  المكلا - حضرموت | ص.ب 62144
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9.5px] font-mono font-bold text-slate-600">
              <span>سعة التخزين: 1,150 طن</span>
              <span className="text-[#0e3a82]">v1.0.0</span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-xs bg-white h-full p-4 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <OceanFlowerEmblem size={28} showText={false} />
                    <span className="font-black text-slate-900 text-xs">
                      زهرة المحيط لتصدير الأسماك
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {navSections.map((sec, sIdx) => {
                    if (sec.items.length === 0) return null;
                    return (
                      <div key={sIdx} className="space-y-1">
                        <div className="px-2 text-[10px] font-black uppercase text-slate-400">
                          {sec.title}
                        </div>
                        {sec.items.map((item) => {
                          const isActive =
                            pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(item.href));
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                                isActive
                                  ? "bg-blue-50 text-[#0e3a82] border-r-4 border-r-[#dc2626]"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  شركة زهرة المحيط لتصدير الأسماك © 2026
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

