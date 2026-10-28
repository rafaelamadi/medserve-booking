export interface CancerCentreDetail {
  id: string;
  code: "MLCC" | "MKDC" | "MUDC";
  name: string;
  fullName: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  medicalDirector: string;
  leadPhysicist: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  activeVaultsCount: number;
  dailyCapacity: number;
  operatingHours: {
    weekdays: string;
    weekends: string;
  };
  rooms: string[];
}

export interface ClinicalMachineVault {
  id: string;
  name: string;
  model: string;
  manufacturer: "Elekta" | "Varian" | "Siemens";
  centreCode: "MLCC" | "MKDC" | "MUDC";
  vaultRoom: string;
  type: "LINAC" | "CT_SIMULATOR" | "BRACHYTHERAPY";
  modalities: string[];
  status: "OPERATIONAL" | "SCHEDULED_MAINTENANCE" | "CALIBRATION_QA" | "OFFLINE";
  uptimePercentage: number;
  lastDailyQa: string;
  qaOfficer: string;
  commissionedDate: string;
  maxDailyFractions: number;
}

export interface OperatingScheduleRule {
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  firstSlot: string;
  lastSlot: string;
  slotDurationMinutes: number;
  centreCode: "MLCC" | "MKDC" | "MUDC" | "ALL";
}

export interface CentreHoliday {
  id: string;
  date: string;
  title: string;
  type: "NATIONAL_PUBLIC_HOLIDAY" | "RELIGIOUS_HOLIDAY" | "CENTRE_MAINTENANCE";
  centreScope: "ALL" | "MLCC" | "MKDC" | "MUDC";
  closed: boolean;
  description: string;
}

export interface StaffHubUser {
  id: string;
  mfaCode: string;
  fullName: string;
  email: string;
  phone: string;
  role: "CHIEF_ONCOLOGIST" | "RADIATION_ONCOLOGIST" | "MEDICAL_PHYSICIST" | "RADIATION_THERAPIST" | "ONCOLOGY_NURSE" | "CENTRE_ADMIN";
  roleLabel: string;
  primaryCentre: "MLCC" | "MKDC" | "MUDC";
  status: "ACTIVE" | "ON_LEAVE" | "SUSPENDED";
  mfaEnabled: boolean;
  lastLogin: string;
  licenseNumber: string;
}

export const CANCER_CENTRES_DATA: CancerCentreDetail[] = [
  {
    id: "centre-mlcc",
    code: "MLCC",
    name: "MedServe LUTH Cancer Centre",
    fullName: "MedServe LUTH Cancer Centre (Lagos University Teaching Hospital)",
    city: "Lagos",
    state: "Lagos State",
    address: "LUTH Complex, Idi-Araba, Surulere, Lagos, Nigeria",
    phone: "+234 1 888 0300",
    email: "luth-desk@medserve.ng",
    medicalDirector: "Dr. Kachi (Chief Clinical Oncologist)",
    leadPhysicist: "Engr. Babatunde Alabi, RSO",
    status: "ACTIVE",
    activeVaultsCount: 3,
    dailyCapacity: 65,
    operatingHours: {
      weekdays: "07:30 AM – 06:00 PM",
      weekends: "Emergency On-Call Only",
    },
    rooms: [
      "Linac Vault 1 (Elekta Versa HD)",
      "CT Simulation Suite (Siemens RT)",
      "Brachytherapy Suite (Flexitron HDR)",
      "Chemotherapy Infusion Bay",
      "Consulting Room 101",
    ],
  },
  {
    id: "centre-mkdc",
    code: "MKDC",
    name: "Kano Diagnostic & Oncology Centre",
    fullName: "MedServe Kano Diagnostic & Cancer Care Centre",
    city: "Kano",
    state: "Kano State",
    address: "Audu Bako Way, Nassarawa GRA, Kano, Nigeria",
    phone: "+234 64 920 114",
    email: "kano-hub@medserve.ng",
    medicalDirector: "Dr. Farouk (Consultant Radiation Oncologist)",
    leadPhysicist: "M. Danjuma, Medical Physicist",
    status: "ACTIVE",
    activeVaultsCount: 2,
    dailyCapacity: 45,
    operatingHours: {
      weekdays: "08:00 AM – 05:00 PM",
      weekends: "Closed (On-Call physicist)",
    },
    rooms: [
      "Linac Vault 2 (Varian TrueBeam)",
      "CT Simulator Room 1",
      "Infusion Suite B",
      "Clinical Review Room 3",
    ],
  },
  {
    id: "centre-mudc",
    code: "MUDC",
    name: "Abuja Diagnostic & Radiotherapy Centre",
    fullName: "MedServe Umuahia / Abuja Diagnostic & Radiotherapy Complex",
    city: "Abuja",
    state: "FCT Abuja",
    address: "Central Business District, FCT Abuja, Nigeria",
    phone: "+234 9 461 8800",
    email: "abuja-clinical@medserve.ng",
    medicalDirector: "Dr. Nnamdi (Consultant Clinical Oncologist)",
    leadPhysicist: "Dr. Chidi Okeke, Chief Physicist",
    status: "ACTIVE",
    activeVaultsCount: 2,
    dailyCapacity: 40,
    operatingHours: {
      weekdays: "08:00 AM – 05:30 PM",
      weekends: "Closed",
    },
    rooms: [
      "Linac Vault 1 (Varian Halcyon)",
      "Diagnostic Imaging Room A",
      "Outpatient Clinic 2",
    ],
  },
];

