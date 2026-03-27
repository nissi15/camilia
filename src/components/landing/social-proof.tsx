export function SocialProof() {
  const avatarColors = [
    "from-[#E8532E] to-[#FF6B42]",
    "from-[#6366F1] to-[#818CF8]",
    "from-[#F59E0B] to-[#FBBF24]",
    "from-[#22C55E] to-[#4ADE80]",
  ];

  const initials = ["JR", "AK", "MN", "TS"];

  return (
    <div className="flex items-center gap-3">
      {/* Overlapping avatars */}
      <div className="flex -space-x-2.5">
        {avatarColors.map((gradient, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-[#050505] flex items-center justify-center`}
          >
            <span className="text-[9px] font-bold text-white/90">
              {initials[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white">250+</span>
        <span className="text-[11px] text-[#6B7280]">Restaurant Chains</span>
      </div>
    </div>
  );
}
