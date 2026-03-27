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
    <section className="relative py-28 sm:py-36 px-6 bg-[#0A0A0A]">
      <div className="relative max-w-lg mx-auto text-center space-y-12">
        <div className="space-y-5">
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-[-0.03em]">
            Ready to Get Started?
          </h2>
          <p className="text-base text-[#6B7280]">
            Choose your portal to sign in
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {portals.map((portal) => (
            <Link key={portal.title} href={portal.href} className="group">
              <div className="relative overflow-hidden rounded-2xl bg-[#111111] border border-[#1A1A1A] p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[#E8532E]/30 hover:shadow-[0_8px_30px_rgba(232,83,46,0.06)] hover:-translate-y-1.5 h-full cursor-pointer">
                {/* Top accent */}
                <div
                  className="absolute top-0 left-8 right-8 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${portal.color}, transparent)`,
                  }}
                />

                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-400 group-hover:scale-110"
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
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-heading font-semibold text-white">
                      {portal.title}
                    </h3>
                    <p className="text-sm text-[#6B7280] group-hover:text-[#9CA3AF] transition-colors duration-400 leading-relaxed">
                      {portal.description}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-2 group-hover:translate-y-0"
                    style={{ color: portal.color }}
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
