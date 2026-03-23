"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PackageOpen,
  Scissors,
  ClipboardList,
  Package,
  BarChart3,
} from "lucide-react";

const tabs = [
  { label: "Receive", href: "/tg/receive", icon: PackageOpen },
  { label: "Process", href: "/tg/process", icon: Scissors },
  { label: "Requests", href: "/tg/requests", icon: ClipboardList },
  { label: "Stock", href: "/tg/stock", icon: Package },
  { label: "Report", href: "/tg/report", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors min-w-[60px]",
                isActive
                  ? "text-[#2e7d5b]"
                  : "text-gray-400 active:text-gray-600"
              )}
            >
              <tab.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
