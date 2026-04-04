"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { gramsToKg, formatRwf } from "@/lib/constants";
import {
  TrendingUp, TrendingDown, AlertTriangle, Download, Weight,
  BarChart3, Layers, Truck, DollarSign, Users, ArrowUpRight,
  ArrowDownRight, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const RechartsLoading = () => (
  <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">Loading chart...</div>
);

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false, loading: RechartsLoading });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });

interface InsightsData {
  summary: {
    thisMonth: { wasteCost: number; wasteWeight: number; inputWeight: number; outputWeight: number; wastePct: number; stepCount: number };
    lastMonth: { wasteCost: number; wasteWeight: number; inputWeight: number; outputWeight: number; wastePct: number; stepCount: number };
    costTrend: number;
    weightTrend: number;
  };
  wasteByCategory: {
    name: string;
    inputWeight: number;
    outputWeight: number;
    wasteWeight: number;
    wasteCost: number;
    wastePct: number;
    yieldPct: number;
    stepCount: number;
  }[];
  staffPerformance: {
    userId: string;
    name: string;
    totalInputWeight: number;
    totalOutputWeight: number;
    totalWasteWeight: number;
    totalWasteCost: number;
    stepCount: number;
    avgYieldPct: number;
    wastePct: number;
  }[];
  trueCostAnalysis: {
    itemId: string;
    name: string;
    category: string;
    purchaseCost: number;
    purchaseWeightGrams: number;
    usableOutputWeightGrams: number;
    wasteWeightGrams: number;
    purchasePricePerKg: number;
    effectivePricePerKg: number;
    costInflation: number;
  }[];
  weeklyTrends: {
    week: string;
    wasteWeight: number;
    wasteCost: number;
    inputWeight: number;
    stepCount: number;
    wastePct: number;
  }[];
}

interface DispatchData {
  id: string;
  requestNumber: string;
  restaurant: string;
  status: string;
  itemCount: number;
  dispatchedAt: string | null;
  deliveredAt: string | null;
}

function TrendBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  // For waste, going UP is bad (so invert=true makes positive = red)
  const isGood = invert ? value < 0 : value > 0;
  const isBad = invert ? value > 0 : value < 0;

  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-on-surface-variant">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      isBad ? "text-error" : isGood ? "text-emerald-600" : "text-on-surface-variant"
    }`}>
      {value > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
}

export default function ReportsPage() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [dispatch, setDispatch] = useState<DispatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/insights").then((r) => r.json()),
      fetch("/api/reports/dispatch").then((r) => r.json()),
    ])
      .then(([insightsData, dispatchData]) => {
        setInsights(insightsData);
        setDispatch(dispatchData.dispatches || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = insights?.summary;

  return (
    <AppShell title="Reports">
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Reports & Insights</h1>
          <p className="text-sm text-on-surface-variant mt-1">Cost analysis, waste tracking, staff performance, and trends.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-on-surface-variant hover:text-on-surface"
            onClick={() => window.open("/api/reports/export?type=waste&days=90", "_blank")}
          >
            <Download className="w-3.5 h-3.5" />
            Waste CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-on-surface-variant hover:text-on-surface"
            onClick={() => window.open("/api/reports/export?type=yield&days=90", "_blank")}
          >
            <Download className="w-3.5 h-3.5" />
            Yield CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="waste-cost">
        <TabsList className="h-9 rounded-lg bg-surface-container/60 p-0.5 flex-wrap">
          <TabsTrigger value="waste-cost" className="rounded-md px-3 text-sm data-[state=active]:bg-white data-[state=active]:text-on-surface data-[state=active]:shadow-sm">
            Waste Cost
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-md px-3 text-sm data-[state=active]:bg-white data-[state=active]:text-on-surface data-[state=active]:shadow-sm">
            By Category
          </TabsTrigger>
          <TabsTrigger value="staff" className="rounded-md px-3 text-sm data-[state=active]:bg-white data-[state=active]:text-on-surface data-[state=active]:shadow-sm">
            Staff
          </TabsTrigger>
          <TabsTrigger value="true-cost" className="rounded-md px-3 text-sm data-[state=active]:bg-white data-[state=active]:text-on-surface data-[state=active]:shadow-sm">
            True Cost
          </TabsTrigger>
          <TabsTrigger value="trends" className="rounded-md px-3 text-sm data-[state=active]:bg-white data-[state=active]:text-on-surface data-[state=active]:shadow-sm">
            Trends
          </TabsTrigger>
          <TabsTrigger value="dispatch" className="rounded-md px-3 text-sm data-[state=active]:bg-white data-[state=active]:text-on-surface data-[state=active]:shadow-sm">
            Dispatch
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Waste Cost Summary ── */}
        <TabsContent value="waste-cost" className="mt-5 space-y-5">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">Loading...</div>
          ) : !s ? (
            <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">No data available.</div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-xl border border-outline-variant/15">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-on-surface-variant">Waste Cost This Month</p>
                        <p className="text-2xl font-semibold tracking-tight text-error">
                          {formatRwf(s.thisMonth.wasteCost)}
                        </p>
                        <TrendBadge value={s.costTrend} invert />
                      </div>
                      <div className="rounded-lg bg-error/10 p-2">
                        <DollarSign className="h-4 w-4 text-error" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border border-outline-variant/15">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-on-surface-variant">Waste Weight This Month</p>
                        <p className="text-2xl font-semibold tracking-tight text-on-surface">
                          {gramsToKg(s.thisMonth.wasteWeight)} kg
                        </p>
                        <TrendBadge value={s.weightTrend} invert />
                      </div>
                      <div className="rounded-lg bg-on-surface/5 p-2">
                        <Weight className="h-4 w-4 text-on-surface-variant" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border border-outline-variant/15">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-on-surface-variant">Waste Rate</p>
                        <p className={`text-2xl font-semibold tracking-tight ${
                          s.thisMonth.wastePct > 15 ? "text-error" :
                          s.thisMonth.wastePct > 10 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {s.thisMonth.wastePct}%
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Last month: {s.lastMonth.wastePct}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-on-surface/5 p-2">
                        <AlertTriangle className="h-4 w-4 text-on-surface-variant" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border border-outline-variant/15">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-on-surface-variant">Processing Steps</p>
                        <p className="text-2xl font-semibold tracking-tight text-on-surface">
                          {s.thisMonth.stepCount}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Last month: {s.lastMonth.stepCount}
                        </p>
                      </div>
                      <div className="rounded-lg bg-on-surface/5 p-2">
                        <Layers className="h-4 w-4 text-on-surface-variant" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Month comparison */}
              <Card className="rounded-xl border border-outline-variant/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-on-surface">Month-over-Month Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-3">This Month</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-on-surface-variant">Input processed</span><span className="font-medium tabular-nums">{gramsToKg(s.thisMonth.inputWeight)} kg</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant">Usable output</span><span className="font-medium tabular-nums">{gramsToKg(s.thisMonth.outputWeight)} kg</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant">Waste</span><span className="font-medium text-error tabular-nums">{gramsToKg(s.thisMonth.wasteWeight)} kg</span></div>
                        <div className="flex justify-between border-t border-outline-variant/15 pt-2"><span className="text-on-surface-variant">Money lost to waste</span><span className="font-semibold text-error tabular-nums">{formatRwf(s.thisMonth.wasteCost)}</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-3">Last Month</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-on-surface-variant">Input processed</span><span className="font-medium tabular-nums">{gramsToKg(s.lastMonth.inputWeight)} kg</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant">Usable output</span><span className="font-medium tabular-nums">{gramsToKg(s.lastMonth.outputWeight)} kg</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant">Waste</span><span className="font-medium text-error tabular-nums">{gramsToKg(s.lastMonth.wasteWeight)} kg</span></div>
                        <div className="flex justify-between border-t border-outline-variant/15 pt-2"><span className="text-on-surface-variant">Money lost to waste</span><span className="font-semibold text-error tabular-nums">{formatRwf(s.lastMonth.wasteCost)}</span></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Tab 2: Category Breakdown ── */}
        <TabsContent value="categories" className="mt-5 space-y-5">
          {loading || !insights ? (
            <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">{loading ? "Loading..." : "No data."}</div>
          ) : insights.wasteByCategory.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">No processing data yet. Process items to see category breakdown.</div>
          ) : (
            <>
              {/* Bar chart: waste cost by category */}
              <Card className="rounded-xl border border-outline-variant/15">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-on-surface-variant" />
                    <div>
                      <CardTitle className="text-sm font-semibold text-on-surface">Waste Cost by Category</CardTitle>
                      <p className="text-xs text-on-surface-variant mt-0.5">Money lost per category (last 3 months)</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.wasteByCategory} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant) / 0.15)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--outline-variant) / 0.15)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", fontSize: 13 }}
                          formatter={(value: unknown) => [formatRwf(Number(value)), "Waste Cost"]}
                        />
                        <Bar dataKey="wasteCost" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Waste % chart */}
              <Card className="rounded-xl border border-outline-variant/15">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-on-surface-variant" />
                    <div>
                      <CardTitle className="text-sm font-semibold text-on-surface">Waste Percentage by Category</CardTitle>
                      <p className="text-xs text-on-surface-variant mt-0.5">% of input weight lost as waste</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.wasteByCategory} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant) / 0.15)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} unit="%" axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--outline-variant) / 0.15)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", fontSize: 13 }}
                          formatter={(value: unknown) => [`${value}%`, "Waste"]}
                        />
                        <Bar dataKey="wastePct" fill="#2A7D6E" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed table */}
              <Card className="rounded-xl border border-outline-variant/15">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-on-surface">Category Detail</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/15 hover:bg-transparent">
                          <TableHead className="text-xs font-medium text-on-surface-variant">Category</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Input (kg)</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Output (kg)</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Waste (kg)</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Waste %</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Yield %</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant text-right">Waste Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.wasteByCategory.map((cat) => (
                          <TableRow key={cat.name} className="border-outline-variant/15 hover:bg-surface-container/30">
                            <TableCell className="text-sm font-medium text-on-surface">{cat.name}</TableCell>
                            <TableCell className="text-sm text-on-surface-variant tabular-nums">{gramsToKg(cat.inputWeight)}</TableCell>
                            <TableCell className="text-sm text-on-surface-variant tabular-nums">{gramsToKg(cat.outputWeight)}</TableCell>
                            <TableCell className="text-sm text-on-surface tabular-nums">{gramsToKg(cat.wasteWeight)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${
                                cat.wastePct > 15 ? "bg-error/10 text-error" :
                                cat.wastePct > 10 ? "bg-amber-500/10 text-amber-700" :
                                "bg-emerald-500/10 text-emerald-700"
                              }`}>
                                {cat.wastePct}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${
                                cat.yieldPct >= 85 ? "bg-emerald-500/10 text-emerald-700" :
                                cat.yieldPct >= 75 ? "bg-amber-500/10 text-amber-700" :
                                "bg-error/10 text-error"
                              }`}>
                                {cat.yieldPct}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-error tabular-nums">{formatRwf(cat.wasteCost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Tab 3: Staff Performance ── */}
        <TabsContent value="staff" className="mt-5 space-y-5">
          {loading || !insights ? (
            <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">{loading ? "Loading..." : "No data."}</div>
          ) : insights.staffPerformance.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">No staff processing data yet.</div>
          ) : (
            <>
              {/* Staff summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.staffPerformance.map((staff) => (
                  <Card key={staff.userId} className="rounded-xl border border-outline-variant/15">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{staff.name}</p>
                          <p className="text-xs text-on-surface-variant">{staff.stepCount} processing steps</p>
                        </div>
                        <div className="rounded-lg bg-tertiary/10 p-2">
                          <Users className="h-4 w-4 text-tertiary" />
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Avg yield</span>
                          <span className={`font-medium ${
                            staff.avgYieldPct >= 85 ? "text-emerald-600" :
                            staff.avgYieldPct >= 75 ? "text-amber-600" : "text-error"
                          }`}>{staff.avgYieldPct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Waste rate</span>
                          <span className={`font-medium ${
                            staff.wastePct <= 10 ? "text-emerald-600" :
                            staff.wastePct <= 15 ? "text-amber-600" : "text-error"
                          }`}>{staff.wastePct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Total waste</span>
                          <span className="font-medium tabular-nums">{gramsToKg(staff.totalWasteWeight)} kg</span>
                        </div>
                        <div className="flex justify-between border-t border-outline-variant/15 pt-2">
                          <span className="text-on-surface-variant">Waste cost</span>
                          <span className="font-semibold text-error tabular-nums">{formatRwf(staff.totalWasteCost)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Staff yield comparison chart */}
              <Card className="rounded-xl border border-outline-variant/15">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-on-surface-variant" />
                    <div>
                      <CardTitle className="text-sm font-semibold text-on-surface">Staff Yield Comparison</CardTitle>
                      <p className="text-xs text-on-surface-variant mt-0.5">Average yield % by staff member (last 3 months)</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.staffPerformance} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant) / 0.15)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} unit="%" domain={[0, 100]} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--outline-variant) / 0.15)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", fontSize: 13 }}
                          formatter={(value: unknown) => [`${value}%`, "Yield"]}
                        />
                        <Bar dataKey="avgYieldPct" fill="#2A7D6E" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Tab 4: True Cost Analysis ── */}
        <TabsContent value="true-cost" className="mt-5 space-y-5">
          {loading || !insights ? (
            <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">{loading ? "Loading..." : "No data."}</div>
          ) : insights.trueCostAnalysis.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-sm text-on-surface-variant gap-2">
              <DollarSign className="w-8 h-8 opacity-40" />
              <p>No true cost data yet.</p>
              <p className="text-xs">Process items that have a purchase cost to see how waste inflates the real price per kg.</p>
            </div>
          ) : (
            <>
              {/* Explanation card */}
              <Card className="rounded-xl border border-tertiary/20 bg-tertiary/5">
                <CardContent className="p-4">
                  <p className="text-sm text-on-surface">
                    <strong>True Cost</strong> shows how waste inflates the real price of your ingredients.
                    If you buy 10kg of beef at 1,000 RWF/kg but lose 2kg to waste, the actual cost of usable meat is 1,250 RWF/kg.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-outline-variant/15">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-on-surface-variant" />
                    <CardTitle className="text-sm font-semibold text-on-surface">True Cost per Item</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-outline-variant/15 hover:bg-transparent">
                          <TableHead className="text-xs font-medium text-on-surface-variant">Item</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Category</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Purchased</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Usable</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Waste</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Price/kg (Bought)</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant">Price/kg (True)</TableHead>
                          <TableHead className="text-xs font-medium text-on-surface-variant text-right">Cost Inflation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.trueCostAnalysis.map((item) => (
                          <TableRow key={item.itemId} className="border-outline-variant/15 hover:bg-surface-container/30">
                            <TableCell className="text-sm font-medium text-on-surface max-w-[160px] truncate">{item.name}</TableCell>
                            <TableCell className="text-sm text-on-surface-variant">{item.category}</TableCell>
                            <TableCell className="text-sm text-on-surface-variant tabular-nums">{gramsToKg(item.purchaseWeightGrams)} kg</TableCell>
                            <TableCell className="text-sm text-on-surface-variant tabular-nums">{gramsToKg(item.usableOutputWeightGrams)} kg</TableCell>
                            <TableCell className="text-sm text-error tabular-nums">{gramsToKg(item.wasteWeightGrams)} kg</TableCell>
                            <TableCell className="text-sm text-on-surface tabular-nums">{formatRwf(item.purchasePricePerKg)}</TableCell>
                            <TableCell className="text-sm font-semibold text-on-surface tabular-nums">{formatRwf(item.effectivePricePerKg)}</TableCell>
                            <TableCell className="text-right">
                              <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${
                                item.costInflation > 20 ? "bg-error/10 text-error" :
                                item.costInflation > 10 ? "bg-amber-500/10 text-amber-700" :
                                "bg-emerald-500/10 text-emerald-700"
                              }`}>
                                +{item.costInflation}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Tab 5: Trends ── */}
        <TabsContent value="trends" className="mt-5 space-y-5">
          {loading || !insights ? (
            <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">{loading ? "Loading..." : "No data."}</div>
          ) : insights.weeklyTrends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">No trend data yet. Process items over multiple weeks to see trends.</div>
          ) : (
            <>
              {/* Waste cost trend */}
              <Card className="rounded-xl border border-outline-variant/15">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-on-surface-variant" />
                    <div>
                      <CardTitle className="text-sm font-semibold text-on-surface">Weekly Waste Cost</CardTitle>
                      <p className="text-xs text-on-surface-variant mt-0.5">RWF lost to waste per week (last 12 weeks)</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={insights.weeklyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant) / 0.15)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--outline-variant) / 0.15)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", fontSize: 13 }}
                          formatter={(value: unknown, name: unknown) => [
                            name === "wasteCost" ? formatRwf(Number(value)) : `${value}%`,
                            name === "wasteCost" ? "Waste Cost" : "Waste %",
                          ]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="wasteCost" stroke="#dc2626" strokeWidth={2} dot={{ r: 3, fill: "#dc2626" }} name="Waste Cost (RWF)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Waste % trend */}
              <Card className="rounded-xl border border-outline-variant/15">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-on-surface-variant" />
                    <div>
                      <CardTitle className="text-sm font-semibold text-on-surface">Weekly Waste Rate</CardTitle>
                      <p className="text-xs text-on-surface-variant mt-0.5">Waste % over time — lower is better</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={insights.weeklyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant) / 0.15)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} unit="%" axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--outline-variant) / 0.15)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", fontSize: 13 }}
                          formatter={(value: unknown) => [`${value}%`, "Waste Rate"]}
                        />
                        <Line type="monotone" dataKey="wastePct" stroke="#2A7D6E" strokeWidth={2} dot={{ r: 3, fill: "#2A7D6E" }} name="Waste %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly volume */}
              <Card className="rounded-xl border border-outline-variant/15">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-on-surface-variant" />
                    <div>
                      <CardTitle className="text-sm font-semibold text-on-surface">Weekly Processing Volume</CardTitle>
                      <p className="text-xs text-on-surface-variant mt-0.5">Weight processed per week</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.weeklyTrends.map(w => ({ ...w, inputWeightKg: Math.round(w.inputWeight / 1000 * 100) / 100, wasteWeightKg: Math.round(w.wasteWeight / 1000 * 100) / 100 }))} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant) / 0.15)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} unit=" kg" axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--outline-variant) / 0.15)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", fontSize: 13 }}
                          formatter={(value: unknown) => [`${value} kg`]}
                        />
                        <Legend />
                        <Bar dataKey="inputWeightKg" fill="#2A7D6E" radius={[4, 4, 0, 0]} name="Input (kg)" />
                        <Bar dataKey="wasteWeightKg" fill="#dc2626" radius={[4, 4, 0, 0]} name="Waste (kg)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Tab 6: Dispatch Log (kept from original) ── */}
        <TabsContent value="dispatch" className="mt-5">
          <Card className="rounded-xl border border-outline-variant/15">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-on-surface-variant" />
                <CardTitle className="text-sm font-semibold text-on-surface">Dispatch Log</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-outline-variant/15 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-on-surface-variant">Request #</TableHead>
                    <TableHead className="text-xs font-medium text-on-surface-variant">Restaurant</TableHead>
                    <TableHead className="text-xs font-medium text-on-surface-variant">Status</TableHead>
                    <TableHead className="text-xs font-medium text-on-surface-variant">Items</TableHead>
                    <TableHead className="text-xs font-medium text-on-surface-variant">Dispatched</TableHead>
                    <TableHead className="text-xs font-medium text-on-surface-variant">Delivered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-sm text-on-surface-variant">Loading...</TableCell>
                    </TableRow>
                  ) : dispatch.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-sm text-on-surface-variant">No dispatches yet.</TableCell>
                    </TableRow>
                  ) : (
                    dispatch.map((d) => (
                      <TableRow key={d.id} className="border-outline-variant/15 hover:bg-surface-container/30">
                        <TableCell className="font-mono text-sm text-on-surface">{d.requestNumber}</TableCell>
                        <TableCell className="text-sm text-on-surface">{d.restaurant}</TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                        <TableCell className="text-sm text-on-surface-variant tabular-nums">{d.itemCount}</TableCell>
                        <TableCell className="text-sm text-on-surface-variant">
                          {d.dispatchedAt ? new Date(d.dispatchedAt).toLocaleDateString() : "\u2014"}
                        </TableCell>
                        <TableCell className="text-sm text-on-surface-variant">
                          {d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() : "\u2014"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
