import type { PreviewInput } from "./preview";

/** React Query keys for care-series data. */
export const seriesKeys = {
  all: ["series"] as const,
  list: (status?: string) => ["series", status ?? "all"] as const,
  detail: (id: string) => ["series", id] as const,
  preview: (input: PreviewInput) => ["series-preview", input] as const,
  flagged: ["series-flagged"] as const,
};
