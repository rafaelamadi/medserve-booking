"use client";

import * as React from "react";
import { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Stethoscope,
  XIcon,
} from "lucide-react";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CENTRE_CALENDAR_EVENTS,
  CLINICAL_ROOM_CATEGORIES,
  type CentreCalendarEvent,
  type RoomCategory,
} from "@/data/centre-calendar-data";
import {
  getLiveAppointmentsByCentre,
  updateAppointmentStatusServer,
  type ClinicalAppointmentRow,
} from "@/server/appointments";

import { AppointmentInspectorDialog } from "./appointment-inspector-dialog";
import { useCentreScope } from "@/shared/context/centre-scope-context";

function mapRowToCalendarEvent(row: ClinicalAppointmentRow): CentreCalendarEvent {
  const startDate = new Date(row.scheduledTime);
  // Standard clinical intake slot window (30 minutes)
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  let roomCategory: RoomCategory = "ONCOLOGY";
  const mod = (row.modality || "").toUpperCase();
  const serv = (row.serviceName || "").toLowerCase();
  if (serv.includes("consult") || serv.includes("cancer care")) {
    roomCategory = "CONSULTING";
  } else if (mod.includes("DIAGNOSTIC") || serv.includes("mri") || serv.includes("ct") || serv.includes("ultrasound")) {
    roomCategory = "DIAGNOSTIC";
  } else {
    roomCategory = "ONCOLOGY";
  }

  return {
    id: row.id,
    title: `${row.patientName} — ${row.serviceName}`,
    start: startDate,
    end: endDate,
    extendedProps: {
      patientName: row.patientName,
      mrn: row.patientMrn,
      patientId: row.id,
      phone: row.patientPhone,
      service: row.serviceName,
      room: row.room || (roomCategory === "ONCOLOGY" ? "Linear Accelerator Suite 1" : "Diagnostics Room 2"),
      roomCategory,
      centreCode: row.centreCode as "MLCC" | "MKDC" | "MUDC",
      centreName: row.centreName,
      doctor: row.oncologist || "Dr. Kachi",
      status: (row.status as any) || "SCHEDULED",
      notes: row.triageNotes || row.protocol || "Clinical appointment recorded in Supabase.",
    },
  };
}

const views = [
  { key: "timeGridWeek", label: "Week View" },
  { key: "dayGridMonth", label: "Month View" },
  { key: "timeGridDay", label: "Day View" },
  { key: "listWeek", label: "Agenda List" },
];

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

