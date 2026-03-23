"use client";

import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { gramsToLb, STEP_TYPE_LABELS } from "@/lib/constants";
import { ArrowLeft, GitBranch, Scissors } from "lucide-react";
import Link from "next/link";

interface ItemDetail {
  id: string;
  batchCode: string;
  name: string;
  status: string;
  weightGrams: string | null;
  unitCount: number;
  unitLabel: string;
  supplier: string | null;
  receivedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  category: { id: string; name: string };
  location: { name: string };
  parentItem: { id: string; name: string; batchCode: string; category: { name: string } } | null;
  childItems: Array<{ id: string; name: string; batchCode: string; status: string; weightGrams: string | null; unitCount: number; category: { name: string } }>;
  processingStepsAsSource: Array<{
    id: string;
    stepType: string;
    inputWeight: string | null;
    outputWeight: string | null;
    wasteWeight: string | null;
    notes: string | null;
    startedAt: string;
    performer: { name: string };
    outputs: Array<{ outputItem: { id: string; name: string; status: string; weightGrams: string | null; category: { name: string } } }>;
  }>;
}

interface LineageItem {
  id: string;
  name: string;
  batchCode: string;
  status: string;
  weightGrams: string | null;
  unitCount: number;
  parentItemId: string | null;
  category: { name: string };
}

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [lineage, setLineage] = useState<LineageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/inventory/${id}`).then((r) => r.json()),
      fetch(`/api/inventory/${id}/lineage`).then((r) => r.json()),
    ])
      .then(([itemData, lineageData]) => {
        setItem(itemData);
        setLineage(lineageData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Item Detail">
        <p className="text-muted-foreground">Loading...</p>
      </AppShell>
    );
  }

  if (!item) {
    return (
      <AppShell title="Item Not Found">
        <p className="text-muted-foreground">Item not found.</p>
      </AppShell>
    );
  }

  // Build tree structure for lineage
  const rootItems = lineage.filter((i) => !i.parentItemId);
  const childMap = new Map<string, LineageItem[]>();
  lineage.forEach((i) => {
    if (i.parentItemId) {
      const children = childMap.get(i.parentItemId) || [];
      children.push(i);
      childMap.set(i.parentItemId, children);
    }
  });

  return (
    <AppShell title="Item Detail">
      <div className="mb-4">
        <Link href="/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{item.name}</CardTitle>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-sm font-mono text-muted-foreground">
                {item.batchCode}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Category" value={item.category.name} />
              <InfoRow
                label="Weight"
                value={
                  item.weightGrams
                    ? `${gramsToLb(Number(item.weightGrams))} lb`
                    : "—"
                }
              />
              <InfoRow
                label="Count"
                value={`${item.unitCount} ${item.unitLabel}`}
              />
              <InfoRow label="Location" value={item.location.name} />
              <InfoRow label="Supplier" value={item.supplier || "—"} />
              <InfoRow
                label="Received"
                value={
                  item.receivedAt
                    ? new Date(item.receivedAt).toLocaleDateString()
                    : "—"
                }
              />
              <InfoRow
                label="Expires"
                value={
                  item.expiresAt
                    ? new Date(item.expiresAt).toLocaleDateString()
                    : "—"
                }
              />
              {item.notes && <InfoRow label="Notes" value={item.notes} />}

              {item.parentItem && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Derived from
                    </p>
                    <Link
                      href={`/inventory/${item.parentItem.id}`}
                      className="text-sm text-tertiary hover:text-tertiary-dim font-medium"
                    >
                      {item.parentItem.name} ({item.parentItem.batchCode})
                    </Link>
                  </div>
                </>
              )}

              {/* Action buttons */}
              {(item.status === "RECEIVED" || item.status === "PROCESSED") && (
                <>
                  <Separator />
                  <Link href={`/processing?itemId=${item.id}`}>
                    <Button className="w-full bg-tertiary hover:bg-tertiary-dim text-on-tertiary rounded-xl">
                      <Scissors className="w-4 h-4 mr-2" />
                      Process This Item
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Processing History */}
          {item.processingStepsAsSource.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processing History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.processingStepsAsSource.map((step) => (
                  <div key={step.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {STEP_TYPE_LABELS[step.stepType] || step.stepType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        by {step.performer.name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {step.inputWeight && (
                        <p>
                          Input: {gramsToLb(Number(step.inputWeight))} lb →
                          Output: {gramsToLb(Number(step.outputWeight || 0))} lb
                          {step.wasteWeight && Number(step.wasteWeight) > 0 && (
                            <span className="text-error">
                              {" "}
                              (Waste: {gramsToLb(Number(step.wasteWeight))} lb)
                            </span>
                          )}
                        </p>
                      )}
                      <p>{new Date(step.startedAt).toLocaleString()}</p>
                      {step.notes && <p className="italic">{step.notes}</p>}
                    </div>
                    {step.outputs.length > 0 && (
                      <div className="mt-1 pl-3 border-l-2 border-tertiary/20 space-y-1">
                        {step.outputs.map((o) => (
                          <Link
                            key={o.outputItem.id}
                            href={`/inventory/${o.outputItem.id}`}
                            className="block text-xs text-tertiary hover:text-tertiary-dim"
                          >
                            → {o.outputItem.name}{" "}
                            {o.outputItem.weightGrams &&
                              `(${gramsToLb(Number(o.outputItem.weightGrams))} lb)`}
                            <StatusBadge
                              status={o.outputItem.status}
                              className="ml-2"
                            />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lineage Tree */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-tertiary" />
                <CardTitle className="text-base">Lineage Tree</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {lineage.length <= 1 ? (
                <p className="text-sm text-muted-foreground">
                  No processing has been done yet. Process this item to see its
                  lineage tree.
                </p>
              ) : (
                <div className="space-y-2">
                  {rootItems.map((root) => (
                    <LineageNode
                      key={root.id}
                      item={root}
                      childMap={childMap}
                      currentId={id}
                      depth={0}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function LineageNode({
  item,
  childMap,
  currentId,
  depth,
}: {
  item: LineageItem;
  childMap: Map<string, LineageItem[]>;
  currentId: string;
  depth: number;
}) {
  const children = childMap.get(item.id) || [];
  const isCurrent = item.id === currentId;

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <Link
        href={`/inventory/${item.id}`}
        className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
          isCurrent
            ? "bg-tertiary/10 ring-1 ring-tertiary/30"
            : "hover:bg-muted/50"
        }`}
      >
        {depth > 0 && (
          <div className="w-4 h-px bg-border" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isCurrent ? "text-tertiary" : ""}`}>
              {item.name}
            </span>
            <StatusBadge status={item.status} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{item.category.name}</span>
            {item.weightGrams && (
              <span>&middot; {gramsToLb(Number(item.weightGrams))} lb</span>
            )}
            <span>&middot; {item.unitCount} pcs</span>
          </div>
        </div>
      </Link>
      {children.length > 0 && (
        <div className="border-l-2 border-tertiary/15 ml-4 mt-1 space-y-1">
          {children.map((child) => (
            <LineageNode
              key={child.id}
              item={child}
              childMap={childMap}
              currentId={currentId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
