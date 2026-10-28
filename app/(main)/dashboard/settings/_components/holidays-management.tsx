"use client";

import * as React from "react";
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  NIGERIAN_HOLIDAYS_DATA,
  type CentreHoliday,
} from "@/data/centre-settings-data";

export function HolidaysManagement() {
  const [holidays, setHolidays] = React.useState<CentreHoliday[]>(NIGERIAN_HOLIDAYS_DATA);
  const [addOpen, setAddOpen] = React.useState(false);

  // Form state
  const [date, setDate] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<"NATIONAL_PUBLIC_HOLIDAY" | "RELIGIOUS_HOLIDAY" | "CENTRE_MAINTENANCE">("NATIONAL_PUBLIC_HOLIDAY");
  const [centreScope, setCentreScope] = React.useState<"ALL" | "MLCC" | "MKDC" | "MUDC">("ALL");
  const [description, setDescription] = React.useState("");
  const [closed, setClosed] = React.useState(true);

  const handleToggleClosed = (holidayId: string) => {
    setHolidays((prev) =>
      prev.map((h) => {
        if (h.id !== holidayId) return h;
        const nextState = !h.closed;
        toast.info(`Holiday Closure Updated: ${h.title}`, {
          description: `Centres are now ${nextState ? "CLOSED" : "OPEN"} on ${h.date}.`,
        });
        return { ...h, closed: nextState };
      }),
    );
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("Please enter a holiday title and date.");
      return;
    }

    const newHoliday: CentreHoliday = {
      id: `hol-${Date.now()}`,
      date,
      title,
      type,
      centreScope,
      closed,
      description: description || "Scheduled blackout / centre closure.",
    };

    setHolidays((prev) =>
      [...prev, newHoliday].sort((a, b) => a.date.localeCompare(b.date)),
    );

    toast.success("Closure Date Registered", {
      description: `${title} (${date}) has been added to the multi-centre booking calendar.`,
    });
    setAddOpen(false);
    setTitle("");
    setDate("");
    setDescription("");
  };

  const handleDelete = (holidayId: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
    toast.info("Holiday Removed", {
      description: "Date has been restored to standard booking schedule.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Centre Holidays & Blackout Dates (2026)
          </h2>
          <p className="text-sm text-muted-foreground">
            Nigerian statutory public holidays, religious observances, and scheduled engineering downtime where visits are greyed out
          </p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5 text-xs">
              <Plus className="size-3.5" />
              Add Blackout Date
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Centre Holiday or Maintenance Blackout</DialogTitle>
              <DialogDescription>
                Dates added here will be faded and greyed out on the Patient Visit Calendar and excluded by the auto-scheduler.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddHoliday} className="space-y-3.5 py-2">
              <div className="space-y-1">
                <Label htmlFor="h-title">Holiday / Event Title</Label>
                <Input
                  id="h-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Linac Bi-Annual QA Blackout"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="h-date">Calendar Date</Label>
                  <Input
                    id="h-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="h-type">Event Classification</Label>
                  <Select
                    value={type}
                    onValueChange={(val: "NATIONAL_PUBLIC_HOLIDAY" | "RELIGIOUS_HOLIDAY" | "CENTRE_MAINTENANCE") => setType(val)}
                  >
                    <SelectTrigger id="h-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATIONAL_PUBLIC_HOLIDAY">Public Holiday</SelectItem>
                      <SelectItem value="RELIGIOUS_HOLIDAY">Religious Holiday</SelectItem>
                      <SelectItem value="CENTRE_MAINTENANCE">Equipment Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="h-scope">Centre Scope</Label>
                  <Select
                    value={centreScope}
                    onValueChange={(val: "ALL" | "MLCC" | "MKDC" | "MUDC") => setCentreScope(val)}
                  >
                    <SelectTrigger id="h-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Centres</SelectItem>
                      <SelectItem value="MLCC">MLCC (Lagos)</SelectItem>
                      <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
                      <SelectItem value="MUDC">MUDC (Abuja)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <Label htmlFor="h-closed">Close Centre for Visits</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="h-closed"
                      checked={closed}
                      onCheckedChange={setClosed}
                    />
                    <span className="text-xs text-muted-foreground">
                      {closed ? "Closed" : "Open with reduced slots"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="h-desc">Notes / Description</Label>
                <Input
                  id="h-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Scheduled dosimetry testing with vendor"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Blackout Date</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground">
            Official Holiday Directory ({holidays.length} Dates)
          </CardTitle>
          <CardDescription className="text-xs">
            These dates automatically display as greyed out with dashed borders on the Patient Visit Calendar (like Oct 1 Nigeria Independence Day).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[120px] font-semibold text-xs">Date</TableHead>
                <TableHead className="font-semibold text-xs">Holiday Title</TableHead>
                <TableHead className="w-[180px] font-semibold text-xs">Classification</TableHead>
                <TableHead className="w-[100px] font-semibold text-xs">Scope</TableHead>
                <TableHead className="w-[120px] font-semibold text-xs">Centre Closed</TableHead>
                <TableHead className="font-semibold text-xs">Description</TableHead>
                <TableHead className="w-[60px] text-right font-semibold text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((hol) => (
                <TableRow key={hol.id}>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {hol.date}
                  </TableCell>
                  <TableCell className="font-medium text-xs text-foreground">
                    {hol.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        hol.type === "NATIONAL_PUBLIC_HOLIDAY"
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 text-[10px]"
                          : hol.type === "RELIGIOUS_HOLIDAY"
                            ? "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20 text-[10px]"
                            : "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 text-[10px]"
                      }
                    >
                      {hol.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {hol.centreScope}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={hol.closed}
                        onCheckedChange={() => handleToggleClosed(hol.id)}
                      />
                      <span className="text-xs">
                        {hol.closed ? (
                          <span className="text-red-600 font-medium">Closed</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Open</span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground line-clamp-1">
                    {hol.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(hol.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
