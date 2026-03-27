"use client";

import Link from "next/link";
import { ArrowRight, Warehouse } from "lucide-react";
import { HeroVisual } from "@/components/landing/hero-visual";
import { StepFlow } from "@/components/landing/step-flow";
import { SocialProof } from "@/components/landing/social-proof";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

function StarDecoration({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#E8532E"
      className={className}
    >
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative bg-[#050505] overflow-hidden min-h-screen">
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 max-w-[1280px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8532E] flex items-center justify-center">
            <Warehouse className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-heading font-bold text-white tracking-[-0.02em]">
            StockTrace
          </span>
        </div>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[12px] font-mono font-medium text-[#6B7280] hover:text-white transition-colors duration-200 uppercase tracking-wider"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-[12px] font-mono font-medium text-[#6B7280] hover:text-white transition-colors duration-200 uppercase tracking-wider"
          >
            Sign in
          </Link>
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#E8532E] text-white font-semibold text-[13px] hover:bg-[#FF6B42] transition-all duration-200 shadow-lg shadow-[#E8532E]/20 active:scale-[0.97]"
        >
          Get Started
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </nav>

      {/* Star decorations */}
      <StarDecoration
        size={28}
        className="absolute top-28 right-[18%] opacity-50 hidden lg:block"
      />
      <StarDecoration
        size={18}
        className="absolute top-44 right-[22%] opacity-30 hidden lg:block"
      />
      <StarDecoration
        size={14}
        className="absolute bottom-[30%] left-[8%] opacity-20 hidden lg:block"
      />

      {/* Hero Content — 3 column layout */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-16 sm:pb-24 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          {/* Left — Headline, subtitle, CTAs */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-5">
              {/* Status line — Rovify style */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-[11px] font-mono font-medium text-[#6B7280] uppercase tracking-[0.15em]">
                  Status: Active // Tracking Ingredients
                </span>
              </div>

              <h1 className="text-[2.8rem] sm:text-[3.8rem] lg:text-[4.2rem] xl:text-[5rem] font-heading font-black text-white leading-[0.95] tracking-[-0.04em]">
                Trace every
                <br />
                ingredient,
                <br />
                <span className="text-[#E8532E]">from source</span>
                <br />
                to table.
              </h1>

              <p className="text-[14px] font-mono text-[#6B7280] max-w-sm leading-relaxed">
                The OS for restaurant supply chains. Ingredients fail to reach kitchens not because supply is lacking, but because the structures to track and verify them are missing.
              </p>
            </div>

            {/* Pill tags — inspired by construction site filter pills */}
            <div className="flex flex-wrap gap-2">
              {["Inventory", "Traceability", "Real-time Analytics", "Agile Fulfillment"].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111111] border border-[#252525] text-[11px] font-mono font-medium text-[#9CA3AF] uppercase tracking-wider hover:border-[#E8532E]/40 hover:text-white transition-all duration-300 cursor-default"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8532E]" />
                  {tag}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#E8532E] text-white font-mono font-semibold text-[12px] uppercase tracking-wider hover:bg-[#FF6B42] transition-all duration-200 shadow-lg shadow-[#E8532E]/20 active:scale-[0.97]"
              >
                Launch Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#252525] text-[#9CA3AF] font-mono font-medium text-[12px] uppercase tracking-wider hover:border-[#E8532E]/40 hover:text-white transition-all duration-200"
              >
                View Features
              </Link>
            </div>

            {/* Social Proof */}
            <SocialProof />
          </div>

          {/* Center — 3D Card Visual */}
          <div className="lg:col-span-4 flex items-center justify-center">
            <HeroVisual />
          </div>

          {/* Right — Step Flow */}
          <div className="lg:col-span-3 flex items-center justify-center lg:justify-end">
            <StepFlow />
          </div>
        </div>
      </div>

      {/* Bottom ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-32 bg-[#E8532E]/[0.04] rounded-full blur-[100px]" />
    </section>
  );
}
