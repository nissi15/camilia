"use client";

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
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
}

const warehouseNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "OVERVIEW" },
  { label: "Inventory", href: "/inventory", icon: Package, section: "OPERATIONS" },
  { label: "Processing", href: "/processing", icon: Scissors },
  { label: "Requests", href: "/requests", icon: ClipboardList },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Reports", href: "/reports", icon: BarChart3, section: "INSIGHTS" },
  { label: "Messages", href: "/messages", icon: MessageSquare, section: "COMMUNICATION" },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings, section: "SYSTEM" },
];

const restaurantNav: NavItem[] = [
  { label: "Dashboard", href: "/my-dashboard", icon: LayoutDashboard, section: "OVERVIEW" },
  { label: "New Request", href: "/new-request", icon: PlusCircle, section: "ORDERS" },
  { label: "My Requests", href: "/my-requests", icon: Send },
  { label: "Messages", href: "/messages", icon: MessageSquare, section: "COMMUNICATION" },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings, section: "SYSTEM" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isWarehouse = session?.user?.role === "WAREHOUSE_ADMIN";
  const nav = isWarehouse ? warehouseNav : restaurantNav;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
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
        <div className="flex items-center justify-between h-[60px] px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tertiary to-tertiary/80 flex items-center justify-center shadow-lg shadow-tertiary/20">
              <Warehouse className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-[17px] text-white block leading-tight">
                StockTrace
              </span>
              <span className="text-[11px] font-medium text-sidebar-dark-text/80 tracking-widest uppercase">
                {isWarehouse ? "Warehouse" : "Restaurant"}
              </span>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-sidebar-dark-hover rounded-lg transition-colors">
            <X className="w-5 h-5 text-sidebar-dark-text" />
          </button>
        </div>

        {/* Separator */}
        <div className="mx-5 h-px bg-sidebar-dark-border/50" />

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 pb-2 overflow-y-auto">
          {nav.map((item, i) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <div key={item.href}>
                {/* Section label */}
                {item.section && (
                  <p className={cn(
                    "text-[11px] font-semibold tracking-[0.15em] text-sidebar-dark-text/60 uppercase px-3",
                    i === 0 ? "mb-2" : "mt-5 mb-2"
                  )}>
                    {item.section}
                  </p>
                )}
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-[10px] rounded-xl text-[14px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-tertiary/15 text-tertiary"
                      : "text-sidebar-dark-text hover:bg-sidebar-dark-hover hover:text-sidebar-dark-text-active"
                  )}
                >
                  <item.icon className={cn(
                    "w-[19px] h-[19px] shrink-0",
                    isActive ? "text-tertiary" : "text-sidebar-dark-text/90"
                  )} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-tertiary" />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-dark-hover/50">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tertiary/20 to-tertiary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-tertiary">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-sidebar-dark-text-active truncate leading-tight">
                {session?.user?.name}
              </p>
              <p className="text-[12px] text-sidebar-dark-text/70 truncate leading-tight mt-0.5">
                {isWarehouse ? "Warehouse Admin" : "Restaurant Staff"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
