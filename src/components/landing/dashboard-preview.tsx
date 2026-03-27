"use client";

import {
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Warehouse,
  ChefHat,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const stats = [
  {
    label: "Total Stock Items",
    value: "2,847",
    change: "+12.5%",
    up: true,
    icon: Package,
    color: "#16A34A",
  },
  {
    label: "Active Requests",
    value: "156",
    change: "+8.2%",
    up: true,
    icon: Clock,
    color: "#6366F1",
  },
  {
    label: "Fulfilled Today",
    value: "89",
    change: "+23.1%",
    up: true,
    icon: CheckCircle2,
    color: "#16A34A",
  },
  {
    label: "Low Stock Alerts",
    value: "12",
    change: "-4.3%",
    up: false,
    icon: AlertCircle,
    color: "#F59E0B",
  },
];

const recentActivity = [
  {
    item: "Chicken Breast",
    from: "Main Warehouse",
    to: "Downtown Bistro",
    qty: "45 kg",
    status: "Delivered",
    statusColor: "#16A34A",
  },
  {
    item: "Olive Oil (Extra Virgin)",
    from: "Main Warehouse",
    to: "Harbor Grill",
    qty: "20 L",
    status: "Processing",
    statusColor: "#6366F1",
  },
  {
    item: "Fresh Salmon",
    from: "Cold Storage",
    to: "Skyline Restaurant",
    qty: "30 kg",
    status: "In Transit",
    statusColor: "#F59E0B",
  },
  {
    item: "Basmati Rice",
    from: "Main Warehouse",
    to: "Garden Cafe",
    qty: "100 kg",
    status: "Delivered",
    statusColor: "#16A34A",
  },
];

const chartBars = [65, 45, 80, 55, 70, 90, 75, 60, 85, 50, 95, 70];
const chartMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function DashboardPreview() {
  return (
    <div className="w-full h-full bg-[#F8FAFC] p-4 sm:p-5 overflow-hidden select-none pointer-events-none">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#0F172A] flex items-center justify-center">
            <Warehouse className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-bold text-[#0F172A]">Dashboard</span>
          <span className="text-[9px] text-[#94A3B8] ml-1">Warehouse Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 px-2 rounded bg-[#16A34A]/10 flex items-center">
            <span className="text-[8px] font-medium text-[#16A34A]">Live</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-[#E2E8F0]" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-[#E2E8F0] p-2.5"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}10` }}
              >
                <stat.icon className="w-2.5 h-2.5" style={{ color: stat.color }} />
              </div>
              <div className={`flex items-center gap-0.5 text-[8px] font-medium ${stat.up ? "text-[#16A34A]" : "text-[#F59E0B]"}`}>
                {stat.up ? (
                  <ArrowUpRight className="w-2 h-2" />
                ) : (
                  <ArrowDownRight className="w-2 h-2" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="text-[13px] font-bold text-[#0F172A] leading-none">
              {stat.value}
            </div>
            <div className="text-[7px] text-[#94A3B8] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main content: chart + activity */}
      <div className="grid grid-cols-5 gap-2.5">
        {/* Chart */}
        <div className="col-span-3 bg-white rounded-lg border border-[#E2E8F0] p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-[#64748B]" />
              <span className="text-[9px] font-semibold text-[#0F172A]">
                Fulfillment Overview
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 px-1.5 rounded bg-[#F1F5F9] flex items-center">
                <span className="text-[7px] text-[#64748B]">Monthly</span>
              </div>
            </div>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-[6px] h-[80px]">
            {chartBars.map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${height * 0.75}px`,
                    background:
                      i === 10
                        ? "linear-gradient(180deg, #16A34A, #16A34A90)"
                        : i % 2 === 0
                        ? "#E2E8F0"
                        : "#CBD5E1",
                  }}
                />
                <span className="text-[6px] text-[#94A3B8]">{chartMonths[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-2 bg-white rounded-lg border border-[#E2E8F0] p-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-[#64748B]" />
              <span className="text-[9px] font-semibold text-[#0F172A]">
                Recent Activity
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9] last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                    <ChefHat className="w-2.5 h-2.5 text-[#94A3B8]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[8px] font-medium text-[#0F172A] truncate">
                      {item.item}
                    </div>
                    <div className="text-[6px] text-[#94A3B8] truncate">
                      {item.from} → {item.to}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[7px] text-[#64748B] font-medium">
                    {item.qty}
                  </span>
                  <span
                    className="text-[6px] font-medium px-1 py-0.5 rounded"
                    style={{
                      color: item.statusColor,
                      backgroundColor: `${item.statusColor}10`,
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
