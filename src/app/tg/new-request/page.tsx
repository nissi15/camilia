"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTelegram } from "../providers";
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X, Check,
  Send, ChevronDown, ArrowLeft, Package, AlertTriangle,
  Beef, Carrot, Fish, Wheat, Milk, Apple, Egg, Leaf,
} from "lucide-react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────── */

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

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

interface CartItem {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  quantity: number;
  unitLabel: string;
}

/* ─── Constants ──────────────────────────────────────────────── */

const UNIT_OPTIONS = [
  { value: "kg",    label: "Kg" },
  { value: "piece", label: "Piece" },
  { value: "g",     label: "Grams" },
  { value: "lb",    label: "Lb" },
  { value: "liter", label: "Liter" },
  { value: "case",  label: "Case" },
  { value: "box",   label: "Box" },
  { value: "bag",   label: "Bag" },
  { value: "dozen", label: "Dozen" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW",    label: "Low",    color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  { value: "NORMAL", label: "Normal", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  { value: "HIGH",   label: "High",   color: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  { value: "URGENT", label: "Urgent", color: "bg-red-50 text-red-700", dot: "bg-red-500" },
];

// Map category names to icons for visual appeal
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  meat: Beef, beef: Beef, poultry: Beef, chicken: Beef, pork: Beef,
  fish: Fish, seafood: Fish, shrimp: Fish,
  vegetable: Carrot, vegetables: Carrot, produce: Carrot,
  fruit: Apple, fruits: Apple,
  dairy: Milk, milk: Milk, cheese: Milk,
  grain: Wheat, grains: Wheat, bread: Wheat, bakery: Wheat, flour: Wheat, rice: Wheat,
  egg: Egg, eggs: Egg,
  herb: Leaf, herbs: Leaf, spice: Leaf, spices: Leaf, seasoning: Leaf,
};

function getCategoryIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return Package;
}

const CATEGORY_COLORS = [
  { bg: "bg-emerald-50", icon: "bg-emerald-500", text: "text-emerald-700" },
  { bg: "bg-amber-50",   icon: "bg-amber-500",   text: "text-amber-700" },
  { bg: "bg-blue-50",    icon: "bg-blue-500",     text: "text-blue-700" },
  { bg: "bg-purple-50",  icon: "bg-purple-500",   text: "text-purple-700" },
  { bg: "bg-rose-50",    icon: "bg-rose-500",     text: "text-rose-700" },
  { bg: "bg-cyan-50",    icon: "bg-cyan-600",     text: "text-cyan-700" },
  { bg: "bg-orange-50",  icon: "bg-orange-500",   text: "text-orange-700" },
  { bg: "bg-indigo-50",  icon: "bg-indigo-500",   text: "text-indigo-700" },
];

function getCategoryColor(idx: number) {
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
}

/* ─── Component ──────────────────────────────────────────────── */

