"use client";

import { useTelegram } from "@/app/tg/providers";
import { ShieldX, MessageCircle, KeyRound, CheckCircle2 } from "lucide-react";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useTelegram();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen tg-bg gap-3">
        <div className="animate-spin w-10 h-10 border-[3px] border-tertiary border-t-transparent rounded-full" />
        <p className="text-sm text-on-surface-variant">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen tg-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6 tg-animate-in">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-error/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-error" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl text-on-surface tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Access Required</h1>
            <p className="text-sm text-on-surface-variant mt-2">
              Your Telegram account is not linked to a staff profile yet. Follow the steps below to get started.
            </p>
          </div>

          {/* Steps */}
          <div className="tg-card p-5 text-left space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-tertiary/10 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-tertiary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Step 1</p>
                <p className="text-xs text-on-surface-variant">Ask your manager or admin for your personal access code</p>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-outline-variant/30 ml-4 h-2" />

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Step 2</p>
                <p className="text-xs text-on-surface-variant">
                  Close this window and send the command below to this bot:
                </p>
                <div className="mt-2 bg-surface-container rounded-xl px-3 py-2">
                  <code className="text-sm font-mono text-tertiary font-semibold">/link YOUR_CODE</code>
                </div>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-outline-variant/30 ml-4 h-2" />

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Step 3</p>
                <p className="text-xs text-on-surface-variant">
                  Once linked, reopen this app. You'll have full access automatically from now on.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-on-surface-variant/60">
            Only authorized staff can access StockTrace. Contact your admin if you need help.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
