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
  Bell,
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

  const navigation = [
    { name: "الرئيسية", href: "/", icon: LayoutDashboard },
    { name: "الشركات", href: "/companies", icon: Building2 },
    { name: "المستودعات", href: "/warehouses", icon: WarehouseIcon },
    { name: "دليل الصيد والأسعار", href: "/catalog", icon: Fish },
    { name: "سندات الإدخال", href: "/inbound", icon: FileInput },
    { name: "سندات الصرف", href: "/outbound", icon: FileOutput },
    { name: "المخزون والدفعات", href: "/inventory", icon: Boxes },
    ...(isManager
      ? [
          { name: "المالية والحسابات", href: "/finance", icon: DollarSign },
        ]
      : []),
    { name: "الموافقات", href: "/approvals", icon: FileCheck2 },
    { name: "التقارير", href: "/reports", icon: BarChart3 },
    ...(isGeneralManager
      ? [
          { name: "إدارة المستخدمين", href: "/users", icon: Users },
        ]
      : []),
    ...(isManager
      ? [
          { name: "سجل التدقيق", href: "/audit", icon: ScrollText },
        ]
      : []),
    ...(isGeneralManager
      ? [
          { name: "إعدادات النظام", href: "/settings", icon: Settings },
        ]
      : []),
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-3">
              <OceanFlowerEmblem size={42} showText={false} />
              <div className="hidden sm:block">
                <span className="font-extrabold text-slate-900 text-base tracking-tight block">
                  <span className="text-red-600">زهرة المحيط</span> لتصدير الأسماك
                </span>
                <span className="text-[11px] text-slate-500 font-semibold block">
                  نظام إدارة مستودعات التبريد والمخزون
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header items: User Info & Actions */}
          <div className="flex items-center gap-4">
            <div className="text-left hidden sm:block">
              <div className="text-sm font-bold text-slate-800">{user.displayName}</div>
              <div className="text-xs text-primary-600 font-medium">
                {USER_ROLES[user.role]?.labelAr || user.role}
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-l border-slate-200/80 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-50 text-primary-700 font-bold shadow-xs border border-primary-100/60"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary-600" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-xs bg-white h-full p-4 flex flex-col space-y-1 shadow-2xl z-10">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-sm">القائمة الرئيسية</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-primary-50 text-primary-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
