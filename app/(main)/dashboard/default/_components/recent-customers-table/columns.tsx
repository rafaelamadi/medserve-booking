"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Subscribe } from "@tanstack/react-table";
import {
  CheckCircle2,
  Clock,
  Mail,
  MoreHorizontal,
  Stethoscope,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppointmentDetailSheet } from "../../../appointments/_components/appointment-detail-sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { updateAppointmentStatusServer } from "@/server/appointments";
import { sendPatientEmailNoticeServer } from "@/server/patients";
import {
  EMAIL_TEMPLATE_LIST,
  type EmailTemplateKey,
  renderEmailTemplate,
} from "@/shared/templates/email-templates";

import type { ClinicalAppointmentRow } from "./schema";

function statusBadge(status: string) {
  switch (status) {
    case "CHECKED_IN":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-medium">
          <UserCheck className="size-3" />
          Checked In
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 font-medium">
          <CheckCircle2 className="size-3" />
          Confirmed
        </Badge>
      );
    case "NO_SHOW":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-medium">
          <UserX className="size-3" />
          No-Show
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="text-destructive border-destructive/30 gap-1 bg-destructive/5 font-medium">
          <XCircle className="size-3" />
          Cancelled by Patient
        </Badge>
      );
    case "SCHEDULED":
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground gap-1">
          <Clock className="size-3" />
          Scheduled
        </Badge>
      );
  }
}

function formatBookedDate(scheduledTime?: string) {
  if (!scheduledTime) return "29 Oct 2026";
  try {
    const d = new Date(scheduledTime);
    if (isNaN(d.getTime())) return "29 Oct 2026";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "29 Oct 2026";
  }
}

