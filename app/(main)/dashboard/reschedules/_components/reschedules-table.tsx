"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RescheduleRequest } from "@/data/reschedules-data";

import { ResolveRescheduleDialog } from "./resolve-reschedule-dialog";

interface ReschedulesTableProps {
  data: RescheduleRequest[];
  onDataChange: React.Dispatch<React.SetStateAction<RescheduleRequest[]>>;
}

export function ReschedulesTable({ data, onDataChange }: ReschedulesTableProps) {
  const [selectedRequest, setSelectedRequest] = React.useState<RescheduleRequest | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<"all" | "pending" | "urgent" | "resolved">("pending");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [centreFilter, setCentreFilter] = React.useState<string>("all");

  const filteredData = React.useMemo(() => {
    let result = [...data];

    // Status / urgency tab filter
    if (activeTab === "pending") {
      result = result.filter((r) => r.status === "PENDING");
    } else if (activeTab === "urgent") {
      result = result.filter(
        (r) => r.urgency === "URGENT" || r.urgency === "CRITICAL_BREAK",
      );
    } else if (activeTab === "resolved") {
      result = result.filter((r) => r.status !== "PENDING");
    }

    // Centre filter
    if (centreFilter !== "all") {
      result = result.filter((r) => r.centreCode === centreFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.mrn.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.phone.includes(q),
      );
    }

    return result;
  }, [data, activeTab, centreFilter, searchQuery]);

  const handleRowClick = (req: RescheduleRequest) => {
    setSelectedRequest(req);
    setDialogOpen(true);
  };

  const handleResolved = (requestId: string, newStatus: "APPROVED" | "DECLINED") => {
    onDataChange((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r)),
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Tabs & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-muted/60 p-1 border">
            <TabsTrigger value="pending" className="text-xs">
              Pending Review (
              {data.filter((r) => r.status === "PENDING").length}
              )
            </TabsTrigger>
            <TabsTrigger value="urgent" className="text-xs">
              Urgent / Break (
              {
                data.filter(
                  (r) =>
                    r.urgency === "URGENT" || r.urgency === "CRITICAL_BREAK",
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">
              Resolved (
              {data.filter((r) => r.status !== "PENDING").length}
              )
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All Requests ({data.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2.5">
          <Select value={centreFilter} onValueChange={setCentreFilter}>
            <SelectTrigger className="w-[170px] h-9 text-xs">
              <SelectValue placeholder="All Centres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Centres</SelectItem>
              <SelectItem value="MLCC">MLCC (Lagos)</SelectItem>
              <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
              <SelectItem value="MUDC">MUDC (Umuahia)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient name, MRN, request ref, reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 text-sm"
        />
      </div>

      {/* Requests Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[130px] font-semibold text-sm text-foreground py-3.5">
                Request Ref
              </TableHead>
              <TableHead className="w-[120px] font-semibold text-sm text-foreground py-3.5">
                Patient Ref
              </TableHead>
              <TableHead className="font-semibold text-sm text-foreground py-3.5">
                Patient Name
              </TableHead>
              <TableHead className="w-[180px] font-semibold text-sm text-foreground py-3.5">
                Current Scheduled Slot
              </TableHead>
              <TableHead className="w-[190px] font-semibold text-sm text-foreground py-3.5">
                Requested New Slot
              </TableHead>
              <TableHead className="w-[100px] font-semibold text-sm text-foreground py-3.5">
                Centre
              </TableHead>
              <TableHead className="font-semibold text-sm text-foreground py-3.5">
                Reason & Triage Urgency
              </TableHead>
              <TableHead className="w-[110px] text-right font-semibold text-sm text-foreground py-3.5">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No reschedule requests found in this view.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((req) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => handleRowClick(req)}
                >
                  {/* 1. Request Ref */}
                  <TableCell className="font-mono text-sm font-semibold text-foreground py-3.5">
                    {req.reference}
                  </TableCell>

                  {/* 2. Patient Ref (plain text, no pill) */}
                  <TableCell className="font-mono text-sm font-semibold text-primary py-3.5">
                    {req.mrn}
                  </TableCell>

                  {/* 3. Patient Name */}
                  <TableCell className="py-3.5">
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors block">
                      {req.patientName}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {req.phone}
                    </span>
                  </TableCell>

                  {/* 4. Current Slot */}
                  <TableCell className="text-sm font-mono text-muted-foreground py-3.5">
                    <span className="block text-foreground font-medium">
                      {req.currentDate}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {req.currentTimeSlot}
                    </span>
                  </TableCell>

                  {/* 5. Requested New Slot */}
                  <TableCell className="text-sm font-mono text-primary py-3.5 font-medium">
                    <span className="block font-semibold">
                      {req.requestedDate}
                    </span>
                    <span className="text-xs text-primary/80">
                      {req.requestedTimeSlot}
                    </span>
                  </TableCell>

                  {/* 6. Centre */}
                  <TableCell className="py-3.5">
                    <Badge
                      variant="outline"
                      className={
                        req.centreCode === "MLCC"
                          ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-xs font-semibold"
                          : req.centreCode === "MKDC"
                            ? "border-blue-500/30 text-blue-600 bg-blue-500/10 text-xs font-semibold"
                            : "border-purple-500/30 text-purple-600 bg-purple-500/10 text-xs font-semibold"
                      }
                    >
                      {req.centreCode}
                    </Badge>
                  </TableCell>

                  {/* 7. Reason & Urgency */}
                  <TableCell className="py-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={
                            req.urgency === "CRITICAL_BREAK"
                              ? "text-red-600 bg-red-500/10 border-red-500/20 text-[10px] font-semibold"
                              : req.urgency === "URGENT"
                                ? "text-amber-600 bg-amber-500/10 border-amber-500/20 text-[10px] font-semibold"
                                : "text-blue-600 bg-blue-500/10 border-blue-500/20 text-[10px]"
                          }
                        >
                          {req.urgency.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          by {req.requestedBy.toLowerCase()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-1">
                        {req.reason}
                      </p>
                    </div>
                  </TableCell>

                  {/* 8. Status */}
                  <TableCell className="text-right py-3.5">
                    {req.status === "PENDING" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Review
                      </span>
                    ) : req.status === "APPROVED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="size-3.5" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                        <XCircle className="size-3.5" />
                        Declined
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Resolution Dialog */}
      <ResolveRescheduleDialog
        request={selectedRequest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onResolved={handleResolved}
      />
    </div>
  );
}
