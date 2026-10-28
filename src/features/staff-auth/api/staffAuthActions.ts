"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/shared/api/prisma";

const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Please enter a valid staff email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type RegisterStaffResult =
  | { ok: true; staff: { id: string; email: string; name: string } }
  | { ok: false; error: string };

/**
 * Registers a new staff member with strictly email and password.
 */
export async function registerStaffUser(input: {
  name?: string;
  email: string;
  password: string;
}): Promise<RegisterStaffResult> {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Invalid registration data" };
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Check if staff account already exists
    const existing = await prisma.staffUser.findUnique({
      where: { email },
    });

    if (existing) {
      return { ok: false, error: "A staff account with this email already exists. Please sign in." };
    }

    // Hash the password securely
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    // Use provided name or derive a clean display name from the email prefix
    const emailPrefix = email.split("@")[0].replace(/[._-]/g, " ");
    const derivedName = emailPrefix
      ? emailPrefix
          .split(" ")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "Staff Member";
    const displayName = parsed.data.name?.trim() || derivedName;

    // Link with default active centre (e.g. MLCC)
    const centre = await prisma.centre.findFirst({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    // Create the StaffUser
    const newStaff = await prisma.staffUser.create({
      data: {
        name: displayName,
        email,
        passwordHash,
        role: "STAFF",
        isActive: true,
        ...(centre ? { centres: { create: { centreId: centre.id } } } : {}),
      },
    });

    return {
      ok: true,
      staff: {
        id: newStaff.id,
        email: newStaff.email,
        name: newStaff.name,
      },
    };
  } catch (err) {
    console.error("[registerStaffUser] error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create staff account.",
    };
  }
}
