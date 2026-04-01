"use client";

import { MapPin, ClipboardList, Cog, BarChart3 } from "lucide-react";
import { FeatureCard } from "@/components/landing/feature-card";

const features = [
  {
    icon: MapPin,
    title: "Real-time Tracking",
    description:
      "Monitor every ingredient from arrival to dispatch. Full traceability across your entire supply chain.",
    color: "#E8532E",
  },
  {
    icon: ClipboardList,
    title: "Smart Requests",
    description:
      "Restaurants submit stock requests in seconds. Automated workflows route orders to the right warehouse.",
    color: "#FF6B42",
  },
  {
    icon: Cog,
    title: "Processing Workflows",
    description:
      "Track cutting, sorting, and packaging operations. Record waste and yields at every stage.",
    color: "#F59E0B",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Actionable insights on stock levels, fulfillment rates, and processing efficiency across all locations.",
    color: "#E8532E",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 sm:py-36 px-6 bg-[#050505]">
      <div className="relative max-w-[1400px] mx-auto px-0 sm:px-4 lg:px-10">
        {/* Section header — split layout, left-aligned */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-16 mb-16 sm:mb-20">
          <div>
            <span className="text-[11px] font-mono font-medium text-[#E8532E] uppercase tracking-wider mb-5 block">
              / Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-black text-white tracking-[-0.03em] leading-[1.1]">
              Everything you need to manage ingredients
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-base text-[#6B7280] max-w-sm leading-relaxed">
              A complete platform for warehouse-to-restaurant ingredient
              traceability and stock management.
            </p>
          </div>
        </div>

        {/* Zigzag grid — alternating wide/narrow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <FeatureCard {...features[0]} index={0} wide />
          </div>
          <div>
            <FeatureCard {...features[1]} index={1} />
          </div>
          <div>
            <FeatureCard {...features[2]} index={2} />
          </div>
          <div className="sm:col-span-2">
            <FeatureCard {...features[3]} index={3} wide />
          </div>
        </div>
      </div>
    </section>
  );
}
