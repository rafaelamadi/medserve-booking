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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  Search,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dataTableFeatures } from "@/lib/data-table-features";

import { recentCustomersColumns } from "./columns";
import type { ClinicalAppointmentRow } from "./schema";

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

const sortOptions = [
  { value: "earliest", label: "Earliest slot" },
  { value: "latest", label: "Latest slot" },
  { value: "patient-asc", label: "Patient A-Z" },
  { value: "patient-desc", label: "Patient Z-A" },
] as const;

const sortOptionState = {
  earliest: [{ id: "timeSlot", desc: false }],
  latest: [{ id: "timeSlot", desc: true }],
  "patient-asc": [{ id: "patientName", desc: false }],
  "patient-desc": [{ id: "patientName", desc: true }],
} satisfies Record<(typeof sortOptions)[number]["value"], SortingState>;

export function RecentCustomersTable({ data }: { data: ClinicalAppointmentRow[] }) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "timeSlot", desc: false }]);
  const [columnVisibility] = React.useState<ColumnVisibilityState>({
    search: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: recentCustomersColumns,
    state: {
      rowSelection,
      columnFilters,
      sorting,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  const searchFilter = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string) ?? "all";
  const centreFilter = (table.getColumn("centreCode")?.getFilterValue() as string) ?? "all";

  const sortValue = React.useMemo(() => {
    const current = sorting[0];
    if (!current) return "earliest";
    for (const [key, value] of Object.entries(sortOptionState)) {
      if (value[0]?.id === current.id && value[0]?.desc === current.desc) {
        return key;
      }
    }
    return "earliest";
  }, [sorting]);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search reference, patient, phone..."
              value={searchFilter}
              size="sm"
              className="pl-8 h-9 text-xs"
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <UsersRound className="size-3.5 mr-1" />
                Status: {statusOptions.find((s) => s.value === statusFilter)?.label ?? "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="start">
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(value) => {
                  table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value);
                  table.setPageIndex(0);
                }}
              >
                {statusOptions.map((status) => (
                  <DropdownMenuRadioItem key={status.value} value={status.value} className="text-xs">
                    {status.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <Building2 className="size-3.5 mr-1" />
                Centre: {centreOptions.find((c) => c.value === centreFilter)?.label ?? "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="start">
              <DropdownMenuRadioGroup
                value={centreFilter}
                onValueChange={(value) => {
                  table.getColumn("centreCode")?.setFilterValue(value === "all" ? undefined : value);
                  table.setPageIndex(0);
                }}
              >
                {centreOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              className="h-9 text-xs"
              onClick={() => {
                toast.success(`Checked In ${selectedCount} selected patients`, {
                  description: "Status updated in clinical waiting area.",
                });
                setRowSelection({});
              }}
            >
              <UserCheck className="size-3.5 mr-1 text-emerald-600" />
              Check In ({selectedCount})
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <ArrowUpDown className="size-3.5 mr-1" />
                Sort: {sortOptions.find((s) => s.value === sortValue)?.label ?? "Earliest"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuRadioGroup
                value={sortValue}
                onValueChange={(value) => {
                  table.setSorting(sortOptionState[value as keyof typeof sortOptionState] ?? sortOptionState.earliest);
                  table.setPageIndex(0);
                }}
              >
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan} className="h-10 p-3 font-semibold text-xs text-foreground">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-14 hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-3 text-xs">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={recentCustomersColumns.length} className="h-24 text-center text-xs text-muted-foreground">
                  No appointments found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="text-muted-foreground text-xs">
          Showing {table.getRowModel().rows.length} of {data.length} appointments
          {selectedCount > 0 ? ` · ${selectedCount} selected` : ""}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="text-xs font-medium px-1">
            Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
