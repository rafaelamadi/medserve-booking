export type SchedulePattern =
  | "DAILY_WORKING_DAYS"
  | "EVERY_N_DAYS"
  | "EVERY_N_WEEKS"
  | "CUSTOM_DATES";

export type ScheduleStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "ON_HOLD";

import type { PatientVisit, VisitStatus } from "@/shared/types";
export type { PatientVisit, VisitStatus };

export interface PatientCareSchedule {
  id: string;
  reference: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  centreCode: "MLCC" | "MKDC" | "MUDC";
  centreName: string;
  primaryService: string;
  technique: string;
  diagnosis: string;
  room: string;
  doctorInCharge: string;
  totalVisits: number;
  completedVisits: number;
  remainingVisits: number;
  nextVisitDate: string;
  nextVisitTime: string;
  pattern: SchedulePattern;
  startDate: string;
  projectedEndDate: string;
  status: ScheduleStatus;
  hasRescheduleRequest: boolean;
  rescheduleNotice?: string;
  visits: PatientVisit[];
}

function createSeriesVisits(
  startDateStr: string,
  total: number,
  completed: number,
  prefix: string,
  service = "Radiotherapy Session",
  room = "Linac Vault 1"
): PatientVisit[] {
  const visits: PatientVisit[] = [];
  const [year, month, day] = startDateStr.split("-").map(Number);
  const curr = new Date(year, month - 1, day);
  let count = 1;

  while (count <= total) {
    const dayOfWeek = curr.getDay(); // 0: Sun, 6: Sat
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, "0");
      const dd = String(curr.getDate()).padStart(2, "0");
      const date = `${yyyy}-${mm}-${dd}`;

      let status: VisitStatus = "SCHEDULED";
      if (count <= completed) {
        status = "COMPLETED";
      } else if (count === completed + 1) {
        status = "IN_TREATMENT";
      }

      let notes: string | undefined = undefined;
      if (count === 1) notes = "First session orientation and laser alignment completed.";
      else if (count === 7) notes = "Weekly clinical review. Skin condition intact.";
      else if (count === 14) notes = "Session 14 completed. Treatment tolerated well.";

      visits.push({
        id: `${prefix}-${count}`,
        visitNumber: count,
        date,
        timeSlot: "08:30 AM",
        serviceName: service,
        room,
        status,
        notes,
      });

      count++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  return visits;
}

