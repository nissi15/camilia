"use client";

import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "../providers";
import { CameraButton } from "@/components/telegram/camera-button";
import { ClipboardList, ChevronRight, Check, Clock, Truck, Package, X } from "lucide-react";

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
  PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  PACKING: { icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
  DISPATCHED: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
  DELIVERED: { icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
  CANCELLED: { icon: X, color: "text-red-600", bg: "bg-red-50" },
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
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Requests</h1>
          <p className="text-xs text-gray-500">{isWarehouse ? "Manage orders" : "Your orders"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "active"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setLoading(true); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t ? "bg-amber-500 text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {t === "all" ? "All" : t === "pending" ? "Pending" : "Active"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No requests found</p>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const config = statusConfig[req.status] || statusConfig.PENDING;
            const StatusIcon = config.icon;
            const isExpanded = expandedId === req.id;

            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full p-4 text-left flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm">{req.requestNumber}</p>
                      <span className={`text-xs font-medium ${config.color}`}>{req.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {req.restaurant?.name || "Unknown"} • {req._count?.items ?? 0} items
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Requested by</span>
                        <p className="font-medium text-gray-700">{req.requester?.name || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Priority</span>
                        <p className="font-medium text-gray-700">{req.priority}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Date</span>
                        <p className="font-medium text-gray-700">
                          {new Date(req.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Warehouse actions */}
                    {isWarehouse && req.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(req.id, "PACKING")}
                          disabled={actionLoading === req.id}
                          className="flex-1 h-11 bg-emerald-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, "CANCELLED")}
                          disabled={actionLoading === req.id}
                          className="flex-1 h-11 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
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
                          className="w-full h-11 bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
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
                          className="w-full h-11 bg-emerald-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
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
