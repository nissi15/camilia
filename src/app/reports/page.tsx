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
import { gramsToLb } from "@/lib/constants";
import { TrendingUp, AlertTriangle, Download, Weight, BarChart3, Layers, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const RechartsLoading = () => <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">Loading chart...</div>;

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false, loading: RechartsLoading });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });

interface WasteData {
  name: string;
  inputWeight: number;
  outputWeight: number;
  wasteWeight: number;
  wastePercentage: number;
}

interface UsageData {
  date: string;
  count: number;
  weight: number;
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

export default function ReportsPage() {
  const [waste, setWaste] = useState<WasteData[]>([]);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [dispatch, setDispatch] = useState<DispatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/waste").then((r) => r.json()),
      fetch("/api/reports/usage?days=30").then((r) => r.json()),
      fetch("/api/reports/dispatch").then((r) => r.json()),
    ])
      .then(([wasteData, usageData, dispatchData]) => {
        setWaste(wasteData);
        setUsage(usageData);
        setDispatch(dispatchData.dispatches || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Find highest waste category
  const highestWaste = waste.reduce((max, w) => w.wastePercentage > (max?.wastePercentage || 0) ? w : max, waste[0]);
  const totalWasteLb = waste.reduce((sum, w) => sum + w.wasteWeight, 0);
  const totalInputLb = waste.reduce((sum, w) => sum + w.inputWeight, 0);
  const overallWastePct = totalInputLb > 0 ? ((totalWasteLb / totalInputLb) * 100).toFixed(1) : "0.0";

  return (
    <AppShell title="Reports">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Reports & Analytics</h1>
          <p className="text-sm text-on-surface-variant mt-1">Waste analysis, yield tracking, and dispatch logs.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-on-surface-variant hover:text-on-surface"
            onClick={() => window.open("/api/reports/export?type=waste&days=30", "_blank")}
          >
            <Download className="w-3.5 h-3.5" />
            Waste CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-on-surface-variant hover:text-on-surface"
            onClick={() => window.open("/api/reports/export?type=yield&days=30", "_blank")}
          >
            <Download className="w-3.5 h-3.5" />
            Yield CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="waste">
        <TabsList className="h-9 rounded-lg bg-surface-container/60 p-0.5">
          <TabsTrigger
            value="waste"
            className="rounded-md px-3 text-sm data-[state=active]:bg-white data-[state=active]:text-on-surface data-[state=active]:shadow-sm"
          >
            Waste
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            className="rounded-md px-3 text-sm data-[state=active]:bg-white data-[state=active]:text-on-surface data-[state=active]:shadow-sm"
          >
            Usage
          </TabsTrigger>
          <TabsTrigger
            value="dispatch"
            className="rounded-md px-3 text-sm data-[state=active]:bg-white data-[state=active]:text-on-surface data-[state=active]:shadow-sm"
          >
            Dispatch Log
          </TabsTrigger>
        </TabsList>

        {/* ── Waste Tab ── */}
        <TabsContent value="waste" className="mt-5 space-y-5">
          {/* Stat cards */}
          {!loading && waste.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Highest Waste */}
              <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-on-surface-variant">Highest Waste Stream</p>
                      <p className="text-2xl font-semibold tracking-tight text-error">
                        {highestWaste?.wastePercentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-on-surface-variant">{highestWaste?.name} Division</p>
                    </div>
                    <div className="rounded-lg bg-error/10 p-2">
                      <AlertTriangle className="h-4 w-4 text-error" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Waste Mass */}
              <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-on-surface-variant">Total Waste Mass</p>
                      <p className="text-2xl font-semibold tracking-tight text-on-surface">
                        {gramsToLb(totalWasteLb)} lb
                      </p>
                      <p className="text-xs text-on-surface-variant">Overall {overallWastePct}% waste</p>
                    </div>
                    <div className="rounded-lg bg-on-surface/5 p-2">
                      <Weight className="h-4 w-4 text-on-surface-variant" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories Tracked */}
              <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-on-surface-variant">Categories Tracked</p>
                      <p className="text-2xl font-semibold tracking-tight text-on-surface">{waste.length}</p>
                      <p className="text-xs text-on-surface-variant">Active categories</p>
                    </div>
                    <div className="rounded-lg bg-on-surface/5 p-2">
                      <Layers className="h-4 w-4 text-on-surface-variant" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chart */}
          <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-on-surface-variant" />
                <div>
                  <CardTitle className="text-sm font-semibold text-on-surface">Waste Distribution</CardTitle>
                  <p className="text-xs text-on-surface-variant mt-0.5">Percentage of total input lost by category</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-sm text-on-surface-variant">Loading...</p>
                </div>
              ) : waste.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-sm text-on-surface-variant">No waste data yet. Process some items to see reports.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={waste} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant) / 0.15)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} unit="%" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid hsl(var(--outline-variant) / 0.15)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          fontSize: 13,
                        }}
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, "Waste"]}
                      />
                      <Bar dataKey="wastePercentage" fill="#9f403d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categorical Breakdown Table */}
          {!loading && waste.length > 0 && (
            <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-on-surface">Categorical Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-outline-variant/15 hover:bg-transparent">
                      <TableHead className="text-xs font-medium text-on-surface-variant">Category</TableHead>
                      <TableHead className="text-xs font-medium text-on-surface-variant">Total Input (lb)</TableHead>
                      <TableHead className="text-xs font-medium text-on-surface-variant">Total Output (lb)</TableHead>
                      <TableHead className="text-xs font-medium text-on-surface-variant">Waste (lb)</TableHead>
                      <TableHead className="text-xs font-medium text-on-surface-variant text-right">Waste %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waste.map((w) => (
                      <TableRow key={w.name} className="border-outline-variant/15 hover:bg-surface-container/30">
                        <TableCell>
                          <span className="text-sm font-medium text-on-surface">{w.name}</span>
                        </TableCell>
                        <TableCell className="text-sm text-on-surface-variant tabular-nums">{gramsToLb(w.inputWeight)}</TableCell>
                        <TableCell className="text-sm text-on-surface-variant tabular-nums">{gramsToLb(w.outputWeight)}</TableCell>
                        <TableCell className="text-sm font-medium text-on-surface tabular-nums">{gramsToLb(w.wasteWeight)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${
                            w.wastePercentage > 15 ? "bg-error/10 text-error" :
                            w.wastePercentage > 10 ? "bg-amber-500/10 text-amber-700" :
                            "bg-emerald-500/10 text-emerald-700"
                          }`}>
                            {w.wastePercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Usage Tab ── */}
        <TabsContent value="usage" className="mt-5">
          <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-on-surface-variant" />
                <div>
                  <CardTitle className="text-sm font-semibold text-on-surface">Processing Volume</CardTitle>
                  <p className="text-xs text-on-surface-variant mt-0.5">Last 30 days</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-sm text-on-surface-variant">Loading...</p>
                </div>
              ) : usage.length === 0 ? (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-sm text-on-surface-variant">No usage data yet.</p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant) / 0.15)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid hsl(var(--outline-variant) / 0.15)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          fontSize: 13,
                        }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#0055d7" strokeWidth={2} dot={{ r: 3, fill: "#0055d7" }} name="Steps" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Dispatch Tab ── */}
        <TabsContent value="dispatch" className="mt-5">
          <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
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
