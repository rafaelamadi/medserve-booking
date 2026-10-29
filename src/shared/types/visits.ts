export type VisitStatus =
  | "COMPLETED"
  | "IN_TREATMENT"
  | "SCHEDULED"
  | "RESCHEDULED"
  | "MISSED";

export interface PatientVisit {
  id: string;
  visitNumber?: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "08:30 AM"
  serviceName: string; // e.g. "Radiotherapy Session", "Chemotherapy Infusion", "Consultation"
  room?: string; // Optional clinical room / area
  status: VisitStatus;
  notes?: string;
  rescheduledFrom?: string;
}
