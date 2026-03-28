"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Menu, LogOut, Bell, Settings, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { SearchDialog } from "./search-dialog";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

// Module-level singleton to prevent duplicate polling across HMR and StrictMode
let globalPollingInterval: NodeJS.Timeout | null = null;
let globalPollingCallback: (() => void) | null = null;

function startGlobalPolling(callback: () => void) {
  // If already polling, just update the callback reference
  if (globalPollingInterval) {
    globalPollingCallback = callback;
    return;
  }
  globalPollingCallback = callback;
  globalPollingInterval = setInterval(() => {
    if (!document.hidden && globalPollingCallback) {
      globalPollingCallback();
    }
  }, 60000);
}

function stopGlobalPolling() {
  if (globalPollingInterval) {
    clearInterval(globalPollingInterval);
    globalPollingInterval = null;
  }
  globalPollingCallback = null;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { data: session, status } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (document.hidden) return;
    try {
      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Fetch notification count when authenticated, then poll via module-level singleton
  useEffect(() => {
    if (status !== "authenticated") return;

    fetchUnread();
    startGlobalPolling(fetchUnread);

    const handleVisibility = () => {
      if (!document.hidden) fetchUnread();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [status, fetchUnread]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-14 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-on-surface-variant hover:bg-surface-container rounded-lg h-8 w-8"
            onClick={onMenuClick}
          >
            <Menu className="w-4.5 h-4.5" />
          </Button>
          {title && (
            <h1 className="text-sm font-semibold text-on-surface">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar - Prodex style */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-container/50 border border-outline-variant/10 text-on-surface-variant/60 hover:bg-surface-container hover:border-outline-variant/20 transition-all duration-200 cursor-pointer min-w-[200px]"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm flex-1 text-left">Search anything</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-surface-highest/60 border border-outline-variant/10 text-[10px] font-mono font-medium text-on-surface-variant/50">
              ⌘K
            </kbd>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg h-8 w-8"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Notification bell with red badge */}
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl h-9 w-9"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          <div className="w-px h-5 bg-outline-variant/10 mx-0.5" />

          {/* User avatar + sign out */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center ring-2 ring-tertiary/20">
              <span className="text-[11px] font-bold text-tertiary">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg text-xs h-7 px-2 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
