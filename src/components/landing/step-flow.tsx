export function StepFlow() {
  const steps = [
    {
      number: "1",
      title: "Receive & Log",
      description: "Scan deliveries, verify quantities, record supplier details",
    },
    {
      number: "2",
      title: "Track Processing",
      description: "Monitor cutting, sorting, packaging with full traceability",
    },
    {
      number: "3",
      title: "Fulfill Orders",
      description: "Dispatch stock to restaurants with real-time tracking",
    },
  ];

  return (
    <div className="relative space-y-7">
      {/* Vertical connector line */}
      <div className="absolute left-[19px] top-10 bottom-10 w-px bg-[#1A1A1A]" />

      {steps.map((step, i) => (
        <div key={step.number} className="relative flex items-start gap-4">
          {/* Step circle */}
          <div
            className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              i === 0
                ? "bg-[#E8532E] text-white shadow-[0_0_20px_rgba(232,83,46,0.3)]"
                : "bg-[#E8532E]/10 text-[#E8532E] border border-[#E8532E]/20"
            }`}
          >
            {step.number}
          </div>

          {/* Content */}
          <div className="pt-1.5 space-y-1">
            <h4 className="text-sm font-semibold text-white">{step.title}</h4>
            <p className="text-xs text-[#6B7280] leading-relaxed max-w-[180px]">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
