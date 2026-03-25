"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1a1f22] mb-1">Something went wrong</h2>
          <p className="text-sm text-[#414950]">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        <Button
          onClick={reset}
          variant="outline"
          className="rounded-xl gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
