"use client";

import { PackageOpen, Scissors, Truck, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: PackageOpen,
    number: "01",
    title: "Receive & Log",
    description:
      "Scan deliveries at the warehouse door. Verify quantities, record supplier details, and assign batch numbers instantly.",
    color: "#E8532E",
  },
  {
    icon: Scissors,
    number: "02",
    title: "Process & Track",
    description:
      "Monitor cutting, sorting, and packaging operations. Record yields and waste at every stage with full traceability.",
    color: "#FF6B42",
  },
  {
    icon: Truck,
    number: "03",
    title: "Dispatch & Fulfill",
    description:
      "Restaurant requests are routed to the right warehouse. Dispatch stock with real-time delivery tracking.",
    color: "#F59E0B",
  },
  {
    icon: BarChart3,
    number: "04",
    title: "Report & Optimize",
    description:
      "Actionable dashboards surface stock levels, fulfillment rates, and processing efficiency across all locations.",
    color: "#22C55E",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-28 sm:py-36 px-6 bg-[#050505]">
      {/* Divider line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-3xl h-px bg-gradient-to-r from-transparent via-[#1A1A1A] to-transparent" />

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center space-y-5 mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8532E]/10 border border-[#E8532E]/20 text-[11px] font-mono font-medium text-[#E8532E] uppercase tracking-wider">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-black text-white tracking-[-0.03em]">
            Built on Experience, Driven by Trust
          </h2>
          <p className="text-base sm:text-lg text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            Our commitment to quality, safety, and smart logistics ensures your ingredients are always accounted for.
          </p>
        </div>

        {/* Steps grid — 2x2 layout like the construction site services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="group relative rounded-2xl bg-[#0A0A0A] border border-[#1A1A1A] p-8 sm:p-10 transition-all duration-500 hover:border-[#E8532E]/20 hover:-translate-y-1"
            >
              {/* Step number watermark */}
              <span className="absolute top-6 right-8 font-mono font-bold text-[4rem] sm:text-[5rem] text-white/[0.03] leading-none select-none">
                {step.number}
              </span>

              <div className="relative z-10 flex items-start gap-5">
                {/* Icon */}
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-400 group-hover:scale-110"
                  style={{
                    backgroundColor: `${step.color}12`,
                    boxShadow: `0 0 0 1px ${step.color}20`,
                  }}
                >
                  <step.icon className="w-6 h-6" style={{ color: step.color }} />
                </div>

                {/* Content */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold font-mono tracking-wider"
                      style={{ color: step.color }}
                    >
                      STEP {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed group-hover:text-[#9CA3AF] transition-colors duration-400">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
