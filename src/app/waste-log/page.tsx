"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  TrendingDown,
  Package,
  ChevronLeft,
  ChevronRight,
  Scissors,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { gramsToLb, STEP_TYPE_LABELS } from "@/lib/constants";

interface WasteItem {
  id: string;
  name: string;
  batchCode: string;
  weightGrams: number;
  createdAt: string;
  category: { id: string; name: string };
  parentItem: { name: string; batchCode: string } | null;
  step: {
    stepType: string;
    inputWeight: number;
    wasteWeight: number;
    performerName: string;
    startedAt: string;
  } | null;
}

interface TopCategory {
  categoryId: string;
  categoryName: string;
  totalGrams: number;
  count: number;
}

interface WasteStats {
  totalWasteGrams: number;
  totalWasteItems: number;
  wastePercentage: number;
  topCategories: TopCategory[];
}

export default function WasteLogPage() {
  const [items, setItems] = useState<WasteItem[]>([]);
  const [stats, setStats] = useState<WasteStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/categories/flat")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("days", days);
    if (categoryFilter) params.set("categoryId", categoryFilter);

    const res = await fetch(`/api/waste-log?${params}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    }
    setLoading(false);
  }, [page, days, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDaysChange = (value: string) => {
    setDays(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value === "all" ? "" : value);
    setPage(1);
  };

  return (
    <AppShell title="Waste Log">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Waste Log</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Track and analyze waste from processing operations
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="rounded-xl border border-outline-variant/15">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-error" />
                </div>
                <div>
                  <p className="text-xs font-medium text-on-surface-variant">
                    Total Waste
                  </p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight leading-none mt-0.5">
                    {gramsToLb(stats.totalWasteGrams).toFixed(1)} lb
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {stats.totalWasteItems} items in {days} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-outline-variant/15">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stats.wastePercentage > 10 ? "bg-error/10" : stats.wastePercentage > 5 ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                  <TrendingDown className={`w-5 h-5 ${stats.wastePercentage > 10 ? "text-error" : stats.wastePercentage > 5 ? "text-amber-600" : "text-emerald-600"}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-on-surface-variant">
                    Waste Rate
                  </p>
                  <p className={`text-2xl font-bold tracking-tight leading-none mt-0.5 ${stats.wastePercentage > 10 ? "text-error" : stats.wastePercentage > 5 ? "text-amber-600" : "text-on-surface"}`}>
                    {stats.wastePercentage}%
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    of all items processed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-outline-variant/15">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-tertiary/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-tertiary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-on-surface-variant">
                    Top Waste Category
                  </p>
                  <p className="text-lg font-bold text-on-surface tracking-tight leading-tight mt-0.5">
                    {stats.topCategories[0]?.categoryName || "—"}
                  </p>
                  {stats.topCategories[0] && (
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {gramsToLb(stats.topCategories[0].totalGrams).toFixed(1)} lb across {stats.topCategories[0].count} items
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Waste Categories Bar */}
      {stats && stats.topCategories.length > 1 && (
        <Card className="rounded-xl border border-outline-variant/15 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-on-surface">
              Waste by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCategories.map((cat) => {
                const maxGrams = stats.topCategories[0]?.totalGrams || 1;
                const pct = (cat.totalGrams / maxGrams) * 100;
                return (
                  <div key={cat.categoryId} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-on-surface w-28 truncate shrink-0">
                      {cat.categoryName}
                    </span>
                    <div className="flex-1 h-6 bg-surface-container rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-error/70 rounded-lg transition-all duration-500 flex items-center px-2"
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white whitespace-nowrap">
                          {gramsToLb(cat.totalGrams).toFixed(1)} lb
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-on-surface-variant w-12 text-right shrink-0">
                      {cat.count} items
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="rounded-xl border border-outline-variant/15 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={days} onValueChange={handleDaysChange}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter || "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-[180px] h-9 rounded-lg text-sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto text-xs text-on-surface-variant">
              {total} waste item{total !== 1 ? "s" : ""} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waste Items Table */}
      <Card className="rounded-xl border border-outline-variant/15">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Date</TableHead>
                <TableHead className="text-xs font-semibold">Source Item</TableHead>
                <TableHead className="text-xs font-semibold">Category</TableHead>
                <TableHead className="text-xs font-semibold">Operation</TableHead>
                <TableHead className="text-xs font-semibold text-right">Waste (lb)</TableHead>
                <TableHead className="text-xs font-semibold">Staff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-sm text-on-surface-variant">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-on-surface-variant" />
                      </div>
                      <p className="text-sm font-medium text-on-surface">No waste items</p>
                      <p className="text-xs text-on-surface-variant">
                        No waste has been recorded in this period.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="text-sm text-on-surface-variant whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center shrink-0">
                          <Scissors className="w-3.5 h-3.5 text-error" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/inventory/${item.id}`}
                            className="text-sm font-medium text-on-surface hover:text-tertiary transition-colors truncate block"
                          >
                            {item.parentItem?.name || item.name}
                          </Link>
                          <p className="text-[11px] text-on-surface-variant font-mono">
                            {item.parentItem?.batchCode || item.batchCode}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-surface-container px-2 py-1 rounded-md font-medium text-on-surface-variant">
                        {item.category.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.step ? (
                        <span className="text-xs font-medium text-on-surface-variant">
                          {STEP_TYPE_LABELS[item.step.stepType] || item.step.stepType}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-error tabular-nums">
                        {gramsToLb(item.weightGrams).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-on-surface-variant">
                      {item.step?.performerName || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/10">
              <p className="text-xs text-on-surface-variant">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-lg"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-lg"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
