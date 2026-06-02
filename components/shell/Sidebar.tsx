"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, BarChart3, LogOut, Library, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("codevault_sidebar_collapsed");
      if (stored === "true") {
        setIsCollapsed(true);
      }
    }
  }, []);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("codevault_sidebar_collapsed", String(next));
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      href: "/dashboard"
    },
    {
      label: "Sheets",
      icon: <Library className="w-5 h-5 shrink-0" />,
      href: "/sheets"
    },
    {
      label: "Reminders",
      icon: <Clock className="w-5 h-5 shrink-0" />,
      href: "/reminders"
    },
    {
      label: "Analytics",
      icon: <BarChart3 className="w-5 h-5 shrink-0" />,
      href: "/analytics"
    }
  ];

  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex flex-col bg-surface border-r border-border h-screen sticky top-0 py-6 px-4 shrink-0 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}>

        {/* Brand Header */}
        <div className={`flex items-center gap-2.5 mb-8 group ${isCollapsed ? "justify-center" : "px-3 justify-between"}`}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7.5 h-7.5 rounded-lg bg-primary flex items-center justify-center text-white overflow-hidden shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {!isCollapsed && (
              <span className="font-display font-bold text-lg tracking-tight text-foreground transition-all">
                CodeVault
              </span>
            )}
          </Link>

          {/* Collapse Toggle Button */}
          <button
            onClick={handleToggleCollapse}
            className={`p-1 rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground active:scale-95 transition-all cursor-pointer ${
              isCollapsed ? "absolute -right-3.5 top-7 z-50 rounded-full shadow-md bg-surface" : ""
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 font-sans font-semibold text-xs tracking-wide">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex items-center rounded-xl border transition-all duration-150 ${
                  isCollapsed ? "justify-center p-3.5" : "px-4.5 py-3.5 gap-3.5"
                } ${isActive
                    ? "bg-surface-2 border-primary text-primary shadow-sm"
                    : "border-transparent text-muted hover:text-foreground hover:bg-surface-2/60"
                  }`}
                title={isCollapsed ? item.label : ""}
              >
                {item.icon}
                {!isCollapsed && <span className="text-sm font-sans font-semibold">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Panel — Settings then Log out */}
        <div className="pt-4 border-t border-border space-y-1">
          <Link
            href="/settings"
            className={`flex items-center rounded-xl border transition-all duration-150 ${
              isCollapsed ? "justify-center p-3.5" : "px-4.5 py-3.5 gap-3.5"
            } ${pathname === "/settings"
                ? "bg-surface-2 border-primary text-primary shadow-sm"
                : "border-transparent text-muted hover:text-foreground hover:bg-surface-2/60"
              }`}
            title={isCollapsed ? "Settings" : ""}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-sans font-semibold">Settings</span>}
          </Link>

          <Link
            href="/login"
            className={`flex items-center rounded-xl border border-transparent text-muted hover:text-rose-500 hover:bg-rose-500/5 transition-all font-sans font-semibold ${
              isCollapsed ? "justify-center p-3.5" : "px-4.5 py-3.5 gap-3.5"
            }`}
            title={isCollapsed ? "Log out" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-sans font-semibold">Log out</span>}
          </Link>
        </div>

      </aside>

      {/* 2. MOBILE BOTTOM TAB BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-40 px-6 flex items-center justify-around shadow-lg">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${isActive ? "text-primary" : "text-muted hover:text-foreground"
                }`}
            >
              {item.icon}
              <span className="text-[9px] font-semibold mt-1 font-sans">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors ${pathname === "/settings" ? "text-primary" : "text-muted hover:text-foreground"}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-1 font-sans">Settings</span>
        </Link>
        <Link
          href="/login"
          className="flex flex-col items-center justify-center w-12 h-12 rounded-lg text-muted hover:text-rose-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-1 font-sans">Log out</span>
        </Link>
      </nav>
    </>
  );
}
