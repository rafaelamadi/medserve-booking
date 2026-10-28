"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Subscribe } from "@tanstack/react-table";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ClockAlert,
  EllipsisVertical,
  HeartPulse,
  Phone,
  PlayCircle,
  Repeat,
  Stethoscope,
  UserCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { getInitials } from "@/lib/utils";

import type { ClinicalAppointmentRow } from "./schema";

function statusBadge(status: string) {
  switch (status) {
    case "IN_TREATMENT":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 font-medium">
          <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
          In Treatment
        </Badge>
      );
    case "CHECKED_IN":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-medium">
          <UserCheck className="size-3" />
          Checked In
        </Badge>
      );
    case "SCHEDULED":
      return (
        <Badge variant="outline" className="text-muted-foreground gap-1">
          <Clock className="size-3" />
          Scheduled
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1">
          <CheckCircle2 className="size-3" />
          Confirmed
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="secondary" className="text-muted-foreground gap-1">
          <CheckCircle2 className="size-3" />
          Completed
        </Badge>
      );
    case "RESCHEDULE_REQUESTED":
      return (
        <Badge variant="destructive" className="gap-1 font-medium">
          <ClockAlert className="size-3" />
          Reschedule Req.
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function modalityIcon(modality: string) {
  switch (modality) {
    case "Radiotherapy":
      return <Repeat className="size-3.5 text-primary" />;
    case "Chemotherapy":
      return <HeartPulse className="size-3.5 text-blue-500" />;
    case "Consultation":
      return <Stethoscope className="size-3.5 text-emerald-500" />;
    default:
      return <Activity className="size-3.5 text-amber-500" />;
  }
}

export const recentCustomersColumns: ColumnDef<DataTableFeatures, ClinicalAppointmentRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Subscribe
          source={table.atoms.rowSelection}
          selector={() =>
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && "indeterminate")
          }
        >
          {(checked) => (
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all appointments"
            />
          )}
        </Subscribe>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
          {(checked) => (
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label={`Select appointment for ${row.original.patientName}`}
            />
          )}
        </Subscribe>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary">{getInitials(row.original.patientName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-foreground">{row.original.patientName}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{row.original.patientMrn}</span>
          </div>
          <div className="text-muted-foreground text-xs">{row.original.patientPhone}</div>
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.reference} ${row.patientName} ${row.patientPhone} ${row.patientMrn} ${row.centreCode}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "serviceName",
    header: "Modality & Service",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          {modalityIcon(row.original.modality)}
          <span className="text-xs font-semibold text-foreground truncate">{row.original.serviceName}</span>
        </div>
        {row.original.fractionInfo ? (
          <span className="text-[11px] text-primary font-medium">{row.original.fractionInfo}</span>
        ) : (
          <span className="text-[11px] text-muted-foreground font-mono">{row.original.reference}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "centreCode",
    header: "Centre & Room",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
            {row.original.centreCode}
          </Badge>
          <span className="text-xs text-muted-foreground">{row.original.room}</span>
        </div>
        <span className="text-[11px] text-muted-foreground truncate">{row.original.oncologist}</span>
      </div>
    ),
  },
  {
    accessorKey: "timeSlot",
    header: "Time Slot",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 font-mono text-xs font-medium">
        <Clock className="size-3 text-muted-foreground" />
        <span>{row.original.timeSlot}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => statusBadge(row.original.status),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const apt = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="size-8 p-0">
              <EllipsisVertical className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs font-semibold">Clinician Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {apt.status === "SCHEDULED" || apt.status === "CONFIRMED" ? (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() =>
                  toast.success("Patient Checked In", {
                    description: `${apt.patientName} is now in waiting queue.`,
                  })
                }
              >
                <UserCheck className="size-4 mr-2 text-emerald-600" />
                Check In Patient
              </DropdownMenuItem>
            ) : null}
            {apt.status === "CHECKED_IN" ? (
              <DropdownMenuItem
                className="cursor-pointer font-medium"
                onClick={() =>
                  toast.info("Treatment Started", {
                    description: `Session commenced in ${apt.room}.`,
                  })
                }
              >
                <PlayCircle className="size-4 mr-2 text-amber-600" />
                Start Treatment
              </DropdownMenuItem>
            ) : null}
            {apt.status === "IN_TREATMENT" ? (
              <DropdownMenuItem
                className="cursor-pointer font-medium"
                onClick={() =>
                  toast.success("Session Completed", {
                    description: `Treatment record saved for ${apt.patientName}.`,
                  })
                }
              >
                <CheckCircle2 className="size-4 mr-2 text-emerald-600" />
                Complete Session
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                toast.info(`Dialing ${apt.patientPhone}...`, {
                  description: `Calling ${apt.patientName}`,
                })
              }
            >
              <Phone className="size-4 mr-2 text-blue-600" />
              Call Patient
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                toast.info(`Opening series tracker for ${apt.patientName}...`)
              }
            >
              <Repeat className="size-4 mr-2 text-primary" />
              View Care Series
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
