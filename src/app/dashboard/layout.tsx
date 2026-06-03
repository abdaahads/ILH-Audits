/**
 * DASHBOARD LAYOUT — src/app/dashboard/layout.tsx
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This is the persistent shell for the entire authenticated portion of
 * the application. It provides the responsive sidebar navigation, the
 * mobile hamburger menu, and handles fetching the user's profile info
 * to display in the bottom left corner.
 *
 * WHY IT MATTERS FOR ILH:
 * Operations managers and field auditors use this system in varying
 * environments — from a dual-monitor setup at the ILH Head Office
 * to an iPad Mini in the basement of ILH Pune.
 * 
 *   - The sidebar collapses to 72px to give maximum screen real estate
 *     to the complex CAP Board and Analytics charts on smaller laptops.
 *   - On mobile (phones/tablets), it converts to a slide-out drawer
 *     with a backdrop blur, ensuring the audit form remains the primary
 *     focus.
 *
 * NAVIGATION HIERARCHY:
 *   1. Dashboard (Analytics for the Founder/Ops Head)
 *   2. Properties (Portfolio overview)
 *   3. New Audit (The core data-entry workflow)
 *   4. Audit History (Past reports and PDFs)
 *   5. Issues / CAP (Corrective Action Planning for the maintenance team)
 *
 * FOR DEVELOPERS:
 * - This is a Client Component ("use client") because it manages UI state
 *   (sidebarOpen, collapsed) and fetches user profile data on mount.
 * - Profile fetching is done here so it only happens once per session,
 *   rather than on every page load.
 * ============================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  PlusCircle,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/** Navigation items for the sidebar */
const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Properties",
    href: "/dashboard/properties",
    icon: Building2,
  },
  {
    label: "New Audit",
    href: "/dashboard/audits/new",
    icon: PlusCircle,
  },
  {
    label: "Audit History",
    href: "/dashboard/audits",
    icon: ClipboardCheck,
  },
  {
    label: "Issues (CAP)",
    href: "/dashboard/issues",
    icon: AlertTriangle,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ email?: string; full_name?: string }>({});

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // Fetch profile for display name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", authUser.id)
          .single();

        setUser({
          email: authUser.email,
          full_name: profile?.full_name || authUser.email,
        });
      }
    }

    getUser();
  }, []);

  /** Sign the user out and redirect to login */
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  /** Get initials from name or email */
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#E0E5EC]">
      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (Neumorphic) ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-[#E0E5EC] neo-sidebar transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-[72px]" : "lg:w-64"} w-64
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <img
                src="https://ivyleaguehouse.com/wp-content/uploads/2024/05/ILH-Logo.png"
                alt="ILH Logo"
                className="h-9 w-auto"
              />
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E0E5EC] shadow-neo-raised-sm text-ilh-navy-700 font-bold text-sm">
                ILH
              </div>
            </Link>
          )}

          {/* Collapse toggle — desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </Button>

          {/* Close button — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Spacer instead of separator */}
        <div className="h-px mx-4 bg-[#d4d9e0]" />

        {/* Navigation links (Neumorphic) */}
        <nav className="flex-1 space-y-2 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 rounded-xl px-3 py-2.5
                  text-sm font-semibold transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#E0E5EC] text-ilh-navy-700 shadow-neo-pressed"
                      : "text-slate-500 hover:bg-[#E0E5EC] hover:text-slate-700 hover:shadow-neo-raised-sm"
                  }
                  ${collapsed ? "justify-center px-2" : ""}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-ilh-green-600" : ""}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User area at bottom */}
        <div className="p-3 pt-0">
          <div className="h-px mx-1 mb-3 bg-[#d4d9e0]" />
          <div
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            <Avatar className="h-9 w-9 shadow-neo-raised-sm">
              <AvatarFallback className="bg-[#E0E5EC] text-ilh-navy-700 text-xs font-bold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {user.full_name || "User"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50/50"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — mobile (Neumorphic) */}
        <header className="flex h-14 items-center gap-4 bg-[#E0E5EC] shadow-neo-raised-sm px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </Button>
          <img
            src="https://ivyleaguehouse.com/wp-content/uploads/2024/05/ILH-Logo.png"
            alt="ILH Logo"
            className="h-7 w-auto"
          />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#E0E5EC]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
