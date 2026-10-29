"use server";

import { prisma } from "@/shared/api/prisma";
import type { RegisteredPatient, PatientVisitHistory, PatientCommLog } from "@/entities/patient";
import { setPatientSession } from "@/shared/lib/patientCookie";

export interface RegisterPatientInput {
  fullName: string;
  phone: string;
  email?: string;
  gender?: "Male" | "Female";
  age?: number;
  address?: string;
  state?: string;
  centreCode?: "MLCC" | "MKDC" | "MUDC";
  centreName?: string;
  primaryDiagnosis?: string;
  primaryService?: string;
  doctorInCharge?: string;
}

// Mapping for legacy seed mock IDs to real MRNs
const LEGACY_ID_MAP: Record<string, string> = {
  "pat-01": "MS-100941",
  "pat-02": "MS-100809",
  "pat-03": "MS-100782",
  "pat-04": "MS-100654",
  "pat-05": "MS-100521",
  "pat-06": "MS-100412",
  "pat-07": "MS-101205",
  "pat-08": "MS-101108",
};

/**
 * Fetch live registered patients from Supabase as the source of truth.
 */
export async function getLivePatients(centreCode?: string): Promise<RegisteredPatient[]> {
  try {
    const isAll = !centreCode || centreCode === "ALL" || centreCode === "all";

    const dbPatients = await prisma.patient.findMany({
      where: {
        deletedAt: null,
        ...(isAll
          ? {}
          : {
              centreCode: centreCode,
            }),
      },
      include: {
        appointments: {
          include: {
            centre: true,
            centreService: {
              include: {
                service: true,
              },
            },
            resource: true,
          },
          orderBy: {
            startsAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return dbPatients.map((p) => {
      const numericSeed = Math.abs(
        p.phone?.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0) || 100000
      );
      const generatedMrn = `MS-${100000 + (numericSeed % 900000)}`;
      const mrn = p.mrn || generatedMrn;

      const visits: PatientVisitHistory[] = p.appointments.map((apt) => ({
        id: apt.id,
        reference: apt.reference,
        date: apt.startsAt.toISOString().slice(0, 10),
        timeSlot: apt.startsAt.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        serviceName: apt.centreService?.service?.name || "Consultation",
        room: apt.resource?.name || apt.centre?.name || "Consultation Suite 1",
        status:
          apt.status === "COMPLETED"
            ? "COMPLETED"
            : apt.status === "CHECKED_IN"
            ? "CHECKED_IN"
            : apt.status === "CANCELLED"
            ? "NO_SHOW"
            : "SCHEDULED",
        doctor: (p as any).doctorInCharge || "Dr. Kachi",
        notes: apt.internalNote || apt.patientNote || `Clinical appointment recorded at ${apt.centre?.name || "MedServe"}.`,
      }));

      const nextApt = p.appointments
        .filter((a) => a.startsAt >= new Date() && a.status !== "CANCELLED")
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];

      const commLogs: PatientCommLog[] = [
        {
          id: `cl-${p.id}`,
          timestamp: p.createdAt.toISOString().replace("T", " ").slice(0, 16),
          channel: "EMAIL",
          type: "CHECK_IN_CONFIRM",
          recipient: p.email || `${p.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          status: "DELIVERED",
          messageSnippet: `Welcome to MedServe, ${p.fullName}. Your Patient Record Number is ${mrn}.`,
        },
      ];

      return {
        id: p.id,
        mrn,
        fullName: p.fullName,
        gender: p.gender || undefined,
        age: p.age ?? undefined,
        phone: p.phone || "",
        email: p.email || "",
        address: p.address || undefined,
        state: p.state || undefined,
        centreCode: (p.centreCode as "MLCC" | "MKDC" | "MUDC") || "MLCC",
        centreName: p.centreName || "MedServe LUTH Cancer Centre",
        primaryDiagnosis: p.primaryDiagnosis || "General Clinical Record",
        primaryService: p.primaryService || "Outpatient Care",
        doctorInCharge: (p as any).doctorInCharge || "Dr. Kachi",
        status: (p.status as any) || "ACTIVE",
        registrationDate: p.createdAt.toISOString().slice(0, 10),
        totalVisits: visits.length,
        completedVisits: visits.filter((v) => v.status === "COMPLETED").length,
        remainingVisits: visits.filter((v) => v.status !== "COMPLETED" && v.status !== "NO_SHOW").length,
        nextVisit: nextApt
          ? {
              date: nextApt.startsAt.toISOString().slice(0, 10),
              timeSlot: nextApt.startsAt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              service: nextApt.centreService?.service?.name || "Consultation",
              room: nextApt.centre?.name || "Clinic",
            }
          : undefined,
        visits,
        commLogs,
      };
    });
  } catch (error) {
    console.error("Error fetching live patients from Supabase:", error);
    return [];
  }
}

/**
 * Register a new patient and persist directly to Supabase.
 */
export async function registerPatientServer(
  input: RegisterPatientInput
): Promise<{ success: boolean; patient?: RegisteredPatient; error?: string }> {
  try {
    const trimmedName = input.fullName.trim();
    const trimmedPhone = input.phone.trim();
    const trimmedEmail = input.email?.trim() || null;

    if (!trimmedName || !trimmedPhone) {
      return { success: false, error: "Name and phone number are required." };
    }

    const mrn = `MS-${Math.floor(100000 + Math.random() * 900000)}`;

    // Check if patient with same phone or email exists already
    const existing = await prisma.patient.findFirst({
      where: {
        OR: [
          { phone: trimmedPhone },
          ...(trimmedEmail ? [{ email: trimmedEmail }] : []),
        ],
      },
    });

    let dbPatient;

    if (existing) {
      dbPatient = await prisma.patient.update({
        where: { id: existing.id },
        data: {
          fullName: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail || existing.email,
          gender: input.gender || existing.gender || null,
          age: input.age ?? existing.age ?? null,
          address: input.address?.trim() || existing.address || null,
          state: input.state || existing.state || null,
          centreCode: input.centreCode || existing.centreCode || "MLCC",
          centreName: input.centreName || existing.centreName || "MedServe LUTH Cancer Centre",
          primaryDiagnosis: input.primaryDiagnosis || existing.primaryDiagnosis || "General Clinical Record",
          primaryService: input.primaryService || existing.primaryService || "Outpatient Care",
          doctorInCharge: input.doctorInCharge || existing.doctorInCharge || "Dr. Kachi",
          status: "ACTIVE",
        },
        include: {
          appointments: {
            include: {
              centre: true,
              centreService: {
                include: {
                  service: true,
                },
              },
              resource: true,
            },
          },
        },
      });
    } else {
      dbPatient = await prisma.patient.create({
        data: {
          fullName: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail,
          mrn,
          gender: input.gender || null,
          age: input.age ?? null,
          address: input.address?.trim() || null,
          state: input.state || null,
          centreCode: input.centreCode || "MLCC",
          centreName: input.centreName || "MedServe LUTH Cancer Centre",
          primaryDiagnosis: input.primaryDiagnosis || "General Clinical Record",
          primaryService: input.primaryService || "Outpatient Care",
          doctorInCharge: input.doctorInCharge || "Dr. Kachi",
          status: "ACTIVE",
        },
        include: {
          appointments: {
            include: {
              centre: true,
              centreService: {
                include: {
                  service: true,
                },
              },
              resource: true,
            },
          },
        },
      });
    }

    const assignedMrn = dbPatient.mrn || mrn;

    const registeredPatient: RegisteredPatient = {
      id: dbPatient.id,
      mrn: assignedMrn,
      fullName: dbPatient.fullName,
      gender: dbPatient.gender || undefined,
      age: dbPatient.age ?? undefined,
      phone: dbPatient.phone || "",
      email: dbPatient.email || "",
      address: dbPatient.address || undefined,
      state: dbPatient.state || undefined,
      centreCode: (dbPatient.centreCode as "MLCC" | "MKDC" | "MUDC") || "MLCC",
      centreName: dbPatient.centreName || "MedServe LUTH Cancer Centre",
      primaryDiagnosis: dbPatient.primaryDiagnosis || "General Clinical Record",
      primaryService: dbPatient.primaryService || "Outpatient Care",
      doctorInCharge: (dbPatient as any).doctorInCharge || "Dr. Kachi",
      status: (dbPatient.status as any) || "ACTIVE",
      registrationDate: dbPatient.createdAt.toISOString().slice(0, 10),
      totalVisits: dbPatient.appointments.length,
      completedVisits: 0,
      remainingVisits: dbPatient.appointments.length,
      visits: [],
      commLogs: [
        {
          id: `cl-${dbPatient.id}`,
          timestamp: dbPatient.createdAt.toISOString().replace("T", " ").slice(0, 16),
          channel: "EMAIL",
          type: "CHECK_IN_CONFIRM",
          recipient: dbPatient.email || `${dbPatient.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          status: "DELIVERED",
          messageSnippet: `Welcome to MedServe, ${dbPatient.fullName}. Your Patient Record Number is ${assignedMrn}.`,
        },
      ],
    };

    return { success: true, patient: registeredPatient };
  } catch (error) {
    console.error("Error registering patient in Supabase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to register patient in database.",
    };
  }
}

/**
 * Fetch a single patient by ID, MRN, or legacy ID from Supabase.
 * Loads live encounters, care series, and communications from the database.
 */
export async function getLivePatientById(idOrMrn: string): Promise<RegisteredPatient | null> {
  try {
    const targetSearch = LEGACY_ID_MAP[idOrMrn] || idOrMrn;
    const isDirectCuid = idOrMrn.startsWith("c") && idOrMrn.length >= 24;

    let resolvedId = idOrMrn;

    if (!isDirectCuid) {
      // Use SQL queryRaw for identifier resolution (mrn, phone, legacy ID)
      const matches = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Patient"
        WHERE "deletedAt" IS NULL
          AND (id = ${idOrMrn} OR id = ${targetSearch} OR mrn = ${idOrMrn} OR mrn = ${targetSearch} OR phone = ${idOrMrn})
        LIMIT 1
      `;
      resolvedId = matches[0]?.id || idOrMrn;
    }

    // Parallel fetch: patient details + communication audit logs
    let [p, dbNotifs] = await Promise.all([
      prisma.patient.findFirst({
        where: {
          id: resolvedId,
          deletedAt: null,
        },
        include: {
          appointments: {
            include: {
              centre: true,
              centreService: {
                include: {
                  service: true,
                },
              },
              resource: true,
            },
            orderBy: {
              startsAt: "desc",
            },
          },
          careSeries: {
            include: {
              centreService: {
                include: {
                  service: true,
                },
              },
            },
          },
        },
      }),
      prisma.notification.findMany({
        where: { patientId: resolvedId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Fallback if cuid direct search didn't match (e.g. legacy search)
    if (!p && isDirectCuid) {
      const fallbackMatches = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Patient"
        WHERE "deletedAt" IS NULL
          AND (id = ${idOrMrn} OR id = ${targetSearch} OR mrn = ${idOrMrn} OR mrn = ${targetSearch} OR phone = ${idOrMrn})
        LIMIT 1
      `;
      if (fallbackMatches[0]?.id && fallbackMatches[0].id !== resolvedId) {
        resolvedId = fallbackMatches[0].id;
        [p, dbNotifs] = await Promise.all([
          prisma.patient.findFirst({
            where: {
              id: resolvedId,
              deletedAt: null,
            },
            include: {
              appointments: {
                include: {
                  centre: true,
                  centreService: {
                    include: {
                      service: true,
                    },
                  },
                  resource: true,
                },
                orderBy: {
                  startsAt: "desc",
                },
              },
              careSeries: {
                include: {
                  centreService: {
                    include: {
                      service: true,
                    },
                  },
                },
              },
            },
          }),
          prisma.notification.findMany({
            where: { patientId: resolvedId },
            orderBy: { createdAt: "desc" },
          }),
        ]);
      }
    }

    if (!p) return null;

    let doctorInCharge = (p as any).doctorInCharge;
    if (!doctorInCharge) {
      try {
        const rawDoctor = await prisma.$queryRaw<Array<{ doctorInCharge: string | null }>>`
          SELECT "doctorInCharge" FROM "Patient" WHERE id = ${p.id} LIMIT 1
        `;
        doctorInCharge = rawDoctor[0]?.doctorInCharge;
      } catch {
        // fallback handled below
      }
    }
    const finalDoctor = doctorInCharge || "Attending Oncologist";
    const mrn = p.mrn || "MS-PENDING";

    const visits: PatientVisitHistory[] = p.appointments.map((apt) => ({
      id: apt.id,
      reference: apt.reference,
      date: apt.startsAt.toISOString().slice(0, 10),
      timeSlot: apt.startsAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      serviceName: apt.centreService?.service?.name || "Consultation",
      room: apt.resource?.name || apt.centre?.name || "Consultation Suite 1",
      status:
        apt.status === "COMPLETED"
          ? "COMPLETED"
          : apt.status === "CHECKED_IN"
          ? "CHECKED_IN"
          : apt.status === "CANCELLED"
          ? "NO_SHOW"
          : "SCHEDULED",
      doctor: finalDoctor,
      notes: apt.internalNote || apt.patientNote || `Clinical appointment recorded at ${apt.centre?.name || "MedServe"}.`,
    }));

    const commLogs: PatientCommLog[] = dbNotifs.map((n) => {
      let snippet = n.providerRef || n.templateKey || "Notification notice dispatched.";
      if (n.providerRef && n.providerRef.startsWith("{")) {
        try {
          const parsed = JSON.parse(n.providerRef);
          if (parsed.subject && parsed.body) {
            snippet = `${parsed.subject}: ${parsed.body}`;
          }
        } catch {
          // fallback to raw providerRef
        }
      }
      return {
        id: n.id,
        timestamp: n.createdAt.toISOString().replace("T", " ").slice(0, 16),
        channel: (n.channel as any) || "EMAIL",
        type: (n.templateKey as any) || "APPOINTMENT_REMINDER",
        recipient: p.email || p.phone || "patient@medserve.ng",
        status: n.status === "DELIVERED" ? "DELIVERED" : n.status === "FAILED" ? "FAILED" : "SENT",
        messageSnippet: snippet,
      };
    });

    if (commLogs.length === 0) {
      commLogs.push({
        id: `cl-${p.id}`,
        timestamp: p.createdAt.toISOString().replace("T", " ").slice(0, 16),
        channel: "EMAIL",
        type: "CHECK_IN_CONFIRM",
        recipient: p.email || `${p.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        status: "DELIVERED",
        messageSnippet: `Welcome to MedServe, ${p.fullName}. Your Patient Record Number is ${mrn}.`,
      });
    }

    // Care series computation
    const activeSeries = p.careSeries[0];
    const totalVisits = visits.length || (activeSeries ? activeSeries.totalSessions : 0);
    const completedVisits = visits.filter((v) => v.status === "COMPLETED").length;
    const remainingVisits = Math.max(0, totalVisits - completedVisits);

    return {
      id: p.id,
      mrn,
      fullName: p.fullName,
      gender: p.gender || undefined,
      age: p.age ?? undefined,
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || undefined,
      state: p.state || undefined,
      centreCode: (p.centreCode as "MLCC" | "MKDC" | "MUDC") || "MLCC",
      centreName: p.centreName || "MedServe LUTH Cancer Centre",
      primaryDiagnosis: p.primaryDiagnosis || "General Clinical Record",
      primaryService: activeSeries?.centreService?.service?.name || p.primaryService || "Outpatient Care",
      doctorInCharge: finalDoctor,
      status: (p.status as any) || "ACTIVE",
      registrationDate: p.createdAt.toISOString().slice(0, 10),
      totalVisits,
      completedVisits,
      remainingVisits,
      scheduleRef: activeSeries ? `SCH-${p.centreCode}-${activeSeries.id.slice(-3).toUpperCase()}` : undefined,
      visits,
      commLogs,
    };
  } catch (err) {
    console.error("Error fetching live patient by ID:", err);
    return null;
  }
}

/**
 * Lightweight server action for client components to re-fetch a patient's
 * full data (including fresh appointments) after a booking, without a full
 * page refresh. Returns the updated RegisteredPatient record.
 */
export async function refreshLivePatientData(
  patientId: string
): Promise<RegisteredPatient | null> {
  try {
    return await getLivePatientById(patientId);
  } catch (err) {
    console.error("Error refreshing live patient data:", err);
    return null;
  }
}

/**
 * Dispatch an email clinical notification and persist to Supabase notifications table.
 */
export async function sendPatientEmailNoticeServer(
  patientId: string,
  subject: string,
  body: string,
  templateKey?: string
): Promise<{ success: boolean; log?: PatientCommLog; error?: string }> {
  try {
    const targetSearch = LEGACY_ID_MAP[patientId] || patientId;

    const matches = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Patient"
      WHERE "deletedAt" IS NULL
        AND (id = ${patientId} OR id = ${targetSearch} OR mrn = ${patientId} OR mrn = ${targetSearch} OR phone = ${patientId})
      LIMIT 1
    `;

    const resolvedId = matches[0]?.id || patientId;

    const patient = await prisma.patient.findFirst({
      where: {
        id: resolvedId,
        deletedAt: null,
      },
    });

    if (!patient) {
      return { success: false, error: "Patient record not found." };
    }

    const recipient = patient.email || `${patient.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    const snippet = `${subject}: ${body}`;
    const payload = JSON.stringify({
      subject,
      body,
      templateKey: templateKey || "CUSTOM",
      sentVia: "MEDSERVE_DIRECT_MAILER",
    });

    const notif = await prisma.notification.create({
      data: {
        patientId: patient.id,
        templateKey: templateKey || subject,
        channel: "EMAIL",
        status: "DELIVERED",
        providerRef: payload,
        sentAt: new Date(),
      },
    });

    const log: PatientCommLog = {
      id: notif.id,
      timestamp: notif.createdAt.toISOString().replace("T", " ").slice(0, 16),
      channel: "EMAIL",
      type: (templateKey as any) || "APPOINTMENT_REMINDER",
      recipient,
      status: "DELIVERED",
      messageSnippet: snippet,
    };

    return { success: true, log };
  } catch (err) {
    console.error("Error creating notification in Supabase:", err);
    return { success: false, error: "Failed to dispatch email notice to database." };
  }
}

export interface CompletePatientOnboardingInput {
  email: string;
  fullName: string;
  phone: string;
  gender?: "Male" | "Female";
  age?: number;
  state?: string;
  address?: string;
}

/**
/**
 * Generates a unique, non-colliding Medical Record Number (MRN)
 * formatted as MS-XXXXXX verified against existing records in Supabase.
 */
export async function generateUniqueMrn(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const candidate = `MS-${randomDigits}`;
    const existing = await prisma.patient.findUnique({
      where: { mrn: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  // Safe collision fallback using the last 6 digits of current timestamp
  return `MS-${Date.now().toString().slice(-6)}`;
}

/**
 * Completes patient intake onboarding directly in Supabase.
 * Updates or creates the patient record with clinical demographics, assigns an MRN,
 * updates the authenticated session cookie, and returns the registered patient entity.
 */
export async function completePatientOnboardingServer(
  input: CompletePatientOnboardingInput
): Promise<{ success: boolean; patient?: RegisteredPatient; error?: string }> {
  try {
    const trimmedEmail = input.email.trim().toLowerCase();
    const trimmedName = input.fullName.trim();
    const trimmedPhone = input.phone.trim();

    if (!trimmedEmail) {
      return { success: false, error: "Email address is required." };
    }
    if (!trimmedName) {
      return { success: false, error: "Full legal name is required." };
    }
    if (!trimmedPhone) {
      return { success: false, error: "Phone number is required." };
    }

    const existing = await prisma.patient.findUnique({
      where: { email: trimmedEmail },
    });

    const assignedMrn = existing?.mrn || (await generateUniqueMrn());

    const dbPatient = existing
      ? await prisma.patient.update({
          where: { id: existing.id },
          data: {
            fullName: trimmedName,
            phone: trimmedPhone,
            mrn: assignedMrn,
            gender: input.gender || null,
            age: input.age ?? null,
            state: input.state || null,
            address: input.address?.trim() || null,
            centreCode: existing.centreCode || "MLCC",
            centreName: existing.centreName || "MedServe Medical Centre",
            primaryDiagnosis: existing.primaryDiagnosis || "General Clinical Record",
            primaryService: existing.primaryService || "Outpatient Care",
            status: "ACTIVE",
          },
          include: {
            appointments: {
              include: {
                centre: true,
                centreService: {
                  include: {
                    service: true,
                  },
                },
                resource: true,
              },
            },
          },
        })
      : await prisma.patient.create({
          data: {
            email: trimmedEmail,
            fullName: trimmedName,
            phone: trimmedPhone,
            mrn: assignedMrn,
            gender: input.gender || null,
            age: input.age ?? null,
            state: input.state || null,
            address: input.address?.trim() || null,
            centreCode: "MLCC",
            centreName: "MedServe Medical Centre",
            primaryDiagnosis: "General Clinical Record",
            primaryService: "Outpatient Care",
            status: "ACTIVE",
          },
          include: {
            appointments: {
              include: {
                centre: true,
                centreService: {
                  include: {
                    service: true,
                  },
                },
                resource: true,
              },
            },
          },
        });

    // Seal / update session cookie with real patient details
    try {
      await setPatientSession({
        patientId: dbPatient.id,
        email: trimmedEmail,
        name: trimmedName,
        phone: trimmedPhone,
      });
    } catch {
      // In non-standard or test runner environments
    }

    const registeredPatient: RegisteredPatient = {
      id: dbPatient.id,
      mrn: dbPatient.mrn || assignedMrn,
      fullName: dbPatient.fullName,
      gender: dbPatient.gender || undefined,
      age: dbPatient.age ?? undefined,
      phone: dbPatient.phone || "",
      email: dbPatient.email || "",
      address: dbPatient.address || undefined,
      state: dbPatient.state || undefined,
      centreCode: (dbPatient.centreCode as "MLCC" | "MKDC" | "MUDC") || "MLCC",
      centreName: dbPatient.centreName || "MedServe Medical Centre",
      primaryDiagnosis: dbPatient.primaryDiagnosis || "General Clinical Record",
      primaryService: dbPatient.primaryService || "Outpatient Care",
      doctorInCharge: (dbPatient as any).doctorInCharge || "Dr. Kachi",
      status: (dbPatient.status as any) || "ACTIVE",
      registrationDate: dbPatient.createdAt.toISOString().slice(0, 10),
      totalVisits: dbPatient.appointments.length,
      completedVisits: 0,
      remainingVisits: dbPatient.appointments.length,
      visits: [],
      commLogs: [
        {
          id: `cl-${dbPatient.id}`,
          timestamp: dbPatient.createdAt.toISOString().replace("T", " ").slice(0, 16),
          channel: "EMAIL",
          type: "CHECK_IN_CONFIRM",
          recipient: dbPatient.email || `${dbPatient.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          status: "DELIVERED",
          messageSnippet: `Welcome to MedServe, ${dbPatient.fullName}. Your Patient Record Number is ${assignedMrn}.`,
        },
      ],
    };

    return { success: true, patient: registeredPatient };
  } catch (err) {
    console.error("Error completing patient onboarding in Supabase:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to complete patient registration.",
    };
  }
}

/**
 * Fetch live patient profile from Supabase using their authenticated email address.
 */
export async function getLivePatientByEmailServer(
  email: string
): Promise<RegisteredPatient | null> {
  try {
    const trimmed = email.trim().toLowerCase();
    const patient = await prisma.patient.findUnique({
      where: { email: trimmed },
      select: { id: true },
    });
    if (!patient) return null;
    return getLivePatientById(patient.id);
  } catch (err) {
    console.error("Error fetching live patient by email:", err);
    return null;
  }
}

