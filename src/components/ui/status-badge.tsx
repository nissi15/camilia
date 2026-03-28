import { cn } from "@/lib/utils";

const statusConfig: Record<string, { dot: string; bg: string; text: string }> = {
  // Item statuses
  RECEIVED: { dot: "bg-sky-500", bg: "bg-sky-500/10", text: "text-sky-700" },
  IN_PROCESSING: { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-700" },
  PROCESSED: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700" },
  PACKAGED: { dot: "bg-emerald-600", bg: "bg-emerald-600/10", text: "text-emerald-700" },
  DISPATCHED: { dot: "bg-violet-500", bg: "bg-violet-500/10", text: "text-violet-700" },
  DELIVERED: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700" },
  WASTE: { dot: "bg-error", bg: "bg-error/10", text: "text-error" },

  // Request statuses
  PENDING: { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-700" },
  PACKING: { dot: "bg-indigo-500", bg: "bg-indigo-500/10", text: "text-indigo-700" },
  CANCELLED: { dot: "bg-error", bg: "bg-error/10", text: "text-error" },

  // Priorities
  LOW: { dot: "bg-on-surface-variant", bg: "bg-surface-container", text: "text-on-surface-variant" },
  NORMAL: { dot: "bg-sky-500", bg: "bg-sky-500/10", text: "text-sky-700" },
  HIGH: { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-700" },
  URGENT: { dot: "bg-error", bg: "bg-error/10", text: "text-error" },

  // Request item statuses
  FULFILLED: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700" },
  UNAVAILABLE: { dot: "bg-error", bg: "bg-error/10", text: "text-error" },
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
