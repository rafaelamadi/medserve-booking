# MedServe Appointments: PRD and Implementation Plan

> **Status:** Source of truth for the build agent (Antigravity). If anything elsewhere conflicts with this file, this file wins. If something is missing, do not guess: add it to "Open Questions" (section 17) and use the stated default.
> **Version:** 1.0 (v1 scope)
> **Owner:** TM Labs (product design and engineering)
> **Client:** MedServe (https://medserve.ng)

---

## 1. Overview

MedServe operates diagnostic and cancer-care centres across Nigeria. This project delivers:

1. A **patient-facing booking experience** where a patient chooses a centre, a service, a date and a time, and the request is routed to the correct centre.
2. A **central management hub** where MedServe staff manage appointments across all centres, with each centre seeing only its own work.
3. **Recurring-care scheduling** (care series) set by the hospital, for treatments such as chemotherapy and radiotherapy.
4. **Notifications** for confirmations, reminders, changes and "result ready" notices.

The public site is moving from WordPress to code. **WordPress remains only as a headless CMS** (blog, resources, page copy). Everything in this document is built in code.

### 1.1 Goals

- Reduce phone-based booking friction and no-shows.
- Route every request to the right centre and service automatically.
- Give central management a live, cross-centre view.
- Protect patient data (NDPA compliance by design).
- Leave clean extension points for AI chat, payments, front-desk booking and EMR integration.

### 1.2 Non-goals for v1

- Payments of any kind.
- AI chat (Phase 2 of the product, designed for but not built).
- Front-desk or phone/walk-in booking by staff on a patient's behalf (patients self-book; the hub does not create standalone bookings).
- EMR, HMIS or lab-system integration (assume none exist).
- Storing or delivering result files (results are **notification only**).
- Patient-initiated changes to a care series (deferred; model must allow it later).

---

## 2. Locked Decisions

These were decided with the product owner. Do not revisit without approval.

| # | Decision |
|---|----------|
| D1 | Patients choose a date **and** time. The centre may adjust the time. The patient is told at booking if the chosen time is unavailable, or later if the centre changes it. |
| D2 | Every booking is a **request** that moves through a status workflow. Each service is either `AUTO` confirm or `REVIEW` (staff confirm). |
| D3 | Care series (recurring treatment) are **created and changed only by the hospital**. The patient follows the schedule, with no accept/decline step. Every change automatically notifies the patient. |
| D4 | Care series skip **weekends and public holidays** automatically. Holidays are managed per centre in the hub. |
| D5 | A patient-initiated change request for care series may be added in a later phase. The data model must support `initiatedBy = PATIENT` without migration pain. |
| D6 | For ordinary diagnostic bookings, patients **can cancel and can request a new time**. |
| D7 | **Results are not uploaded.** Staff press "Result ready" to send the patient a generic notification. Optional "collected" status and one automatic nudge. |
| D8 | Front-desk staff do not create bookings in v1. |
| D9 | No payments in v1. |
| D10 | No existing systems to integrate with. Design adapters so one can be added later. |
| D11 | Patients do not have passwords. They identify with **phone number + OTP**. |
| D12 | Follow-up screening reminders are in v1 (for example, an annual mammogram reminder after a completed visit). |

---

## 3. Users and Roles

### 3.1 Patient (public, no account)

Books, views, cancels and requests a new time for an ordinary appointment using a booking reference plus phone OTP. Receives notifications.

### 3.2 Staff roles (authenticated in the hub)

| Role | Scope | Capabilities |
|------|-------|--------------|
| `SUPER_ADMIN` | All centres | Everything, including centres, services, users and settings |
| `CENTRE_MANAGER` | Own centre(s) | Manage appointments, availability, holidays, care series, result notices for own centre; view centre reports |
| `CLINICIAN` | Own centre(s) | Create and change care series, mark appointments, send result notices |
| `STAFF` | Own centre(s) | View and action the appointment queue (confirm, propose new time, check in, complete, no-show, send result notice). **Cannot** create or change care series |
| `VIEWER` | Assigned scope | Read-only dashboards and reports |

Rules:

- A staff user is assigned to one or more centres. Every query in the hub is scoped by the user's centres unless the role is `SUPER_ADMIN`.
- Only `SUPER_ADMIN` and `CENTRE_MANAGER` manage availability, holidays and notification settings.
- Only `SUPER_ADMIN` manages users.

---

## 4. Centres and Services (seed data)

Centres (from medserve.ng):

| Code | Name | City / State | Focus |
|------|------|--------------|-------|
| `MLCC` | MedServe LUTH Cancer Centre | Lagos | Oncology |
| `MKDC` | MedServe Kano Diagnostic Centre | Kano | Diagnostics |
| `MUDC` | MedServe Umuahia Diagnostic Centre | Umuahia, Abia | Diagnostics |

Services per centre (as currently listed on the website; confirm with MedServe before launch):

- **MLCC:** Brachytherapy, Cancer Care, Consultation, Hormonal Therapy, Immunotherapy, Oncology, Chemotherapy, Radiotherapy.
- **MKDC:** Blood Tests, Cardiac Diagnostics, CT Scan, Diagnostics, Immunoassays, Microbiology & Parasitology, Microscopy & Morphology, Molecular / Genetic Testing, MRI, Paternity Test, Serology, Ultrasound, X-Ray, Consultation, Mammography.
- **MUDC:** same as MKDC **except Mammography is not offered**.

More centres are planned (Sokoto, Kaduna, Enugu, Delta, Uyo, Bauchi, Plateau, Oyo, Kwara, Yobe). **Adding a centre or a service must require no code change**: it is done in the hub.

Service categories: `DIAGNOSTIC`, `ONCOLOGY`. Services that normally produce recurring care are flagged `supportsSeries = true` (Chemotherapy, Radiotherapy, Brachytherapy, Immunotherapy, Hormonal Therapy).

---

## 5. Functional Requirements

Requirement IDs are stable. Reference them in commits and tests.

### 5.1 Public booking (patient)

- **FR-B1** The booking form offers: centre, then service (filtered to what the chosen centre offers), then date, then time, then patient details.
- **FR-B2** Patient details: full name, phone (required, Nigerian format validated), email (optional), optional short note, consent checkbox (required, links to privacy notice). **No clinical details are collected.**
- **FR-B3** The date picker never offers closed days: weekends (unless the centre configures weekend hours), public holidays, centre closures.
- **FR-B4** After a date is picked, show available times from the slot engine (section 7). If the patient's preferred time is full, show the nearest available slots.
- **FR-B5** The patient may submit a time that is not available as a **preferred time** only if the service is `REVIEW`. For `AUTO` services they must pick an available slot.
- **FR-B6** On submit:
  - `AUTO` service with a free slot: status `CONFIRMED` immediately.
  - Otherwise: status `REQUESTED`, and the patient is told the centre will confirm.
  - The patient sees a confirmation screen with the booking **reference** and gets a notification.
- **FR-B7** If the chosen slot was taken between selection and submit, show an inline error with fresh nearby slots (no data loss in the form).
- **FR-B8** Each booking is routed to the centre selected. It appears in that centre's queue and the central hub.
- **FR-B9** Per-service **preparation instructions** (for example fasting) are included in the confirmation notification and the confirmation screen.
- **FR-B10** Spam protection: rate limit per IP and per phone, plus a bot challenge.

### 5.2 Manage booking (patient)

- **FR-M1** Entry: booking reference + phone number, verified by OTP. No account is created.
- **FR-M2** The patient can view appointment details and status.
- **FR-M3** **Cancel:** allowed until the cancel cutoff (default 24 hours before start; configurable per centre). After that, show the centre phone number.
- **FR-M4** **Request a new time** (ordinary appointments only):
  - Patient picks a new date and time from available slots.
  - `AUTO` service: new slot is confirmed immediately.
  - `REVIEW` service: status becomes `RESCHEDULE_REQUESTED`; the original slot stays held until staff act.
  - Capped by `maxPatientReschedules` (default 2). After the cap, show the centre phone number.
- **FR-M5** Appointments that belong to a care series are **read-only** to the patient (view only, with the centre phone number).
- **FR-M6** When the centre proposes a new time, the patient sees the proposed time and the centre phone number. Per D1 the centre's adjustment is final; there is no accept step.

### 5.3 Hub: appointment operations

- **FR-H1** Dashboard (per scope): today's appointments, pending confirmations, pending reschedule requests, failed notifications, no-show rate, utilisation by service.
- **FR-H2** Appointment queue with filters: centre, service, status, date range, source, search by reference, name or phone.
- **FR-H3** Appointment actions: confirm, propose a new time (with optional reason), cancel (with reason), check in, complete, mark no-show, add an internal note.
- **FR-H4** Every status change and every time change writes an audit log entry and triggers the matching patient notification.
- **FR-H5** Reschedule queue: patient requests (from FR-M4) awaiting staff decision: approve requested time or propose another.
- **FR-H6** Patient records: list and detail (name, phone, email, appointment history). A patient is identified by **normalised phone number**. Staff may create a patient record (needed for care series).

### 5.4 Hub: configuration (`SUPER_ADMIN`, `CENTRE_MANAGER`)

- **FR-C1** Centres: CRUD (name, code, city, state, address, phone, timezone default `Africa/Lagos`, active flag, cancel cutoff, max patient reschedules).
- **FR-C2** Services: CRUD (name, category, description, preparation instructions, default duration, `supportsSeries`).
- **FR-C3** Centre services: enable a service at a centre, with confirmation mode (`AUTO` or `REVIEW`), slot length, capacity per slot, optional bound resource, result instruction text.
- **FR-C4** Resources: machines or rooms (for example Halcyon linear accelerator, MRI, CT) with centre and type. A centre service may be bound to a resource so capacity is counted against the resource.
- **FR-C5** Availability rules: weekly working hours per centre service (day of week, start, end).
- **FR-C6** Closures: date-range closures (maintenance, equipment down) per centre or per resource.
- **FR-C7** Holiday calendar: per centre (or global). Staff can add and remove dates. When a holiday is added after sessions exist, affected appointments are flagged (FR-S6).
- **FR-C8** Staff users: invite, assign role and centres, deactivate (`SUPER_ADMIN` only).

### 5.5 Hub: care series (recurring care)

- **FR-S1** `CLINICIAN`, `CENTRE_MANAGER` and `SUPER_ADMIN` create a series: patient, service (must have `supportsSeries`), start date, pattern, session time, number of sessions.
- **FR-S2** Patterns:
  - `DAILY_WORKING_DAYS` for N sessions (typical radiotherapy).
  - `EVERY_N_DAYS` or `EVERY_N_WEEKS` for N cycles (typical chemotherapy).
  - `CUSTOM_DATES` (manual list).
- **FR-S3** Generation **skips weekends and holidays** automatically. For `EVERY_N_WEEKS`, if a target date falls on a closed day, move to the next open day and show the adjustment in the preview. Staff review a **preview** before saving.
- **FR-S4** Generation checks slot and resource conflicts for every session and reports conflicts in the preview. Staff resolve them before confirming.
- **FR-S5** On creation, the patient receives **one** notification with the full schedule and a reminder before each session. No accept/decline.
- **FR-S6** Staff-only series operations: shift one session, shift all remaining sessions (preserving spacing rules and skipping closed days), add a session, mark a session no-show, cancel one session, cancel the series. When a holiday or closure affects scheduled sessions, flag them and list them in a "needs attention" panel.
- **FR-S7** Every series change **automatically** sends the patient a notification. A staff member cannot save a change without the notification being queued. A batch shift sends **one consolidated** message listing new dates.
- **FR-S8** A no-show on a series session raises an alert to the centre manager (not only a status change).
- **FR-S9** Patients cannot create or alter a series in v1. Series appointments are read-only in the patient manage page.

### 5.6 Hub: result notices

- **FR-R1** On a `COMPLETED` appointment, staff can press **Result ready**. This sends a notification and creates a `ResultNotice` record.
- **FR-R2** Notification content is **generic**: reference number, centre name and phone, and the centre's collection instruction. **No test name, no findings, no clinical content.**
- **FR-R3** Staff can mark a notice **collected**.
- **FR-R4** If a notice is not marked collected after N days (default 5, configurable), send **one** automatic nudge.
- **FR-R5** Hub view of uncollected notices per centre.

### 5.7 Follow-up screening reminders

- **FR-F1** Staff can schedule a follow-up reminder on a completed appointment (service, due date; for example 12 months for an annual screening).
- **FR-F2** When due, the patient gets a notification with a link to book that service at that centre (prefilled form).
- **FR-F3** Reminders can be cancelled or edited by staff. A reminder is sent only once.

### 5.8 Notifications

See section 9 for the full catalogue. Cross-cutting requirements:

- **FR-N1** One notification service with a provider abstraction (SMS, WhatsApp, email). Templates live in code and are versioned.
- **FR-N2** Delivery tracking per message (queued, sent, delivered, failed). Failed **change** notices fall back to the next channel (SMS, then WhatsApp, then email) and surface in the hub as "needs attention".
- **FR-N3** All sends go through a queue with retry and backoff. No notification is sent inline in a request handler.
- **FR-N4** Messages never contain clinical details.

### 5.9 Cross-cutting

- **FR-X1** Audit log for all state changes and staff actions (who, what, when, before and after).
- **FR-X2** All times are stored in UTC and displayed in `Africa/Lagos` (centre timezone).
- **FR-X3** Soft-delete patients and appointments; no hard deletes of health-related records from the UI.
- **FR-X4** The public API surface (availability, create, reschedule, cancel) is implemented as internal service functions so the future AI chat can reuse them unchanged. Appointments carry `source` (`WEB`, `STAFF`, `CHAT`).

---

## 6. State Machines

### 6.1 Appointment status

```
REQUESTED ──confirm──────────────▶ CONFIRMED
REQUESTED ──patient/staff cancel─▶ CANCELLED
CONFIRMED ──patient asks new time (REVIEW service)─▶ RESCHEDULE_REQUESTED
CONFIRMED ──staff proposes new time─▶ RESCHEDULE_PROPOSED
RESCHEDULE_REQUESTED ──staff approves─▶ CONFIRMED (new time)
RESCHEDULE_REQUESTED ──staff proposes other─▶ RESCHEDULE_PROPOSED
RESCHEDULE_PROPOSED ──applied (centre decision is final)─▶ CONFIRMED (new time)
CONFIRMED ──check in─▶ CHECKED_IN ──complete─▶ COMPLETED
CONFIRMED ──no show─▶ NO_SHOW
any non-terminal ──cancel─▶ CANCELLED
Terminal: COMPLETED, NO_SHOW, CANCELLED
```

Notes:

- `RESCHEDULE_PROPOSED` is a visible, notified state, but since the centre's decision is final (D1), the new time takes effect at proposal. Keep the status so the patient sees "changed by centre" and the history stays explicit.
- For `AUTO` services, a patient-requested new time that is available moves straight to `CONFIRMED` (no `RESCHEDULE_REQUESTED`).

### 6.2 Care series status

`ACTIVE` → `COMPLETED` (all sessions terminal) or `CANCELLED`. A series with a pending "needs attention" flag stays `ACTIVE`.

### 6.3 Result notice

`SENT` → `COLLECTED`. Optional `NUDGED` marker (timestamp) between them.

---

## 7. Slot Engine

A pure, well-tested module in `entities/availability` (see section 12). Do not scatter slot logic across components.

**Input:** `centreServiceId`, `date`.

**Algorithm:**

1. If the date is a weekend (and the centre has no weekend rule), a holiday for the centre, or inside a closure: return no slots.
2. Load the availability rules for that weekday and generate slots of `slotMinutes` between start and end.
3. Capacity per slot = `capacity` of the centre service. If the centre service is bound to a resource, count existing appointments for that **resource** (across all services using it) instead.
4. A slot is unavailable when active appointments (`REQUESTED`, `CONFIRMED`, `RESCHEDULE_REQUESTED`, `RESCHEDULE_PROPOSED`, `CHECKED_IN`) in that slot reach capacity.
5. Exclude slots in the past, and slots before a minimum lead time (default 2 hours, configurable).
6. Return available slots plus, when the preferred time is full, the nearest available alternatives (same day first, then adjacent days up to a limit).

**Concurrency:** booking creation must be transactional and re-check capacity inside the transaction (use a serialisable transaction or a row-level lock on the slot key). A race must produce the FR-B7 error, never a double booking.

**Series generation** reuses the same engine for conflict checks and the same holiday and closure data.

---

## 8. Business Rules (defaults, configurable where noted)

| Rule | Default | Configurable |
|------|---------|--------------|
| Cancel cutoff before start | 24 hours | Per centre |
| Max patient reschedules per appointment | 2 | Per centre |
| Minimum booking lead time | 2 hours | Per centre |
| Booking window (how far ahead) | 90 days | Per centre |
| Result nudge delay | 5 days | Per centre |
| Reminder times | 24 hours and 2 hours before | Global |
| OTP | 6 digits, 10 min expiry, max 5 attempts, resend cooldown 60 s | Global |
| Reference format | `MS-<CENTRECODE>-<6 chars>` (unambiguous alphabet) | No |
| Phone normalisation | E.164, Nigeria default `+234` | No |
| Timezone | `Africa/Lagos` | Per centre |

---

## 9. Notification Catalogue

Channels: SMS (primary), WhatsApp, email (if provided). No notification contains clinical content. Every message includes the reference and the centre phone number where relevant.

| Key | Trigger | Content (generic) |
|-----|---------|-------------------|
| `BOOKING_RECEIVED` | `REQUESTED` created | Request received, reference, "the centre will confirm" |
| `BOOKING_CONFIRMED` | `CONFIRMED` | Centre, date, time, preparation instructions, manage link, centre phone |
| `BOOKING_TIME_UNAVAILABLE` | Staff adjusts time at/after booking | Old time, new time, reason if given, centre phone |
| `RESCHEDULE_REQUEST_RECEIVED` | Patient requests new time (REVIEW) | Request received, original slot held |
| `RESCHEDULE_CONFIRMED` | New time applied | New date and time |
| `BOOKING_CANCELLED` | Cancelled by either side | Cancelled, how to rebook |
| `REMINDER_24H` / `REMINDER_2H` | Scheduled | Date, time, centre, prep instructions |
| `SERIES_CREATED` | Series saved | Full schedule (dates and time), centre phone |
| `SERIES_CHANGED` | Any series change | Consolidated list of old to new dates, reason if given, centre phone |
| `SERIES_SESSION_REMINDER` | Before each session | Date, time |
| `RESULT_READY` | Staff press "Result ready" | Reference, centre, collection instruction |
| `RESULT_NUDGE` | After N days uncollected | Gentle reminder |
| `FOLLOWUP_DUE` | Reminder due date | Prefilled booking link |
| `OTP` | Manage-booking login | Code only |

Delivery rules: queue, retry with backoff, record every attempt. For `BOOKING_TIME_UNAVAILABLE`, `SERIES_CHANGED` and `RESULT_READY`, a failed send falls back to the next channel and raises a hub alert if all channels fail.

---

## 10. Data Model (Prisma)

Postgres. All timestamps are UTC. Use `cuid()` ids. This is the authoritative starting schema; migrations are generated from it.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ───────── Enums ─────────

enum ServiceCategory {
  DIAGNOSTIC
  ONCOLOGY
}

enum ConfirmationMode {
  AUTO
  REVIEW
}

enum AppointmentStatus {
  REQUESTED
  CONFIRMED
  RESCHEDULE_REQUESTED
  RESCHEDULE_PROPOSED
  CHECKED_IN
  COMPLETED
  NO_SHOW
  CANCELLED
}

enum AppointmentSource {
  WEB
  STAFF
  CHAT
}

enum StaffRole {
  SUPER_ADMIN
  CENTRE_MANAGER
  CLINICIAN
  STAFF
  VIEWER
}

enum SeriesPattern {
  DAILY_WORKING_DAYS
  EVERY_N_DAYS
  EVERY_N_WEEKS
  CUSTOM_DATES
}

enum SeriesStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

enum ChangeInitiator {
  STAFF
  PATIENT
}

enum ChangeKind {
  RESCHEDULE
  CANCEL
  ADD_SESSION
  SHIFT_ALL
}

enum NotificationChannel {
  SMS
  WHATSAPP
  EMAIL
}

enum NotificationStatus {
  QUEUED
  SENT
  DELIVERED
  FAILED
}

enum ReminderStatus {
  SCHEDULED
  SENT
  CANCELLED
}

// ───────── Catalogue ─────────

model Centre {
  id                     String   @id @default(cuid())
  code                   String   @unique // MLCC, MKDC, MUDC
  name                   String
  city                   String
  state                  String
  address                String?
  phone                  String
  timezone               String   @default("Africa/Lagos")
  isActive               Boolean  @default(true)
  cancelCutoffHours      Int      @default(24)
  maxPatientReschedules  Int      @default(2)
  minLeadMinutes         Int      @default(120)
  bookingWindowDays      Int      @default(90)
  resultNudgeDays        Int      @default(5)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  centreServices CentreService[]
  resources      Resource[]
  closures       Closure[]
  holidays       Holiday[]
  appointments   Appointment[]
  staff          StaffCentre[]
}

model Service {
  id                String          @id @default(cuid())
  slug              String          @unique
  name              String
  category          ServiceCategory
  description       String?
  prepInstructions  String? // included in confirmations
  defaultDurationMin Int            @default(30)
  supportsSeries    Boolean         @default(false)
  isActive          Boolean         @default(true)

  centreServices CentreService[]
}

model Resource {
  id       String  @id @default(cuid())
  centreId String
  name     String // e.g. "Halcyon", "MRI Room 1"
  type     String // e.g. "LINAC", "MRI", "CT"
  isActive Boolean @default(true)

  centre         Centre          @relation(fields: [centreId], references: [id])
  centreServices CentreService[]
  closures       Closure[]
  appointments   Appointment[]

  @@index([centreId])
}

model CentreService {
  id               String           @id @default(cuid())
  centreId         String
  serviceId        String
  resourceId       String? // if set, capacity counts against the resource
  confirmationMode ConfirmationMode @default(REVIEW)
  slotMinutes      Int              @default(30)
  capacityPerSlot  Int              @default(1)
  resultInstruction String? // e.g. "Collect at the front desk with your reference number"
  isActive         Boolean          @default(true)

  centre       Centre             @relation(fields: [centreId], references: [id])
  service      Service            @relation(fields: [serviceId], references: [id])
  resource     Resource?          @relation(fields: [resourceId], references: [id])
  rules        AvailabilityRule[]
  appointments Appointment[]
  careSeries   CareSeries[]

  @@unique([centreId, serviceId])
}

model AvailabilityRule {
  id              String @id @default(cuid())
  centreServiceId String
  dayOfWeek       Int // 0 = Sunday ... 6 = Saturday
  startMinute     Int // minutes from midnight, centre local time
  endMinute       Int

  centreService CentreService @relation(fields: [centreServiceId], references: [id])

  @@index([centreServiceId, dayOfWeek])
}

model Closure {
  id         String   @id @default(cuid())
  centreId   String
  resourceId String? // null = whole centre
  startsOn   DateTime @db.Date
  endsOn     DateTime @db.Date
  reason     String?

  centre   Centre    @relation(fields: [centreId], references: [id])
  resource Resource? @relation(fields: [resourceId], references: [id])

  @@index([centreId, startsOn, endsOn])
}

model Holiday {
  id       String   @id @default(cuid())
  centreId String? // null = applies to all centres
  date     DateTime @db.Date
  name     String

  centre Centre? @relation(fields: [centreId], references: [id])

  @@unique([centreId, date])
  @@index([date])
}

// ───────── People ─────────

model Patient {
  id        String    @id @default(cuid())
  phone     String    @unique // E.164 normalised
  fullName  String
  email     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  appointments Appointment[]
  careSeries   CareSeries[]
  reminders    FollowUpReminder[]
}

model StaffUser {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  role      StaffRole
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())

  centres      StaffCentre[]
  careSeries   CareSeries[]
  auditEntries AuditLog[]
  changes      ScheduleChange[]
}

