import type { QueueFilters } from "./queries";

/** React Query keys for hub appointment data. */
export const appointmentKeys = {
  all: ["appointments"] as const,
  queue: (filters: QueueFilters) => ["appointments", filters] as const,
  detail: (id: string) => ["appointment", id] as const,
  dashboard: ["dashboard"] as const,
  attention: ["attention"] as const,
  reschedules: ["reschedules"] as const,
};
