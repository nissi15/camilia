"use client";

import { useTelegram } from "@/app/tg/providers";
import { ShieldX, MessageCircle, KeyRound, CheckCircle2 } from "lucide-react";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useTelegram();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3">
        <div className="animate-spin w-10 h-10 border-[3px] border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-400">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-400" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Access Required</h1>
            <p className="text-sm text-gray-500 mt-2">
              Your Telegram account is not linked to a staff profile yet. Follow the steps below to get started.
            </p>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl p-5 shadow-sm text-left space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Step 1</p>
                <p className="text-xs text-gray-500">Ask your manager or admin for your personal access code</p>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-gray-200 ml-4 h-2" />

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Step 2</p>
                <p className="text-xs text-gray-500">
                  Close this window and send the command below to this bot:
                </p>
                <div className="mt-2 bg-gray-50 rounded-xl px-3 py-2">
                  <code className="text-sm font-mono text-emerald-600 font-semibold">/link YOUR_CODE</code>
                </div>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-gray-200 ml-4 h-2" />

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Step 3</p>
                <p className="text-xs text-gray-500">
                  Once linked, reopen this app. You'll have full access automatically from now on.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-gray-400">
            Only authorized staff can access StockTrace. Contact your admin if you need help.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
