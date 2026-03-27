"use client";

import { useState, useEffect } from "react";
import { useTelegram } from "../providers";
import { CameraButton } from "@/components/telegram/camera-button";
import { Scissors, Check, Plus, Trash2, AlertTriangle } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  batchCode: string;
  weightGrams: number | null;
  unitCount: number;
  category: { id: string; name: string };
}

interface OutputEntry {
  name: string;
  weightGrams: string;
  unitCount: string;
  unitLabel: string;
  categoryId: string;
}

export default function ProcessPage() {
  const { user, apiFetch } = useTelegram();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [yieldTarget, setYieldTarget] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ actual: number; target: number | null; belowTarget: boolean } | null>(null);

  const [stepType, setStepType] = useState<"BUTCHER" | "PORTION" | "PACKAGE">("BUTCHER");
  const [outputs, setOutputs] = useState<OutputEntry[]>([
    { name: "", weightGrams: "", unitCount: "1", unitLabel: "piece", categoryId: "" },
  ]);
  const [wasteWeight, setWasteWeight] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    apiFetch("/api/inventory?status=RECEIVED,PROCESSED&limit=100")
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((data) => {
        const list = data?.items;
        setItems(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [apiFetch]);

  useEffect(() => {
    if (!selectedItem) return;
    apiFetch(`/api/yield-targets?categoryId=${selectedItem.category.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((targets) => {
        const arr = Array.isArray(targets) ? targets : [];
        const match = arr.find((t: { stepType: string }) => t.stepType === stepType);
        setYieldTarget(match ? Number(match.targetPercent) : null);
      })
      .catch(() => setYieldTarget(null));
  }, [selectedItem, stepType, apiFetch]);

  const totalOutputWeight = outputs.reduce((sum, o) => sum + (Number(o.weightGrams) || 0), 0);
  const inputWeight = selectedItem ? Number(selectedItem.weightGrams || 0) : 0;
  const currentYield = inputWeight > 0 ? Math.round((totalOutputWeight / inputWeight) * 10000) / 100 : 0;

  const addOutput = () => {
    setOutputs([...outputs, { name: "", weightGrams: "", unitCount: "1", unitLabel: "piece", categoryId: selectedItem?.category.id || "" }]);
  };

  const removeOutput = (idx: number) => {
    if (outputs.length <= 1) return;
    setOutputs(outputs.filter((_, i) => i !== idx));
  };

  const updateOutput = (idx: number, field: string, value: string) => {
    const updated = [...outputs];
    (updated[idx] as unknown as Record<string, string>)[field] = value;
    setOutputs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || outputs.some((o) => !o.name)) return;

    setSubmitting(true);
    const res = await apiFetch("/api/processing", {
      method: "POST",
      body: JSON.stringify({
        sourceItemId: selectedItem.id,
        stepType,
        outputs: outputs.map((o) => ({
          name: o.name,
          weightGrams: Number(o.weightGrams) || undefined,
          unitCount: Number(o.unitCount) || 1,
          unitLabel: o.unitLabel,
          categoryId: o.categoryId || selectedItem.category.id,
        })),
        wasteWeight: Number(wasteWeight) || 0,
        photoUrl: photoUrl || undefined,
        notes: notes || undefined,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      const data = await res.json();
      setResult(data.yield);
      setSuccess(true);
      // Refresh items list
      apiFetch("/api/inventory?status=RECEIVED,PROCESSED&limit=100")
        .then((r) => r.ok ? r.json() : { items: [] })
        .then((d) => setItems(d.items || []))
        .catch(() => {});
    }
  };

  const reset = () => {
    setSelectedItem(null);
    setOutputs([{ name: "", weightGrams: "", unitCount: "1", unitLabel: "piece", categoryId: "" }]);
    setWasteWeight("");
    setPhotoUrl("");
    setNotes("");
    setSuccess(false);
    setResult(null);
  };

  if (user?.role !== "WAREHOUSE_ADMIN") {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="text-lg font-medium">Warehouse staff only</p>
      </div>
    );
  }

  if (success && result) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
            result.belowTarget ? "bg-amber-100" : "bg-emerald-100"
          }`}>
            {result.belowTarget ? (
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            ) : (
              <Check className="w-8 h-8 text-emerald-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Complete</h2>
          <div className="text-4xl font-bold mb-1" style={{ color: result.belowTarget ? "#d97706" : "#059669" }}>
            {result.actual}%
          </div>
          <p className="text-sm text-gray-500">
            Yield achieved
            {result.target && ` (target: ${result.target}%)`}
          </p>
          {result.belowTarget && (
            <p className="text-sm text-amber-600 mt-2 font-medium">
              Below target by {(result.target! - result.actual).toFixed(1)}%
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="w-full h-14 bg-emerald-500 text-white font-semibold rounded-xl text-[16px] active:bg-emerald-600"
        >
          Process Another Item
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
          <Scissors className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Process Item</h1>
          <p className="text-xs text-gray-500">Butcher, portion, or package</p>
        </div>
      </div>

      {/* Select source item */}
      {!selectedItem ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Select item to process:</p>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No items available for processing</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setOutputs([{ name: "", weightGrams: "", unitCount: "1", unitLabel: "piece", categoryId: item.category.id }]);
                }}
                className="w-full bg-white rounded-xl p-4 text-left shadow-sm active:bg-gray-50"
              >
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.category.name} • {item.weightGrams ? `${Number(item.weightGrams).toLocaleString()}g` : `${item.unitCount} units`}
                  {" "} • {item.batchCode}
                </p>
              </button>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Source info */}
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-sm font-medium text-blue-900">{selectedItem.name}</p>
            <p className="text-xs text-blue-600">
              {selectedItem.weightGrams ? `${Number(selectedItem.weightGrams).toLocaleString()}g` : `${selectedItem.unitCount} units`}
            </p>
            <button type="button" onClick={reset} className="text-xs text-blue-500 underline mt-1">
              Change item
            </button>
          </div>

          {/* Step type */}
          <div className="flex gap-2">
            {(["BUTCHER", "PORTION", "PACKAGE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setStepType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  stepType === t ? "bg-blue-500 text-white" : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Yield target indicator */}
          {yieldTarget && (
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Target yield</span>
              <span className="text-sm font-bold text-gray-700">{yieldTarget}%</span>
            </div>
          )}

          {/* Photo of processed output */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Photo of output *</label>
            <CameraButton
              context="process"
              entityId={selectedItem.id}
              onPhotoUploaded={setPhotoUrl}
            />
          </div>

          {/* Outputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Output portions</label>
              <button type="button" onClick={addOutput} className="text-blue-500 text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {outputs.map((output, idx) => (
              <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={output.name}
                    onChange={(e) => updateOutput(idx, "name", e.target.value)}
                    placeholder="e.g. Ribeye Steak"
                    className="flex-1 h-11 px-3 rounded-lg border border-gray-200 text-[14px] focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {outputs.length > 1 && (
                    <button type="button" onClick={() => removeOutput(idx)} className="p-2 text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={output.weightGrams}
                    onChange={(e) => updateOutput(idx, "weightGrams", e.target.value)}
                    placeholder="Weight (g)"
                    className="h-11 px-3 rounded-lg border border-gray-200 text-[14px] focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={output.unitCount}
                    onChange={(e) => updateOutput(idx, "unitCount", e.target.value)}
                    placeholder="Count"
                    className="h-11 px-3 rounded-lg border border-gray-200 text-[14px] focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Waste */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Waste weight (g)</label>
            <input
              type="number"
              value={wasteWeight}
              onChange={(e) => setWasteWeight(e.target.value)}
              placeholder="0"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Live yield indicator */}
          {inputWeight > 0 && totalOutputWeight > 0 && (
            <div className={`rounded-xl p-3 flex items-center justify-between ${
              yieldTarget && currentYield < yieldTarget ? "bg-amber-50" : "bg-emerald-50"
            }`}>
              <span className="text-xs font-medium text-gray-600">Current yield</span>
              <span className={`text-lg font-bold ${
                yieldTarget && currentYield < yieldTarget ? "text-amber-600" : "text-emerald-600"
              }`}>
                {currentYield}%
              </span>
            </div>
          )}

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] resize-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={submitting || outputs.some((o) => !o.name)}
            className="w-full h-14 bg-blue-500 text-white font-semibold rounded-xl text-[16px] disabled:opacity-50 active:bg-blue-600"
          >
            {submitting ? "Processing..." : "Complete Processing"}
          </button>
        </form>
      )}
    </div>
  );
}
