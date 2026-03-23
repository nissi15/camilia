"use client";

import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then((r) => r.json())
      .then(setRequest)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    setUpdating(true);
    const res = await fetch(`/api/requests/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRequest((prev) => prev ? { ...prev, ...updated } : prev);
    }
    setUpdating(false);
  }

  async function fulfillItem(itemId: string, status: string) {
    await fetch(`/api/requests/${id}/fulfill`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status }),
    });
    // Refresh
    const res = await fetch(`/api/requests/${id}`);
    const data = await res.json();
    setRequest(data);
  }

  if (loading) return <AppShell title="Request"><p className="text-muted-foreground">Loading...</p></AppShell>;
  if (!request) return <AppShell title="Request"><p className="text-muted-foreground">Not found.</p></AppShell>;

  const statusTimeline = [
    { status: "PENDING", label: "Submitted", time: request.requestedAt },
    { status: "PACKING", label: "Packing", time: request.packedAt },
    { status: "DISPATCHED", label: "Dispatched", time: request.dispatchedAt },
    { status: "DELIVERED", label: "Delivered", time: request.deliveredAt },
  ];

  return (
    <AppShell title={`Request ${request.requestNumber}`}>
      <div className="mb-4">
        <Link href="/requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{request.requestNumber}</CardTitle>
              <StatusBadge status={request.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restaurant</span>
              <span className="font-medium">{request.restaurant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested by</span>
              <span className="font-medium">{request.requester.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority</span>
              <StatusBadge status={request.priority} />
            </div>
            {request.notes && (
              <div>
                <span className="text-muted-foreground">Notes:</span>
                <p className="mt-1">{request.notes}</p>
              </div>
            )}

            {/* Status timeline */}
            <div className="pt-3 space-y-3">
              {statusTimeline.map((step, idx) => (
                <div key={step.status} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-0.5 ${step.time ? "bg-emerald-500" : "bg-surface-container"}`} />
                  <div className="flex-1">
                    <p className={`text-sm ${step.time ? "font-medium" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(step.time).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="pt-3 space-y-2">
              {request.status === "PENDING" && (
                <Button onClick={() => updateStatus("PACKING")} disabled={updating} className="w-full bg-tertiary hover:bg-tertiary-dim text-on-tertiary rounded-xl">
                  Mark as Packing
                </Button>
              )}
              {request.status === "PACKING" && (
                <Button onClick={() => updateStatus("DISPATCHED")} disabled={updating} className="w-full bg-tertiary hover:bg-tertiary-dim text-on-tertiary rounded-xl">
                  Mark as Dispatched
                </Button>
              )}
              {request.status === "DISPATCHED" && (
                <Button onClick={() => updateStatus("DELIVERED")} disabled={updating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  Mark as Delivered
                </Button>
              )}
              {["PENDING", "PACKING"].includes(request.status) && (
                <Button onClick={() => updateStatus("CANCELLED")} disabled={updating} variant="outline" className="w-full text-error border-error/30 hover:bg-error/5 rounded-xl">
                  Cancel Request
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Request Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {request.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unitLabel}
                      {item.category && ` • ${item.category.name}`}
                    </p>
                    {item.fulfilledItem && (
                      <Link
                        href={`/inventory/${item.fulfilledItem.id}`}
                        className="text-xs text-tertiary hover:text-tertiary-dim"
                      >
                        Assigned: {item.fulfilledItem.name} ({item.fulfilledItem.batchCode})
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.status === "PENDING" && request.status !== "CANCELLED" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/5 rounded-xl"
                          onClick={() => fulfillItem(item.id, "FULFILLED")}
                        >
                          Fulfill
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-error border-error/30 hover:bg-error/5 rounded-xl"
                          onClick={() => fulfillItem(item.id, "UNAVAILABLE")}
                        >
                          N/A
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
