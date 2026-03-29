import { cn } from "@/lib/utils";

const statusConfig: Record<string, { dot: string; bg: string; text: string }> = {
  // Item statuses - mostly muted
  RECEIVED: { dot: "bg-tertiary", bg: "bg-tertiary/8", text: "text-tertiary" },
  IN_PROCESSING: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600" },
  PROCESSED: { dot: "bg-tertiary", bg: "bg-tertiary/8", text: "text-tertiary" },
  PACKAGED: { dot: "bg-slate-500", bg: "bg-slate-100", text: "text-slate-600" },
  DISPATCHED: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600" },
  DELIVERED: { dot: "bg-tertiary", bg: "bg-tertiary/8", text: "text-tertiary" },
  WASTE: { dot: "bg-error", bg: "bg-error/8", text: "text-error" },

  // Request statuses
  PENDING: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  PACKING: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600" },
  CANCELLED: { dot: "bg-error", bg: "bg-error/8", text: "text-error" },

  // Priorities - only urgent gets bold color
  LOW: { dot: "bg-slate-300", bg: "bg-slate-50", text: "text-slate-500" },
  NORMAL: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600" },
  HIGH: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  URGENT: { dot: "bg-error", bg: "bg-error/8", text: "text-error" },

  // Request item statuses
  FULFILLED: { dot: "bg-tertiary", bg: "bg-tertiary/8", text: "text-tertiary" },
  UNAVAILABLE: { dot: "bg-error", bg: "bg-error/8", text: "text-error" },
};

const statusLabels: Record<string, string> = {
  RECEIVED: "Received",
  IN_PROCESSING: "In Processing",
  PROCESSED: "Processed",
  PACKAGED: "Packaged",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  WASTE: "Waste",
  PENDING: "Pending",
  PACKING: "Packing",
  CANCELLED: "Cancelled",
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
  FULFILLED: "Fulfilled",
  UNAVAILABLE: "Unavailable",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { dot: "bg-on-surface-variant", bg: "bg-surface-container", text: "text-on-surface-variant" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide",
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {statusLabels[status] || status}
    </span>
  );
}
