import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/shared/lib/auth";
import { SeriesList } from "@/widgets/series-timeline";

export async function SeriesListPage({ status }: { status?: "ACTIVE" | "COMPLETED" | "CANCELLED" }) {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  const canCreate = s.role === "CLINICIAN" || s.role === "CENTRE_MANAGER" || s.role === "SUPER_ADMIN";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Care series</h1>
        {canCreate && (
          <Link href="/hub/series/new" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white">
            New series
          </Link>
        )}
      </div>
      <SeriesList status={status ?? "ACTIVE"} />
    </div>
  );
}