export const PATIENT_SCHEDULES: PatientCareSchedule[] = [
  {
    id: "cs-01",
    reference: "SCH-MLCC-084",
    patientId: "pat-01",
    patientName: "Chidinma Nwosu",
    patientMrn: "MRN-0941",
    patientPhone: "+234 803 234 8901",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    primaryService: "Radiotherapy Session",
    technique: "VMAT Treatment",
    diagnosis: "Breast Cancer, Post-Surgery",
    room: "Linac Vault 1",
    doctorInCharge: "Dr. Kachi",
    totalVisits: 25,
    completedVisits: 14,
    remainingVisits: 11,
    nextVisitDate: "2026-10-27",
    nextVisitTime: "08:30 AM",
    pattern: "DAILY_WORKING_DAYS",
    startDate: "2026-10-07",
    projectedEndDate: "2026-11-10",
    status: "ACTIVE",
    hasRescheduleRequest: false,
    visits: createSeriesVisits("2026-10-07", 25, 14, "vis-01"),
  },
  {
    id: "cs-02",
    reference: "SCH-MLCC-085",
    patientId: "pat-02",
    patientName: "Emeka Okafor",
    patientMrn: "MRN-0882",
    patientPhone: "+234 802 345 6789",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    primaryService: "Radiotherapy Session",
    technique: "VMAT Treatment",
    diagnosis: "Breast Cancer (Left)",
    room: "Linac Vault 1",
    doctorInCharge: "Dr. Kachi",
    totalVisits: 20,
    completedVisits: 12,
    remainingVisits: 8,
    nextVisitDate: "2026-10-27",
    nextVisitTime: "09:00 AM",
    pattern: "DAILY_WORKING_DAYS",
    startDate: "2026-10-06",
    projectedEndDate: "2026-11-02",
    status: "ACTIVE",
    hasRescheduleRequest: true,
    rescheduleNotice: "Patient requested to move tomorrow's 09:00 AM visit to 11:30 AM due to interstate travel from Ibadan.",
    visits: Array.from({ length: 20 }, (_, i) => {
      const num = i + 1;
      let status: VisitStatus = "SCHEDULED";
      if (num <= 12) status = "COMPLETED";
      const day = String(6 + Math.floor(i * 1.4)).padStart(2, "0");
      return {
        id: `vis-02-${num}`,
        visitNumber: num,
        date: `2026-10-${day}`,
        timeSlot: num === 13 ? "11:30 AM" : "09:00 AM",
        serviceName: "Radiotherapy Session",
        room: "Linac Vault 1",
        status,
      };
    }),
  },
  {
    id: "cs-03",
    reference: "SCH-MKDC-042",
    patientId: "pat-03",
    patientName: "Hajiya Amina Datti",
    patientMrn: "MRN-1002",
    patientPhone: "+234 809 456 7890",
    centreCode: "MKDC",
    centreName: "MedServe Kano Diagnostic & Oncology Centre",
    primaryService: "Radiotherapy Session",
    technique: "3D-CRT Pelvis",
    diagnosis: "Cervical Oncology",
    room: "Linac Vault 1",
    doctorInCharge: "Dr. Amina Bello",
    totalVisits: 25,
    completedVisits: 8,
    remainingVisits: 17,
    nextVisitDate: "2026-10-27",
    nextVisitTime: "10:00 AM",
    pattern: "DAILY_WORKING_DAYS",
    startDate: "2026-10-12",
    projectedEndDate: "2026-11-16",
    status: "ACTIVE",
    hasRescheduleRequest: true,
    rescheduleNotice: "Patient feeling weak today. Requested shifting visit #9 to Wednesday Oct 28.",
    visits: Array.from({ length: 25 }, (_, i) => {
      const num = i + 1;
      let status: VisitStatus = "SCHEDULED";
      if (num <= 8) status = "COMPLETED";
      const day = String(12 + Math.floor(i * 1.3)).padStart(2, "0");
      return {
        id: `vis-03-${num}`,
        visitNumber: num,
        date: `2026-10-${day}`,
        timeSlot: "10:00 AM",
        serviceName: "Radiotherapy Session",
        room: "Linac Vault 1",
        status,
      };
    }),
  },
  {
    id: "cs-04",
    reference: "SCH-MUDC-029",
    patientId: "pat-04",
    patientName: "Grace Danjuma",
    patientMrn: "MRN-0763",
    patientPhone: "+234 802 890 1234",
    centreCode: "MUDC",
    centreName: "MedServe Abuja Diagnostics & Oncology",
    primaryService: "Radiotherapy Session",
    technique: "VMAT Brain Protocol",
    diagnosis: "Brain Oncology (Temporal)",
    room: "Varian Halcyon Vault",
    doctorInCharge: "Dr. Chukwudi",
    totalVisits: 30,
    completedVisits: 22,
    remainingVisits: 8,
    nextVisitDate: "2026-10-27",
    nextVisitTime: "11:15 AM",
    pattern: "DAILY_WORKING_DAYS",
    startDate: "2026-09-22",
    projectedEndDate: "2026-11-03",
    status: "ACTIVE",
    hasRescheduleRequest: false,
    visits: Array.from({ length: 30 }, (_, i) => {
      const num = i + 1;
      let status: VisitStatus = "SCHEDULED";
      if (num <= 22) status = "COMPLETED";
      const day = String(Math.min(30, 1 + i)).padStart(2, "0");
      return {
        id: `vis-04-${num}`,
        visitNumber: num,
        date: `2026-10-${day}`,
        timeSlot: "11:15 AM",
        serviceName: "Radiotherapy Session",
        room: "Varian Halcyon Vault",
        status,
      };
    }),
  },
  {
    id: "cs-05",
    reference: "SCH-MLCC-079",
    patientId: "pat-05",
    patientName: "Babatunde Fashina",
    patientMrn: "MRN-0619",
    patientPhone: "+234 803 777 9922",
    centreCode: "MLCC",
    centreName: "MedServe LUTH Cancer Centre (Lagos)",
    primaryService: "Radiotherapy Course",
    technique: "VMAT Protocol",
    diagnosis: "Prostate Oncology",
    room: "Linac Vault 1",
    doctorInCharge: "Dr. Kachi",
    totalVisits: 20,
    completedVisits: 20,
    remainingVisits: 0,
    nextVisitDate: "Completed",
    nextVisitTime: "-",
    pattern: "DAILY_WORKING_DAYS",
    startDate: "2026-09-15",
    projectedEndDate: "2026-10-14",
    status: "COMPLETED",
    hasRescheduleRequest: false,
    visits: Array.from({ length: 20 }, (_, i) => ({
      id: `vis-05-${i + 1}`,
      visitNumber: i + 1,
      date: `2026-09-${String(15 + i).padStart(2, "0")}`,
      timeSlot: "09:30 AM",
      serviceName: "Radiotherapy Session",
      room: "Linac Vault 1",
      status: "COMPLETED",
    })),
  },
  {
    id: "cs-06",
    reference: "SCH-MKDC-039",
    patientId: "pat-06",
    patientName: "Musa Garba",
    patientMrn: "MRN-1108",
    patientPhone: "+234 814 332 1099",
    centreCode: "MKDC",
    centreName: "MedServe Kano Diagnostic & Oncology Centre",
    primaryService: "Chemotherapy Infusion",
    technique: "R-CHOP Protocol",
    diagnosis: "Lymphoma",
    room: "Chemo Infusion Suite 2",
    doctorInCharge: "Dr. Amina Bello",
    totalVisits: 6,
    completedVisits: 4,
    remainingVisits: 2,
    nextVisitDate: "2026-11-04",
    nextVisitTime: "10:30 AM",
    pattern: "EVERY_N_WEEKS",
    startDate: "2026-08-10",
    projectedEndDate: "2026-11-23",
    status: "ACTIVE",
    hasRescheduleRequest: false,
    visits: [
      {
        id: "vis-06-1",
        visitNumber: 1,
        date: "2026-08-10",
        timeSlot: "10:30 AM",
        serviceName: "Chemotherapy Infusion",
        room: "Chemo Infusion Suite 2",
        status: "COMPLETED",
      },
      {
        id: "vis-06-2",
        visitNumber: 2,
        date: "2026-08-31",
        timeSlot: "10:30 AM",
        serviceName: "Chemotherapy Infusion",
        room: "Chemo Infusion Suite 2",
        status: "COMPLETED",
      },
      {
        id: "vis-06-3",
        visitNumber: 3,
        date: "2026-09-21",
        timeSlot: "10:30 AM",
        serviceName: "Chemotherapy Infusion",
        room: "Chemo Infusion Suite 2",
        status: "COMPLETED",
      },
      {
        id: "vis-06-4",
        visitNumber: 4,
        date: "2026-10-12",
        timeSlot: "10:30 AM",
        serviceName: "Chemotherapy Infusion",
        room: "Chemo Infusion Suite 2",
        status: "COMPLETED",
      },
      {
        id: "vis-06-5",
        visitNumber: 5,
        date: "2026-11-02",
        timeSlot: "10:30 AM",
        serviceName: "Chemotherapy Infusion",
        room: "Chemo Infusion Suite 2",
        status: "SCHEDULED",
      },
      {
        id: "vis-06-6",
        visitNumber: 6,
        date: "2026-11-23",
        timeSlot: "10:30 AM",
        serviceName: "Chemotherapy Infusion",
        room: "Chemo Infusion Suite 2",
        status: "SCHEDULED",
      },
    ],
  },
];

// Alias for backwards compatibility if needed
export type CareSeries = PatientCareSchedule;
export type FractionSession = PatientVisit;
export const CARE_SERIES_LIST = PATIENT_SCHEDULES;
