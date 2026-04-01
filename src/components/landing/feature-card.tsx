"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  index: number;
  wide?: boolean;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  index,
  wide,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl h-full",
        "bg-[#0A0A0A] border border-[#1A1A1A]",
        "p-7 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:border-[#E8532E]/30 hover:shadow-[0_8px_30px_rgba(232,83,46,0.06)]",
        "hover:-translate-y-1.5",
        "cursor-pointer"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top accent line on hover */}
      <div
        className="absolute top-0 left-8 right-8 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />

      {/* Subtle background gradient on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse at top left, ${color}08, transparent 70%)`,
        }}
      />

      <div
        className={cn(
          "relative z-10",
          wide
            ? "flex items-start gap-6"
            : "space-y-5"
        )}
      >
        {/* Icon */}
        <div
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 transition-all duration-400 group-hover:scale-110 group-hover:shadow-lg"
          style={{
            backgroundColor: `${color}15`,
            boxShadow: `0 0 0 1px ${color}20`,
          }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>

        {/* Text */}
        <div className="space-y-2.5">
          <h3 className="text-base font-heading font-bold text-white tracking-[-0.01em]">
            {title}
          </h3>
          <p className="text-sm leading-[1.7] text-[#6B7280] group-hover:text-[#9CA3AF] transition-colors duration-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
