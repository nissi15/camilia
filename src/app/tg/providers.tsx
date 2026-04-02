"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";

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
  debugInfo: string;
  apiFetch: (url: string, opts?: RequestInit) => Promise<Response>;
}

const TgContext = createContext<TgContextValue>({
  user: null,
  loading: true,
  initData: "",
  debugInfo: "",
  apiFetch: () => Promise.reject("Not initialized"),
});

export function useTelegram() {
  return useContext(TgContext);
}

const SESSION_KEY = "tg-session-token";

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TgUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initData, setInitData] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const sessionTokenRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    function tryInit() {
      const tg = (window as unknown as { Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void; setHeaderColor: (c: string) => void; setBackgroundColor: (c: string) => void } } }).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        try { tg.setHeaderColor("#FAF9F7"); } catch { /* ignore */ }
        try { tg.setBackgroundColor("#FAF9F7"); } catch { /* ignore */ }
      }

      const data = tg?.initData || new URLSearchParams(window.location.search).get("initData") || "";
      return data;
    }

    async function authenticate(data: string) {
      if (cancelled) return;
      setInitData(data);
      const logs: string[] = [`initData length: ${data.length}`];

      // Try initData auth first
      if (data) {
        try {
          logs.push("Calling /api/telegram/me with tma...");
          const res = await fetch("/api/telegram/me", {
            headers: { Authorization: `tma ${data}` },
          });
          logs.push(`Response: ${res.status}`);
          if (res.ok) {
            const json = await res.json();
            if (!cancelled) {
              const { sessionToken, ...userData } = json;
              setUser(userData);
              if (sessionToken) {
                sessionTokenRef.current = sessionToken;
                try { localStorage.setItem(SESSION_KEY, sessionToken); } catch { /* ignore */ }
              }
              setDebugInfo(logs.join("\n"));
              setLoading(false);
              return;
            }
          } else {
            const body = await res.text();
            logs.push(`Error body: ${body}`);
          }
        } catch (e) {
          logs.push(`Fetch error: ${e}`);
        }
      }

      // Fallback: try stored session token
      const storedToken = (() => { try { return localStorage.getItem(SESSION_KEY); } catch { return null; } })();
      logs.push(`Session token: ${storedToken ? "found" : "none"}`);
      if (storedToken) {
        try {
          const res = await fetch("/api/telegram/me", {
            headers: { Authorization: `tma-session ${storedToken}` },
          });
          logs.push(`Session response: ${res.status}`);
          if (res.ok) {
            const json = await res.json();
            if (!cancelled) {
              const { sessionToken, ...userData } = json;
              setUser(userData);
              if (sessionToken) {
                sessionTokenRef.current = sessionToken;
                try { localStorage.setItem(SESSION_KEY, sessionToken); } catch { /* ignore */ }
              }
              setDebugInfo(logs.join("\n"));
              setLoading(false);
              return;
            }
          } else {
            try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      }

      if (!cancelled) {
        setDebugInfo(logs.join("\n"));
        setLoading(false);
      }
    }

    // Poll for Telegram WebApp SDK to load
    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
      attempts++;
      const data = tryInit();
      if (data) {
        clearInterval(interval);
        authenticate(data);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        authenticate("");
      }
    }, 100);

    // Also try immediately
    const data = tryInit();
    if (data) {
      clearInterval(interval);
      authenticate(data);
    }

    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const apiFetch = useCallback(
    (url: string, opts: RequestInit = {}) => {
      // Prefer initData if available, otherwise use session token
      const authValue = initData
        ? `tma ${initData}`
        : sessionTokenRef.current
          ? `tma-session ${sessionTokenRef.current}`
          : "";

      return fetch(url, {
        ...opts,
        headers: {
          ...opts.headers,
          Authorization: authValue,
          "Content-Type": "application/json",
        },
      });
    },
    [initData]
  );

  return (
    <TgContext.Provider value={{ user, loading, initData, debugInfo, apiFetch }}>
      {children}
    </TgContext.Provider>
  );
}