model StaffCentre {
  staffId  String
  centreId String

  staff  StaffUser @relation(fields: [staffId], references: [id])
  centre Centre    @relation(fields: [centreId], references: [id])

  @@id([staffId, centreId])
}

// ───────── Scheduling ─────────

model CareSeries {
  id              String        @id @default(cuid())
  patientId       String
  centreServiceId String
  createdById     String
  pattern         SeriesPattern
  intervalN       Int? // for EVERY_N_DAYS / EVERY_N_WEEKS
  totalSessions   Int
  startDate       DateTime      @db.Date
  sessionMinute   Int // time of day, minutes from midnight (centre local)
  status          SeriesStatus  @default(ACTIVE)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  patient       Patient       @relation(fields: [patientId], references: [id])
  centreService CentreService @relation(fields: [centreServiceId], references: [id])
  createdBy     StaffUser     @relation(fields: [createdById], references: [id])
  appointments  Appointment[]
  changes       ScheduleChange[]

  @@index([patientId])
}

model Appointment {
  id                String            @id @default(cuid())
  reference         String            @unique // MS-MLCC-XXXXXX
  patientId         String
  centreId          String
  centreServiceId   String
  resourceId        String? // denormalised for conflict checks
  careSeriesId      String?
  sequenceNo        Int? // position within a series
  startsAt          DateTime
  endsAt            DateTime
  requestedStartsAt DateTime // what the patient originally asked for
  status            AppointmentStatus @default(REQUESTED)
  source            AppointmentSource @default(WEB)
  patientNote       String?
  internalNote      String?
  patientReschedules Int              @default(0)
  needsAttention    Boolean           @default(false) // e.g. holiday added after scheduling
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  deletedAt         DateTime?

  patient       Patient       @relation(fields: [patientId], references: [id])
  centre        Centre        @relation(fields: [centreId], references: [id])
  centreService CentreService @relation(fields: [centreServiceId], references: [id])
  resource      Resource?     @relation(fields: [resourceId], references: [id])
  careSeries    CareSeries?   @relation(fields: [careSeriesId], references: [id])
  changes       ScheduleChange[]
  resultNotice  ResultNotice?
  notifications Notification[]
  reminders     FollowUpReminder[]

  @@index([centreId, startsAt])
  @@index([resourceId, startsAt])
  @@index([patientId])
  @@index([status])
}

