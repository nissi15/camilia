"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gramsToLb, lbToGrams } from "@/lib/constants";
import { toast } from "sonner";

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
import { Scissors, Package, Grid3X3, Beef, Plus, Trash2, Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface InventoryItem {
  id: string;
  batchCode: string;
  name: string;
  status: string;
  weightGrams: string | null;
  unitCount: number;
  unitLabel: string;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

interface OutputItem {
  name: string;
  weight: string;
  unitCount: string;
  unitLabel: string;
  categoryId: string;
}

const STEP_TYPES = [
  { value: "BUTCHER", label: "Butcher", icon: Beef, description: "Break down raw material" },
  { value: "PORTION", label: "Portion", icon: Grid3X3, description: "Cut into serving portions" },
  { value: "PACKAGE", label: "Package", icon: Package, description: "Vacuum seal or wrap" },
  { value: "CUSTOM", label: "Custom", icon: Scissors, description: "Custom processing step" },
];

export default function ProcessingPage() {
  return (
    <Suspense>
      <ProcessingContent />
    </Suspense>
  );
}

function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedId = searchParams.get("itemId");

  const [queue, setQueue] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [step, setStep] = useState(1);
  const [stepType, setStepType] = useState("");
  const [stepLabel, setStepLabel] = useState("");
  const [outputs, setOutputs] = useState<OutputItem[]>([
    { name: "", weight: "", unitCount: "1", unitLabel: "piece", categoryId: "" },
  ]);
  const [wasteWeight, setWasteWeight] = useState("");
  const [notes, setNotes] = useState("");

  const fetchQueue = useCallback(async () => {
    const res = await fetch("/api/inventory?status=RECEIVED&limit=50");
    const data = await res.json();
    const processed = await fetch("/api/inventory?status=PROCESSED&limit=50");
    const processedData = await processed.json();
    const allItems = [...(data.items || []), ...(processedData.items || [])];
    setQueue(allItems);
    setLoading(false);

    if (preselectedId) {
      const found = allItems.find((i: InventoryItem) => i.id === preselectedId);
      if (found) setSelectedItem(found);
    }
  }, [preselectedId]);

  useEffect(() => {
    fetchQueue();
    fetch("/api/categories/flat")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, [fetchQueue]);

  const filteredQueue = queue.filter(
    (item) =>
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function resetWizard() {
    setStep(1);
    setStepType("");
    setStepLabel("");
    setOutputs([{ name: "", weight: "", unitCount: "1", unitLabel: "piece", categoryId: "" }]);
    setWasteWeight("");
    setNotes("");
    setError("");
  }

  function addOutput() {
    setOutputs((o) => [
      ...o,
      { name: "", weight: "", unitCount: "1", unitLabel: "piece", categoryId: selectedItem?.category.id || "" },
    ]);
  }

  function removeOutput(idx: number) {
    if (outputs.length <= 1) return;
    setOutputs((o) => o.filter((_, i) => i !== idx));
  }

  function updateOutput(idx: number, field: keyof OutputItem, value: string) {
    setOutputs((o) =>
      o.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  const inputWeightLb = selectedItem?.weightGrams
    ? gramsToLb(Number(selectedItem.weightGrams))
    : 0;
  const totalOutputLb = outputs.reduce((sum, o) => sum + (parseFloat(o.weight) || 0), 0);
  const calculatedWaste = Math.max(0, inputWeightLb - totalOutputLb);
  const efficiency = inputWeightLb > 0 ? ((totalOutputLb / inputWeightLb) * 100).toFixed(1) : "0.0";

  async function handleSubmit() {
    setError("");
    setSubmitting(true);

    const payload = {
      sourceItemId: selectedItem!.id,
      stepType,
      stepLabel: stepType === "CUSTOM" ? stepLabel : undefined,
      outputs: outputs.map((o) => ({
        name: o.name,
        weightGrams: o.weight ? lbToGrams(parseFloat(o.weight)) : undefined,
        unitCount: parseInt(o.unitCount) || 1,
        unitLabel: o.unitLabel,
        categoryId: o.categoryId || selectedItem!.category.id,
      })),
      wasteWeight: wasteWeight
        ? lbToGrams(parseFloat(wasteWeight))
        : lbToGrams(calculatedWaste),
      notes: notes || undefined,
    };

    const res = await fetch("/api/processing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      const msg = data.error || "Processing failed";
      setError(msg);
      toast.error(msg);
      return;
    }

    toast.success("Processing complete! Items created successfully.");
    router.push(`/inventory/${selectedItem!.id}`);
  }

  const stepLabels = ["Select Step", "Source Details", "Define Outputs", "Review"];

  return (
    <AppShell title="Processing">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Panel */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Processing Queue</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm rounded-lg bg-surface-container/50 border-0"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin" />
                </div>
              ) : filteredQueue.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  {searchQuery ? "No matching items." : "No items to process."}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[calc(100vh-20rem)] overflow-y-auto">
                  {filteredQueue.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedItem(item); resetWizard(); }}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        selectedItem?.id === item.id
                          ? "bg-tertiary/10 ring-1 ring-tertiary/30"
                          : "hover:bg-surface-container"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <StatusBadge status={item.status} />
                        {selectedItem?.id === item.id && (
                          <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Active</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-on-surface">{item.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Batch #{item.batchCode}
                        {item.weightGrams ? ` \u00B7 ${gramsToLb(Number(item.weightGrams))} lb` : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Wizard Panel */}
        <div className="lg:col-span-2">
          {!selectedItem ? (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Scissors className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                <p className="text-on-surface-variant font-medium">
                  Select an item from the queue to start processing
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                {/* Session header */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                  <span>Processing Session</span>
                  <span className="text-outline-variant">&mdash;</span>
                  <span>{selectedItem.name} (Batch #{selectedItem.batchCode})</span>
                </div>
                <CardTitle className="text-xl font-bold text-on-surface">
                  Step {step}: {stepLabels[step - 1]}
                </CardTitle>

                {/* Step dots */}
                <div className="flex items-center gap-3 mt-4">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          s === step
                            ? "bg-tertiary text-white shadow-md shadow-tertiary/30"
                            : s < step
                              ? "bg-emerald-500 text-white"
                              : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {s < step ? <Check className="w-4 h-4" /> : s}
                      </div>
                      {s < 4 && (
                        <div className={`w-10 h-0.5 rounded ${s < step ? "bg-emerald-500" : "bg-surface-container"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="p-3 rounded-xl bg-error/10 text-error text-sm mb-4">{error}</div>
                )}

                {/* Step 1 */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {STEP_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setStepType(type.value)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            stepType === type.value
                              ? "border-tertiary bg-tertiary/5 shadow-sm"
                              : "border-outline-variant/20 hover:border-tertiary/30 hover:bg-surface-container/30"
                          }`}
                        >
                          <type.icon className={`w-6 h-6 mb-2 ${stepType === type.value ? "text-tertiary" : "text-on-surface-variant"}`} />
                          <p className="font-semibold text-sm text-on-surface">{type.label}</p>
                          <p className="text-xs text-on-surface-variant">{type.description}</p>
                        </button>
                      ))}
                    </div>
                    {stepType === "CUSTOM" && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Custom Step Name</Label>
                        <Input value={stepLabel} onChange={(e) => setStepLabel(e.target.value)} placeholder="e.g., Marinate, Debone" className="rounded-xl" />
                      </div>
                    )}
                    <Button onClick={() => setStep(2)} disabled={!stepType} className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl">
                      Next Step
                    </Button>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-surface-container/40 space-y-2">
                      <p className="font-semibold text-on-surface">{selectedItem.name}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><span className="text-on-surface-variant">Weight:</span> <span className="font-semibold text-on-surface">{inputWeightLb} lb</span></div>
                        <div><span className="text-on-surface-variant">Count:</span> <span className="font-semibold text-on-surface">{selectedItem.unitCount} {selectedItem.unitLabel}</span></div>
                        <div><span className="text-on-surface-variant">Category:</span> <span className="font-semibold text-on-surface">{selectedItem.category.name}</span></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Notes</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Processing notes..." rows={3} className="rounded-xl" />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">Previous Step</Button>
                      <Button onClick={() => { if (!outputs[0].categoryId) updateOutput(0, "categoryId", selectedItem.category.id); setStep(3); }} className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl">Next Step</Button>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-on-surface">Resulting Inventory</h3>
                        <p className="text-xs text-on-surface-variant">Specify the products generated from this processing step.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={addOutput} className="rounded-xl text-tertiary border-tertiary/30">
                        <Plus className="w-4 h-4 mr-1" /> Add Output
                      </Button>
                    </div>

                    {/* Output table header */}
                    <div className="grid grid-cols-[1fr_80px_64px_110px_32px] gap-3 px-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      <span>Item Name</span>
                      <span>Weight (lb)</span>
                      <span>Count</span>
                      <span>Unit</span>
                      <span></span>
                    </div>

                    {outputs.map((output, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_80px_64px_110px_32px] gap-3 items-center">
                        <Input
                          value={output.name}
                          onChange={(e) => updateOutput(idx, "name", e.target.value)}
                          placeholder="Output item name"
                          className="rounded-lg border-0 border-b border-outline-variant/30 bg-transparent focus:ring-0 px-1"
                        />
                        <Input
                          type="number" step="0.01" min="0"
                          value={output.weight}
                          onChange={(e) => updateOutput(idx, "weight", e.target.value)}
                          placeholder="0.00"
                          className="rounded-lg border-0 border-b border-outline-variant/30 bg-transparent focus:ring-0 px-1 text-center"
                        />
                        <Input
                          type="number" min="1"
                          value={output.unitCount}
                          onChange={(e) => updateOutput(idx, "unitCount", e.target.value)}
                          className="rounded-lg border-0 border-b border-outline-variant/30 bg-transparent focus:ring-0 px-1 text-center"
                        />
                        <Select
                          value={output.unitLabel}
                          onValueChange={(v) => updateOutput(idx, "unitLabel", v ?? "piece")}
                        >
                          <SelectTrigger className="rounded-lg border-outline-variant/30 h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((u) => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {outputs.length > 1 ? (
                          <Button variant="ghost" size="sm" onClick={() => removeOutput(idx)} className="h-8 w-8 p-0">
                            <Trash2 className="w-3.5 h-3.5 text-error" />
                          </Button>
                        ) : <div className="w-8 h-8" />}
                      </div>
                    ))}

                    {/* Waste row */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mt-2">
                      <div>
                        <p className="text-sm font-semibold text-amber-700">Unaccounted Waste / Trimmings</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-20">
                          <Input
                            type="number" step="0.01" min="0"
                            value={wasteWeight || calculatedWaste.toFixed(2)}
                            onChange={(e) => setWasteWeight(e.target.value)}
                            className="text-center rounded-lg bg-amber-500/10 border-amber-500/20 font-semibold text-amber-700"
                          />
                        </div>
                        <span className="text-xs font-semibold text-on-surface-variant">
                          EFFICIENCY: {efficiency}%
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">Previous Step</Button>
                      <Button onClick={() => setStep(4)} disabled={outputs.some((o) => !o.name)} className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl">
                        Final Review & Summary
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-surface-container/40 space-y-3">
                      <div className="text-sm"><span className="text-on-surface-variant">Step Type:</span> <span className="font-semibold text-on-surface">{STEP_TYPES.find((t) => t.value === stepType)?.label}{stepLabel && ` (${stepLabel})`}</span></div>
                      <div className="text-sm"><span className="text-on-surface-variant">Source:</span> <span className="font-semibold text-on-surface">{selectedItem.name} ({inputWeightLb} lb)</span></div>
                      {notes && <div className="text-sm"><span className="text-on-surface-variant">Notes:</span> <span className="text-on-surface">{notes}</span></div>}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Will create {outputs.length} output(s):</p>
                      {outputs.map((o, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-sm text-on-surface">
                          {o.name} — {o.weight || "?"} lb, {o.unitCount} {o.unitLabel}
                        </div>
                      ))}
                      {(parseFloat(wasteWeight) || calculatedWaste) > 0 && (
                        <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-on-surface">
                          Waste — {wasteWeight || calculatedWaste.toFixed(2)} lb
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl">Previous Step</Button>
                      <Button onClick={handleSubmit} disabled={submitting} className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl">
                        {submitting ? "Processing..." : "Complete Processing Step"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
