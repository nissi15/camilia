"use client";

import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "../providers";
import { CameraButton } from "@/components/telegram/camera-button";
import { ClipboardList, ChevronRight, Check, Clock, Truck, Package, X, PlusCircle } from "lucide-react";
import Link from "next/link";

interface RequestData {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  requestedAt: string;
  restaurant: { name: string };
  requester: { name: string };
  _count: { items: number };
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  PENDING: { icon: Clock, color: "text-primary", bg: "bg-primary/10" },
  PACKING: { icon: Package, color: "text-tertiary", bg: "bg-tertiary/10" },
  DISPATCHED: { icon: Truck, color: "text-secondary", bg: "bg-secondary/10" },
  DELIVERED: { icon: Check, color: "text-tertiary", bg: "bg-tertiary/10" },
  CANCELLED: { icon: X, color: "text-error", bg: "bg-error/10" },
};

export default function RequestsPage() {
  const { user, apiFetch } = useTelegram();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "active">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const statusParam = tab === "pending" ? "PENDING" : tab === "active" ? "PACKING,DISPATCHED" : "";
    const url = statusParam
      ? `/api/requests?status=${statusParam}&limit=50`
      : `/api/requests?limit=50`;
    try {
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = data?.requests;
        setRequests(Array.isArray(list) ? list : []);
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    }
    setLoading(false);
  }, [apiFetch, tab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: string, status: string, photoUrl?: string) => {
    setActionLoading(id);
    await apiFetch(`/api/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, dispatchPhotoUrl: photoUrl }),
    });
    setActionLoading(null);
    fetchRequests();
  };

  const confirmDelivery = async (id: string, photoUrl?: string) => {
    setActionLoading(id);
    await apiFetch(`/api/requests/${id}/confirm-delivery`, {
      method: "POST",
      body: JSON.stringify({ deliveryPhotoUrl: photoUrl }),
    });
    setActionLoading(null);
    fetchRequests();
  };

  const isWarehouse = user?.role === "WAREHOUSE_ADMIN";

  return (
    <div className="p-4">
      <div className="tg-page-header tg-animate-in">
        <div className="tg-page-icon">
          <ClipboardList className="w-5 h-5 text-on-tertiary" />
        </div>
        <div className="flex-1">
          <h1 className="tg-page-title">Requests</h1>
          <p className="tg-page-subtitle">{isWarehouse ? "Manage orders" : "Your orders"}</p>
        </div>
        {!isWarehouse && (
          <Link
            href="/tg/new-request"
            className="flex items-center gap-1.5 px-3 py-2 bg-tertiary text-on-tertiary rounded-xl text-xs font-semibold active:brightness-90 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 tg-animate-in" style={{ animationDelay: "50ms" }}>
        {(["all", "pending", "active"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setLoading(true); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              tab === t
                ? "bg-tertiary text-on-tertiary shadow-sm"
                : "bg-white text-on-surface-variant border border-black/[0.04] active:bg-surface-low"
            }`}
          >
            {t === "all" ? "All" : t === "pending" ? "Pending" : "Active"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-tertiary border-t-transparent rounded-full" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-12">No requests found</p>
      ) : (
        <div className="space-y-2 tg-stagger">
          {requests.map((req) => {
            const config = statusConfig[req.status] || statusConfig.PENDING;
            const StatusIcon = config.icon;
            const isExpanded = expandedId === req.id;

            return (
              <div key={req.id} className="tg-card-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full p-4 text-left flex items-center gap-3 active:bg-surface-low transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-on-surface text-sm">{req.requestNumber}</p>
                      <span className={`text-xs font-semibold ${config.color}`}>{req.status}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {req.restaurant?.name || "Unknown"} &middot; {req._count?.items ?? 0} items
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-outline-variant transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-surface-container pt-3 space-y-3 tg-animate-in">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-on-surface-variant">Requested by</span>
                        <p className="font-medium text-on-surface">{req.requester?.name || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant">Priority</span>
                        <p className="font-medium text-on-surface">{req.priority}</p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant">Date</span>
                        <p className="font-medium text-on-surface">
                          {new Date(req.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* View detail link */}
                    <Link
                      href={`/tg/requests/${req.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-surface-low text-sm font-medium text-on-surface-variant active:bg-surface-container transition-colors"
                    >
                      View full details
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    {/* Warehouse actions */}
                    {isWarehouse && req.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(req.id, "PACKING")}
                          disabled={actionLoading === req.id}
                          className="flex-1 h-11 bg-tertiary text-on-tertiary rounded-xl text-sm font-medium disabled:opacity-50 active:brightness-90 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, "CANCELLED")}
                          disabled={actionLoading === req.id}
                          className="flex-1 h-11 bg-error text-on-error rounded-xl text-sm font-medium disabled:opacity-50 active:brightness-90 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {isWarehouse && req.status === "PACKING" && (
                      <div className="space-y-2">
                        <CameraButton
                          context="dispatch"
                          entityId={req.id}
                          onPhotoUploaded={(url) => {
                            if (url) updateStatus(req.id, "DISPATCHED", url);
                          }}
                        />
                        <button
                          onClick={() => updateStatus(req.id, "DISPATCHED")}
                          disabled={actionLoading === req.id}
                          className="w-full h-11 bg-tertiary text-on-tertiary rounded-xl text-sm font-medium disabled:opacity-50 active:brightness-90 transition-all"
                        >
                          Mark Dispatched
                        </button>
                      </div>
                    )}

                    {/* Restaurant actions */}
                    {!isWarehouse && req.status === "DISPATCHED" && (
                      <div className="space-y-2">
                        <CameraButton
                          context="delivery"
                          entityId={req.id}
                          onPhotoUploaded={(url) => {
                            if (url) confirmDelivery(req.id, url);
                          }}
                        />
                        <button
                          onClick={() => confirmDelivery(req.id)}
                          disabled={actionLoading === req.id}
                          className="w-full h-11 bg-tertiary text-on-tertiary rounded-xl text-sm font-medium disabled:opacity-50 active:brightness-90 transition-all"
                        >
                          Confirm Delivery
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
