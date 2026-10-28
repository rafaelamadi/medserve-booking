import { redirect } from "next/navigation";
import { listServices } from "@/entities/service";
import { ServicesSection } from "@/features/manage-centres-services";
import { getStaffSession } from "@/shared/lib/auth";

export async function ServicesPage() {
  const s = await getStaffSession();
  if (!s || (s.role !== "SUPER_ADMIN" && s.role !== "CENTRE_MANAGER")) redirect("/hub");
  const services = await listServices();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Services</h1>
        <p className="text-sm text-zinc-500">Global catalogue. Only SUPER_ADMIN can edit.</p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <ServicesSection services={services} canEdit={s.role === "SUPER_ADMIN"} />
      </div>
    </div>
  );
}
