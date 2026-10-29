import type { Metadata } from "next";

import { DashboardHeader } from "./_components/dashboard-header";
import { MetricCards } from "./_components/metric-cards";
import { PerformanceOverview } from "./_components/performance-overview";
import { SubscriberOverview } from "./_components/subscriber-overview";

export const metadata: Metadata = {
  title: "Appointments Overview | MedServe Hub",
  description:
    "Patient booking and appointment management across MedServe centres in Lagos (MLCC), Kano (MKDC), and Umuahia (MUDC).",
  alternates: {
    canonical: "/dashboard/default",
  },
};

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <DashboardHeader />
      <MetricCards />
      <SubscriberOverview />
      <PerformanceOverview />
    </div>
  );
}
