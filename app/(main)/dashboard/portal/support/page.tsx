import { redirect } from "next/navigation";
import { getPatientSession } from "@/shared/lib/patientCookie";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/api/prisma";
import { getLivePatientById } from "@/server/patients";
import { PortalSupportPage } from "@/pages/portal-support";

export default async function SupportPage() {
  const cookieSession = await getPatientSession();
  const nextAuthSession = await auth();

  const userEmail = cookieSession?.email || nextAuthSession?.user?.email;

  if (userEmail) {
    const patient = await prisma.patient.findUnique({
      where: { email: userEmail.toLowerCase() },
      select: { id: true, fullName: true, email: true, phone: true, mrn: true },
    });

    if (patient && (!patient.phone || patient.phone.trim() === "" || patient.phone === "+234" || patient.phone === "+234 ")) {
      redirect(
        `/hub/login?tab=patient&step=intake&email=${encodeURIComponent(patient.email || userEmail)}&name=${encodeURIComponent(patient.fullName || "")}`
      );
    }

    if (patient) {
      const fullPatient = await getLivePatientById(patient.id);
      if (fullPatient) {
        return <PortalSupportPage initialPatient={fullPatient} />;
      }
    }
  }

  return <PortalSupportPage />;
}
