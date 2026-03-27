import type { Metadata, Viewport } from "next";
import { TelegramProvider } from "./providers";
import { BottomNav } from "@/components/telegram/bottom-nav";
import { AccessGate } from "@/components/telegram/access-gate";
import { TgErrorBoundary } from "@/components/telegram/error-boundary";
import Script from "next/script";

export const metadata: Metadata = {
  title: "StockTrace",
  description: "Restaurant chain ingredient tracking",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TelegramProvider>
        <AccessGate>
          <TgErrorBoundary fallbackMessage="Could not load this page. Tap retry to refresh.">
            <div className="min-h-screen bg-gray-50 pb-20">
              {children}
            </div>
          </TgErrorBoundary>
          <BottomNav />
        </AccessGate>
      </TelegramProvider>
    </>
  );
}
