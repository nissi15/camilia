"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";

export function SessionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Telegram routes use their own auth (initData), skip NextAuth SessionProvider
  // to avoid /api/auth/session calls that fail when AUTH_SECRET is missing
  if (pathname?.startsWith("/tg")) {
    return <>{children}</>;
  }

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
