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
  Building2,
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
import { NewAppointmentDialog } from "../../appointments/_components/new-appointment-dialog";
import type { ClinicalAppointment } from "@/data/clinical-queue-data";

import { AppointmentInspectorDialog } from "./appointment-inspector-dialog";

const views = [
  { key: "timeGridWeek", label: "Week View" },
  { key: "dayGridMonth", label: "Month View" },
  { key: "timeGridDay", label: "Day View" },
  { key: "listWeek", label: "Agenda List" },
];

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

export function Calendar() {
  const controller = useCalendarController();
  const [events, setEvents] = React.useState<CentreCalendarEvent[]>(CENTRE_CALENDAR_EVENTS);

  // Filters
  const [centreFilter, setCentreFilter] = React.useState<string>("all");
  const [roomFilter, setRoomFilter] = React.useState<RoomCategory>("ALL");

  // Selected event for inspector dialog
  const [selectedEvent, setSelectedEvent] = React.useState<CentreCalendarEvent | null>(null);
  const [inspectorOpen, setInspectorOpen] = React.useState(false);

  // Filter events
  const filteredEvents = React.useMemo(() => {
    return events.filter((ev) => {
      // Centre check
      if (centreFilter !== "all" && ev.extendedProps.centreCode !== centreFilter) {
        if (ev.extendedProps.mrn !== "HOLIDAY") return false;
      }
      // Room check
      if (roomFilter !== "ALL" && ev.extendedProps.roomCategory !== roomFilter) {
        if (ev.extendedProps.mrn !== "HOLIDAY") return false;
      }
      return true;
    });
  }, [events, centreFilter, roomFilter]);

  const [dateInfo, setDateInfo] = React.useState(() => {
    // Snap to late October 2026 where appointments are scheduled
    const targetDate = new Date(2026, 9, 27);
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

  const handleStatusChange = (eventId: string, newStatus: string) => {
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
  };

  const handleAppointmentCreated = (newApt: ClinicalAppointment) => {
    const [h, m] = (newApt.timeSlot || "09:00 AM").split(/[:\s]/);
    let hour = parseInt(h, 10);
    const isPM = (newApt.timeSlot || "").toUpperCase().includes("PM");
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    const minute = parseInt(m, 10) || 0;

    const startDate = new Date(2026, 9, 27, hour, minute);
    const endDate = new Date(2026, 9, 27, hour, minute + 30);

    const newCalendarEvent: CentreCalendarEvent = {
      id: `cal-${Date.now()}`,
      title: `${newApt.patientName} — ${newApt.serviceName}`,
      start: startDate,
      end: endDate,
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      borderColor: "#10b981",
      textColor: "#047857",
      extendedProps: {
        patientName: newApt.patientName,
        mrn: newApt.patientMrn,
        patientId: "pat-new",
        phone: newApt.patientPhone,
        service: newApt.serviceName,
        room: newApt.room || "Linac Vault 1",
        roomCategory: "LINAC_1",
        centreCode: newApt.centreCode as any,
        centreName: newApt.centreName,
        doctor: newApt.oncologist || "Dr. Kachi",
        status: "SCHEDULED",
        notes: newApt.triageNotes || "Clinical appointment booked via staff portal.",
      },
    };

    setEvents((prev) => [newCalendarEvent, ...prev]);
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
            Showing {filteredEvents.length} scheduled clinical slots across facilities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Centre Selector */}
          <Select value={centreFilter} onValueChange={setCentreFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <Building2 className="size-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Centres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Centres</SelectItem>
              <SelectItem value="MLCC">MLCC (Lagos)</SelectItem>
              <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
              <SelectItem value="MUDC">MUDC (Abuja)</SelectItem>
            </SelectContent>
          </Select>

          {/* Room / Vault Selector */}
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

          {/* Book Slot Dialog */}
          <NewAppointmentDialog onCreated={handleAppointmentCreated} />
        </div>
      </div>

      {/* Main FullCalendar Component */}
      <div className="p-1">
        <EventCalendarViews
          controller={controller}
          initialView={views[0].key}
          initialDate={new Date(2026, 9, 27)}
          plugins={[...plugins]}
          popoverCloseContent={() => (
            <XIcon className="text-muted-foreground group-hover:text-foreground size-4" />
          )}
          events={filteredEvents}
          eventClick={handleEventClick}
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