model ScheduleChange {
  id            String          @id @default(cuid())
  appointmentId String?
  careSeriesId  String?
  kind          ChangeKind
  initiatedBy   ChangeInitiator // v1: only STAFF for series; PATIENT for diagnostics
  staffId       String?
  oldStartsAt   DateTime?
  newStartsAt   DateTime?
  reason        String?
  createdAt     DateTime        @default(now())

  appointment Appointment? @relation(fields: [appointmentId], references: [id])
  careSeries  CareSeries?  @relation(fields: [careSeriesId], references: [id])
  staff       StaffUser?   @relation(fields: [staffId], references: [id])

  @@index([appointmentId])
  @@index([careSeriesId])
}

// ───────── Results and follow-ups ─────────

model ResultNotice {
  id            String    @id @default(cuid())
  appointmentId String    @unique
  sentById      String
  sentAt        DateTime  @default(now())
  nudgedAt      DateTime?
  collectedAt   DateTime?

  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

model FollowUpReminder {
  id            String         @id @default(cuid())
  patientId     String
  appointmentId String? // the visit that triggered it
  centreId      String
  serviceId     String
  dueOn         DateTime       @db.Date
  status        ReminderStatus @default(SCHEDULED)
  sentAt        DateTime?
  createdById   String

  patient     Patient      @relation(fields: [patientId], references: [id])
  appointment Appointment? @relation(fields: [appointmentId], references: [id])

  @@index([dueOn, status])
}

// ───────── Messaging, auth, audit ─────────

model Notification {
  id            String              @id @default(cuid())
  appointmentId String?
  patientId     String?
  templateKey   String
  channel       NotificationChannel
  status        NotificationStatus  @default(QUEUED)
  providerRef   String?
  attempts      Int                 @default(0)
  lastError     String?
  isChange      Boolean             @default(false) // eligible for channel fallback
  createdAt     DateTime            @default(now())
  sentAt        DateTime?

  appointment Appointment? @relation(fields: [appointmentId], references: [id])

  @@index([status])
  @@index([appointmentId])
}

model OtpChallenge {
  id           String   @id @default(cuid())
  phone        String
  codeHash     String
  expiresAt    DateTime
  attempts     Int      @default(0)
  consumedAt   DateTime?
  createdAt    DateTime @default(now())

  @@index([phone, createdAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorType  String // STAFF | PATIENT | SYSTEM
  staffId    String?
  entityType String
  entityId   String
  action     String
  before     Json?
  after      Json?
  createdAt  DateTime @default(now())

  staff StaffUser? @relation(fields: [staffId], references: [id])

  @@index([entityType, entityId])
  @@index([createdAt])
}
```

---

## 11. Architecture and Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js (App Router), TypeScript (strict), Tailwind CSS |
| UI | shadcn/ui components, Phosphor Icons (consistent with other TM Labs projects) |
| CMS | WordPress as **headless CMS only** (REST API or WPGraphQL), content fetched with ISR and revalidated by webhook |
| Database | PostgreSQL |
| ORM | Prisma (schema in section 10) |
| Staff auth | Auth.js (email-based) with role and centre claims |
| Patient auth | Phone + OTP, short-lived signed session cookie scoped to one phone number |
| Validation | Zod, shared between client forms and server actions |
| Server logic | Server Actions and route handlers call **service functions** (no business logic in components or handlers) |
| Background jobs | Inngest (or equivalent): reminders, nudges, follow-up reminders, notification retries, series reminders |
| Notifications | Provider adapters behind one interface: SMS (Termii or equivalent), WhatsApp Business API, email (Resend) |
| Hosting | Vercel for the app plus a managed Postgres. **Confirm data region and NDPA implications before launch.** |
| Testing | Vitest for unit tests (slot engine, series generator, status machine), Playwright for the critical flows |

Provider choices are recommendations. Keep every provider behind an adapter so it can be swapped without touching feature code.

---

## 12. Folder Architecture: Feature-Sliced Design (FSD)

This company uses **FSD**. Follow it strictly.

### 12.1 Layers and import rule

Layers, from highest to lowest: `app` → `pages` → `widgets` → `features` → `entities` → `shared`.

**A module may only import from layers strictly below it.** No imports upward. No cross-imports between slices in the same layer (compose them in a higher layer). Each slice exposes a public API through its `index.ts`; import only from that entry point.

### 12.2 Next.js App Router integration

- The Next.js `app/` directory at the **repository root** contains **only thin route files** that re-export a page from `src/pages`. No logic lives here.
- A root-level `pages/` directory exists as an **empty folder with a README**, so Next.js does not treat `src/pages` as the Pages Router.
- FSD layers live under `src/`. The FSD **app layer** is `src/app` (providers, global styles, config); it is not Next's `app/`.

### 12.3 Structure

```
/
├── app/                          # Next.js routes (thin re-exports only)
│   ├── (public)/
│   │   ├── book/page.tsx
│   │   ├── manage/page.tsx
│   │   └── manage/[reference]/page.tsx
│   ├── (hub)/hub/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # dashboard
│   │   ├── appointments/page.tsx
│   │   ├── appointments/[id]/page.tsx
│   │   ├── reschedules/page.tsx
│   │   ├── series/page.tsx
│   │   ├── series/new/page.tsx
│   │   ├── series/[id]/page.tsx
│   │   ├── results/page.tsx
│   │   ├── patients/page.tsx
│   │   ├── patients/[id]/page.tsx
│   │   └── settings/...                  # centres, services, availability, holidays, users
│   └── api/                              # route handlers: webhooks, jobs, OTP
├── pages/                        # EMPTY (README only), prevents Pages Router
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── app/                      # FSD app layer: providers, global styles, config, middleware helpers
    ├── pages/                    # FSD pages layer: page-level composition
    │   ├── book/
    │   ├── manage-booking/
    │   ├── hub-dashboard/
    │   ├── hub-appointments/
    │   ├── hub-appointment-detail/
    │   ├── hub-reschedules/
    │   ├── hub-series-list/
    │   ├── hub-series-new/
    │   ├── hub-series-detail/
    │   ├── hub-results/
    │   ├── hub-patients/
    │   └── hub-settings/
    ├── widgets/                  # large composed blocks
    │   ├── booking-wizard/
    │   ├── appointment-queue/
    │   ├── reschedule-queue/
    │   ├── series-builder/
    │   ├── series-timeline/
    │   ├── hub-dashboard-stats/
    │   ├── results-board/
    │   └── hub-shell/             # sidebar, topbar, centre switcher
    ├── features/                 # user-facing actions
    │   ├── book-appointment/
    │   ├── verify-phone-otp/
    │   ├── cancel-appointment/
    │   ├── request-new-time/
    │   ├── confirm-appointment/
    │   ├── propose-new-time/
    │   ├── check-in-appointment/
    │   ├── mark-no-show/
    │   ├── create-care-series/
    │   ├── shift-series-sessions/
    │   ├── send-result-notice/
    │   ├── mark-result-collected/
    │   ├── schedule-follow-up-reminder/
    │   ├── manage-availability/
    │   ├── manage-holidays/
    │   ├── manage-centres-services/
    │   ├── manage-staff-users/
    │   └── staff-sign-in/
    ├── entities/                 # business entities: model, api, lib, small ui
    │   ├── centre/
    │   ├── service/
    │   ├── centre-service/
    │   ├── resource/
    │   ├── availability/          # SLOT ENGINE lives here (pure, tested)
    │   ├── holiday/
    │   ├── patient/
    │   ├── appointment/           # status machine, reference generator
    │   ├── care-series/           # series generator (pure, tested)
    │   ├── result-notice/
    │   ├── follow-up-reminder/
    │   ├── notification/          # templates, channel adapters, queue interface
    │   ├── staff-user/
    │   └── audit-log/
    └── shared/
        ├── api/                  # prisma client, cms client (WordPress), fetch helpers
        ├── config/               # env, constants, feature flags
        ├── lib/                  # date/time (UTC and Africa/Lagos), phone normalisation, ids, rate limit
        ├── ui/                   # shadcn/ui based primitives, form fields, layout atoms
        └── types/
```

### 12.4 Slice anatomy

Inside each slice use segments, only as needed: `ui/`, `model/` (types, schemas, state), `api/` (server actions and queries), `lib/` (pure helpers), and `index.ts` as the public API.

Example: `entities/availability/` contains `lib/generateSlots.ts`, `lib/isClosedDay.ts`, `model/types.ts`, `api/getAvailableSlots.ts` and `index.ts`.

### 12.5 Placement rules for this project

- **Business rules (slot engine, series generator, status transitions) live in `entities/*/lib`** as pure functions with unit tests. Features call them; components never re-implement them.
- **Server actions** live in the `api/` segment of the **feature** that owns the action (for example `features/cancel-appointment/api/cancelAppointment.ts`).
- **Every status change and notification enqueue** goes through one service function per transition so the audit log and notification are never skipped (FR-H4, FR-S7).
- **Role and centre-scope checks** are enforced server-side in `shared/lib/auth` helpers used by every hub action. Never rely on hidden UI.
- Shared UI primitives go in `shared/ui`. Entity-specific display (for example `AppointmentStatusBadge`) goes in `entities/appointment/ui`.

---

## 13. Screen Map and Flows

### 13.1 Patient side

| Screen | Route | Notes |
|--------|-------|-------|
| Booking wizard | `/book` | Steps: Centre → Service → Date and time → Your details and consent → Confirmation. Mobile-first. Query params prefill centre and service (used by follow-up reminders and the marketing site) |
| Confirmation | `/book/confirmed/[reference]` | Reference, status, prep instructions, add-to-calendar |
| Find booking | `/manage` | Reference + phone → OTP |
| Booking detail | `/manage/[reference]` | Status, details, Cancel, Request new time (hidden for series appointments, centre phone shown instead) |
| Request new time | modal/step on detail | Date and time picker from the slot engine |

**Booking flow**

1. Choose centre (cards with city and focus) →
2. Choose service (only those offered at the centre) →
3. Pick date (closed days disabled) →
4. Pick time (available slots; if full, show nearest) →
5. Enter details + consent →
6. Submit → confirmed or requested, with reference.

**Edge states to design:** slot taken during submit, service requires review (explain "the centre will confirm"), centre closed, OTP failure and lockout, no slots in window, notification could not be sent (show reference on screen anyway).

### 13.2 Hub

| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `/hub` | Stats, today list, attention panel (pending confirmations, reschedule requests, failed notices, flagged series sessions) |
| Appointment queue | `/hub/appointments` | Filters, bulk-safe actions, search |
| Appointment detail | `/hub/appointments/[id]` | Timeline (changes, notifications), actions, notes, "Result ready", "Schedule follow-up" |
| Reschedule requests | `/hub/reschedules` | Approve or propose another |
| Series list | `/hub/series` | Active series, needs-attention flags |
| New series | `/hub/series/new` | Patient picker or create → service → pattern → start date and time → **preview with skipped days and conflicts** → save |
| Series detail | `/hub/series/[id]` | Timeline of sessions, shift one, shift all remaining, add, cancel, no-show |
| Results | `/hub/results` | Result notices, uncollected list, mark collected |
| Patients | `/hub/patients`, `/hub/patients/[id]` | Search, create, history |
| Settings | `/hub/settings/*` | Centres, services, centre services, resources, availability, closures, holidays, staff users, notification settings |

**Series builder flow:** select patient (search by phone or create) → choose service (only `supportsSeries`) → choose pattern and count → pick start date and time → system generates a preview where skipped weekends and holidays are visibly marked, conflicts highlighted → resolve conflicts → confirm → patient notification queued.

**Hub UX principles:** the centre switcher is always visible; the queue is the primary surface; destructive actions (cancel series, shift all) require a confirmation dialog stating how many sessions and that the patient will be notified.

### 13.3 Design system

Reuse the TM Labs conventions (Tailwind, shadcn/ui, Phosphor Icons). Use MedServe brand colours and typography taken from medserve.ng. The tone is calm, clear and reassuring; this is a healthcare context with anxious users. Accessibility target: WCAG 2.1 AA, with large tap targets and plain language on patient screens.

---

## 14. Security, Privacy and Compliance

Appointments for cancer care are sensitive health data. Treat this system under the **Nigeria Data Protection Act (NDPA)**. Confirm obligations with MedServe's legal or data protection officer.

- Collect the minimum: no clinical details on the booking form.
- Consent captured at booking, stored with a timestamp and the notice version.
- Encrypt in transit (TLS) and at rest (managed Postgres encryption).
- Notifications never contain clinical content (FR-N4, FR-R2).
- OTP and rate limits on all public endpoints; bot challenge on the booking form.
- Role and centre scoping enforced server-side on every hub query and action.
- Audit log for staff actions and status changes; staff access to patient records is logged.
- Soft-delete only from the UI; retention and deletion policy to be defined with MedServe.
- Secrets in environment variables only; no secrets in the repo.
- Logs must not contain phone numbers, names or message bodies in plain form.
- No result files are stored (D7), which keeps v1 out of the highest-risk category.

---

## 15. Implementation Plan

Each phase has a goal, tasks, the FSD slices touched, and acceptance criteria. Build in order. Do not start a phase until the previous phase's acceptance criteria pass.

### Phase 0: Foundation

**Goal:** A running skeleton with the FSD structure, database and auth.

Tasks:

1. Initialise Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui, Phosphor.
2. Create the FSD structure from section 12 (root `app/` thin routes, empty root `pages/` with README, `src/` layers). Add lint rules enforcing the FSD import direction (for example `eslint-plugin-boundaries` or Steiger).
3. Prisma setup with the schema from section 10, migrations, and `seed.ts` (three centres, services, centre services, sample availability, 2026 Nigerian public holidays marked as editable).
4. Env validation (`shared/config`), Prisma client (`shared/api`), date/time and phone helpers (`shared/lib`).
5. Staff auth (Auth.js), role and centre claims, `requireRole` and `requireCentreAccess` helpers.
6. CI: typecheck, lint, unit tests.

Acceptance: app boots, migrations and seed run, a seeded staff user can sign in, lint fails on an upward FSD import.

### Phase 1: Catalogue and availability (hub setup)

**Goal:** Staff can configure everything the booking flow depends on.

Slices: `entities/centre|service|centre-service|resource|holiday|availability`, `features/manage-centres-services|manage-availability|manage-holidays|manage-staff-users`, `widgets/hub-shell`, `pages/hub-settings`.

Tasks:

1. Hub shell with centre switcher and role-aware navigation.
2. CRUD for centres, services, centre services (confirmation mode, slot length, capacity, resource binding, result instruction, prep instructions).
3. Availability rules, closures, holiday calendar (FR-C1 to FR-C8).
4. **Slot engine** (`entities/availability/lib`) with full unit tests: weekends, holidays, closures, capacity, resource-bound capacity, lead time, past slots.

Acceptance: a centre manager can add a service at their centre with hours and a holiday, and the slot engine returns correct slots for that configuration. Slot engine test coverage includes every rule in section 7.

### Phase 2: Patient booking

**Goal:** A patient can book and the request reaches the right centre.

Slices: `features/book-appointment`, `widgets/booking-wizard`, `pages/book`, `entities/appointment` (reference generator, status machine), `entities/patient`, `entities/notification` (first templates and adapters).

Tasks:

1. Booking wizard (FR-B1 to FR-B10), mobile-first, with query-param prefill.
2. Transactional create-appointment service with capacity re-check (section 7), patient upsert by phone, reference generation.
3. `AUTO` vs `REVIEW` handling, nearest-slot suggestions, FR-B7 race handling.
4. Notification queue and SMS adapter; `BOOKING_RECEIVED` and `BOOKING_CONFIRMED` templates.
5. Rate limiting and bot challenge.

Acceptance: concurrent booking test never double-books; an `AUTO` service confirms instantly; a `REVIEW` service lands in `REQUESTED`; the booking appears in the correct centre's data only; the confirmation notification is queued.

### Phase 3: Hub appointment operations and notifications

**Goal:** Staff run the day-to-day queue.

Slices: `widgets/appointment-queue`, `pages/hub-appointments|hub-appointment-detail|hub-dashboard`, `features/confirm-appointment|propose-new-time|check-in-appointment|mark-no-show`, `entities/audit-log`.

Tasks:

1. Appointment queue, filters, search, detail view with timeline.
2. Transition services for confirm, propose new time, cancel, check in, complete, no-show. Each writes audit log and queues the matching notification in one transaction.
3. Reminder jobs (24h and 2h).
4. Delivery tracking, retry, channel fallback for change notices, "needs attention" panel.
5. Dashboard stats.

Acceptance: every transition writes an audit entry and queues the right notification; a staff user never sees another centre's data; a failed SMS on a change notice falls back and, if all fail, shows in the attention panel.

### Phase 4: Manage booking and reschedule

**Goal:** Patients can view, cancel and request a new time.

Slices: `features/verify-phone-otp|cancel-appointment|request-new-time`, `pages/manage-booking`, `widgets/reschedule-queue`, `pages/hub-reschedules`.

Tasks:

1. OTP flow (generation, hashing, expiry, attempts, cooldown, session cookie).
2. Manage page (FR-M1 to FR-M6), cancel cutoff, reschedule cap.
3. `AUTO` immediate re-confirm and `REVIEW` reschedule request flow; reschedule queue in the hub.

Acceptance: cutoff and cap enforced server-side; series appointments are read-only to the patient; review-required reschedules hold the original slot until staff act.

### Phase 5: Care series

**Goal:** Hospital-set recurring schedules.

Slices: `entities/care-series` (generator), `features/create-care-series|shift-series-sessions`, `widgets/series-builder|series-timeline`, `pages/hub-series-*`.

Tasks:

1. Series generator (pure, unit tested): patterns, skip weekends and holidays, conflict detection, preview output with skipped-day markers.
2. Series builder UI with preview and conflict resolution.
3. Operations: shift one, shift all remaining, add, cancel session, cancel series, no-show with manager alert.
4. Consolidated `SERIES_CREATED` and `SERIES_CHANGED` notifications; per-session reminders.
5. "Needs attention" flagging when a holiday or closure is added over scheduled sessions.
6. Role gate: `STAFF` cannot create or change series.

Acceptance: a 20-session radiotherapy series over a holiday week skips weekends and the holiday; shifting all remaining sessions sends exactly one consolidated notification; no series change can be saved without a notification being queued; role gate verified.

### Phase 6: Result notices and follow-up reminders

**Goal:** Close the loop after a visit.

Slices: `features/send-result-notice|mark-result-collected|schedule-follow-up-reminder`, `entities/result-notice|follow-up-reminder`, `widgets/results-board`, `pages/hub-results`.

Tasks:

1. "Result ready" action with generic notification (FR-R1, FR-R2), collected status, uncollected view.
2. Nudge job (FR-R4).
3. Follow-up reminders with prefilled booking link (FR-F1 to FR-F3).

Acceptance: notice content contains no clinical text; nudge sends once; follow-up link opens `/book` with centre and service prefilled.

### Phase 7: Reporting, hardening and launch

**Goal:** Production readiness.

Tasks:

1. Reports (by centre, service, status, date range; CSV export), utilisation and no-show rate.
2. Security review against section 14; penetration-style checks on OTP and booking endpoints.
3. Playwright end-to-end tests for: book (auto), book (review), manage and cancel, request new time, hub confirm, series create and shift, result notice.
4. Performance and mobile pass on low-bandwidth profiles.
5. WordPress headless integration for site content (blog, resources, page copy) with revalidation webhook; redirect plan from the old WordPress URLs.
6. Content review with MedServe: service list, prep instructions, result instructions, holiday calendars, notification wording.
7. Data retention and NDPA sign-off with MedServe.

Acceptance: all e2e tests green, security checklist complete, MedServe sign-off recorded.

### Post-v1 backlog (design for, do not build)

- AI chat assistant (calls the same service functions as the booking flow; `source = CHAT`; never gives diagnoses; hands off to a human).
- Front-desk and phone/walk-in booking (`source = STAFF`).
- Patient-initiated change requests for care series (`initiatedBy = PATIENT`).
- Payments.
- Secure digital result delivery (OTP-gated viewer with expiring links) behind the existing "Result ready" step.
- EMR/HMIS/lab integration via adapters.
- WhatsApp as a booking entry point.
- Additional languages (Hausa, Igbo, Yoruba) for patient notifications.

---

## 16. Engineering Rules for the Build Agent

1. Follow FSD import direction and public-API rules (section 12). Do not import across slices in the same layer.
2. Business rules live in `entities/*/lib` as pure functions with tests. Do not duplicate them in UI or handlers.
3. Every state transition goes through a single service function that updates the record, writes the audit log and enqueues the notification in **one transaction**.
4. Enforce role and centre scope on the server for every hub action and query.
5. Never send notifications inline; always enqueue.
6. Never include clinical details in notifications, logs or analytics events.
7. Store UTC, display in the centre timezone, and normalise phone numbers to E.164.
8. Validate all input with Zod on the server, even when the client also validates.
9. Do not add dependencies, providers or features outside this document without recording the reason in the PR description.
10. Reference requirement IDs (for example `FR-S3`) in commits and tests.
11. When something is ambiguous, use the stated default, add it to section 17, and continue.

---

## 17. Open Questions (with working defaults)

| # | Question | Working default |
|---|----------|-----------------|
| Q1 | Which services are `AUTO` vs `REVIEW` per centre? | Diagnostics `AUTO`; oncology and consultations `REVIEW` |
| Q2 | Do any centres work Saturdays? | No weekend hours until configured |
| Q3 | Cancel cutoff and reschedule cap per centre? | 24 hours, 2 reschedules |
| Q4 | Result collection instruction per centre and service? | "Collect at the front desk with your reference number" |
| Q5 | Do notification channels include WhatsApp at launch? | SMS first, email if provided, WhatsApp when the provider is approved |
| Q6 | Hosting region for health data under NDPA? | To be confirmed before launch |
| Q7 | Data retention period for appointment records? | To be agreed with MedServe |
| Q8 | Are service names, prep instructions and holiday lists final? | Seed from the website; confirm in Phase 7 |
| Q9 | Returning patients: recognised by phone only? | Yes, phone is the unique key (D11) |
| Q10 | Official MedServe brand assets (logo, colours, fonts) for the app? | Take from medserve.ng until provided |
