import { redirect } from "next/navigation";
import { getStaffSession } from "@/shared/lib/auth";
import { PatientDetail } from "@/widgets/patients-board";

export async function PatientDetailPage({ id }: { id: string }) {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  return <PatientDetail id={id} />;
}
