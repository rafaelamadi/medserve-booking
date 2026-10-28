import type { Metadata } from "next";

import { Calendar } from "./_components/calendar";

export const metadata: Metadata = {
  title: "Centre Master Calendar | MedServe Clinician Hub",
  description: "Live schedule across Linear Accelerator vaults, CT simulators, chemotherapy bays, and consulting rooms.",
  alternates: {
    canonical: "/dashboard/calendar",
  },
};

export default function CalendarPage() {
  return (
    <div className="@container/main flex flex-col gap-5 md:gap-6">
      {/* Page Title & Breadcrumb Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Centre Master Calendar
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Live scheduling grid across Linear Accelerator vaults, CT simulation suites, chemotherapy infusion bays, and consulting rooms for Lagos (MLCC), Kano (MKDC), and Abuja (MUDC).
        </p>
      </div>

      {/* Main Interactive Clinical Calendar */}
      <Calendar />
    </div>
  );
}
