"use client";

import { useEffect, useState, use } from "react";
import { useTelegram } from "../../providers";
import { CameraButton } from "@/components/telegram/camera-button";
import { ArrowLeft, Clock, Package, Truck, Check, X, ChevronRight } from "lucide-react";
import Link from "next/link";

interface RequestDetail {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  notes: string | null;
  requestedAt: string;
  packedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  restaurant: { name: string };
  requester: { name: string };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitLabel: string;
    status: string;
    category: { name: string } | null;
    fulfilledItem: { id: string; name: string; batchCode: string } | null;
  }>;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Pending" },
  PACKING: { icon: Package, color: "text-blue-600", bg: "bg-blue-50", label: "Packing" },
  DISPATCHED: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50", label: "Dispatched" },
  DELIVERED: { icon: Check, color: "text-emerald-600", bg: "bg-emerald-50", label: "Delivered" },
  CANCELLED: { icon: X, color: "text-red-600", bg: "bg-red-50", label: "Cancelled" },
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  NORMAL: "bg-gray-100 text-gray-600",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

const itemStatusColors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  FULFILLED: "bg-emerald-50 text-emerald-600",
  UNAVAILABLE: "bg-red-50 text-red-600",
};

export default function TgRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, apiFetch } = useTelegram();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    apiFetch(`/api/requests/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setRequest(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, apiFetch]);

  const cancelRequest = async () => {
    setActionLoading(true);
    const res = await apiFetch(`/api/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRequest((prev) => prev ? { ...prev, ...updated } : prev);
    }
    setActionLoading(false);
  };

  const confirmDelivery = async (photoUrl?: string) => {
    setActionLoading(true);
    const res = await apiFetch(`/api/requests/${id}/confirm-delivery`, {
      method: "POST",
      body: JSON.stringify({ deliveryPhotoUrl: photoUrl }),
    });
    if (res.ok) {
      // Refresh
      const r2 = await apiFetch(`/api/requests/${id}`);
      if (r2.ok) setRequest(await r2.json());
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-4">
        <Link href="/tg/requests" className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <p className="text-sm text-gray-400 text-center py-12">Request not found</p>
      </div>
    );
  }

  const config = statusConfig[request.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const isRestaurant = user?.role === "RESTAURANT_STAFF";

  const timeline = [
    { label: "Submitted", time: request.requestedAt, icon: Clock },
    { label: "Packing", time: request.packedAt, icon: Package },
    { label: "Dispatched", time: request.dispatchedAt, icon: Truck },
    { label: "Delivered", time: request.deliveredAt, icon: Check },
  ];

  return (
    <div className="p-4 pb-8">
      {/* Header */}
      <Link href="/tg/requests" className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Requests
      </Link>

      {/* Status card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-base font-bold text-gray-900">{request.requestNumber}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
            {config.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-400">Priority</span>
            <p className="mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[request.priority] || priorityColors.NORMAL}`}>
                {request.priority}
              </span>
            </p>
          </div>
          <div>
            <span className="text-gray-400">Submitted</span>
            <p className="font-medium text-gray-700 mt-0.5">{new Date(request.requestedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-400">Restaurant</span>
            <p className="font-medium text-gray-700 mt-0.5">{request.restaurant.name}</p>
          </div>
          <div>
            <span className="text-gray-400">Requested by</span>
            <p className="font-medium text-gray-700 mt-0.5">{request.requester.name}</p>
          </div>
        </div>

        {request.notes && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">Notes</span>
            <p className="text-sm text-gray-700 mt-0.5">{request.notes}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Timeline</p>
        <div className="space-y-3">
          {timeline.map((step, idx) => {
            const StepIcon = step.icon;
            const isComplete = !!step.time;
            const isCancelled = request.status === "CANCELLED";
            return (
              <div key={step.label} className="flex items-start gap-3">
                <div className="relative flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isComplete ? "bg-emerald-100" : "bg-gray-100"
                  }`}>
                    <StepIcon className={`w-3.5 h-3.5 ${isComplete ? "text-emerald-600" : "text-gray-400"}`} />
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className={`w-0.5 h-4 mt-1 ${isComplete ? "bg-emerald-200" : "bg-gray-100"}`} />
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={`text-sm ${isComplete ? "font-medium text-gray-900" : "text-gray-400"}`}>
                    {step.label}
                    {isCancelled && idx === 0 && (
                      <span className="ml-2 text-xs text-red-500 font-normal">Cancelled</span>
                    )}
                  </p>
                  {step.time && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(step.time).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Items ({request.items.length})
        </p>
        <div className="space-y-2">
          {request.items.map((item) => (
            <div key={item.id} className="p-3 rounded-xl bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.quantity} {item.unitLabel}
                    {item.category && ` · ${item.category.name}`}
                  </p>
                  {item.fulfilledItem && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Assigned: {item.fulfilledItem.name} ({item.fulfilledItem.batchCode})
                    </p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${itemStatusColors[item.status] || itemStatusColors.PENDING}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isRestaurant && request.status === "PENDING" && (
        <button
          onClick={cancelRequest}
          disabled={actionLoading}
          className="w-full h-11 border-2 border-red-200 text-red-600 rounded-xl text-sm font-medium disabled:opacity-50 active:bg-red-50"
        >
          {actionLoading ? "Cancelling..." : "Cancel Request"}
        </button>
      )}

      {isRestaurant && request.status === "DISPATCHED" && (
        <div className="space-y-2">
          <CameraButton
            context="delivery"
            entityId={request.id}
            onPhotoUploaded={(url) => {
              if (url) confirmDelivery(url);
            }}
          />
          <button
            onClick={() => confirmDelivery()}
            disabled={actionLoading}
            className="w-full h-11 bg-emerald-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {actionLoading ? "Confirming..." : "Confirm Delivery"}
          </button>
        </div>
      )}
    </div>
  );
}
