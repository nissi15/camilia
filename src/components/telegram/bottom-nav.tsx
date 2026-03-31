"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/app/tg/providers";
import {
  Home,
  PackageOpen,
  ClipboardList,
  Package,
  BarChart3,
  PlusCircle,
  MessageSquare,
} from "lucide-react";

interface Tab {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

const warehouseTabs: Tab[] = [
  { label: "Home", href: "/tg", icon: Home, exact: true },
  { label: "Receive", href: "/tg/receive", icon: PackageOpen },
  { label: "Requests", href: "/tg/requests", icon: ClipboardList },
  { label: "Stock", href: "/tg/stock", icon: Package },
  { label: "Report", href: "/tg/report", icon: BarChart3 },
];

const restaurantTabs: Tab[] = [
  { label: "Home", href: "/tg", icon: Home, exact: true },
  { label: "Order", href: "/tg/new-request", icon: PlusCircle },
  { label: "Requests", href: "/tg/requests", icon: ClipboardList },
  { label: "Messages", href: "/tg/messages", icon: MessageSquare },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useTelegram();

  const tabs = user?.role === "RESTAURANT_STAFF" ? restaurantTabs : warehouseTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      style={{ animation: "tg-slide-up 0.5s var(--ease-premium) both", animationDelay: "200ms" }}>
      <div className="mx-3 mb-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-black/[0.06]"
        style={{ boxShadow: "0 -2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)" }}>
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-300 min-w-[60px] relative",
                  isActive
                    ? "text-tertiary"
                    : "text-on-surface-variant/50 active:text-on-surface-variant"
                )}
              >
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-tertiary rounded-full tg-animate-scale" />
                )}
                <tab.icon className={cn("w-5 h-5 transition-all duration-300", isActive && "stroke-[2.5]")} />
                <span className={cn(
                  "text-[10px] transition-all duration-300",
                  isActive ? "font-bold" : "font-medium"
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
