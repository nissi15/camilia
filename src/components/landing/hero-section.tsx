"use client";

import Link from "next/link";
import { ArrowRight, Warehouse } from "lucide-react";
import { HeroVisual } from "@/components/landing/hero-visual";
import { SocialProof } from "@/components/landing/social-proof";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

export function HeroSection() {
  return (
    <section className="relative bg-[#050505] overflow-hidden min-h-screen">
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 max-w-[1400px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8532E] flex items-center justify-center">
            <Warehouse className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-heading font-bold text-white tracking-[-0.02em]">
            StockTrace
          </span>
        </div>

        {/* Nav links */}
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

      {/* Hero Content — 2-zone asymmetric */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-16 pt-16 sm:pt-24 lg:pt-32 pb-20 sm:pb-28 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start">
          {/* Left — Text block, left-aligned */}
          <div className="space-y-10 max-w-xl">
            {/* Status line */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-[#6B7280] uppercase tracking-[0.15em]">
                Status: Active // Tracking Ingredients
              </span>
            </div>

            <h1 className="text-[3rem] sm:text-[4.2rem] lg:text-[5rem] xl:text-[5.5rem] font-heading font-black text-white leading-[0.9] tracking-[-0.04em]">
              Trace every
              <br />
              ingredient,
              <br />
              <span className="text-[#E8532E]">from source</span>
              <br />
              to table.
            </h1>

            <p className="text-[15px] text-[#6B7280] max-w-md leading-relaxed">
              The OS for restaurant supply chains. Ingredients fail to reach
              kitchens not because supply is lacking, but because the structures
              to track and verify them are missing.
            </p>

            {/* Feature pills */}
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

            {/* CTAs + Social proof */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 flex-wrap">
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
              <SocialProof />
            </div>
          </div>

          {/* Right — Visual, offset to bleed right */}
          <div className="relative flex items-start justify-center lg:justify-end lg:translate-x-6 xl:translate-x-12">
            <HeroVisual />
          </div>
        </div>
      </div>

      {/* Ambient glow — off-center left */}
      <div className="absolute bottom-0 left-[20%] w-[40%] h-32 bg-[#E8532E]/[0.04] rounded-full blur-[100px]" />
    </section>
  );
}
