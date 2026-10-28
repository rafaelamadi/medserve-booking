import { redirect } from "next/navigation";
import { listCentres } from "@/entities/centre";
import { CentresSection } from "@/features/manage-centres-services";
import { getStaffSession } from "@/shared/lib/auth";

export async function CentresPage() {
  const s = await getStaffSession();
  if (!s || (s.role !== "SUPER_ADMIN" && s.role !== "CENTRE_MANAGER")) redirect("/hub");
  const centres = await listCentres();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Centres</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <CentresSection centres={centres} canCreate={s.role === "SUPER_ADMIN"} />
      </div>
    </div>
  );
}
