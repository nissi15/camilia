"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Warehouse, ArrowLeft, Building2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Admin account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Warehouse info
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [warehousePhone, setWarehousePhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          warehouseName,
          warehouseAddress: warehouseAddress || undefined,
          warehousePhone: warehousePhone || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed, redirect to login
        router.push("/login/warehouse");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
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
          Sign In
        </Link>
      </nav>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#E8532E]/10 border border-[#E8532E]/20 flex items-center justify-center">
              {step === 1 ? (
                <Warehouse className="w-6 h-6 text-[#FF6B42]" />
              ) : (
                <Building2 className="w-6 h-6 text-[#FF6B42]" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-white">
                {step === 1 ? "Create Your Account" : "Set Up Warehouse"}
              </h1>
              <p className="text-[11px] font-mono text-[#9CA3AF] mt-1 uppercase tracking-wider">
                Step {step} of 2 — {step === 1 ? "Admin details" : "Warehouse info"}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className={`w-8 h-1 rounded-full transition-all ${step >= 1 ? "bg-[#E8532E]" : "bg-[#2A2A2A]"}`} />
              <div className={`w-8 h-1 rounded-full transition-all ${step >= 2 ? "bg-[#E8532E]" : "bg-[#2A2A2A]"}`} />
            </div>
          </div>

          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono text-center">
                {error}
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className="w-full h-11 px-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#E8532E]/50 focus:ring-1 focus:ring-[#E8532E]/20 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 px-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#E8532E]/50 focus:ring-1 focus:ring-[#E8532E]/20 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full h-11 px-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#E8532E]/50 focus:ring-1 focus:ring-[#E8532E]/20 transition-all duration-200"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Warehouse Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Central Warehouse"
                    value={warehouseName}
                    onChange={(e) => setWarehouseName(e.target.value)}
                    required
                    autoFocus
                    className="w-full h-11 px-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#E8532E]/50 focus:ring-1 focus:ring-[#E8532E]/20 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Address <span className="text-[#555555]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="123 Industrial Blvd"
                    value={warehouseAddress}
                    onChange={(e) => setWarehouseAddress(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#E8532E]/50 focus:ring-1 focus:ring-[#E8532E]/20 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Phone <span className="text-[#555555]">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+250 788 000 000"
                    value={warehousePhone}
                    onChange={(e) => setWarehousePhone(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#E8532E]/50 focus:ring-1 focus:ring-[#E8532E]/20 transition-all duration-200"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-11 rounded-xl border border-[#2A2A2A] text-white font-mono font-semibold text-[12px] uppercase tracking-wider hover:bg-[#111111] transition-all duration-200"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-[#E8532E] text-white font-mono font-semibold text-[12px] uppercase tracking-wider hover:bg-[#FF6B42] transition-all duration-200 shadow-lg shadow-[#E8532E]/20 active:scale-[0.98] disabled:opacity-50"
              >
                {step === 1 ? "Next" : loading ? "Creating..." : "Create Warehouse"}
              </button>
            </div>

            {step === 1 && (
              <p className="text-center text-[11px] font-mono text-[#6B7280]">
                Already have an account?{" "}
                <Link href="/login/warehouse" className="text-[#E8532E] hover:text-[#FF6B42]">
                  Sign in
                </Link>
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="relative z-10 text-center pb-6">
        <p className="text-[11px] font-mono text-[#6B7280]">
          &copy; {new Date().getFullYear()} StockTrace
        </p>
      </div>
    </div>
  );
}
