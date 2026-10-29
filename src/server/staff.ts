"use server";

import { prisma } from "@/shared/api/prisma";
import type { StaffHubUser } from "@/entities/centre/model/settings";
import { STAFF_HUB_USERS_DATA } from "@/entities/centre/model/settings";
import { sendStaffInviteEmail } from "@/shared/lib/email";
import { revalidatePath } from "next/cache";

export interface EnrollStaffInput {
  fullName: string;
  email: string;
  phone: string;
  role: StaffHubUser["role"];
  primaryCentre: "MLCC" | "MKDC" | "MUDC";
}

const ROLE_LABELS: Record<StaffHubUser["role"], string> = {
  CLINICIAN: "Clinician / Attending Physician",
  CENTRE_MANAGER: "Centre Manager",
  STAFF: "Clinical & Facility Staff",
  SUPER_ADMIN: "System Administrator",
  VIEWER: "Read-Only Viewer",
};

const CENTRE_NAMES: Record<string, string> = {
  MLCC: "MedServe LUTH Cancer Centre (Lagos)",
  MKDC: "MedServe Kano Diagnostic Centre",
  MUDC: "MedServe Umuahia Diagnostic Centre",
};

/**
 * Fetch live staff accounts from Supabase StaffUser and StaffCentre relations.
 */
export async function getLiveStaffUsers(): Promise<StaffHubUser[]> {
  try {
    const dbStaff = await prisma.staffUser.findMany({
      include: {
        centres: {
          include: {
            centre: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const dbStaffMapped: StaffHubUser[] = dbStaff.map((s) => {
      const primaryCentreCode = (s.centres[0]?.centre?.code as "MLCC" | "MKDC" | "MUDC") || "MLCC";
      const numericSeed = Math.abs(
        s.email.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0) % 9000
      );
      const mfaCode = `MFA-${1000 + numericSeed}`;

      // Status logic:
      // - isActive === false => SUSPENDED
      // - passwordHash === null => PENDING (invited, has not activated account yet)
      // - otherwise => ACTIVE
      let status: StaffHubUser["status"] = "ACTIVE";
      if (!s.isActive) {
        status = "SUSPENDED";
      } else if (!s.passwordHash) {
        status = "PENDING";
      }

      return {
        id: s.id,
        mfaCode,
        fullName: s.name,
        email: s.email,
        phone: "+234 800 000 0000",
        role: s.role,
        roleLabel: ROLE_LABELS[s.role] || "Staff Member",
        primaryCentre: primaryCentreCode,
        status,
        mfaEnabled: true,
        lastLogin: s.passwordHash ? "Active user" : "Pending activation",
        licenseNumber: `MDCN-${s.role.slice(0, 2)}-${1000 + numericSeed}`,
      };
    });

    // Merge with predefined facility staff if not already in DB
    const existingEmails = new Set(dbStaffMapped.map((s) => s.email.toLowerCase()));
    const additionalMock = STAFF_HUB_USERS_DATA.filter(
      (m) => !existingEmails.has(m.email.toLowerCase())
    );

    return [...dbStaffMapped, ...additionalMock];
  } catch (error) {
    console.error("Error loading live staff users from Supabase:", error);
    return STAFF_HUB_USERS_DATA;
  }
}

/**
 * Enroll a new staff member, persist to Supabase StaffUser and StaffCentre, and send invite email via Resend.
 */
export async function enrollStaffMemberServer(
  input: EnrollStaffInput
): Promise<{ success: boolean; staff?: StaffHubUser; error?: string }> {
  try {
    const trimmedName = input.fullName.trim();
    const trimmedEmail = input.email.trim().toLowerCase();
    const trimmedPhone = input.phone.trim();

    if (!trimmedName || !trimmedEmail) {
      return { success: false, error: "Full name and email are required." };
    }

    // Resolve centre ID in Supabase
    const centre = await prisma.centre.findFirst({
      where: { code: input.primaryCentre },
    });

    if (!centre) {
      return { success: false, error: `Centre code ${input.primaryCentre} not found in database.` };
    }

    const numericSeed = Math.floor(1000 + Math.random() * 9000);
    const mfaCode = `MFA-${numericSeed}`;

    // Create or update staff user in Supabase
    // passwordHash is initially null, marking them as PENDING until they activate
    const staffUser = await prisma.staffUser.upsert({
      where: { email: trimmedEmail },
      update: {
        name: trimmedName,
        role: input.role,
        isActive: true,
      },
      create: {
        name: trimmedName,
        email: trimmedEmail,
        role: input.role,
        isActive: true,
        passwordHash: null,
      },
    });

    // Connect staff to centre in StaffCentre join table
    await prisma.staffCentre.upsert({
      where: {
        staffId_centreId: {
          staffId: staffUser.id,
          centreId: centre.id,
        },
      },
      update: {},
      create: {
        staffId: staffUser.id,
        centreId: centre.id,
      },
    });

    // Send real onboarding email via Resend
    const centreName = CENTRE_NAMES[input.primaryCentre] || centre.name;
    const roleLabel = ROLE_LABELS[input.role] || input.role;

    await sendStaffInviteEmail({
      to: trimmedEmail,
      fullName: trimmedName,
      role: roleLabel,
      centreName,
      mfaCode,
      inviteUrl: `http://localhost:3000/hub/login?email=${encodeURIComponent(trimmedEmail)}&mfa=${mfaCode}`,
    });

    const enrolledStaff: StaffHubUser = {
      id: staffUser.id,
      mfaCode,
      fullName: staffUser.name,
      email: staffUser.email,
      phone: trimmedPhone || "+234 800 000 0000",
      role: staffUser.role,
      roleLabel,
      primaryCentre: input.primaryCentre,
      status: staffUser.passwordHash ? "ACTIVE" : "PENDING",
      mfaEnabled: true,
      lastLogin: staffUser.passwordHash ? "Active user" : "Pending activation",
      licenseNumber: `MDCN-${input.role.slice(0, 2)}-${numericSeed}`,
    };

    revalidatePath("/dashboard/settings");

    return {
      success: true,
      staff: enrolledStaff,
    };
  } catch (error) {
    console.error("Error enrolling staff member:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to enroll staff member in database.",
    };
  }
}

/**
 * Toggle staff active/suspended status in Supabase.
 */
export async function toggleStaffStatusServer(
  staffId: string,
  targetStatus: "ACTIVE" | "SUSPENDED"
): Promise<{ success: boolean; error?: string }> {
  try {
    const isActive = targetStatus === "ACTIVE";

    // Only update if it exists in Supabase (skip demo IDs like usr-kachi if not in DB)
    if (staffId.startsWith("c")) {
      await prisma.staffUser.update({
        where: { id: staffId },
        data: { isActive },
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error toggling staff status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update staff status.",
    };
  }
}

/**
 * Resend onboarding invite email via Resend for pending staff.
 */
export async function resendStaffInviteServer(
  staff: StaffHubUser
): Promise<{ success: boolean; error?: string }> {
  try {
    const centreName = CENTRE_NAMES[staff.primaryCentre] || "MedServe Medical Centre";
    const roleLabel = ROLE_LABELS[staff.role] || staff.role;

    const result = await sendStaffInviteEmail({
      to: staff.email,
      fullName: staff.fullName,
      role: roleLabel,
      centreName,
      mfaCode: staff.mfaCode,
      inviteUrl: `http://localhost:3000/hub/login?email=${encodeURIComponent(staff.email)}&mfa=${staff.mfaCode}`,
    });

    return result;
  } catch (error) {
    console.error("Error resending staff invite:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to resend invite.",
    };
  }
}
