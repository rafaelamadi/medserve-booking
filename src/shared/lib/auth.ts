import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/shared/api/prisma";
import type { StaffRole } from "@prisma/client";

import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";
import { setPatientSession } from "./patientCookie";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: StaffRole;
      centreIds: string[];
    } & DefaultSession["user"];
  }
  interface User {
    role?: StaffRole;
    centreIds?: string[];
  }
  interface JWT {
    staffId?: string;
    role?: StaffRole;
    centreIds?: string[];
  }
}

const credentialsSchema = z.object({
  email: z.string().email("Please enter a valid staff email address."),
  password: z.string().min(1, "Password is required."),
});

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Staff Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        try {
          const email = parsed.data.email.toLowerCase().trim();
          const staff = await prisma.staffUser.findUnique({
            where: { email },
            include: { centres: true },
          });

          if (!staff || !staff.isActive || !staff.passwordHash) {
            return null;
          }

          const isValid = await bcrypt.compare(parsed.data.password, staff.passwordHash);
          if (!isValid) {
            return null;
          }

          return {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: staff.role,
            centreIds: staff.centres.map((c: { centreId: string }) => c.centreId),
          };
        } catch (error) {
          console.error("[Auth] Staff authorization error:", error);
          return null;
        }
      },
    }),
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      if (account?.provider === "google") {
        if (!user.email) return false;
        try {
          const email = user.email.toLowerCase();
          let patient = await prisma.patient.findUnique({
            where: { email },
          });
          if (!patient) {
            patient = await prisma.patient.create({
              data: {
                email,
                fullName: user.name || "Patient",
              },
            });
          }
          await setPatientSession({
            patientId: patient.id,
            email: patient.email ?? email,
            name: patient.fullName,
            phone: patient.phone ?? undefined,
          });
          return true;
        } catch (err) {
          console.error("[Auth] Google patient sign-in error:", err);
          return false;
        }
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.staffId = user.id;
        token.role = (user as { role?: StaffRole }).role;
        token.centreIds = (user as { centreIds?: string[] }).centreIds ?? [];
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = (token.staffId as string) ?? token.sub ?? "";
        session.user.role = (token.role as StaffRole) ?? "VIEWER";
        session.user.centreIds = (token.centreIds as string[]) ?? [];
      }
      return session;
    },
  },
});

export type StaffSession = {
  staffId: string;
  role: StaffRole;
  centreIds: string[];
};

export async function getStaffSession(): Promise<StaffSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    staffId: session.user.id,
    role: session.user.role,
    centreIds: session.user.centreIds ?? [],
  };
}

const ROLE_RANK: Record<StaffRole, number> = {
  VIEWER: 0,
  STAFF: 1,
  CLINICIAN: 2,
  CENTRE_MANAGER: 3,
  SUPER_ADMIN: 4,
};

/** Enforce minimum role server-side. Never rely on hidden UI (PRD §12.5). */
export async function requireRole(min: StaffRole): Promise<StaffSession> {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  if (ROLE_RANK[s.role] < ROLE_RANK[min]) throw new Error("Forbidden");
  return s;
}

/** Enforce centre scope unless SUPER_ADMIN (PRD §3). */
export async function requireCentreAccess(centreId: string): Promise<StaffSession> {
  const s = await getStaffSession();
  if (!s) throw new Error("Unauthorized");
  if (s.role === "SUPER_ADMIN") return s;
  if (!s.centreIds.includes(centreId)) throw new Error("Forbidden: centre scope");
  return s;
}
