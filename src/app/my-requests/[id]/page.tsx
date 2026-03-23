"use client";

import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle } from "lucide-react";
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
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitLabel: string;
    status: string;
    category: { name: string } | null;
  }>;
}

export default function MyRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const fetchRequest = () => {
    setLoading(true);
    fetch(`/api/requests/${id}`)
      .then((r) => r.json())
      .then(setRequest)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirmDelivery = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await fetch(`/api/requests/${id}/confirm-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: deliveryNotes || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to confirm delivery");
      }
      setConfirmOpen(false);
      setDeliveryNotes("");
      fetchRequest();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <AppShell title="Request"><p className="text-muted-foreground">Loading...</p></AppShell>;
  if (!request) return <AppShell title="Request"><p>Not found.</p></AppShell>;

  const timeline = [
    { label: "Submitted", time: request.requestedAt },
    { label: "Packing", time: request.packedAt },
    { label: "Dispatched", time: request.dispatchedAt },
    { label: "Delivered", time: request.deliveredAt },
  ];

  return (
    <AppShell title={`Request ${request.requestNumber}`}>
      <div className="mb-4">
        <Link href="/my-requests">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{request.requestNumber}</CardTitle>
              <StatusBadge status={request.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Priority</span>
              <StatusBadge status={request.priority} />
            </div>
            {request.notes && (
              <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {request.notes}</p>
            )}

            {/* Confirm Delivery Button */}
            {request.status === "DISPATCHED" && (
              <Button
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                size="lg"
                onClick={() => setConfirmOpen(true)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Delivery
              </Button>
            )}

            {/* Timeline */}
            <div className="pt-3 space-y-3">
              {timeline.map((step) => (
                <div key={step.label} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-0.5 ${step.time ? "bg-emerald-500" : "bg-surface-container"}`} />
                  <div>
                    <p className={`text-sm ${step.time ? "font-medium" : "text-muted-foreground"}`}>{step.label}</p>
                    {step.time && <p className="text-xs text-muted-foreground">{new Date(step.time).toLocaleString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {request.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unitLabel}{item.category && ` • ${item.category.name}`}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Delivery Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to confirm delivery of <span className="font-medium text-foreground">{request.requestNumber}</span>? This action cannot be undone.
          </p>
          <div className="space-y-2">
            <label htmlFor="delivery-notes" className="text-sm font-medium">
              Delivery Notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="delivery-notes"
              placeholder="Any notes about the delivery (e.g. condition, missing items)..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
            />
          </div>
          {confirmError && (
            <p className="text-sm text-destructive">{confirmError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirming}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleConfirmDelivery}
              disabled={confirming}
            >
              {confirming ? "Confirming..." : "Confirm Delivery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
