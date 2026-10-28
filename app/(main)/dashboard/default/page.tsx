import type { Metadata } from "next";

import { MetricCards } from "./_components/metric-cards";
import { TriageAlertsPanel } from "./_components/triage-alerts-panel";
import { PerformanceOverview } from "./_components/performance-overview";
import { SubscriberOverview } from "./_components/subscriber-overview";

export const metadata: Metadata = {
  title: "Clinical Overview | MedServe Hub",
  description:
    "Multi-centre oncology appointments, radiotherapy series queues, and clinical workflow management across MLCC Lagos, MKDC Kano, and MUDC Abuja.",
  alternates: {
    canonical: "/dashboard/default",
  },
};

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <MetricCards />
      <TriageAlertsPanel />
      <PerformanceOverview />
      <SubscriberOverview />
    </div>
  );
}
