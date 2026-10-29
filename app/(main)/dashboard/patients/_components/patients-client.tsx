"use client";

import * as React from "react";
import { CalendarCheck, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { RegisteredPatient } from "@/data/patient-registry-data";
import { getLivePatients } from "@/server/patients";
import { useCentreScope } from "@/shared/context/centre-scope-context";

import { NewPatientDialog } from "./new-patient-dialog";
import { PatientsTable } from "./patients-table";

interface PatientsClientProps {
  initialPatients: RegisteredPatient[];
}

export function PatientsClient({ initialPatients }: PatientsClientProps) {
  const [patientList, setPatientList] = React.useState<RegisteredPatient[]>(initialPatients);
  const { selectedCentre } = useCentreScope();

  const isAll = !selectedCentre || selectedCentre.id === "all" || selectedCentre.code === "ALL";

  // Re-sync background listener for dialog creations or cross-tab events
  React.useEffect(() => {
    const handleSync = async () => {
      try {
        const fresh = await getLivePatients(isAll ? undefined : selectedCentre?.code);
        setPatientList(fresh);
      } catch (err) {
        console.error("Failed to re-sync patients from Supabase:", err);
      }
    };

    window.addEventListener("medserve:patient-sync", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("medserve:patient-sync", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [isAll, selectedCentre?.code]);

  const displayedPatients = isAll
    ? patientList
    : patientList.filter((p) => p.centreCode === selectedCentre.code);

  const totalPatients = displayedPatients.length;
  const totalEncountersLogged = displayedPatients.reduce(
    (acc, p) => acc + (p.visits?.length || 0),
    0,
  );

  const handleCreated = (newPatient: RegisteredPatient) => {
    setPatientList((prev) => {
      const exists = prev.some((p) => p.id === newPatient.id || p.mrn === newPatient.mrn);
      if (exists) {
        return prev.map((p) => (p.id === newPatient.id ? newPatient : p));
      }
      return [newPatient, ...prev];
    });
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
            {isAll
              ? "Master directory of registered patients across Lagos (MLCC), Kano (MKDC), and Umuahia (MUDC). Click any patient to view in-depth clinical history, past visits, and encounter notes."
              : `Master directory of registered patients for ${selectedCentre.name} (${selectedCentre.city}). Click any patient to view in-depth clinical history, past visits, and encounter notes.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NewPatientDialog onCreated={handleCreated} />
        </div>
      </div>

      {/* Directory Statistics (2-card layout) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
      </div>

      {/* Main Filterable Patients Table */}
      <Card className="p-5 shadow-xs">
        <PatientsTable data={displayedPatients} onDataChange={setPatientList} />
      </Card>
    </div>
  );
}
