"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Package, ClipboardList, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isWarehouse = session?.user?.role === "WAREHOUSE_ADMIN";

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (res.ok) {
        const data: SearchResults = await res.json();
        setResults(data);
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchResults(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchResults]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setLoading(false);
    }
  }, [open]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure the dialog has rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  function handleResultClick(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  function getInventoryPath(id: string) {
    return `/inventory/${id}`;
  }

  function getRequestPath(id: string) {
    return isWarehouse ? `/requests/${id}` : `/my-requests/${id}`;
  }

  const hasResults =
    results &&
    (results.inventory.length > 0 || results.requests.length > 0);
  const hasNoResults =
    results &&
    results.inventory.length === 0 &&
    results.requests.length === 0;
  const showEmpty = !query.trim() && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0 gap-0 bg-surface-lowest overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 border-b border-outline-variant/20">
          <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inventory and requests..."
            className="border-0 h-11 px-0 focus-visible:ring-0 focus-visible:border-transparent bg-transparent text-on-surface placeholder:text-on-surface-variant"
          />
          {loading && (
            <Loader2 className="w-4 h-4 text-on-surface-variant animate-spin shrink-0" />
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-outline-variant/30 bg-surface-container px-1.5 font-mono text-[10px] font-medium text-tertiary">
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <div className="max-h-80 overflow-y-auto">
          {/* Empty state */}
          {showEmpty && (
            <div className="py-10 text-center text-sm text-on-surface-variant">
              Type to search inventory and requests
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !results && query.trim() && (
            <div className="p-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-container animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-surface-container rounded animate-pulse" />
                    <div className="h-3 w-20 bg-surface-container rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {hasNoResults && !loading && (
            <div className="py-10 text-center text-sm text-on-surface-variant">
              No results found
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <div className="p-2">
              {/* Inventory section */}
              {isWarehouse && results.inventory.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-tertiary uppercase tracking-wider">
                    Inventory
                  </div>
                  {results.inventory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleResultClick(getInventoryPath(item.id))
                      }
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-on-surface-variant" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-on-surface truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-on-surface-variant truncate">
                          {item.batchCode}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Requests section */}
              {results.requests.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-tertiary uppercase tracking-wider">
                    Requests
                  </div>
                  {results.requests.map((req) => (
                    <button
                      key={req.id}
                      onClick={() =>
                        handleResultClick(getRequestPath(req.id))
                      }
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-on-surface-variant" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-on-surface truncate">
                          {req.restaurant.name}
                        </div>
                        <div className="text-xs text-on-surface-variant truncate">
                          {req.requestNumber}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
