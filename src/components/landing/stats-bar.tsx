"use client";

const stats = [
  { value: "50+", label: "Warehouses" },
  { value: "2M", label: "Items Tracked" },
  { value: "99.2%", label: "Traceability" },
  { value: "250+", label: "Restaurants" },
];

export function StatsBar() {
  return (
    <section className="relative py-14 sm:py-20 px-6 bg-[#050505]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative text-center py-6 sm:py-8 rounded-2xl bg-[#0A0A0A] border border-[#1A1A1A] group hover:border-[#E8532E]/20 transition-all duration-500"
            >
              {/* Top accent on hover */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#E8532E] to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <p className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-black text-white tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1.5 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
