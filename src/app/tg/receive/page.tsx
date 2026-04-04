"use client";

import { useState, useEffect } from "react";
import { useTelegram } from "../providers";
import { CameraButton } from "@/components/telegram/camera-button";
import { PackageOpen, Check, ChevronDown } from "lucide-react";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

export default function ReceivePage() {
  const { user, apiFetch } = useTelegram();
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    supplierId: "",
    newSupplier: "",
    weightGrams: "",
    unitCount: "1",
    unitLabel: "piece",
    costRwf: "",
    expiresAt: "",
    notes: "",
    photoUrl: "",
  });

  useEffect(() => {
    apiFetch("/api/categories/flat").then((r) => r.ok ? r.json() : []).then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
    apiFetch("/api/suppliers").then((r) => r.ok ? r.json() : []).then((d) => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [apiFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.categoryId) return;

    setSubmitting(true);

    let supplierId = form.supplierId;
    if (!supplierId && form.newSupplier) {
      const res = await apiFetch("/api/suppliers", {
        method: "POST",
        body: JSON.stringify({ name: form.newSupplier }),
      });
      if (res.ok) {
        const supplier = await res.json();
        supplierId = supplier.id;
      }
    }

    const res = await apiFetch("/api/inventory/receive", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        categoryId: form.categoryId,
        supplierId: supplierId || undefined,
        supplier: form.newSupplier || undefined,
        weightGrams: form.weightGrams ? Number(form.weightGrams) : undefined,
        unitCount: Number(form.unitCount) || 1,
        unitLabel: form.unitLabel,
        costRwf: form.costRwf ? Number(form.costRwf) : undefined,
        expiresAt: form.expiresAt || undefined,
        photoUrl: form.photoUrl || undefined,
        notes: form.notes || undefined,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      setSuccess(true);
      setForm({
        name: "", categoryId: "", supplierId: "", newSupplier: "",
        weightGrams: "", unitCount: "1", unitLabel: "piece",
        costRwf: "", expiresAt: "", notes: "", photoUrl: "",
      });
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (user?.role !== "WAREHOUSE_ADMIN") {
    return (
      <div className="p-6 text-center text-on-surface-variant">
        <p className="text-lg font-medium">Warehouse staff only</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="tg-page-header tg-animate-in">
        <div className="tg-page-icon">
          <PackageOpen className="w-5 h-5 text-on-tertiary" />
        </div>
        <div>
          <h1 className="tg-page-title">Receive Stock</h1>
          <p className="tg-page-subtitle">Log incoming delivery</p>
        </div>
      </div>

      {success && (
        <div className="tg-card-sm bg-tertiary/5 p-3 mb-4 flex items-center gap-2 tg-animate-scale">
          <Check className="w-5 h-5 text-tertiary" />
          <p className="text-sm font-medium text-tertiary">Stock received successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 tg-stagger">
        {/* Photo */}
        <div>
          <label className="tg-label">Delivery Photo *</label>
          <CameraButton
            context="receive"
            onPhotoUploaded={(url) => setForm({ ...form, photoUrl: url })}
          />
        </div>

        {/* Item name */}
        <div>
          <label className="tg-label">Item Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Beef Primal Cut"
            className="tg-input"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="tg-label">Category *</label>
          <div className="relative">
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="tg-input appearance-none pr-10"
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-outline-variant absolute right-4 top-4 pointer-events-none" />
          </div>
        </div>

        {/* Supplier */}
        <div>
          <label className="tg-label">Supplier</label>
          <div className="relative">
            <select
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value, newSupplier: "" })}
              className="tg-input appearance-none pr-10"
            >
              <option value="">New supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-outline-variant absolute right-4 top-4 pointer-events-none" />
          </div>
          {!form.supplierId && (
            <input
              type="text"
              value={form.newSupplier}
              onChange={(e) => setForm({ ...form, newSupplier: e.target.value })}
              placeholder="Supplier name"
              className="tg-input mt-2"
            />
          )}
        </div>

        {/* Weight and Count row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="tg-label">Weight (g)</label>
            <input
              type="number"
              value={form.weightGrams}
              onChange={(e) => setForm({ ...form, weightGrams: e.target.value })}
              placeholder="e.g. 22680"
              className="tg-input"
            />
          </div>
          <div>
            <label className="tg-label">Unit Count</label>
            <input
              type="number"
              value={form.unitCount}
              onChange={(e) => setForm({ ...form, unitCount: e.target.value })}
              className="tg-input"
            />
          </div>
        </div>

        {/* Cost */}
        <div>
          <label className="tg-label">Total Cost (RWF)</label>
          <input
            type="number"
            value={form.costRwf}
            onChange={(e) => setForm({ ...form, costRwf: e.target.value })}
            placeholder="e.g. 50000"
            className="tg-input"
          />
          {form.costRwf && form.weightGrams && (
            <p className="text-xs text-on-surface-variant mt-1 px-1">
              = {Math.round(parseFloat(form.costRwf) / (parseFloat(form.weightGrams) / 1000)).toLocaleString()} RWF per kg
            </p>
          )}
        </div>

        {/* Expiry */}
        <div>
          <label className="tg-label">Expires At</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="tg-input"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="tg-label">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-white text-[15px] text-on-surface resize-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary transition-all duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !form.name || !form.categoryId}
          className="tg-btn-primary"
        >
          {submitting ? "Saving..." : "Receive Stock"}
        </button>
      </form>
    </div>
  );
}
