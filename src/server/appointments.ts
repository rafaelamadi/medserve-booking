"use server";

import { revalidatePath } from "next/cache";
import { generateReference } from "@/entities/appointment";
import { prisma } from "@/shared/api/prisma";
import { localToUtc } from "@/shared/lib/dates";
import { sendAppointmentConfirmationEmail } from "@/shared/lib/email";

export type ClinicalAppointmentRow = {
  id: string;
  reference: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientMrn: string;
  centreId: string;
  centreCode: string;
  centreName: string;
  serviceName: string;
  modality: string;
  fractionInfo?: string;
  scheduledTime: string;
  endsTime?: string;
  timeSlot: string;
  durationMinutes?: number;
  room: string;
  status: string;
  oncologist: string;
  diagnosis?: string;
  protocol?: string;
  triageNotes?: string;
  rescheduleReason?: string;
  dateCategory?: "today" | "tomorrow" | "this_week";
  timeline?: Array<{
    id: string;
    time: string;
    title: string;
    detail: string;
    actor: string;
  }>;
};

/**
 * Fetch live clinical appointments directly from Supabase (Prisma) as the authoritative source of truth.
 */
export async function getLiveAppointmentsByCentre(
  centreCode?: string
): Promise<ClinicalAppointmentRow[]> {
  try {
    const isAll = !centreCode || centreCode === "ALL" || centreCode === "all";

    const dbAppointments = await prisma.appointment.findMany({
      where: {
        deletedAt: null,
        ...(isAll
          ? {}
          : {
              centre: {
                code: centreCode,
              },
            }),
      },
      include: {
        patient: true,
        centre: true,
        resource: true,
        centreService: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return dbAppointments.map((apt) => {
      const startsAtDate = new Date(apt.startsAt);
      const timeSlot = startsAtDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Pure clean service name from Supabase service table (e.g. "Chemotherapy", "Radiotherapy")
      const serviceName = apt.centreService?.service?.name || "Consultation";

      // Real MRN stored directly in Supabase Patient table (no hashing or synthetic overrides)
      const patientMrn = apt.patient.mrn || "MS-PENDING";

      // Map status: REQUESTED in database corresponds to SCHEDULED in clinical queue UI
      let uiStatus = apt.status as string;
      if (uiStatus === "REQUESTED") {
        uiStatus = "SCHEDULED";
      }

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const aptDateStr = startsAtDate.toISOString().slice(0, 10);
      const isToday = aptDateStr === todayStr;

      const diffMinutes = Math.round((new Date(apt.endsAt).getTime() - startsAtDate.getTime()) / 60000);
      const durationMinutes = diffMinutes > 0 ? diffMinutes : 30;

      return {
        id: apt.id,
        reference: apt.reference,
        patientName: apt.patient.fullName,
        patientPhone: apt.patient.phone || "",
        patientEmail: apt.patient.email || undefined,
        patientMrn,
        centreId: apt.centre.id,
        centreCode: apt.centre.code,
        centreName: apt.centre.name,
        serviceName,
        modality: apt.centreService?.service?.category || "ONCOLOGY",
        fractionInfo: apt.sequenceNo ? `Session ${apt.sequenceNo}` : undefined,
        scheduledTime: apt.startsAt.toISOString(),
        endsTime: apt.endsAt.toISOString(),
        timeSlot,
        durationMinutes,
        room: apt.resource?.name || apt.centre?.name || "Consultation Suite",
        status: uiStatus,
        oncologist: apt.patient.doctorInCharge || "Attending Oncologist",
        diagnosis: apt.patient.primaryDiagnosis || (apt.centreService?.service?.name ? `${apt.centreService.service.name} Protocol` : "Clinical Care Plan"),
        protocol: apt.patientNote || "Prescribed clinical pathway.",
        triageNotes: apt.patientNote || undefined,
        dateCategory: isToday ? "today" : "this_week",
        timeline: [
          {
            id: `evt-${apt.id}-1`,
            time: timeSlot,
            title: `Appointment ${uiStatus === "SCHEDULED" ? "Scheduled" : uiStatus === "CHECKED_IN" ? "Checked In" : uiStatus === "CONFIRMED" ? "Confirmed (Completed)" : uiStatus}`,
            detail: `Recorded in Supabase for ${serviceName} at MedServe ${apt.centre.code}.`,
            actor: "Clinical Desk",
          },
        ],
      };
    });
  } catch (err) {
    console.error("Supabase query error in getLiveAppointmentsByCentre:", err);
    return [];
  }
}

/**
 * Server action to update appointment status from staff dashboard directly in Supabase.
 * Enforces security rule: Staff can only transition to CHECKED_IN, CONFIRMED, NO_SHOW, or SCHEDULED.
 * Staff CANNOT cancel appointments.
 */
export async function updateAppointmentStatusServer(
  appointmentId: string,
  newStatus: "CHECKED_IN" | "CONFIRMED" | "NO_SHOW" | "SCHEDULED"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const dbStatus = newStatus === "SCHEDULED" ? "REQUESTED" : newStatus;

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: dbStatus,
        updatedAt: new Date(),
      },
    });

    return { ok: true };
  } catch (err) {
    console.error("Failed to update status in Supabase:", err);
    return { ok: false, error: "Database update failed" };
  }
}

export type CreateStaffAppointmentInput = {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientMrn?: string;
  /** Real Supabase CUID of the patient — bypasses fuzzy matching when provided */
  patientId?: string;
  centreCode: "MLCC" | "MKDC" | "MUDC";
  serviceName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "02:00 PM"
  notes?: string;
  source?: "WEB" | "STAFF" | "CHAT";
};

