"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Warehouse, ArrowLeft } from "lucide-react";

export default function WarehouseLoginPage() {
  return (
    <Suspense>
      <WarehouseLoginForm />
    </Suspense>
  );
}

function WarehouseLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#E8532E]/[0.04] rounded-full blur-[120px]" />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 max-w-[1280px] mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8532E] flex items-center justify-center">
            <Warehouse className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-heading font-bold text-white tracking-[-0.02em]">
            StockTrace
          </span>
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[12px] font-mono font-medium text-[#6B7280] hover:text-white transition-colors duration-200 uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#E8532E]/10 border border-[#E8532E]/20 flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-[#FF6B42]" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-white">
                Warehouse Portal
              </h1>
              <p className="text-[11px] font-mono text-[#9CA3AF] mt-1 uppercase tracking-wider">
                Central warehouse management & operations
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[11px] font-mono font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full h-11 px-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#E8532E]/50 focus:ring-1 focus:ring-[#E8532E]/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-[11px] font-mono font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#E8532E]/50 focus:ring-1 focus:ring-[#E8532E]/20 transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#E8532E] text-white font-mono font-semibold text-[12px] uppercase tracking-wider hover:bg-[#FF6B42] transition-all duration-200 shadow-lg shadow-[#E8532E]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="text-center space-y-1 pt-1">
              <p className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider">Demo credentials</p>
              <p className="text-[11px] font-mono text-[#9CA3AF]">
                <span className="text-white/80">admin@stocktrace.com</span>{" "}
                / admin123
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 text-center pb-6">
        <p className="text-[11px] font-mono text-[#6B7280]">
          &copy; {new Date().getFullYear()} StockTrace
        </p>
      </div>
    </div>
  );
}
