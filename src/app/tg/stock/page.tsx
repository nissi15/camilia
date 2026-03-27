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
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Stock Check</h1>
          <p className="text-xs text-gray-500">Current inventory levels</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
          <p className="text-[10px] text-gray-500 font-medium">Total Units</p>
        </div>
        <div className={`rounded-xl p-3 text-center shadow-sm ${belowParCount > 0 ? "bg-red-50" : "bg-white"}`}>
          <p className={`text-2xl font-bold ${belowParCount > 0 ? "text-red-600" : "text-gray-900"}`}>
            {belowParCount}
          </p>
          <p className="text-[10px] text-gray-500 font-medium">Below Par</p>
        </div>
        <div className={`rounded-xl p-3 text-center shadow-sm ${expiringTotal > 0 ? "bg-amber-50" : "bg-white"}`}>
          <p className={`text-2xl font-bold ${expiringTotal > 0 ? "text-amber-600" : "text-gray-900"}`}>
            {expiringTotal}
          </p>
          <p className="text-[10px] text-gray-500 font-medium">Expiring</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : levels.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No stock in warehouse</p>
      ) : (
        <div className="space-y-2">
          {levels.map((level) => {
            const isExpanded = expandedId === level.categoryId;
            const items = itemDetails[level.categoryId] || [];

            return (
              <div key={level.categoryId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleExpand(level.categoryId)}
                  className="w-full p-4 text-left flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{level.categoryName}</p>
                      {level.belowPar && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded">LOW</span>
                      )}
                      {level.expiringCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-semibold rounded">
                          <Clock className="w-3 h-3 inline" /> {level.expiringCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {level.totalCount} units • {(level.totalWeight / 1000).toFixed(1)}kg
                      {level.parTotal > 0 && ` • Par: ${level.parTotal}`}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-300" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-gray-50 pt-2 space-y-2">
                    {items.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">Loading...</p>
                    ) : (
                      items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.name}</p>
                            <p className="text-[11px] text-gray-400">
                              {item.lotNumber || item.batchCode}
                              {item.supplier && ` • ${item.supplier}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {item.weightGrams ? `${(Number(item.weightGrams) / 1000).toFixed(1)}kg` : `${item.unitCount}x`}
                            </p>
                            {item.expiresAt && (
                              <p className={`text-[10px] ${new Date(item.expiresAt) < new Date(Date.now() + 3 * 86400000) ? "text-amber-600" : "text-gray-400"}`}>
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
