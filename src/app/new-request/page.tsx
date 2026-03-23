"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Send, FileText } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface RequestItemForm {
  categoryId: string;
  description: string;
  quantity: string;
  unitLabel: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [items, setItems] = useState<RequestItemForm[]>([
    { categoryId: "", description: "", quantity: "1", unitLabel: "piece" },
  ]);
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/categories/flat")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  function addItem() {
    setItems((i) => [
      ...i,
      { categoryId: "", description: "", quantity: "1", unitLabel: "piece" },
    ]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems((i) => i.filter((_, j) => j !== idx));
  }

  function updateItem(idx: number, field: keyof RequestItemForm, value: string) {
    setItems((i) =>
      i.map((item, j) => (j === idx ? { ...item, [field]: value } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          categoryId: i.categoryId || undefined,
          description: i.description,
          quantity: parseInt(i.quantity) || 1,
          unitLabel: i.unitLabel,
        })),
        priority,
        notes: notes || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to submit request");
      return;
    }

    router.push("/my-requests");
  }

  return (
    <AppShell title="New Request">
      <Card className="max-w-3xl rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5" />
            Procurement Module
          </div>
          <h1 className="text-xl font-bold text-on-surface mt-1">Inventory Requisition</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-xl bg-error/10 text-error text-sm">{error}</div>
            )}

            {/* Item List Builder */}
            <div>
              <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">Item List Builder</Label>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_80px_100px_32px] gap-3 px-1 mb-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Category</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Description</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Quantity</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Unit</span>
                <span></span>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_80px_100px_32px] gap-3 items-center">
                    <Select value={item.categoryId} onValueChange={(v) => updateItem(idx, "categoryId", v ?? "")}>
                      <SelectTrigger className="rounded-lg border-outline-variant/30 h-9 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      placeholder="e.g. Organic Roma Tomatoes"
                      required
                      className="rounded-lg border-outline-variant/30 h-9 text-sm"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      className="rounded-lg border-outline-variant/30 h-9 text-sm text-center"
                    />
                    <Input
                      value={item.unitLabel}
                      onChange={(e) => updateItem(idx, "unitLabel", e.target.value)}
                      placeholder="kg, lb, case"
                      className="rounded-lg border-outline-variant/30 h-9 text-sm"
                    />
                    {items.length > 1 ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} className="h-9 w-9 p-0">
                        <Trash2 className="w-3.5 h-3.5 text-error" />
                      </Button>
                    ) : <div />}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 mt-3 text-sm font-medium text-tertiary hover:text-tertiary-dim transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {/* Priority & Notes row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Priority Status</Label>
                <div className="flex gap-2">
                  {["NORMAL", "HIGH", "URGENT"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        priority === p
                          ? p === "URGENT"
                            ? "bg-error text-white"
                            : p === "HIGH"
                              ? "bg-amber-500 text-white"
                              : "bg-tertiary text-white"
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-high"
                      }`}
                    >
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Administrative Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional instructions or special delivery notes..."
                  rows={3}
                  className="rounded-xl border-outline-variant/30 text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
              <p className="text-xs text-on-surface-variant">
                By sending this request, it will be logged under your employee profile for inventory tracking.
              </p>
              <div className="flex gap-3 shrink-0 ml-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="bg-tertiary hover:bg-tertiary-dim text-on-tertiary rounded-xl gap-2" disabled={loading}>
                  <Send className="w-4 h-4" />
                  {loading ? "Sending..." : "Send Request"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
