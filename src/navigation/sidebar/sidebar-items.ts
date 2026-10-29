import {
  Calendar,
  CalendarCheck,
  Home,
  LayoutDashboard,
  type LucideIcon,
  Repeat,
  Shield,
  Users,
} from "lucide-react";

export type NavBadge = "new" | "updated" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Clinical Operations",
    items: [
      {
        id: "overview",
        title: "Clinical Overview",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        id: "appointments",
        title: "Appointments Queue",
        url: "/dashboard/appointments",
        icon: CalendarCheck,
      },
    ],
  },
  {
    id: 2,
    label: "Scheduling & Capacity",
    items: [
      {
        id: "calendar",
        title: "Centre Calendar",
        url: "/dashboard/calendar",
        icon: Calendar,
      },
      {
        id: "patients",
        title: "Patient Registry",
        url: "/dashboard/patients",
        icon: Users,
      },
    ],
  },
  {
    id: 3,
    label: "Admin",
    items: [
      {
        id: "staff-access",
        title: "Staff Accounts & Access Control",
        url: "/dashboard/settings",
        icon: Shield,
      },
    ],
  },
];

export const patientSidebarItems: NavGroup[] = [
  {
    id: 101,
    label: "My Care",
    items: [
      {
        id: "patient-home",
        title: "Home",
        url: "/dashboard/portal",
        icon: Home,
      },
      {
        id: "patient-manage",
        title: "Manage Appointments",
        url: "/dashboard/portal/appointments",
        icon: CalendarCheck,
      },
    ],
  },
];


