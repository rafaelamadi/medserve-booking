import { getLivePatients } from "@/server/patients";
import { PatientsClient } from "./_components/patients-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Standard Next.js App Router Server Component.
 * Fetches live patient directory directly from Supabase on HTTP GET before streaming HTML.
 */
export default async function PatientsPage() {
  const patients = await getLivePatients();

  return <PatientsClient initialPatients={patients} />;
}
