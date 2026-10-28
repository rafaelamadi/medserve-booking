/**
 * TanStack Query key conventions for client-side fetching:
 * - ["centres"]
 * - ["centre-services", centreId]
 * - ["slots", centreServiceId, date]
 * - ["closed-days", centreServiceId, yearMonth]
 */
export const queryKeys = {
  centres: ["centres"] as const,
  centreServices: (centreId: string) => ["centre-services", centreId] as const,
  slots: (centreServiceId: string, date: string) => ["slots", centreServiceId, date] as const,
  closedDays: (centreServiceId: string, yearMonth: string) =>
    ["closed-days", centreServiceId, yearMonth] as const,
};
