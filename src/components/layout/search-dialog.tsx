"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search, Package, ClipboardList, Loader2,
  LayoutDashboard, Scissors, Tags, BarChart3,
  MessageSquare, PlusCircle, Send, ArrowUpRight,
  Warehouse, ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResults {
  inventory: Array<{
    id: string;
    name: string;
    batchCode: string;
    status: string;
    category: { name: string };
  }>;
  requests: Array<{
    id: string;
    requestNumber: string;
    status: string;
    priority: string;
    notes: string | null;
    restaurant: { name: string };
    requestedAt: string;
  }>;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "navigate" | "action";
  kbd?: string;
}

const warehouseItems: NavItem[] = [
  { label: "Dashboard",         href: "/dashboard",        icon: LayoutDashboard, group: "navigate" },
  { label: "Inventory",         href: "/inventory",        icon: Package,         group: "navigate" },
  { label: "Processing",        href: "/processing",       icon: Scissors,        group: "navigate" },
  { label: "Requests",          href: "/requests",         icon: ClipboardList,   group: "navigate" },
  { label: "Categories",        href: "/categories",       icon: Tags,            group: "navigate" },
  { label: "Reports",           href: "/reports",          icon: BarChart3,       group: "navigate" },
  { label: "Messages",          href: "/messages",         icon: MessageSquare,   group: "navigate" },
  { label: "Receive Inventory", href: "/inventory/receive",icon: Warehouse,       group: "action"   },
];

