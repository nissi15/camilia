"use client";

const stats = [
  { value: "50+", label: "Warehouses" },
  { value: "2M", label: "Items Tracked" },
  { value: "99.2%", label: "Traceability" },
  { value: "250+", label: "Restaurants" },
];

export function StatsBar() {
  return (
    <section className="relative py-10 sm:py-14 px-6 bg-[#050505] border-y border-[#1A1A1A]">
      <div className="max-w-[1400px] mx-auto px-0 sm:px-4 lg:px-10">
        <div className="flex items-center gap-8 sm:gap-0 sm:justify-between overflow-x-auto no-scrollbar">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8 sm:gap-0 shrink-0">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[11px] text-[#6B7280] uppercase tracking-wider font-mono whitespace-nowrap">
                  {stat.label}
                </span>
              </div>
              {i < stats.length - 1 && (
                <span className="hidden sm:block w-px h-8 bg-[#1A1A1A] mx-8 lg:mx-12 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