export function Calendar() {
  const controller = useCalendarController();
  const { selectedCentre } = useCentreScope();
  const [events, setEvents] = React.useState<CentreCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const isAll = !selectedCentre || selectedCentre.id === "all" || selectedCentre.code === "ALL";
  const activeCentreCode = !isAll && selectedCentre?.code ? selectedCentre.code : "all";

  // Category filter
  const [roomFilter, setRoomFilter] = React.useState<RoomCategory>("ALL");

  // Selected event for inspector dialog
  const [selectedEvent, setSelectedEvent] = React.useState<CentreCalendarEvent | null>(null);
  const [inspectorOpen, setInspectorOpen] = React.useState(false);

  // Fetch live appointments from Supabase
  const refreshCalendar = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const live = await getLiveAppointmentsByCentre(isAll ? undefined : selectedCentre?.code);
      const liveEvents = live.map(mapRowToCalendarEvent);
      const holidayEvents = CENTRE_CALENDAR_EVENTS.filter((e) => e.extendedProps.mrn === "HOLIDAY");
      setEvents([...liveEvents, ...holidayEvents]);
    } catch (err) {
      console.error("Failed to load live appointments for calendar from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAll, selectedCentre?.code]);

  React.useEffect(() => {
    refreshCalendar();
  }, [refreshCalendar]);

  // Real-time synchronization
  React.useEffect(() => {
    const handleSync = () => {
      refreshCalendar();
    };

    window.addEventListener("medserve:appointment-sync", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("medserve:appointment-sync", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [refreshCalendar]);

  // Filter events
  const filteredEvents = React.useMemo(() => {
    return events.filter((ev) => {
      // Centre check
      if (activeCentreCode !== "all" && ev.extendedProps.centreCode !== activeCentreCode) {
        if (ev.extendedProps.mrn !== "HOLIDAY") return false;
      }
      // Room check
      if (roomFilter !== "ALL" && ev.extendedProps.roomCategory !== roomFilter) {
        if (ev.extendedProps.mrn !== "HOLIDAY") return false;
      }
      return true;
    });
  }, [events, activeCentreCode, roomFilter]);

  const [dateInfo, setDateInfo] = React.useState(() => {
    // Snap to late October 2026 where appointments are scheduled
    const targetDate = new Date(2026, 9, 29);
    return {
      title: format(targetDate, "MMMM yyyy"),
      days: differenceInCalendarDays(endOfMonth(targetDate), startOfMonth(targetDate)) + 1,
    };
  });

  const handleEventClick = (clickInfo: any) => {
    const eventId = clickInfo.event.id;
    const found = events.find((e) => e.id === eventId);
    if (found) {
      setSelectedEvent(found);
      setInspectorOpen(true);
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              extendedProps: {
                ...e.extendedProps,
                status: newStatus as any,
              },
            }
          : e,
      ),
    );

    try {
      await updateAppointmentStatusServer(eventId, newStatus as any);
      window.dispatchEvent(new Event("medserve:appointment-sync"));
    } catch (err) {
      console.error("Failed to update status in Supabase:", err);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-xs">
      {/* Calendar Header Controls */}
      <div className="bg-muted/40 flex flex-col gap-3.5 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 shrink-0 flex-col gap-1">
          <div className="text-xl font-bold tracking-tight text-foreground">
            {dateInfo.title}
          </div>
          <p className="text-muted-foreground text-xs">
            Showing {filteredEvents.length} scheduled clinical slots {isAll ? "across facilities" : `at ${selectedCentre?.name || "selected centre"}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Appointment Category Filter */}
          <Select value={roomFilter} onValueChange={(val: RoomCategory) => setRoomFilter(val)}>
            <SelectTrigger className="w-[200px] h-9 text-xs">
              <Stethoscope className="size-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLINICAL_ROOM_CATEGORIES.map((cat) => (
                <SelectItem key={cat.key} value={cat.key}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Navigation Controls */}
          <ButtonGroup>
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => controller.prev()}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" className="h-9 text-xs px-3" onClick={() => controller.today()}>
              Today
            </Button>
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => controller.next()}>
              <ChevronRight className="size-4" />
            </Button>
          </ButtonGroup>

          {/* View Selector */}
          <Select
            value={controller.view?.type ?? views[0].key}
            onValueChange={(value) => {
              controller.changeView(value);
            }}
          >
            <SelectTrigger className="w-[125px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {views.map((v) => (
                  <SelectItem key={v.key} value={v.key}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main FullCalendar Component */}
      <div className="p-1">
        <EventCalendarViews
          controller={controller}
          initialView={views[0].key}
          initialDate={new Date(2026, 9, 29)}
          plugins={[...plugins]}
          popoverCloseContent={() => (
            <XIcon className="text-muted-foreground group-hover:text-foreground size-4" />
          )}
          events={filteredEvents}
          eventClick={handleEventClick}
          displayEventEnd={false}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          slotMinTime="07:00:00"
          slotMaxTime="18:30:00"
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "07:30",
            endTime: "18:00",
          }}
          nowIndicator
          datesSet={(info) => {
            setDateInfo({
              title: info.view.title,
              days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
            });
          }}
        />
      </div>

      {/* Appointment Details Inspector Modal */}
      <AppointmentInspectorDialog
        event={selectedEvent}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
