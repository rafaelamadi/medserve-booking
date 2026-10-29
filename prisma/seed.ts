import { PrismaClient, ServiceCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasources: process.env.DIRECT_URL ? { db: { url: process.env.DIRECT_URL } } : undefined,
});

const ONCOLOGY_SERVICES = [
  { slug: "radiotherapy", name: "Radiotherapy", supportsSeries: true },
  { slug: "brachytherapy", name: "Brachytherapy", supportsSeries: true },
  { slug: "chemotherapy", name: "Chemotherapy", supportsSeries: true },
  { slug: "immunotherapy", name: "Immunotherapy", supportsSeries: true },
  { slug: "ct-simulation", name: "CT Simulation", supportsSeries: false },
  { slug: "cancer-care", name: "Cancer Care / Consultation", supportsSeries: false },
  { slug: "clinical-trials", name: "Clinical Trials", supportsSeries: false },
];

const DIAGNOSTIC_SERVICES = [
  { slug: "mri-scan", name: "MRI Scan", supportsSeries: false },
  { slug: "ct-scan", name: "CT Scan", supportsSeries: false },
  { slug: "ultrasound", name: "Ultrasound", supportsSeries: false },
  { slug: "digital-xray", name: "Digital X-Ray", supportsSeries: false },
  { slug: "mammography", name: "Mammography", supportsSeries: false },
  { slug: "laboratory-tests", name: "Laboratory Tests", supportsSeries: false },
  { slug: "featured-tests", name: "Featured Tests", supportsSeries: false },
  { slug: "diagnostic-consultation", name: "Diagnostic Consultation", supportsSeries: false },
];

// 2026 Nigerian public holidays — editable in hub (FR-C7). Dates approximate; confirm in Phase 7 (Q8).
const HOLIDAYS_2026: Array<{ date: string; name: string }> = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-05-01", name: "Workers' Day" },
  { date: "2026-06-12", name: "Democracy Day" },
  { date: "2026-10-01", name: "Independence Day" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-26", name: "Boxing Day" },
  // Lunar-based (reconfirm yearly):
  { date: "2026-03-20", name: "Eid al-Fitr (tentative)" },
  { date: "2026-05-27", name: "Eid al-Adha (tentative)" },
  { date: "2026-06-16", name: "Eid al-Maulud (tentative)" },
];

