"use client";

import { useTelegram } from "./providers";
import { PackageOpen, Scissors, ClipboardList, Package, BarChart3 } from "lucide-react";
import Link from "next/link";

const quickActions = [
  { label: "Receive Stock", href: "/tg/receive", icon: PackageOpen, color: "bg-emerald-500", desc: "Log incoming deliveries" },
  { label: "Process", href: "/tg/process", icon: Scissors, color: "bg-blue-500", desc: "Butcher & portion items" },
  { label: "Requests", href: "/tg/requests", icon: ClipboardList, color: "bg-amber-500", desc: "View & manage orders" },
  { label: "Stock Check", href: "/tg/stock", icon: Package, color: "bg-purple-500", desc: "Current inventory levels" },
  { label: "Quick Report", href: "/tg/report", icon: BarChart3, color: "bg-rose-500", desc: "Today's summary" },
];

export default function TelegramHome() {
  const { user } = useTelegram();

  // AccessGate in layout handles loading + not-linked states
  if (!user) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Welcome card */}
      <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] border border-black/[0.04]">
        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Welcome back</p>
        <h1 className="text-xl font-bold text-on-surface mt-1">{user.name}</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          {user.role === "WAREHOUSE_ADMIN" ? "Warehouse Admin" : "Restaurant Staff"}
          {user.locationName && ` • ${user.locationName}`}
        </p>
      </div>

      {/* Quick actions */}
      <div className="space-y-2.5">
        {quickActions
          .filter((a) => {
            if (user.role === "RESTAURANT_STAFF") {
              return !["Receive Stock", "Process"].includes(a.label);
            }
            return true;
          })
          .map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] active:scale-[0.98] transition-all duration-200"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface">{action.label}</p>
                <p className="text-xs text-on-surface-variant">{action.desc}</p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
