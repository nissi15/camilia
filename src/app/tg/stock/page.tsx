"use client";

import { useState, useEffect } from "react";
import { useTelegram } from "../providers";
import { Package, AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface StockLevel {
  categoryId: string;
  categoryName: string;
  totalWeight: number;
  totalCount: number;
  itemCount: number;
  expiringCount: number;
  parTotal: number;
  belowPar: boolean;
}

export default function StockPage() {
  const { apiFetch } = useTelegram();
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemDetails, setItemDetails] = useState<Record<string, Array<{
    id: string; name: string; batchCode: string; lotNumber: string | null;
    weightGrams: number | null; unitCount: number; status: string;
    expiresAt: string | null; supplier: string | null;
  }>>>({});

  useEffect(() => {
    apiFetch("/api/stock/levels")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setLevels(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiFetch]);

  const toggleExpand = async (categoryId: string) => {
    if (expandedId === categoryId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(categoryId);

    if (!itemDetails[categoryId]) {
      try {
        const res = await apiFetch(`/api/inventory?categoryId=${categoryId}&status=RECEIVED,PROCESSED,PACKAGED&limit=50`);
        if (res.ok) {
          const data = await res.json();
          const list = data?.items;
          setItemDetails((prev) => ({ ...prev, [categoryId]: Array.isArray(list) ? list : [] }));
        }
      } catch {
        // ignore
      }
    }
  };

  const totalItems = levels.reduce((sum, l) => sum + l.totalCount, 0);
  const belowParCount = levels.filter((l) => l.belowPar).length;
  const expiringTotal = levels.reduce((sum, l) => sum + l.expiringCount, 0);

  return (
    <div className="p-4">
      <div className="tg-page-header tg-animate-in">
        <div className="tg-page-icon">
          <Package className="w-5 h-5 text-on-tertiary" />
        </div>
        <div>
          <h1 className="tg-page-title">Stock Check</h1>
          <p className="tg-page-subtitle">Current inventory levels</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4 tg-animate-in" style={{ animationDelay: "50ms" }}>
        <div className="tg-card-sm p-3 text-center">
          <p className="text-2xl font-bold text-on-surface">{totalItems}</p>
          <p className="text-[10px] text-on-surface-variant font-medium">Total Units</p>
        </div>
        <div className={`tg-card-sm p-3 text-center ${belowParCount > 0 ? "!bg-error/5 !border-error/10" : ""}`}>
          <p className={`text-2xl font-bold ${belowParCount > 0 ? "text-error" : "text-on-surface"}`}>
            {belowParCount}
          </p>
          <p className="text-[10px] text-on-surface-variant font-medium">Below Par</p>
        </div>
        <div className={`tg-card-sm p-3 text-center ${expiringTotal > 0 ? "!bg-primary/5 !border-primary/10" : ""}`}>
          <p className={`text-2xl font-bold ${expiringTotal > 0 ? "text-primary" : "text-on-surface"}`}>
            {expiringTotal}
          </p>
          <p className="text-[10px] text-on-surface-variant font-medium">Expiring</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-tertiary border-t-transparent rounded-full" />
        </div>
      ) : levels.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-12">No stock in warehouse</p>
      ) : (
        <div className="space-y-2 tg-stagger">
          {levels.map((level) => {
            const isExpanded = expandedId === level.categoryId;
            const items = itemDetails[level.categoryId] || [];

            return (
              <div key={level.categoryId} className="tg-card-sm overflow-hidden">
                <button
                  onClick={() => toggleExpand(level.categoryId)}
                  className="w-full p-4 text-left flex items-center gap-3 active:bg-surface-low transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-on-surface text-sm">{level.categoryName}</p>
                      {level.belowPar && (
                        <span className="px-1.5 py-0.5 bg-error/10 text-error text-[10px] font-bold rounded">LOW</span>
                      )}
                      {level.expiringCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {level.expiringCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {level.totalCount} units &middot; {(level.totalWeight / 1000).toFixed(1)}kg
                      {level.parTotal > 0 && ` \u00b7 Par: ${level.parTotal}`}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-outline-variant" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-outline-variant" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-surface-container pt-2 space-y-2 tg-animate-in">
                    {items.length === 0 ? (
                      <p className="text-xs text-on-surface-variant py-2">Loading...</p>
                    ) : (
                      items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-surface-container last:border-0">
                          <div>
                            <p className="text-sm font-medium text-on-surface">{item.name}</p>
                            <p className="text-[11px] text-on-surface-variant">
                              {item.lotNumber || item.batchCode}
                              {item.supplier && ` \u00b7 ${item.supplier}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-on-surface">
                              {item.weightGrams ? `${(Number(item.weightGrams) / 1000).toFixed(1)}kg` : `${item.unitCount}x`}
                            </p>
                            {item.expiresAt && (
                              <p className={`text-[10px] ${new Date(item.expiresAt) < new Date(Date.now() + 3 * 86400000) ? "text-primary font-semibold" : "text-on-surface-variant"}`}>
                                Exp: {new Date(item.expiresAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
