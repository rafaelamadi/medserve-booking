export type RoomCategory =
  | "ALL"
  | "ONCOLOGY"
  | "DIAGNOSTIC"
  | "CONSULTING";

export interface CentreCalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    patientName: string;
    mrn: string;
    patientId: string;
    phone: string;
    service: string;
    room: string;
    roomCategory: RoomCategory;
    centreCode: "MLCC" | "MKDC" | "MUDC";
    centreName: string;
    doctor: string;
    status: "SCHEDULED" | "CHECKED_IN" | "IN_TREATMENT" | "COMPLETED" | "MAINTENANCE";
    notes?: string;
  };
}

// Helper date generator for October 2026
const createEventDate = (day: number, hour: number, minute: number = 0) => {
  const d = new Date(2026, 9, day, hour, minute, 0); // month is 0-indexed: 9 = October
  return d;
};

export const CLINICAL_ROOM_CATEGORIES: { key: RoomCategory; label: string }[] = [
  { key: "ALL", label: "All Appointments" },
  { key: "ONCOLOGY", label: "Oncology Services" },
  { key: "DIAGNOSTIC", label: "Diagnostic Services" },
  { key: "CONSULTING", label: "Consultations" },
];

export const CENTRE_CALENDAR_EVENTS: CentreCalendarEvent[] = [
  // MLCC Lagos - Oncology Services
  {
    id: "cal-01",
    title: "Chidinma Nwosu — Radiotherapy",
    start: createEventDate(27, 8, 30),
    end: createEventDate(27, 9, 0),
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10b981",
    textColor: "#047857",
    extendedProps: {
      patientName: "Chidinma Nwosu",
      mrn: "MRN-0941",
      patientId: "pat-01",
      phone: "+234 803 234 8901",
      service: "Radiotherapy",
      room: "",
      roomCategory: "ONCOLOGY",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre",
      doctor: "Dr. Kachi",
      status: "SCHEDULED",
      notes: "Oncology radiation session.",
    },
  },
  {
    id: "cal-02",
    title: "Emeka Okafor — Radiotherapy",
    start: createEventDate(27, 11, 30),
    end: createEventDate(27, 12, 0),
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10b981",
    textColor: "#047857",
    extendedProps: {
      patientName: "Emeka Okafor",
      mrn: "MRN-0882",
      patientId: "pat-02",
      phone: "+234 802 345 6789",
      service: "Radiotherapy",
      room: "",
      roomCategory: "ONCOLOGY",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre",
      doctor: "Dr. Kachi",
      status: "CHECKED_IN",
      notes: "Arrived at reception, vitals checked.",
    },
  },
  {
    id: "cal-03",
    title: "Babatunde Adeleke — Chemotherapy",
    start: createEventDate(27, 9, 0),
    end: createEventDate(27, 11, 30),
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderColor: "#3b82f6",
    textColor: "#1d4ed8",
    extendedProps: {
      patientName: "Babatunde Adeleke",
      mrn: "MRN-0812",
      patientId: "pat-08",
      phone: "+234 802 888 1234",
      service: "Chemotherapy",
      room: "",
      roomCategory: "ONCOLOGY",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre",
      doctor: "Dr. Alabi",
      status: "COMPLETED",
      notes: "Pre-medication administered, infusion completed smoothly.",
    },
  },

  // MKDC Kano - Diagnostic Services
  {
    id: "cal-04",
    title: "Hajiya Amina Datti — MRI Scan",
    start: createEventDate(28, 10, 0),
    end: createEventDate(28, 10, 45),
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    borderColor: "#0ea5e9",
    textColor: "#0369a1",
    extendedProps: {
      patientName: "Hajiya Amina Datti",
      mrn: "MRN-1002",
      patientId: "pat-03",
      phone: "+234 809 456 7890",
      service: "MRI Scan",
      room: "",
      roomCategory: "DIAGNOSTIC",
      centreCode: "MKDC",
      centreName: "MedServe Kano Diagnostic Centre",
      doctor: "Dr. Bello",
      status: "SCHEDULED",
      notes: "Cranial diagnostic imaging scan.",
    },
  },
  {
    id: "cal-05",
    title: "Musa Garba — CT Scan",
    start: createEventDate(28, 11, 0),
    end: createEventDate(28, 11, 45),
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#f59e0b",
    textColor: "#b45309",
    extendedProps: {
      patientName: "Musa Garba",
      mrn: "MRN-1108",
      patientId: "pat-06",
      phone: "+234 814 332 1099",
      service: "CT Scan",
      room: "",
      roomCategory: "DIAGNOSTIC",
      centreCode: "MKDC",
      centreName: "MedServe Kano Diagnostic Centre",
      doctor: "Dr. Bello",
      status: "SCHEDULED",
      notes: "Contrast abdominopelvic CT examination.",
    },
  },

  // MUDC Umuahia - Diagnostic Services
  {
    id: "cal-06",
    title: "Grace Danjuma — Ultrasound",
    start: createEventDate(27, 12, 0),
    end: createEventDate(27, 12, 30),
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderColor: "#a855f7",
    textColor: "#7e22ce",
    extendedProps: {
      patientName: "Grace Danjuma",
      mrn: "MRN-0763",
      patientId: "pat-04",
      phone: "+234 802 890 1234",
      service: "Ultrasound",
      room: "",
      roomCategory: "DIAGNOSTIC",
      centreCode: "MUDC",
      centreName: "MedServe Umuahia Diagnostic Centre",
      doctor: "Dr. Chukwudi",
      status: "SCHEDULED",
      notes: "Diagnostic pelvic and abdominal sonography.",
    },
  },

  // MLCC Lagos - CT Simulation
  {
    id: "cal-07",
    title: "Ngozi Eze — CT Simulation",
    start: createEventDate(28, 14, 0),
    end: createEventDate(28, 15, 0),
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderColor: "#3b82f6",
    textColor: "#1d4ed8",
    extendedProps: {
      patientName: "Ngozi Eze",
      mrn: "MRN-1205",
      patientId: "pat-05",
      phone: "+234 806 789 0123",
      service: "CT Simulation",
      room: "",
      roomCategory: "ONCOLOGY",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre",
      doctor: "Dr. Alabi",
      status: "SCHEDULED",
      notes: "CT Simulation appointment.",
    },
  },

  // MLCC Lagos - Consultation
  {
    id: "cal-08",
    title: "Babatunde Fashina — Consultation",
    start: createEventDate(28, 9, 0),
    end: createEventDate(28, 9, 30),
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "#6366f1",
    textColor: "#4338ca",
    extendedProps: {
      patientName: "Babatunde Fashina",
      mrn: "MRN-0619",
      patientId: "pat-07",
      phone: "+234 803 777 9922",
      service: "Cancer Care / Consultation",
      room: "",
      roomCategory: "CONSULTING",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre",
      doctor: "Dr. Kachi",
      status: "SCHEDULED",
      notes: "Follow-up consultation.",
    },
  },

  // Public Holiday Marker
  {
    id: "cal-holiday-01",
    title: "Nigeria National Independence Day (All Centres Closed)",
    start: createEventDate(1, 0, 0),
    end: createEventDate(1, 23, 59),
    allDay: true,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderColor: "#ef4444",
    textColor: "#b91c1c",
    extendedProps: {
      patientName: "Statutory Holiday",
      mrn: "HOLIDAY",
      patientId: "",
      phone: "",
      service: "Public Holiday Closure",
      room: "",
      roomCategory: "ALL",
      centreCode: "MLCC",
      centreName: "All MedServe Facilities",
      doctor: "On-Call Emergency Staff Only",
      status: "MAINTENANCE",
      notes: "Routine patient appointments advance to Friday Oct 2.",
    },
  },
];
