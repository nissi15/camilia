"use client";

import Link from "next/link";
import { Warehouse, ChefHat, ArrowRight } from "lucide-react";

const portals = [
  {
    icon: Warehouse,
    title: "Warehouse",
    description: "Central warehouse management & operations",
    href: "/login/warehouse",
    color: "#E8532E",
  },
  {
    icon: ChefHat,
    title: "Restaurant",
    description: "Stock requisition & order tracking",
    href: "/login/restaurant",
    color: "#F59E0B",
  },
];

export function CTASection() {
  return (
    <section className="relative py-28 sm:py-36 px-6 bg-[#050505]">
      {/* Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#1A1A1A]" />

      <div className="relative max-w-[1400px] mx-auto px-0 sm:px-4 lg:px-10">
        {/* Horizontal split — text left, cards right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — Typography */}
          <div className="space-y-6 max-w-md">
            <span className="text-[11px] font-mono font-medium text-[#E8532E] uppercase tracking-wider block">
              / Get Started
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-black text-white tracking-[-0.03em] leading-[1.1]">
              Ready to take
              <br />
              control?
            </h2>
            <p className="text-base text-[#6B7280] leading-relaxed">
              Choose your portal to sign in and start tracking ingredients
              across your entire supply chain.
            </p>
          </div>

          {/* Right — Portal cards stacked */}
          <div className="space-y-4">
            {portals.map((portal) => (
              <Link key={portal.title} href={portal.href} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-[#0A0A0A] border border-[#1A1A1A] p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[#E8532E]/30 hover:shadow-[0_8px_30px_rgba(232,83,46,0.06)] hover:-translate-y-1 cursor-pointer">
                  {/* Top accent */}
                  <div
                    className="absolute top-0 left-8 right-8 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${portal.color}, transparent)`,
                    }}
                  />

                  <div className="relative z-10 flex items-center gap-5">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-400 group-hover:scale-110"
                      style={{
                        backgroundColor: `${portal.color}15`,
                        boxShadow: `0 0 0 1px ${portal.color}20`,
                      }}
                    >
                      <portal.icon
                        className="w-6 h-6"
                        style={{ color: portal.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-heading font-semibold text-white">
                        {portal.title}
                      </h3>
                      <p className="text-sm text-[#6B7280] group-hover:text-[#9CA3AF] transition-colors duration-400 leading-relaxed mt-0.5">
                        {portal.description}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-400 translate-x-[-8px] group-hover:translate-x-0 shrink-0"
                      style={{ color: portal.color }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
