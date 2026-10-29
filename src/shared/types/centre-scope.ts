export type ScopeCentre = {
  id: string;
  code: string;
  name: string;
  city: string;
};

export const ALL_CENTRES_SCOPE: ScopeCentre = {
  id: "all",
  code: "ALL",
  name: "All Medical Centres",
  city: "All Locations",
};

export const MEDSERVE_CENTRES: ScopeCentre[] = [
  { id: "centre-mlcc", code: "MLCC", name: "MedServe LUTH Cancer Centre", city: "Lagos" },
  { id: "centre-mkdc", code: "MKDC", name: "Kano Diagnostic Centre", city: "Kano" },
  { id: "centre-mudc", code: "MUDC", name: "MedServe Umuahia Diagnostic Centre", city: "Umuahia" },
];

export type CentreServiceItem = {
  id: string;
  slug: string;
  name: string;
  category: "ONCOLOGY" | "DIAGNOSTIC";
  supportsSeries: boolean;
};

export type CentreWithServices = {
  id: string;
  code: "MLCC" | "MKDC" | "MUDC";
  name: string;
  city: string;
  state: string;
  phone: string;
  services: CentreServiceItem[];
};

export const CANONICAL_CENTRES_WITH_SERVICES: CentreWithServices[] = [
  {
    id: "centre-mlcc",
    code: "MLCC",
    name: "MedServe LUTH Cancer Centre",
    city: "Lagos",
    state: "Lagos",
    phone: "+234 1 888 0300",
    services: [
      { id: "srv-rt", slug: "radiotherapy", name: "Radiotherapy", category: "ONCOLOGY", supportsSeries: true },
      { id: "srv-brachy", slug: "brachytherapy", name: "Brachytherapy", category: "ONCOLOGY", supportsSeries: true },
      { id: "srv-chemo", slug: "chemotherapy", name: "Chemotherapy", category: "ONCOLOGY", supportsSeries: true },
      { id: "srv-immuno", slug: "immunotherapy", name: "Immunotherapy", category: "ONCOLOGY", supportsSeries: true },
      { id: "srv-ctsim", slug: "ct-simulation", name: "CT Simulation", category: "ONCOLOGY", supportsSeries: false },
      { id: "srv-cancercare", slug: "cancer-care", name: "Cancer Care / Consultation", category: "ONCOLOGY", supportsSeries: false },
      { id: "srv-trials", slug: "clinical-trials", name: "Clinical Trials", category: "ONCOLOGY", supportsSeries: false },
    ],
  },
  {
    id: "centre-mkdc",
    code: "MKDC",
    name: "MedServe Kano Diagnostic Centre",
    city: "Kano",
    state: "Kano",
    phone: "+234 64 920 114",
    services: [
      { id: "srv-mri", slug: "mri-scan", name: "MRI Scan", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-ct", slug: "ct-scan", name: "CT Scan", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-us", slug: "ultrasound", name: "Ultrasound", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-xray", slug: "digital-xray", name: "Digital X-Ray", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-mammo", slug: "mammography", name: "Mammography", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-lab", slug: "laboratory-tests", name: "Laboratory Tests", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-featured", slug: "featured-tests", name: "Featured Tests", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-diagconsult", slug: "diagnostic-consultation", name: "Diagnostic Consultation", category: "DIAGNOSTIC", supportsSeries: false },
    ],
  },
  {
    id: "centre-mudc",
    code: "MUDC",
    name: "MedServe Umuahia Diagnostic Centre",
    city: "Umuahia",
    state: "Abia",
    phone: "+234 800 000 0003",
    services: [
      { id: "srv-mri", slug: "mri-scan", name: "MRI Scan", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-ct", slug: "ct-scan", name: "CT Scan", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-us", slug: "ultrasound", name: "Ultrasound", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-xray", slug: "digital-xray", name: "Digital X-Ray", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-lab", slug: "laboratory-tests", name: "Laboratory Tests", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-featured", slug: "featured-tests", name: "Featured Tests", category: "DIAGNOSTIC", supportsSeries: false },
      { id: "srv-diagconsult", slug: "diagnostic-consultation", name: "Diagnostic Consultation", category: "DIAGNOSTIC", supportsSeries: false },
    ],
  },
];

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "CENTRE_MANAGER" | "CLINICIAN" | "STAFF" | "VIEWER";
  centreCodes: ("MLCC" | "MKDC" | "MUDC")[];
};

export const CANONICAL_STAFF: StaffMember[] = [
  { id: "staff-kachi", name: "Dr. Kachi", email: "kachi@medserve.ng", role: "CLINICIAN", centreCodes: ["MLCC", "MKDC", "MUDC"] },
  { id: "staff-alabi", name: "Dr. Alabi", email: "alabi@medserve.ng", role: "CLINICIAN", centreCodes: ["MLCC"] },
  { id: "staff-bello", name: "Dr. Bello", email: "bello@medserve.ng", role: "CLINICIAN", centreCodes: ["MKDC"] },
  { id: "staff-chukwudi", name: "Dr. Chukwudi", email: "chukwudi@medserve.ng", role: "CLINICIAN", centreCodes: ["MUDC"] },
  { id: "staff-chioma", name: "Nurse Chioma", email: "chioma@medserve.ng", role: "STAFF", centreCodes: ["MUDC"] },
];
