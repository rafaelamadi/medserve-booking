import { redirect } from "next/navigation";
import { listClosuresForCentre, listRulesForCentre } from "@/entities/availability";
import { listCentreServices } from "@/entities/centre-service";
import { listResources } from "@/entities/resource";
import { AvailabilitySection } from "@/features/manage-availability";
import { getStaffSession } from "@/shared/lib/auth";
import { getScopeCentres } from "@/widgets/hub-shell";

export async function AvailabilityPage() {
  const s = await getStaffSession();
  if (!s || (s.role !== "SUPER_ADMIN" && s.role !== "CENTRE_MANAGER")) redirect("/hub");
  const { selected } = await getScopeCentres();
  if (!selected) return <p className="text-sm">No centre available.</p>;
  const [services, rules, closures, resources] = await Promise.all([
    listCentreServices(selected.id),
    listRulesForCentre(selected.id),
    listClosuresForCentre(selected.id),
    listResources(selected.id),
  ]);
  const rulesByService: Record<string, Array<{ dayOfWeek: number; startMinute: number; endMinute: number }>> = {};
  for (const r of rules) {
    (rulesByService[r.centreServiceId] ??= []).push({
      dayOfWeek: r.dayOfWeek,
      startMinute: r.startMinute,
      endMinute: r.endMinute,
    });
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Availability — {selected.code}</h1>
        <p className="text-sm text-zinc-500">Weekly hours and closures feed the slot engine directly.</p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <AvailabilitySection
          centreId={selected.id}
          centreServices={services
            .filter((x) => x.isActive)
            .map((x) => ({ id: x.id, serviceName: x.service.name }))}
          rulesByService={rulesByService}
          closures={closures.map((c) => ({
            id: c.id,
            startsOn: c.startsOn.toISOString().slice(0, 10),
            endsOn: c.endsOn.toISOString().slice(0, 10),
            reason: c.reason,
            resource: c.resource,
          }))}
          resources={resources.filter((x) => x.isActive).map((x) => ({ id: x.id, name: x.name }))}
        />
      </div>
    </div>
  );
}
