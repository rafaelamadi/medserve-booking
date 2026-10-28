export type RoomCategory =
  | "ALL"
  | "LINAC_1"
  | "LINAC_2"
  | "LINAC_HALCYON"
  | "CT_SIM"
  | "BRACHY"
  | "INFUSION"
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
  { key: "ALL", label: "All Suites & Vaults" },
  { key: "LINAC_1", label: "Linac Vault 1 (Elekta Versa HD)" },
  { key: "LINAC_2", label: "Linac Vault 2 (Varian TrueBeam)" },
  { key: "LINAC_HALCYON", label: "Linac Vault 1 (Varian Halcyon)" },
  { key: "CT_SIM", label: "CT Simulation Suite (Siemens RT)" },
  { key: "BRACHY", label: "Brachytherapy Suite (Flexitron HDR)" },
  { key: "INFUSION", label: "Chemotherapy Infusion Bays" },
  { key: "CONSULTING", label: "Consulting Suites (Outpatient)" },
];

export const CENTRE_CALENDAR_EVENTS: CentreCalendarEvent[] = [
  // MLCC Lagos - Linac Vault 1
  {
    id: "cal-01",
    title: "Chidinma Nwosu — VMAT RT #15",
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
      service: "Radiotherapy (VMAT) Session #15",
      room: "Linac Vault 1 (Elekta Versa HD)",
      roomCategory: "LINAC_1",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre (Lagos)",
      doctor: "Dr. Kachi",
      status: "SCHEDULED",
      notes: "Right breast tangents with breath-hold gating.",
    },
  },
  {
    id: "cal-02",
    title: "Emeka Okafor — VMAT RT #13",
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
      service: "Radiotherapy (VMAT) Session #13",
      room: "Linac Vault 1 (Elekta Versa HD)",
      roomCategory: "LINAC_1",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre (Lagos)",
      doctor: "Dr. Kachi",
      status: "CHECKED_IN",
      notes: "Arrived at reception, gowning in dressing room A.",
    },
  },
  {
    id: "cal-03",
    title: "Engr. Babatunde — Vault 1 Morning QA",
    start: createEventDate(27, 6, 45),
    end: createEventDate(27, 7, 30),
    backgroundColor: "rgba(100, 116, 139, 0.15)",
    borderColor: "#64748b",
    textColor: "#334155",
    extendedProps: {
      patientName: "Staff QA Block",
      mrn: "STAFF-QA",
      patientId: "",
      phone: "+234 805 229 1184",
      service: "Daily Output & Beam Flatness QA",
      room: "Linac Vault 1 (Elekta Versa HD)",
      roomCategory: "LINAC_1",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre (Lagos)",
      doctor: "Engr. Babatunde Alabi",
      status: "COMPLETED",
      notes: "Ionization chamber beam output within 0.4% tolerance. Cleared for treatment.",
    },
  },

  // MKDC Kano - Linac Vault 2
  {
    id: "cal-04",
    title: "Hajiya Amina Datti — 3D-CRT RT #9",
    start: createEventDate(28, 10, 0),
    end: createEventDate(28, 10, 30),
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    borderColor: "#0ea5e9",
    textColor: "#0369a1",
    extendedProps: {
      patientName: "Hajiya Amina Datti",
      mrn: "MRN-1002",
      patientId: "pat-03",
      phone: "+234 809 456 7890",
      service: "Radiotherapy (3D-CRT) Session #9",
      room: "Linac Vault 2 (Varian TrueBeam)",
      roomCategory: "LINAC_2",
      centreCode: "MKDC",
      centreName: "Kano Diagnostic & Oncology Centre",
      doctor: "Dr. Farouk",
      status: "SCHEDULED",
      notes: "Pelvic field 4-field box setup with belly board.",
    },
  },
  {
    id: "cal-05",
    title: "Musa Garba — Chemotherapy Cycle #5",
    start: createEventDate(28, 10, 30),
    end: createEventDate(28, 13, 0),
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#f59e0b",
    textColor: "#b45309",
    extendedProps: {
      patientName: "Musa Garba",
      mrn: "MRN-1108",
      patientId: "pat-06",
      phone: "+234 814 332 1099",
      service: "Chemotherapy Infusion Cycle #5 (R-CHOP)",
      room: "Infusion Suite B",
      roomCategory: "INFUSION",
      centreCode: "MKDC",
      centreName: "Kano Diagnostic & Oncology Centre",
      doctor: "Dr. Farouk",
      status: "SCHEDULED",
      notes: "Pre-medications: Ondansetron & Dexamethasone 30 mins prior to Rituximab.",
    },
  },

  // MUDC Abuja - Linac Halcyon
  {
    id: "cal-06",
    title: "Grace Danjuma — Halcyon RT #23",
    start: createEventDate(27, 11, 15),
    end: createEventDate(27, 11, 45),
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderColor: "#a855f7",
    textColor: "#7e22ce",
    extendedProps: {
      patientName: "Grace Danjuma",
      mrn: "MRN-0763",
      patientId: "pat-04",
      phone: "+234 802 890 1234",
      service: "Radiotherapy (Halcyon Fast-VMAT) Session #23",
      room: "Linac Vault 1 (Varian Halcyon)",
      roomCategory: "LINAC_HALCYON",
      centreCode: "MUDC",
      centreName: "Abuja Diagnostic & Radiotherapy Centre",
      doctor: "Dr. Nnamdi",
      status: "SCHEDULED",
      notes: "Thermoplastic mask fixation. Daily kV-CBCT match to cranial target.",
    },
  },

  // MLCC Lagos - CT Simulation Suite
  {
    id: "cal-07",
    title: "Ngozi Eze — RT Staging CT Sim",
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
      service: "Simulation & Contouring CT Scan",
      room: "CT Simulation Suite (Siemens RT)",
      roomCategory: "CT_SIM",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre (Lagos)",
      doctor: "Dr. Kachi",
      status: "SCHEDULED",
      notes: "Pelvic scan with IV contrast and rectal balloon immobilization.",
    },
  },

  // MLCC Lagos - Consulting Room 101
  {
    id: "cal-08",
    title: "Babatunde Fashina — Oncology Follow-up",
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
      service: "Post-RT Follow-up & Lab Review",
      room: "Consulting Room 101",
      roomCategory: "CONSULTING",
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre (Lagos)",
      doctor: "Dr. Kachi",
      status: "SCHEDULED",
      notes: "Review PSA marker results following completion of 20 fractions.",
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
      room: "All Centres",
      roomCategory: "ALL",
      centreCode: "MLCC",
      centreName: "All MedServe Facilities",
      doctor: "On-Call Emergency Staff Only",
      status: "MAINTENANCE",
      notes: "Routine patient appointments advance to Friday Oct 2.",
    },
  },
];
