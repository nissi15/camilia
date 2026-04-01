"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Scissors,
  ClipboardList,
  BarChart3,
  Tags,
  MessageSquare,
  Send,
  PlusCircle,
  X,
  Warehouse,
  Bell,
  Settings,
  Trash2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
  badgeKey?: "notifications" | "messages";
}

const warehouseNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "OVERVIEW" },
  { label: "Inventory", href: "/inventory", icon: Package, section: "OPERATIONS" },
  { label: "Processing", href: "/processing", icon: Scissors },
  { label: "Requests", href: "/requests", icon: ClipboardList },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Waste Log", href: "/waste-log", icon: Trash2 },
  { label: "Reports", href: "/reports", icon: BarChart3, section: "INSIGHTS" },
  { label: "Messages", href: "/messages", icon: MessageSquare, section: "COMMUNICATION", badgeKey: "messages" },
  { label: "Notifications", href: "/notifications", icon: Bell, badgeKey: "notifications" },
  { label: "Settings", href: "/settings", icon: Settings, section: "SYSTEM" },
];

const restaurantNav: NavItem[] = [
  { label: "Dashboard", href: "/my-dashboard", icon: LayoutDashboard, section: "OVERVIEW" },
  { label: "New Request", href: "/new-request", icon: PlusCircle, section: "ORDERS" },
  { label: "My Requests", href: "/my-requests", icon: Send },
  { label: "Messages", href: "/messages", icon: MessageSquare, section: "COMMUNICATION", badgeKey: "messages" },
  { label: "Notifications", href: "/notifications", icon: Bell, badgeKey: "notifications" },
  { label: "Settings", href: "/settings", icon: Settings, section: "SYSTEM" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [badges, setBadges] = useState<{ notifications: number; messages: number }>({
    notifications: 0,
    messages: 0,
  });

  const isWarehouse = session?.user?.role === "WAREHOUSE_ADMIN";
  const nav = isWarehouse ? warehouseNav : restaurantNav;

  // Fetch badge counts
  const fetchBadges = useCallback(async () => {
    try {
      const [notifRes, convRes] = await Promise.all([
        fetch("/api/notifications/count"),
        fetch("/api/messages/conversations"),
      ]);
      const notif = notifRes.ok ? await notifRes.json() : { unreadCount: 0 };
      const convos = convRes.ok ? await convRes.json() : [];
      const msgUnread = Array.isArray(convos)
        ? convos.reduce((sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0), 0)
        : 0;
      setBadges({ notifications: notif.unreadCount || 0, messages: msgUnread });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    const handleVisibility = () => { if (!document.hidden) fetchBadges(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [status, fetchBadges]);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar-dark flex flex-col transition-transform duration-300 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-14 px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2A7D6E] flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-[15px] text-white block leading-tight">
                StockTrace
              </span>
              <span className="text-[10px] font-medium text-white/50 tracking-widest uppercase">
                {isWarehouse ? "Warehouse" : "Restaurant"}
              </span>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Separator */}
        <div className="mx-5 h-px bg-white/[0.06]" />

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 pb-2 overflow-y-auto">
          {nav.map((item, i) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <div key={item.href}>
                {/* Section label */}
                {item.section && (
                  <p className={cn(
                    "text-[11px] font-semibold tracking-[0.15em] text-white/30 uppercase px-3",
                    i === 0 ? "mb-1.5" : "mt-5 mb-1.5"
                  )}>
                    {item.section}
                  </p>
                )}
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-white/60 hover:bg-white/[0.04] hover:text-white/80"
                  )}
                >
                  <item.icon className={cn(
                    "w-[18px] h-[18px] shrink-0",
                    isActive ? "text-tertiary" : "text-white/40"
                  )} />
                  <span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-tertiary text-white text-[10px] font-bold">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                  {isActive && badgeCount === 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04]">
            <div className="w-7 h-7 rounded-md bg-tertiary/15 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-tertiary">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/90 truncate leading-tight">
                {session?.user?.name}
              </p>
              <p className="text-[11px] text-white/40 truncate leading-tight mt-0.5">
                {isWarehouse ? "Warehouse Admin" : "Restaurant Staff"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
