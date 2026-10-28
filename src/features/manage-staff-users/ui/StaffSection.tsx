"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { inviteStaff, setStaffActive } from "../api/actions";

const inputCls = "h-9 w-full rounded-md border border-zinc-200 px-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  centres: Array<{ centre: { code: string } }>;
};

const ROLES = ["SUPER_ADMIN", "CENTRE_MANAGER", "CLINICIAN", "STAFF", "VIEWER"];

export function StaffSection({
  users,
  centres,
}: {
  users: StaffUser[];
  centres: Array<{ id: string; code: string }>;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("STAFF");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleCentre(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await inviteStaff({ email, name, role, centreIds: picked });
    if (!res.ok) setError(res.error);
    else {
      setEmail("");
      setName("");
      setPicked([]);
      router.refresh();
    }
  }

  async function toggleActive(u: StaffUser) {
    const res = await setStaffActive(u.id, !u.isActive);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Staff users ({users.length})</h2>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <label className={labelCls}>Email<input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className={labelCls}>Name<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label className={labelCls}>Role
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <div className={labelCls}>Centres
          <div className="mt-1 flex flex-wrap gap-2">
            {centres.map((c) => (
              <label key={c.id} className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-1 text-xs font-normal">
                <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggleCentre(c.id)} /> {c.code}
              </label>
            ))}
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <Button type="submit" size="sm">Invite</Button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2">Email</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Centres</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">{u.centres.map((c) => c.centre.code).join(", ") || "—"}</td>
                <td className="px-3 py-2">{u.isActive ? "Active" : "Inactive"}</td>
                <td className="px-3 py-2 text-right">
                  <button className="text-xs underline" onClick={() => toggleActive(u)}>
                    {u.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
