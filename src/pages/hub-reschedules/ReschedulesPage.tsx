import { redirect } from "next/navigation";
import { getStaffSession } from "@/shared/lib/auth";
import { RescheduleQueue } from "@/widgets/reschedule-queue";

export async function ReschedulesPage() {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Reschedule requests</h1>
        <p className="text-sm text-zinc-500">Approve the requested time or propose another. Original slots stay held until you act.</p>
      </div>
      <RescheduleQueue />
    </div>
  );
}
