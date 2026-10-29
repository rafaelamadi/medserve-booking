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
  dailyCapacity: number;
  operatingHours: {
    weekdays: string;
    weekends: string;
  };
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
  role: "SUPER_ADMIN" | "CENTRE_MANAGER" | "CLINICIAN" | "STAFF" | "VIEWER";
  roleLabel: string;
  primaryCentre: "MLCC" | "MKDC" | "MUDC";
  status: "ACTIVE" | "PENDING" | "INVITED" | "ON_LEAVE" | "SUSPENDED";
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
    medicalDirector: "Dr. Kachi",
    leadPhysicist: "Dr. Alabi",
    status: "ACTIVE",
    dailyCapacity: 65,
    operatingHours: {
      weekdays: "07:30 AM – 06:00 PM",
      weekends: "Emergency On-Call Only",
    },
  },
  {
    id: "centre-mkdc",
    code: "MKDC",
    name: "MedServe Kano Diagnostic Centre",
    fullName: "MedServe Kano Diagnostic Centre",
    city: "Kano",
    state: "Kano State",
    address: "Audu Bako Way, Nassarawa GRA, Kano, Nigeria",
    phone: "+234 64 920 114",
    email: "kano-hub@medserve.ng",
    medicalDirector: "Dr. Bello",
    leadPhysicist: "Clinical Team Lead",
    status: "ACTIVE",
    dailyCapacity: 50,
    operatingHours: {
      weekdays: "08:00 AM – 05:00 PM",
      weekends: "Closed (On-Call imaging)",
    },
  },
  {
    id: "centre-mudc",
    code: "MUDC",
    name: "MedServe Umuahia Diagnostic Centre",
    fullName: "MedServe Umuahia Diagnostic Centre",
    city: "Umuahia",
    state: "Abia State",
    address: "MedServe Diagnostic Complex, Umuahia, Abia State, Nigeria",
    phone: "+234 800 000 0003",
    email: "umuahia-desk@medserve.ng",
    medicalDirector: "Dr. Chukwudi",
    leadPhysicist: "Nurse Chioma",
    status: "ACTIVE",
    dailyCapacity: 45,
    operatingHours: {
      weekdays: "08:00 AM – 05:30 PM",
      weekends: "Closed",
    },
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
    description: "Islamic celebration marking the end of Ramadan.",
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
];

export const STAFF_HUB_USERS_DATA: StaffHubUser[] = [
  {
    id: "usr-kachi",
    mfaCode: "MFA-7819",
    fullName: "Dr. Kachi",
    email: "kachi@medserve.ng",
    phone: "+234 803 100 2931",
    role: "CLINICIAN",
    roleLabel: "Attending Clinician & Medical Director",
    primaryCentre: "MLCC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 08:14 AM",
    licenseNumber: "MDCN-RO-7819",
  },
  {
    id: "usr-alabi",
    mfaCode: "MFA-8420",
    fullName: "Dr. Alabi",
    email: "alabi@medserve.ng",
    phone: "+234 802 441 9022",
    role: "CLINICIAN",
    roleLabel: "Consultant Clinician",
    primaryCentre: "MLCC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 08:02 AM",
    licenseNumber: "MDCN-RO-8420",
  },
  {
    id: "usr-bello",
    mfaCode: "MFA-6190",
    fullName: "Dr. Bello",
    email: "bello@medserve.ng",
    phone: "+234 809 311 4055",
    role: "CLINICIAN",
    roleLabel: "Consultant Clinician",
    primaryCentre: "MKDC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Yesterday at 04:30 PM",
    licenseNumber: "MDCN-RO-6190",
  },
  {
    id: "usr-chukwudi",
    mfaCode: "MFA-2041",
    fullName: "Dr. Chukwudi",
    email: "chukwudi@medserve.ng",
    phone: "+234 805 229 1184",
    role: "CLINICIAN",
    roleLabel: "Consultant Clinician",
    primaryCentre: "MUDC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 06:40 AM",
    licenseNumber: "MDCN-RO-2041",
  },
  {
    id: "usr-chioma",
    mfaCode: "MFA-5120",
    fullName: "Nurse Chioma",
    email: "chioma@medserve.ng",
    phone: "+234 806 910 3342",
    role: "STAFF",
    roleLabel: "Clinical & Facility Staff",
    primaryCentre: "MUDC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 07:15 AM",
    licenseNumber: "NMCN-RN-5120",
  },
  {
    id: "usr-admin",
    mfaCode: "MFA-0001",
    fullName: "MedServe Admin",
    email: "admin@medserve.ng",
    phone: "+234 800 000 0001",
    role: "SUPER_ADMIN",
    roleLabel: "System Administrator",
    primaryCentre: "MLCC",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Today at 07:00 AM",
    licenseNumber: "SYS-ADMIN-01",
  },
];
