export type PatientStatus = "ACTIVE" | "UNDER_REVIEW" | "COMPLETED" | "INACTIVE";

export interface PatientVisitHistory {
  id: string;
  reference: string;
  date: string;
  timeSlot: string;
  serviceName: string;
  room: string;
  status: "COMPLETED" | "CHECKED_IN" | "IN_TREATMENT" | "SCHEDULED" | "RESCHEDULED" | "NO_SHOW";
  doctor: string;
  notes?: string;
}

export interface PatientCommLog {
  id: string;
  timestamp: string;
  channel: "SMS" | "WHATSAPP" | "EMAIL" | "PHONE_CALL";
  type: "APPOINTMENT_REMINDER" | "SCHEDULE_UPDATE" | "CHECK_IN_CONFIRM" | "CLINICAL_CALL";
  recipient: string;
  status: "DELIVERED" | "SENT" | "FAILED";
  messageSnippet: string;
}

export interface RegisteredPatient {
  id: string;
  mrn: string;
  fullName: string;
  gender: "Male" | "Female";
  age: number;
  phone: string;
  email: string;
  address: string;
  state: string;
  centreCode: "MLCC" | "MKDC" | "MUDC";
  centreName: string;
  primaryDiagnosis: string;
  primaryService: string;
  doctorInCharge: string;
  status: PatientStatus;
  registrationDate: string;
  totalVisits: number;
  completedVisits: number;
  remainingVisits: number;
  nextVisit?: {
    date: string;
    timeSlot: string;
    service: string;
    room: string;
  };
  scheduleRef?: string;
  visits: PatientVisitHistory[];
  commLogs: PatientCommLog[];
}