export default function TgNewRequestPage() {
  const router = useRouter();
  const { apiFetch } = useTelegram();
  const descRef = useRef<HTMLInputElement>(null);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // UI state
  const [view, setView] = useState<"browse" | "cart" | "checkout">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingTo, setAddingTo] = useState<{ categoryId: string; categoryName: string } | null>(null);

  // Add-item form
  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemUnit, setItemUnit] = useState("piece");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load data
  useEffect(() => {
    Promise.all([
      apiFetch("/api/categories/flat").then((r) => r.json()),
      apiFetch("/api/stock/levels").then((r) => r.ok ? r.json() : []),
    ])
      .then(([cats, levels]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setStockLevels(Array.isArray(levels) ? levels : []);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [apiFetch]);

  // Helpers
  const getStock = (catId: string) => stockLevels.find((s) => s.categoryId === catId);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  function openAddItem(categoryId: string, categoryName: string) {
    setAddingTo({ categoryId, categoryName });
    setItemDesc("");
    setItemQty(1);
    setItemUnit("piece");
    setTimeout(() => descRef.current?.focus(), 100);
  }

  function addToCart() {
    if (!itemDesc.trim() || !addingTo) return;
    setCart((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        categoryId: addingTo.categoryId,
        categoryName: addingTo.categoryName,
        description: itemDesc.trim(),
        quantity: itemQty,
        unitLabel: itemUnit,
      },
    ]);
    setAddingTo(null);
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function updateCartQty(id: string, delta: number) {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    );
  }

  async function submitOrder() {
    if (cart.length === 0) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await apiFetch("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((i) => ({
            categoryId: i.categoryId,
            description: i.description,
            quantity: i.quantity,
            unitLabel: i.unitLabel,
          })),
          priority,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to place order");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/tg/requests"), 1500);
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  /* ─── Success screen ─── */
  if (success) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-[scale-in_0.3s_ease-out]">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Order Placed!</h2>
        <p className="text-sm text-gray-500 mt-1">Warehouse has been notified</p>
      </div>
    );
  }

  /* ─── Checkout view ─── */
  if (view === "checkout") {
    return (
      <div className="p-4 pb-8">
        <button onClick={() => setView("cart")} className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to cart
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Checkout</h1>
        <p className="text-xs text-gray-400 mb-5">{cart.length} items in your order</p>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4">{error}</div>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Summary</p>
          <div className="space-y-2.5">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                  <p className="text-[11px] text-gray-400">{item.categoryName}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700 shrink-0 ml-3">
                  {item.quantity} {item.unitLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Priority</p>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={`h-10 rounded-xl text-xs font-semibold transition-all ${
                  priority === p.value
                    ? p.color + " ring-2 ring-offset-1 ring-current"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            rows={2}
            className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm placeholder:text-gray-300 resize-none"
          />
        </div>

        {/* Place order */}
        <button
          onClick={submitOrder}
          disabled={submitting}
          className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2.5 disabled:opacity-50 active:bg-emerald-700 shadow-lg shadow-emerald-200"
        >
          <Send className="w-5 h-5" />
          {submitting ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    );
  }

  /* ─── Cart view ─── */
  if (view === "cart") {
    return (
      <div className="p-4 pb-8">
        <button onClick={() => setView("browse")} className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <ArrowLeft className="w-4 h-4" /> Continue shopping
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
            <p className="text-xs text-gray-400">{cart.length} items</p>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="w-14 h-14 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 mb-1">Your cart is empty</p>
            <p className="text-xs text-gray-300">Browse categories to add items</p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.categoryName} · {item.unitLabel}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 -mt-0.5">
                      <Trash2 className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-gray-100"
                      >
                        <Minus className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-gray-100"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {item.quantity} {item.unitLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setView("checkout")}
              className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 active:bg-emerald-700 shadow-lg shadow-emerald-200"
            >
              Proceed to Checkout
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </>
        )}
      </div>
    );
  }

  /* ─── Browse / Marketplace view ─── */
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-emerald-600 px-4 pt-4 pb-5 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/tg" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Order Supplies</h1>
            <p className="text-xs text-emerald-100">Browse & add to cart</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full h-10 rounded-xl bg-white/15 pl-9 pr-4 text-sm text-white placeholder:text-emerald-200 border-0 outline-none"
          />
        </div>
      </div>

      {/* Category grid */}
      <div className="px-4 -mt-2">
        {dataLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {searchQuery ? "No categories found" : "No categories available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {filteredCategories.map((cat, idx) => {
              const stock = getStock(cat.id);
              const color = getCategoryColor(idx);
              const Icon = getCategoryIcon(cat.name);
              const cartItemsInCat = cart.filter((i) => i.categoryId === cat.id);
              const cartQtyInCat = cartItemsInCat.reduce((s, i) => s + i.quantity, 0);

              return (
                <button
                  key={cat.id}
                  onClick={() => openAddItem(cat.id, cat.name)}
                  className={`relative ${color.bg} rounded-2xl p-3.5 text-left active:scale-[0.97] transition-all duration-150`}
                >
                  {/* Cart badge */}
                  {cartQtyInCat > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-[10px] font-bold text-white">{cartQtyInCat}</span>
                    </div>
                  )}

                  <div className={`w-10 h-10 ${color.icon} rounded-xl flex items-center justify-center mb-2.5 shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-sm font-semibold ${color.text}`}>{cat.name}</p>

                  {stock ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-gray-400">{stock.totalCount} in stock</span>
                      {stock.belowPar && (
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-300 mt-1 block">Check stock</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add-to-cart bottom sheet */}
      {addingTo && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setAddingTo(null)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-5 pb-8 safe-area-bottom animate-[slide-up_0.2s_ease-out]">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Add from</p>
                <h3 className="text-lg font-bold text-gray-900">{addingTo.categoryName}</h3>
              </div>
              <button onClick={() => setAddingTo(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Item description */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                What do you need?
              </label>
              <input
                ref={descRef}
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="e.g. Roma Tomatoes, Chicken Breast..."
                className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm placeholder:text-gray-300"
                onKeyDown={(e) => { if (e.key === "Enter" && itemDesc.trim()) addToCart(); }}
              />
            </div>

            {/* Qty + Unit */}
            <div className="flex gap-2.5 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Qty</label>
                <div className="flex items-center gap-0 bg-gray-50 rounded-xl border border-gray-200 h-12">
                  <button
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                    className="w-11 h-full flex items-center justify-center active:bg-gray-100 rounded-l-xl"
                  >
                    <Minus className="w-4 h-4 text-gray-500" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 h-full text-center text-sm font-bold bg-transparent border-x border-gray-200"
                  />
                  <button
                    onClick={() => setItemQty(itemQty + 1)}
                    className="w-11 h-full flex items-center justify-center active:bg-gray-100 rounded-r-xl"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Unit</label>
                <div className="relative">
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm appearance-none pr-8 font-medium"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Add button */}
            <button
              onClick={addToCart}
              disabled={!itemDesc.trim()}
              className="w-full h-13 bg-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-30 active:bg-emerald-700 shadow-lg shadow-emerald-200 py-3.5"
            >
              <Plus className="w-5 h-5" />
              Add to Cart
            </button>
          </div>
        </>
      )}

      {/* Floating cart bar */}
      {cart.length > 0 && !addingTo && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <button
            onClick={() => setView("cart")}
            className="w-full bg-emerald-600 text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl shadow-emerald-300/40 active:bg-emerald-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{cart.length} {cart.length === 1 ? "item" : "items"}</p>
                <p className="text-[11px] text-emerald-100">{cartCount} units total</p>
              </div>
            </div>
            <span className="text-sm font-bold bg-white text-emerald-600 px-4 py-2 rounded-xl">
              View Cart
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
