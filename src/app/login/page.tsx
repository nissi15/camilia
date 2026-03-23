"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Warehouse, ChefHat } from "lucide-react";
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
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo & title */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#1a1d23] flex items-center justify-center">
            <Warehouse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-on-surface">
            StockTrace
          </h1>
          <p className="text-on-surface-variant">
            Choose your portal to sign in
          </p>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Warehouse card */}
          <Link href={`/login/warehouse${qs}`} className="group">
            <Card className="rounded-2xl border-0 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] cursor-pointer h-full">
              <CardContent className="flex flex-col items-center text-center py-10 px-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0055d7] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Warehouse className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-heading font-bold text-on-surface">
                    Warehouse Login
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Central warehouse management & operations
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Restaurant card */}
          <Link href={`/login/restaurant${qs}`} className="group">
            <Card className="rounded-2xl border-0 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] cursor-pointer h-full">
              <CardContent className="flex flex-col items-center text-center py-10 px-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-heading font-bold text-on-surface">
                    Restaurant Login
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Stock requisition & order tracking
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
