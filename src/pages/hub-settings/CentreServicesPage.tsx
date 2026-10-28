import { redirect } from "next/navigation";
import { listCentreServices } from "@/entities/centre-service";
import { listResources } from "@/entities/resource";
import { listServices } from "@/entities/service";
import { CentreServicesSection, ResourcesSection } from "@/features/manage-centres-services";
import { getStaffSession } from "@/shared/lib/auth";
import { getScopeCentres } from "@/widgets/hub-shell";

export async function CentreServicesPage() {
  const s = await getStaffSession();
  if (!s || (s.role !== "SUPER_ADMIN" && s.role !== "CENTRE_MANAGER")) redirect("/hub");
  const { selected } = await getScopeCentres();
  if (!selected) return <p className="text-sm">No centre available.</p>;
  const [items, resources, services] = await Promise.all([
    listCentreServices(selected.id),
    listResources(selected.id),
    listServices(),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Centre services — {selected.code}</h1>
        <p className="text-sm text-zinc-500">Switch the working centre in the top bar to manage another centre.</p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <CentreServicesSection
          centreId={selected.id}
          items={items}
          availableServices={services.filter((x) => x.isActive).map((x) => ({ id: x.id, name: x.name }))}
          resources={resources.filter((x) => x.isActive).map((x) => ({ id: x.id, name: x.name }))}
        />
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <ResourcesSection centreId={selected.id} items={resources} />
      </div>
    </div>
  );
}
