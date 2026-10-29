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
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dataTableFeatures } from "@/lib/data-table-features";
import { cn } from "@/lib/utils";
import { updateAppointmentStatusServer } from "@/server/appointments";

import { recentCustomersColumns } from "./columns";
import type { ClinicalAppointmentRow } from "./schema";

const columnWidths: Record<string, string> = {
  select: "w-12 text-center",
  patientName: "w-[24%]",
  serviceName: "w-[18%]",
  centreCode: "w-[15%]",
  timeSlot: "w-[17%]",
  status: "w-[16%]",
  actions: "w-20 text-center",
};

export function RecentCustomersTable({
  data,
  showExport = false,
}: {
  data: ClinicalAppointmentRow[];
  showExport?: boolean;
}) {
  const [activeTab, setActiveTab] = React.useState<"all" | "scheduled" | "confirmed" | "no_show" | "cancelled">("all");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility] = React.useState<ColumnVisibilityState>({
    search: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const filteredData = React.useMemo(() => {
    if (activeTab === "all") return data;
    if (activeTab === "scheduled") {
      return data.filter((d) => d.status === "SCHEDULED" || d.status === "CHECKED_IN");
    }
    if (activeTab === "confirmed") {
      return data.filter((d) => d.status === "CONFIRMED");
    }
    if (activeTab === "no_show") {
      return data.filter((d) => d.status === "NO_SHOW");
    }
    if (activeTab === "cancelled") {
      return data.filter((d) => d.status === "CANCELLED");
    }
    return data;
  }, [data, activeTab]);

  const counts = React.useMemo(() => {
    return {
      all: data.length,
      scheduled: data.filter((d) => d.status === "SCHEDULED" || d.status === "CHECKED_IN").length,
      confirmed: data.filter((d) => d.status === "CONFIRMED").length,
      no_show: data.filter((d) => d.status === "NO_SHOW").length,
      cancelled: data.filter((d) => d.status === "CANCELLED").length,
    };
  }, [data]);

  const table = useTable({
    features: dataTableFeatures,
    data: filteredData,
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
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Filter Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              table.setPageIndex(0);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>All</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                activeTab === "all"
                  ? "bg-muted text-foreground font-semibold"
                  : "bg-muted/40 text-muted-foreground"
              )}
            >
              {counts.all}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("scheduled");
              table.setPageIndex(0);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "scheduled"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Scheduled</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                activeTab === "scheduled"
                  ? "bg-muted text-foreground font-semibold"
                  : "bg-muted/40 text-muted-foreground"
              )}
            >
              {counts.scheduled}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("confirmed");
              table.setPageIndex(0);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "confirmed"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Confirmed</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                activeTab === "confirmed"
                  ? "bg-muted text-foreground font-semibold"
                  : "bg-muted/40 text-muted-foreground"
              )}
            >
              {counts.confirmed}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("no_show");
              table.setPageIndex(0);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "no_show"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>No-Show</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                activeTab === "no_show"
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold"
                  : "bg-muted/40 text-muted-foreground"
              )}
            >
              {counts.no_show}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("cancelled");
              table.setPageIndex(0);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "cancelled"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Cancelled</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                activeTab === "cancelled"
                  ? "bg-destructive/15 text-destructive font-semibold"
                  : "bg-muted/40 text-muted-foreground"
              )}
            >
              {counts.cancelled}
            </span>
          </button>
        </div>

        {/* Right: Batch Actions + Search */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              className="h-9 text-xs cursor-pointer font-medium"
              onClick={async () => {
                const ids = Object.keys(rowSelection);
                for (const id of ids) {
                  if (id && !id.startsWith("mock-") && !id.startsWith("apt-")) {
                    await updateAppointmentStatusServer(id, "CHECKED_IN");
                  }
                }
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("medserve:appointment-sync", {
                      detail: { ids, status: "CHECKED_IN" },
                    })
                  );
                }
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

          {showExport && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs cursor-pointer"
              onClick={() => {
                toast.success("Appointments Exported", {
                  description: `Exported ${filteredData.length} appointments to CSV format.`,
                });
              }}
            >
              <Download className="size-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}

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
        </div>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "h-10 p-3 font-semibold text-xs text-foreground",
                      columnWidths[header.id] ?? ""
                    )}
                  >
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
                  className={cn(
                    "h-14 transition-colors",
                    row.original.status === "CONFIRMED"
                      ? "opacity-55 bg-muted/30 hover:bg-muted/35"
                      : row.original.status === "CANCELLED"
                      ? "opacity-45 bg-muted/20"
                      : "hover:bg-muted/40"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "p-3 text-xs",
                        cell.column.id === "select" || cell.column.id === "actions"
                          ? "text-center"
                          : ""
                      )}
                    >
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
