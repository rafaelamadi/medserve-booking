import { create } from "zustand";
import { REGISTERED_PATIENTS, type RegisteredPatient } from "./patient-registry";
import type { PatientVisit } from "@/shared/types";

interface StoredBooking {
  reference: string;
  date?: string;
  timeSlot?: string;
  serviceName?: string;
  notes?: string;
}

interface PatientPortalState {
  patientId: string;
  patient: RegisteredPatient;
  activeTab: string;
  customVisits: PatientVisit[];
  calendarFocusDate: string | null;
  setPatientId: (id: string) => void;
  setPatient: (patient: RegisteredPatient) => void;
  setActiveTab: (tab: string) => void;
  addCustomVisit: (visit: PatientVisit) => void;
  setCalendarFocusDate: (dateStr: string | null) => void;
}

// Retrieve previously saved patient id from localStorage if available
function getInitialPatient(): RegisteredPatient {
  if (typeof window !== "undefined") {
    try {
      const savedId = localStorage.getItem("medserve_active_patient_id");
      if (savedId) {
        const found = REGISTERED_PATIENTS.find((p) => p.id === savedId);
        if (found) return found;
      }
    } catch {
      // ignore storage access errors
    }
  }
  return REGISTERED_PATIENTS[0];
}

// Retrieve previously booked visits from localStorage if available
function getInitialCustomVisits(): PatientVisit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("medserve_patient_custom_visits");
    const parsed: PatientVisit[] = raw ? JSON.parse(raw) : [];

    // Also ingest from public bookings if not already present
    const rawBookings = localStorage.getItem("medserve_public_bookings");
    if (rawBookings) {
      const bookings = JSON.parse(rawBookings);
      if (Array.isArray(bookings)) {
        const existingIds = new Set(parsed.map((v) => v.id));
        bookings.forEach((b: StoredBooking) => {
          const id = `vis-bkg-${b.reference}`;
          if (!existingIds.has(id) && b.date && b.serviceName) {
            parsed.push({
              id,
              date: b.date,
              timeSlot: b.timeSlot || "09:00 AM",
              serviceName: b.serviceName,
              room: "Consulting Room",
              status: "SCHEDULED",
              notes: b.notes ? `${b.notes} (${b.reference})` : `Booked appointment #${b.reference}`,
            });
            existingIds.add(id);
          }
        });
      }
    }

    return parsed;
  } catch {
    return [];
  }
}

const initialPatient = getInitialPatient();

export const usePatientPortalStore = create<PatientPortalState>((set) => ({
  patientId: initialPatient.id,
  patient: initialPatient,
  activeTab: "schedule",
  customVisits: getInitialCustomVisits(),
  calendarFocusDate: null,
  setPatientId: (id: string) => {
    const found = REGISTERED_PATIENTS.find((p) => p.id === id);
    if (found) {
      set({ patientId: id, patient: found });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("medserve_active_patient_id", id);
        } catch {
          // ignore
        }
      }
    }
  },
  setPatient: (patient: RegisteredPatient) => {
    set((state) => {
      const isDifferent = state.patientId !== patient.id;
      return {
        patientId: patient.id,
        patient,
        ...(isDifferent ? { customVisits: [] } : {}),
      };
    });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("medserve_active_patient_id", patient.id);
      } catch {
        // ignore
      }
    }
  },
  setActiveTab: (tab: string) => {
    set({ activeTab: tab });
  },
  addCustomVisit: (visit: PatientVisit) => {
    set((state) => {
      const filtered = state.customVisits.filter((v) => v.id !== visit.id);
      const updated = [visit, ...filtered];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("medserve_patient_custom_visits", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return { customVisits: updated, calendarFocusDate: visit.date };
    });
  },
  setCalendarFocusDate: (dateStr: string | null) => {
    set({ calendarFocusDate: dateStr });
  },
}));
