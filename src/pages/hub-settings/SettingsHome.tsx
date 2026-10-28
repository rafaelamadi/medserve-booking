import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/shared/lib/auth";

const CARDS = [
  { href: "/hub/settings/centres", title: "Centres", desc: "Codes, contact, cutoffs and booking windows (FR-C1)." },
  { href: "/hub/settings/services", title: "Services", desc: "Global catalogue, categories and prep instructions (FR-C2)." },
  { href: "/hub/settings/centre-services", title: "Centre services", desc: "Enable services per centre: AUTO/REVIEW, slots, capacity, resources (FR-C3, FR-C4)." },
  { href: "/hub/settings/availability", title: "Availability", desc: "Weekly hours and closures feeding the slot engine (FR-C5, FR-C6)." },
  { href: "/hub/settings/holidays", title: "Holidays", desc: "Per-centre and global holiday calendar (FR-C7)." },
  { href: "/hub/settings/users", title: "Staff users", desc: "Invite, roles, centre assignment (FR-C8, SUPER_ADMIN only).", superOnly: true },
];

export async function SettingsHome() {
  const s = await getStaffSession();
  if (!s || (s.role !== "SUPER_ADMIN" && s.role !== "CENTRE_MANAGER")) redirect("/hub");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-zinc-500">Everything the booking flow depends on (Phase 1).</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {CARDS.filter((c) => !c.superOnly || s.role === "SUPER_ADMIN").map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50"
          >
            <p className="text-sm font-semibold">{c.title}</p>
            <p className="mt-1 text-xs text-zinc-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
