import { redirect } from "next/navigation";
import { AppointmentDetailWidget } from "@/widgets/appointment-queue";
import { getStaffSession } from "@/shared/lib/auth";

export async function AppointmentDetailPage({ id }: { id: string }) {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  return <AppointmentDetailWidget id={id} canAct={s.role !== "VIEWER"} />;
}
