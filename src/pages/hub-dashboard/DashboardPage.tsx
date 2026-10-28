import { DashboardStats } from "@/widgets/hub-dashboard-stats";

export function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <DashboardStats />
    </div>
  );
}
