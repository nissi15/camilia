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
      const [dashRes, wasteRes] = await Promise.all([
        apiFetch("/api/dashboard"),
        apiFetch("/api/reports/waste?days=1"),
      ]);

      let dashData = null;
      let wasteData = null;

      if (dashRes.ok) dashData = await dashRes.json();
      if (wasteRes.ok) wasteData = await wasteRes.json();

      const recentItems = Array.isArray(dashData?.recentItems) ? dashData.recentItems : [];
      const received = recentItems.filter((i: { status: string }) => i.status === "RECEIVED");
      const processed = recentItems.filter((i: { status: string }) => i.status === "PROCESSED");
      const waste = recentItems.filter((i: { status: string }) => i.status === "WASTE");

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
        prevYieldPercent: 0,
        pendingRequests: dashData?.pendingRequests || 0,
      });

      const wasteByCategory = Array.isArray(wasteData?.wasteByCategory) ? wasteData.wasteByCategory : [];
      if (wasteByCategory.length > 0) {
        const topItems = wasteByCategory
          .sort((a: { totalWeight: number }, b: { totalWeight: number }) => b.totalWeight - a.totalWeight)
          .slice(0, 3)
          .map((c: { categoryName: string; totalWeight: number }) => ({
            name: c.categoryName,
            weight: c.totalWeight,
          }));
        setTopWaste(topItems);
      }
    } catch {
      // Dashboard may not return exact format
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin w-6 h-6 border-2 border-tertiary border-t-transparent rounded-full" />
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
      <div className="tg-page-header tg-animate-in">
        <div className="tg-page-icon">
          <BarChart3 className="w-5 h-5 text-on-tertiary" />
        </div>
        <div>
          <h1 className="tg-page-title">Quick Report</h1>
          <p className="tg-page-subtitle">Today&apos;s summary</p>
        </div>
      </div>

      {/* Main yield card */}
      <div className="tg-card p-6 text-center mb-4 tg-animate-in" style={{ animationDelay: "50ms" }}>
        <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-widest mb-3">Overall Yield</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-5xl text-on-surface tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {summary?.yieldPercent || 0}%
          </span>
          {yieldTrend === "up" && <TrendingUp className="w-6 h-6 text-tertiary" />}
          {yieldTrend === "down" && <TrendingDown className="w-6 h-6 text-error" />}
          {yieldTrend === "flat" && <Minus className="w-6 h-6 text-outline-variant" />}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 tg-stagger">
        <div className="tg-card-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-tertiary" />
            <span className="text-[11px] text-on-surface-variant font-medium">Received</span>
          </div>
          <p className="text-2xl font-bold text-on-surface">{summary?.received.count || 0}</p>
          <p className="text-xs text-on-surface-variant">
            {((summary?.received.weight || 0) / 1000).toFixed(1)}kg
          </p>
        </div>

        <div className="tg-card-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-tertiary" />
            <span className="text-[11px] text-on-surface-variant font-medium">Processed</span>
          </div>
          <p className="text-2xl font-bold text-on-surface">{summary?.processed.count || 0}</p>
          <p className="text-xs text-on-surface-variant">
            {((summary?.processed.weight || 0) / 1000).toFixed(1)}kg
          </p>
        </div>

        <div className="tg-card-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-4 h-4 text-error" />
            <span className="text-[11px] text-on-surface-variant font-medium">Waste</span>
          </div>
          <p className="text-2xl font-bold text-error">{summary?.waste.count || 0}</p>
          <p className="text-xs text-on-surface-variant">
            {((summary?.waste.weight || 0) / 1000).toFixed(1)}kg
          </p>
        </div>

        <div className="tg-card-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-[11px] text-on-surface-variant font-medium">Waste Cost</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {(summary?.waste.costRwf || 0).toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant">RWF</p>
        </div>
      </div>

      {/* Pending requests */}
      {(summary?.pendingRequests || 0) > 0 && (
        <div className="tg-card-sm p-4 mb-4 flex items-center justify-between bg-primary/5 tg-animate-in" style={{ animationDelay: "200ms" }}>
          <div>
            <p className="text-sm font-semibold text-on-surface">Pending Requests</p>
            <p className="text-xs text-on-surface-variant">Awaiting approval</p>
          </div>
          <span className="text-2xl font-bold text-primary">{summary?.pendingRequests}</span>
        </div>
      )}

      {/* Top wasted items */}
      {topWaste.length > 0 && (
        <div className="tg-card-sm p-4 tg-animate-in" style={{ animationDelay: "250ms" }}>
          <p className="text-sm font-semibold text-on-surface mb-3">Top Wasted Items</p>
          {topWaste.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5 border-b border-surface-container last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-error/10 rounded-lg text-[10px] font-bold text-error flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-sm text-on-surface">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-on-surface-variant">{(item.weight / 1000).toFixed(1)}kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