export const CLINICAL_MACHINES_DATA: ClinicalMachineVault[] = [
  {
    id: "mac-01",
    name: "Elekta Versa HD (Vault 1)",
    model: "Versa HD High-Definition Digital Linac",
    manufacturer: "Elekta",
    centreCode: "MLCC",
    vaultRoom: "Linac Vault 1 (Elekta Versa HD)",
    type: "LINAC",
    modalities: ["VMAT (Volumetric Modulated Arc Therapy)", "IMRT", "SRS / SBRT Stereotactic", "3D-CRT", "Agility 160-leaf MLC"],
    status: "OPERATIONAL",
    uptimePercentage: 99.4,
    lastDailyQa: "Today at 06:45 AM (Passed)",
    qaOfficer: "Engr. Babatunde Alabi",
    commissionedDate: "2022-03-15",
    maxDailyFractions: 45,
  },
  {
    id: "mac-02",
    name: "Varian TrueBeam (Vault 2)",
    model: "TrueBeam Radiotherapy Delivery System v2.7",
    manufacturer: "Varian",
    centreCode: "MKDC",
    vaultRoom: "Linac Vault 2 (Varian TrueBeam)",
    type: "LINAC",
    modalities: ["RapidArc VMAT", "IMRT", "Respiratory Gating", "6MV / 10MV FFF High Dose-Rate"],
    status: "OPERATIONAL",
    uptimePercentage: 98.8,
    lastDailyQa: "Today at 07:10 AM (Passed)",
    qaOfficer: "M. Danjuma",
    commissionedDate: "2023-08-20",
    maxDailyFractions: 40,
  },
  {
    id: "mac-03",
    name: "Varian Halcyon (Vault 1)",
    model: "Halcyon Fast-Throughput Ring Gantry Linac",
    manufacturer: "Varian",
    centreCode: "MUDC",
    vaultRoom: "Linac Vault 1 (Varian Halcyon)",
    type: "LINAC",
    modalities: ["Fast VMAT Delivery", "Dual-Layer MLC", "iCBCT Daily Imaging", "Hypofractionated Regimens"],
    status: "OPERATIONAL",
    uptimePercentage: 99.1,
    lastDailyQa: "Today at 07:25 AM (Passed)",
    qaOfficer: "Dr. Chidi Okeke",
    commissionedDate: "2024-01-10",
    maxDailyFractions: 50,
  },
  {
    id: "mac-04",
    name: "Siemens Somatom Confidence RT CT Sim",
    model: "Somatom Confidence 64-Slice Dedicated RT Simulator",
    manufacturer: "Siemens",
    centreCode: "MLCC",
    vaultRoom: "CT Simulation Suite (Siemens RT)",
    type: "CT_SIMULATOR",
    modalities: ["4D Respiratory Motion Management", "DirectDensity CT Reconstruction", "80cm Large Bore"],
    status: "OPERATIONAL",
    uptimePercentage: 99.7,
    lastDailyQa: "Today at 07:00 AM (Passed)",
    qaOfficer: "Engr. Babatunde Alabi",
    commissionedDate: "2022-04-01",
    maxDailyFractions: 18,
  },
  {
    id: "mac-05",
    name: "Elekta Flexitron HDR Afterloader",
    model: "Flexitron 192-Ir HDR Brachytherapy System",
    manufacturer: "Elekta",
    centreCode: "MLCC",
    vaultRoom: "Brachytherapy Suite (Flexitron HDR)",
    type: "BRACHYTHERAPY",
    modalities: ["Gynaecological HDR Brachytherapy", "Intracavitary / Interstitial Implants", "Real-time Source Tracking"],
    status: "OPERATIONAL",
    uptimePercentage: 99.0,
    lastDailyQa: "Yesterday at 05:00 PM (Passed)",
    qaOfficer: "Engr. Babatunde Alabi",
    commissionedDate: "2022-09-12",
    maxDailyFractions: 8,
  },
];

