"use client";

import { useTelegram } from "./providers";
import { PackageOpen, Scissors, ClipboardList, Package, BarChart3, PlusCircle, MessageSquare, Send, ChevronRight } from "lucide-react";
import Link from "next/link";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  desc: string;
}

const warehouseActions: QuickAction[] = [
  { label: "Receive Stock", href: "/tg/receive", icon: PackageOpen, desc: "Log incoming deliveries" },
  { label: "Process", href: "/tg/process", icon: Scissors, desc: "Butcher & portion items" },
  { label: "Requests", href: "/tg/requests", icon: ClipboardList, desc: "View & manage orders" },
  { label: "Stock Check", href: "/tg/stock", icon: Package, desc: "Current inventory levels" },
  { label: "Messages", href: "/tg/messages", icon: MessageSquare, desc: "Chat with restaurants" },
];

const restaurantActions: QuickAction[] = [
  { label: "New Request", href: "/tg/new-request", icon: PlusCircle, desc: "Order ingredients" },
  { label: "My Requests", href: "/tg/requests", icon: Send, desc: "Track your orders" },
  { label: "Messages", href: "/tg/messages", icon: MessageSquare, desc: "Chat with warehouse" },
  { label: "Stock Check", href: "/tg/stock", icon: Package, desc: "Current inventory levels" },
];

export default function TelegramHome() {
  const { user } = useTelegram();

  if (!user) return null;

  const actions = user.role === "RESTAURANT_STAFF" ? restaurantActions : warehouseActions;

  return (
    <div className="p-4 space-y-5">
      {/* Welcome card */}
      <div className="tg-card p-5 tg-animate-in relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/[0.04] rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-[11px] font-semibold text-tertiary uppercase tracking-widest">Welcome back</p>
        <h1 className="text-2xl text-on-surface mt-1 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          {user.name}
        </h1>
        <p className="text-xs text-on-surface-variant mt-1">
          {user.role === "WAREHOUSE_ADMIN" ? "Warehouse Admin" : "Restaurant Staff"}
          {user.locationName && (
            <span className="inline-flex items-center ml-1.5 px-2 py-0.5 bg-surface-container rounded-full text-[10px] font-medium">
              {user.locationName}
            </span>
          )}
        </p>
      </div>

      {/* Quick actions */}
      <div className="space-y-2.5 tg-stagger">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="tg-card flex items-center gap-4 p-4 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-tertiary/10 rounded-xl flex items-center justify-center shrink-0 group-active:bg-tertiary/20 transition-colors">
              <action.icon className="w-5 h-5 text-tertiary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-on-surface text-[15px]">{action.label}</p>
              <p className="text-xs text-on-surface-variant">{action.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-outline-variant/60 group-active:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
