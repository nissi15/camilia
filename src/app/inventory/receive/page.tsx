"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { kgToGrams, lbToGrams } from "@/lib/constants";
import { toast } from "sonner";

const UNIT_OPTIONS = [
  { value: "kg",    label: "Kg" },
  { value: "piece", label: "Piece" },
  { value: "g",     label: "Grams" },
  { value: "lb",    label: "Lb" },
  { value: "oz",    label: "Oz" },
  { value: "liter", label: "Liter" },
  { value: "case",  label: "Case" },
  { value: "box",   label: "Box" },
  { value: "bag",   label: "Bag" },
  { value: "bunch", label: "Bunch" },
  { value: "dozen", label: "Dozen" },
];

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export default function ReceiveIngredientPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");

  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    weight: "",
    unitCount: "1",
    unitLabel: "piece",
    costRwf: "",
    supplier: "",
    expiresAt: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/categories/flat")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const weightGrams = form.weight
      ? weightUnit === "lb"
        ? lbToGrams(parseFloat(form.weight))
        : kgToGrams(parseFloat(form.weight))
      : undefined;

    const res = await fetch("/api/inventory/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: form.categoryId,
        name: form.name,
        weightGrams,
        unitCount: parseInt(form.unitCount) || 1,
        unitLabel: form.unitLabel,
        costRwf: form.costRwf ? parseFloat(form.costRwf) : undefined,
        supplier: form.supplier || undefined,
        expiresAt: form.expiresAt || undefined,
        notes: form.notes || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      const msg = data.error || "Failed to receive ingredient";
      setError(msg);
      toast.error(msg);
      return;
    }

    const item = await res.json();
    toast.success("Ingredient received into stock!");
    router.push(`/inventory/${item.id}`);
  }

  return (
    <AppShell title="Receive Ingredient">
      <Card className="max-w-2xl rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Receive New Ingredient</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-error/10 text-error text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v ?? "" }))}
                items={Object.fromEntries(categories.map(c => [c.id, c.name]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                placeholder="e.g., Beef Ribeye Slab"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.weight}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, weight: e.target.value }))
                    }
                  />
                  <Select
                    value={weightUnit}
                    onValueChange={(v) => setWeightUnit((v ?? "lb") as "lb" | "kg")}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitCount">Count</Label>
                <div className="flex gap-2">
                  <Input
                    id="unitCount"
                    type="number"
                    min="1"
                    value={form.unitCount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unitCount: e.target.value }))
                    }
                  />
                  <Select
                    value={form.unitLabel}
                    onValueChange={(v) => setForm((f) => ({ ...f, unitLabel: v ?? "piece" }))}
                    items={Object.fromEntries(UNIT_OPTIONS.map(u => [u.value, u.label]))}
                  >
                    <SelectTrigger className="w-28 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costRwf">Total Cost (RWF)</Label>
              <Input
                id="costRwf"
                type="number"
                step="1"
                min="0"
                placeholder="e.g., 150000"
                value={form.costRwf}
                onChange={(e) => setForm((f) => ({ ...f, costRwf: e.target.value }))}
              />
              {form.costRwf && form.weight && (
                <p className="text-xs text-on-surface-variant">
                  = {Math.round(parseFloat(form.costRwf) / parseFloat(form.weight)).toLocaleString()} RWF per {weightUnit}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                placeholder="e.g., Local Farm Co."
                value={form.supplier}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supplier: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiry Date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl shadow-sm shadow-tertiary/25"
                disabled={loading}
              >
                {loading ? "Receiving..." : "Receive into Stock"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