export const OPERATING_HOURS_RULES: OperatingScheduleRule[] = [
  {
    dayOfWeek: "Monday",
    isOpen: true,
    openTime: "07:30",
    closeTime: "18:00",
    firstSlot: "08:00",
    lastSlot: "17:30",
    slotDurationMinutes: 15,
    centreCode: "ALL",
  },
  {
    dayOfWeek: "Tuesday",
    isOpen: true,
    openTime: "07:30",
    closeTime: "18:00",
    firstSlot: "08:00",
    lastSlot: "17:30",
    slotDurationMinutes: 15,
    centreCode: "ALL",
  },
  {
    dayOfWeek: "Wednesday",
    isOpen: true,
    openTime: "07:30",
    closeTime: "18:00",
    firstSlot: "08:00",
    lastSlot: "17:30",
    slotDurationMinutes: 15,
    centreCode: "ALL",
  },
  {
    dayOfWeek: "Thursday",
    isOpen: true,
    openTime: "07:30",
    closeTime: "18:00",
    firstSlot: "08:00",
    lastSlot: "17:30",
    slotDurationMinutes: 15,
    centreCode: "ALL",
  },
  {
    dayOfWeek: "Friday",
    isOpen: true,
    openTime: "07:30",
    closeTime: "17:30",
    firstSlot: "08:00",
    lastSlot: "17:00",
    slotDurationMinutes: 15,
    centreCode: "ALL",
  },
  {
    dayOfWeek: "Saturday",
    isOpen: false,
    openTime: "09:00",
    closeTime: "14:00",
    firstSlot: "09:30",
    lastSlot: "13:30",
    slotDurationMinutes: 30,
    centreCode: "ALL",
  },
  {
    dayOfWeek: "Sunday",
    isOpen: false,
    openTime: "00:00",
    closeTime: "00:00",
    firstSlot: "00:00",
    lastSlot: "00:00",
    slotDurationMinutes: 0,
    centreCode: "ALL",
  },
];

export const NIGERIAN_HOLIDAYS_DATA: CentreHoliday[] = [
  {
    id: "hol-01",
    date: "2026-01-01",
    title: "New Year's Day",
    type: "NATIONAL_PUBLIC_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "Federal statutory public holiday. Emergency and acute oncology on-call only.",
  },
  {
    id: "hol-02",
    date: "2026-03-20",
    title: "Eid al-Fitr (Estimated)",
    type: "RELIGIOUS_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "Islamic celebration marking the end of Ramadan. Routine Linac fractions paused.",
  },
  {
    id: "hol-03",
    date: "2026-04-03",
    title: "Good Friday",
    type: "RELIGIOUS_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "Christian holiday observing the crucifixion of Jesus Christ.",
  },
  {
    id: "hol-04",
    date: "2026-04-06",
    title: "Easter Monday",
    type: "RELIGIOUS_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "Official public holiday.",
  },
  {
    id: "hol-05",
    date: "2026-05-01",
    title: "Workers' Day",
    type: "NATIONAL_PUBLIC_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "International Workers' Day statutory holiday.",
  },
  {
    id: "hol-06",
    date: "2026-05-27",
    title: "Eid al-Adha (Feast of Sacrifice)",
    type: "RELIGIOUS_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "Islamic holiday marking the climax of Hajj pilgrimage.",
  },
  {
    id: "hol-07",
    date: "2026-06-12",
    title: "Democracy Day",
    type: "NATIONAL_PUBLIC_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "Commemorating Nigeria's transition to democratic rule.",
  },
  {
    id: "hol-08",
    date: "2026-10-01",
    title: "Nigeria National Independence Day",
    type: "NATIONAL_PUBLIC_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "Nigeria Independence Day. All MedServe centres closed for scheduled visits (faded on patient calendar).",
  },
  {
    id: "hol-09",
    date: "2026-12-25",
    title: "Christmas Day",
    type: "RELIGIOUS_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "Christmas celebrations. Routine appointments advance to next available working weekday.",
  },
  {
    id: "hol-10",
    date: "2026-12-26",
    title: "Boxing Day",
    type: "NATIONAL_PUBLIC_HOLIDAY",
    centreScope: "ALL",
    closed: true,
    description: "Public holiday following Christmas.",
  },
  {
    id: "hol-11",
    date: "2026-11-14",
    title: "Linac Vault 1 Bi-Annual Dosimetry Calibration",
    type: "CENTRE_MAINTENANCE",
    centreScope: "MLCC",
    closed: false,
    description: "Elekta engineer on-site for ionization chamber and beam flatness QA. Booking cap reduced.",
  },
];

