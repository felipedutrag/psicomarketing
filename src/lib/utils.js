import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(path) {
  if (typeof path === "string" && path.startsWith("/")) return path;
  return `/${path || ""}`;
}

