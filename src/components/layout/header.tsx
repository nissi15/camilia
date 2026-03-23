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
      <header className="h-14 bg-surface-lowest/80 backdrop-blur-md border-b border-outline-variant/20 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-on-surface-variant"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          {title && (
            <h1 className="text-base font-semibold text-on-surface">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl h-9 w-9"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-[18px] h-[18px]" />
          </Button>
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl h-9 w-9"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tertiary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl h-9 w-9"
            >
              <Settings className="w-[18px] h-[18px]" />
            </Button>
          </Link>

          <div className="w-px h-6 bg-outline-variant/30 mx-1.5" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-tertiary">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl text-xs h-8 px-2"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
