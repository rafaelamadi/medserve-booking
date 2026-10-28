"use client";

import * as React from "react";
import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  HeartPulse,
  Repeat,
  Search,
  Stethoscope,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AppointmentStatus, ClinicalAppointment } from "@/data/clinical-queue-data";
import { dataTableFeatures } from "@/lib/data-table-features";
import { getInitials } from "@/lib/utils";

import { AppointmentDetailSheet } from "./appointment-detail-sheet";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "IN_TREATMENT", label: "In Treatment" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "RESCHEDULE_REQUESTED", label: "Reschedule Req." },
] as const;

const centreOptions = [
  { value: "all", label: "All Centres" },
  { value: "MLCC", label: "MLCC (Lagos)" },
  { value: "MKDC", label: "MKDC (Kano)" },
  { value: "MUDC", label: "MUDC (Abuja)" },
] as const;

const modalityOptions = [
  { value: "all", label: "All Modalities" },
  { value: "Radiotherapy", label: "Radiotherapy" },
  { value: "Chemotherapy", label: "Chemotherapy" },
  { value: "Consultation", label: "Consultation" },
  { value: "Imaging", label: "CT Simulation" },
] as const;

const dateFilterOptions = [
  { value: "all", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This Week" },
] as const;

interface AppointmentsTableProps {
  data: ClinicalAppointment[];
  onDataChange?: (updater: (prev: ClinicalAppointment[]) => ClinicalAppointment[]) => void;
}

export function AppointmentsTable({ data, onDataChange }: AppointmentsTableProps) {
  const [selectedAppointment, setSelectedAppointment] = React.useState<ClinicalAppointment | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [centreFilter, setCentreFilter] = React.useState("all");
  const [modalityFilter, setModalityFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [sorting, setSorting] = React.useState<"earliest" | "latest" | "patient">("earliest");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Client-side filtering across criteria
  const filteredData = React.useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.reference.toLowerCase().includes(q) ||
          a.patientPhone.includes(q) ||
          a.patientMrn.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (centreFilter !== "all") {
      result = result.filter((a) => a.centreCode === centreFilter);
    }

    if (modalityFilter !== "all") {
      result = result.filter((a) => a.modality === modalityFilter);
    }

    if (dateFilter !== "all") {
      result = result.filter((a) => a.dateCategory === dateFilter);
    }

    if (sorting === "earliest") {
      result.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    } else if (sorting === "latest") {
      result.sort((a, b) => b.timeSlot.localeCompare(a.timeSlot));
    } else if (sorting === "patient") {
      result.sort((a, b) => a.patientName.localeCompare(b.patientName));
    }

    return result;
  }, [data, searchQuery, statusFilter, centreFilter, modalityFilter, dateFilter, sorting]);

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pagination.pageSize));
  const currentPage = Math.min(pagination.pageIndex, pageCount - 1);
  const pagedRows = React.useMemo(() => {
    const start = currentPage * pagination.pageSize;
    return filteredData.slice(start, start + pagination.pageSize);
  }, [filteredData, currentPage, pagination.pageSize]);

  const selectedCount = Object.keys(rowSelection).length;

  const handleRowClick = (apt: ClinicalAppointment) => {
    setSelectedAppointment(apt);
    setSheetOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
    onDataChange?.((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );
    if (selectedAppointment && selectedAppointment.id === id) {
      setSelectedAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleBulkCheckIn = () => {
    const ids = Object.keys(rowSelection);
    onDataChange?.((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, status: "CHECKED_IN" as AppointmentStatus } : a)),
    );
    toast.success(`Bulk Check-in Complete`, {
      description: `Checked in ${ids.length} selected patients.`,
    });
    setRowSelection({});
  };

  const handleExport = () => {
    toast.success("Appointments Exported", {
      description: `Exported ${filteredData.length} appointments to CSV format.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter and Action Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search patient, MRN, ref, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              size="sm"
              className="pl-8 h-9 text-xs"
            />
          </div>

          {/* Centre selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <Building2 className="size-3.5 mr-1" />
                {centreOptions.find((c) => c.value === centreFilter)?.label ?? "All Centres"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="start">
              <DropdownMenuRadioGroup value={centreFilter} onValueChange={(v) => { setCentreFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
                {centreOptions.map((c) => (
                  <DropdownMenuRadioItem key={c.value} value={c.value} className="text-xs">
                    {c.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Modality selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <Repeat className="size-3.5 mr-1" />
                {modalityOptions.find((m) => m.value === modalityFilter)?.label ?? "All Modalities"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="start">
              <DropdownMenuRadioGroup value={modalityFilter} onValueChange={(v) => { setModalityFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
                {modalityOptions.map((m) => (
                  <DropdownMenuRadioItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <UsersRound className="size-3.5 mr-1" />
                {statusOptions.find((s) => s.value === statusFilter)?.label ?? "All Statuses"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="start">
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
                {statusOptions.map((s) => (
                  <DropdownMenuRadioItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date range selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <Calendar className="size-3.5 mr-1" />
                {dateFilterOptions.find((d) => d.value === dateFilter)?.label ?? "All Dates"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuRadioGroup value={dateFilter} onValueChange={(v) => { setDateFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
                {dateFilterOptions.map((d) => (
                  <DropdownMenuRadioItem key={d.value} value={d.value} className="text-xs">
                    {d.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button size="sm" variant="secondary" className="h-9 text-xs" onClick={handleBulkCheckIn}>
              <UserCheck className="size-3.5 mr-1.5 text-emerald-600" />
              Check In ({selectedCount})
            </Button>
          )}

          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleExport}>
            <Download className="size-3.5 mr-1.5" />
            Export CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <ArrowUpDown className="size-3.5 mr-1.5" />
                Sort: {sorting === "earliest" ? "Earliest" : sorting === "latest" ? "Latest" : "Patient"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuRadioGroup value={sorting} onValueChange={(v) => setSorting(v as "earliest" | "latest" | "patient")}>
                {[
                  { value: "earliest", label: "Earliest slot" },
                  { value: "latest", label: "Latest slot" },
                  { value: "patient", label: "Patient A-Z" },
                ].map((s) => (
                  <DropdownMenuRadioItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="h-10">
              <TableHead className="w-10 px-3">
                <Checkbox
                  checked={selectedCount === pagedRows.length && pagedRows.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const sel: RowSelectionState = {};
                      pagedRows.forEach((r) => (sel[r.id] = true));
                      setRowSelection(sel);
                    } else {
                      setRowSelection({});
                    }
                  }}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground px-3">Patient</TableHead>
              <TableHead className="text-xs font-semibold text-foreground px-3">Modality & Regimen</TableHead>
              <TableHead className="text-xs font-semibold text-foreground px-3">Centre & Vault</TableHead>
              <TableHead className="text-xs font-semibold text-foreground px-3">Time Slot</TableHead>
              <TableHead className="text-xs font-semibold text-foreground px-3">Status</TableHead>
              <TableHead className="text-xs font-semibold text-foreground px-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRows.length > 0 ? (
              pagedRows.map((apt) => {
                const isSelected = Boolean(rowSelection[apt.id]);
                return (
                  <TableRow
                    key={apt.id}
                    data-state={isSelected && "selected"}
                    className="h-15 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => handleRowClick(apt)}
                  >
                    <TableCell className="px-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(c) => {
                          setRowSelection((prev) => {
                            const next = { ...prev };
                            if (c) next[apt.id] = true;
                            else delete next[apt.id];
                            return next;
                          });
                        }}
                        aria-label={`Select ${apt.patientName}`}
                      />
                    </TableCell>

                    <TableCell className="px-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8.5 rounded-lg bg-primary/10 text-primary font-semibold text-xs border border-primary/20 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(apt.patientName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm text-foreground truncate hover:underline">
                              {apt.patientName}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">{apt.patientMrn}</span>
                          </div>
                          <div className="text-muted-foreground text-xs">{apt.patientPhone}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {apt.modality === "Radiotherapy" ? (
                            <Repeat className="size-3 text-primary" />
                          ) : apt.modality === "Chemotherapy" ? (
                            <HeartPulse className="size-3 text-blue-500" />
                          ) : (
                            <Stethoscope className="size-3 text-emerald-500" />
                          )}
                          <span className="text-xs font-semibold text-foreground truncate">{apt.serviceName}</span>
                        </div>
                        {apt.fractionInfo ? (
                          <span className="text-[11px] text-primary font-medium block">{apt.fractionInfo}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-mono block">{apt.reference}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                            {apt.centreCode}
                          </Badge>
                          <span className="text-xs text-foreground font-medium">{apt.room}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block truncate">{apt.oncologist}</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-3">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-semibold text-foreground block">{apt.timeSlot}</span>
                        <span className="text-[11px] text-muted-foreground block">{apt.durationMinutes} mins</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-3">
                      {apt.status === "IN_TREATMENT" && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 font-semibold text-[11px]">
                          <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                          In Treatment
                        </Badge>
                      )}
                      {apt.status === "CHECKED_IN" && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold text-[11px]">
                          <UserCheck className="size-3" />
                          Checked In
                        </Badge>
                      )}
                      {apt.status === "SCHEDULED" && (
                        <Badge variant="outline" className="text-muted-foreground text-[11px]">
                          Scheduled
                        </Badge>
                      )}
                      {apt.status === "CONFIRMED" && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[11px]">
                          Confirmed
                        </Badge>
                      )}
                      {apt.status === "COMPLETED" && (
                        <Badge variant="secondary" className="text-muted-foreground text-[11px]">
                          Completed
                        </Badge>
                      )}
                      {apt.status === "RESCHEDULE_REQUESTED" && (
                        <Badge variant="destructive" className="text-[11px] font-semibold">
                          Reschedule Req.
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => handleRowClick(apt)}
                      >
                        Clinical Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                  No appointments match the selected clinical filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground pt-1">
        <div>
          Showing {pagedRows.length} of {filteredData.length} appointments
          {selectedCount > 0 ? ` · ${selectedCount} selected` : ""}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            className="size-8"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-medium px-1">
            Page {currentPage + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            className="size-8"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.min(pageCount - 1, p.pageIndex + 1) }))}
            disabled={currentPage >= pageCount - 1}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Interactive slide-over drawer */}
      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