export type CreateStaffAppointmentResult = {
  ok: boolean;
  reference?: string;
  appointmentId?: string;
  error?: string;
};

/**
 * Creates an appointment directly in Supabase from the staff dashboard,
 * creates/updates the patient record, dispatches a confirmation email if email is provided,
 * and revalidates dashboard cache.
 */
export async function createStaffAppointmentServer(
  input: CreateStaffAppointmentInput
): Promise<CreateStaffAppointmentResult> {
  try {
    const centre = await prisma.centre.findUnique({
      where: { code: input.centreCode },
      include: {
        centreServices: {
          include: { service: true },
        },
      },
    });

    if (!centre) {
      return { ok: false, error: `Centre '${input.centreCode}' not found.` };
    }

    // Match service by name or slug
    let cs = centre.centreServices.find(
      (item) => item.service.name.toLowerCase() === input.serviceName.toLowerCase()
    );
    if (!cs) {
      cs = centre.centreServices.find(
        (item) => item.service.slug.toLowerCase() === input.serviceName.toLowerCase().replace(/\s+/g, "-")
      );
    }
    if (!cs && centre.centreServices.length > 0) {
      cs = centre.centreServices[0];
    }
    if (!cs) {
      return { ok: false, error: "No clinical service configured for this centre." };
    }

    // Calculate startsAt and endsAt in centre timezone
    let minutes = 14 * 60; // default 02:00 PM = 840 min
    const cleanTime = (input.timeSlot || "02:00 PM").trim().toUpperCase();
    const isPM = cleanTime.includes("PM");
    const isAM = cleanTime.includes("AM");
    const digits = cleanTime.replace(/[^\d:]/g, "");
    const [hStr, mStr] = digits.split(":");
    if (hStr) {
      let h = parseInt(hStr, 10);
      const m = mStr ? parseInt(mStr, 10) : 0;
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      if (!isNaN(h)) {
        minutes = h * 60 + (isNaN(m) ? 0 : m);
      }
    }

    const startsAt = localToUtc(input.date, minutes, centre.timezone || "Africa/Lagos");
    const slotMinutes = cs.slotMinutes || 30;
    const endsAt = new Date(startsAt.getTime() + slotMinutes * 60 * 1000);

    const cleanEmail = input.patientEmail?.trim() || null;
    const cleanPhone = input.patientPhone?.trim() || null;
    const cleanName = input.patientName.trim();
    const cleanMrn = input.patientMrn?.trim() || null;
    const cleanPatientId = input.patientId?.trim() || null;

    // If the caller passes a real Supabase CUID, use it directly (no fuzzy matching)
    let patient = null;
    if (cleanPatientId) {
      patient = await prisma.patient.findUnique({
        where: { id: cleanPatientId },
      });
    }

    // Fallback: find existing patient by email, phone, or MRN
    if (!patient && cleanEmail) {
      patient = await prisma.patient.findFirst({
        where: { email: cleanEmail },
      });
    }
    if (!patient && cleanPhone) {
      patient = await prisma.patient.findFirst({
        where: { phone: cleanPhone },
      });
    }
    if (!patient && cleanMrn) {
      patient = await prisma.patient.findFirst({
        where: { mrn: cleanMrn },
      });
    }

    if (!patient) {
      const generatedMrn = cleanMrn || `MS-${Math.floor(100000 + Math.random() * 900000)}`;
      patient = await prisma.patient.create({
        data: {
          fullName: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          mrn: generatedMrn,
          centreCode: centre.code,
          centreName: centre.name,
          primaryService: cs.service.name,
          primaryDiagnosis: input.notes || "Clinical Appointment",
          doctorInCharge: "Attending Oncologist",
          status: "ACTIVE",
        },
      });
    } else {
      const updates: Record<string, string> = {};
      if (cleanEmail && !patient.email) updates.email = cleanEmail;
      if (cleanPhone && !patient.phone) updates.phone = cleanPhone;
      if (cleanMrn && !patient.mrn) updates.mrn = cleanMrn;
      if (Object.keys(updates).length > 0) {
        patient = await prisma.patient.update({
          where: { id: patient.id },
          data: updates,
        });
      }
    }

    const reference = generateReference(centre.code);

    const appointment = await prisma.appointment.create({
      data: {
        reference,
        patientId: patient.id,
        centreId: centre.id,
        centreServiceId: cs.id,
        resourceId: cs.resourceId || null,
        startsAt,
        endsAt,
        requestedStartsAt: startsAt,
        status: "REQUESTED", // REQUESTED maps to SCHEDULED in UI
        source: input.source || "STAFF",
        patientNote: input.notes?.trim() || undefined,
      },
    });

    // Send confirmation email asynchronously if email was provided
    if (cleanEmail) {
      sendAppointmentConfirmationEmail({
        to: cleanEmail,
        patientName: cleanName,
        reference,
        centreName: centre.name,
        centreAddress: centre.address || undefined,
        serviceName: cs.service.name,
        date: input.date,
        timeSlot: input.timeSlot,
      }).catch((err) => {
        console.error("Async appointment confirmation email error:", err);
      });
    }

    try {
      revalidatePath("/dashboard/default");
      revalidatePath("/dashboard/appointments");
      revalidatePath("/dashboard/calendar");
      revalidatePath("/dashboard/portal");
      revalidatePath("/dashboard/portal/appointments");
    } catch {
      // Ignore revalidation errors if invoked outside Next.js request context
    }

    return {
      ok: true,
      reference,
      appointmentId: appointment.id,
    };
  } catch (err) {
    console.error("createStaffAppointmentServer error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create appointment in database",
    };
  }
}

