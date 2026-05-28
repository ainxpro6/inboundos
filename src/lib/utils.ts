import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ItemFulfillmentStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a pseudo-UUID for mock data
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Determine fulfillment status based on ordered vs received quantities
 */
export function getFulfillmentStatus(
  qtyOrder: number,
  qtyReceived: number
): ItemFulfillmentStatus {
  if (qtyReceived === 0) return "NOT_STARTED";
  if (qtyReceived < qtyOrder) return "PARTIAL";
  if (qtyReceived === qtyOrder) return "FULFILLED";
  return "OVER"; // qtyReceived > qtyOrder
}

/**
 * Get fulfillment status label in semi-Indonesian
 */
export function getFulfillmentLabel(status: ItemFulfillmentStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "Belum Mulai";
    case "PARTIAL":
      return "Kurang";
    case "FULFILLED":
      return "Sesuai";
    case "OVER":
      return "Berlebih";
  }
}

/**
 * Calculate progress percentage (capped at 100)
 */
export function getProgressPercent(
  qtyOrder: number,
  qtyReceived: number
): number {
  if (qtyOrder === 0) return 0;
  return Math.min(Math.round((qtyReceived / qtyOrder) * 100), 100);
}

/**
 * Check if expiry date is less than 6 months from today
 */
export function isExpiryWarning(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return expiry <= sixMonthsFromNow;
}

/**
 * Format date to locale-friendly display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format timestamp to locale-friendly display
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Simulated API delay for mock services
 */
export function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
