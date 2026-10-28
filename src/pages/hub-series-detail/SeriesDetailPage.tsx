import { redirect } from "next/navigation";
import { getStaffSession } from "@/shared/lib/auth";
import { SeriesDetail } from "@/widgets/series-timeline";

export async function SeriesDetailPage({ id }: { id: string }) {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  const canManage =
    s.role === "CLINICIAN" || s.role === "CENTRE_MANAGER" || s.role === "SUPER_ADMIN";
  return <SeriesDetail id={id} canManage={canManage} />;
}
