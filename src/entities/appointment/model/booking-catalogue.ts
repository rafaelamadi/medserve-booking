export interface BookingCentre {
  id: "centre-mlcc" | "centre-mkdc" | "centre-mudc";
  code: "MLCC" | "MKDC" | "MUDC";
  name: string;
  tagline: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  focus: "Comprehensive Oncology" | "Oncology & Radiotherapy" | "Diagnostic Imaging & Oncology" | "Advanced Diagnostics" | "Comprehensive Diagnostics";
  badge: string;
  availableServices: string[];
}

export interface BookingService {
  id: string;
  name: string;
  category: "ONCOLOGY" | "DIAGNOSTIC" | "CONSULTATION";
  categoryLabel: string;
  durationMinutes: number;
  confirmationMode: "AUTO" | "REVIEW";
  description: string;
  prepInstructions: string;
  centres: ("MLCC" | "MKDC" | "MUDC")[];
}

export const BOOKING_CENTRES: BookingCentre[] = [
  {
    id: "centre-mlcc",
    code: "MLCC",
    name: "MedServe LUTH Cancer Centre",
    tagline: "Premier Cancer Care & Radiotherapy Complex",
    city: "Lagos",
    state: "Lagos State",
    address: "LUTH Complex, Idi-Araba, Surulere, Lagos",
    phone: "+234 1 888 0300",
    email: "care.mlcc@medserve.ng",
    focus: "Comprehensive Oncology",
    badge: "Comprehensive Oncology Active",
    availableServices: [
      "srv-rad",
      "srv-chemo",
      "srv-brachy",
      "srv-onco-consult",
      "srv-ct-sim",
    ],
  },
  {
    id: "centre-mkdc",
    code: "MKDC",
    name: "MedServe Kano Diagnostic Centre",
    tagline: "Comprehensive Medical Imaging & Diagnostic Centre",
    city: "Kano",
    state: "Kano State",
    address: "Audu Bako Way, Nassarawa GRA, Kano",
    phone: "+234 64 920 114",
    email: "kano.desk@medserve.ng",
    focus: "Comprehensive Diagnostics",
    badge: "Diagnostic Imaging Active",
    availableServices: [
      "srv-mri",
      "srv-mammo",
      "srv-ultrasound",
      "srv-xray",
      "srv-diag-consult",
    ],
  },
  {
    id: "centre-mudc",
    code: "MUDC",
    name: "MedServe Umuahia Diagnostic Centre",
    tagline: "Comprehensive Medical Imaging & Diagnostic Centre",
    city: "Umuahia",
    state: "Abia State",
    address: "MedServe Diagnostic Complex, Umuahia, Abia State",
    phone: "+234 800 000 0003",
    email: "umuahia.desk@medserve.ng",
    focus: "Comprehensive Diagnostics",
    badge: "Diagnostic Imaging Active",
    availableServices: [
      "srv-mri",
      "srv-ultrasound",
      "srv-xray",
      "srv-diag-consult",
    ],
  },
];

