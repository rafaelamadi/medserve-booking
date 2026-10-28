import { redirect } from "next/navigation";
import { listStaffUsers } from "@/entities/staff-user";
import { StaffSection } from "@/features/manage-staff-users";
import { prisma } from "@/shared/api/prisma";
import { getStaffSession } from "@/shared/lib/auth";

export async function UsersPage() {
  const s = await getStaffSession();
  if (!s || s.role !== "SUPER_ADMIN") redirect("/hub");
  const [users, centres] = await Promise.all([
    listStaffUsers(),
    prisma.centre.findMany({
      where: { isActive: true },
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    }),
  ]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Staff users</h1>
        <p className="text-sm text-zinc-500">SUPER_ADMIN only. Dev sign-in needs no password.</p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <StaffSection users={users} centres={centres} />
      </div>
    </div>
  );
}
