"use client";

import * as React from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  REGISTERED_PATIENTS,
  type RegisteredPatient,
} from "@/data/patient-registry-data";

import { NewPatientDialog } from "./_components/new-patient-dialog";
import { PatientsTable } from "./_components/patients-table";

export default function PatientsPage() {
  const [patientList, setPatientList] =
    React.useState<RegisteredPatient[]>(REGISTERED_PATIENTS);

  const totalPatients = patientList.length;
  const totalEncountersLogged = patientList.reduce(
    (acc, p) => acc + (p.visits?.length || 0),
    0,
  );

  const handleCreated = (newPatient: RegisteredPatient) => {
    setPatientList((prev) => [newPatient, ...prev]);
  };

  return (
    <div className="@container/main flex flex-col gap-5 md:gap-6">
      {/* Page Title & Action Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Patient Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Master directory of registered patients. Click any patient to view in-depth clinical history, past visits, and encounter notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NewPatientDialog onCreated={handleCreated} />
        </div>
      </div>

      {/* Clean Directory Statistics */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Total Patients
            </span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              {totalPatients}
            </span>
            <span className="text-xs text-muted-foreground">registered records</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Encounters Logged
            </span>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              {totalEncountersLogged}
            </span>
            <span className="text-xs text-muted-foreground">recorded across history</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Verified Phone Records
            </span>
            <Phone className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              100%
            </span>
            <span className="text-xs text-muted-foreground">verified phone numbers</span>
          </div>
        </Card>
      </div>

      {/* Main Filterable Patients Table */}
      <Card className="p-5 shadow-xs">
        <PatientsTable data={patientList} onDataChange={setPatientList} />
      </Card>
    </div>
  );
}
