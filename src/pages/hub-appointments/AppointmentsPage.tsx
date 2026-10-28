import { AppointmentQueue } from "@/widgets/appointment-queue";
import { getStaffSession } from "@/shared/lib/auth";
import { getScopeCentres } from "@/widgets/hub-shell";
import { redirect } from "next/navigation";

export async function AppointmentsPage() {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  const { centres } = await getScopeCentres();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Appointments</h1>
      <AppointmentQueue centres={centres.map((c) => ({ id: c.id, code: c.code }))} />
    </div>
  );
}
