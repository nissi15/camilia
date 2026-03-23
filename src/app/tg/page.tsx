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
  const { user, loading } = useTelegram();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Account Not Linked</h1>
        <p className="text-sm text-gray-500 mb-4">
          Ask your admin for a staff code, then use:<br />
          <code className="bg-gray-100 px-2 py-1 rounded text-emerald-600 font-mono">/link YOUR_CODE</code>
        </p>
      </div>
    );
  }

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
            // Restaurant staff doesn't see Receive or Process
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