const restaurantItems: NavItem[] = [
  { label: "Dashboard",         href: "/my-dashboard",     icon: LayoutDashboard, group: "navigate" },
  { label: "My Requests",       href: "/my-requests",      icon: Send,            group: "navigate" },
  { label: "Messages",          href: "/messages",         icon: MessageSquare,   group: "navigate" },
  { label: "New Request",       href: "/new-request",      icon: PlusCircle,      group: "action"   },
];

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isWarehouse = session?.user?.role === "WAREHOUSE_ADMIN";
  const navItems = isWarehouse ? warehouseItems : restaurantItems;

  // Filter nav items by query
  const filteredNav = query.trim()
    ? navItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : navItems;

  const navigateItems  = filteredNav.filter(i => i.group === "navigate");
  const actionItems    = filteredNav.filter(i => i.group === "action");

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) setResults(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults(null); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => fetchResults(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchResults]);

  useEffect(() => {
    if (!open) { setQuery(""); setResults(null); setLoading(false); setFocusedIndex(0); }
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Reset focused index when query changes
  useEffect(() => { setFocusedIndex(0); }, [query]);

  function navigate(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  // Build a flat list of all clickable items for keyboard nav
  const allItems: { label: string; href: string }[] = [
    ...navigateItems,
    ...actionItems,
    ...(results?.inventory.map(i => ({ label: i.name, href: `/inventory/${i.id}` })) ?? []),
    ...(results?.requests.map(r => ({ label: r.requestNumber, href: isWarehouse ? `/requests/${r.id}` : `/my-requests/${r.id}` })) ?? []),
  ];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[focusedIndex]) {
      navigate(allItems[focusedIndex].href);
    }
  }

  const hasSearchResults = results && (results.inventory.length > 0 || results.requests.length > 0);
  const noSearchResults  = results && results.inventory.length === 0 && results.requests.length === 0;

  // Nav offset for keyboard index tracking
  let itemIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0 gap-0 bg-surface-lowest overflow-hidden rounded-2xl shadow-2xl"
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4 border-b border-outline-variant/20">
          <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to…"
            className="border-0 h-12 px-0 focus-visible:ring-0 focus-visible:border-transparent bg-transparent text-on-surface placeholder:text-on-surface-variant/60 text-[15px]"
          />
          {loading && <Loader2 className="w-4 h-4 text-on-surface-variant animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-outline-variant/30 bg-surface-container px-1.5 font-mono text-[10px] font-medium text-on-surface-variant/70 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">

          {/* ── No query: show nav + actions ── */}
          {!query.trim() && (
            <div className="p-2">
              <NavSection
                label="Navigate"
                items={navigateItems}
                startIndex={itemIndex}
                focused={focusedIndex}
                onSelect={href => navigate(href)}
              />
              {(() => { itemIndex += navigateItems.length; return null; })()}
              {actionItems.length > 0 && (
                <NavSection
                  label="Quick Actions"
                  items={actionItems}
                  startIndex={itemIndex}
                  focused={focusedIndex}
                  onSelect={href => navigate(href)}
                  actionStyle
                />
              )}
            </div>
          )}

          {/* ── Query: filtered nav + search results ── */}
          {query.trim() && (
            <div className="p-2">
              {/* Filtered nav matches */}
              {filteredNav.length > 0 && (
                <NavSection
                  label="Pages"
                  items={filteredNav}
                  startIndex={itemIndex}
                  focused={focusedIndex}
                  onSelect={href => navigate(href)}
                />
              )}
              {(() => { itemIndex += filteredNav.length; return null; })()}

              {/* Search results */}
              {loading && !results && (
                <div className="space-y-1 mt-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-surface-container animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-28 bg-surface-container rounded animate-pulse" />
                        <div className="h-2.5 w-16 bg-surface-container rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {noSearchResults && filteredNav.length === 0 && !loading && (
                <div className="py-10 text-center text-sm text-on-surface-variant">
                  No results for &ldquo;{query}&rdquo;
                </div>
              )}

              {hasSearchResults && (
                <>
                  {isWarehouse && results.inventory.length > 0 && (
                    <ResultSection label="Inventory">
                      {results.inventory.map((item, i) => (
                        <ResultRow
                          key={item.id}
                          icon={Package}
                          primary={item.name}
                          secondary={item.batchCode}
                          focused={focusedIndex === itemIndex + i}
                          onClick={() => navigate(`/inventory/${item.id}`)}
                        />
                      ))}
                    </ResultSection>
                  )}
                  {results.requests.length > 0 && (
                    <ResultSection label="Requests">
                      {results.requests.map((req, i) => (
                        <ResultRow
                          key={req.id}
                          icon={ClipboardList}
                          primary={req.restaurant.name}
                          secondary={req.requestNumber}
                          focused={focusedIndex === itemIndex + (results?.inventory.length ?? 0) + i}
                          onClick={() => navigate(isWarehouse ? `/requests/${req.id}` : `/my-requests/${req.id}`)}
                        />
                      ))}
                    </ResultSection>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between gap-4 px-4 py-2 border-t border-outline-variant/15 bg-surface-container/30">
          <div className="flex items-center gap-3 text-[11px] text-on-surface-variant/60">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-outline-variant/30 font-mono text-[10px]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-outline-variant/30 font-mono text-[10px]">↵</kbd>
              open
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant/40">StockTrace</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function NavSection({
  label,
  items,
  startIndex,
  focused,
  onSelect,
  actionStyle = false,
}: {
  label: string;
  items: NavItem[];
  startIndex: number;
  focused: number;
  onSelect: (href: string) => void;
  actionStyle?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-1">
      <p className="px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">
        {label}
      </p>
      {items.map((item, i) => {
        const Icon = item.icon;
        const isFocused = focused === startIndex + i;
        return (
          <button
            key={item.href}
            onClick={() => onSelect(item.href)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group",
              isFocused
                ? "bg-tertiary/10 text-tertiary"
                : "hover:bg-surface-container text-on-surface"
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              actionStyle
                ? isFocused ? "bg-tertiary text-white" : "bg-tertiary/10 text-tertiary"
                : isFocused ? "bg-tertiary/20 text-tertiary" : "bg-surface-container text-on-surface-variant"
            )}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <ChevronRight className={cn(
              "w-3.5 h-3.5 transition-opacity",
              isFocused ? "opacity-60" : "opacity-0 group-hover:opacity-30"
            )} />
          </button>
        );
      })}
    </div>
  );
}

function ResultSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultRow({
  icon: Icon,
  primary,
  secondary,
  focused,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  primary: string;
  secondary: string;
  focused: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group",
        focused ? "bg-tertiary/10" : "hover:bg-surface-container"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
        focused ? "bg-tertiary/20 text-tertiary" : "bg-surface-container text-on-surface-variant"
      )}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-on-surface truncate">{primary}</div>
        <div className="text-xs text-on-surface-variant truncate">{secondary}</div>
      </div>
      <ArrowUpRight className={cn(
        "w-3.5 h-3.5 text-on-surface-variant/40 transition-opacity",
        focused ? "opacity-60" : "opacity-0 group-hover:opacity-40"
      )} />
    </button>
  );
}
