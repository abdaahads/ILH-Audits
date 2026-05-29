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
import { Separator } from "@/components/ui/separator";

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
    <div className="flex h-screen overflow-hidden bg-ilh-gradient-light">
      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          glass-sidebar transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-64"}
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ilh-navy-500 text-white font-bold text-sm">
                ILH
              </div>
            </Link>
          )}

          {/* Collapse toggle — desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 text-ilh-navy-400 hover:text-ilh-navy-600"
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

        <Separator className="opacity-50" />

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
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
                      ? "bg-ilh-navy-500 text-white shadow-lg shadow-ilh-navy-500/20"
                      : "text-ilh-navy-400 hover:bg-ilh-navy-50 hover:text-ilh-navy-600"
                  }
                  ${collapsed ? "justify-center px-2" : ""}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : ""}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User area at bottom */}
        <div className="border-t border-ilh-navy-100/50 p-3">
          <div
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            <Avatar className="h-9 w-9 border-2 border-ilh-navy-100">
              <AvatarFallback className="bg-ilh-navy-500 text-white text-xs font-bold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ilh-navy-700 truncate">
                  {user.full_name || "User"}
                </p>
                <p className="text-xs text-ilh-navy-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-ilh-navy-400 hover:text-red-500 hover:bg-red-50"
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
        {/* Top bar — mobile */}
        <header className="flex h-14 items-center gap-4 border-b border-ilh-navy-100/30 bg-white/80 backdrop-blur-md px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-ilh-navy-500" />
          </Button>
          <img
            src="https://ivyleaguehouse.com/wp-content/uploads/2024/05/ILH-Logo.png"
            alt="ILH Logo"
            className="h-7 w-auto"
          />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
