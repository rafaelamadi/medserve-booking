"use client";

import Link from "next/link";
import { CalendarPlus, Download } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TODAY_APPOINTMENTS } from "@/data/clinical-queue-data";

import { RecentCustomersTable } from "./recent-customers-table/table";

export function SubscriberOverview() {
  const handleExport = () => {
    toast.success("Clinical Queue Exported", {
      description: "Downloaded today's appointment queue (CSV) for offline handoff.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle className="leading-none text-base md:text-lg">
              Today&apos;s Patient Queue & Clinical Sessions
            </CardTitle>
            <Badge variant="outline" className="text-xs font-normal">
              {TODAY_APPOINTMENTS.length} Scheduled Visits
            </Badge>
          </div>
          <CardDescription>
            Real-time patient tracking across radiotherapy vaults, chemotherapy suites, and consultation bays
          </CardDescription>
        </div>

        <CardAction className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleExport}>
            <Download className="size-3.5 mr-1" />
            Export Queue
          </Button>
          <Button size="sm" className="h-9 text-xs" asChild>
            <Link href="/dashboard/appointments">
              <CalendarPlus className="size-3.5 mr-1" />
              Manage All
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <RecentCustomersTable data={TODAY_APPOINTMENTS} />
      </CardContent>
    </Card>
  );
}
