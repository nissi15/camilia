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
import { toast } from "sonner";

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

const UNIT_OPTIONS = [
  { value: "piece", label: "Piece" },
  { value: "kg",    label: "Kg" },
  { value: "lb",    label: "Lb" },
  { value: "g",     label: "Grams" },
  { value: "oz",    label: "Oz" },
  { value: "liter", label: "Liter" },
  { value: "case",  label: "Case" },
  { value: "box",   label: "Box" },
  { value: "bag",   label: "Bag" },
  { value: "bunch", label: "Bunch" },
  { value: "dozen", label: "Dozen" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW",    label: "Low",    active: "bg-surface-high text-on-surface" },
  { value: "NORMAL", label: "Normal", active: "bg-tertiary text-white" },
  { value: "HIGH",   label: "High",   active: "bg-amber-500 text-white" },
  { value: "URGENT", label: "Urgent", active: "bg-error text-white" },
];

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
      const msg = data.error || "Failed to submit request";
      setError(msg);
      toast.error(msg);
      return;
    }

    toast.success("Request submitted successfully!");
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
              <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">
                Item List Builder
              </Label>

              {/* Desktop header */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_120px_32px] gap-3 px-1 mb-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Category</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Description</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Qty</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Unit</span>
                <span></span>
              </div>

              <div className="space-y-3 sm:space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:grid sm:grid-cols-[1fr_1fr_80px_120px_32px] gap-2 sm:gap-3 sm:items-center p-3 sm:p-0 rounded-xl sm:rounded-none bg-surface-container/30 sm:bg-transparent">
                    {/* Category */}
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest sm:hidden mb-1 block">Category</span>
                      <Select value={item.categoryId} onValueChange={(v) => updateItem(idx, "categoryId", v ?? "")} items={Object.fromEntries(categories.map(c => [c.id, c.name]))}>
                        <SelectTrigger className="rounded-lg border-outline-variant/30 h-9 text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest sm:hidden mb-1 block">Description</span>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="e.g. Organic Roma Tomatoes"
                        required
                        className="rounded-lg border-outline-variant/30 h-9 text-sm"
                      />
                    </div>

                    {/* Quantity + Unit row on mobile */}
                    <div className="flex gap-2 sm:contents">
                      <div className="flex-1 sm:flex-none">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest sm:hidden mb-1 block">Qty</span>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          className="rounded-lg border-outline-variant/30 h-9 text-sm text-center"
                        />
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest sm:hidden mb-1 block">Unit</span>
                        <Select value={item.unitLabel} onValueChange={(v) => updateItem(idx, "unitLabel", v ?? "piece")} items={Object.fromEntries(UNIT_OPTIONS.map(u => [u.value, u.label]))}>
                          <SelectTrigger className="rounded-lg border-outline-variant/30 h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map(u => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Delete - inline on mobile */}
                      <div className="flex items-end sm:items-center">
                        {items.length > 1 ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} className="h-9 w-9 p-0">
                            <Trash2 className="w-3.5 h-3.5 text-error" />
                          </Button>
                        ) : <div className="w-9 h-9" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 mt-3 text-sm font-medium text-tertiary hover:text-tertiary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {/* Priority & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
                  Priority Status
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        priority === p.value
                          ? p.active
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-high"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
                  Administrative Notes
                </Label>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-outline-variant/20">
              <p className="text-xs text-on-surface-variant">
                By sending this request, it will be logged under your employee profile for inventory tracking.
              </p>
              <div className="flex gap-3 shrink-0 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl flex-1 sm:flex-none">
                  Cancel
                </Button>
                <Button type="submit" className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl gap-2 flex-1 sm:flex-none shadow-sm shadow-tertiary/25" disabled={loading}>
                  <Send className="w-4 h-4" />
                  {loading ? "Sending…" : "Send Request"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
