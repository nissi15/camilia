"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface RequestItem {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  requestedAt: string;
  restaurant: { name: string };
  requester: { name: string };
  _count: { items: number };
}

function readURLFilters() {
  if (typeof window === "undefined") return { status: "", page: 1 };
  const p = new URLSearchParams(window.location.search);
  return {
    status: p.get("status") || "",
    page:   Math.max(1, parseInt(p.get("page") || "1") || 1),
  };
}

function writeURLFilters(status: string, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  window.history.replaceState(
    null, "",
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  );
}

export default function RequestsPage() {
  const [requests, setRequests]         = useState<RequestItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [initialized, setInitialized]   = useState(false);

  // ── Read URL on mount ──────────────────────────────────────────
  useEffect(() => {
    const f = readURLFilters();
    setStatusFilter(f.status);
    setPage(f.page);
    setInitialized(true);
  }, []);

  // ── Sync URL when filters change ──────────────────────────────
  useEffect(() => {
    if (!initialized) return;
    writeURLFilters(statusFilter, page);
  }, [initialized, statusFilter, page]);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!initialized) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (statusFilter) params.set("status", statusFilter);
    const res  = await fetch(`/api/requests?${params}`);
    const data = await res.json();
    setRequests(data.requests || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [initialized, page, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  return (
    <AppShell title="Requests">
      <div className="flex gap-3 mb-4">
        <Select
          value={statusFilter || "ALL"}
          onValueChange={v => { setStatusFilter(v === "ALL" ? "" : v ?? ""); setPage(1); }}
        >
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PACKING">Packing</SelectItem>
            <SelectItem value="DISPATCHED">Dispatched</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin" />
                      Loading…
                    </div>
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-on-surface-variant">
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map(req => (
                  <TableRow key={req.id} className="cursor-pointer hover:bg-surface-container/50">
                    <TableCell>
                      <Link href={`/requests/${req.id}`} className="font-mono text-sm text-tertiary hover:text-tertiary/80">
                        {req.requestNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-on-surface">{req.restaurant.name}</TableCell>
                    <TableCell><StatusBadge status={req.status} /></TableCell>
                    <TableCell><StatusBadge status={req.priority} /></TableCell>
                    <TableCell className="text-on-surface-variant">{req._count.items} items</TableCell>
                    <TableCell className="text-on-surface-variant text-sm">
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </AppShell>
  );
}
