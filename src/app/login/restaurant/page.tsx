"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChefHat, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RestaurantLoginPage() {
  return (
    <Suspense>
      <RestaurantLoginForm />
    </Suspense>
  );
}

function RestaurantLoginForm() {
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
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm rounded-xl border border-outline-variant/15 shadow-sm">
        <CardHeader className="text-center space-y-3 pb-0 pt-8">
          <div className="mx-auto w-11 h-11 rounded-xl bg-emerald-600/10 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-semibold text-on-surface">
              Restaurant Portal
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Stock requisition & order tracking
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 rounded-lg bg-error/10 text-error text-xs font-medium">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-on-surface text-xs font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="rounded-lg h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-on-surface text-xs font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-lg h-9"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-lg h-9 text-sm font-medium bg-tertiary hover:bg-tertiary/90 text-white"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-[11px] text-on-surface-variant text-center pt-1 space-y-0.5">
              <p>Demo credentials:</p>
              <p>
                <span className="font-medium text-on-surface">chef@downtown.com</span>{" "}
                / chef123
              </p>
            </div>

            <div className="text-center pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
