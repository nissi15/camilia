"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import Link from "next/link";

interface RequestItem {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  requestedAt: string;
  restaurant: { name: string };
  requester: { name: string };
  _count: { items: number; fulfilledItems: number };
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch("/api/admin/restaurants")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setRestaurants(Array.isArray(data) ? data : data.restaurants || []))
      .catch(() => {});
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (statusFilter) params.set("status", statusFilter);
    if (restaurantFilter) params.set("restaurantId", restaurantFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const res = await fetch(`/api/requests?${params}`);
    const data = await res.json();
    setRequests(data.requests || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter, restaurantFilter, startDate, endDate]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <AppShell title="Requests">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
          Requests
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Track and manage inventory requests from restaurants.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select
          value={statusFilter || "ALL"}
          onValueChange={(v) => { setStatusFilter(!v || v === "ALL" ? "" : v ?? ""); setPage(1); }}
        >
          <SelectTrigger className="w-[150px] rounded-xl h-9 text-sm bg-surface-container/40 border-outline-variant/10">
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
        {restaurants.length > 0 && (
          <Select
            value={restaurantFilter || "ALL"}
            onValueChange={(v) => { setRestaurantFilter(!v || v === "ALL" ? "" : v ?? ""); setPage(1); }}
          >
            <SelectTrigger className="w-[170px] rounded-xl h-9 text-sm bg-surface-container/40 border-outline-variant/10">
              <SelectValue placeholder="All Restaurants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Restaurants</SelectItem>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="w-[140px] h-9 rounded-xl text-sm bg-surface-container/40 border-outline-variant/10"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="w-[140px] h-9 rounded-xl text-sm bg-surface-container/40 border-outline-variant/10"
        />
        {(statusFilter || restaurantFilter || startDate || endDate) && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-sm border-outline-variant/10 text-on-surface-variant gap-1.5 px-3"
            onClick={() => {
              setStatusFilter("");
              setRestaurantFilter("");
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

      {/* Table card */}
      <Card className="rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-outline-variant/15 hover:bg-transparent">
                <TableHead className="text-xs font-medium text-on-surface-variant uppercase tracking-wider h-10 pl-4">
                  Request #
                </TableHead>
                <TableHead className="text-xs font-medium text-on-surface-variant uppercase tracking-wider h-10">
                  Restaurant
                </TableHead>
                <TableHead className="text-xs font-medium text-on-surface-variant uppercase tracking-wider h-10">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium text-on-surface-variant uppercase tracking-wider h-10">
                  Priority
                </TableHead>
                <TableHead className="text-xs font-medium text-on-surface-variant uppercase tracking-wider h-10 text-right">
                  Items
                </TableHead>
                <TableHead className="text-xs font-medium text-on-surface-variant uppercase tracking-wider h-10 pr-4 text-right">
                  Requested
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-12 text-sm text-on-surface-variant">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-12 text-sm text-on-surface-variant">
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer border-b border-outline-variant/10 transition-colors hover:bg-surface-container/40"
                  >
                    <TableCell className="pl-4 py-3">
                      <Link
                        href={`/requests/${req.id}`}
                        className="font-mono text-sm text-tertiary hover:text-tertiary-dim hover:underline underline-offset-4"
                      >
                        {req.requestNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-on-surface font-medium">
                      {req.restaurant.name}
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={req.status} />
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={req.priority} />
                    </TableCell>
                    <TableCell className="py-3 text-sm tabular-nums text-right">
                      <span className="text-on-surface font-medium">{req._count.fulfilledItems}</span>
                      <span className="text-on-surface-variant">/{req._count.items}</span>
                    </TableCell>
                    <TableCell className="py-3 pr-4 text-sm text-on-surface-variant text-right">
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom pagination (shown on mobile or when top one is hidden) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-on-surface-variant">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9 text-sm font-medium"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9 text-sm font-medium"
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
