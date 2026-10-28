import Link from "next/link";
import {
  CalendarCheck,
  ClipboardText,
  Gear,
  Repeat,
  SquaresFour,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import type { StaffRole } from "@prisma/client";
import { CentreSwitcher } from "./CentreSwitcher";
import { SignOutButton } from "./SignOutButton";

type NavItem = {
  href?: string;
  label: string;
  icon: React.ReactNode;
  phase?: string;
  roles?: StaffRole[];
};

const MAIN_NAV: NavItem[] = [
  { href: "/hub", label: "Dashboard", icon: <SquaresFour size={18} /> },
  { href: "/hub/appointments", label: "Appointments", icon: <CalendarCheck size={18} /> },
  { href: "/hub/reschedules", label: "Reschedules", icon: <CalendarCheck size={18} /> },
  { href: "/hub/series", label: "Care series", icon: <Repeat size={18} /> },
  { href: "/hub/results", label: "Results", icon: <ClipboardText size={18} /> },
  { href: "/hub/reports", label: "Reports", icon: <SquaresFour size={18} /> },
  { href: "/hub/patients", label: "Patients", icon: <Users size={18} /> },
];

const SETTINGS_NAV: NavItem[] = [
  { href: "/hub/settings", label: "Overview", icon: <Gear size={18} /> },
  { href: "/hub/settings/centres", label: "Centres", icon: <Gear size={18} /> },
  { href: "/hub/settings/services", label: "Services", icon: <Gear size={18} /> },
  { href: "/hub/settings/centre-services", label: "Centre services", icon: <Gear size={18} /> },
  { href: "/hub/settings/availability", label: "Availability", icon: <Gear size={18} /> },
  { href: "/hub/settings/holidays", label: "Holidays", icon: <Gear size={18} /> },
  {
    href: "/hub/settings/users",
    label: "Staff users",
    icon: <Users size={18} />,
    roles: ["SUPER_ADMIN"],
  },
];

function NavList({ items, role }: { items: NavItem[]; role: StaffRole }) {
  return (
    <ul className="space-y-1">
      {items
        .filter((i) => !i.roles || i.roles.includes(role))
        .map((i) => (
          <li key={i.label}>
            {i.href ? (
              <Link
                href={i.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-100"
              >
                {i.icon}
                {i.label}
              </Link>
            ) : (
              <span
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-400"
                title={`Arrives in Phase ${i.phase}`}
              >
                {i.icon}
                {i.label}
                <span className="ml-auto rounded bg-zinc-100 px-1.5 text-[10px]">{i.phase}</span>
              </span>
            )}
          </li>
        ))}
    </ul>
  );
}

export function HubShell({
  user,
  role,
  centres,
  selectedId,
  children,
}: {
  user: { name: string; email: string };
  role: StaffRole;
  centres: Array<{ id: string; code: string; name: string }>;
  selectedId: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white p-4 md:flex">
        <div className="px-1 pb-4">
          <p className="text-sm font-bold">MedServe Hub</p>
          <p className="text-xs text-zinc-500">{role}</p>
        </div>
        <nav className="space-y-4">
          <NavList items={MAIN_NAV} role={role} />
          {(role === "SUPER_ADMIN" || role === "CENTRE_MANAGER") && (
            <div>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase text-zinc-400">Settings</p>
              <NavList items={SETTINGS_NAV} role={role} />
            </div>
          )}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2">
          <span className="text-sm font-bold md:hidden">MedServe Hub</span>
          <div className="ml-auto flex items-center gap-3">
            <CentreSwitcher centres={centres} selectedId={selectedId} />
            <span className="hidden text-xs text-zinc-500 lg:inline">
              {user.name} ({user.email})
            </span>
            <SignOutButton />
          </div>
        </header>
        <main className="min-w-0 flex-1 bg-zinc-50 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
