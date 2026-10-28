import { redirect } from "next/navigation";
import { getStaffSession } from "@/shared/lib/auth";
import { PatientsBoard } from "@/widgets/patients-board";

export async function PatientsPage() {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Patients</h1>
      <PatientsBoard />
    </div>
  );
}
