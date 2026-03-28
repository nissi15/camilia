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
import { Scissors, Package, Grid3X3, Beef, Plus, Trash2, Check, Search, ChevronRight, AlertTriangle } from "lucide-react";
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
  const [success, setSuccess] = useState("");
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
    setSuccess("");
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
      setError(data.error || "Processing failed");
      return;
    }

    setSuccess("Processing complete! Items created successfully.");
    setTimeout(() => {
      router.push(`/inventory/${selectedItem!.id}`);
    }, 1500);
  }

  const stepLabels = ["Select Step", "Source Details", "Define Outputs", "Review"];

  return (
    <AppShell title="Processing">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Panel */}
        <div className="lg:col-span-1">
          <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight text-on-surface">Processing Queue</CardTitle>
              <p className="text-sm text-on-surface-variant">{queue.length} items awaiting processing</p>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm rounded-lg border-outline-variant/15"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <p className="text-sm text-on-surface-variant py-4">Loading...</p>
              ) : filteredQueue.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-4">
                  {searchQuery ? "No matching items." : "No items to process."}
                </p>
              ) : (
                <div className="space-y-1 max-h-[calc(100vh-20rem)] overflow-y-auto">
                  {filteredQueue.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedItem(item); resetWizard(); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                        selectedItem?.id === item.id
                          ? "bg-tertiary/10 border border-tertiary/20"
                          : "hover:bg-surface-container/60 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <StatusBadge status={item.status} />
                        {selectedItem?.id === item.id && (
                          <span className="text-[10px] font-medium text-tertiary uppercase tracking-wide">Selected</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-on-surface">{item.name}</p>
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
            <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-container/60 flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-6 h-6 text-on-surface-variant/40" />
                </div>
                <p className="text-sm font-medium text-on-surface-variant">
                  Select an item from the queue to start processing
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-on-surface-variant">
                    Processing <span className="font-medium text-on-surface">{selectedItem.name}</span> <span className="text-on-surface-variant/60">&middot;</span> Batch #{selectedItem.batchCode}
                  </p>
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight text-on-surface">
                  {stepLabels[step - 1]}
                </CardTitle>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mt-4">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                          s === step
                            ? "bg-tertiary text-on-tertiary"
                            : s < step
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-surface-container text-on-surface-variant/60"
                        }`}
                      >
                        {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                      </div>
                      {s < 4 && (
                        <div className={`w-8 h-[2px] rounded-full ${s < step ? "bg-emerald-500/30" : "bg-outline-variant/15"}`} />
                      )}
                    </div>
                  ))}
                  <span className="ml-2 text-xs text-on-surface-variant">Step {step} of 4</span>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-700 text-sm mb-4">
                    <Check className="w-4 h-4 shrink-0" />
                    {success}
                  </div>
                )}

                {/* Step 1 */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      {STEP_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setStepType(type.value)}
                          className={`p-4 rounded-xl text-left transition-all border ${
                            stepType === type.value
                              ? "border-tertiary bg-tertiary/5"
                              : "border-outline-variant/15 hover:border-outline-variant/30 hover:bg-surface-container/40"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                            stepType === type.value ? "bg-tertiary/10" : "bg-surface-container/60"
                          }`}>
                            <type.icon className={`w-4.5 h-4.5 ${stepType === type.value ? "text-tertiary" : "text-on-surface-variant"}`} />
                          </div>
                          <p className="text-sm font-medium text-on-surface">{type.label}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{type.description}</p>
                        </button>
                      ))}
                    </div>
                    {stepType === "CUSTOM" && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-on-surface">Custom Step Name</Label>
                        <Input value={stepLabel} onChange={(e) => setStepLabel(e.target.value)} placeholder="e.g., Marinate, Debone" className="rounded-lg h-9" />
                      </div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button onClick={() => setStep(2)} disabled={!stepType} className="rounded-lg h-9 text-sm font-medium bg-tertiary hover:bg-tertiary-dim text-on-tertiary">
                        Continue
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="rounded-lg border border-outline-variant/15 p-4">
                      <p className="text-sm font-medium text-on-surface mb-3">Source Item</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-on-surface-variant mb-0.5">Weight</p>
                          <p className="text-sm font-medium text-on-surface">{inputWeightLb} lb</p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant mb-0.5">Count</p>
                          <p className="text-sm font-medium text-on-surface">{selectedItem.unitCount} {selectedItem.unitLabel}</p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant mb-0.5">Category</p>
                          <p className="text-sm font-medium text-on-surface">{selectedItem.category.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-on-surface">Notes</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional processing notes..." rows={3} className="rounded-lg text-sm" />
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setStep(1)} className="rounded-lg h-9 text-sm font-medium">Back</Button>
                      <Button onClick={() => { if (!outputs[0].categoryId) updateOutput(0, "categoryId", selectedItem.category.id); setStep(3); }} className="rounded-lg h-9 text-sm font-medium bg-tertiary hover:bg-tertiary-dim text-on-tertiary">
                        Continue
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-on-surface">Output Items</h3>
                        <p className="text-sm text-on-surface-variant">Define the products from this processing step</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={addOutput} className="rounded-lg h-9 text-sm font-medium">
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Output
                      </Button>
                    </div>

                    <div className="rounded-lg border border-outline-variant/15 overflow-hidden">
                      {/* Table header */}
                      <div className="grid grid-cols-[1fr_100px_80px_36px] gap-3 px-4 py-2.5 bg-surface-container/40 border-b border-outline-variant/10">
                        <span className="text-xs font-medium text-on-surface-variant">Item Name</span>
                        <span className="text-xs font-medium text-on-surface-variant">Weight (lb)</span>
                        <span className="text-xs font-medium text-on-surface-variant">Count</span>
                        <span></span>
                      </div>

                      {outputs.map((output, idx) => (
                        <div key={idx} className={`grid grid-cols-[1fr_100px_80px_36px] gap-3 px-4 py-2.5 items-center ${idx > 0 ? "border-t border-outline-variant/10" : ""}`}>
                          <Input
                            value={output.name}
                            onChange={(e) => updateOutput(idx, "name", e.target.value)}
                            placeholder="Output item name"
                            className="rounded-lg h-9 text-sm border-outline-variant/15"
                          />
                          <Input
                            type="number" step="0.01" min="0"
                            value={output.weight}
                            onChange={(e) => updateOutput(idx, "weight", e.target.value)}
                            placeholder="0.00"
                            className="rounded-lg h-9 text-sm border-outline-variant/15 text-center"
                          />
                          <Input
                            type="number" min="1"
                            value={output.unitCount}
                            onChange={(e) => updateOutput(idx, "unitCount", e.target.value)}
                            className="rounded-lg h-9 text-sm border-outline-variant/15 text-center"
                          />
                          <div className="flex justify-center">
                            {outputs.length > 1 && (
                              <Button variant="ghost" size="sm" onClick={() => removeOutput(idx)} className="h-8 w-8 p-0 rounded-lg hover:bg-error/10">
                                <Trash2 className="w-3.5 h-3.5 text-on-surface-variant hover:text-error" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Waste / efficiency row */}
                    <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-500">Waste / Trimmings</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-24">
                            <Input
                              type="number" step="0.01" min="0"
                              value={wasteWeight || calculatedWaste.toFixed(2)}
                              onChange={(e) => setWasteWeight(e.target.value)}
                              className="rounded-lg h-9 text-sm text-center border-amber-500/20 bg-white/60 dark:bg-amber-500/10 font-medium text-amber-700 dark:text-amber-400"
                            />
                          </div>
                          <span className="text-xs text-on-surface-variant">lb</span>
                          <div className="h-4 w-px bg-outline-variant/20" />
                          <span className="text-sm font-medium text-on-surface">
                            {efficiency}% <span className="text-xs font-normal text-on-surface-variant">yield</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setStep(2)} className="rounded-lg h-9 text-sm font-medium">Back</Button>
                      <Button onClick={() => setStep(4)} disabled={outputs.some((o) => !o.name)} className="rounded-lg h-9 text-sm font-medium bg-tertiary hover:bg-tertiary-dim text-on-tertiary">
                        Review Summary
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                  <div className="space-y-5">
                    {/* Summary card */}
                    <div className="rounded-lg border border-outline-variant/15 divide-y divide-outline-variant/10">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-on-surface-variant">Step Type</span>
                        <span className="text-sm font-medium text-on-surface">{STEP_TYPES.find((t) => t.value === stepType)?.label}{stepLabel && ` (${stepLabel})`}</span>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-on-surface-variant">Source</span>
                        <span className="text-sm font-medium text-on-surface">{selectedItem.name} &middot; {inputWeightLb} lb</span>
                      </div>
                      {notes && (
                        <div className="px-4 py-3 flex items-center justify-between">
                          <span className="text-sm text-on-surface-variant">Notes</span>
                          <span className="text-sm text-on-surface max-w-[60%] text-right">{notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Outputs */}
                    <div>
                      <p className="text-sm font-medium text-on-surface mb-2">Creating {outputs.length} output{outputs.length > 1 ? "s" : ""}</p>
                      <div className="space-y-2">
                        {outputs.map((o, idx) => (
                          <div key={idx} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                            <span className="text-sm font-medium text-on-surface">{o.name}</span>
                            <span className="text-sm text-on-surface-variant">{o.weight || "?"} lb &middot; {o.unitCount} {o.unitLabel}</span>
                          </div>
                        ))}
                        {(parseFloat(wasteWeight) || calculatedWaste) > 0 && (
                          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                            <span className="text-sm font-medium text-amber-700 dark:text-amber-500">Waste</span>
                            <span className="text-sm text-on-surface-variant">{wasteWeight || calculatedWaste.toFixed(2)} lb</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setStep(3)} className="rounded-lg h-9 text-sm font-medium">Back</Button>
                      <Button onClick={handleSubmit} disabled={submitting} className="rounded-lg h-9 text-sm font-medium bg-tertiary hover:bg-tertiary-dim text-on-tertiary">
                        {submitting ? "Processing..." : "Complete Processing"}
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