async function main() {
  // Services
  for (const s of ONCOLOGY_SERVICES) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { name: s.name, supportsSeries: s.supportsSeries, category: ServiceCategory.ONCOLOGY },
      create: { slug: s.slug, name: s.name, supportsSeries: s.supportsSeries, category: ServiceCategory.ONCOLOGY },
    });
  }
  for (const s of DIAGNOSTIC_SERVICES) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { name: s.name, category: ServiceCategory.DIAGNOSTIC },
      create: { slug: s.slug, name: s.name, category: ServiceCategory.DIAGNOSTIC },
    });
  }

  // Centres
  const centres = [
    { code: "MLCC", name: "MedServe LUTH Cancer Centre", city: "Lagos", state: "Lagos", phone: "+2348000000001", address: "LUTH, Idi-Araba, Lagos" },
    { code: "MKDC", name: "MedServe Kano Diagnostic Centre", city: "Kano", state: "Kano", phone: "+2348000000002" },
    { code: "MUDC", name: "MedServe Umuahia Diagnostic Centre", city: "Umuahia", state: "Abia", phone: "+2348000000003" },
  ];
  for (const c of centres) {
    await prisma.centre.upsert({ where: { code: c.code }, update: c, create: c });
  }

  const mlcc = await prisma.centre.findUniqueOrThrow({ where: { code: "MLCC" } });
  const mkdc = await prisma.centre.findUniqueOrThrow({ where: { code: "MKDC" } });
  const mudc = await prisma.centre.findUniqueOrThrow({ where: { code: "MUDC" } });

  // Centre services — Q1 default: diagnostics AUTO, oncology/consultations REVIEW
  const allServices = await prisma.service.findMany();
  const bySlug = new Map(allServices.map((s) => [s.slug, s]));

  async function enableService(centreId: string, slug: string, mode: "AUTO" | "REVIEW") {
    const service = bySlug.get(slug);
    if (!service) throw new Error(`Missing service ${slug}`);
    await prisma.centreService.upsert({
      where: { centreId_serviceId: { centreId, serviceId: service.id } },
      update: { confirmationMode: mode, isActive: true },
      create: { centreId, serviceId: service.id, confirmationMode: mode, slotMinutes: 30, capacityPerSlot: 1 },
    });
  }

  for (const s of ONCOLOGY_SERVICES) {
    const mode = s.slug.includes("consultation") || !s.supportsSeries ? "REVIEW" : "REVIEW";
    await enableService(mlcc.id, s.slug, mode);
  }
  for (const s of DIAGNOSTIC_SERVICES) {
    const mode = s.slug === "consultation" ? "REVIEW" : "AUTO";
    await enableService(mkdc.id, s.slug, mode);
    if (s.slug === "mammography") continue; // MUDC excludes mammography (PRD §4)
    await enableService(mudc.id, s.slug, mode);
  }

  // Sample availability: Mon–Fri 08:00–17:00 for every centre service (batched)
  const centreServices = await prisma.centreService.findMany({ select: { id: true } });
  const existingRules = await prisma.availabilityRule.findMany({
    select: { centreServiceId: true, dayOfWeek: true },
  });
  const existingKeys = new Set(existingRules.map((r) => `${r.centreServiceId}:${r.dayOfWeek}`));
  const toCreate: Array<{ centreServiceId: string; dayOfWeek: number; startMinute: number; endMinute: number }> = [];
  for (const cs of centreServices) {
    for (let dow = 1; dow <= 5; dow++) {
      if (!existingKeys.has(`${cs.id}:${dow}`)) {
        toCreate.push({ centreServiceId: cs.id, dayOfWeek: dow, startMinute: 8 * 60, endMinute: 17 * 60 });
      }
    }
  }
  // Small batches to stay friendly to the pooler
  for (let i = 0; i < toCreate.length; i += 50) {
    const batch = toCreate.slice(i, i + 50);
    if (batch.length) await prisma.availabilityRule.createMany({ data: batch });
  }

  // Global holidays (centreId = null → all centres)
  for (const h of HOLIDAYS_2026) {
    const date = new Date(`${h.date}T00:00:00Z`);
    const found = await prisma.holiday.findFirst({ where: { centreId: null, date } });
    if (!found) await prisma.holiday.create({ data: { centreId: null, date, name: h.name } });
  }

  // Seeded SUPER_ADMIN with hashed password
  const defaultPasswordHash = await bcrypt.hash("@Medserve2026", 10);
  await prisma.staffUser.upsert({
    where: { email: "admin@medserve.ng" },
    update: { name: "MedServe Admin", role: "SUPER_ADMIN", isActive: true, passwordHash: defaultPasswordHash },
    create: { email: "admin@medserve.ng", name: "MedServe Admin", role: "SUPER_ADMIN", passwordHash: defaultPasswordHash },
  });
  const admin = await prisma.staffUser.findUniqueOrThrow({ where: { email: "admin@medserve.ng" } });
  for (const centre of [mlcc, mkdc, mudc]) {
    await prisma.staffCentre.upsert({
      where: { staffId_centreId: { staffId: admin.id, centreId: centre.id } },
      update: {},
      create: { staffId: admin.id, centreId: centre.id },
    });
  }

  // Seed clinicians and centre staff
  const clinicians = [
    { email: "kachi@medserve.ng", name: "Dr. Kachi", role: "CLINICIAN" as const, centres: [mlcc, mkdc, mudc] },
    { email: "alabi@medserve.ng", name: "Dr. Alabi", role: "CLINICIAN" as const, centres: [mlcc] },
    { email: "bello@medserve.ng", name: "Dr. Bello", role: "CLINICIAN" as const, centres: [mkdc] },
    { email: "chukwudi@medserve.ng", name: "Dr. Chukwudi", role: "CLINICIAN" as const, centres: [mudc] },
    { email: "chioma@medserve.ng", name: "Nurse Chioma", role: "STAFF" as const, centres: [mudc] },
  ];

  for (const s of clinicians) {
    const user = await prisma.staffUser.upsert({
      where: { email: s.email },
      update: { name: s.name, role: s.role, isActive: true },
      create: { email: s.email, name: s.name, role: s.role, passwordHash: defaultPasswordHash },
    });
    for (const centre of s.centres) {
      await prisma.staffCentre.upsert({
        where: { staffId_centreId: { staffId: user.id, centreId: centre.id } },
        update: {},
        create: { staffId: user.id, centreId: centre.id },
      });
    }
  }

  // Seed sample patient for instant sign in testing
  await prisma.patient.upsert({
    where: { email: "patient@medserve.ng" },
    update: { fullName: "Ngozi Adeleke", phone: "+234 803 123 4567" },
    create: {
      email: "patient@medserve.ng",
      fullName: "Ngozi Adeleke",
      phone: "+234 803 123 4567",
    },
  });

  console.log("Seed complete: 3 centres, services, availability, holidays, admin@medserve.ng, patient@medserve.ng");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
