import { PrismaClient, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: process.env.DIRECT_URL ? { db: { url: process.env.DIRECT_URL } } : undefined,
});

async function main() {
  console.log("Seeding Supabase with clinical patients and appointments...");

  const mlcc = await prisma.centre.findUniqueOrThrow({ where: { code: "MLCC" } });
  const mkdc = await prisma.centre.findUniqueOrThrow({ where: { code: "MKDC" } });
  const mudc = await prisma.centre.findUniqueOrThrow({ where: { code: "MUDC" } });

  // Get services
  const radiotherapy = await prisma.centreService.findFirstOrThrow({
    where: { centreId: mlcc.id, service: { slug: "radiotherapy" } },
  });
  const chemotherapy = await prisma.centreService.findFirstOrThrow({
    where: { centreId: mlcc.id, service: { slug: "chemotherapy" } },
  });
  const ctScan = await prisma.centreService.findFirstOrThrow({
    where: { centreId: mkdc.id, service: { slug: "ct-scan" } },
  });

  const clinicalPatients = [
    {
      fullName: "Chidinma Nwosu",
      phone: "+234 803 234 8901",
      email: "chidinma.nwosu@example.com",
      reference: "MLCC-2610-001",
      centreId: mlcc.id,
      centreServiceId: radiotherapy.id,
      startsAt: new Date("2026-10-29T08:30:00Z"),
      endsAt: new Date("2026-10-29T08:50:00Z"),
      status: AppointmentStatus.CHECKED_IN,
      note: "Hypofractionated radiotherapy fraction 14 of 25",
    },
    {
      fullName: "Babatunde Adeleke",
      phone: "+234 802 888 1234",
      email: "babatunde.adeleke@example.com",
      reference: "MLCC-2610-002",
      centreId: mlcc.id,
      centreServiceId: chemotherapy.id,
      startsAt: new Date("2026-10-29T09:00:00Z"),
      endsAt: new Date("2026-10-29T10:30:00Z"),
      status: AppointmentStatus.CHECKED_IN,
      note: "Cycle 3 Day 1 adjuvant chemotherapy protocol",
    },
    {
      fullName: "Grace Danjuma",
      phone: "+234 809 111 2233",
      email: "grace.danjuma@example.com",
      reference: "MLCC-2610-003",
      centreId: mlcc.id,
      centreServiceId: radiotherapy.id,
      startsAt: new Date("2026-10-29T10:00:00Z"),
      endsAt: new Date("2026-10-29T10:30:00Z"),
      status: AppointmentStatus.CONFIRMED,
      note: "CT Simulation & contrast planning scan completed",
    },
    {
      fullName: "Folake Adebayo",
      phone: "+234 805 555 7890",
      email: "folake.adebayo@example.com",
      reference: "MLCC-2610-004",
      centreId: mlcc.id,
      centreServiceId: radiotherapy.id,
      startsAt: new Date("2026-10-29T11:00:00Z"),
      endsAt: new Date("2026-10-29T11:20:00Z"),
      status: AppointmentStatus.REQUESTED,
      note: "Fraction 8 of 20 breast radiotherapy",
    },
    {
      fullName: "Olumide Bakare",
      phone: "+234 818 444 9900",
      email: "olumide.bakare@example.com",
      reference: "MLCC-2610-005",
      centreId: mlcc.id,
      centreServiceId: radiotherapy.id,
      startsAt: new Date("2026-10-29T12:30:00Z"),
      endsAt: new Date("2026-10-29T12:50:00Z"),
      status: AppointmentStatus.REQUESTED,
      note: "Fraction 19 of 30 prostate radiotherapy",
    },
    {
      fullName: "Dr. Kemi Williams",
      phone: "+234 807 333 4455",
      email: "kemi.williams@example.com",
      reference: "MLCC-2610-006",
      centreId: mlcc.id,
      centreServiceId: radiotherapy.id,
      startsAt: new Date("2026-10-30T08:30:00Z"),
      endsAt: new Date("2026-10-30T08:50:00Z"),
      status: AppointmentStatus.REQUESTED,
      note: "Follow-up clinical oncology check",
    },
    {
      fullName: "Emeka Okafor",
      phone: "+234 806 777 8899",
      email: "emeka.okafor@example.com",
      reference: "MLCC-2610-007",
      centreId: mlcc.id,
      centreServiceId: radiotherapy.id,
      startsAt: new Date("2026-10-30T09:00:00Z"),
      endsAt: new Date("2026-10-29T09:20:00Z"),
      status: AppointmentStatus.REQUESTED,
      note: "Scheduled for tomorrow",
    },
    {
      fullName: "Ibrahim Musa",
      phone: "+234 802 333 1122",
      email: "ibrahim.musa@example.com",
      reference: "MKDC-2610-001",
      centreId: mkdc.id,
      centreServiceId: ctScan.id,
      startsAt: new Date("2026-10-29T10:15:00Z"),
      endsAt: new Date("2026-10-29T10:45:00Z"),
      status: AppointmentStatus.REQUESTED,
      note: "Diagnostic CT Scan (Abdomen/Pelvis)",
    },
  ];

  for (const item of clinicalPatients) {
    const patient = await prisma.patient.upsert({
      where: { phone: item.phone },
      update: { fullName: item.fullName, email: item.email },
      create: { fullName: item.fullName, phone: item.phone, email: item.email },
    });

    await prisma.appointment.upsert({
      where: { reference: item.reference },
      update: {
        patientId: patient.id,
        centreId: item.centreId,
        centreServiceId: item.centreServiceId,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        requestedStartsAt: item.startsAt,
        status: item.status,
        patientNote: item.note,
      },
      create: {
        reference: item.reference,
        patientId: patient.id,
        centreId: item.centreId,
        centreServiceId: item.centreServiceId,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        requestedStartsAt: item.startsAt,
        status: item.status,
        patientNote: item.note,
      },
    });
  }

  console.log("Successfully seeded Supabase appointments!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
