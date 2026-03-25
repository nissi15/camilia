"use client";

import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

export default function MyRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setRequest)
      .catch(() => toast.error("Failed to load request"))
      .finally(() => setLoading(false));
  }, [id]);

  async function cancelRequest() {
    setCancelling(true);
    const res = await fetch(`/api/requests/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRequest((prev) => prev ? { ...prev, ...updated } : prev);
      toast.success("Request cancelled");
    } else {
      toast.error("Failed to cancel request");
    }
    setCancelling(false);
  }

  if (loading) {
    return (
      <AppShell title="Request">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-7 h-7 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!request) {
    return (
      <AppShell title="Request">
        <div className="mb-4">
          <Link href="/my-requests">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
        </div>
        <p className="text-muted-foreground">Request not found.</p>
      </AppShell>
    );
  }

  const statusTimeline = [
    { label: "Submitted",  time: request.requestedAt },
    { label: "Packing",    time: request.packedAt },
    { label: "Dispatched", time: request.dispatchedAt },
    { label: "Delivered",  time: request.deliveredAt },
  ];

  return (
    <AppShell title={`Request ${request.requestNumber}`}>
      <div className="mb-4">
        <Link href="/my-requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Requests
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-mono">{request.requestNumber}</CardTitle>
              <StatusBadge status={request.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority</span>
              <StatusBadge status={request.priority} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium">{new Date(request.requestedAt).toLocaleDateString()}</span>
            </div>
            {request.notes && (
              <div>
                <span className="text-muted-foreground block mb-1">Notes</span>
                <p className="text-on-surface">{request.notes}</p>
              </div>
            )}

            <div className="pt-3 space-y-3">
              {statusTimeline.map((step) => (
                <div key={step.label} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${step.time ? "bg-emerald-500" : "bg-surface-container"}`} />
                  <div className="flex-1">
                    <p className={`text-sm ${step.time ? "font-medium text-on-surface" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-xs text-muted-foreground">{new Date(step.time).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {request.status === "PENDING" && (
              <div className="pt-3">
                <Button
                  onClick={cancelRequest}
                  disabled={cancelling}
                  variant="outline"
                  className="w-full text-error border-error/30 hover:bg-error/5 rounded-xl"
                >
                  {cancelling ? "Cancelling…" : "Cancel Request"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Request Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {request.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} {item.unitLabel}
                      {item.category && ` · ${item.category.name}`}
                    </p>
                    {item.fulfilledItem && (
                      <p className="text-xs text-tertiary mt-0.5">
                        Assigned: {item.fulfilledItem.name} ({item.fulfilledItem.batchCode})
                      </p>
                    )}
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
