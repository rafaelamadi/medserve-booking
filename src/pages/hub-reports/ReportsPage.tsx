import { redirect } from "next/navigation";
import { getStaffSession } from "@/shared/lib/auth";
import { getScopeCentres } from "@/widgets/hub-shell";
import { ReportsBoard } from "@/widgets/reports-board";

export async function ReportsPage() {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  const { centres } = await getScopeCentres();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-zinc-500">By centre, service, status and date range — with CSV export.</p>
      </div>
      <ReportsBoard centres={centres.map((c) => ({ id: c.id, code: c.code }))} />
    </div>
  );
}
