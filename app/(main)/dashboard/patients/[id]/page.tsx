import { notFound } from "next/navigation";
import { getLivePatientById } from "@/server/patients";
import { PatientDetailClient } from "./_components/patient-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Standard Next.js App Router Server Component.
 * Fetches patient clinical dossier on HTTP GET before streaming pre-rendered HTML to the client.
 */
export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getLivePatientById(id);

  if (!patient) {
    notFound();
  }

  return <PatientDetailClient initialPatient={patient} />;
}
