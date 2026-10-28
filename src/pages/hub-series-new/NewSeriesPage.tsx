import { redirect } from "next/navigation";
import { listCentreServices } from "@/entities/centre-service";
import { listServices } from "@/entities/service";
import { getStaffSession } from "@/shared/lib/auth";
import { getScopeCentres } from "@/widgets/hub-shell";
import { SeriesBuilder } from "@/widgets/series-builder";

export async function NewSeriesPage() {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  if (s.role !== "CLINICIAN" && s.role !== "CENTRE_MANAGER" && s.role !== "SUPER_ADMIN") {
    redirect("/hub/series");
  }
  const { selected } = await getScopeCentres();
  if (!selected) return <p className="text-sm">No centre available.</p>;
  const [items, catalogue] = await Promise.all([listCentreServices(selected.id), listServices()]);
  // Only series-capable services reach the builder (supportsSeries lives on Service).
  const capableNames = new Set(catalogue.filter((c) => c.supportsSeries && c.isActive).map((c) => c.name));
  const options = items
    .filter((x) => x.isActive && capableNames.has(x.service.name))
    .map((x) => ({ id: x.id, name: x.service.name }));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New care series — {selected.code}</h1>
        <p className="text-sm text-zinc-500">Review the preview before saving. The patient gets one notice with the full schedule.</p>
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-amber-700">No series-capable services enabled at this centre yet.</p>
      ) : (
        <SeriesBuilder centreCode={selected.code} services={options} />
      )}
    </div>
  );
}
