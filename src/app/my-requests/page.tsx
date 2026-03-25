"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PlusCircle, Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RequestItem {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  requestedAt: string;
  _count: { items: number };
}

type StatusTab = "ALL" | "PENDING" | "PACKING" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

const STATUS_TABS: { label: string; value: StatusTab }[] = [
  { label: "All",        value: "ALL" },
  { label: "Pending",    value: "PENDING" },
  { label: "Packing",    value: "PACKING" },
  { label: "Dispatched", value: "DISPATCHED" },
  { label: "Delivered",  value: "DELIVERED" },
  { label: "Cancelled",  value: "CANCELLED" },
];

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = requests.filter(req => {
    if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return req.requestNumber.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AppShell title="My Requests">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-56 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
            <Input
              placeholder="Search requests…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl h-9 bg-surface-container border-0 text-sm"
            />
          </div>
        </div>
        <Link href="/new-request">
          <Button className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl shadow-sm shadow-tertiary/25 w-full sm:w-auto">
            <PlusCircle className="w-4 h-4 mr-2" /> New Request
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-container/60 p-1 mb-4 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap",
              statusFilter === tab.value
                ? "bg-white text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin" />
                      Loading…
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-on-surface-variant">
                    {searchQuery || statusFilter !== "ALL"
                      ? "No requests match the current filters."
                      : "No requests yet. Submit your first request."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(req => (
                  <TableRow key={req.id} className="cursor-pointer hover:bg-surface-container/50">
                    <TableCell>
                      <Link href={`/my-requests/${req.id}`} className="font-mono text-sm text-tertiary hover:text-tertiary/80">
                        {req.requestNumber}
                      </Link>
                    </TableCell>
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

      {/* Mobile card layout */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
            <Package className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">
              {searchQuery || statusFilter !== "ALL" ? "No requests match." : "No requests yet."}
            </p>
          </div>
        ) : (
          filtered.map(req => (
            <Link key={req.id} href={`/my-requests/${req.id}`}>
              <Card className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-sm text-tertiary font-medium">{req.requestNumber}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <StatusBadge status={req.priority} />
                    <span>{req._count.items} items</span>
                    <span className="ml-auto">{new Date(req.requestedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
