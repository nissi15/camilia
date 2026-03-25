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
import { TrendingUp, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  // Find highest waste category
  const highestWaste = waste.reduce((max, w) => w.wastePercentage > (max?.wastePercentage || 0) ? w : max, waste[0]);
  const totalWasteLb = waste.reduce((sum, w) => sum + w.wasteWeight, 0);
  const totalInputLb = waste.reduce((sum, w) => sum + w.inputWeight, 0);
  const overallWastePct = totalInputLb > 0 ? ((totalWasteLb / totalInputLb) * 100).toFixed(1) : "0.0";

  return (
    <AppShell title="Reports">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Reports & Analytics</h1>
          <p className="text-on-surface-variant text-sm mt-1">Waste analysis, yield tracking, and dispatch logs.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-xs"
            onClick={() => window.open("/api/reports/export?type=waste&days=30", "_blank")}
          >
            <Download className="w-3.5 h-3.5" />
            Export Waste CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-xs"
            onClick={() => window.open("/api/reports/export?type=yield&days=30", "_blank")}
          >
            <Download className="w-3.5 h-3.5" />
            Export Yield CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="waste">
        <TabsList variant="default" className="mb-1">
          <TabsTrigger value="waste">Waste</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch Log</TabsTrigger>
        </TabsList>

        <TabsContent value="waste" className="mt-4">
          {/* Quick Stats */}
          {!loading && waste.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Highest waste card */}
              <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-error/5 to-error/10 lg:col-span-1">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-error" />
                    <span className="text-[10px] font-bold text-error uppercase tracking-widest">Highest Waste Stream</span>
                  </div>
                  <p className="text-3xl font-bold text-error">{highestWaste?.wastePercentage.toFixed(1)}%</p>
                  <p className="text-sm font-medium text-on-surface mt-1">{highestWaste?.name} Division</p>
                </CardContent>
              </Card>

              {/* Quick stats */}
              <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
                <CardContent className="p-5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Quick Stats</span>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-on-surface-variant">Total Waste Mass</p>
                      <p className="text-lg font-bold text-on-surface">{gramsToLb(totalWasteLb)} lb</p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant">Overall Waste %</p>
                      <p className="text-lg font-bold text-error">{overallWastePct}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant">Categories Tracked</p>
                      <p className="text-lg font-bold text-on-surface">{waste.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chart */}
          <Card className="rounded-2xl border-0 shadow-sm mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-on-surface">Waste Distribution</CardTitle>
              <p className="text-xs text-on-surface-variant">Percentage of total input lost by category</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-on-surface-variant">Loading...</p>
              ) : waste.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No waste data yet. Process some items to see reports.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={waste} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eaeff1" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#586064" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#586064" }} unit="%" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, "Waste"]}
                      />
                      <Bar dataKey="wastePercentage" fill="#9f403d" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categorical Breakdown Table */}
          {!loading && waste.length > 0 && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-on-surface">Categorical Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Category</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Input (lb)</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Output (lb)</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Waste Weight (lb)</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Waste %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waste.map((w) => (
                      <TableRow key={w.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-error" />
                            <span className="font-medium text-on-surface">{w.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-on-surface-variant">{gramsToLb(w.inputWeight)}</TableCell>
                        <TableCell className="text-on-surface-variant">{gramsToLb(w.outputWeight)}</TableCell>
                        <TableCell className="text-on-surface-variant font-medium">{gramsToLb(w.wasteWeight)}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
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

        <TabsContent value="usage" className="mt-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-on-surface">Processing Volume (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-on-surface-variant">Loading...</p>
              ) : usage.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No usage data yet.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eaeff1" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#586064" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#586064" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                      <Line type="monotone" dataKey="count" stroke="#0055d7" strokeWidth={2} dot={{ r: 3, fill: "#0055d7" }} name="Steps" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatch" className="mt-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-on-surface">Dispatch Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Request #</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Restaurant</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Items</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Dispatched</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Delivered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-on-surface-variant">Loading...</TableCell>
                    </TableRow>
                  ) : dispatch.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-on-surface-variant">No dispatches yet.</TableCell>
                    </TableRow>
                  ) : (
                    dispatch.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-sm text-on-surface">{d.requestNumber}</TableCell>
                        <TableCell className="text-on-surface">{d.restaurant}</TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                        <TableCell className="text-on-surface-variant">{d.itemCount}</TableCell>
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
