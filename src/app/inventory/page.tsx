"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { gramsToLb } from "@/lib/constants";

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

function readURLFilters() {
  if (typeof window === "undefined") return { q: "", status: "", category: "", page: 1 };
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get("q") || "",
    status: p.get("status") || "",
    category: p.get("category") || "",
    page: Math.max(1, parseInt(p.get("page") || "1") || 1),
  };
}

function writeURLFilters(q: string, status: string, category: string, page: number) {
  const params = new URLSearchParams();
  if (q)        params.set("q",        q);
  if (status)   params.set("status",   status);
  if (category) params.set("category", category);
  if (page > 1) params.set("page",     String(page));
  const qs = params.toString();
  window.history.replaceState(
    null, "",
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  );
}

export default function InventoryPage() {
  const [items, setItems]               = useState<InventoryItem[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categories, setCategories]     = useState<Array<{ id: string; name: string }>>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [initialized, setInitialized]   = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Read URL on mount ──────────────────────────────────────────
  useEffect(() => {
    const f = readURLFilters();
    setSearch(f.q);
    setDebouncedSearch(f.q);
    setStatusFilter(f.status);
    setCategoryFilter(f.category);
    setPage(f.page);
    setInitialized(true);
  }, []);

  // ── Debounce search input ──────────────────────────────────────
  useEffect(() => {
    if (!initialized) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, initialized]);

  // ── Sync URL when filters change ──────────────────────────────
  useEffect(() => {
    if (!initialized) return;
    writeURLFilters(debouncedSearch, statusFilter, categoryFilter, page);
  }, [initialized, debouncedSearch, statusFilter, categoryFilter, page]);

  // ── Fetch data ─────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (!initialized) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter)    params.set("status", statusFilter);
    if (categoryFilter)  params.set("categoryId", categoryFilter);
    const res  = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [initialized, page, debouncedSearch, statusFilter, categoryFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    fetch("/api/categories/flat")
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const hasFilters = !!(search || statusFilter || categoryFilter);

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setPage(1);
  }

  return (
    <AppShell title="Inventory">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <Input
            placeholder="Search by name or batch code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <Select
          value={statusFilter || "ALL"}
          onValueChange={v => { setStatusFilter(v === "ALL" ? "" : v ?? ""); setPage(1); }}
        >
          <SelectTrigger className="w-[160px] rounded-xl">
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

        {categories.length > 0 && (
          <Select
            value={categoryFilter || "ALL"}
            onValueChange={v => { setCategoryFilter(v === "ALL" ? "" : v ?? ""); setPage(1); }}
          >
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="rounded-xl text-on-surface-variant hover:text-on-surface gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}

        <Link href="/inventory/receive">
          <Button className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl shadow-sm shadow-tertiary/25">
            <Plus className="w-4 h-4 mr-2" />
            Receive Ingredient
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weight (lb)</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin" />
                      Loading…
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-on-surface-variant">
                    {hasFilters ? "No items match the current filters." : "No items found. Receive your first ingredient to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-surface-container/50">
                    <TableCell>
                      <Link
                        href={`/inventory/${item.id}`}
                        className="font-mono text-sm text-tertiary hover:text-tertiary/80"
                      >
                        {item.batchCode}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium text-on-surface">{item.name}</TableCell>
                    <TableCell className="text-on-surface-variant">{item.category.name}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="text-on-surface-variant">
                      {item.weightGrams ? `${gramsToLb(Number(item.weightGrams))} lb` : "—"}
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {item.unitCount} {item.unitLabel}
                    </TableCell>
                    <TableCell className="text-on-surface-variant text-sm">
                      {item.receivedAt ? new Date(item.receivedAt).toLocaleDateString() : "—"}
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
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-on-surface-variant">
            Showing {items.length} of {total} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
