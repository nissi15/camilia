"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Warehouse, ChefHat, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E8532E]/[0.03] rounded-full blur-[120px]" />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 max-w-[1280px] mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8532E] flex items-center justify-center">
            <Warehouse className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-heading font-bold text-white tracking-[-0.02em]">
            StockTrace
          </span>
        </Link>

        <Link
          href="/"
          className="text-[12px] font-mono font-medium text-[#6B7280] hover:text-white transition-colors duration-200 uppercase tracking-wider"
        >
          Back to Home
        </Link>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-lg space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-[#6B7280] uppercase tracking-[0.15em]">
                Select Portal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-[-0.03em]">
              Welcome back
            </h1>
            <p className="text-[13px] font-mono text-[#6B7280] max-w-sm mx-auto leading-relaxed">
              Choose your portal to access the dashboard
            </p>
          </div>

          {/* Portal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Warehouse card */}
            <Link href={`/login/warehouse${qs}`} className="group">
              <div className="relative rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] p-8 transition-all duration-300 hover:border-[#E8532E]/30 hover:bg-[#0D0D0D] cursor-pointer h-full flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0055d7]/10 border border-[#0055d7]/20 flex items-center justify-center group-hover:bg-[#0055d7]/15 group-hover:border-[#0055d7]/30 transition-all duration-300">
                  <Warehouse className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-heading font-bold text-white">
                    Warehouse
                  </h2>
                  <p className="text-[11px] font-mono text-[#6B7280] leading-relaxed">
                    Central warehouse management & operations
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#E8532E] opacity-0 group-hover:opacity-100 transition-all duration-300 uppercase tracking-wider">
                  Continue <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>

            {/* Restaurant card */}
            <Link href={`/login/restaurant${qs}`} className="group">
              <div className="relative rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] p-8 transition-all duration-300 hover:border-[#E8532E]/30 hover:bg-[#0D0D0D] cursor-pointer h-full flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center group-hover:bg-emerald-600/15 group-hover:border-emerald-600/30 transition-all duration-300">
                  <ChefHat className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-heading font-bold text-white">
                    Restaurant
                  </h2>
                  <p className="text-[11px] font-mono text-[#6B7280] leading-relaxed">
                    Stock requisition & order tracking
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#E8532E] opacity-0 group-hover:opacity-100 transition-all duration-300 uppercase tracking-wider">
                  Continue <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 text-center pb-6">
        <p className="text-[11px] font-mono text-[#3A3A3A]">
          &copy; {new Date().getFullYear()} StockTrace
        </p>
      </div>
    </div>
  );
}
