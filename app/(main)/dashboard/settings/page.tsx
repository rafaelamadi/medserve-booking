"use client";

import * as React from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STAFF_HUB_USERS_DATA, type StaffHubUser } from "@/data/centre-settings-data";
import { getLiveStaffUsers } from "@/server/staff";
import { useCentreScope } from "@/shared/context/centre-scope-context";

import { CentresManagement } from "./_components/centres-management";
import { HolidaysManagement } from "./_components/holidays-management";
import { OperatingHoursManagement } from "./_components/operating-hours-management";
import { StaffPermissionsManagement } from "./_components/staff-permissions-management";

export default function SettingsPage() {
  const { selectedCentre, isAllCentres } = useCentreScope();
  const [staffList, setStaffList] = React.useState<StaffHubUser[]>(STAFF_HUB_USERS_DATA);

  React.useEffect(() => {
    async function loadLiveStaff() {
      try {
        const live = await getLiveStaffUsers();
        if (live && live.length > 0) {
          setStaffList(live);
        }
      } catch (err) {
        console.error("Failed to load live staff users:", err);
      }
    }
    loadLiveStaff();
  }, []);

  const scopedStaff = React.useMemo(() => {
    if (isAllCentres || !selectedCentre.code) return staffList;
    return staffList.filter((s) => s.primaryCentre === selectedCentre.code);
  }, [staffList, isAllCentres, selectedCentre.code]);

  const totalStaff = scopedStaff.length;
  const activeStaff = scopedStaff.filter((s) => s.status === "ACTIVE").length;
  const pendingStaff = scopedStaff.filter((s) => s.status === "PENDING" || s.status === "INVITED").length;
  const suspendedStaff = scopedStaff.filter((s) => s.status === "SUSPENDED").length;

  return (
    <div className="@container/main flex flex-col gap-5 md:gap-6">
      {/* Page Title & Action Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          System & Facility Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage clinical staff access, facility addresses, operating schedules, and national holiday blackouts across MedServe centres.
        </p>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Total Staff
            </span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              {totalStaff}
            </span>
            <span className="text-xs text-muted-foreground">
              {isAllCentres ? "in directory" : `in ${selectedCentre.code}`}
            </span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wider">
              Active Accounts
            </span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {activeStaff}
            </span>
            <span className="text-xs text-muted-foreground">
              {pendingStaff > 0 ? `${pendingStaff} pending` : "approved access"}
            </span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider">
              Suspended
            </span>
            <ShieldAlert className="size-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
              {suspendedStaff}
            </span>
            <span className="text-xs text-muted-foreground">access restricted</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {isAllCentres ? "Centres" : "Active Centre"}
            </span>
            <Shield className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              {isAllCentres ? 3 : 1}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {isAllCentres ? "MLCC, MKDC, MUDC" : selectedCentre.code}
            </span>
          </div>
        </Card>
      </div>

      {/* Settings Navigation Tabs */}
      <Tabs defaultValue="staff" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-flex h-10 p-1">
          <TabsTrigger value="staff" className="gap-2 text-xs font-medium">
            <Users className="size-3.5" />
            Staff Accounts
          </TabsTrigger>
          <TabsTrigger value="centres" className="gap-2 text-xs font-medium">
            <Building2 className="size-3.5" />
            Medical Centres
          </TabsTrigger>
          <TabsTrigger value="operating-hours" className="gap-2 text-xs font-medium">
            <Clock className="size-3.5" />
            Operating Hours
          </TabsTrigger>
          <TabsTrigger value="holidays" className="gap-2 text-xs font-medium">
            <Calendar className="size-3.5" />
            Holidays & Blackouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-0">
          <Card className="p-5 shadow-xs">
            <StaffPermissionsManagement staffList={staffList} setStaffList={setStaffList} />
          </Card>
        </TabsContent>

        <TabsContent value="centres" className="mt-0">
          <CentresManagement />
        </TabsContent>

        <TabsContent value="operating-hours" className="mt-0">
          <OperatingHoursManagement />
        </TabsContent>

        <TabsContent value="holidays" className="mt-0">
          <HolidaysManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