export const STAFF_HUB_USERS_DATA: StaffHubUser[] = [
  {
    id: "usr-01",
    mfaCode: "MFA-7819",
    fullName: "Dr. Kachi",
    email: "kachi@medserve.ng",
    phone: "+234 803 100 2931",
    role: "CHIEF_ONCOLOGIST",
    roleLabel: "Chief Clinical Oncologist & Medical Director",
    primaryCentre: "MLCC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 08:14 AM",
    licenseNumber: "MDCN-RO-7819",
  },
  {
    id: "usr-02",
    mfaCode: "MFA-8420",
    fullName: "Dr. Farouk",
    email: "farouk@medserve.ng",
    phone: "+234 802 441 9022",
    role: "RADIATION_ONCOLOGIST",
    roleLabel: "Consultant Radiation Oncologist",
    primaryCentre: "MKDC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 08:02 AM",
    licenseNumber: "MDCN-RO-8420",
  },
  {
    id: "usr-03",
    mfaCode: "MFA-6190",
    fullName: "Dr. Nnamdi",
    email: "nnamdi@medserve.ng",
    phone: "+234 809 311 4055",
    role: "RADIATION_ONCOLOGIST",
    roleLabel: "Consultant Clinical Oncologist",
    primaryCentre: "MUDC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Yesterday at 04:30 PM",
    licenseNumber: "MDCN-RO-6190",
  },
  {
    id: "usr-04",
    mfaCode: "MFA-2041",
    fullName: "Engr. Babatunde Alabi",
    email: "babatunde.physicist@medserve.ng",
    phone: "+234 805 229 1184",
    role: "MEDICAL_PHYSICIST",
    roleLabel: "Chief Medical Physicist & RSO",
    primaryCentre: "MLCC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 06:40 AM",
    licenseNumber: "NNRA-MP-2041",
  },
  {
    id: "usr-05",
    mfaCode: "MFA-5120",
    fullName: "Sister Grace Danjuma",
    email: "grace.nurse@medserve.ng",
    phone: "+234 806 910 3342",
    role: "ONCOLOGY_NURSE",
    roleLabel: "Head Oncology Nurse & Patient Triage",
    primaryCentre: "MLCC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 07:15 AM",
    licenseNumber: "NMCN-RN-5120",
  },
  {
    id: "usr-06",
    mfaCode: "MFA-3091",
    fullName: "Ibrahim Sani",
    email: "ibrahim.rtt@medserve.ng",
    phone: "+234 807 882 1099",
    role: "RADIATION_THERAPIST",
    roleLabel: "Lead Radiation Therapy Technologist (RTT)",
    primaryCentre: "MKDC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 07:45 AM",
    licenseNumber: "RRBN-RTT-3091",
  },
  {
    id: "usr-07",
    mfaCode: "MFA-0128",
    fullName: "Amara Nwankwo",
    email: "amara.admin@medserve.ng",
    phone: "+234 803 400 9182",
    role: "CENTRE_ADMIN",
    roleLabel: "Centre Operations Coordinator",
    primaryCentre: "MUDC",
    status: "SUSPENDED",
    mfaEnabled: false,
    lastLogin: "Yesterday at 04:10 PM",
    licenseNumber: "ADMIN-OPS-012",
  },
];
