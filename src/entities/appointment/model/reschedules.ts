export interface RescheduleRequest {
  id: string;
  reference: string;
  patientId: string;
  patientName: string;
  mrn: string;
  phone: string;
  centreCode: "MLCC" | "MKDC" | "MUDC";
  centreName: string;
  serviceName: string;
  room: string;
  currentDate: string;
  currentTimeSlot: string;
  requestedDate: string;
  requestedTimeSlot: string;
  requestedBy: "PATIENT" | "CLINICIAN" | "SYSTEM_EQUIPMENT";
  reason: string;
  urgency: "ROUTINE" | "URGENT" | "CRITICAL_BREAK";
  status: "PENDING" | "APPROVED" | "DECLINED";
  isBulkSeries: boolean;
  remainingVisitsCount: number;
  createdAt: string;
  clinicianNotes?: string;
}

export const RESCHEDULE_REQUESTS_DATA: RescheduleRequest[] = [
  {
    id: "req-01",
    reference: "REQ-2026-091",
    patientId: "pat-01",
    patientName: "Chidinma Nwosu",
    mrn: "MRN-0941",
    phone: "+234 803 234 8901",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    serviceName: "Radiotherapy (VMAT) Session #15",
    room: "",
    currentDate: "2026-10-27",
    currentTimeSlot: "08:30 AM",
    requestedDate: "2026-10-28",
    requestedTimeSlot: "10:30 AM",
    requestedBy: "PATIENT",
    reason: "Severe traffic gridlock on Lekki-Epe expressway; unable to arrive before morning session ends.",
    urgency: "URGENT",
    status: "PENDING",
    isBulkSeries: true,
    remainingVisitsCount: 11,
    createdAt: "Today at 07:15 AM",
  },
  {
    id: "req-02",
    reference: "REQ-2026-088",
    patientId: "pat-03",
    patientName: "Hajiya Amina Datti",
    mrn: "MRN-1002",
    phone: "+234 809 456 7890",
    centreCode: "MKDC",
    centreName: "MedServe Kano Diagnostic Centre",
    serviceName: "MRI Scan (Brain with Contrast)",
    room: "",
    currentDate: "2026-10-28",
    currentTimeSlot: "10:00 AM",
    requestedDate: "2026-10-29",
    requestedTimeSlot: "11:30 AM",
    requestedBy: "SYSTEM_EQUIPMENT",
    reason: "Imaging facility routine maintenance scheduled.",
    urgency: "ROUTINE",
    status: "PENDING",
    isBulkSeries: false,
    remainingVisitsCount: 1,
    createdAt: "Today at 08:30 AM",
  },
  {
    id: "req-03",
    reference: "REQ-2026-085",
    patientId: "pat-04",
    patientName: "Grace Danjuma",
    mrn: "MRN-0763",
    phone: "+234 802 890 1234",
    centreCode: "MUDC",
    centreName: "MedServe Umuahia Diagnostic Centre",
    serviceName: "Diagnostic Ultrasound Scan",
    room: "",
    currentDate: "2026-10-27",
    currentTimeSlot: "11:15 AM",
    requestedDate: "2026-10-28",
    requestedTimeSlot: "02:00 PM",
    requestedBy: "PATIENT",
    reason: "Delayed arrival from Aba transit; requesting afternoon appointment window.",
    urgency: "URGENT",
    status: "PENDING",
    isBulkSeries: false,
    remainingVisitsCount: 1,
    createdAt: "Yesterday at 04:20 PM",
  },
  {
    id: "req-04",
    reference: "REQ-2026-079",
    patientId: "pat-02",
    patientName: "Emeka Okafor",
    mrn: "MRN-0882",
    phone: "+234 802 345 6789",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    serviceName: "Radiotherapy Session #13",
    room: "",
    currentDate: "2026-10-27",
    currentTimeSlot: "11:30 AM",
    requestedDate: "2026-10-29",
    requestedTimeSlot: "11:30 AM",
    requestedBy: "CLINICIAN",
    reason: "Dr. Kachi advised 48-hour recovery rest day following acute clinical evaluation.",
    urgency: "CRITICAL_BREAK",
    status: "PENDING",
    isBulkSeries: true,
    remainingVisitsCount: 8,
    createdAt: "Yesterday at 02:45 PM",
  },
  {
    id: "req-05",
    reference: "REQ-2026-072",
    patientId: "pat-05",
    patientName: "Babatunde Fashina",
    mrn: "MRN-0619",
    phone: "+234 803 777 9922",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    serviceName: "Clinical Oncology Review & PSA Check",
    room: "",
    currentDate: "2026-10-28",
    currentTimeSlot: "02:00 PM",
    requestedDate: "2026-10-28",
    requestedTimeSlot: "09:00 AM",
    requestedBy: "PATIENT",
    reason: "Early morning time preferred due to outpatient laboratory fasting blood draw.",
    urgency: "ROUTINE",
    status: "APPROVED",
    isBulkSeries: false,
    remainingVisitsCount: 0,
    createdAt: "2026-10-25 11:00 AM",
  },
  {
    id: "req-06",
    reference: "REQ-2026-068",
    patientId: "pat-06",
    patientName: "Musa Garba",
    mrn: "MRN-1108",
    phone: "+234 814 332 1099",
    centreCode: "MKDC",
    centreName: "MedServe Kano Diagnostic Centre",
    serviceName: "CT Scan Evaluation",
    room: "",
    currentDate: "2026-11-02",
    currentTimeSlot: "10:30 AM",
    requestedDate: "2026-11-04",
    requestedTimeSlot: "10:30 AM",
    requestedBy: "CLINICIAN",
    reason: "Awaiting complete lab profile before scheduled imaging procedure.",
    urgency: "ROUTINE",
    status: "APPROVED",
    isBulkSeries: false,
    remainingVisitsCount: 1,
    createdAt: "2026-10-24 03:15 PM",
  },
];
