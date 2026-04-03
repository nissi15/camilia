"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Package, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { gramsToKg } from "@/lib/constants";

interface InventoryItem {
  id: string;
  batchCode: string;
  name: string;
  status: string;
  weightGrams: string | null;
  unitCount: number;
  unitLabel: string;
  receivedAt: string | null;
  category: { id: string; name: string };
  location: { name: string };
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, debouncedSearch, statusFilter, categoryFilter, startDate, endDate]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetch("/api/categories/flat")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  return (
    <AppShell title="Inventory">
      {/* Page header */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
              Inventory
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Track and manage all received ingredients and materials.
            </p>
          </div>
          <Link href="/inventory/receive">
            <Button className="rounded-lg h-9 text-sm font-medium bg-tertiary hover:bg-tertiary/90 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Receive Ingredient
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
            <Input
              placeholder="Search by name or batch code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl text-sm bg-surface-container/40 border-outline-variant/10 focus:border-tertiary/40"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={statusFilter || "ALL"}
              onValueChange={(v) => {
                setStatusFilter(!v || v === "ALL" ? "" : v ?? "");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] h-9 rounded-xl text-sm bg-surface-container/40 border-outline-variant/10">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="IN_PROCESSING">In Processing</SelectItem>
                <SelectItem value="PROCESSED">Processed</SelectItem>
                <SelectItem value="PACKAGED">Packaged</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="WASTE">Waste</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter || "ALL"}
              onValueChange={(v) => {
                setCategoryFilter(!v || v === "ALL" ? "" : v ?? "");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-9 rounded-xl text-sm bg-surface-container/40 border-outline-variant/10">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-[140px] h-9 rounded-xl text-sm bg-surface-container/40 border-outline-variant/10"
              placeholder="From"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-[140px] h-9 rounded-xl text-sm bg-surface-container/40 border-outline-variant/10"
              placeholder="To"
            />
            {(statusFilter || categoryFilter || search || startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-sm border-outline-variant/10 text-on-surface-variant gap-1.5 px-3"
                onClick={() => {
                  setStatusFilter("");
                  setCategoryFilter("");
                  setSearch("");
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
        {total > 0 && (
          <span className="text-xs text-on-surface-variant tabular-nums font-medium">
            {total} item{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table card */}
      <Card className="rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-outline-variant/10 hover:bg-transparent">
                <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wider text-on-surface-variant/70">
                  Batch Code
                </TableHead>
                <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wider text-on-surface-variant/70">
                  Name
                </TableHead>
                <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wider text-on-surface-variant/70">
                  Category
                </TableHead>
                <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wider text-on-surface-variant/70">
                  Status
                </TableHead>
                <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wider text-on-surface-variant/70 text-right">
                  Weight (lb)
                </TableHead>
                <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wider text-on-surface-variant/70 text-right">
                  Count
                </TableHead>
                <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wider text-on-surface-variant/70">
                  Received
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-tertiary border-t-transparent" />
                      <span className="text-sm text-on-surface-variant">Loading inventory...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 text-on-surface-variant/30" />
                      <p className="text-sm font-medium text-on-surface-variant">
                        No items found
                      </p>
                      <p className="text-xs text-on-surface-variant/60">
                        Receive your first ingredient to get started.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer border-b border-outline-variant/8 hover:bg-surface-container/40 transition-colors"
                  >
                    <TableCell className="px-4 py-3">
                      <Link
                        href={`/inventory/${item.id}`}
                        className="font-mono text-[13px] font-medium text-tertiary hover:text-tertiary/80 transition-colors"
                      >
                        {item.batchCode}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium text-on-surface">
                      {item.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-on-surface-variant">
                      {item.category.name}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-on-surface-variant tabular-nums text-right">
                      {item.weightGrams
                        ? `${gramsToKg(Number(item.weightGrams))} kg`
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-on-surface-variant tabular-nums text-right">
                      {item.unitCount} {item.unitLabel}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-on-surface-variant">
                      {item.receivedAt
                        ? new Date(item.receivedAt).toLocaleDateString()
                        : "\u2014"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-on-surface-variant tabular-nums">
            Showing{" "}
            <span className="font-medium text-on-surface">{items.length}</span>{" "}
            of{" "}
            <span className="font-medium text-on-surface">{total}</span>{" "}
            items
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-8 w-8 p-0 border-outline-variant/15"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-on-surface-variant px-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-8 w-8 p-0 border-outline-variant/15"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
