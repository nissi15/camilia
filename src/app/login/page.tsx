"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Warehouse, ChefHat, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginChoice />
    </Suspense>
  );
}

function LoginChoice() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const qs = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo & title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#1a1d23] flex items-center justify-center">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-on-surface">
            StockTrace
          </h1>
          <p className="text-sm text-on-surface-variant">
            Choose your portal to sign in
          </p>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Warehouse card */}
          <Link href={`/login/warehouse${qs}`} className="group">
            <Card className="rounded-xl border border-outline-variant/15 shadow-sm transition-all duration-200 hover:shadow-md hover:border-outline-variant/30 cursor-pointer h-full">
              <CardContent className="flex flex-col items-center text-center py-8 px-5 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#0055d7]/10 flex items-center justify-center group-hover:bg-[#0055d7]/15 transition-colors">
                  <Warehouse className="w-6 h-6 text-[#0055d7]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-heading font-semibold text-on-surface">
                    Warehouse
                  </h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Central warehouse management & operations
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-[#0055d7] opacity-0 group-hover:opacity-100 transition-opacity">
                  Continue <ArrowRight className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Restaurant card */}
          <Link href={`/login/restaurant${qs}`} className="group">
            <Card className="rounded-xl border border-outline-variant/15 shadow-sm transition-all duration-200 hover:shadow-md hover:border-outline-variant/30 cursor-pointer h-full">
              <CardContent className="flex flex-col items-center text-center py-8 px-5 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center group-hover:bg-emerald-600/15 transition-colors">
                  <ChefHat className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-heading font-semibold text-on-surface">
                    Restaurant
                  </h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Stock requisition & order tracking
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Continue <ArrowRight className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
