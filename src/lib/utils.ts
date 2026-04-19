import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const pathSegments = parsed.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (pathSegments.length === 0) {
      return host;
    }

    const firstSegment = decodeURIComponent(pathSegments[0]);
    const cleanedSegment = firstSegment.replace(/[-_]+/g, " ");

    if (cleanedSegment.length <= 24 && pathSegments.length === 1) {
      return `${host}/${cleanedSegment}`;
    }

    return `${host}/${cleanedSegment.slice(0, 24).trim()}...`;
  } catch {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/[?#].*$/, "");
  }
}
