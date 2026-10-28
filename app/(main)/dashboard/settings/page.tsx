"use client";

import * as React from "react";
import {
  CheckCircle2,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { STAFF_HUB_USERS_DATA } from "@/data/centre-settings-data";

import { StaffPermissionsManagement } from "./_components/staff-permissions-management";

export default function StaffAccessSettingsPage() {
  const staff = STAFF_HUB_USERS_DATA;
  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.status === "ACTIVE").length;
  const suspendedStaff = staff.filter((s) => s.status === "SUSPENDED").length;

  return (
    <div className="@container/main flex flex-col gap-5 md:gap-6">
      {/* Page Title & Action Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Staff Accounts & Access Control
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage clinician credentials, multi-centre facility assignments, regulatory practice licenses, and system access permissions.
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
            <span className="text-xs text-muted-foreground">in directory</span>
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
            <span className="text-xs text-muted-foreground">approved access</span>
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
              Centres
            </span>
            <Shield className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              3
            </span>
            <span className="text-xs text-muted-foreground">MLCC, MKDC, MUDC</span>
          </div>
        </Card>
      </div>

      {/* Main Filterable Staff Directory Table */}
      <Card className="p-5 shadow-xs">
        <StaffPermissionsManagement />
      </Card>
    </div>
  );
}