export const REGISTERED_PATIENTS: RegisteredPatient[] = [
  {
    id: "pat-01",
    mrn: "MS-100941",
    fullName: "Chidinma Nwosu",
    gender: "Female",
    age: 48,
    phone: "+234 803 234 8901",
    email: "chidinma.nwosu@example.com",
    address: "14 Victoria Arobieke St, Lekki Phase 1",
    state: "Lagos State",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    primaryDiagnosis: "Invasive Ductal Carcinoma, Right Breast (pT2 N1 M0)",
    primaryService: "Radiotherapy",
    doctorInCharge: "Dr. Kachi",
    status: "ACTIVE",
    registrationDate: "2026-09-18",
    totalVisits: 25,
    completedVisits: 14,
    remainingVisits: 11,
    nextVisit: {
      date: "2026-10-27",
      timeSlot: "08:30 AM",
      service: "Radiotherapy Session #15",
      room: "",
    },
    scheduleRef: "SCH-MLCC-084",
    visits: [
      {
        id: "pv-01-1",
        reference: "MLCC-2610-001",
        date: "2026-10-26",
        timeSlot: "08:30 AM",
        serviceName: "Radiotherapy Session #14",
        room: "",
        status: "IN_TREATMENT",
        doctor: "Dr. Kachi",
        notes: "Fraction 14 delivered. Target position verified via kV-CBCT.",
      },
      {
        id: "pv-01-2",
        reference: "MLCC-2610-002",
        date: "2026-10-23",
        timeSlot: "08:30 AM",
        serviceName: "Radiotherapy Session #13",
        room: "",
        status: "COMPLETED",
        doctor: "Dr. Kachi",
      },
      {
        id: "pv-01-3",
        reference: "MLCC-2610-003",
        date: "2026-10-22",
        timeSlot: "08:30 AM",
        serviceName: "Radiotherapy Session #12",
        room: "",
        status: "COMPLETED",
        doctor: "Dr. Kachi",
      },
      {
        id: "pv-01-4",
        reference: "MLCC-0925-010",
        date: "2026-09-25",
        timeSlot: "11:00 AM",
        serviceName: "CT Simulation & Contrast Scan",
        room: "CT Simulator Suite",
        status: "COMPLETED",
        doctor: "Dr. Kachi",
        notes: "Vacuum cushion moulded. Tattoo fiducials placed.",
      },
      {
        id: "pv-01-5",
        reference: "MLCC-0918-004",
        date: "2026-09-18",
        timeSlot: "02:00 PM",
        serviceName: "Initial Oncology Consultation",
        room: "Consultation Room 2",
        status: "COMPLETED",
        doctor: "Dr. Kachi",
      },
    ],
    commLogs: [
      {
        id: "cl-01-0",
        timestamp: "2026-10-26 08:00",
        channel: "EMAIL",
        type: "APPOINTMENT_REMINDER",
        recipient: "chidinma.nwosu@example.com",
        status: "DELIVERED",
        messageSnippet: "Appointment reminder: Radiotherapy Session #14 at 08:30 AM today at MedServe LUTH.",
      },
      {
        id: "cl-01-1",
        timestamp: "2026-10-25 18:00",
        channel: "SMS",
        type: "APPOINTMENT_REMINDER",
        recipient: "+234 803 234 8901",
        status: "DELIVERED",
        messageSnippet: "Dear Chidinma, reminder for your Radiotherapy visit tomorrow at 08:30 AM at MedServe LUTH.",
      },
      {
        id: "cl-01-2",
        timestamp: "2026-10-18 09:15",
        channel: "WHATSAPP",
        type: "SCHEDULE_UPDATE",
        recipient: "+234 803 234 8901",
        status: "DELIVERED",
        messageSnippet: "Your 25-session treatment schedule has been confirmed. You can view your visit calendar anytime.",
      },
    ],
  },
  {
    id: "pat-02",
    mrn: "MS-100882",
    fullName: "Emeka Okafor",
    gender: "Male",
    age: 54,
    phone: "+234 802 345 6789",
    email: "emeka.okafor@example.com",
    address: "8 Oluyole Estate, Ring Road",
    state: "Oyo State",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    primaryDiagnosis: "Left Breast Carcinoma, Post-Lumpectomy (T1c N0 M0)",
    primaryService: "Radiotherapy",
    doctorInCharge: "Dr. Kachi",
    status: "ACTIVE",
    registrationDate: "2026-09-22",
    totalVisits: 20,
    completedVisits: 12,
    remainingVisits: 8,
    nextVisit: {
      date: "2026-10-27",
      timeSlot: "11:30 AM",
      service: "Radiotherapy Session #13",
      room: "",
    },
    scheduleRef: "SCH-MLCC-085",
    visits: [
      {
        id: "pv-02-1",
        reference: "MLCC-2610-014",
        date: "2026-10-23",
        timeSlot: "09:00 AM",
        serviceName: "Radiotherapy Session #12",
        room: "",
        status: "COMPLETED",
        doctor: "Dr. Kachi",
      },
      {
        id: "pv-02-2",
        reference: "MLCC-2610-015",
        date: "2026-10-22",
        timeSlot: "09:00 AM",
        serviceName: "Radiotherapy Session #11",
        room: "",
        status: "COMPLETED",
        doctor: "Dr. Kachi",
      },
    ],
    commLogs: [
      {
        id: "cl-02-1",
        timestamp: "2026-10-26 14:20",
        channel: "PHONE_CALL",
        type: "SCHEDULE_UPDATE",
        recipient: "+234 802 345 6789",
        status: "DELIVERED",
        messageSnippet: "Spoke with patient regarding travel from Ibadan. Moved tomorrow's slot to 11:30 AM.",
      },
    ],
  },
  {
    id: "pat-03",
    mrn: "MS-101002",
    fullName: "Hajiya Amina Datti",
    gender: "Female",
    age: 51,
    phone: "+234 809 456 7890",
    email: "amina.datti@example.com",
    address: "24 Bompai Road, Nassarawa",
    state: "Kano State",
    centreCode: "MKDC",
    centreName: "MedServe Kano Diagnostic Centre",
    primaryDiagnosis: "Cranial Neurological Workup",
    primaryService: "MRI Scan",
    doctorInCharge: "Dr. Bello",
    status: "ACTIVE",
    registrationDate: "2026-10-02",
    totalVisits: 3,
    completedVisits: 1,
    remainingVisits: 2,
    nextVisit: {
      date: "2026-10-28",
      timeSlot: "10:00 AM",
      service: "MRI Scan (Brain with Contrast)",
      room: "",
    },
    scheduleRef: "SCH-MKDC-042",
    visits: [
      {
        id: "pv-03-1",
        reference: "MKDC-2610-008",
        date: "2026-10-23",
        timeSlot: "10:00 AM",
        serviceName: "MRI Scan (Brain)",
        room: "",
        status: "COMPLETED",
        doctor: "Dr. Bello",
      },
    ],
    commLogs: [
      {
        id: "cl-03-1",
        timestamp: "2026-10-26 11:30",
        channel: "SMS",
        type: "APPOINTMENT_REMINDER",
        recipient: "+234 809 456 7890",
        status: "DELIVERED",
        messageSnippet: "Your rescheduled session #9 has been moved to Wednesday Oct 28 at 10:00 AM at MedServe Kano.",
      },
    ],
  },
  {
    id: "pat-04",
    mrn: "MS-100763",
    fullName: "Grace Danjuma",
    gender: "Female",
    age: 42,
    phone: "+234 802 890 1234",
    email: "grace.danjuma@example.com",
    address: "MedServe Diagnostic Complex, Umuahia",
    state: "Abia State",
    centreCode: "MUDC",
    centreName: "MedServe Umuahia Diagnostic Centre",
    primaryDiagnosis: "Diagnostic Imaging & Workup",
    primaryService: "Diagnostic Ultrasound",
    doctorInCharge: "Dr. Chukwudi",
    status: "ACTIVE",
    registrationDate: "2026-09-10",
    totalVisits: 3,
    completedVisits: 2,
    remainingVisits: 1,
    nextVisit: {
      date: "2026-10-27",
      timeSlot: "11:15 AM",
      service: "Diagnostic Ultrasound Scan",
      room: "",
    },
    scheduleRef: "SCH-MUDC-029",
    visits: [
      {
        id: "pv-04-1",
        reference: "MUDC-2610-005",
        date: "2026-10-26",
        timeSlot: "11:15 AM",
        serviceName: "Diagnostic Ultrasound Scan",
        room: "",
        status: "COMPLETED",
        doctor: "Dr. Chukwudi",
      },
    ],
    commLogs: [],
  },
  {
    id: "pat-05",
    mrn: "MS-100619",
    fullName: "Babatunde Fashina",
    gender: "Male",
    age: 67,
    phone: "+234 803 777 9922",
    email: "babatunde.fashina@example.com",
    address: "35 Marine Road, Apapa",
    state: "Lagos State",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    primaryDiagnosis: "Prostate Adenocarcinoma (Gleason 4+3=7)",
    primaryService: "Radiotherapy",
    doctorInCharge: "Dr. Kachi",
    status: "COMPLETED",
    registrationDate: "2026-08-25",
    totalVisits: 20,
    completedVisits: 20,
    remainingVisits: 0,
    scheduleRef: "SCH-MLCC-079",
    visits: [
      {
        id: "pv-05-1",
        reference: "MLCC-1014-020",
        date: "2026-10-14",
        timeSlot: "09:30 AM",
        serviceName: "Radiotherapy Session #20 (Final)",
        room: "",
        status: "COMPLETED",
        doctor: "Dr. Kachi",
        notes: "Full course completed. PSA test scheduled in 3 months.",
      },
    ],
    commLogs: [],
  },
  {
    id: "pat-06",
    mrn: "MS-101108",
    fullName: "Musa Garba",
    gender: "Male",
    age: 39,
    phone: "+234 814 332 1099",
    email: "musa.garba@example.com",
    address: "12 Airport Road, Fagge",
    state: "Kano State",
    centreCode: "MKDC",
    centreName: "MedServe Kano Diagnostic Centre",
    primaryDiagnosis: "Abdominal Staging & Evaluation",
    primaryService: "CT Scan",
    doctorInCharge: "Dr. Bello",
    status: "ACTIVE",
    registrationDate: "2026-08-01",
    totalVisits: 3,
    completedVisits: 2,
    remainingVisits: 1,
    nextVisit: {
      date: "2026-11-02",
      timeSlot: "10:30 AM",
      service: "CT Scan (Abdomen & Pelvis)",
      room: "",
    },
    scheduleRef: "SCH-MKDC-039",
    visits: [
      {
        id: "pv-06-1",
        reference: "MKDC-1012-004",
        date: "2026-10-12",
        timeSlot: "10:30 AM",
        serviceName: "CT Scan (Abdomen)",
        room: "",
        status: "COMPLETED",
        doctor: "Dr. Bello",
      },
    ],
    commLogs: [],
  },
  {
    id: "pat-07",
    mrn: "MS-101205",
    fullName: "Ngozi Eze",
    gender: "Female",
    age: 58,
    phone: "+234 806 789 0123",
    email: "ngozi.eze@example.com",
    address: "7 Agodopo Ave, Ikoyi",
    state: "Lagos State",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    primaryDiagnosis: "Colorectal Neoplasm (Dukes C)",
    primaryService: "Oncology Consultation",
    doctorInCharge: "Dr. Kachi",
    status: "UNDER_REVIEW",
    registrationDate: "2026-10-24",
    totalVisits: 1,
    completedVisits: 1,
    remainingVisits: 0,
    visits: [
      {
        id: "pv-07-1",
        reference: "MLCC-2610-025",
        date: "2026-10-24",
        timeSlot: "03:30 PM",
        serviceName: "Multidisciplinary Tumour Board Review",
        room: "Consultation Suite 1",
        status: "COMPLETED",
        doctor: "Dr. Kachi",
        notes: "Pathology slides reviewed. Radiation planning CT indicated.",
      },
    ],
    commLogs: [],
  },
];
