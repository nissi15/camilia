"use client";

import { Package, Cog, ClipboardList } from "lucide-react";

export function HeroVisual() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto" style={{ perspective: "1200px" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 -inset-x-12 bg-[#E8532E]/[0.06] rounded-full blur-[80px]" />

      <div
        className="relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Back card — Restaurant Request */}
        <div
          className="absolute top-6 left-1/2 w-[280px] sm:w-[300px] rounded-2xl bg-[#0A0A0A] border border-[#1A1A1A] p-5 space-y-3"
          style={{
            transform: "translateX(-50%) translateZ(-60px) rotateY(-8deg) rotateX(4deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E8532E]/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#E8532E]" />
            </div>
            <span className="text-xs font-semibold text-white/60">Restaurant Request</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Branch</span>
              <span className="text-white/70">Downtown Grill #4</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Items</span>
              <span className="text-white/70">12 ingredients</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Priority</span>
              <span className="text-[#F59E0B] font-medium">Urgent</span>
            </div>
          </div>
        </div>

        {/* Middle card — Processing Log */}
        <div
          className="absolute top-3 left-1/2 w-[280px] sm:w-[300px] rounded-2xl bg-[#111111] border border-[#1A1A1A] p-5 space-y-3"
          style={{
            transform: "translateX(-45%) translateZ(-30px) rotateY(-5deg) rotateX(3deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B42]/10 flex items-center justify-center">
              <Cog className="w-4 h-4 text-[#FF6B42]" />
            </div>
            <span className="text-xs font-semibold text-white/70">Processing Log</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Operation</span>
              <span className="text-white/70">Cutting & Sorting</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Yield</span>
              <span className="text-[#22C55E] font-medium">94.2%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[94%] bg-gradient-to-r from-[#E8532E] to-[#FF6B42] rounded-full" />
            </div>
          </div>
        </div>

        {/* Front card — Incoming Shipment (main visual) */}
        <div
          className="relative w-[280px] sm:w-[300px] mx-auto rounded-2xl bg-[#111111] border border-[#252525] p-5 space-y-4 shadow-[0_0_60px_rgba(232,83,46,0.08)]"
          style={{
            transform: "rotateY(-3deg) rotateX(2deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8532E]/15 flex items-center justify-center">
                <Package className="w-4 h-4 text-[#E8532E]" />
              </div>
              <span className="text-xs font-semibold text-white/90">Incoming Shipment</span>
            </div>
            <span className="text-[10px] font-medium text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">Verified</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Ingredient</span>
              <span className="text-white/90 font-medium">Atlantic Salmon Fillet</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Supplier</span>
              <span className="text-white/70">Nordic Fresh Co.</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Quantity</span>
              <span className="text-white/70">240 kg</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Batch</span>
              <span className="text-[#E8532E] font-mono text-[10px]">#STK-2026-0847</span>
            </div>
          </div>

          {/* Mini progress */}
          <div className="pt-1 space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/30">Traceability</span>
              <span className="text-white/50">Complete</span>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 h-1 bg-[#E8532E] rounded-full" />
              <div className="flex-1 h-1 bg-[#E8532E] rounded-full" />
              <div className="flex-1 h-1 bg-[#E8532E] rounded-full" />
              <div className="flex-1 h-1 bg-[#E8532E]/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for the stacked cards height */}
      <div className="h-[280px] sm:h-[300px]" />
    </div>
  );
}
