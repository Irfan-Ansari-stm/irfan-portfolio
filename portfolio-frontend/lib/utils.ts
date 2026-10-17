import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export function formatBytes(bytes: number | string, decimals = 1): string {
  const num = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (!num || isNaN(num) || num === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || "B"}`;
}

export function estimateReadingTime(content: string): number {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SKILL_LEVEL_MAP: Record<string, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 95,
};

export const SKILL_LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const PLATFORM_ICONS: Record<string, string> = {
  github: "github",
  linkedin: "linkedin",
  twitter: "twitter",
  instagram: "instagram",
  youtube: "youtube",
  website: "globe",
  other: "link",
};

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      if (typeof window !== "undefined" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
        return `${apiBase}${parsed.pathname}`;
      }
    } catch (_) {}
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

