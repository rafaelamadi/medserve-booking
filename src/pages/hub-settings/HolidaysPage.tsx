import { redirect } from "next/navigation";
import { listHolidays } from "@/entities/holiday";
import { HolidaysSection } from "@/features/manage-holidays";
import { getStaffSession } from "@/shared/lib/auth";
import { getScopeCentres } from "@/widgets/hub-shell";

export async function HolidaysPage() {
  const s = await getStaffSession();
  if (!s || (s.role !== "SUPER_ADMIN" && s.role !== "CENTRE_MANAGER")) redirect("/hub");
  const [{ centres }, holidays] = await Promise.all([getScopeCentres(), listHolidays()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Holiday calendar</h1>
        <p className="text-sm text-zinc-500">Closed days for the slot engine. Series flagging arrives in Phase 5.</p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <HolidaysSection
          holidays={holidays.map((h) => ({
            id: h.id,
            date: h.date.toISOString().slice(0, 10),
            name: h.name,
            centre: h.centre,
          }))}
          centres={centres.map((c) => ({ id: c.id, code: c.code }))}
          canAddGlobal={s.role === "SUPER_ADMIN"}
        />
      </div>
    </div>
  );
}
