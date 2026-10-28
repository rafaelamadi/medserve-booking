import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Patients are keyed by normalised E.164 phone (PRD Q9/D11).
 * Re-bookings refresh name/email; soft-deleted records are revived.
 */
export async function findOrCreatePatientTx(
  tx: Tx,
  input: { phone: string; fullName: string; email?: string },
) {
  const email = input.email?.trim() ? input.email.trim() : null;
  const existing = await tx.patient.findUnique({ where: { phone: input.phone } });
  if (!existing) {
    return tx.patient.create({ data: { phone: input.phone, fullName: input.fullName, email } });
  }
  if (
    existing.deletedAt !== null ||
    existing.fullName !== input.fullName ||
    existing.email !== email
  ) {
    return tx.patient.update({
      where: { phone: input.phone },
      data: { fullName: input.fullName, email, deletedAt: null },
    });
  }
  return existing;
}
