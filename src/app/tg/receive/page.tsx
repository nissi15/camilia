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

    // Create supplier if new
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
      <div className="p-6 text-center text-gray-500">
        <p className="text-lg font-medium">Warehouse staff only</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <PackageOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Receive Stock</h1>
          <p className="text-xs text-gray-500">Log incoming delivery</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">Stock received successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Photo - mandatory */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Delivery Photo *</label>
          <CameraButton
            context="receive"
            onPhotoUploaded={(url) => setForm({ ...form, photoUrl: url })}
          />
        </div>

        {/* Item name */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Item Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Beef Primal Cut"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
          <div className="relative">
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] appearance-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-4 pointer-events-none" />
          </div>
        </div>

        {/* Supplier */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Supplier</label>
          <div className="relative">
            <select
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value, newSupplier: "" })}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] appearance-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">New supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-4 pointer-events-none" />
          </div>
          {!form.supplierId && (
            <input
              type="text"
              value={form.newSupplier}
              onChange={(e) => setForm({ ...form, newSupplier: e.target.value })}
              placeholder="Supplier name"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] mt-2 focus:ring-2 focus:ring-emerald-500"
            />
          )}
        </div>

        {/* Weight and Count row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Weight (g)</label>
            <input
              type="number"
              value={form.weightGrams}
              onChange={(e) => setForm({ ...form, weightGrams: e.target.value })}
              placeholder="e.g. 22680"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Unit Count</label>
            <input
              type="number"
              value={form.unitCount}
              onChange={(e) => setForm({ ...form, unitCount: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Cost in RWF */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Cost (RWF)</label>
          <input
            type="number"
            value={form.costRwf}
            onChange={(e) => setForm({ ...form, costRwf: e.target.value })}
            placeholder="e.g. 50000"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Expiry */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Expires At</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] resize-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !form.name || !form.categoryId}
          className="w-full h-14 bg-emerald-500 text-white font-semibold rounded-xl text-[16px] disabled:opacity-50 active:bg-emerald-600 transition-colors"
        >
          {submitting ? "Saving..." : "Receive Stock"}
        </button>
      </form>
    </div>
  );
}
