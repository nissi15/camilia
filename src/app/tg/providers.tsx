"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

interface TgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  locationId: string | null;
  locationName: string | null;
  telegramId: number;
}

interface TgContextValue {
  user: TgUser | null;
  loading: boolean;
  initData: string;
  apiFetch: (url: string, opts?: RequestInit) => Promise<Response>;
}

const TgContext = createContext<TgContextValue>({
  user: null,
  loading: true,
  initData: "",
  apiFetch: () => Promise.reject("Not initialized"),
});

export function useTelegram() {
  return useContext(TgContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TgUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initData, setInitData] = useState("");

  useEffect(() => {
    // Get initData from Telegram WebApp
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void; setHeaderColor: (c: string) => void; setBackgroundColor: (c: string) => void } } }).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      try { tg.setHeaderColor("#FAF9F7"); } catch { /* ignore */ }
      try { tg.setBackgroundColor("#FAF9F7"); } catch { /* ignore */ }
      setInitData(tg.initData);
    }

    // For development without Telegram
    const data = tg?.initData || new URLSearchParams(window.location.search).get("initData") || "";
    setInitData(data);

    if (!data) {
      setLoading(false);
      return;
    }

    // Fetch user info
    fetch("/api/telegram/me", {
      headers: { Authorization: `tma ${data}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((u) => {
        setUser(u);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const apiFetch = useCallback(
    (url: string, opts: RequestInit = {}) => {
      return fetch(url, {
        ...opts,
        headers: {
          ...opts.headers,
          Authorization: `tma ${initData}`,
          "Content-Type": "application/json",
        },
      });
    },
    [initData]
  );

  return (
    <TgContext.Provider value={{ user, loading, initData, apiFetch }}>
      {children}
    </TgContext.Provider>
  );
}
