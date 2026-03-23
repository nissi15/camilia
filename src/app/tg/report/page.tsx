"use client";

import { useState, useEffect } from "react";
import { useTelegram } from "../providers";
import { BarChart3, TrendingUp, TrendingDown, Minus, DollarSign, Scale, Trash2 } from "lucide-react";

interface DaySummary {
  received: { count: number; weight: number };
  processed: { count: number; weight: number };
  dispatched: { count: number };
  waste: { count: number; weight: number; costRwf: number };
  yieldPercent: number;
  prevYieldPercent: number;
  pendingRequests: number;
}

export default function ReportPage() {
  const { apiFetch } = useTelegram();
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [topWaste, setTopWaste] = useState<Array<{ name: string; weight: number }>>([]);

  useEffect(() => {
    loadReport();
  }, [apiFetch]);

  async function loadReport() {
    try {
      // Fetch today's data
      const [dashRes, wasteRes] = await Promise.all([
        apiFetch("/api/dashboard"),
        apiFetch("/api/reports/waste?days=1"),
      ]);

      let dashData = null;
      let wasteData = null;

      if (dashRes.ok) dashData = await dashRes.json();
      if (wasteRes.ok) wasteData = await wasteRes.json();

      // Build summary from dashboard data
      const received = dashData?.recentItems?.filter((i: { status: string }) => i.status === "RECEIVED") || [];
      const processed = dashData?.recentItems?.filter((i: { status: string }) => i.status === "PROCESSED") || [];
      const waste = dashData?.recentItems?.filter((i: { status: string }) => i.status === "WASTE") || [];

      const receivedWeight = received.reduce((s: number, i: { weightGrams: number }) => s + Number(i.weightGrams || 0), 0);
      const processedWeight = processed.reduce((s: number, i: { weightGrams: number }) => s + Number(i.weightGrams || 0), 0);
      const wasteWeight = waste.reduce((s: number, i: { weightGrams: number }) => s + Number(i.weightGrams || 0), 0);
      const wasteCost = waste.reduce((s: number, i: { costRwf: number }) => s + Number(i.costRwf || 0), 0);

      const yieldPct = receivedWeight > 0 ? ((receivedWeight - wasteWeight) / receivedWeight) * 100 : 100;

      setSummary({
        received: { count: received.length, weight: receivedWeight },
        processed: { count: processed.length, weight: processedWeight },
        dispatched: { count: dashData?.pendingRequests || 0 },
        waste: { count: waste.length, weight: wasteWeight, costRwf: wasteCost },
        yieldPercent: Math.round(yieldPct * 10) / 10,
        prevYieldPercent: 0, // Would need historical data
        pendingRequests: dashData?.pendingRequests || 0,
      });

      // Top wasted items
      if (wasteData?.wasteByCategory) {
        const topItems = wasteData.wasteByCategory
          .sort((a: { totalWeight: number }, b: { totalWeight: number }) => b.totalWeight - a.totalWeight)
          .slice(0, 3)
          .map((c: { categoryName: string; totalWeight: number }) => ({
            name: c.categoryName,
            weight: c.totalWeight,
          }));
        setTopWaste(topItems);
      }
    } catch {
      // Dashboard may not return exact format, that's ok
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const yieldTrend = summary
    ? summary.yieldPercent > summary.prevYieldPercent
      ? "up"
      : summary.yieldPercent < summary.prevYieldPercent
        ? "down"
        : "flat"
    : "flat";

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Quick Report</h1>
          <p className="text-xs text-gray-500">Today&apos;s summary</p>
        </div>
      </div>

      {/* Main yield card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center mb-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Overall Yield</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-5xl font-bold text-gray-900">{summary?.yieldPercent || 0}%</span>
          {yieldTrend === "up" && <TrendingUp className="w-6 h-6 text-emerald-500" />}
          {yieldTrend === "down" && <TrendingDown className="w-6 h-6 text-red-500" />}
          {yieldTrend === "flat" && <Minus className="w-6 h-6 text-gray-300" />}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-400 font-medium">Received</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary?.received.count || 0}</p>
          <p className="text-xs text-gray-500">
            {((summary?.received.weight || 0) / 1000).toFixed(1)}kg
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-400 font-medium">Processed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary?.processed.count || 0}</p>
          <p className="text-xs text-gray-500">
            {((summary?.processed.weight || 0) / 1000).toFixed(1)}kg
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-400 font-medium">Waste</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{summary?.waste.count || 0}</p>
          <p className="text-xs text-gray-500">
            {((summary?.waste.weight || 0) / 1000).toFixed(1)}kg
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-400 font-medium">Waste Cost</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {(summary?.waste.costRwf || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">RWF</p>
        </div>
      </div>

      {/* Pending requests */}
      {(summary?.pendingRequests || 0) > 0 && (
        <div className="bg-amber-50 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">Pending Requests</p>
            <p className="text-xs text-amber-600">Awaiting approval</p>
          </div>
          <span className="text-2xl font-bold text-amber-700">{summary?.pendingRequests}</span>
        </div>
      )}

      {/* Top wasted items */}
      {topWaste.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-3">Top Wasted Items</p>
          {topWaste.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-red-100 rounded text-[10px] font-bold text-red-600 flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-800">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-600">{(item.weight / 1000).toFixed(1)}kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
