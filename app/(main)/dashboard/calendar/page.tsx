import type { Metadata } from "next";

import { Calendar } from "./_components/calendar";
import { CalendarHeader } from "./_components/calendar-header";

export const metadata: Metadata = {
  title: "Centre Master Calendar | MedServe Clinician Hub",
  description: "Live schedule of appointments across MedServe healthcare centres.",
  alternates: {
    canonical: "/dashboard/calendar",
  },
};

export default function CalendarPage() {
  return (
    <div className="@container/main flex flex-col gap-5 md:gap-6">
      {/* Scoped Calendar Header */}
      <CalendarHeader />

      {/* Main Interactive Clinical Calendar */}
      <Calendar />
    </div>
  );
}
