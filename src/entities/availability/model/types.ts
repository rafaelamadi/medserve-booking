export type DayRule = {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startMinute: number; // minutes from midnight, centre local time
  endMinute: number;
};

export type ClosureRange = {
  startsOn: string; // YYYY-MM-DD
  endsOn: string; // YYYY-MM-DD
};

export type Slot = {
  start: string; // "HH:mm" centre local
  startsAt: Date; // UTC
  endsAt: Date; // UTC
  remaining: number;
};

export type GenerateDayInput = {
  date: string; // YYYY-MM-DD in centre local time
  timeZone: string;
  rules: DayRule[];
  slotMinutes: number;
  capacityPerSlot: number;
  /** keyed by "HH:mm" slot start */
  bookedCounts: Record<string, number>;
  minLeadMinutes: number;
  now: Date;
  holidays?: string[]; // YYYY-MM-DD
  closures?: ClosureRange[];
};
