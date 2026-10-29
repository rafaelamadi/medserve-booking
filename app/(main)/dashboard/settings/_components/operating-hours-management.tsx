"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  Info,
  Save,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  OPERATING_HOURS_RULES,
  type OperatingScheduleRule,
} from "@/data/centre-settings-data";

export function OperatingHoursManagement() {
  const [rules, setRules] = React.useState<OperatingScheduleRule[]>(OPERATING_HOURS_RULES);
  const [selectedScope, setSelectedScope] = React.useState<string>("ALL");

  const handleToggleOpen = (day: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.dayOfWeek !== day) return r;
        const nextState = !r.isOpen;
        toast.info(`${day} Hours Updated`, {
          description: `${day} is now marked as ${nextState ? "OPEN" : "CLOSED"} for routine clinical slots.`,
        });
        return { ...r, isOpen: nextState };
      }),
    );
  };

  const handleTimeChange = (
    day: string,
    field: "openTime" | "closeTime" | "firstSlot" | "lastSlot",
    val: string,
  ) => {
    setRules((prev) =>
      prev.map((r) => (r.dayOfWeek === day ? { ...r, [field]: val } : r)),
    );
  };

  const handleSaveAll = () => {
    toast.success("Operating Hours & Booking Engine Synchronized", {
      description: "Slot duration and operating window updated across all centre booking calendars.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Operating Hours & Treatment Slot Duration
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure clinic opening times, first/last appointment slots, and machine booking intervals
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Select value={selectedScope} onValueChange={setSelectedScope}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Centres (Global)</SelectItem>
              <SelectItem value="MLCC">MLCC (Lagos)</SelectItem>
              <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
              <SelectItem value="MUDC">MUDC (Umuahia)</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={handleSaveAll}>
            <Save className="size-3.5" />
            Save Configuration
          </Button>
        </div>
      </div>

      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground">
            Weekly Schedule Matrix
          </CardTitle>
          <CardDescription className="text-xs">
            Standard appointment slots are scheduled in 15-minute intervals. Weekends default to emergency on-call protocols.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[160px] font-semibold text-xs">Day of Week</TableHead>
                <TableHead className="w-[130px] font-semibold text-xs">Status</TableHead>
                <TableHead className="font-semibold text-xs">Doors Open</TableHead>
                <TableHead className="font-semibold text-xs">Doors Close</TableHead>
                <TableHead className="font-semibold text-xs">First Slot</TableHead>
                <TableHead className="font-semibold text-xs">Last Slot</TableHead>
                <TableHead className="w-[140px] font-semibold text-xs">Slot Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.dayOfWeek} className={!rule.isOpen ? "bg-muted/20 opacity-70" : ""}>
                  <TableCell className="font-medium text-xs">
                    {rule.dayOfWeek}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isOpen}
                        onCheckedChange={() => handleToggleOpen(rule.dayOfWeek)}
                      />
                      <span className="text-xs font-medium">
                        {rule.isOpen ? (
                          <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20 text-[10px]">
                            Open
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground bg-muted text-[10px]">
                            Closed
                          </Badge>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      disabled={!rule.isOpen}
                      value={rule.openTime}
                      onChange={(e) => handleTimeChange(rule.dayOfWeek, "openTime", e.target.value)}
                      className="h-8 w-28 text-xs font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      disabled={!rule.isOpen}
                      value={rule.closeTime}
                      onChange={(e) => handleTimeChange(rule.dayOfWeek, "closeTime", e.target.value)}
                      className="h-8 w-28 text-xs font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      disabled={!rule.isOpen}
                      value={rule.firstSlot}
                      onChange={(e) => handleTimeChange(rule.dayOfWeek, "firstSlot", e.target.value)}
                      className="h-8 w-28 text-xs font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      disabled={!rule.isOpen}
                      value={rule.lastSlot}
                      onChange={(e) => handleTimeChange(rule.dayOfWeek, "lastSlot", e.target.value)}
                      className="h-8 w-28 text-xs font-mono"
                    />
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {rule.isOpen ? `${rule.slotDurationMinutes} mins` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-blue-500/[0.03] border-blue-500/20 p-4 flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Calendar Coordination Note
          </p>
          <p>
            When a day is closed or marked as a weekend in this schedule, the Care Series Itinerary Generator and Patient Visit Calendar will automatically bypass it and advance visits to the next available weekday slot.
          </p>
        </div>
      </div>
    </div>
  );
}
