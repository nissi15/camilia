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
      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center space-y-5 mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8532E]/10 border border-[#E8532E]/20 text-[11px] font-mono font-medium text-[#E8532E] uppercase tracking-wider">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-black text-white tracking-[-0.03em]">
            Everything you need to manage ingredients
          </h2>
          <p className="text-base sm:text-lg text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            A complete platform for warehouse-to-restaurant ingredient
            traceability and stock management.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
