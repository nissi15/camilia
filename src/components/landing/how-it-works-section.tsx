"use client";

import { PackageOpen, Scissors, Truck, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: PackageOpen,
    number: "01",
    title: "Receive & Log",
    description:
      "Scan deliveries at the warehouse door. Verify quantities, record supplier details, and assign batch numbers.",
    color: "#E8532E",
  },
  {
    icon: Scissors,
    number: "02",
    title: "Process & Track",
    description:
      "Monitor cutting, sorting, and packaging operations. Record yields and waste at every stage.",
    color: "#FF6B42",
  },
  {
    icon: Truck,
    number: "03",
    title: "Dispatch & Fulfill",
    description:
      "Restaurant requests are routed to the right warehouse. Dispatch stock with real-time tracking.",
    color: "#F59E0B",
  },
  {
    icon: BarChart3,
    number: "04",
    title: "Report & Optimize",
    description:
      "Actionable dashboards surface stock levels, fulfillment rates, and processing efficiency.",
    color: "#22C55E",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-28 sm:py-36 px-6 bg-[#050505]">
      {/* Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#1A1A1A]" />

      <div className="relative max-w-[1400px] mx-auto px-0 sm:px-4 lg:px-10">
        {/* Section header — split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-16 mb-16 sm:mb-20">
          <div>
            <span className="text-[11px] font-mono font-medium text-[#E8532E] uppercase tracking-wider mb-5 block">
              / How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-black text-white tracking-[-0.03em] leading-[1.1]">
              Built on Experience,
              <br />
              Driven by Trust
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-base text-[#6B7280] max-w-sm leading-relaxed">
              Our commitment to quality, safety, and smart logistics ensures
              your ingredients are always accounted for.
            </p>
          </div>
        </div>

        {/* Horizontal timeline — 4 columns */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-[22px] left-0 right-0 h-px bg-[#1A1A1A]" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step) => (
              <div key={step.number} className="relative group">
                {/* Step number with dot */}
                <div className="flex items-center gap-3 mb-6">
                  {/* Timeline dot */}
                  <div
                    className="relative z-10 w-[10px] h-[10px] rounded-full border-2 transition-all duration-500 group-hover:scale-125"
                    style={{
                      borderColor: step.color,
                      backgroundColor: "transparent",
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ backgroundColor: step.color }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold font-mono tracking-wider"
                    style={{ color: step.color }}
                  >
                    {step.number}
                  </span>
                  <div className="flex-1 h-px bg-[#1A1A1A] lg:hidden" />
                </div>

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-400 group-hover:scale-110"
                  style={{
                    backgroundColor: `${step.color}12`,
                    boxShadow: `0 0 0 1px ${step.color}20`,
                  }}
                >
                  <step.icon className="w-5 h-5" style={{ color: step.color }} />
                </div>

                {/* Text */}
                <h3 className="text-base font-heading font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed group-hover:text-[#9CA3AF] transition-colors duration-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