function SendEmailDialog({
  apt,
  open,
  onOpenChange,
}: {
  apt: ClinicalAppointmentRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const patientEmail =
    apt.patientEmail ||
    `${apt.patientName.toLowerCase().replace(/[^a-z0-9]/g, ".")}@example.com`;

  const cleanServiceName = apt.serviceName.replace(/\s*\([^)]*\)/g, "").trim();

  const [template, setTemplate] = useState<EmailTemplateKey>("APPOINTMENT_CONFIRMATION");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const templateCtx = useMemo(() => {
    return {
      patientName: apt.patientName,
      patientEmail,
      patientMrn: apt.patientMrn,
      centreName: apt.centreName,
      centreCode: apt.centreCode,
      serviceName: cleanServiceName,
      timeSlot: apt.timeSlot,
      reference: apt.reference,
    };
  }, [apt, patientEmail, cleanServiceName]);

  useEffect(() => {
    const rendered = renderEmailTemplate(template, templateCtx);
    setSubject(rendered.subject);
    setMessage(rendered.body);
  }, [template, templateCtx]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSending(true);
      const res = await sendPatientEmailNoticeServer(
        apt.patientMrn || apt.patientName,
        subject,
        message,
        template
      );

      if (res.success) {
        onOpenChange(false);
        toast.success("Email Dispatched & Logged", {
          description: `Dispatched "${subject}" to ${patientEmail} and logged permanently in Supabase.`,
        });
      } else {
        toast.error("Dispatch Failed", {
          description: res.error || "Could not log notification in Supabase.",
        });
      }
    } catch (err) {
      console.error("Error dispatching email:", err);
      toast.error("An unexpected error occurred while sending email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            Send Email to Patient
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send dynamic appointment confirmation, completion notice, or custom message to {apt.patientName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-3.5 py-1">
          <div className="rounded-md border bg-muted/40 p-2.5 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Recipient:</span>
              <span className="font-semibold text-foreground">
                {apt.patientName} &lt;{patientEmail}&gt;
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Service & Centre:</span>
              <span className="text-foreground">
                {cleanServiceName} • {apt.centreCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Time Slot:</span>
              <span className="font-mono font-medium text-foreground">{apt.timeSlot}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Choose Template / Message Type</Label>
            <Select
              value={template}
              onValueChange={(val: any) => setTemplate(val as EmailTemplateKey)}
            >
              <SelectTrigger className="w-full h-8.5 text-xs font-medium cursor-pointer text-left">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATE_LIST.map((tpl) => (
                  <SelectItem key={tpl.key} value={tpl.key} className="text-xs py-1.5 cursor-pointer font-medium">
                    {tpl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Subject Line</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-8.5 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Message Body</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="text-xs leading-relaxed resize-none"
              required
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8.5 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSending}
              className="h-8.5 text-xs gap-1.5 cursor-pointer font-medium"
            >
              <Mail className="size-3.5" />
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AppointmentActionsCell({ apt }: { apt: ClinicalAppointmentRow }) {
  const [currentStatus, setCurrentStatus] = useState(apt.status);
  const [emailOpen, setEmailOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setCurrentStatus(apt.status);
  }, [apt.status]);

  const handleStatusChange = async (newStatus: "SCHEDULED" | "CHECKED_IN" | "CONFIRMED" | "NO_SHOW") => {
    setCurrentStatus(newStatus);
    const labelMap: Record<string, string> = {
      SCHEDULED: "Scheduled",
      CHECKED_IN: "Checked In",
      CONFIRMED: "Confirmed (Session Done)",
      NO_SHOW: "No-Show",
    };
    toast.success("Appointment Status Updated", {
      description: `${apt.patientName} marked as ${labelMap[newStatus] || newStatus}.`,
    });

    if (apt.id && !apt.id.startsWith("mock-") && !apt.id.startsWith("apt-")) {
      await updateAppointmentStatusServer(apt.id, newStatus);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("medserve:appointment-sync", {
          detail: { reference: apt.reference, status: newStatus },
        })
      );
    }
  };

  const isCancelled = currentStatus === "CANCELLED";
  const isConfirmed = currentStatus === "CONFIRMED";

  if (isConfirmed) {
    return (
      <div className="flex items-center justify-center">
        <Button
          disabled
          aria-label={`Session completed for ${apt.patientName} - no actions permitted`}
          className="text-muted-foreground/30 cursor-not-allowed size-8 rounded-md"
          size="icon-sm"
          variant="ghost"
          title="Session completed — no actions permitted"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center">
        <Button
          disabled
          aria-label={`Cancelled by patient for ${apt.patientName}`}
          className="text-muted-foreground/30 cursor-not-allowed size-8 rounded-md"
          size="icon-sm"
          variant="ghost"
          title="Cancelled by patient"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Open actions for ${apt.patientName}`}
            className="text-muted-foreground hover:bg-muted/50 size-8 rounded-md cursor-pointer"
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            className="cursor-pointer font-medium"
            onClick={() => setSheetOpen(true)}
          >
            <Stethoscope className="size-4 mr-2 text-primary" />
            View Clinical Details
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer font-medium"
            onClick={() => setEmailOpen(true)}
          >
            <Mail className="size-4 mr-2 text-primary" />
            Send Email
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          {currentStatus !== "CHECKED_IN" && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => handleStatusChange("CHECKED_IN")}
            >
              <UserCheck className="size-4 mr-2 text-emerald-600" />
              Check In Patient
            </DropdownMenuItem>
          )}
          {currentStatus !== "CONFIRMED" && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => handleStatusChange("CONFIRMED")}
            >
              <CheckCircle2 className="size-4 mr-2 text-blue-600" />
              Mark Confirmed (Done)
            </DropdownMenuItem>
          )}
          {currentStatus !== "NO_SHOW" && (
            <DropdownMenuItem
              className="cursor-pointer text-amber-700 dark:text-amber-400 focus:text-amber-700"
              onClick={() => handleStatusChange("NO_SHOW")}
            >
              <UserX className="size-4 mr-2" />
              Mark as No-Show
            </DropdownMenuItem>
          )}
          {currentStatus !== "SCHEDULED" && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => handleStatusChange("SCHEDULED")}
            >
              <Clock className="size-4 mr-2 text-muted-foreground" />
              Mark Scheduled
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SendEmailDialog
        apt={{ ...apt, status: currentStatus }}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />

      <AppointmentDetailSheet
        appointment={{ ...apt, status: currentStatus as any }}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={(id: string, status: any) => handleStatusChange(status)}
      />
    </div>
  );
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
    cell: ({ row }) => {
      const isLocked =
        row.original.status === "CONFIRMED" ||
        row.original.status === "CANCELLED" ||
        row.original.status === "CHECKED_IN";

      return (
        <div className="flex items-center justify-center">
          <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
            {(checked) => (
              <Checkbox
                checked={checked}
                disabled={isLocked}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={`Select appointment for ${row.original.patientName}`}
              />
            )}
          </Subscribe>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "patientName",
    header: "Patient Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="truncate text-sm font-medium text-foreground">
          {row.original.patientName}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.patientMrn}
        </span>
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
    header: "Service",
    cell: ({ row }) => {
      // Clean service name strictly without bracketed codes
      const cleanService = row.original.serviceName.replace(/\s*\([^)]*\)/g, "").trim();
      return (
        <span className="text-xs font-semibold text-foreground truncate">{cleanService}</span>
      );
    },
  },
  {
    accessorKey: "centreCode",
    header: "Centre",
    filterFn: "equalsString",
    cell: ({ row }) => {
      const centreLabel =
        row.original.centreCode === "MLCC"
          ? "MLCC (Lagos)"
          : row.original.centreCode === "MKDC"
          ? "MKDC (Kano)"
          : "MUDC (Umuahia)";
      return (
        <span className="text-xs font-medium text-foreground">
          {centreLabel}
        </span>
      );
    },
  },
  {
    accessorKey: "timeSlot",
    header: "Time",
    cell: ({ row }) => {
      const dateStr = formatBookedDate(row.original.scheduledTime);
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-foreground">{dateStr}</span>
          <span className="font-mono text-xs text-muted-foreground">{row.original.timeSlot}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => statusBadge(row.original.status),
  },
  {
    id: "actions",
    header: () => <div className="text-center">Action</div>,
    cell: ({ row }) => <AppointmentActionsCell apt={row.original} />,
  },
];
