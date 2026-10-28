export type SeriesPattern = "DAILY_WORKING_DAYS" | "EVERY_N_DAYS" | "EVERY_N_WEEKS" | "CUSTOM_DATES";

export type ClosedData = {
  holidays: string[]; // YYYY-MM-DD
  closures: Array<{ startsOn: string; endsOn: string }>;
};

export type GeneratedSession = {
  date: string; // YYYY-MM-DD centre-local
  adjustedFrom?: string; // original target when moved off a closed day
};

export type SkippedDay = {
  date: string;
  reason: "weekend" | "holiday" | "closure";
};

export type GenerateSeriesInput = {
  pattern: SeriesPattern;
  intervalN?: number; // EVERY_N_DAYS / EVERY_N_WEEKS
  totalSessions: number; // ignored for CUSTOM_DATES
  startDate: string; // YYYY-MM-DD
  customDates?: string[];
  closed: ClosedData;
};

export type GenerateSeriesOutput = {
  sessions: GeneratedSession[];
  skipped: SkippedDay[];
};