export const BOOKING_SERVICES: BookingService[] = [
  {
    id: "srv-rad",
    name: "Radiotherapy",
    category: "ONCOLOGY",
    categoryLabel: "Oncology Treatment",
    durationMinutes: 20,
    confirmationMode: "REVIEW",
    description: "High-precision external beam radiation therapy delivered via linear accelerator.",
    prepInstructions: "Drink 500ml water 30 minutes before appointment. Maintain comfortably full bladder. Wear loose clothing without metallic zips or underwires.",
    centres: ["MLCC"],
  },
  {
    id: "srv-chemo",
    name: "Chemotherapy",
    category: "ONCOLOGY",
    categoryLabel: "Oncology Treatment",
    durationMinutes: 90,
    confirmationMode: "REVIEW",
    description: "Systemic antineoplastic infusion therapy administered in supervised day-care infusion bays.",
    prepInstructions: "Hydrate well the day before. Have a light meal 1 hour prior to arrival. Bring your recent full blood count (FBC) laboratory results.",
    centres: ["MLCC"],
  },
  {
    id: "srv-brachy",
    name: "Brachytherapy",
    category: "ONCOLOGY",
    categoryLabel: "Oncology Treatment",
    durationMinutes: 45,
    confirmationMode: "REVIEW",
    description: "High-dose-rate internal radiotherapy application under specialist clinical supervision.",
    prepInstructions: "Fast for 6 hours prior to procedure. Routine pre-procedure blood and coagulation tests required.",
    centres: ["MLCC"],
  },
  {
    id: "srv-ct-sim",
    name: "CT Simulation",
    category: "ONCOLOGY",
    categoryLabel: "Oncology Planning",
    durationMinutes: 30,
    confirmationMode: "REVIEW",
    description: "Wide-bore oncology CT imaging for radiation treatment planning and target volume delineation.",
    prepInstructions: "Fast for 4 hours prior if intravenous contrast is ordered. Bring recent kidney function (Serum Creatinine/eGFR) lab test result.",
    centres: ["MLCC"],
  },
  {
    id: "srv-mri",
    name: "MRI Scan",
    category: "DIAGNOSTIC",
    categoryLabel: "Diagnostic Imaging",
    durationMinutes: 45,
    confirmationMode: "AUTO",
    description: "High-resolution magnetic resonance imaging for neuro, spine, abdominal, or musculoskeletal evaluations.",
    prepInstructions: "Inform staff if you have cardiac pacemakers, surgical clips, or metal implants. Remove all jewelry, hairpins, and metallic objects.",
    centres: ["MKDC", "MUDC"],
  },
  {
    id: "srv-mammo",
    name: "Digital Mammography",
    category: "DIAGNOSTIC",
    categoryLabel: "Diagnostic Imaging",
    durationMinutes: 25,
    confirmationMode: "AUTO",
    description: "Low-dose digital mammogram with tomosynthesis for breast cancer detection and evaluation.",
    prepInstructions: "Do not apply deodorant, antiperspirant, powder, or lotions under arms or on breasts on the day of exam.",
    centres: ["MKDC"],
  },
  {
    id: "srv-ultrasound",
    name: "High-Resolution Ultrasound",
    category: "DIAGNOSTIC",
    categoryLabel: "Diagnostic Imaging",
    durationMinutes: 20,
    confirmationMode: "AUTO",
    description: "Diagnostic abdominal, pelvic, breast, or Doppler vascular ultrasound scan.",
    prepInstructions: "For pelvic scan: drink 750ml water 1 hour prior. For abdominal scan: fast for 6 hours prior.",
    centres: ["MKDC", "MUDC"],
  },
  {
    id: "srv-xray",
    name: "Digital X-Ray",
    category: "DIAGNOSTIC",
    categoryLabel: "Diagnostic Imaging",
    durationMinutes: 15,
    confirmationMode: "AUTO",
    description: "Digital radiography for chest, skeletal, abdominal, or extremity investigations.",
    prepInstructions: "Wear comfortable clothing without metal fasteners or jewelry.",
    centres: ["MKDC", "MUDC"],
  },
  {
    id: "srv-onco-consult",
    name: "Clinical Oncology Consultation",
    category: "CONSULTATION",
    categoryLabel: "Clinical Consultation",
    durationMinutes: 30,
    confirmationMode: "REVIEW",
    description: "Comprehensive medical evaluation and treatment planning with a Consultant Radiation or Medical Oncologist.",
    prepInstructions: "Bring all previous histopathology biopsy reports, imaging scans, discharge summaries, and current medication lists.",
    centres: ["MLCC"],
  },
  {
    id: "srv-diag-consult",
    name: "Diagnostic Physician Consultation",
    category: "CONSULTATION",
    categoryLabel: "Clinical Consultation",
    durationMinutes: 20,
    confirmationMode: "AUTO",
    description: "Clinical consultation and imaging review with an attending diagnostic radiologist.",
    prepInstructions: "Bring referral doctor request form and any prior films or CD scans.",
    centres: ["MKDC", "MUDC"],
  },
];

export interface PublicBookingRecord {
  reference: string;
  centreCode: "MLCC" | "MKDC" | "MUDC";
  centreName: string;
  centreAddress: string;
  centrePhone: string;
  serviceId: string;
  serviceName: string;
  category: string;
  durationMinutes: number;
  date: string;
  timeSlot: string;
  status: "CONFIRMED" | "REQUESTED" | "CANCELLED";
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
  prepInstructions: string;
  createdAt: string;
}

// In-memory + localStorage persistence helper
export function getSavedBookings(): PublicBookingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("medserve_public_bookings");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBooking(booking: PublicBookingRecord): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSavedBookings();
    const updated = [booking, ...existing.filter((b) => b.reference !== booking.reference)];
    localStorage.setItem("medserve_public_bookings", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("medserve:appointment-sync", { detail: booking }));
  } catch (err) {
    console.error("Failed to save booking to localStorage", err);
  }
}

export function findBookingByRef(reference: string, phone?: string): PublicBookingRecord | null {
  const all = getSavedBookings();
  const found = all.find(
    (b) => b.reference.toLowerCase() === reference.trim().toLowerCase(),
  );

  if (!found) return null;
  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const cleanBookingPhone = found.patientPhone.replace(/[^0-9]/g, "");
    if (!cleanBookingPhone.endsWith(cleanPhone.slice(-7))) {
      return null;
    }
  }
  return found;
}
