export const ITEM_STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Received",
  IN_PROCESSING: "In Processing",
  PROCESSED: "Processed",
  PACKAGED: "Packaged",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  WASTE: "Waste",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PACKING: "Packing",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const STEP_TYPE_LABELS: Record<string, string> = {
  RECEIVE: "Receive",
  BUTCHER: "Butcher",
  PORTION: "Portion",
  PACKAGE: "Package",
  CUSTOM: "Custom",
};

// Weight conversion helpers
export const GRAMS_PER_LB = 453.592;
export const GRAMS_PER_KG = 1000;

export function gramsToLb(grams: number): number {
  return Math.round((grams / GRAMS_PER_LB) * 100) / 100;
}

export function lbToGrams(lb: number): number {
  return Math.round(lb * GRAMS_PER_LB * 100) / 100;
}

export function gramsToKg(grams: number): number {
  return Math.round((grams / GRAMS_PER_KG) * 100) / 100;
}

export function kgToGrams(kg: number): number {
  return Math.round(kg * GRAMS_PER_KG * 100) / 100;
}

// Batch code generator
export function generateBatchCode(categoryName: string): string {
  const prefix = categoryName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

// Request number generator
export function generateRequestNumber(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REQ-${dateStr}-${random}`;
}

// Lot number generator: SUPPLIER-YYYYMMDD-SEQ
export function generateLotNumber(supplierName: string): string {
  const prefix = supplierName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4) || "UNKN";
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const seq = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${dateStr}-${seq}`;
}

// Link code generator for Telegram account linking
export function generateLinkCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// RWF currency formatting
export function formatRwf(amount: number): string {
  return new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculate yield percentage
export function calcYieldPercent(inputWeight: number, outputWeight: number): number {
  if (inputWeight <= 0) return 0;
  return Math.round((outputWeight / inputWeight) * 10000) / 100;
}
