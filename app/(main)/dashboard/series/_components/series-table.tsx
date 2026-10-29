"use client";

import * as React from "react";
import {
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowUpDown,
  Building2,
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  HeartPulse,
  Info,
  MoreHorizontal,
  Repeat,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PatientCareSchedule } from "@/data/care-series-data";
import { getInitials } from "@/lib/utils";

import { SeriesDetailSheet } from "./series-detail-sheet";

const statusFilterOptions = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active Schedule" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const centreFilterOptions = [
  { value: "all", label: "All Centres" },
  { value: "MLCC", label: "MLCC (Lagos)" },
  { value: "MKDC", label: "MKDC (Kano)" },
  { value: "MUDC", label: "MUDC (Umuahia)" },
] as const;

const rescheduleFilterOptions = [
  { value: "all", label: "All Schedules" },
  { value: "reschedule_req", label: "Reschedule Requests Only" },
] as const;

interface SeriesTableProps {
  data: PatientCareSchedule[];
  onDataChange?: (updater: (prev: PatientCareSchedule[]) => PatientCareSchedule[]) => void;
}

export function SeriesTable({ data, onDataChange }: SeriesTableProps) {
  const [selectedSchedule, setSelectedSchedule] = React.useState<PatientCareSchedule | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [centreFilter, setCentreFilter] = React.useState("all");
  const [rescheduleFilter, setRescheduleFilter] = React.useState("all");
  const [sorting, setSorting] = React.useState<"newest" | "progress" | "patient">("newest");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Client filtering
  const filteredData = React.useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.patientName.toLowerCase().includes(q) ||
          s.reference.toLowerCase().includes(q) ||
          s.patientMrn.toLowerCase().includes(q) ||
          s.diagnosis.toLowerCase().includes(q) ||
          s.primaryService.toLowerCase().includes(q) ||
          s.doctorInCharge.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (centreFilter !== "all") {
      result = result.filter((s) => s.centreCode === centreFilter);
    }

    if (rescheduleFilter === "reschedule_req") {
      result = result.filter((s) => s.hasRescheduleRequest);
    }

    if (sorting === "newest") {
      result.sort((a, b) => b.startDate.localeCompare(a.startDate));
    } else if (sorting === "progress") {
      result.sort((a, b) => {
        const pA = a.totalVisits > 0 ? a.completedVisits / a.totalVisits : 0;
        const pB = b.totalVisits > 0 ? b.completedVisits / b.totalVisits : 0;
        return pB - pA;
      });
    } else if (sorting === "patient") {
      result.sort((a, b) => a.patientName.localeCompare(b.patientName));
    }

    return result;
  }, [data, searchQuery, statusFilter, centreFilter, rescheduleFilter, sorting]);

  const totalPages = Math.ceil(filteredData.length / pagination.pageSize);
  const paginatedData = React.useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return filteredData.slice(start, start + pagination.pageSize);
  }, [filteredData, pagination]);

  const handleOpenSheet = (schedule: PatientCareSchedule) => {
    setSelectedSchedule(schedule);
    setSheetOpen(true);
  };

  const handleUpdateSchedule = (updated: PatientCareSchedule) => {
    setSelectedSchedule(updated);
    if (onDataChange) {
      onDataChange((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Reference",
      "Patient Name",
      "MRN",
      "Centre",
      "Service Encounter",
      "Diagnosis",
      "Room",
      "Completed Visits",
      "Total Visits",
      "Next Visit Date",
      "Next Visit Time",
      "Status",
    ];
    const rows = filteredData.map((s) => [
      s.reference,
      `"${s.patientName}"`,
      s.patientMrn,
      s.centreCode,
      `"${s.primaryService}"`,
      `"${s.diagnosis}"`,
      `"${s.room}"`,
      s.completedVisits,
      s.totalVisits,
      s.nextVisitDate,
      s.nextVisitTime,
      s.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `patient_visit_schedules_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Schedule Export Downloaded", {
      description: `Exported ${filteredData.length} patient schedules.`,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patient, MRN, service..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="pl-8 text-xs h-9"
            />
          </div>

          {/* Centre Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 font-normal">
                <Building2 className="size-3.5 text-muted-foreground" />
                <span>
                  {centreFilter === "all" ? "All Centres" : centreFilter}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-xs">Centre Scope</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={centreFilter} onValueChange={setCentreFilter}>
                {centreFilterOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 font-normal">
                <Filter className="size-3.5 text-muted-foreground" />
                <span>
                  {statusFilter === "all"
                    ? "Status"
                    : statusFilterOptions.find((o) => o.value === statusFilter)?.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-xs">Schedule Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                {statusFilterOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reschedule Requests Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={rescheduleFilter === "reschedule_req" ? "destructive" : "outline"}
                size="sm"
                className="h-9 text-xs gap-1.5 font-normal"
              >
                <AlertCircle className="size-3.5" />
                <span>
                  {rescheduleFilter === "reschedule_req" ? "Reschedule Requests" : "Requests"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs">Schedule Adjustments</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={rescheduleFilter} onValueChange={setRescheduleFilter}>
                {rescheduleFilterOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side controls: Sorting & Export */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 font-normal">
                <ArrowUpDown className="size-3.5 text-muted-foreground" />
                <span>Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Sort Schedules</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sorting} onValueChange={(v) => setSorting(v as any)}>
                <DropdownMenuRadioItem value="newest" className="text-xs">
                  Start Date (Newest)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="progress" className="text-xs">
                  Visits Completed %
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="patient" className="text-xs">
                  Patient Name
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={handleExportCSV}>
            <Download className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[240px]">Patient & Identification</TableHead>
              <TableHead className="w-[180px]">Centre & Service Encounter</TableHead>
              <TableHead className="hidden md:table-cell">Diagnosis</TableHead>
              <TableHead className="w-[200px]">Visit Progress & Next</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                  No patient schedules match the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((schedule) => {
                const percent =
                  schedule.totalVisits > 0
                    ? Math.round((schedule.completedVisits / schedule.totalVisits) * 100)
                    : 0;

                return (
                  <TableRow
                    key={schedule.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => handleOpenSheet(schedule)}
                  >
                    {/* Patient Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 rounded-lg border bg-secondary font-semibold text-xs">
                          <AvatarFallback className="rounded-lg text-[11px] font-semibold">
                            {getInitials(schedule.patientName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground hover:underline text-xs block">
                            {schedule.patientName}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                            <span>{schedule.patientMrn}</span>
                            <span>·</span>
                            <span className="text-primary font-medium">{schedule.reference}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Centre & Service */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-bold">
                            {schedule.centreCode}
                          </Badge>
                          <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                            {schedule.primaryService}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {schedule.room}
                        </p>
                      </div>
                    </TableCell>

                    {/* Diagnosis */}
                    <TableCell className="hidden md:table-cell">
                      <p className="text-xs font-medium text-foreground line-clamp-1">
                        {schedule.diagnosis}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Doctor: {schedule.doctorInCharge}
                      </p>
                    </TableCell>

                    {/* Progress */}
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold tabular-nums text-foreground">
                            {schedule.completedVisits} / {schedule.totalVisits} visits
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                            {percent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          Next: <strong className="text-foreground">{schedule.nextVisitDate}</strong> ({schedule.nextVisitTime})
                        </div>
                      </div>
                    </TableCell>

                    {/* Status & Flags */}
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={
                            schedule.status === "COMPLETED"
                              ? "default"
                              : schedule.status === "ACTIVE"
                                ? "outline"
                                : "secondary"
                          }
                          className={
                            schedule.status === "COMPLETED"
                              ? "bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]"
                              : "border-primary text-primary text-[11px]"
                          }
                        >
                          {schedule.status}
                        </Badge>

                        {schedule.hasRescheduleRequest && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <AlertCircle className="size-3" />
                            <span>Reschedule Req.</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenSheet(schedule)}>
                            <Calendar className="mr-2 size-3.5" />
                            View Visit Calendar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenSheet(schedule)}>
                            <Repeat className="mr-2 size-3.5" />
                            Reschedule Dates
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${schedule.patientName} (${schedule.reference}) - ${schedule.completedVisits}/${schedule.totalVisits} visits completed. Next: ${schedule.nextVisitDate} at ${schedule.nextVisitTime}`,
                              );
                              toast.success("Schedule itinerary copied to clipboard");
                            }}
                          >
                            Copy Schedule Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground bg-muted/20">
          <div>
            Showing{" "}
            <strong className="text-foreground">
              {filteredData.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-foreground">
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredData.length)}
            </strong>{" "}
            of <strong className="text-foreground">{filteredData.length}</strong> patient schedules
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={pagination.pageIndex === 0}
              onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="px-1 text-xs">
              Page {pagination.pageIndex + 1} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={pagination.pageIndex >= totalPages - 1}
              onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Sheet */}
      <SeriesDetailSheet
        series={selectedSchedule}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdateSeries={handleUpdateSchedule}
      />
    </div>
  );
}
