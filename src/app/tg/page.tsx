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
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-500">Welcome back</p>
        <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {user.role === "WAREHOUSE_ADMIN" ? "Warehouse Admin" : "Restaurant Staff"}
          {user.locationName && ` • ${user.locationName}`}
        </p>
      </div>

      <div className="space-y-3">
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
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm active:bg-gray-50 transition-colors"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shrink-0`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
